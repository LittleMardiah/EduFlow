import { Request, Response } from 'express';
import * as optionService from '../services/option.service';
import logger from '../utils/logger';

export async function createOptionHandler(req: Request, res: Response) {
  try {
    // Ambil question_id dari body (bukan params)
    const { question_id, option_text, is_correct } = req.body;
    
    if (!question_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'question_id is required' }
      });
    }

    const userId = req.user!.userId;
    const option = await optionService.createOption(
      { question_id, option_text, is_correct },
      userId
    );
    
    res.status(201).json({ success: true, data: option });
  } catch (error: any) {
    logger.error(`Create option error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function updateOptionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const option = await optionService.updateOption(id, req.body, userId);
    res.json({ success: true, data: option });
  } catch (error: any) {
    logger.error(`Update option error: ${error.message}`);
    const status = error.message === 'Option not found' ? 404 : 400;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
}

export async function deleteOptionHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await optionService.deleteOption(id, userId);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Delete option error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getOptionsHandler(req: Request, res: Response) {
  try {
    const questionId = req.query.questionId as string;
    if (!questionId) {
      return res.status(400).json({
        success: false,
        error: { message: 'question_id is required' }
      });
    }
    const options = await optionService.getOptionsByQuestion(questionId);
    res.json({ success: true, data: options });
  } catch (error: any) {
    logger.error(`Get options error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}
