import * as optionService from '../src/services/option.service';
import * as optionRepository from '../src/repositories/option.repository';
import * as questionRepository from '../src/repositories/question.repository';
import * as quizRepository from '../src/repositories/quiz.repository';

jest.mock('../src/repositories/option.repository');
jest.mock('../src/repositories/question.repository');
jest.mock('../src/repositories/quiz.repository');

describe('Option Service', () => {
  const mockUserId = 'user-123';
  const mockQuestionId = 'q-123';
  const mockOptionId = 'opt-123';
  const mockQuizId = 'quiz-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOption', () => {
    test('createOption for MCQ question → creates successfully', async () => {
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'mcq',
      };
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
      };
      const mockOption = {
        id: mockOptionId,
        question_id: mockQuestionId,
        option_text: 'Option A',
        is_correct: false,
        order_in_question: 1,
      };

      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      // MOCK findOptionsByQuestion agar tidak undefined
      (optionRepository.findOptionsByQuestion as jest.Mock).mockResolvedValue([]);
      (optionRepository.countOptionsByQuestion as jest.Mock).mockResolvedValue(0);
      (optionRepository.createOption as jest.Mock).mockResolvedValue(mockOption);

      const result = await optionService.createOption(
        { question_id: mockQuestionId, option_text: 'Option A', is_correct: false },
        mockUserId
      );

      expect(result).toEqual(mockOption);
    });

    test('createOption for short-answer → throws error', async () => {
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'short_answer',
      };
      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);

      await expect(
        optionService.createOption(
          { question_id: mockQuestionId, option_text: 'Invalid', is_correct: false },
          mockUserId
        )
      ).rejects.toThrow('Options can only be added to MCQ or True/False questions');
    });

    test('createOption on published quiz → throws error', async () => {
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'mcq',
      };
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'published',
      };

      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(
        optionService.createOption(
          { question_id: mockQuestionId, option_text: 'A', is_correct: false },
          mockUserId
        )
      ).rejects.toThrow('Cannot add options to a non-draft quiz');
    });
  });

  describe('deleteOption', () => {
    test('deleteOption if only 1 remains → throws error', async () => {
      const mockOption = {
        id: mockOptionId,
        question_id: mockQuestionId,
      };
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'mcq',
      };
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
      };

      (optionRepository.findOptionById as jest.Mock).mockResolvedValue(mockOption);
      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (optionRepository.countOptionsByQuestion as jest.Mock).mockResolvedValue(1);

      await expect(optionService.deleteOption(mockOptionId, mockUserId))
        .rejects.toThrow('MCQ questions must have at least 2 options');
    });

    test('deleteOption if ≥2 remain → succeeds', async () => {
      const mockOption = {
        id: mockOptionId,
        question_id: mockQuestionId,
      };
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'mcq',
      };
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
      };

      (optionRepository.findOptionById as jest.Mock).mockResolvedValue(mockOption);
      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (optionRepository.countOptionsByQuestion as jest.Mock).mockResolvedValue(3);
      (optionRepository.deleteOption as jest.Mock).mockResolvedValue(mockOption);

      await optionService.deleteOption(mockOptionId, mockUserId);
      expect(optionRepository.deleteOption).toHaveBeenCalledWith(mockOptionId);
    });

    test('deleteOption non-owner → throws error', async () => {
      const mockOption = {
        id: mockOptionId,
        question_id: mockQuestionId,
      };
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'mcq',
      };
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: 'other-user',
        status: 'draft',
      };

      (optionRepository.findOptionById as jest.Mock).mockResolvedValue(mockOption);
      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);

      await expect(optionService.deleteOption(mockOptionId, mockUserId))
        .rejects.toThrow('Not authorized');
    });
  });

  describe('updateOption', () => {
    test('updateOption updates is_correct flag', async () => {
      const mockOption = {
        id: mockOptionId,
        question_id: mockQuestionId,
        is_correct: false,
      };
      const mockQuestion = {
        id: mockQuestionId,
        quiz_id: mockQuizId,
        question_type: 'mcq',
      };
      const mockQuiz = {
        id: mockQuizId,
        instructor_id: mockUserId,
        status: 'draft',
      };
      const updatedOption = { ...mockOption, is_correct: true };

      (optionRepository.findOptionById as jest.Mock).mockResolvedValue(mockOption);
      (questionRepository.findQuestionById as jest.Mock).mockResolvedValue(mockQuestion);
      (quizRepository.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      (optionRepository.updateOption as jest.Mock).mockResolvedValue(updatedOption);

      const result = await optionService.updateOption(
        mockOptionId,
        { is_correct: true },
        mockUserId
      );
      expect(result.is_correct).toBe(true);
    });
  });
});
