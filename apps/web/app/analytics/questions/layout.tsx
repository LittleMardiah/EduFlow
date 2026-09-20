'use client';

import ProtectedRoute from '@/app/components/common/ProtectedRoute';

export default function QuestionAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="instructor">{children}</ProtectedRoute>;
}