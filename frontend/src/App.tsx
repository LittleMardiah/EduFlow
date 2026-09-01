import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import QuizList from './components/QuizList';
import CreateQuizPage from './pages/CreateQuizPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<div className="p-10 text-center text-xl">Unauthorized access</div>} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuizList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-quiz"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateQuizPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Placeholder dashboards for RBAC roles */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <div className="p-8 text-center text-2xl font-semibold">
                    Student Dashboard
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <div className="p-8 text-center text-2xl font-semibold">
                    Instructor Dashboard
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <div className="p-8 text-center text-2xl font-semibold">
                    Admin Dashboard
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
