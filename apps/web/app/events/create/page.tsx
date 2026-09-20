'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventApi } from '@/app/lib/apis/event.api';
import { quizApi } from '@/app/lib/apis/quiz.api';
import type { Quiz } from '../../types/quiz';

export default function CreateEventPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    quiz_id: '',
    scheduled_start_at: '',
    scheduled_end_at: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    max_participants: '',
    allow_retakes: false,
    show_answers: 'after_deadline' as 'immediately' | 'after_deadline' | 'never',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    quizApi.getQuizzes({ status: 'published', limit: 50 }).then((res) => {
      setQuizzes(res.data.data.quizzes);
    });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.quiz_id) errs.quiz_id = 'Quiz is required';
    if (!form.scheduled_start_at) errs.scheduled_start_at = 'Start time is required';
    if (!form.scheduled_end_at) errs.scheduled_end_at = 'End time is required';
    if (form.scheduled_start_at && form.scheduled_end_at) {
      if (new Date(form.scheduled_end_at) <= new Date(form.scheduled_start_at)) {
        errs.scheduled_end_at = 'End time must be after start time';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await eventApi.createEvent({
        title: form.title,
        description: form.description || undefined,
        quiz_id: form.quiz_id,
        scheduled_start_at: form.scheduled_start_at,
        scheduled_end_at: form.scheduled_end_at,
        timezone: form.timezone,
        max_participants: form.max_participants ? Number(form.max_participants) : undefined,
        allow_retakes: form.allow_retakes,
        show_answers: form.show_answers,
      });
      router.push('/events');
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create event' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Event title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows={3}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quiz *</label>
          <select
            value={form.quiz_id}
            onChange={(e) => setForm({ ...form, quiz_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Select a quiz</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
          {errors.quiz_id && <p className="text-red-500 text-sm mt-1">{errors.quiz_id}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time *</label>
            <input
              type="datetime-local"
              value={form.scheduled_start_at}
              onChange={(e) => setForm({ ...form, scheduled_start_at: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {errors.scheduled_start_at && <p className="text-red-500 text-sm mt-1">{errors.scheduled_start_at}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time *</label>
            <input
              type="datetime-local"
              value={form.scheduled_end_at}
              onChange={(e) => setForm({ ...form, scheduled_end_at: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {errors.scheduled_end_at && <p className="text-red-500 text-sm mt-1">{errors.scheduled_end_at}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <input
            type="text"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
          <input
            type="number"
            value={form.max_participants}
            onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Unlimited"
            min={1}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.allow_retakes}
            onChange={(e) => setForm({ ...form, allow_retakes: e.target.checked })}
            className="rounded"
            id="allow_retakes"
          />
          <label htmlFor="allow_retakes" className="text-sm text-gray-700">Allow Retakes</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Answers</label>
          <select
            value={form.show_answers}
            onChange={(e) => setForm({ ...form, show_answers: e.target.value as typeof form.show_answers })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="immediately">Immediately</option>
            <option value="after_deadline">After Deadline</option>
            <option value="never">Never</option>
          </select>
        </div>

        {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/events')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
