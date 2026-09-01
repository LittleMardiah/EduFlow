interface StudentRow {
  student_id: string;
  student_name: string;
  score: number | null;
  passed: boolean | null;
  status: string;
}

interface CohortReportProps {
  students: StudentRow[];
  classAverage: number;
  median: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  accepted: 'bg-blue-100 text-blue-800',
  invited: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function CohortReport({ students, classAverage, median }: CohortReportProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Report</h3>
      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-gray-600">
          Class Average: <span className="font-semibold text-gray-900">{classAverage.toFixed(1)}%</span>
        </span>
        <span className="text-gray-600">
          Median: <span className="font-semibold text-gray-900">{median.toFixed(1)}%</span>
        </span>
        <span className="text-gray-600">
          Total: <span className="font-semibold text-gray-900">{students.length}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Best Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((s) => (
              <tr key={s.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.student_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {s.score !== null ? `${s.score.toFixed(1)}%` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">1</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {s.passed === true ? 'Passed' : s.passed === false ? 'Failed' : s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
