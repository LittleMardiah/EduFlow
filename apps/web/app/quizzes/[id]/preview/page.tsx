'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuiz } from '@/app/hooks/useQuiz';
import { QuestionRenderer } from '@/app/components/quiz/QuestionRenderer';

export default function PreviewQuizPage() {
  const { id } = useParams<{ id: string }>();
  const { data: quiz, isLoading } = useQuiz(id!);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-12 text-red-500">Quiz not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/quizzes" className="text-indigo-600 hover:text-indigo-800 text-sm">&larr; Back to Quizzes</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        {quiz.description && <p className="text-gray-600 mb-4">{quiz.description}</p>}
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Type: {quiz.quiz_type.replace('_', ' ')}</span>
          <span>Duration: {quiz.duration_minutes} minutes</span>
          <span>Passing: {quiz.passing_score}%</span>
          <span>Questions: {quiz.total_questions}</span>
        </div>
      </div>

      {quiz.total_questions === 0 ? (
        <div className="text-center py-12 text-gray-500">
          This quiz has no questions yet.
          <br />
          <Link href={`/quizzes/${quiz.id}/edit`} className="text-indigo-600 hover:underline mt-2 inline-block">
            Add questions in the editor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quiz.id && <QuestionRenderer quizId={quiz.id} preview />}
        </div>
      )}
    </div>
  );
}
