import { PrismaClient, Quiz, QuizStatus } from '@prisma/client';
import {
  createQuiz as createQuizRepo,
  findQuizById,
  findQuizzes,
  countQuizzes,
  updateQuiz as updateQuizRepo,
  softDeleteQuiz as softDeleteQuizRepo,
  restoreQuiz as restoreQuizRepo,
  getQuizVersions,
  createQuizVersion,
} from '../repositories/quiz.repository';
import { countQuestionsByQuiz } from '../repositories/question.repository';

const prisma = new PrismaClient();

export interface CreateQuizInput {
  title: string;
  description?: string;
  quiz_type: 'standard' | 'ielts_simulation' | 'timed_exam';
  passing_score: number;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string;
  passing_score?: number;
  duration_minutes?: number;
  max_attempts?: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
}

export interface QuizFilter {
  status?: QuizStatus;
  instructorId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

export async function createQuiz(data: CreateQuizInput, instructorId: string): Promise<Quiz> {
  const quiz = await createQuizRepo({
    ...data,
    instructor_id: instructorId,
    organization_id: 'org-placeholder', // TODO: get from user
    total_questions: 0,
    current_version: 1,
    status: 'draft',
  });
  return quiz;
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  return findQuizById(id);
}

export async function listQuizzes(filters: QuizFilter, userId: string, userRole: string) {
  const where: any = { deleted_at: null };
  if (filters.status) where.status = filters.status;
  if (filters.instructorId) where.instructor_id = filters.instructorId;
  if (filters.organizationId) where.organization_id = filters.organizationId;

  // RBAC: students only see published quizzes
  if (userRole === 'student') {
    where.status = 'published';
  } else if (userRole === 'instructor') {
    // Instructors see their own + public
    where.OR = [
      { instructor_id: userId },
      { is_public: true },
    ];
  }
  // Admin sees all

  const skip = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
  const take = filters.limit || 20;

  const [quizzes, total] = await Promise.all([
    findQuizzes({ ...where, skip, take }),
    countQuizzes(where),
  ]);

  return { quizzes, total, page: filters.page || 1, limit: take };
}

export async function updateQuiz(id: string, data: UpdateQuizInput, userId: string): Promise<Quiz> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.status === 'published') throw new Error('Cannot update a published quiz');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');

  return updateQuizRepo(id, data);
}

export async function publishQuiz(id: string, userId: string, changeReason?: string): Promise<Quiz> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status !== 'draft') throw new Error('Only draft quizzes can be published');

  // Validate at least 5 questions
  const questionCount = await countQuestionsByQuiz(id);
  if (questionCount < 5) throw new Error('Quiz must have at least 5 questions to publish');

  // Create version snapshot
  await createQuizVersion({
    quiz_id: id,
    version_number: quiz.current_version + 1,
    title: quiz.title,
    description: quiz.description,
    total_questions: quiz.total_questions,
    passing_score: quiz.passing_score,
    duration_minutes: quiz.duration_minutes,
    quiz_type: quiz.quiz_type,
    changed_by: userId,
    change_reason: changeReason || 'Published',
  });

  // Update quiz
  const updated = await updateQuizRepo(id, {
    status: 'published',
    published_at: new Date(),
    current_version: { increment: 1 },
  });

  return updated;
}

export async function archiveQuiz(id: string, userId: string): Promise<Quiz> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status === 'archived') throw new Error('Quiz is already archived');

  return updateQuizRepo(id, { status: 'archived' });
}

export async function softDeleteQuiz(id: string, userId: string): Promise<void> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');
  if (quiz.status === 'published') throw new Error('Cannot delete a published quiz');

  await softDeleteQuizRepo(id);
}

export async function restoreQuiz(id: string, userId: string): Promise<Quiz> {
  const quiz = await restoreQuizRepo(id);
  if (!quiz) throw new Error('Quiz not found or not deleted');
  return quiz;
}

export async function getQuizVersionsService(quizId: string, userId: string): Promise<any[]> {
  const quiz = await getQuizById(quizId);
  if (!quiz) throw new Error('Quiz not found');
  if (quiz.instructor_id !== userId) throw new Error('Not authorized');

  return getQuizVersions(quizId);
}
