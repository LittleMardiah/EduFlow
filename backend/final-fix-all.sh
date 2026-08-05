#!/bin/bash

##############################################################################
# FINAL FIX - OPTIONS FORMAT + DUAL USER ROLES
#
# FIX #1: Transform options format di createQuestionHandler
#         From: options: [{...}, {...}]
#         To:   options: { create: [{order_in_question: 0, ...}, ...] }
#
# FIX #2: Separate users in test
#         User 1 (instructor): Create quiz + add questions + publish
#         User 2 (student): Create submission + save answers + submit
##############################################################################

echo "=========================================="
echo "   FINAL FIX - OPTIONS + DUAL USERS      "
echo "=========================================="
echo ""

# ============================================================================
# PART 1: BACKUP
# ============================================================================

echo "--- PART 1: BACKUP FILES ---"
cp src/controllers/question.controller.ts src/controllers/question.controller.ts.bak-final
cp tests/integration/submission.integration.test.ts tests/integration/submission.integration.test.ts.bak-final
echo "✅ Backup created:"
echo "   - src/controllers/question.controller.ts.bak-final"
echo "   - tests/integration/submission.integration.test.ts.bak-final"
echo ""

# ============================================================================
# PART 2: FIX #1 - TRANSFORM OPTIONS IN createQuestionHandler
# ============================================================================

echo "--- PART 2: FIX #1 - TRANSFORM OPTIONS FORMAT ---"
echo ""

cat > /tmp/patch-question-controller.ts << 'PATCHEOF'
import { Request, Response } from 'express';
import * as questionService from '../services/question.service';
import logger from '../utils/logger';

export async function createQuestionHandler(req: Request, res: Response) {
  try {
    // Ambil quiz_id dari body (sudah di-set oleh middleware di quiz.routes.ts)
    // Atau dari params jika route nested
    const quizId = req.body.quiz_id || req.params.quizId;
    
    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: { message: 'quiz_id is required' },
      });
    }
    // Set ke body agar service bisa baca
    req.body.quiz_id = quizId;
    
    logger.debug(`Creating question for quiz: ${quizId}`);
    
    const userId = req.user!.userId;
    
    // FIX: Transform options format untuk Prisma nested create
    // From: options: [{ option_text, is_correct }, ...]
    // To:   options: { create: [{ option_text, is_correct, order_in_question }, ...] }
    const dataWithTransformedOptions = {
      ...req.body,
      options: req.body.options ? {
        create: (req.body.options as any[]).map((opt, index) => ({
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          order_in_question: index,
        }))
      } : undefined
    };
    
    const question = await questionService.createQuestion(dataWithTransformedOptions, userId);
    
    res.status(201).json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Create question error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getQuestionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestion(id);
    if (!question) {
      return res.status(404).json({ success: false, error: { message: 'Question not found' } });
    }
    res.json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Get question error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}
PATCHEOF

# Extract everything before and after createQuestionHandler
START_LINE=$(grep -n "export async function createQuestionHandler" src/controllers/question.controller.ts | head -1 | cut -d: -f1)
NEXT_EXPORT=$(tail -n +$((START_LINE + 1)) src/controllers/question.controller.ts | grep -n "^export" | head -1 | cut -d: -f1)
END_LINE=$((START_LINE + NEXT_EXPORT - 2))

# Create new file: everything before + new functions + everything after
head -n $((START_LINE - 1)) src/controllers/question.controller.ts > /tmp/question-controller-new.ts
cat /tmp/patch-question-controller.ts >> /tmp/question-controller-new.ts
tail -n +$((END_LINE + 1)) src/controllers/question.controller.ts >> /tmp/question-controller-new.ts

cp /tmp/question-controller-new.ts src/controllers/question.controller.ts

echo "✅ Fixed createQuestionHandler:"
echo "   - Transform options: [] → { create: [...] }"
echo "   - Add order_in_question to each option"
echo ""

# ============================================================================
# PART 3: FIX #2 - SEPARATE USERS IN TEST
# ============================================================================

echo "--- PART 3: FIX #2 - SEPARATE INSTRUCTOR + STUDENT USERS ---"
echo ""

