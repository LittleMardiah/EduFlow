#!/bin/bash

echo "=========================================="
echo "   FIX AUTH SERVICE - findOrCreateOrganization "
echo "=========================================="
echo ""

echo "--- 1. BACKUP auth.service.ts ---"
cp src/services/auth.service.ts src/services/auth.service.ts.bak
echo "✅ Backup created: src/services/auth.service.ts.bak"
echo ""

echo "--- 2. REWRITE auth.service.ts (fix organization logic) ---"
cat > src/services/auth.service.ts <<'TS_EOF'
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Find or create organization dengan slug tertentu.
 * - Jika sudah ada, return yang existing.
 * - Jika belum, buat baru.
 */
async function findOrCreateOrganization(slug: string = 'org-placeholder') {
  // 1. Cek apakah organization dengan slug ini sudah ada
  let org = await prisma.organization.findUnique({
    where: { slug },
  });

  // 2. Jika sudah ada, return
  if (org) {
    return org;
  }

  // 3. Jika belum, buat baru
  org = await prisma.organization.create({
    data: {
      name: 'Default Organization',
      slug,
      description: 'Auto-generated organization',
      admin_id: 'placeholder_admin', // Akan di-update nanti
    },
  });

  return org;
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'student'
) {
  // 1. Validasi email unik
  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    throw new Error('Email already registered');
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Cari atau buat organization
  const org = await findOrCreateOrganization('org-placeholder');

  // 4. Buat user
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      organization_id: org.id,
      status: 'active',
    },
  });

  logger.info(`User registered: ${email} (${user.id})`);

  // 5. Update admin_id organization jika belum ada (opsional)
  // Untuk MVP, kita skip dulu

  return user;
}

export async function loginUser(email: string, password: string) {
  // 1. Cari user
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 2. Verifikasi password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // 3. Pastikan user punya organization
  let orgId = user.organization_id;
  if (!orgId) {
    const org = await findOrCreateOrganization('org-placeholder');
    orgId = org.id;
    // Update user dengan organization_id
    await prisma.user.update({
      where: { id: user.id },
      data: { organization_id: orgId },
    });
  }

  // 4. Update last_login_at
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  logger.info(`User logged in: ${email} (${user.id})`);

  // 5. Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: orgId,
    },
    token,
  };
}

// Export untuk testing
export const __test = {
  findOrCreateOrganization,
};
TS_EOF
echo "✅ auth.service.ts updated"
echo ""

echo "--- 3. RUN INTEGRATION TEST (SUBMISSION + RBAC) ---"
echo "▶️ Executing: npm run test:integration"
npm run test:integration 2>&1 | head -300
echo ""

echo "--- 4. RUN FULL TEST SUITE ---"
echo "▶️ Executing: npm test"
npm test 2>&1 | head -200
echo ""

echo "=========================================="
echo "       PERBAIKAN & VERIFIKASI SELESAI     "
echo "=========================================="
