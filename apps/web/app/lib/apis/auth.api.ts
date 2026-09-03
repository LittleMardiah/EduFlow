import apiClient from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/app/types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  logout: () =>
    apiClient.post<{ success: boolean; message: string }>('/auth/logout'),

  verify: () =>
    apiClient.post<{ success: boolean; data: { user: User } }>('/auth/verify'),
};
