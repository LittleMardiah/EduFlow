import { useState, useEffect } from 'react';
import { z } from 'zod';
import type { CreateQuizInput, Quiz, QuizType } from '../types/quiz';

const quizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  quiz_type: z.enum(['standard', 'ielts_simulation', 'timed_exam']),
  passing_score: z.number().min(0).max(100),
  duration_minutes: z.number().int().positive(),
  max_attempts: z.number().int().min(-1),
  randomize_questions: z.boolean().default(false),
  randomize_options: z.boolean().default(false),
});

type QuizFormData = z.infer<typeof quizSchema>;

interface QuizFormProps {
  initialData?: Quiz;
  onSubmit: (data: CreateQuizInput) => void;
  isLoading?: boolean;
}

export function QuizForm({ initialData, onSubmit, isLoading }: QuizFormProps) {
  const [formData, setFormData] = useState<QuizFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    quiz_type: initialData?.quiz_type || 'standard',
    passing_score: initialData?.passing_score || 60,
    duration_minutes: initialData?.duration_minutes || 30,
    max_attempts: initialData?.max_attempts || 1,
    randomize_questions: initialData?.randomize_questions ?? false,
    randomize_options: initialData?.randomize_options ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        quiz_type: initialData.quiz_type || 'standard',
        passing_score: initialData.passing_score || 60,
        duration_minutes: initialData.duration_minutes || 30,
        max_attempts: initialData.max_attempts || 1,
        randomize_questions: initialData.randomize_questions ?? false,
        randomize_options: initialData.randomize_options ?? false,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = quizSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Quiz title"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Description (optional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Quiz Type</label>
          <select
            value={formData.quiz_type}
            onChange={(e) => setFormData({ ...formData, quiz_type: e.target.value as QuizType })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="standard">Standard</option>
            <option value="ielts_simulation">IELTS Simulation</option>
            <option value="timed_exam">Timed Exam</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Passing Score (%)</label>
          <input
            type="number"
            value={formData.passing_score}
            onChange={(e) => setFormData({ ...formData, passing_score: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            min={0}
            max={100}
          />
          {errors.passing_score && <p className="text-red-500 text-sm">{errors.passing_score}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Duration (minutes)</label>
          <input
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            min={1}
          />
          {errors.duration_minutes && <p className="text-red-500 text-sm">{errors.duration_minutes}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Max Attempts</label>
          <input
            type="number"
            value={formData.max_attempts}
            onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            min={-1}
          />
          <p className="text-xs text-gray-500">-1 for unlimited</p>
          {errors.max_attempts && <p className="text-red-500 text-sm">{errors.max_attempts}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.randomize_questions}
            onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
          />
          Randomize Questions
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.randomize_options}
            onChange={(e) => setFormData({ ...formData, randomize_options: e.target.checked })}
          />
          Randomize Options
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : initialData ? 'Update Quiz' : 'Create Quiz'}
      </button>
    </form>
  );
}
