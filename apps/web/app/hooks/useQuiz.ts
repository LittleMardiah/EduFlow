import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/app/lib/apis/quiz.api';
import type { CreateQuizInput } from '@/app/types/quiz';

export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters?: { status?: string; page?: number; limit?: number }) => [...quizKeys.lists(), filters] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
};

export function useQuizzes(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: quizKeys.list(filters),
    queryFn: async () => {
      const res = await quizApi.getQuizzes(filters);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: async () => {
      const res = await quizApi.getQuiz(id);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuizInput) => quizApi.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateQuizInput> }) =>
      quizApi.updateQuiz(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(res.data.data.id) });
    },
  });
}

export function usePublishQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.publishQuiz(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(res.data.data.id) });
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}
