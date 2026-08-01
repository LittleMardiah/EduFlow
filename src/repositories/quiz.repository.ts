import { PrismaClient, Quiz, QuizVersion, QuizStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function createQuiz(data: any): Promise<Quiz> {
  return prisma.quiz.create({ data });
}

export async function findQuizById(id: string): Promise<Quiz | null> {
  return prisma.quiz.findUnique({
    where: { id, deleted_at: null },
    include: { questions: { orderBy: { order_in_quiz: 'asc' } } },
  });
}

export async function findQuizzes({
  instructorId,
  status,
  organizationId,
  skip = 0,
  take = 20,
}: {
  instructorId?: string;
  status?: QuizStatus;
  organizationId?: string;
  skip?: number;
  take?: number;
}): Promise<Quiz[]> {
  const where: any = { deleted_at: null };
  if (instructorId) where.instructor_id = instructorId;
  if (status) where.status = status;
  if (organizationId) where.organization_id = organizationId;
  return prisma.quiz.findMany({
    where,
    skip,
    take,
    orderBy: { created_at: 'desc' },
    include: { questions: true },
  });
}

export async function countQuizzes(filters: any = {}): Promise<number> {
  const where: any = { deleted_at: null };
  if (filters.instructorId) where.instructor_id = filters.instructorId;
  if (filters.status) where.status = filters.status;
  if (filters.organizationId) where.organization_id = filters.organizationId;
  return prisma.quiz.count({ where });
}

export async function updateQuiz(id: string, data: any): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id },
    data,
  });
}

export async function softDeleteQuiz(id: string): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

export async function restoreQuiz(id: string): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id },
    data: { deleted_at: null },
  });
}

export async function getQuizVersions(quizId: string): Promise<QuizVersion[]> {
  return prisma.quizVersion.findMany({
    where: { quiz_id: quizId },
    orderBy: { version_number: 'desc' },
    include: { changed_by_user: true },
  });
}

export async function createQuizVersion(data: any): Promise<QuizVersion> {
  return prisma.quizVersion.create({ data });
}

export async function incrementTotalQuestions(quizId: string): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id: quizId },
    data: { total_questions: { increment: 1 } },
  });
}

export async function decrementTotalQuestions(quizId: string): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id: quizId },
    data: { total_questions: { decrement: 1 } },
  });
}

// Alias untuk kompatibilitas
export const getQuizById = findQuizById;
