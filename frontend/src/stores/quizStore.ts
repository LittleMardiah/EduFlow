import { create } from 'zustand';
import { Quiz } from '../api/quiz.api';

interface QuizStore {
  selectedQuizId: string | null;
  quizzes: Quiz[];
  setSelectedQuizId: (id: string | null) => void;
  setQuizzes: (quizzes: Quiz[]) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (quiz: Quiz) => void;
  removeQuiz: (id: string) => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  selectedQuizId: null,
  quizzes: [],
  setSelectedQuizId: (id) => set({ selectedQuizId: id }),
  setQuizzes: (quizzes) => set({ quizzes }),
  addQuiz: (quiz) => set((state) => ({ quizzes: [...state.quizzes, quiz] })),
  updateQuiz: (quiz) => set((state) => ({
    quizzes: state.quizzes.map((q) => q.id === quiz.id ? quiz : q),
  })),
  removeQuiz: (id) => set((state) => ({
    quizzes: state.quizzes.filter((q) => q.id !== id),
  })),
}));
