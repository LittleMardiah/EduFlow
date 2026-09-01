import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../api/analytics.api';
import { quizApi } from '../../api/quiz.api';
import { eventApi } from '../../api/event.api';
import StatCard from '../../components/dashboard/StatCard';
import CohortReport from '../../components/dashboard/CohortReport';
import ScoreDistribution from '../../components/dashboard/ScoreDistribution';
import type { InstructorAnalytics } from '../../types/analytics';
import type { Quiz } from '../../types/quiz';
import type { Event } from '../../types/event';

export default function InstructorDashboard() {
  const [analytics, setAnalytics] = useState<InstructorAnalytics | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, quizzesRes, eventsRes] = await Promise.all([
          analyticsApi.getInstructorAnalytics(),
          quizApi.getQuizzes({ limit: 5 }),
          eventApi.getEvents({ limit: 5 }),
        ]);
        setAnalytics(analyticsRes.data.data);
        setQuizzes(quizzesRes.data.data.quizzes);
        setEvents(eventsRes.data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  const cohortStudents = analytics?.score_distribution.map((_, i) => ({
    student_id: `student-${i}`,
    student_name: `Student ${i + 1}`,
    score: null as number | null,
    passed: null as boolean | null,
    status: 'completed',
  })) ?? [];

  const distData = analytics?.score_distribution.map((d) => ({
    bin: d.bucket,
    count: d.count,
  })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Quizzes" value={analytics?.total_quizzes ?? 0} color="indigo" />
        <StatCard title="Total Students" value={analytics?.total_students ?? 0} color="green" />
        <StatCard title="Total Submissions" value={analytics?.total_submissions ?? 0} color="blue" />
        <StatCard title="Avg Score" value={`${(analytics?.average_score ?? 0).toFixed(1)}%`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Quizzes</h2>
            <Link to="/quizzes/create" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
              + Create Quiz
            </Link>
          </div>
          {quizzes.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No quizzes yet.</p>
          ) : (
            <div className="space-y-2">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{quiz.title}</p>
                    <p className="text-sm text-gray-500">{quiz.total_questions} questions</p>
                  </div>
                  <Link to={`/quizzes/${quiz.id}/edit`} className="text-indigo-600 hover:text-indigo-800 text-sm">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link to="/events/create" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
              + Create Event
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No events yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.scheduled_start_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScoreDistribution data={distData} title="Score Distribution" />
      <CohortReport students={cohortStudents} classAverage={analytics?.average_score ?? 0} median={analytics?.average_score ?? 0} />
    </div>
  );
}
