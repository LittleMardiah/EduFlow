import { UserRole } from "@eduflow/database";
import { generateToken, hashPassword, verifyPassword, logger } from "@eduflow/core";
import { prisma } from "@eduflow/database";
import { auditService } from "./auditService";

async function findOrCreateOrganization(slug: string, adminId: string) {
  let org = await prisma.organization.findUnique({ where: { slug } });
  if (org) return org;

  return prisma.organization.create({
    data: {
      name: "Default Organization",
      slug,
      admin: { connect: { id: adminId } },
    },
  });
}

export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = "student"
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role,
      status: "active",
    },
  });

  await auditService.log(
    "INSERT",
    "User",
    user.id,
    user.id,
    null,
    { email: user.email, role: user.role },
    "user"
  );

  const org = await findOrCreateOrganization("org-placeholder", user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { organization_id: org.id },
  });

  logger.info(`User registered: ${email} (${user.id})`);
  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) throw new Error("Invalid credentials");

  let orgId = user.organization_id;
  if (!orgId) {
    const org = await findOrCreateOrganization("org-placeholder", user.id);
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

  return { user: { ...user, organization_id: orgId }, token };
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = "student"
) {
  try {
    const user = await registerUser(email, password, firstName, lastName, role);
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
    console.error("Register error:", error.message);
    return { success: false, error: { message: error.message } };
  }
}

export async function login(email: string, password: string) {
  try {
    const result = await loginUser(email, password);
    return {
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error.message);
    return { success: false, error: { message: error.message } };
  }
}