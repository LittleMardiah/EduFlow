import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { quizApi } from '../api/quiz.api';
import { useUIStore } from '../stores/uiStore';

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    quiz_type: 'standard' as 'standard' | 'ielts_simulation' | 'timed_exam',
    passing_score: 70,
    duration_minutes: 30,
    max_attempts: 1,
    organization_id: 'org-placeholder',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await quizApi.createQuiz(form);
      addToast({ type: 'success', message: 'Quiz created successfully!', duration: 3000 });
      navigate('/');
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
          ?.error?.message || 'Gagal membuat quiz'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="p-4">Unauthorized. Please login.</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Passing Score (%)</label>
            <input
              type="number"
              value={form.passing_score}
              onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium">Duration (minutes)</label>
            <input
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">Max Attempts</label>
          <input
            type="number"
            value={form.max_attempts}
            onChange={(e) => setForm({ ...form, max_attempts: Number(e.target.value) })}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
