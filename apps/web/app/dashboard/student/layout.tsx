'use client';

import ProtectedRoute from '@/app/components/common/ProtectedRoute';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="student">{children}</ProtectedRoute>;
}