'use client';

import { redirect } from 'next/navigation';
import { useAuthStore } from '@/app/stores/authStore';
import type { UserRole } from '@/app/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    redirect('/auth/login');
  }

  if (requiredRole && user && user.role !== requiredRole) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
