import { PrismaClient, QuestionType } from '@prisma/client';
import {
  createQuestion as createQuestionRepo,
  findQuestionById,
  findQuestionsByQuiz,
  updateQuestion as updateQuestionRepo,
  softDeleteQuestion,
} from '../repositories/question.repository';
import { getQuizById } from '../repositories/quiz.repository';
import { incrementTotalQuestions, decrementTotalQuestions } from '../repositories/quiz.repository';

export interface CreateQuestionInput {
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  points?: number;
  order_in_quiz?: number;
  ielts_section?: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  explanation?: string;
  correct_answer?: string;
  fuzzy_threshold?: number;
  manual_review?: boolean;
}

export interface UpdateQuestionInput {
  question_text?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  points?: number;
  order_in_quiz?: number;
  ielts_section?: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  explanation?: string;
  correct_answer?: string;
  fuzzy_threshold?: number;
  manual_review?: boolean;
}

export async function createQuestion(data: CreateQuestionInput, userId: string): Promise<any> {
  // Verify quiz exists and is draft
  const quiz = await getQuizById(data.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot add questions to a non-draft quiz');

  // If order not provided, append at the end
  let order = data.order_in_quiz;
  if (!order) {
    const questions = await findQuestionsByQuiz(data.quiz_id);
    order = questions.length + 1;
  }

  const question = await createQuestionRepo({
    ...data,
    order_in_quiz: order,
    status: 'active',
  });

  // Increment total_questions
  await incrementTotalQuestions(data.quiz_id);

  return question;
}

export async function getQuestion(id: string): Promise<any> {
  return findQuestionById(id);
}

export async function listQuestionsByQuiz(quizId: string): Promise<any[]> {
  return findQuestionsByQuiz(quizId);
}

// ===== LIST QUESTIONS (ALIAS UNTUK CONTROLLER) =====
export async function listQuestions(quizId: string): Promise<any[]> {
  return listQuestionsByQuiz(quizId);
}

export async function updateQuestion(id: string, data: UpdateQuestionInput, userId: string): Promise<any> {
  const question = await findQuestionById(id);
  if (!question) throw new Error('Question not found');
  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot update questions in a non-draft quiz');

  return updateQuestionRepo(id, data);
}

export async function deleteQuestion(id: string, userId: string): Promise<void> {
  const question = await findQuestionById(id);
  if (!question) throw new Error('Question not found');
  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot delete questions in a non-draft quiz');

  await softDeleteQuestion(id);
  // Decrement total_questions
  await decrementTotalQuestions(quiz.id);
}

export async function reorderQuestions(quizId: string, orderings: { questionId: string; order: number }[], userId: string): Promise<void> {
  const quiz = await getQuizById(quizId);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot reorder questions in a non-draft quiz');

  // Update each question's order.
  for (const item of orderings) {
    await updateQuestionRepo(item.questionId, { order_in_quiz: item.order });
  }
}