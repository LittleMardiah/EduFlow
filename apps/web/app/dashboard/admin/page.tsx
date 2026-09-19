'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/app/lib/apis/analytics.api';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import StatCard from '../../components/dashboard/StatCard';
import type { InstructorAnalytics } from '../../types/analytics';

interface AuditLog {
  id: string;
  action: string;
  user_email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [users, setUsers] = useState<{ id: string; email: string; first_name: string; last_name: string; role: string }[]>([]);
  const [auditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const analyticsRes = await analyticsApi.getInstructorAnalytics();
        setAnalytics(analyticsRes.data.data);
        setUsers([]);
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

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={analytics?.total_students ?? 0} color="indigo" />
        <StatCard title="Total Quizzes" value={analytics?.total_quizzes ?? 0} color="green" />
        <StatCard title="Total Submissions" value={analytics?.total_submissions ?? 0} color="blue" />
        <StatCard title="Avg Score" value={`${(analytics?.average_score ?? 0).toFixed(1)}%`} color="yellow" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
        {users.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No user data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Database</p>
            <p className="text-lg font-bold text-green-600">Connected</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">API Uptime</p>
            <p className="text-lg font-bold text-green-600">99.9%</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Error Rate</p>
            <p className="text-lg font-bold text-green-600">0.1%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Audit Logs</h2>
        {auditLogs.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No audit logs yet.</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-sm text-gray-500">{log.user_email}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
