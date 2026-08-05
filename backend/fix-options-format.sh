#!/bin/bash

echo "=========================================="
echo "   FIX OPTIONS FORMAT IN CONTROLLER      "
echo "=========================================="
echo ""

echo "--- 1. BACKUP ---"
cp src/controllers/question.controller.ts src/controllers/question.controller.ts.bak-options
echo "✅ Backup created"
echo ""

echo "--- 2. UPDATE createQuestionHandler ---"
cat > src/controllers/question.controller.ts <<'CTRL_EOF'
import { Request, Response } from 'express';
import * as questionService from '../services/question.service';
import logger from '../utils/logger';

export async function createQuestionHandler(req: Request, res: Response) {
  try {
    const quizId = req.body.quiz_id || req.params.quizId || req.params.id;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: { message: 'quiz_id is required' },
      });
    }

    // TRANSFORM OPTIONS FORMAT
    let data = { ...req.body, quiz_id: quizId };
    
    if (data.options && Array.isArray(data.options)) {
      data.options = {
        create: (data.options as any[]).map((opt, index) => ({
          option_text: opt.option_text,
          is_correct: opt.is_correct || false,
          order_in_question: index,
        })),
      };
    }

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
    const quizId = req.query.quiz_id || req.params.quizId || req.params.id || req.body.quiz_id;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: { message: 'quiz_id is required' },
      });
    }

    const questions = await questionService.listQuestions(quizId as string);
    res.json({ success: true, data: questions });
  } catch (error: any) {
    logger.error(`List questions error: ${error.message}`);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
}

export async function updateQuestionHandler(req: Request, res: Response) {
  try {
    const { questionId } = req.params;
    const userId = req.user!.userId;
    const question = await questionService.updateQuestion(questionId, req.body, userId);
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
    const quizId = req.params.quizId || req.params.id || req.body.quiz_id;
    const { orderings } = req.body;
    const userId = req.user!.userId;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: { message: 'quiz_id is required' },
      });
    }

    await questionService.reorderQuestions(quizId, orderings, userId);
    res.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error: any) {
    logger.error(`Reorder questions error: ${error.message}`);
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}
CTRL_EOF

echo "✅ createQuestionHandler updated (options transformed)"
echo ""

echo "--- 3. RUN TEST ---"
npx jest tests/integration/submission.integration.test.ts 2>&1 | tail -60
echo ""

echo "=========================================="
echo "   SELESAI                               "
echo "=========================================="
