import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Event Management API (FASE 4)', () => {
  let instructorToken: string;
  let studentToken: string;
  let adminToken: string;
  let quizId: string;
  let eventId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Register instructor
    const instructorReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'instructor_events@example.com',
        password: 'SecurePass123!',
        first_name: 'Instructor',
        last_name: 'Events',
        role: 'instructor',
      });
    expect(instructorReg.status).toBe(201);
    const instructorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'instructor_events@example.com', password: 'SecurePass123!' });
    instructorToken = instructorLogin.body.data.token;

    // Register student
    const studentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student_events@example.com',
        password: 'SecurePass123!',
        first_name: 'Student',
        last_name: 'Events',
        role: 'student',
      });
    expect(studentReg.status).toBe(201);
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student_events@example.com', password: 'SecurePass123!' });
    studentToken = studentLogin.body.data.token;

    // Register admin
    const adminReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin_events@example.com',
        password: 'SecurePass123!',
        first_name: 'Admin',
        last_name: 'Events',
        role: 'admin',
      });
    expect(adminReg.status).toBe(201);
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin_events@example.com', password: 'SecurePass123!' });
    adminToken = adminLogin.body.data.token;

    // Instructor creates a quiz
    const quizRes = await request(app)
      .post('/api/v1/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Event Test Quiz',
        description: 'Quiz for event testing',
        quiz_type: 'standard',
        passing_score: 70,
        duration_minutes: 30,
        max_attempts: 1,
        organization_id: 'org-placeholder',
      });
    expect(quizRes.status).toBe(201);
    quizId = quizRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ===== 1. CREATE EVENT =====
  test('POST /events - Instructor creates event → 201', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        quiz_id: quizId,
        title: 'Midterm Exam Session A',
        description: 'First session of midterm',
        scheduled_start_at: start.toISOString(),
        scheduled_end_at: end.toISOString(),
        timezone: 'Asia/Jakarta',
        allow_retakes: false,
        show_answers: 'after_deadline',
        max_participants: 50,
      });

    eventId = res.body.data.id;
    expect(res.status).toBe(201);
    expect(eventId).toBeDefined();
    expect(res.body.data.title).toBe('Midterm Exam Session A');
    expect(res.body.data.status).toBe('scheduled');
    expect(res.body.data.quiz_id).toBe(quizId);
    expect(res.body.data.timezone).toBe('Asia/Jakarta');
    console.log("🔍 Created event ID:", eventId);
  });

  test('POST /events - Student cannot create event → 403', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        quiz_id: quizId,
        title: 'Student Event',
        scheduled_start_at: start.toISOString(),
        scheduled_end_at: end.toISOString(),
        timezone: 'Asia/Jakarta',
      });

    expect(res.status).toBe(403);
  });

  test('POST /events - Invalid end time (end < start) → 400', async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() - 60 * 60 * 1000); // before start

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        quiz_id: quizId,
        title: 'Invalid Event',
        scheduled_start_at: start.toISOString(),
        scheduled_end_at: end.toISOString(),
        timezone: 'Asia/Jakarta',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('End time must be after start time');
  });

  // ===== 2. GET EVENT DETAILS =====
  test('GET /events/:id - Instructor gets own event → 200', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(eventId);
    expect(res.body.data.title).toBe('Midterm Exam Session A');
    expect(res.body.data.quiz_id).toBe(quizId);
  });

  test('GET /events/:id - Student cannot access event → 403', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  // ===== 3. LIST EVENTS =====
  test('GET /events - Instructor lists own events → 200', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /events - Student lists events → 200 (empty or own)', async () => {
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ===== 4. UPDATE EVENT =====
  test('PATCH /events/:id - Update event title → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Updated Midterm Session A',
        max_participants: 60,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Midterm Session A');
    expect(res.body.data.max_participants).toBe(60);
  });

  test('PATCH /events/:id - Student cannot update → 403', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
  });

  // ===== 5. UPDATE EVENT STATUS =====
  test('PATCH /events/:id/status - Scheduled → In Progress → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventId}/status`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  test('PATCH /events/:id/status - In Progress → Completed → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventId}/status`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  test('PATCH /events/:id/status - Invalid transition (Completed → Scheduled) → 422', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${eventId}/status`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ status: 'scheduled' });

    expect(res.status).toBe(422);
    expect(res.body.error.message).toContain('Invalid status transition');
  });

  // ===== 6. DELETE EVENT (Soft Delete) =====
  test('DELETE /events/:id - Instructor deletes own event → 204', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(204);
  });

  test('DELETE /events/:id - Cannot delete already deleted event → 404', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(404);
  });
});
