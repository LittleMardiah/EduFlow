import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { generateToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/password';

describe('Analytics API (FASE 4)', () => {
  let adminToken: string;
  let instructorToken: string;
  let studentToken: string;
  let instructorId: string;
  let studentId: string;
  let quizId: string;
  let eventId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.notification.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password_hash: await hashPassword('Admin123!'),
        first_name: 'Admin',
        last_name: 'Test',
        role: 'admin',
      },
    });
    adminToken = generateToken({ userId: admin.id, email: admin.email, role: 'admin' });

    // Create org
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        admin_id: admin.id,
      },
    });

    // Create instructor
    const instructor = await prisma.user.create({
      data: {
        email: 'instructor@test.com',
        password_hash: await hashPassword('Instructor123!'),
        first_name: 'Instructor',
        last_name: 'Test',
        role: 'instructor',
      },
    });
    instructorId = instructor.id;
    instructorToken = generateToken({
      userId: instructor.id,
      email: instructor.email,
      role: 'instructor',
    });

    // Create student
    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password_hash: await hashPassword('Student123!'),
        first_name: 'Student',
        last_name: 'Test',
        role: 'student',
      },
    });
    studentId = student.id;
    studentToken = generateToken({ userId: student.id, email: student.email, role: 'student' });

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Test Quiz',
        description: 'For analytics testing',
        instructor_id: instructorId,
        organization_id: org.id,
        status: 'published',
        total_questions: 3,
        passing_score: 60,
        duration_minutes: 30,
      },
    });
    quizId = quiz.id;

    // Create questions
    for (let i = 0; i < 3; i++) {
      await prisma.question.create({
        data: {
          quiz_id: quizId,
          question_text: `Question ${i + 1}`,
          question_type: 'mcq',
          points: 1,
          order_in_quiz: i + 1,
        },
      });
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'For analytics testing',
        quiz_id: quizId,
        created_by: instructorId,
        organization_id: org.id,
        scheduled_start_at: new Date(Date.now() + 3600000),
        scheduled_end_at: new Date(Date.now() + 7200000),
        timezone: 'Asia/Jakarta',
        status: 'scheduled',
      },
    });
    eventId = event.id;

    // Add student to event
    await prisma.eventParticipant.create({
      data: {
        event_id: eventId,
        student_id: studentId,
        status: 'registered',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /analytics/cohort/:eventId', () => {
    test('Instructor can view cohort analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/cohort/${eventId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('event_id');
    });

    test('Student cannot view cohort analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/cohort/${eventId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /analytics/student', () => {
    test('Student can view personal analytics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/student')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /analytics/instructor', () => {
    test('Instructor can view all events analytics', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/instructor')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
