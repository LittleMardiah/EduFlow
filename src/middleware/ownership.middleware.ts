import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Request, Response, NextFunction } from 'express';
import { getQuizById } from '../repositories/quiz.repository';
import { findQuestionById } from '../repositories/question.repository';

export function requireOwnership(resource: 'quiz' | 'question' | 'option') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userRole = req.user?.role;
      if (userRole === 'admin') {
        return next(); // Admin can do anything
      }

      let resourceId: string | undefined;
      let ownerId: string | undefined;

      if (resource === 'quiz') {
        resourceId = req.params.id;
        const quiz = await getQuizById(resourceId!);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        ownerId = quiz.instructor_id;
      } else if (resource === 'question') {
        resourceId = req.params.id;
        const question = await findQuestionById(resourceId!);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        const quiz = await getQuizById(question.quiz_id);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        ownerId = quiz.instructor_id;
      } else if (resource === 'option') {
        resourceId = req.params.id;
        const option = await prisma.option.findUnique({ where: { id: resourceId } });
        if (!option) return res.status(404).json({ error: 'Option not found' });
        const question = await findQuestionById(option.question_id);
        if (!question) return res.status(404).json({ error: 'Question not found' });
        const quiz = await getQuizById(question.quiz_id);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        ownerId = quiz.instructor_id;
      }

      if (ownerId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this resource' });
      }

      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
