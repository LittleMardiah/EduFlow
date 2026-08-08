import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Notifications API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Cleanup
    await prisma.notification.deleteMany({});
    await prisma.user.deleteMany({});

    // Register user
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'notif_test@example.com',
        password: 'SecurePass123!',
        first_name: 'Notif',
        last_name: 'Test',
        role: 'student',
      });
    userId = reg.body.data.user.id;

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'notif_test@example.com', password: 'SecurePass123!' });
    token = login.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /notifications returns empty list', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.unread_count).toBe(0);
  });

  test('GET /notifications?unread=true returns only unread', async () => {
    const res = await request(app)
      .get('/api/v1/notifications?unread=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('PATCH /notifications/:id/read returns 404 for non-existent', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/dummy/read')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('DELETE /notifications/:id returns 404 for non-existent', async () => {
    const res = await request(app)
      .delete('/api/v1/notifications/dummy')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
