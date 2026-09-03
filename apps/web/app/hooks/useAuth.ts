import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/authStore';
import { useUIStore } from '@/app/stores/uiStore';
import { authApi } from '@/app/lib/apis/auth.api';
import type { LoginRequest, RegisterRequest, UserRole, ApiError } from '@/app/types/auth';

interface NavigableError {
  response?: { data?: ApiError };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as NavigableError;
    return e.response?.data?.error?.message || fallback;
  }
  return fallback;
}

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, setAuth, setLoading, logout } =
    useAuthStore();
  const { addToast } = useUIStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setLoading(true);
      try {
        const res = await authApi.login(credentials);
        const { user: loggedUser, token: accessToken } = res.data.data;
        setAuth(loggedUser, accessToken);
        addToast({ type: 'success', message: 'Logged in successfully!', duration: 3000 });
        router.replace(getHomePath(loggedUser.role));
        return true;
      } catch (error) {
        addToast({
          type: 'error',
          message: getErrorMessage(error, 'Login failed. Please try again.'),
          duration: 5000,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, addToast, router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setLoading(true);
      try {
        await authApi.register(data);
        addToast({
          type: 'success',
          message: 'Registration successful! Please login.',
          duration: 3000,
        });
        router.replace('/login');
        return true;
      } catch (error) {
        addToast({
          type: 'error',
          message: getErrorMessage(error, 'Registration failed. Please try again.'),
          duration: 5000,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, addToast, router]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    logout();
    router.replace('/login');
  }, [logout, router]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
}

export function getHomePath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'instructor':
      return '/instructor/dashboard';
    default:
      return '/dashboard';
  }
}
