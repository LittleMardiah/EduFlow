import { test, expect } from '@playwright/test';

test.describe('API smoke', () => {
  test('GET /api/health → 200 + status:ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('POST /api/v1/auth/register invalid email → 400', async ({ request }) => {
    const res = await request.post('/api/v1/auth/register', {
      data: {
        email: 'not-an-email',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'student',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/v1/quizzes tanpa auth → 401', async ({ request }) => {
    const res = await request.get('/api/v1/quizzes');
    expect(res.status()).toBe(401);
  });
});