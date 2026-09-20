'use client';

import ProtectedRoute from '@/app/components/common/ProtectedRoute';

export default function InstructorAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="instructor">{children}</ProtectedRoute>;
}