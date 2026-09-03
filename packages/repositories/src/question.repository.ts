import { prisma } from "@eduflow/database";
import { Question } from "@eduflow/database";

export async function createQuestion(data: any): Promise<Question> {
  return prisma.question.create({ data });
}

export async function findQuestionById(id: string): Promise<Question | null> {
  return prisma.question.findUnique({
    where: { id, deleted_at: null },
    include: { options: { orderBy: { order_in_question: "asc" } } },
  });
}

export async function findQuestionsByQuiz(quizId: string): Promise<Question[]> {
  return prisma.question.findMany({
    where: { quiz_id: quizId, deleted_at: null },
    orderBy: { order_in_quiz: "asc" },
    include: { options: { orderBy: { order_in_question: "asc" } } },
  });
}

export async function updateQuestion(id: string, data: any): Promise<Question> {
  return prisma.question.update({
    where: { id },
    data,
  });
}

export async function softDeleteQuestion(id: string): Promise<Question> {
  return prisma.question.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

export async function countQuestionsByQuiz(quizId: string): Promise<number> {
  return prisma.question.count({
    where: { quiz_id: quizId, deleted_at: null },
  });
}