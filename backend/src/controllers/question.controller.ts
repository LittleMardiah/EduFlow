import { Request, Response } from 'express';
import * as questionService from '../services/question.service';
import logger from '../utils/logger';

export async function createQuestionHandler(req: Request, res: Response) {
  try {
    // Ambil quiz_id dari body (sudah di-set oleh middleware di quiz.routes.ts)
    // Atau dari params jika route nested
    const quizId = req.body.quiz_id || req.params.quizId;
    
    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: { message: 'quiz_id is required' },
      });
    }

    // Set ke body agar service bisa baca
    req.body.quiz_id = quizId;
    
    logger.debug(`Creating question for quiz: ${quizId}`);
    
    const userId = req.user!.userId;
    const question = await questionService.createQuestion(req.body, userId);
    
    res.status(201).json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Create question error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getQuestionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestion(id);
    if (!question) {
      return res.status(404).json({ success: false, error: { message: 'Question not found' } });
    }
    res.json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Get question error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function listQuestionsHandler(req: Request, res: Response) {
  try {
    const quizId = req.params.quizId || req.query.quizId as string;
    if (!quizId) {
      return res.status(400).json({ success: false, error: { message: 'quiz_id is required' } });
    }
    const questions = await questionService.listQuestionsByQuiz(quizId);
    res.json({ success: true, data: questions });
  } catch (error: any) {
    logger.error(`List questions error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function updateQuestionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const question = await questionService.updateQuestion(id, req.body, userId);
    res.json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Update question error: ${error.message}`);
    const status = error.message === 'Question not found' ? 404 : 400;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
}

export async function deleteQuestionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await questionService.deleteQuestion(id, userId);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Delete question error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function reorderQuestionsHandler(req: Request, res: Response) {
  try {
    const quizId = req.params.quizId || req.body.quiz_id;
    const orderings = req.body.orderings;
    if (!quizId || !orderings) {
      return res.status(400).json({ success: false, error: { message: 'quiz_id and orderings required' } });
    }
    const userId = req.user!.userId;
    await questionService.reorderQuestions(quizId, orderings, userId);
    res.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error: any) {
    logger.error(`Reorder questions error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}
