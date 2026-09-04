import { logger } from "@eduflow/core";
import { Quiz } from "@eduflow/database";
import { notificationService } from "./NotificationService";
import {
  createQuiz as createQuizRepo,
  getQuizById as getQuizByIdRepo,
  listQuizzes as listQuizzesRepo,
  countQuizzes as countQuizzesRepo,
  updateQuiz as updateQuizRepo,
  deleteQuiz as deleteQuizRepo,
} from "@eduflow/repositories";
import { countQuestionsByQuiz } from "@eduflow/repositories";

export interface CreateQuizInput {
  title: string;
  description?: string;
  quiz_type: "standard" | "ielts_simulation" | "timed_exam";
  passing_score: number;
  duration_minutes: number;
  max_attempts: number;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  organization_id?: string;
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
  status?: string;
  instructorId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

export async function createQuiz(
  data: CreateQuizInput,
  instructorId: string,
  organizationId: string
): Promise<Quiz> {
  if (!organizationId) {
    throw new Error("Missing organization_id: instructor has no organization");
  }

  const quiz = await createQuizRepo({
    ...data,
    instructor_id: instructorId,
    organization_id: organizationId,
    total_questions: 0,
    current_version: 1,
    status: "draft",
  });
  return quiz;
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  return getQuizByIdRepo(id);
}

export async function listQuizzes(filters: QuizFilter, userId: string, userRole: string) {
  const where: any = { deleted_at: null };
  if (filters.status) where.status = filters.status;
  if (filters.instructorId) where.instructor_id = filters.instructorId;
  if (filters.organizationId) where.organization_id = filters.organizationId;

  if (userRole === "student") {
    where.status = "published";
  } else if (userRole === "instructor") {
    where.OR = [{ instructor_id: userId }, { is_public: true }];
  }

  const skip = filters.page && filters.limit ? (filters.page - 1) * filters.limit : 0;
  const take = filters.limit || 20;

  const [quizzes, total] = await Promise.all([
    listQuizzesRepo(where, skip, take),
    countQuizzesRepo(where),
  ]);

  return { quizzes, total, page: filters.page || 1, limit: take };
}

export async function updateQuiz(
  id: string,
  data: UpdateQuizInput,
  userId: string,
  userRole: string
): Promise<Quiz> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error("Quiz not found");
  if (quiz.status === "published") throw new Error("Cannot update a published quiz");
  if (userRole !== "admin" && quiz.instructor_id !== userId) {
    throw new Error("Not authorized");
  }
  return updateQuizRepo(id, data);
}

export async function publishQuiz(
  id: string,
  userId: string,
  userRole: string,
  changeReason?: string
): Promise<Quiz> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error("Quiz not found");
  if (userRole !== "admin" && quiz.instructor_id !== userId) {
    throw new Error("Not authorized");
  }
  if (quiz.status !== "draft") throw new Error("Only draft quizzes can be published");

  const questionCount = await countQuestionsByQuiz(id);
  if (questionCount < 5) throw new Error("Quiz must have at least 5 questions to publish");

  try {
    await notificationService.triggerQuizPublished(id, userId);
  } catch (notifError: any) {
    logger.warn(`Quiz publish notification failed: ${notifError.message}`);
  }

  const updated = await updateQuizRepo(id, {
    status: "published",
    published_at: new Date(),
    current_version: { increment: 1 },
  });
  return updated;
}

export async function archiveQuiz(
  id: string,
  userId: string,
  userRole: string
): Promise<Quiz> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error("Quiz not found");
  if (userRole !== "admin" && quiz.instructor_id !== userId) {
    throw new Error("Not authorized");
  }
  if (quiz.status === "archived") throw new Error("Quiz is already archived");
  return updateQuizRepo(id, { status: "archived" });
}

export async function softDeleteQuiz(
  id: string,
  userId: string,
  userRole: string
): Promise<void> {
  const quiz = await getQuizById(id);
  if (!quiz) throw new Error("Quiz not found");
  if (userRole !== "admin" && quiz.instructor_id !== userId) {
    throw new Error("Not authorized");
  }
  if (quiz.status === "published") throw new Error("Cannot delete a published quiz");
  await deleteQuizRepo(id);
}

export async function restoreQuiz(id: string, userId: string): Promise<Quiz> {
  throw new Error("Restore quiz not implemented yet");
}

export async function getQuizVersionsService(quizId: string, userId: string): Promise<any[]> {
  throw new Error("Quiz versions not implemented yet");
}