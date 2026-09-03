import { prisma } from "@eduflow/database";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      status: true,
      organization_id: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function listUsers(role?: string) {
  return prisma.user.findMany({
    where: role ? { role: role as any } : {},
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      status: true,
      organization_id: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
  });
}