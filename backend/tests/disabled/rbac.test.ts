import "../setup";
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: Login dan dapatkan token
async function loginAndGetToken(email: string, password: string = 'SecurePass123!') {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.data?.token || res.body.token;
}

// Helper: Buat user test
async function createTestUser(role: 'student' | 'instructor' | 'admin', orgId?: string) {
  const email = `test_${role}_${Date.now()}@example.com`;
  const password = 'SecurePass123!';
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password,
      first_name: 'Test',
      last_name: role,
      role,
    });
  console.log('📝 Register response:', registerRes.status, registerRes.body);
  
  // Update role & organization_id di DB
  await prisma.user.update({
    where: { email },
    data: { 
      role,
      organization_id: orgId || null,
    },
  });
  return { email, password, userId: registerRes.body.data?.user?.id };
}

describe('RBAC Integration Tests (FASE 2)', () => {
  let studentToken: string;
  let instructorAToken: string;
  let instructorBToken: string;
  let adminToken: string;
  let quizId: string;
  let orgId: string;

  beforeAll(async () => {
    // 1. Buat admin dulu (untuk membuat organization)
    const adminData = await createTestUser('admin');
    adminToken = await loginAndGetToken(adminData.email, adminData.password);
    const adminUserId = adminData.userId;

    });
    // 2. Buat organization dengan admin relation
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org',
        admin: {
          connect: { id: adminUserId }
        }
      },
    });
    orgId = org.id;
    console.log('📝 Organization created:', orgId);

    // 3. Update admin dengan organization_id yang sama
    await prisma.user.update({
      where: { id: adminUserId },
      data: { organization_id: orgId },
    });

    // 4. Buat student, instructor A, instructor B dengan organization_id
    const studentData = await createTestUser('student', orgId);
    studentToken = await loginAndGetToken(studentData.email, studentData.password);

    const instructorAData = await createTestUser('instructor', orgId);
    instructorAToken = await loginAndGetToken(instructorAData.email, instructorAData.password);

    const instructorBData = await createTestUser('instructor', orgId);
    instructorBToken = await loginAndGetToken(instructorBData.email, instructorBData.password);

    // 5. Buat quiz milik Instructor A
    const createRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${instructorAToken}`)
      .send({
        title: 'Quiz Instructor A',
        description: 'For RBAC test',
        quiz_type: 'standard',
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 1,
        organization_id: orgId, // <-- PASTIKAN DIISI
      });
    
    console.log('📝 Create quiz response:', createRes.status, createRes.body);
    quizId = createRes.body.data?.id || createRes.body.id;
    if (!quizId) {
      throw new Error('Gagal membuat quiz: quizId tidak ditemukan di response');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Student POST /quizzes -> 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Hack Quiz',
        quiz_type: 'standard',
        passing_score: 50,
        duration_minutes: 10,
        max_attempts: 1,
        organization_id: orgId,
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden/i);
  });

  test('Instructor B PATCH /quizzes/:id (milik A) -> 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${instructorBToken}`)
      .send({ title: 'Hacked by B' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden|own this resource/i);
  });

  test('Admin PATCH /quizzes/:id -> 200 OK', async () => {
    const res = await request(app)
      .patch(`/api/v1/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Edited by Admin' });
    expect(res.status).toBe(200);
    expect(res.body.data?.title || res.body.title).toBe('Edited by Admin');
  });

  test('Instructor A DELETE /quizzes/:id (milik sendiri) -> 204 No Content', async () => {
    const res = await request(app)
      .delete(`/api/v1/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${instructorAToken}`);
    expect(res.status).toBe(204);
  });

  test('Student GET /quizzes -> only sees published (or empty)', async () => {
    // Buat quiz published dulu oleh admin
    const pubRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Public Quiz for Student',
        quiz_type: 'standard',
        passing_score: 50,
        duration_minutes: 10,
        max_attempts: 1,
        organization_id: orgId,
      });
    const pubId = pubRes.body.data?.id || pubRes.body.id;
    await request(app)
      .patch(`/api/v1/quizzes/${pubId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get('/api/v1/quizzes')
      .set('Authorization', `Bearer ${studentToken}`);
    
    let quizzes = res.body.data?.quizzes || res.body.data || res.body.quizzes || [];
    if (!Array.isArray(quizzes)) quizzes = [];
    const drafts = quizzes.filter((q: any) => q.status === 'draft' || q.status === 'archived');
    expect(drafts.length).toBe(0);
  });
