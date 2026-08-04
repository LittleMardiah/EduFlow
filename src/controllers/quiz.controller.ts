import { Request, Response } from 'express';
import * as quizService from '../services/quiz.service';
import logger from '../utils/logger';
import { getUserById } from '../repositories/user.repository';

export async function createQuizHandler(req: Request, res: Response) {
  try {
    const data = req.body;
    const userId = req.user!.userId;
    const user = await getUserById(userId);
    const organizationId = user?.organization_id || 'org-placeholder';
    const quiz = await quizService.createQuiz(data, userId, organizationId);
    res.status(201).json({ success: true, data: quiz });
  } catch (error: any) {
    logger.error(`Create quiz error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getQuizHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const quiz = await quizService.getQuizById(id);
    if (!quiz) return res.status(404).json({ success: false, error: { message: 'Quiz not found' } });
    res.json({ success: true, data: quiz });
  } catch (error: any) {
    logger.error(`Get quiz error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function listQuizzesHandler(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const filters = {
      status: req.query.status as any,
      instructorId: req.query.instructorId as string,
      organizationId: req.query.organizationId as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };
    const result = await quizService.listQuizzes(filters, userId, userRole);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error(`List quizzes error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function updateQuizHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const quiz = await quizService.updateQuiz(id, data, userId, userRole);
    res.json({ success: true, data: quiz });
  } catch (error: any) {
    logger.error(`Update quiz error: ${error.message}`);
    const status = error.message === 'Quiz not found' ? 404 : 400;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
}

export async function publishQuizHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { change_reason } = req.body;
    const quiz = await quizService.publishQuiz(id, userId, userRole, change_reason);
    res.json({ success: true, data: quiz });
  } catch (error: any) {
    logger.error(`Publish quiz error: ${error.message}`);
    const status = error.message === 'Quiz not found' ? 404 : 400;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
}

export async function archiveQuizHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const quiz = await quizService.archiveQuiz(id, userId, userRole);
    res.json({ success: true, data: quiz });
  } catch (error: any) {
    logger.error(`Archive quiz error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function deleteQuizHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    await quizService.softDeleteQuiz(id, userId, userRole);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Delete quiz error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getQuizVersionsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const versions = await quizService.getQuizVersionsService(id, userId);
    res.json({ success: true, data: versions });
  } catch (error: any) {
    logger.error(`Get versions error: ${error.message}`);
    res.status(404).json({ success: false, error: { message: error.message } });
  }
}
