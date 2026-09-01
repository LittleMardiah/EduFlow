import { useEffect } from 'react';
import { QuestionCard } from './QuestionCard';
import type { Question } from '../../types/question';

interface QuestionListProps {
  questions: Question[];
  onDelete: (id: string) => void;
  onEdit: (question: Question) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  onRefresh: () => void;
}

export function QuestionList({ questions, onDelete, onEdit, onReorder, onRefresh }: QuestionListProps) {
  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
        No questions yet. Use the form below to add questions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          total={questions.length}
          onDelete={() => onDelete(q.id)}
          onEdit={() => onEdit(q)}
          onMoveUp={() => onReorder(q.id, 'up')}
          onMoveDown={() => onReorder(q.id, 'down')}
        />
      ))}
    </div>
  );
}
