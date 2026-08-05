import { Request, Response } from 'express';
import { submissionService } from '../services/submission.service';
import { createSubmissionSchema, saveAnswerSchema } from '../schemas/submission.schemas';
import logger from '../utils/logger';

export class SubmissionController {
  async createSubmission(req: Request, res: Response) {
    try {
      const { quiz_id, event_id } = createSubmissionSchema.parse(req.body);
      const student_id = req.user!.userId;

      const submission = await submissionService.createSubmission(
        quiz_id,
        student_id,
        event_id
      );

      res.status(201).json({ success: true, data: submission });
    } catch (error: any) {
      logger.error(`Create submission error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('max attempts') ? 409 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  async saveAnswer(req: Request, res: Response) {
    try {
      const submission_id = req.params.id;
      // AMBIL question_id DARI URL PARAMS (bukan dari body)
      const question_id = req.params.question_id;
      const { student_answer, option_id } = saveAnswerSchema.parse(req.body);
      const student_id = req.user!.userId;

      const answer = await submissionService.autoSaveAnswer(
        submission_id,
        question_id,
        student_answer || null,
        option_id || null,
        student_id
      );

      res.json({ success: true, data: answer });
    } catch (error: any) {
      logger.error(`Save answer error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  async submitQuiz(req: Request, res: Response) {
    try {
      const submission_id = req.params.id;
      const student_id = req.user!.userId;

      const submission = await submissionService.submitQuiz(submission_id, student_id);

      res.json({ success: true, data: submission });
    } catch (error: any) {
      logger.error(`Submit quiz error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('already submitted') ? 400 : 409;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  async getSubmission(req: Request, res: Response) {
    try {
      const submission_id = req.params.id;
      const user_id = req.user!.userId;
      const user_role = req.user!.role;

      const submission = await submissionService.getSubmission(
        submission_id,
        user_id,
        user_role
      );

      res.json({ success: true, data: submission });
    } catch (error: any) {
      logger.error(`Get submission error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Unauthorized') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  async listStudentSubmissions(req: Request, res: Response) {
    try {
      const quiz_id = req.params.quiz_id;
      const student_id = req.query.student_id as string || req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (req.user!.role === 'student' && student_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const submissions = await submissionService.listStudentSubmissions(
        quiz_id,
        student_id,
        limit,
        offset
      );

      res.json({ success: true, data: submissions, meta: { limit, offset } });
    } catch (error: any) {
      logger.error(`List submissions error: ${error.message}`);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}

export const submissionController = new SubmissionController();
