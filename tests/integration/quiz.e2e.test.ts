import "../setup";
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Quiz E2E Integration Tests', () => {
  let instructorToken: string;
  let adminToken: string;
  let studentToken: string;
  let userId: string;
  let quizId: string;
  let orgId: string;

  beforeAll(async () => {
    // 1. Buat admin & organization
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `admin_e2e_${Date.now()}@example.com`,
        password: 'SecurePass123!',
        first_name: 'Admin',
        last_name: 'E2E',
        role: 'admin',
      });
    const adminUserId = adminRes.body.data?.user?.id;
    
    const org = await prisma.organization.create({
      data: {
        name: 'E2E Test Org',
        slug: `e2e-org-${Date.now()}`,
        admin_id: adminUserId,
      },
    });
    orgId = org.id;
    
    await prisma.user.update({
      where: { id: adminUserId },
      data: { organization_id: orgId },
    });

    // 2. Buat instructor
    const instructorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `instructor_e2e_${Date.now()}@example.com`,
        password: 'SecurePass123!',
        first_name: 'Instructor',
        last_name: 'E2E',
        role: 'instructor',
      });
    userId = instructorRes.body.data?.user?.id;
    
    await prisma.user.update({
      where: { id: userId },
      data: { organization_id: orgId, role: 'instructor' },
    });

    // 3. Login instructor
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: instructorRes.body.data?.user?.email,
        password: 'SecurePass123!',
      });
    instructorToken = loginRes.body.data?.token || loginRes.body.token;

    // 4. Login admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: adminRes.body.data?.user?.email,
        password: 'SecurePass123!',
      });
    adminToken = adminLogin.body.data?.token || adminLogin.body.token;

    // 5. Buat student
    const studentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `student_e2e_${Date.now()}@example.com`,
        password: 'SecurePass123!',
        first_name: 'Student',
        last_name: 'E2E',
        role: 'student',
      });
    const studentId = studentRes.body.data?.user?.id;
    await prisma.user.update({
      where: { id: studentId },
      data: { organization_id: orgId },
    });
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentRes.body.data?.user?.email,
        password: 'SecurePass123!',
      });
    studentToken = studentLogin.body.data?.token || studentLogin.body.token;

    // 6. Buat quiz (draft)
    const createRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'E2E Test Quiz',
        description: 'Created in integration test',
        quiz_type: 'standard',
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 1,
        organization_id: orgId,
      });
    quizId = createRes.body.data?.id;
    console.log('📝 Quiz created with ID:', quizId);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===== CREATE QUIZ =====
  describe('POST /api/v1/quizzes', () => {
    test('Instructor creates quiz → 201', async () => {
      const res = await request(app)
        .post('/api/v1/quizzes')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Another E2E Quiz',
          description: 'Created in test',
          quiz_type: 'standard',
          passing_score: 70,
          duration_minutes: 30,
          max_attempts: 1,
          organization_id: orgId,
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('draft');
    });

    test('Student creates quiz → 403', async () => {
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
    });

    test('Create quiz without max_attempts → 400', async () => {
      const res = await request(app)
        .post('/api/v1/quizzes')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Invalid Quiz',
          quiz_type: 'standard',
          passing_score: 70,
          duration_minutes: 30,
        });
      
      expect(res.status).toBe(400);
    });
  });

  // ===== GET QUIZ =====
  describe('GET /api/v1/quizzes/:id', () => {
    test('Instructor gets own quiz → 200', async () => {
      const res = await request(app)
        .get(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(quizId);
    });

    test('Student tries to get draft quiz → 200', async () => {
      const res = await request(app)
        .get(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  // ===== LIST QUIZZES =====
  describe('GET /api/v1/quizzes', () => {
    test('Instructor lists own quizzes → 200', async () => {
      const res = await request(app)
        .get('/api/v1/quizzes')
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data?.quizzes || res.body.data)).toBe(true);
    });

    test('Student lists quizzes → 200', async () => {
      const res = await request(app)
        .get('/api/v1/quizzes')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  // ===== UPDATE QUIZ =====
  describe('PATCH /api/v1/quizzes/:id', () => {
    test('Instructor updates own quiz → 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Updated E2E Quiz' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated E2E Quiz');
    });

    test('Instructor B tries to update quiz → 403', async () => {
      const otherInstructor = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `other_instructor_${Date.now()}@example.com`,
          password: 'SecurePass123!',
          first_name: 'Other',
          last_name: 'Instructor',
          role: 'instructor',
        });
      await prisma.user.update({
        where: { id: otherInstructor.body.data?.user?.id },
        data: { organization_id: orgId, role: 'instructor' },
      });
      const otherLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: otherInstructor.body.data?.user?.email,
          password: 'SecurePass123!',
        });
      const otherToken = otherLogin.body.data?.token || otherLogin.body.token;

      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked by Other' });
      
      expect(res.status).toBe(403);
    });

    test('Admin updates any quiz → 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Edited by Admin' });
      
      expect(res.status).toBe(200);
    });
  });

  // ===== PUBLISH QUIZ =====
  describe('PATCH /api/v1/quizzes/:id/publish', () => {
    test('Publish quiz without 5 questions → 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error?.message || '').toContain('5 questions');
    });

    test('Add 5 questions to quiz via nested route', async () => {
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post(`/api/v1/quizzes/${quizId}/questions`)
          .set('Authorization', `Bearer ${instructorToken}`)
          .send({
            question_text: `Question ${i}`,
            question_type: 'mcq',
            points: 1,
          });
        expect(res.status).toBe(201);
      }
    });

    test('Publish quiz with ≥5 questions → 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('published');
    });

    test('Publish already published quiz → 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(400);
    });
  });

  // ===== DELETE QUIZ =====
  describe('DELETE /api/v1/quizzes/:id', () => {
    test('Cannot delete published quiz → 400', async () => {
      const res = await request(app)
        .delete(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(400);
    });

    test('Archive quiz first → 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/quizzes/${quizId}/archive`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });

    test('Delete archived quiz → 204', async () => {
      const res = await request(app)
        .delete(`/api/v1/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      
      expect(res.status).toBe(204);
    });
  });
});
