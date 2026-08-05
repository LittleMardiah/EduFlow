import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GradingRepository {
  async getSubmissionForGrading(submissionId: string) {
    return prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });
  }

  async updateSubmissionScores(
    submissionId: string,
    data: {
      status: 'graded';
      grading_status: 'auto_graded' | 'pending_manual_review';
      total_points_earned: number;
      total_points_max: number;
      score_percentage: number;
      is_passed: boolean;
      graded_at: Date;
    },
  ) {
    return prisma.submission.update({
      where: { id: submissionId },
      data,
    });
  }

  async bulkUpdateAnswerGrades(updates: Array<{
    id: string;
    is_correct: boolean | null;
    points_earned: number;
    similarity_score?: number | null;
    grading_status: 'auto_graded' | 'pending_manual_review';
  }>) {
    // Use transaction for batch update
    return prisma.$transaction(
      updates.map((update) =>
        prisma.answer.update({
          where: { id: update.id },
          data: {
            is_correct: update.is_correct,
            points_earned: update.points_earned,
            similarity_score: update.similarity_score || null,
            grading_status: update.grading_status,
          },
        }),
      ),
    );
  }
}

export const gradingRepository = new GradingRepository();
