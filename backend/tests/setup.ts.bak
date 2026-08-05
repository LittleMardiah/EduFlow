import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Hapus data dalam urutan yang benar (hindari foreign key violation)
  // Hanya hapus tabel yang sudah ada di FASE 2
  await prisma.auditLog.deleteMany({});
  await prisma.quizVersion.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  // Organization harus dihapus sebelum User (karena ada foreign key)
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
