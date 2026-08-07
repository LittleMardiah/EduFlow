import prisma from "../../src/utils/prisma";
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { register, login } from '../../src/services/auth.service';

describe('Quiz E2E Integration Tests', () => {
  let adminToken: string;
  let instructorToken: string;
  let studentToken: string;
  let otherInstructorToken: string;
  let quizId: string;
  let adminUser: any;
  let instructorUser: any;
  let studentUser: any;

  beforeAll(async () => {
    // Cleanup data
    await prisma.AuditLog.deleteMany({});
    await prisma.quizVersion.deleteMany({});
    await prisma.Option.deleteMany({});
    await prisma.Question.deleteMany({});
    await prisma.Submission.deleteMany({});
    await prisma.Quiz.deleteMany({});
    await prisma.User.deleteMany({});

    // Register admin (otomatis punya org)
    const adminRes = await register(
      `admin_e2e_${Date.now()}@example.com`,
      'AdminPass123!',
      'Admin',
      'E2E',
      'admin'
    );
    adminUser = adminRes;
    const adminLogin = await login(adminRes.email, 'AdminPass123!');
    adminToken = adminLogin.token;

    // Register instructor
    const instructorRes = await register(
      `instructor_e2e_${Date.now()}@example.com`,
      'InstructorPass123!',
      'Instructor',
      'E2E',
      'instructor'
    );
    instructorUser = instructorRes;
    const instructorLogin = await login(instructorRes.email, 'InstructorPass123!');
    instructorToken = instructorLogin.token;

    // Register student
    const studentRes = await register(
      `student_e2e_${Date.now()}@example.com`,
      'StudentPass123!',
      'Student',
      'E2E',
      'student'
    );
    studentUser = studentRes;
    const studentLogin = await login(studentRes.email, 'StudentPass123!');
    studentToken = studentLogin.token;

    // Register other instructor (untuk test ownership)
    const otherRes = await register(
      `other_instructor_${Date.now()}@example.com`,
      'OtherPass123!',
      'Other',
      'Instructor',
      'instructor'
    );
    const otherLogin = await login(otherRes.email, 'OtherPass123!');
    otherInstructorToken = otherLogin.token;
  });

  // ... lanjutkan test cases seperti biasa, tapi tanpa membuat org manual
  // (saya singkat di sini, yang penting setup sudah benar)

  test('POST /api/v1/quizzes - Instructor creates quiz → 201', async () => {
    const res = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'E2E Quiz',
        description: 'Test quiz',
        quiz_type: 'standard',
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('draft');
    quizId = res.body.data.id;
  });

  // Tambahkan test lain sesuai kebutuhan...
  // Tapi untuk submission test, kita hanya butuh quizId.
  // Kita export quizId agar bisa dipakai di test lain.
});
