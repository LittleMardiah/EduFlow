import request from 'supertest';
import app from '../../src/app';

describe('Auth E2E Integration Tests', () => {
  test('POST /auth/register creates user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test_e2e_${Date.now()}@example.com`,
        password: 'SecurePass123!',
        first_name: 'Test',
        last_name: 'E2E',
        role: 'student',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toBeDefined();
  });

  test('POST /auth/login returns token', async () => {
    const email = `login_e2e_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'SecurePass123!',
        first_name: 'Login',
        last_name: 'Test',
        role: 'student',
      });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'SecurePass123!',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /auth/login with wrong password → 401', async () => {
    const email = `wrong_e2e_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'SecurePass123!',
        first_name: 'Wrong',
        last_name: 'Test',
        role: 'student',
      });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'WrongPassword!',
      });
    expect(res.status).toBe(401);
  });
});
