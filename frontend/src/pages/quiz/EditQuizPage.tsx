import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz, useUpdateQuiz, usePublishQuiz, useDeleteQuiz } from '../../hooks/useQuiz';
import { useUIStore } from '../../stores/uiStore';
import { QuizForm } from '../../components/QuizForm';
import type { CreateQuizInput } from '../../types/quiz';

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const { data: quiz, isLoading: quizLoading } = useQuiz(id!);
  const updateQuiz = useUpdateQuiz();
  const publishQuiz = usePublishQuiz();
  const deleteQuiz = useDeleteQuiz();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (data: CreateQuizInput) => {
    updateQuiz.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Quiz updated successfully!', duration: 3000 });
          navigate('/quizzes');
        },
        onError: (err) => {
          addToast({
            type: 'error',
            message: (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Failed to update quiz',
            duration: 5000,
          });
        },
      }
    );
  };

  const handlePublish = () => {
    publishQuiz.mutate(id!, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Quiz published!', duration: 3000 });
        navigate('/quizzes');
      },
      onError: (err) => {
        addToast({
          type: 'error',
          message: (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Failed to publish quiz',
          duration: 5000,
        });
      },
    });
  };

  const handleDelete = () => {
    deleteQuiz.mutate(id!, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Quiz deleted.', duration: 3000 });
        navigate('/quizzes');
      },
      onError: (err) => {
        addToast({
          type: 'error',
          message: (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Failed to delete quiz',
          duration: 5000,
        });
      },
    });
  };

  if (quizLoading) {
    return <div className="text-center py-12 text-gray-500">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-12 text-red-500">Quiz not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Quiz</h1>
        <div className="flex gap-2">
          {quiz.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishQuiz.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {publishQuiz.isPending ? 'Publishing...' : 'Publish'}
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <QuizForm initialData={quiz} onSubmit={handleSubmit} isLoading={updateQuiz.isPending} />
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete &quot;{quiz.title}&quot;? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteQuiz.isPending} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteQuiz.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
