import { useState } from 'react';
import { z } from 'zod';
import { OptionManager } from './OptionManager';
import { IELTSSectionSelect } from './IELTSSectionSelect';
import type { Option, IELTSSection, QuestionType, DifficultyLevel } from '../types/question';

const questionSchema = z.object({
  question_text: z.string().min(5, 'Question text must be at least 5 characters'),
  question_type: z.enum(['mcq', 'true_false', 'short_answer', 'essay']),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  points: z.number().int().positive().default(1),
  ielts_section: z.enum(['Listening', 'Reading', 'Writing', 'Speaking'] as [IELTSSection, ...IELTSSection[]]).optional(),
  explanation: z.string().optional(),
  correct_answer: z.string().optional(),
  fuzzy_threshold: z.number().min(0).max(1).optional(),
  manual_review: z.boolean().default(false),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  initialData?: Partial<QuestionFormData> & { options?: Option[] };
  onSubmit: (data: QuestionFormData & { options?: Option[] }) => void;
  isLoading?: boolean;
}

export function QuestionForm({ initialData, onSubmit, isLoading }: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: initialData?.question_text || '',
    question_type: initialData?.question_type || 'mcq',
    difficulty_level: initialData?.difficulty_level || 'medium',
    points: initialData?.points || 1,
    ielts_section: initialData?.ielts_section || undefined,
    explanation: initialData?.explanation || '',
    correct_answer: initialData?.correct_answer || '',
    fuzzy_threshold: initialData?.fuzzy_threshold || 0.85,
    manual_review: initialData?.manual_review || false,
  });
  const [options, setOptions] = useState<Option[]>(initialData?.options || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = questionSchema.safeParse(formData);
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

    const payload = { ...result.data } as QuestionFormData & { options?: Option[] };
    if (formData.question_type === 'mcq' || formData.question_type === 'true_false') {
      if (options.length < 2) {
        setErrors({ options: 'MCQ must have at least 2 options' });
        return;
      }
      payload.options = options;
    }
    onSubmit(payload);
  };

  const renderTypeFields = () => {
    switch (formData.question_type) {
      case 'mcq':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Options (MCQ)</label>
            <OptionManager options={options} onChange={setOptions} maxOptions={10} />
            {errors.options && <p className="text-red-500 text-sm">{errors.options}</p>}
          </div>
        );
      case 'true_false':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Correct Answer</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tf_correct"
                  checked={formData.correct_answer === 'true'}
                  onChange={() => setFormData({ ...formData, correct_answer: 'true' })}
                />
                True
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tf_correct"
                  checked={formData.correct_answer === 'false'}
                  onChange={() => setFormData({ ...formData, correct_answer: 'false' })}
                />
                False
              </label>
            </div>
          </div>
        );
      case 'short_answer':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Correct Answer(s)</label>
            <input
              type="text"
              value={formData.correct_answer || ''}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g. Paris"
            />
            <div>
              <label className="block text-sm font-medium">Fuzzy Threshold (0-1)</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={formData.fuzzy_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, fuzzy_threshold: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500">Higher = stricter matching</p>
              {errors.fuzzy_threshold && <p className="text-red-500 text-sm">{errors.fuzzy_threshold}</p>}
            </div>
          </div>
        );
      case 'essay':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.manual_review}
                onChange={(e) => setFormData({ ...formData, manual_review: e.target.checked })}
              />
              Require manual review (instructor grading)
            </label>
            <div>
              <label className="block text-sm font-medium">Explanation / Rubric</label>
              <textarea
                value={formData.explanation || ''}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Grading guidelines or explanation..."
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Question Text *</label>
        <textarea
          value={formData.question_text}
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Enter question text..."
        />
        {errors.question_text && <p className="text-red-500 text-sm">{errors.question_text}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Question Type</label>
          <select
            value={formData.question_type}
            onChange={(e) =>
              setFormData({ ...formData, question_type: e.target.value as QuestionType })
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
            <option value="essay">Essay</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Difficulty</label>
          <select
            value={formData.difficulty_level}
            onChange={(e) =>
              setFormData({ ...formData, difficulty_level: e.target.value as DifficultyLevel })
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Points</label>
          <input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            min={1}
          />
          {errors.points && <p className="text-red-500 text-sm">{errors.points}</p>}
        </div>
        <IELTSSectionSelect
          value={formData.ielts_section}
          onChange={(val) => setFormData({ ...formData, ielts_section: val || undefined })}
        />
      </div>

      {renderTypeFields()}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : initialData ? 'Update Question' : 'Add Question'}
      </button>
    </form>
  );
}
