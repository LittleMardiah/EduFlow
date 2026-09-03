'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/lib/apis/client';
import type { Question, Option } from '@/app/types/question';

interface QuestionRendererProps {
  quizId: string;
  preview?: boolean;
}

export function QuestionRenderer({ quizId, preview }: QuestionRendererProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Question[] }>(
        `/quizzes/${quizId}/questions`
      );
      return res.data.data;
    },
    enabled: !!quizId,
  });

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading questions...</div>;
  }

  const questions = data ?? [];

  if (questions.length === 0) {
    return <div className="text-gray-500 text-sm">No questions yet.</div>;
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id} className="bg-white rounded-lg shadow p-5">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Q{idx + 1} &middot; {q.question_type.replace('_', ' ')} &middot; {q.difficulty_level} &middot; {q.points}pt
            </span>
            {q.ielts_section && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{q.ielts_section}</span>
            )}
          </div>
          <p className="text-gray-900 whitespace-pre-wrap mb-3">{q.question_text}</p>

          {q.question_type === 'mcq' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt: Option, oIdx: number) => (
                <div
                  key={opt.id ?? oIdx}
                  className={`px-3 py-2 rounded text-sm ${
                    preview && opt.is_correct
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + oIdx)}.</span> {opt.option_text}
                  {preview && opt.is_correct && <span className="ml-2 text-green-600">&#10003;</span>}
                </div>
              ))}
            </div>
          )}

          {q.question_type === 'true_false' && (
            <div className="flex gap-4 text-sm">
              <span className={`px-3 py-1 rounded ${preview && q.correct_answer === 'true' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>True</span>
              <span className={`px-3 py-1 rounded ${preview && q.correct_answer === 'false' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>False</span>
            </div>
          )}

          {q.question_type === 'short_answer' && (
            <div className="text-sm text-gray-600">
              {preview && q.correct_answer && <span>Answer: <strong>{q.correct_answer}</strong></span>}
              {!preview && <span className="italic">Type your answer below when taking the quiz.</span>}
            </div>
          )}

          {q.question_type === 'essay' && (
            <div className="text-sm text-gray-600">
              {q.manual_review && <span className="text-orange-600">Requires manual review</span>}
              {!preview && <span className="italic">Write your essay response below when taking the quiz.</span>}
            </div>
          )}

          {preview && q.explanation && (
            <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <strong>Explanation:</strong> {q.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
