import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export async function register(email: string, password: string, firstName: string, lastName: string, role: string = 'student') {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const password_hash = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      role: role as any,
    },
  });

  // ==========================================
  // AUTO-CREATE ORGANIZATION untuk user
  // ==========================================
  const org = await prisma.organization.create({
    data: {
      name: `${firstName}'s Organization`,
      slug: `org-${user.id}`.slice(0, 50),
      admin_id: user.id,
    },
  });

  // Update user dengan organization_id
  await prisma.user.update({
    where: { id: user.id },
    data: { organization_id: org.id },
  });

  await prisma.auditLog.create({
    data: {
      table_name: 'User',
      record_id: user.id,
      operation: 'INSERT',
      actor_id: user.id,
      actor_type: 'user',
      new_values: { email, role },
    },
  });

  logger.info(`User registered: ${email} (${user.id})`);
  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
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
    throw new Error('Invalid credentials');
  }

  // Pastikan user punya organization
  let orgId = user.organization_id;
  if (!orgId) {
    const org = await prisma.organization.create({
      data: {
        name: `${user.first_name}'s Organization`,
        slug: `org-${user.id}`.slice(0, 50),
        admin_id: user.id,
      },
    });
    orgId = org.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { organization_id: orgId },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

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

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as any,
  });

  logger.info(`User logged in: ${email} (${user.id})`);
  return { user, token };
}
