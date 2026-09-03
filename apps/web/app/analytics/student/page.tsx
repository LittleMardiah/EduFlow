'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/app/lib/apis/analytics.api';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import type { StudentAnalytics } from '../../types/analytics';

export default function StudentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsApi.getStudentAnalytics();
        setAnalytics(res.data.data);
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

  const trendData = analytics?.quiz_history.map((h) => ({
    date: new Date(h.submitted_at).toLocaleDateString(),
    score: h.max_score > 0 ? Math.round((h.score / h.max_score) * 100) : 0,
  })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Quizzes" value={analytics?.completed_count ?? 0} color="indigo" />
        <StatCard title="Average Score" value={`${(analytics?.average_score ?? 0).toFixed(1)}%`} color="green" />
        <StatCard title="Pass Rate" value={`${(analytics?.pass_rate ?? 0).toFixed(1)}%`} color="blue" />
        <StatCard title="Best Score" value={`${(analytics?.best_score ?? 0).toFixed(1)}%`} color="purple" />
      </div>

      <PerformanceChart data={trendData} title="Performance Over Time" />

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz History</h2>
        {analytics?.quiz_history && analytics.quiz_history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.quiz_history.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{h.quiz_title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {h.score}/{h.max_score} ({h.max_score > 0 ? Math.round((h.score / h.max_score) * 100) : 0}%)
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${h.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {h.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(h.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No quiz history yet.</p>
        )}
      </div>
    </div>
  );
}
