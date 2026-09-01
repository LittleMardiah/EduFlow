import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import QuizListPage from './pages/quiz/QuizListPage';
import CreateQuizPage from './pages/quiz/CreateQuizPage';
import EditQuizPage from './pages/quiz/EditQuizPage';
import PreviewQuizPage from './pages/quiz/PreviewQuizPage';
import TakeQuizPage from './pages/quiz/TakeQuizPage';
import QuizResultsPage from './pages/quiz/QuizResultsPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import InstructorDashboard from './pages/dashboard/InstructorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import EventListPage from './pages/event/EventListPage';
import CreateEventPage from './pages/event/CreateEventPage';
import ManageParticipantsPage from './pages/event/ManageParticipantsPage';
import StudentAnalyticsPage from './pages/analytics/StudentAnalyticsPage';
import ClassAnalyticsPage from './pages/analytics/ClassAnalyticsPage';
import QuestionAnalyticsPage from './pages/analytics/QuestionAnalyticsPage';

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
                  <QuizListPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuizListPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes/create"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <CreateQuizPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes/:id/edit"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <EditQuizPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes/:id/preview"
            element={
              <ProtectedRoute>
                <Layout>
                  <PreviewQuizPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes/:id/take"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <TakeQuizPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes/:id/results"
            element={
              <ProtectedRoute>
                <Layout>
                  <QuizResultsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Dashboard routes by role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <StudentDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <InstructorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Event routes */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventListPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/create"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <CreateEventPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/participants"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <ManageParticipantsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Analytics routes */}
          <Route
            path="/analytics/student"
            element={
              <ProtectedRoute requiredRole="student">
                <Layout>
                  <StudentAnalyticsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/instructor"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <ClassAnalyticsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/questions"
            element={
              <ProtectedRoute requiredRole="instructor">
                <Layout>
                  <QuestionAnalyticsPage />
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
