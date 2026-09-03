import { prisma } from "@eduflow/database";
import { Option } from "@eduflow/database";

export async function createOption(data: any): Promise<Option> {
  return prisma.option.create({ data });
}

export async function findOptionById(id: string): Promise<Option | null> {
  return prisma.option.findUnique({ where: { id } });
}

export async function findOptionsByQuestion(questionId: string): Promise<Option[]> {
  return prisma.option.findMany({
    where: { question_id: questionId },
    orderBy: { order_in_question: "asc" },
  });
}

export async function updateOption(id: string, data: any): Promise<Option> {
  return prisma.option.update({
    where: { id },
    data,
  });
}

export async function deleteOption(id: string): Promise<Option> {
  return prisma.option.delete({ where: { id } });
}

export async function countOptionsByQuestion(questionId: string): Promise<number> {
  return prisma.option.count({ where: { question_id: questionId } });
}

export async function setCorrectAnswer(questionId: string, optionId: string): Promise<void> {
  await prisma.option.updateMany({
    where: { question_id: questionId },
    data: { is_correct: false },
  });
  await prisma.option.update({
    where: { id: optionId },
    data: { is_correct: true },
  });
}