import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/utils/password';
import { generateToken } from '@/utils/jwt';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

export async function register(email: string, password: string, firstName: string, lastName: string, role: string = "student") {
  // Cek apakah email sudah terdaftar
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    logger.warn(`Registration attempt with existing email: ${email}`);
    throw new Error('User already exists');
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Buat user
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      role: role as any,
    },
  });

  // Log ke audit_logs (INSERT)
  await prisma.auditLog.create({
    data: {
      table_name: 'User',
      record_id: user.id,
      operation: 'INSERT',
      actor_id: user.id,
      actor_type: 'user',
      new_values: { email, role: 'student' },
    },
  });

  logger.info(`User registered: ${email} (${user.id})`);
  return user;
}

export async function login(email: string, password: string) {
  // Cari user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    throw new Error('Invalid credentials');
  }

  // Verifikasi password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    // Log failed attempt
    await prisma.auditLog.create({
      data: {
        table_name: 'User',
        record_id: user.id,
        operation: 'UPDATE',
        actor_id: user.id,
        actor_type: 'user',
        new_values: { failed_login_attempt: true },
      },
    });
    logger.warn(`Failed login attempt for email: ${email} (${user.id})`);
    throw new Error('Invalid credentials');
  }

  // Update last_login_at
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  // Log successful login
  await prisma.auditLog.create({
    data: {
      table_name: 'User',
      record_id: user.id,
      operation: 'UPDATE',
      actor_id: user.id,
      actor_type: 'user',
      new_values: { last_login_at: new Date() },
    },
  });

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as any,
  });

  logger.info(`User logged in: ${email} (${user.id})`);
  return { user, token };
}
