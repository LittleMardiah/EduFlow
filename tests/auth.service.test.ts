import { register, login } from '@/services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Service', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('register creates user with hashed password', async () => {
    const user = await register('test@example.com', 'SecurePass123!', 'John', 'Doe');
    expect(user.email).toBe('test@example.com');
    expect(user.password_hash).not.toBe('SecurePass123!');
  });

  test('login rejects invalid password', async () => {
    await register('test@example.com', 'SecurePass123!', 'John', 'Doe');
    await expect(login('test@example.com', 'WrongPassword')).rejects.toThrow();
  });

  test('login generates valid JWT token', async () => {
    await register('test@example.com', 'SecurePass123!', 'John', 'Doe');
    const { token } = await login('test@example.com', 'SecurePass123!');
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);
  });

  test('audit logs registration event', async () => {
    await register('audit@example.com', 'SecurePass123!', 'Jane', 'Smith');
    const logs = await prisma.auditLog.findMany({
      where: { table_name: 'User', operation: 'INSERT' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });
});
