'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/app/stores/authStore';
import { useUIStore } from '@/app/stores/uiStore';
import { quizApi } from '@/app/lib/apis/quiz.api';

interface QuizListProps {
  onLogout?: () => void;
}

export default function QuizList({ onLogout }: QuizListProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { addToast } = useUIStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await quizApi.getQuizzes();
      return res.data.data.quizzes;
    },
    retry: false,
  });

  const handleLogout = () => {
    logout();
    addToast({ type: 'success', message: 'Logged out successfully', duration: 3000 });
    router.replace('/login');
    onLogout?.();
  };

  if (isLoading) return <div className="p-4">Loading quizzes...</div>;
  if (error) {
    return <div className="p-4 text-red-500">Error: {(error as Error).message}</div>;
  }

  const quizzes = Array.isArray(data) ? data : [];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">EduFlow - Quiz Management</h1>
        <div className="flex gap-2">
          <Link
            href="/create-quiz"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create Quiz
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-gray-500">Belum ada quiz</p>
      ) : (
        <ul className="space-y-2">
          {quizzes.map((q) => (
            <li key={q.id} className="border p-3 rounded shadow-sm flex justify-between items-center">
              <div>
                <div className="font-medium">{q.title}</div>
                <div className="text-sm text-gray-500">Status: {q.status}</div>
              </div>
              <span className="text-xs text-gray-400">{q.quiz_type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
