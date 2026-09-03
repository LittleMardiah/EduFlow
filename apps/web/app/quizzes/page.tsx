'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuizzes } from '@/app/hooks/useQuiz';
import { useAuthStore } from '@/app/stores/authStore';
import type { QuizStatus } from '@/app/types/quiz';

const PAGE_LIMIT = 10;

const STATUS_OPTIONS: { value: QuizStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export default function QuizListPage() {
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<QuizStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const filters = {
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    page,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, error } = useQuizzes(filters);

  const quizzes = data?.quizzes ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
        {isInstructor && (
          <Link
            href="/quizzes/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            + Create Quiz
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              statusFilter === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">Loading quizzes...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          Error loading quizzes: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && quizzes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No quizzes found. {isInstructor ? 'Create one to get started!' : ''}
        </div>
      )}

      {!isLoading && !error && quizzes.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{quiz.title}</div>
                      {quiz.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{quiz.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{quiz.quiz_type.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[quiz.status] ?? 'bg-gray-100'}`}>
                        {quiz.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{quiz.total_questions}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{quiz.duration_minutes}m</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/quizzes/${quiz.id}/preview`} className="text-indigo-600 hover:text-indigo-800 text-sm">Preview</Link>
                        {isInstructor && (
                          <>
                            <Link href={`/quizzes/${quiz.id}/edit`} className="text-blue-600 hover:text-blue-800 text-sm">Edit</Link>
                          </>
                        )}
                        {quiz.status === 'published' && !isInstructor && (
                          <Link href={`/quizzes/${quiz.id}/take`} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Take</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_LIMIT + 1} - {Math.min(page * PAGE_LIMIT, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