cat > /tmp/patch-test-file.ts << 'TESTEOF'
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper untuk cleanup
beforeAll(async () => {
  await prisma.answer.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Submission Pipeline Integration Tests', () => {
  let instructorToken: string;
  let studentToken: string;
  let studentUserId: string;
  let quizId: string;
  let submissionId: string;

  beforeAll(async () => {
    // ===== USER 1: INSTRUCTOR (creates quiz, adds questions, publishes) =====
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

    // ===== USER 2: STUDENT (takes submission) =====
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

  // ===== TEST SCENARIOS (STUDENT takes submission) =====

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
    const questionId = questionsRes.body.data[0].id;

    const res = await request(app)
      .put(`/api/v1/submissions/${submissionId}/answers/${questionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selected_options: [questionsRes.body.data[0].options[1].id] });
    
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
    
    expect(res2.status).toBe(400); // max_attempts reached
  });

  it('Audit logging tracks submission changes', async () => {
    const createRes = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ quiz_id: quizId });
    const subId = createRes.body.data.id;

    const questionsRes = await request(app)
      .get(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    await request(app)
      .put(`/api/v1/submissions/${subId}/answers/${questionsRes.body.data[0].id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ selected_options: [questionsRes.body.data[0].options[0].id] });

    const auditRes = await request(app)
      .get(`/api/v1/submissions/${subId}/audit-logs`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.body.data)).toBe(true);
  });
});
TESTEOF

# Replace test file
cp /tmp/patch-test-file.ts tests/integration/submission.integration.test.ts

echo "✅ Fixed test file:"
echo "   - Separated users: instructor + student"
echo "   - Instructor creates quiz + adds 5 questions + publishes"
echo "   - Student takes submission"
echo ""

# ============================================================================
# PART 4: VERIFY CHANGES
# ============================================================================

echo "--- PART 4: VERIFY CHANGES ---"
echo ""

echo "📄 Question Controller - check options transform:"
grep -A 10 "Transform options format" src/controllers/question.controller.ts | head -12
echo ""

echo "📄 Test File - check dual users setup:"
grep "instructor\|student" tests/integration/submission.integration.test.ts | head -15
echo ""

# ============================================================================
# PART 5: RUN TEST
# ============================================================================

echo "--- PART 5: RUN INTEGRATION TEST ---"
echo ""

npm test -- tests/integration/submission.integration.test.ts 2>&1 | tee /tmp/test-output-final.log

echo ""
echo "=========================================="
echo "   TEST RESULT SUMMARY                   "
echo "=========================================="
echo ""

# Extract summary
echo "📊 TEST SUMMARY:"
grep -E "Tests:|Test Suites:" /tmp/test-output-final.log | tail -5

echo ""

# Check result
if grep -q "5 passed" /tmp/test-output-final.log; then
  echo "✅ SUCCESS! All 5 tests PASSED!"
  echo ""
  echo "🎉 ROOT CAUSES FIXED:"
  echo "   ✅ FIX #1: Options format transformed (nested create + order_in_question)"
  echo "   ✅ FIX #2: Dual users (instructor creates quiz, student takes submission)"
  echo "   ✅ FIX #3: Question creation now successful → Quiz publish pass"
  echo "   ✅ FIX #4: Submission endpoints accessible (student role allowed)"
  echo ""
  echo "📊 FINAL STATUS: ALL TESTS PASS ✨"
  RESULT="SUCCESS"
elif grep -q "passed" /tmp/test-output-final.log; then
  RESULT="PARTIAL"
  echo "⚠️  Some tests passed but not all 5"
  echo ""
  echo "Check errors below:"
else
  RESULT="FAILED"
  echo "❌ Tests still failing"
  echo ""
  echo "Check errors below:"
fi

echo ""

if [ "$RESULT" != "SUCCESS" ]; then
  echo "📋 ERRORS:"
  echo "==========================================="
  grep -A 3 "●" /tmp/test-output-final.log | head -40
  echo ""
fi

echo "=========================================="
echo "RESULT: $RESULT"
echo "=========================================="
