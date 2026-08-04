import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface QuizListProps {
  token: string;
  onLogout: () => void;
}

export default function QuizList({ token, onLogout }: QuizListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // RESPONSE: { success: true, data: { quizzes: [...], total, page, limit } }
      return res.data?.data?.quizzes || [];
    },
    retry: false,
  });

  if (isLoading) return <div className="p-4">Loading quizzes...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {(error as any).message}</div>;

  const quizzes = Array.isArray(data) ? data : [];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">EduFlow - Quiz Management</h1>
        <div className="flex gap-2">
          <Link
            to="/create-quiz"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create Quiz
          </Link>
          <button
            onClick={onLogout}
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
          {quizzes.map((q: any) => (
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
