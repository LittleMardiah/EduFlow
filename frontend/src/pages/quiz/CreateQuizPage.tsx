import { useNavigate } from 'react-router-dom';
import { useCreateQuiz } from '../../hooks/useQuiz';
import { useUIStore } from '../../stores/uiStore';
import { QuizForm } from '../../components/QuizForm';
import type { CreateQuizInput } from '../../types/quiz';

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const createQuiz = useCreateQuiz();

  const handleSubmit = (data: CreateQuizInput) => {
    createQuiz.mutate(data, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Quiz created successfully!', duration: 3000 });
        navigate('/quizzes');
      },
      onError: (err) => {
        addToast({
          type: 'error',
          message: (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Failed to create quiz',
          duration: 5000,
        });
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>
      <QuizForm onSubmit={handleSubmit} isLoading={createQuiz.isPending} />
    </div>
  );
}
