import { Request, Response } from 'express';
import * as questionService from '../services/question.service';
import logger from '../utils/logger';

export async function createQuestionHandler(req: Request, res: Response) {
  try {
    const { quizId } = req.params;
    const data = { ...req.body, quiz_id: quizId };
    const userId = req.user!.userId;
    const question = await questionService.createQuestion(data, userId);
    res.status(201).json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Create question error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getQuestionHandler(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const question = await questionService.getQuestion(questionId);
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
    const { quizId } = req.params;
    const questions = await questionService.listQuestionsByQuiz(quizId);
    res.json({ success: true, data: questions });
  } catch (error: any) {
    logger.error(`List questions error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function updateQuestionHandler(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const data = req.body;
    const userId = req.user!.userId;
    const question = await questionService.updateQuestion(questionId, data, userId);
    res.json({ success: true, data: question });
  } catch (error: any) {
    logger.error(`Update question error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function deleteQuestionHandler(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const userId = req.user!.userId;
    await questionService.deleteQuestion(questionId, userId);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Delete question error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function reorderQuestionsHandler(req: Request, res: Response) {
  try {
    const { quizId } = req.params;
    const { orderings } = req.body;
    const userId = req.user!.userId;
    await questionService.reorderQuestions(quizId, orderings, userId);
    res.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error: any) {
    logger.error(`Reorder questions error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}
