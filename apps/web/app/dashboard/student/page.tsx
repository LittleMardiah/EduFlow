'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsApi } from '@/app/lib/apis/analytics.api';
import { quizApi } from '@/app/lib/apis/quiz.api';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import type { StudentAnalytics } from '../../types/analytics';
import type { Quiz } from '../../types/quiz';

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, quizzesRes] = await Promise.all([
          analyticsApi.getStudentAnalytics(),
          quizApi.getQuizzes({ status: 'published', limit: 5 }),
        ]);
        setAnalytics(analyticsRes.data.data);
        setQuizzes(quizzesRes.data.data.quizzes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  const trendData = analytics?.quiz_history.map((h) => ({
    date: new Date(h.submitted_at).toLocaleDateString(),
    score: h.max_score > 0 ? Math.round((h.score / h.max_score) * 100) : 0,
  })) ?? [];

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Quizzes Completed" value={analytics?.completed_count ?? 0} color="indigo" />
        <StatCard title="Average Score" value={`${(analytics?.average_score ?? 0).toFixed(1)}%`} color="green" />
        <StatCard title="Pass Rate" value={`${(analytics?.pass_rate ?? 0).toFixed(1)}%`} color="blue" />
        <StatCard title="Total Attempts" value={analytics?.total_attempts ?? 0} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assigned Quizzes</h2>
          <Link href="/quizzes" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All
          </Link>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No quizzes assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{quiz.title}</p>
                  <p className="text-sm text-gray-500">{quiz.total_questions} questions · {quiz.duration_minutes}m</p>
                </div>
                <Link
                  href={`/quizzes/${quiz.id}/take`}
                  className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                >
                  Take Quiz
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <PerformanceChart data={trendData} title="Performance Over Time" />
    </div>
  );
}
