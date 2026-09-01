import type { SubmissionAnswer } from '../../types/submission';

interface ResultsBreakdownProps {
  answers: SubmissionAnswer[];
}

export function ResultsBreakdown({ answers }: ResultsBreakdownProps) {
  if (!answers || answers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No answer data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Answer Breakdown</h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Answer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correct Answer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {answers.map((a, idx) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{a.question_id}</td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {Array.isArray(a.answer) ? a.answer.join(', ') : (a.answer ?? '-')}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">-</td>
              <td className="px-6 py-4">
                {a.is_correct === null ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    Pending
                  </span>
                ) : a.is_correct ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Correct
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Incorrect
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">{a.score ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
