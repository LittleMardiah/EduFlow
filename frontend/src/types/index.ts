export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'instructor' | 'student';
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}
