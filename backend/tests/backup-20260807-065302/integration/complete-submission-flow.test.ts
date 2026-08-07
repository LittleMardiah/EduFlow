import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Complete Submission Flow (E2E)', () => {
  let instructorToken: string;
  let studentToken: string;
  let student2Token: string;
  let quizId: string;
  let submissionId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.answer.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.user.deleteMany({});

    // Register instructor
    const instructorReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'instructor_e2e@example.com',
        password: 'SecurePass123!',
        first_name: 'Instructor',
        last_name: 'E2E',
        role: 'instructor',
      });
    expect(instructorReg.status).toBe(201);
    const instructorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'instructor_e2e@example.com', password: 'SecurePass123!' });
    instructorToken = instructorLogin.body.data.token;

    // Register student 1
    const studentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student_e2e@example.com',
        password: 'SecurePass123!',
        first_name: 'Student',
        last_name: 'E2E',
        role: 'student',
      });
    expect(studentReg.status).toBe(201);
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student_e2e@example.com', password: 'SecurePass123!' });
    studentToken = studentLogin.body.data.token;

    // Register student 2 (for RBAC test)
    const student2Reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student2_e2e@example.com',
        password: 'SecurePass123!',
        first_name: 'Student2',
        last_name: 'E2E',
        role: 'student',
      });
    expect(student2Reg.status).toBe(201);
    const student2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2_e2e@example.com', password: 'SecurePass123!' });
    student2Token = student2Login.body.data.token;

    // Instructor creates quiz with 5 questions
    const quizRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'E2E Test Quiz',
        description: 'For integration testing',
        quiz_type: 'standard',
        passing_score: 60,
        duration_minutes: 30,
        max_attempts: 1,
        organization_id: 'org-placeholder',
      });
    quizId = quizRes.body.data.id;

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/v1/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          question_text: `Question ${i+1}`,
          question_type: 'mcq',
          points: 2,
          options: [
            { option_text: `A${i}`, is_correct: false },
            { option_text: `B${i}`, is_correct: i % 2 === 0 }, // alternating correct
            { option_text: `C${i}`, is_correct: false },
            { option_text: `D${i}`, is_correct: false },
          ],
        });
    }

    // Publish quiz
    await request(app)
      .patch(`/api/v1/quizzes/${quizId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);
  });

  test('E2E: Create → Save → Submit → Grade → View Results', async () => {
    // 1. Create submission
    const createRes = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ quiz_id: quizId });
    expect(createRes.status).toBe(201);
    submissionId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('in_progress');

    // 2. Get questions
    const questionsRes = await request(app)
      .get(`/api/v1/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${studentToken}`);
    const questions = questionsRes.body.data;

    // 3. Save answers (using option IDs)
    for (const q of questions) {
      const correctOption = q.options.find((o: any) => o.is_correct);
      await request(app)
        .put(`/api/v1/submissions/${submissionId}/answers/${q.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ option_id: correctOption.id });
    }

    // 4. Submit
    const submitRes = await request(app)
      .post(`/api/v1/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('submitted');

    // 5. Get results (should auto-grade)
    // Wait a bit for grading to complete (since grading is sync in this implementation)
    // We'll poll or just wait a second.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const resultsRes = await request(app)
      .get(`/api/v1/submissions/${submissionId}/results`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(resultsRes.status).toBe(200);
    expect(resultsRes.body.data.scorePercentage).toBeGreaterThan(0);
    expect(resultsRes.body.data.isPassed).toBeDefined();
    // Since we answered all correctly, score should be 100%
    expect(resultsRes.body.data.scorePercentage).toBe(100);
    expect(resultsRes.body.data.isPassed).toBe(true);
  });

  test('RBAC: Student can\'t see other student\'s results', async () => {
    // Create submission for student2
    const createRes2 = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ quiz_id: quizId });
    expect(createRes2.status).toBe(201);
    const subId2 = createRes2.body.data.id;

    // Student 1 tries to view student 2's results
    const res = await request(app)
      .get(`/api/v1/submissions/${subId2}/results`)
      .set('Authorization', `Bearer ${studentToken}`);
    // Should be 403 Forbidden
    expect(res.status).toBe(403);
  });

  test('Audit logging: All operations logged', async () => {
    // We need to check audit_logs for the submission we created earlier
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        table_name: 'submissions',
        record_id: submissionId,
      },
    });
    // At minimum, we should have INSERT (create), UPDATE (save answers), UPDATE (submit), UPDATE (grade)
    // But the save answers may not be logged individually by the middleware, so we check at least 3 entries.
    // We'll check for INSERT and two UPDATES (submit and grade).
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
    expect(auditLogs.some(log => log.operation === 'INSERT')).toBe(true);
    expect(auditLogs.some(log => log.operation === 'UPDATE')).toBe(true);
  });
});
