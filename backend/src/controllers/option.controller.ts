import { Request, Response } from 'express';
import * as optionService from '../services/option.service';
import logger from '../utils/logger';

export async function createOptionHandler(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const data = { ...req.body, question_id: questionId };
    const userId = req.user!.userId;
    const option = await optionService.createOption(data, userId);
    res.status(201).json({ success: true, data: option });
  } catch (error: any) {
    logger.error(`Create option error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function getOptionsHandler(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const options = await optionService.getOptionsByQuestion(questionId);
    res.json({ success: true, data: options });
  } catch (error: any) {
    logger.error(`Get options error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function updateOptionHandler(req: Request, res: Response) {
  try {
    const { optionId } = req.params;
    const data = req.body;
    const userId = req.user!.userId;
    const option = await optionService.updateOption(optionId, data, userId);
    res.json({ success: true, data: option });
  } catch (error: any) {
    logger.error(`Update option error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}

export async function deleteOptionHandler(req: Request, res: Response) {
  try {
    const { optionId } = req.params;
    const userId = req.user!.userId;
    await optionService.deleteOption(optionId, userId);
    res.status(204).send();
  } catch (error: any) {
    logger.error(`Delete option error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}
