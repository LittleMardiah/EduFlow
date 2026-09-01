import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { submissionApi } from '../../api/submission.api';
import { ResultsBreakdown } from '../../components/quiz/ResultsBreakdown';
import type { SubmissionResult } from '../../types/submission';

export default function QuizResultsPage() {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submission');

  const { data, isLoading, error } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: async () => {
      const res = await submissionApi.getSubmission(submissionId!);
      return res.data.data;
    },
    enabled: !!submissionId,
  });

  const result: SubmissionResult | undefined = data;

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading results...</div>;
  }

  if (error || !result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Results not found.</p>
        <Link to="/quizzes" className="text-indigo-600 hover:underline">Back to Quizzes</Link>
      </div>
    );
  }

  const percentage = result.max_score && result.max_score > 0
    ? Math.round(((result.score ?? 0) / result.max_score) * 100)
    : 0;

  const timeSpent = result.submitted_at && result.started_at
    ? Math.round((new Date(result.submitted_at).getTime() - new Date(result.started_at).getTime()) / 1000)
    : 0;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/quizzes" className="text-indigo-600 hover:text-indigo-800 text-sm">&larr; Back to Quizzes</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Quiz Results</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
            <div className="text-sm text-gray-500">Score</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.passed ? 'Passed' : 'Failed'}
            </div>
            <div className="text-sm text-gray-500">Status</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {result.score ?? 0}/{result.max_score ?? 0}
            </div>
            <div className="text-sm text-gray-500">Points</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{formatDuration(timeSpent)}</div>
            <div className="text-sm text-gray-500">Time Spent</div>
          </div>
        </div>
      </div>

      <ResultsBreakdown answers={result.answers} />
    </div>
  );
}
