import prisma from '../src/utils/prisma';
import logger from '../src/utils/logger';

const DB_AVAILABLE = process.env.DB_AVAILABLE !== 'false';

beforeAll(async () => {
  if (!DB_AVAILABLE) {
    return;
  }
  try {
    await prisma.answer.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.quizVersion.deleteMany({});
    await prisma.option.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.organization.deleteMany({});  // ← CRITICAL: BEFORE user!
    await prisma.user.deleteMany({});
  } catch (error: any) {
    // DB may be unreachable in CI/test environments; unit tests mock prisma
    // and must not fail during setup. Integration tests will surface DB
    // connectivity errors on their own.
    if (error && (error.code === 'P1001' || error.message?.includes('Can\'t reach database server') || error.message?.includes('max clients'))) {
      process.env.DB_AVAILABLE = 'false';
      logger.warn('Database unreachable in test setup; skipping DB cleanup.');
    } else {
      throw error;
    }
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore disconnect errors
  }
});