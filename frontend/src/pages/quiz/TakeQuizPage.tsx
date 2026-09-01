import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../../hooks/useQuiz';
import { useAutoSave } from '../../hooks/useAutoSave';
import { submissionApi } from '../../api/submission.api';
import { useUIStore } from '../../stores/uiStore';
import { QuizTimer } from '../../components/quiz/QuizTimer';
import { AnswerInput } from '../../components/quiz/AnswerInput';
import type { Question, Option } from '../../types/question';

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { data: quiz, isLoading } = useQuiz(id!);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const saveAnsws = useCallback(
    async (data: Record<string, string | string[]>) => {
      if (!submissionId) return;
      for (const [qId, answer] of Object.entries(data)) {
        await submissionApi.saveAnswer(submissionId, qId, answer);
      }
    },
    [submissionId]
  );

  const { markDirty } = useAutoSave(answers, saveAnsws);

  useEffect(() => {
    markDirty();
  }, [answers, markDirty]);

  const questions: Question[] = quiz ? (quiz as unknown as { questions?: Question[] }).questions ?? [] : [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const startQuiz = useCallback(async () => {
    try {
      const res = await submissionApi.createSubmission(id!);
      setSubmissionId(res.data.data.id);
      addToast({ type: 'info', message: 'Quiz started! Timer is running.', duration: 3000 });
    } catch {
      addToast({ type: 'error', message: 'Failed to start quiz.', duration: 3000 });
    }
  }, [id, addToast]);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitted || submitting) return;
    setSubmitting(true);

    try {
      if (submissionId) {
        for (const [qId, answer] of Object.entries(answers)) {
          await submissionApi.saveAnswer(submissionId, qId, answer);
        }
        await submissionApi.submitQuiz(submissionId);
      }
      setSubmitted(true);
      addToast({ type: 'success', message: 'Quiz submitted!', duration: 3000 });
      if (submissionId) {
        navigate(`/quizzes/${id}/results?submission=${submissionId}`);
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to submit quiz.', duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    handleSubmit();
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-12 text-red-500">Quiz not found.</div>;
  }

  if (totalQuestions === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        This quiz has no questions yet.
      </div>
    );
  }

  if (submitted) {
    navigate(`/quizzes/${id}/results?submission=${submissionId}`);
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
        <QuizTimer
          durationSeconds={quiz.duration_minutes * 60}
          onTimeUp={handleTimeUp}
        />
      </div>

      {submissionId && currentQuestion && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Question {currentIndex + 1} &middot; {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''} &middot; {currentQuestion.question_type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-900 mb-4 whitespace-pre-wrap">{currentQuestion.question_text}</p>

          <AnswerInput
            questionType={currentQuestion.question_type}
            options={(currentQuestion as unknown as { options?: Option[] }).options}
            value={answers[currentQuestion.id]}
            onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        </div>
      )}

      {!submissionId && (
        <div className="bg-white rounded-lg shadow p-6 text-center mb-6">
          <p className="text-gray-600 mb-4">Click below to start the quiz. The timer will begin immediately.</p>
          <button
            onClick={startQuiz}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
          >
            Start Quiz
          </button>
        </div>
      )}

      {submissionId && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded text-sm font-medium transition ${
                  idx === currentIndex
                    ? 'bg-indigo-600 text-white'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
