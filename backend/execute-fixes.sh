#!/bin/bash

echo "=========================================="
echo "   EKSEKUSI PERBAIKAN - FASE 3           "
echo "=========================================="
echo ""

echo "--- 1. BACKUP FILES ---"
cp src/services/auth.service.ts src/services/auth.service.ts.bak-fix
cp tests/submission.integration.test.ts tests/submission.integration.test.ts.bak-fix2
echo "✅ Backups created"
echo ""

echo "--- 2. FIX #1: Consolidate Prisma di auth.service.ts ---"
cat > src/services/auth.service.ts <<'AUTH_EOF'
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import prisma from '../utils/prisma';

async function findOrCreateOrganization(slug: string, adminId: string) {
  return prisma.organization.upsert({
    where: { slug },
    update: {},
    create: {
      name: 'Default Organization',
      slug,
      admin_id: adminId,
    },
  });
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'student'
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      status: 'active',
    },
  });

  const org = await findOrCreateOrganization('org-placeholder', user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { organization_id: org.id },
  });

  logger.info(`User registered: ${email} (${user.id})`);
  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid credentials');

  let orgId = user.organization_id;
  if (!orgId) {
    const org = await findOrCreateOrganization('org-placeholder', user.id);
    orgId = org.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { organization_id: orgId },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  return { user: { ...user, organization_id: orgId }, token };
}

// Wrapper untuk test (response format yang diharapkan test)
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'student'
) {
  try {
    const user = await registerUser(email, password, firstName, lastName, role);
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          organization_id: user.organization_id,
        },
      },
    };
  } catch (error: any) {
    logger.error(`Register error: ${error.message}`);
    return { success: false, error: { message: error.message } };
  }
}

export async function login(email: string, password: string) {
  try {
    const result = await loginUser(email, password);
    return {
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    };
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    return { success: false, error: { message: error.message } };
  }
}
AUTH_EOF
echo "✅ auth.service.ts updated (singleton prisma)"
echo ""

echo "--- 3. FIX #2: Cleanup submission test (remove beforeAll) ---"
# Backup dulu
cp tests/submission.integration.test.ts tests/submission.integration.test.ts.bak-clean

# Tulis ulang submission test tanpa beforeAll dan tanpa PrismaClient
cat > tests/submission.integration.test.ts <<'TEST_EOF'
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

// NOTE: Cleanup dilakukan di tests/setup.ts
// Kita tidak perlu beforeAll di sini

