import type { Question } from '../../types/question';

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  onDelete: () => void;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  true_false: 'T/F',
  short_answer: 'Short Answer',
  essay: 'Essay',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export function QuestionCard({ question, index, total, onDelete, onEdit, onMoveUp, onMoveDown }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-start gap-4">
      <div className="flex flex-col gap-1 pt-1">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
          aria-label="Move up"
        >
          &#9650;
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
          aria-label="Move down"
        >
          &#9660;
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500">Q{index + 1}</span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
            {TYPE_LABELS[question.question_type] ?? question.question_type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[question.difficulty_level] ?? ''}`}>
            {question.difficulty_level}
          </span>
          <span className="text-xs text-gray-500">{question.points}pt</span>
          {question.ielts_section && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{question.ielts_section}</span>
          )}
          {question.manual_review && (
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Manual Review</span>
          )}
        </div>
        <p className="text-sm text-gray-900 truncate">{question.question_text}</p>
      </div>

      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1">Edit</button>
        <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm px-2 py-1">Delete</button>
      </div>
    </div>
  );
}
