#!/bin/bash

echo "=========================================="
echo "   RESTORE & FIX AUTH.SERVICE.TS         "
echo "=========================================="
echo ""

echo "--- 1. RESTORE DARI BACKUP ---"
cp src/services/auth.service.ts.bak6 src/services/auth.service.ts
echo "✅ Restored from auth.service.ts.bak6"
echo ""

echo "--- 2. TULIS ULANG auth.service.ts (dengan console.log) ---"
cat > src/services/auth.service.ts <<'AUTH_EOF'
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

async function findOrCreateOrganization(slug: string, adminId: string) {
  return prisma.organization.upsert({
    where: { slug },
    update: {},
    create: {
      name: 'Default Organization',
      slug,
      admin_id: adminId,
    },
  });
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'student'
) {
  console.log('🔍 registerUser CALLED:', { email, firstName, lastName, role });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      status: 'active',
    },
  });

  console.log('✅ registerUser: user created', user.id);

  const org = await findOrCreateOrganization('org-placeholder', user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { organization_id: org.id },
  });

  console.log('✅ registerUser: organization assigned', org.id);

  return user;
}

export async function loginUser(email: string, password: string) {
  console.log('🔍 loginUser CALLED:', { email });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid credentials');

  let orgId = user.organization_id;
  if (!orgId) {
    const org = await findOrCreateOrganization('org-placeholder', user.id);
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

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  console.log('✅ loginUser: success', user.id);

  return {
    user: { ...user, organization_id: orgId },
    token,
  };
}

// ============================================================
// WRAPPER FUNCTIONS DENGAN RESPONSE FORMAT YANG TEST HARAPKAN
// ============================================================

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'student'
) {
  console.log('🔷 REGISTER WRAPPER CALLED');
  try {
    const user = await registerUser(email, password, firstName, lastName, role);
    console.log('✅ REGISTER WRAPPER: success', user.id);
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          organization_id: user.organization_id,
        },
      },
    };
  } catch (error: any) {
    console.error('❌ REGISTER WRAPPER ERROR:', error.message);
    return {
      success: false,
      error: { message: error.message },
    };
  }
}

export async function login(email: string, password: string) {
  console.log('🔷 LOGIN WRAPPER CALLED');
  try {
    const result = await loginUser(email, password);
    console.log('✅ LOGIN WRAPPER: success', result.user.id);
    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          role: result.user.role,
          organization_id: result.user.organization_id,
        },
        token: result.token,
      },
    };
  } catch (error: any) {
    console.error('❌ LOGIN WRAPPER ERROR:', error.message);
    return {
      success: false,
      error: { message: error.message },
    };
  }
}
AUTH_EOF

echo "✅ auth.service.ts rewritten with console.log"
echo ""

echo "--- 3. RUN SUBMISSION TEST (lihat console.log) ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | head -300
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
