import { registerUser, loginUser } from '@/services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Service', () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test('register creates user with hashed password', async () => {
    const user = await registerUser('test@example.com', 'SecurePass123!', 'John', 'Doe');
    expect(user.email).toBe('test@example.com');
    expect(user.password_hash).not.toBe('SecurePass123!');
  });

  test('login rejects invalid password', async () => {
    await registerUser('test@example.com', 'SecurePass123!', 'John', 'Doe');
    await expect(loginUser('test@example.com', 'WrongPassword')).rejects.toThrow();
  });

  test('login generates valid JWT token', async () => {
    await registerUser('test@example.com', 'SecurePass123!', 'John', 'Doe');
    const { token } = await loginUser('test@example.com', 'SecurePass123!');
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);
  });

  test('audit logs registration event', async () => {
    await registerUser('audit@example.com', 'SecurePass123!', 'Jane', 'Smith');
    const logs = await prisma.auditLog.findMany({
      where: { table_name: 'User', operation: 'INSERT' },
    });
    expect(logs.length).toBeGreaterThan(0);
  });
});
