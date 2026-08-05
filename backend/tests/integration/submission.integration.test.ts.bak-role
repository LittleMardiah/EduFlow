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
  let token: string;
  let userId: string;
  let quizId: string;
  let submissionId: string;

  beforeAll(async () => {
    // 1. Register user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test_submission@example.com',
        password: 'SecurePass123!',
        first_name: 'Test',
        last_name: 'Submission',
        role: 'student',
      });
    userId = registerRes.body.data.user.id;

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test_submission@example.com',
        password: 'SecurePass123!',
      });
    token = loginRes.body.data.token;

    // 3. Buat quiz dengan 1 question
    const quizRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Integration Test Quiz',
        quiz_type: 'standard',
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 2,
        organization_id: 'org-placeholder',
      });
    quizId = quizRes.body.data.id;

    // 4. Add question
    await request(app)
      .post(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        question_text: 'What is 2+2?',
        question_type: 'mcq',
        points: 1,
        options: [
          { option_text: '3', is_correct: false },
          { option_text: '4', is_correct: true },
          { option_text: '5', is_correct: false },
        ],
      });

    // 5. Publish quiz
    await request(app)
      .patch(`/api/v1/quizzes/${quizId}/publish`)
      .set('Authorization', `Bearer ${token}`);
  });

  test('POST /submissions creates submission with status=in_progress', async () => {
    const res = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ quiz_id: quizId });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.attempt_number).toBe(1);
    submissionId = res.body.data.id;
  });

  test('PUT /submissions/:id/answers/:question_id saves answer', async () => {
    // Dapatkan question_id dari quiz
    const questionsRes = await request(app)
      .get(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${token}`);
    const questionId = questionsRes.body.data[0].id;

    const res = await request(app)
      .put(`/api/v1/submissions/${submissionId}/answers/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ student_answer: '4' });
    expect(res.status).toBe(200);
    expect(res.body.data.student_answer).toBe('4');
  });

  test('POST /submissions/:id/submit finalizes submission', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  test('MAX_ATTEMPTS enforcement prevents duplicate submissions', async () => {
    // Attempt 2
    const res1 = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ quiz_id: quizId });
    expect(res1.status).toBe(201);
    const subId = res1.body.data.id;
    await request(app)
      .post(`/api/v1/submissions/${subId}/submit`)
      .set('Authorization', `Bearer ${token}`);

    // Attempt 3 (harus gagal karena max_attempts = 2)
    const res2 = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ quiz_id: quizId });
    expect(res2.status).toBe(409);
    expect(res2.body.error.message).toMatch(/maximum attempts/i);
  });

  test('Audit logging tracks submission changes', async () => {
    // Buat submission baru
    const createRes = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ quiz_id: quizId });
    const subId = createRes.body.data.id;

    const questionsRes = await request(app)
      .get(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${token}`);
    const questionId = questionsRes.body.data[0].id;

    await request(app)
      .put(`/api/v1/submissions/${subId}/answers/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ student_answer: '4' });

    await request(app)
      .post(`/api/v1/submissions/${subId}/submit`)
      .set('Authorization', `Bearer ${token}`);

    // Cek audit logs
    const auditRes = await prisma.auditLog.findMany({
      where: { record_id: subId, table_name: 'submissions' },
      orderBy: { created_at: 'asc' },
    });
    expect(auditRes.length).toBeGreaterThanOrEqual(2); // INSERT + UPDATE status
  });
});
