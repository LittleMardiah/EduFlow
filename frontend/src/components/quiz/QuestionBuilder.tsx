import { useState } from 'react';
import { QuestionForm } from '../QuestionForm';
import { QuestionList } from './QuestionList';
import apiClient from '../../api/client';
import type { Question, Option } from '../../types/question';

interface QuestionBuilderProps {
  quizId: string;
}

export function QuestionBuilder({ quizId }: QuestionBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchQuestions = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: Question[] }>(
        `/quizzes/${quizId}/questions`
      );
      setQuestions(res.data.data);
    } catch {
      // ignore
    }
  };

  const handleAddQuestion = async (data: { question_text: string; question_type: string; difficulty_level?: string; points?: number; ielts_section?: string; explanation?: string; correct_answer?: string; fuzzy_threshold?: number; manual_review?: boolean; options?: Option[] }) => {
    setLoading(true);
    try {
      await apiClient.post(`/quizzes/${quizId}/questions`, {
        ...data,
        order_in_quiz: questions.length + 1,
      });
      await fetchQuestions();
    } catch {
      // error handled by caller
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await apiClient.delete(`/quizzes/${quizId}/questions/${questionId}`);
      await fetchQuestions();
    } catch {
      // ignore
    }
  };

  const handleReorder = async (questionId: string, direction: 'up' | 'down') => {
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;

    const newOrder = [...questions];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      for (let i = 0; i < newOrder.length; i++) {
        await apiClient.patch(`/quizzes/${quizId}/questions/${newOrder[i].id}`, {
          order_in_quiz: i + 1,
        });
      }
      await fetchQuestions();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <QuestionList
        questions={questions}
        onDelete={handleDeleteQuestion}
        onEdit={(q) => setEditingQuestion(q)}
        onReorder={handleReorder}
        onRefresh={fetchQuestions}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </h3>
        <QuestionForm
          initialData={editingQuestion ? {
            question_text: editingQuestion.question_text,
            question_type: editingQuestion.question_type,
            difficulty_level: editingQuestion.difficulty_level,
            points: editingQuestion.points,
            ielts_section: editingQuestion.ielts_section ?? undefined,
            explanation: editingQuestion.explanation ?? undefined,
            correct_answer: editingQuestion.correct_answer ?? undefined,
            fuzzy_threshold: editingQuestion.fuzzy_threshold ?? undefined,
            manual_review: editingQuestion.manual_review,
            options: editingQuestion.options,
          } : undefined}
          onSubmit={(data) => {
            if (editingQuestion) {
              // TODO: implement edit via PUT
              handleAddQuestion(data);
            } else {
              handleAddQuestion(data);
            }
            setEditingQuestion(null);
          }}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
