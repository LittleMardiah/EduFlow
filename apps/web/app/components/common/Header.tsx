'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/app/stores/authStore';
import { useUIStore } from '@/app/stores/uiStore';
import { authApi } from '@/app/lib/apis/auth.api';

export default function Header() {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    useAuthStore.getState().logout();
    useUIStore.getState().addToast({
      type: 'success',
      message: 'Logged out successfully',
      duration: 3000,
    });
    router.replace('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          EduFlow
        </Link>
        <nav className="flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/" className="text-gray-700 hover:text-indigo-600">
                Quizzes
              </Link>
              <span className="text-sm text-gray-500">({user.role})</span>
              <span className="text-gray-700">
                Welcome, {user.first_name} {user.last_name}
              </span>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