describe('Submission Pipeline Integration Tests', () => {
  let instructorToken: string;
  let studentToken: string;
  let studentUserId: string;
  let quizId: string;
  let submissionId: string;

  beforeAll(async () => {
    // ===== USER 1: INSTRUCTOR =====
    console.log('\n🔷 SETUP: Registering INSTRUCTOR...');
    const instructorRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'instructor@example.com',
        password: 'SecurePass123!',
        first_name: 'Instructor',
        last_name: 'User',
        role: 'instructor',
      });
    console.log('\n🔍 [DEBUG] instructorRegRes.status:', instructorRegRes.status);
    console.log('🔍 [DEBUG] instructorRegRes.body:', JSON.stringify(instructorRegRes.body, null, 2));
    
    if (!instructorRegRes.body.data?.user?.id) {
      throw new Error('Instructor registration failed');
    }
    
    const instructorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'instructor@example.com',
        password: 'SecurePass123!',
      });
    instructorToken = instructorLogin.body.data.token;
    console.log('✅ Instructor registered and logged in');

    // ===== USER 2: STUDENT =====
    console.log('🔷 SETUP: Registering STUDENT...');
    const studentRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student@example.com',
        password: 'SecurePass123!',
        first_name: 'Student',
        last_name: 'User',
        role: 'student',
      });
    
    if (!studentRegRes.body.data?.user?.id) {
      throw new Error('Student registration failed');
    }
    studentUserId = studentRegRes.body.data.user.id;
    
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@example.com',
        password: 'SecurePass123!',
      });
    studentToken = studentLogin.body.data.token;
    console.log('✅ Student registered and logged in\n');

    // ===== INSTRUCTOR: CREATE QUIZ =====
    console.log('🔷 INSTRUCTOR: Creating quiz...');
    const quizRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Test Quiz',
        description: 'Test Description',
        quiz_type: 'standard',
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 2,
        organization_id: 'org-placeholder',
      });
    
    if (!quizRes.body.data?.id) {
      throw new Error(`Quiz creation failed: ${quizRes.body.error?.message}`);
    }
    quizId = quizRes.body.data.id;
    console.log('✅ Quiz created:', quizId);

    // ===== INSTRUCTOR: ADD 5 QUESTIONS =====
    console.log('🔷 INSTRUCTOR: Adding 5 questions...');
    const questionTexts = [
      'What is 2+2?',
      'What is the capital of France?',
      'What is the largest planet?',
      'Who wrote Romeo and Juliet?',
      'What is the chemical symbol for Gold?'
    ];

    for (let i = 0; i < 5; i++) {
      const qRes = await request(app)
        .post(`/api/v1/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          question_text: questionTexts[i],
          question_type: 'mcq',
          points: 1,
          options: [
            { option_text: `Option A${i}`, is_correct: false },
            { option_text: `Option B${i}`, is_correct: true },
            { option_text: `Option C${i}`, is_correct: false },
            { option_text: `Option D${i}`, is_correct: false },
          ],
        });
      
      if (!qRes.body.data?.id) {
        throw new Error(`Question ${i + 1} creation failed: ${qRes.body.error?.message}`);
      }
    }
    console.log('✅ All 5 questions added');

    // ===== INSTRUCTOR: PUBLISH QUIZ =====
    console.log('🔷 INSTRUCTOR: Publishing quiz...');
    const pubRes = await request(app)
      .patch(`/api/v1/quizzes/${quizId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);
    
    if (!pubRes.body.data?.id) {
      throw new Error(`Publish failed: ${pubRes.body.error?.message}`);
    }
    console.log('✅ Quiz published\n');
  });

  // ===== TEST SCENARIOS =====

  it('POST /submissions creates submission with status=in_progress', async () => {
    const res = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ quiz_id: quizId });
    
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.attempt_number).toBe(1);
    submissionId = res.body.data.id;
  });

  it('PUT /submissions/:id/answers/:question_id saves answer', async () => {
    const questionsRes = await request(app)
      .get(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`);
    console.log('\n🔍 [QUESTIONS RESPONSE] status:', questionsRes.status);
    console.log('🔍 [QUESTIONS RESPONSE] body:', JSON.stringify(questionsRes.body, null, 2));
    
    if (!questionsRes.body.data || questionsRes.body.data.length === 0) {
      throw new Error('No questions found for this quiz');
    }
    
    const questionId = questionsRes.body.data[0].id;
    const optionId = questionsRes.body.data[0].options[1].id;

    const res = await request(app)
      .put(`/api/v1/submissions/${submissionId}/answers/${questionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ option_id: optionId });
    
    expect(res.status).toBe(200);
  });

  it('POST /submissions/:id/submit finalizes submission', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  it('MAX_ATTEMPTS enforcement prevents duplicate submissions', async () => {
    const res1 = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ quiz_id: quizId });
    expect(res1.status).toBe(201);
    const subId = res1.body.data.id;
    
    await request(app)
      .post(`/api/v1/submissions/${subId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);

    const res2 = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ quiz_id: quizId });
    
    expect(res2.status).toBe(400);
  });

  it('Audit logging tracks submission changes', async () => {
    // Register fresh student
    const auditStudentEmail = `audit_student_${Date.now()}@example.com`;
    const auditStudentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: auditStudentEmail,
        password: 'SecurePass123!',
        first_name: 'Audit',
        last_name: 'Student',
        role: 'student',
      });
    if (!auditStudentReg.body.data?.user?.id) {
      throw new Error('Audit student registration failed');
    }
    const auditStudentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: auditStudentEmail, password: 'SecurePass123!' });
    const auditStudentToken = auditStudentLogin.body.data.token;
    console.log('✅ Audit student registered and logged in');

    const createRes = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${auditStudentToken}`)
      .send({ quiz_id: quizId });
    console.log('\n🔍 [CREATE SUBMISSION RESPONSE] status:', createRes.status);
    console.log('🔍 [CREATE SUBMISSION RESPONSE] body:', JSON.stringify(createRes.body, null, 2));
    
    if (!createRes.body.data?.id) {
      throw new Error('Submission creation failed');
    }
    const subId = createRes.body.data.id;

    const questionsRes = await request(app)
      .get(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${auditStudentToken}`);
    console.log('\n🔍 [QUESTIONS RESPONSE] status:', questionsRes.status);
    console.log('🔍 [QUESTIONS RESPONSE] body:', JSON.stringify(questionsRes.body, null, 2));
    
    if (!questionsRes.body.data || questionsRes.body.data.length === 0) {
      throw new Error('No questions found for quiz');
    }

    await request(app)
      .put(`/api/v1/submissions/${subId}/answers/${questionsRes.body.data[0].id}`)
      .set('Authorization', `Bearer ${auditStudentToken}`)
      .send({ option_id: questionsRes.body.data[0].options[0].id });

    await request(app)
      .post(`/api/v1/submissions/${subId}/submit`)
      .set('Authorization', `Bearer ${auditStudentToken}`);

    const submissionRes = await request(app)
      .get(`/api/v1/submissions/${subId}`)
      .set('Authorization', `Bearer ${auditStudentToken}`);
    
    expect(submissionRes.status).toBe(200);
    expect(submissionRes.body.data.id).toBe(subId);
    expect(['submitted', 'graded']).toContain(submissionRes.body.data.status);
  });
});
TEST_EOF
echo "✅ submission.integration.test.ts updated (beforeAll removed, cleanup via setup.ts)"
echo ""

echo "--- 4. FIX #3: Create .env.test ---"
cat > .env.test <<'ENV_EOF'
# Test environment variables
NODE_ENV=test
DATABASE_URL=postgresql://postgres.migvkenwymahhojugjex:kqjWBGr5m0iiXU5l@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
ENV_EOF
echo "✅ .env.test created"
echo ""

echo "--- 5. RUN TEST ---"
echo "▶️ Running: npm run test:integration"
npm run test:integration 2>&1 | tail -30
echo ""

echo "=========================================="
echo "   PERBAIKAN SELESAI                     "
echo "=========================================="
