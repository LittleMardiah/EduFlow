import { prisma } from "@eduflow/database";
import { logger } from "@eduflow/core";

export interface FormattedAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  maxPoints: number;
  correctAnswer?: string | null;
  explanation?: string | null;
  similarityScore?: number | null;
  gradingStatus: string;
}

export interface FormattedResults {
  submissionId: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  totalPointsEarned: number;
  totalPointsMax: number;
  scorePercentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: Date | null;
  gradedAt: Date | null;
  answers: FormattedAnswer[];
  feedback: string;
  canRetake: boolean;
}

export class ResultsService {
  async getResults(
    submissionId: string,
    userId: string,
    userRole: string
  ): Promise<FormattedResults> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passing_score: true,
            show_correct_answers: true,
            allow_review: true,
            max_attempts: true,
            instructor_id: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            option: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    const isOwner = submission.student_id === userId;
    const isInstructor = userRole === "instructor" && submission.quiz.instructor_id === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isInstructor && !isAdmin) {
      throw new Error("Unauthorized: You do not have access to this submission");
    }

    const showCorrectAnswers =
      submission.quiz.show_correct_answers && (isOwner || isInstructor || isAdmin);
    const isEssayReview = userRole === "instructor" || userRole === "admin";

    const formattedAnswers: FormattedAnswer[] = submission.answers.map((answer) => {
      const question = answer.question;
      const isEssay = question.question_type === "essay";
      const isPendingReview = answer.grading_status === "pending_manual_review";

      let correctAnswer: string | null = null;
      let explanation: string | null = null;

      if (showCorrectAnswers) {
        if (isEssay) {
          if (!isPendingReview && isEssayReview) {
            // could include instructor feedback (future)
          }
        } else {
          if (question.question_type === "mcq" || question.question_type === "true_false") {
            const correctOption = question.options.find((o) => o.is_correct);
            correctAnswer = correctOption?.option_text || null;
          } else if (question.question_type === "short_answer") {
            correctAnswer = question.correct_answer || null;
          }
          explanation = question.explanation || null;
        }
      }

      let studentAnswerDisplay: string | null = null;
      if (answer.option_id && answer.option) {
        studentAnswerDisplay = answer.option.option_text;
      } else if (answer.student_answer) {
        studentAnswerDisplay = answer.student_answer;
      }

      let displayStatus = answer.grading_status;
      if (isEssay && isPendingReview && !isEssayReview) {
        studentAnswerDisplay = "Your essay answer is pending instructor review";
      }

      return {
        questionId: question.id,
        questionText: question.question_text,
        questionType: question.question_type,
        studentAnswer: studentAnswerDisplay,
        isCorrect: answer.is_correct,
        pointsEarned: answer.points_earned || 0,
        maxPoints: question.points,
        correctAnswer: correctAnswer,
        explanation: explanation,
        similarityScore: answer.similarity_score,
        gradingStatus: displayStatus,
      };
    });

    const isPassed = submission.is_passed || false;
    const feedback = isPassed
      ? `Congratulations! You passed with ${submission.score_percentage}%`
      : `You scored ${submission.score_percentage}%. The passing score is ${submission.quiz.passing_score}%. Keep practicing!`;

    const canRetake =
      submission.quiz.max_attempts === -1 ||
      (submission.attempt_number < submission.quiz.max_attempts);

    return {
      submissionId: submission.id,
      quizId: submission.quiz_id,
      quizTitle: submission.quiz.title,
      studentId: submission.student_id,
      studentName: `${submission.student.first_name} ${submission.student.last_name}`,
      totalPointsEarned: submission.total_points_earned || 0,
      totalPointsMax: submission.total_points_max || 0,
      scorePercentage: submission.score_percentage || 0,
      isPassed,
      timeSpentSeconds: Math.floor(submission.time_spent_milliseconds / 1000) || 0,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      answers: formattedAnswers,
      feedback,
      canRetake,
    };
  }

  async getDetailedAnalyticsForInstructor(submissionId: string, instructorId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        quiz: {
          select: { instructor_id: true },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.quiz.instructor_id !== instructorId) {
      throw new Error("Unauthorized: You do not own this quiz");
    }

    const answers = submission.answers.map((answer) => ({
      questionId: answer.question_id,
      questionText: answer.question.question_text,
      questionType: answer.question.question_type,
      studentAnswer: answer.student_answer,
      isCorrect: answer.is_correct,
      pointsEarned: answer.points_earned,
      similarityScore: answer.similarity_score,
      gradingStatus: answer.grading_status,
      needsReview: answer.grading_status === "pending_manual_review",
    }));

    return {
      submissionId: submission.id,
      studentId: submission.student_id,
      attemptNumber: submission.attempt_number,
      status: submission.status,
      gradedAt: submission.graded_at,
      answers,
    };
  }
}

export const resultsService = new ResultsService();