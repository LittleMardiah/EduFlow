import {
  createOption as createOptionRepo,
  findOptionById,
  findOptionsByQuestion,
  updateOption as updateOptionRepo,
  deleteOption as deleteOptionRepo,
  countOptionsByQuestion,
  setCorrectAnswer as setCorrectAnswerRepo,
} from '../repositories/option.repository';
import { findQuestionById } from '../repositories/question.repository';
import { getQuizById } from '../repositories/quiz.repository';

export interface CreateOptionInput {
  question_id: string;
  option_text: string;
  is_correct?: boolean;
  order_in_question?: number;
}

export interface UpdateOptionInput {
  option_text?: string;
  is_correct?: boolean;
  order_in_question?: number;
}

export async function createOption(data: CreateOptionInput, userId: string): Promise<any> {
  const question = await findQuestionById(data.question_id);
  if (!question) throw new Error('Question not found');
  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot add options to a non-draft quiz');

  // Validate MCQ/T/F only
  if (!['mcq', 'true_false'].includes(question.question_type)) {
    throw new Error('Options can only be added to MCQ or True/False questions');
  }

  const existingOptions = await findOptionsByQuestion(data.question_id);
  let order = data.order_in_question;
  if (!order) {
    order = existingOptions.length + 1;
  }

  // Ensure uniqueness
  const option = await createOptionRepo({
    ...data,
    order_in_question: order,
    is_correct: data.is_correct || false,
  });

  // If this option is marked correct, reset others
  if (option.is_correct) {
    await setCorrectAnswerRepo(data.question_id, option.id);
  }

  return option;
}

export async function getOptionsByQuestion(questionId: string): Promise<any[]> {
  return findOptionsByQuestion(questionId);
}

export async function updateOption(id: string, data: UpdateOptionInput, userId: string): Promise<any> {
  const option = await findOptionById(id);
  if (!option) throw new Error('Option not found');
  const question = await findQuestionById(option.question_id);
  if (!question) throw new Error('Question not found');
  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot update options in a non-draft quiz');

  const updated = await updateOptionRepo(id, data);

  // If is_correct is set to true, reset others
  if (data.is_correct === true) {
    await setCorrectAnswerRepo(question.id, updated.id);
  }

  return updated;
}

export async function deleteOption(id: string, userId: string): Promise<void> {
  const option = await findOptionById(id);
  if (!option) throw new Error('Option not found');
  const question = await findQuestionById(option.question_id);
  if (!question) throw new Error('Question not found');
  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot delete options in a non-draft quiz');

  // Ensure at least 2 options remain for MCQ
  const count = await countOptionsByQuestion(question.id);
  if (count <= 2) {
    throw new Error('MCQ questions must have at least 2 options');
  }

  await deleteOptionRepo(id);
}

export async function setCorrectAnswer(questionId: string, optionId: string, userId: string): Promise<void> {
  const question = await findQuestionById(questionId);
  if (!question) throw new Error('Question not found');
  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Cannot set correct answer in a non-draft quiz');

  await setCorrectAnswerRepo(questionId, optionId);
}
