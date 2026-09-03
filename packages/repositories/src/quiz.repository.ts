import { prisma } from "@eduflow/database";
import { Quiz } from "@eduflow/database";

export async function createQuiz(data: any): Promise<Quiz> {
  return prisma.quiz.create({
    data: {
      title: data.title,
      description: data.description,
      instructor_id: data.instructor_id,
      organization_id: data.organization_id,
      quiz_type: data.quiz_type || "standard",
      total_questions: data.total_questions || 0,
      passing_score: data.passing_score || 60,
      duration_minutes: data.duration_minutes || 60,
      show_correct_answers: data.show_correct_answers ?? true,
      allow_review: data.allow_review ?? true,
      max_attempts: data.max_attempts ?? 1,
      randomize_questions: data.randomize_questions ?? false,
      randomize_options: data.randomize_options ?? false,
      status: data.status || "draft",
      is_public: data.is_public ?? false,
      current_version: 1,
      total_attempts: 0,
    },
  });
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  return prisma.quiz.findUnique({
    where: { id },
    include: { questions: true },
  });
}

export async function listQuizzes(
  where: any = {},
  skip: number = 0,
  take: number = 20,
  orderBy: any = { created_at: "desc" }
): Promise<Quiz[]> {
  return prisma.quiz.findMany({
    where: {
      ...where,
      deleted_at: null,
    },
    skip,
    take,
    orderBy,
  });
}

export async function countQuizzes(where: any = {}): Promise<number> {
  return prisma.quiz.count({
    where: {
      ...where,
      deleted_at: null,
    },
  });
}

export async function updateQuiz(id: string, data: any): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id },
    data,
  });
}

export async function deleteQuiz(id: string): Promise<Quiz> {
  return prisma.quiz.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

export const findQuizById = getQuizById;
export const findQuizzes = listQuizzes;
export const softDeleteQuiz = deleteQuiz;

export const getQuizVersions = async (quizId: string) => {
  return [];
};

export const createQuizVersion = async (data: any) => {
  return {};
};

export async function incrementTotalQuestions(quizId: string): Promise<void> {
  await prisma.quiz.update({
    where: { id: quizId },
    data: { total_questions: { increment: 1 } },
  });
}

export async function decrementTotalQuestions(quizId: string): Promise<void> {
  await prisma.quiz.update({
    where: { id: quizId },
    data: { total_questions: { decrement: 1 } },
  });
}