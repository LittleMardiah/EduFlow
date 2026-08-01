import request from 'supertest';
import app from '@/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Endpoints', () => {
  beforeEach(async () => {
   console.log("🧹 Cleaning database...");
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('POST /register - creates new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'e2e@example.com',
        password: 'SecurePass123!',
        first_name: 'Test',
        last_name: 'User',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('e2e@example.com');
  });

  test('POST /login - returns JWT token', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'login@example.com',
        password: 'SecurePass123!',
        first_name: 'Login',
        last_name: 'Test',
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'SecurePass123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /verify - requires valid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
  });

  test('GET /profile - returns user profile', async () => {
    // Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'profile@example.com',
        password: 'SecurePass123!',
        first_name: 'Profile',
        last_name: 'Test',
      });

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'profile@example.com',
        password: 'SecurePass123!',
      });

    const token = loginRes.body.data.token;

    // Get profile
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('profile@example.com');
  });

  test('GET /users - requires admin role', async () => {
    // Register student
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student@example.com',
        password: 'SecurePass123!',
        first_name: 'Student',
        last_name: 'Test',
      });

    // Login student
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@example.com',
        password: 'SecurePass123!',
      });

    const token = loginRes.body.data.token;

    // Try to access /users as student
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
