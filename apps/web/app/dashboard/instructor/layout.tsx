'use client';

import ProtectedRoute from '@/app/components/common/ProtectedRoute';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="instructor">{children}</ProtectedRoute>;
}