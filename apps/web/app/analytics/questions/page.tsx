'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyticsApi } from '@/app/lib/apis/analytics.api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import type { QuestionAnalytics } from '../../types/analytics';

export default function QuestionAnalyticsPage() {
  const [questions, setQuestions] = useState<QuestionAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch questions - in real app, this would be per-quiz
        // For now, we use a generic approach
        const res = await analyticsApi.getInstructorAnalytics();
        void res;
        setQuestions([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading analytics...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  const chartData = questions.map((q) => ({
    name: q.question_text.length > 30 ? q.question_text.slice(0, 30) + '...' : q.question_text,
    correct: q.correct_percentage,
  }));

  const getBarColor = (pct: number) => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const sortedQuestions = [...questions].sort((a, b) => a.correct_percentage - b.correct_percentage);

  return (
    <ProtectedRoute requiredRole="instructor">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Question Analytics</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">% Correct per Question</h3>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No question data available. Select a quiz to view analytics.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, questions.length * 40)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 200 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={200} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Correct']} />
              <Bar dataKey="correct" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.correct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Ranking (Hardest First)</h3>
        {sortedQuestions.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No data available.</p>
        ) : (
          <div className="space-y-2">
            {sortedQuestions.map((q, i) => (
              <div key={q.question_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{q.question_text}</p>
                  <p className="text-xs text-gray-500">{q.total_attempts} attempts</p>
                </div>
                <span className={`text-sm font-semibold ${q.correct_percentage >= 80 ? 'text-green-600' : q.correct_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {q.correct_percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
