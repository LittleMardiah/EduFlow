import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventApi } from '../../api/event.api';
import type { EventParticipant } from '../../types/event';

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function ManageParticipantsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadParticipants = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const res = await eventApi.getParticipants(eventId);
      setParticipants(res.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleAddParticipant = async () => {
    if (!eventId || !email.trim()) return;
    setIsAdding(true);
    try {
      await eventApi.addParticipant(eventId, email.trim());
      setEmail('');
      await loadParticipants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (participantId: string) => {
    if (!eventId) return;
    try {
      await eventApi.removeParticipant(eventId, participantId);
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove participant');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Participants</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Add Participant</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@email.com"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
          />
          <button
            onClick={handleAddParticipant}
            disabled={isAdding || !email.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {isAdding ? 'Adding...' : 'Add'}
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2">Bulk CSV upload coming soon.</p>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-500">Loading participants...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No participants yet.</td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {p.student ? `${p.student.first_name} ${p.student.last_name}` : p.student_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.student?.email ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[p.status] ?? 'bg-gray-100'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleRemove(p.id)} className="text-red-600 hover:text-red-800 text-sm">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
