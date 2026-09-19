'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/app/lib/apis/analytics.api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import StatCard from '../../components/dashboard/StatCard';
import ScoreDistribution from '../../components/dashboard/ScoreDistribution';
import CohortReport from '../../components/dashboard/CohortReport';
import type { InstructorAnalytics } from '../../types/analytics';

export default function ClassAnalyticsPage() {
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsApi.getInstructorAnalytics();
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

  const distData = analytics?.score_distribution.map((d) => ({
    bin: d.bucket,
    count: d.count,
  })) ?? [];

  return (
    <ProtectedRoute requiredRole="instructor">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Class Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={analytics?.total_students ?? 0} color="indigo" />
        <StatCard title="Average Score" value={`${(analytics?.average_score ?? 0).toFixed(1)}%`} color="green" />
        <StatCard title="Pass Rate" value={`${(analytics?.pass_rate ?? 0).toFixed(1)}%`} color="blue" />
        <StatCard title="Total Submissions" value={analytics?.total_submissions ?? 0} color="purple" />
      </div>

      <ScoreDistribution data={distData} title="Score Distribution" />

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Performance Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg text-center">
            <p className="text-sm text-indigo-600">Total Students</p>
            <p className="text-3xl font-bold text-indigo-700">{analytics?.total_students ?? 0}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-green-600">Avg Score</p>
            <p className="text-3xl font-bold text-green-700">{(analytics?.average_score ?? 0).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-blue-600">Pass Rate</p>
            <p className="text-3xl font-bold text-blue-700">{(analytics?.pass_rate ?? 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <CohortReport
        students={[]}
        classAverage={analytics?.average_score ?? 0}
        median={analytics?.average_score ?? 0}
      />
      </div>
    </ProtectedRoute>
  );
}
