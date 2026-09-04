import { EventParticipantService } from '../../src/services/EventParticipantService';
import { EventParticipantRepository } from '../../src/repositories/EventParticipantRepository';
import { eventService } from '../../src/services/EventService';
import { getUserById } from '../../src/repositories/user.repository';

jest.mock('../../src/repositories/EventParticipantRepository', () => {
  const repoInstance = {
    findByEventAndStudent: jest.fn(),
    countByEvent: jest.fn(),
    addParticipant: jest.fn(),
    findByEvent: jest.fn(),
    getParticipantById: jest.fn(),
    updateStatus: jest.fn(),
    removeParticipant: jest.fn(),
    markAttended: jest.fn(),
    updateSubmissionId: jest.fn(),
  };
  return {
    __repoInstance: repoInstance,
    EventParticipantRepository: jest.fn().mockImplementation(() => repoInstance),
  };
});

jest.mock('../../src/services/EventService', () => ({
  eventService: {
    getEventDetails: jest.fn(),
    updateEvent: jest.fn(),
  },
  EventService: jest.fn(),
}));

jest.mock('../../src/repositories/user.repository', () => ({
  getUserById: jest.fn(),
}));

const repo: any = (jest.requireMock('../../src/repositories/EventParticipantRepository') as any).__repoInstance;
const service = new EventParticipantService();
const svc = service as any;

describe('EventParticipantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addParticipant', () => {
    it('throws when event not found / no permission', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue(null);
      await expect(service.addParticipant('evt', 'stu', 'inst')).rejects.toThrow(
        'Event not found or you do not have permission'
      );
    });

    it('throws when event is completed', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'completed' });
      await expect(service.addParticipant('evt', 'stu', 'inst')).rejects.toThrow(
        'Cannot add participants to a completed or cancelled event'
      );
    });

    it('throws when event is cancelled', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'cancelled' });
      await expect(service.addParticipant('evt', 'stu', 'inst')).rejects.toThrow(
        'Cannot add participants to a completed or cancelled event'
      );
    });

    it('throws when student not found', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'scheduled' });
      (getUserById as jest.Mock).mockResolvedValue(null);
      await expect(service.addParticipant('evt', 'stu', 'inst')).rejects.toThrow('Student not found');
    });

    it('throws when student already registered', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'scheduled' });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'stu' });
      (repo.findByEventAndStudent as jest.Mock).mockResolvedValue({ id: 'p1' });
      await expect(service.addParticipant('evt', 'stu', 'inst')).rejects.toThrow(
        'Student already registered for this event'
      );
    });

    it('throws when event reached max participants', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'scheduled', max_participants: 2 });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'stu' });
      (repo.findByEventAndStudent as jest.Mock).mockResolvedValue(null);
      (repo.countByEvent as jest.Mock).mockResolvedValue(2);
      await expect(service.addParticipant('evt', 'stu', 'inst')).rejects.toThrow(
        'Event has reached maximum participants'
      );
    });

    it('does not apply max check when max_participants is null/0', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'scheduled', max_participants: null });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'stu' });
      (repo.findByEventAndStudent as jest.Mock).mockResolvedValue(null);
      (repo.addParticipant as jest.Mock).mockResolvedValue({ id: 'p1', status: 'invited' });
      (repo.countByEvent as jest.Mock).mockResolvedValue(1);

      await service.addParticipant('evt', 'stu', 'inst');

      expect(repo.addParticipant).toHaveBeenCalledWith('evt', 'stu', 'invited');
      expect(eventService.updateEvent).toHaveBeenCalledWith('evt', { max_participants: 1 }, 'inst');
    });

    it('adds participant and updates denormalized count', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ status: 'scheduled', max_participants: 100 });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'stu' });
      (repo.findByEventAndStudent as jest.Mock).mockResolvedValue(null);
      (repo.countByEvent as jest.Mock).mockResolvedValue(3);
      const participant = { id: 'p1', status: 'invited' };
      (repo.addParticipant as jest.Mock).mockResolvedValue(participant);

      const result = await service.addParticipant('evt', 'stu', 'inst');

      expect(result).toEqual(participant);
      expect(eventService.updateEvent).toHaveBeenCalledWith('evt', { max_participants: 3 }, 'inst');
    });
  });

  describe('bulkAddParticipants', () => {
    it('adds all students successfully', async () => {
      jest.spyOn(service as any, 'addParticipant').mockResolvedValue({ id: 'p' });
      const result = await service.bulkAddParticipants('evt', ['s1', 's2'], 'inst');
      expect(result.totalAdded).toBe(2);
      expect(result.totalFailed).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('collects per-student errors without aborting', async () => {
      const addSpy = jest.spyOn(service as any, 'addParticipant');
      addSpy.mockImplementation(async (eventId: string, studentId: string) => {
        if (studentId === 'bad') throw new Error('Student not found');
        return { id: 'ok' };
      });

      const result = await service.bulkAddParticipants('evt', ['good', 'bad', 'good2'], 'inst');

      expect(result.totalAdded).toBe(2);
      expect(result.totalFailed).toBe(1);
      expect(result.errors[0]).toMatchObject({ studentId: 'bad', error: 'Student not found' });
    });

    it('handles empty student list', async () => {
      jest.spyOn(service as any, 'addParticipant').mockResolvedValue({ id: 'p' });
      const result = await service.bulkAddParticipants('evt', [], 'inst');
      expect(result.totalAdded).toBe(0);
      expect(result.totalFailed).toBe(0);
    });
  });

  describe('getParticipants', () => {
    it('throws when event not found', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue(null);
      await expect(service.getParticipants('evt', 'user', 'instructor', {})).rejects.toThrow(
        'Event not found or you do not have permission'
      );
    });

    it('returns participants from repo', async () => {
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      const list = [{ id: 'p1' }, { id: 'p2' }];
      (repo.findByEvent as jest.Mock).mockResolvedValue(list);
      const result = await service.getParticipants('evt', 'user', 'admin', { status: 'invited' });
      expect(result).toEqual(list);
      expect(repo.findByEvent).toHaveBeenCalledWith('evt', { status: 'invited' });
    });
  });

  describe('updateParticipantStatus', () => {
    it('throws when participant not found', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue(null);
      await expect(service.updateParticipantStatus('p1', 'registered', 'u', 'instructor')).rejects.toThrow(
        'Participant not found'
      );
    });

    it('throws when no permission on event', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'invited' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue(null);
      await expect(service.updateParticipantStatus('p1', 'registered', 'u', 'instructor')).rejects.toThrow(
        'You do not have permission to update this participant'
      );
    });

    it('throws on invalid status transition', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'invited' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      await expect(service.updateParticipantStatus('p1', 'attended', 'u', 'instructor')).rejects.toThrow(
        'Invalid status transition from invited to attended'
      );
    });

    it('throws on transition from attended', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'attended' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      await expect(service.updateParticipantStatus('p1', 'registered', 'u', 'instructor')).rejects.toThrow(
        'Invalid status transition from attended to registered'
      );
    });

    it('updates status without attended timestamp for non-attended', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'invited' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      (repo.updateStatus as jest.Mock).mockResolvedValue({ id: 'p1', status: 'registered' });

      await service.updateParticipantStatus('p1', 'registered', 'u', 'instructor');

      expect(repo.updateStatus).toHaveBeenCalledWith('p1', 'registered', undefined);
    });

    it('sets attended_at when transition to attended', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'registered' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      (repo.updateStatus as jest.Mock).mockResolvedValue({ id: 'p1', status: 'attended' });

      const before = Date.now();
      await service.updateParticipantStatus('p1', 'attended', 'u', 'instructor');
      const after = Date.now();

      const call = (repo.updateStatus as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('p1');
      expect(call[1]).toBe('attended');
      expect(call[2]).toBeInstanceOf(Date);
      expect((call[2] as Date).getTime()).toBeGreaterThanOrEqual(before);
      expect((call[2] as Date).getTime()).toBeLessThanOrEqual(after);
    });

    it('allows no_show transition from registered', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'registered' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      (repo.updateStatus as jest.Mock).mockResolvedValue({ id: 'p1', status: 'no_show' });
      await service.updateParticipantStatus('p1', 'no_show', 'u', 'instructor');
      expect(repo.updateStatus).toHaveBeenCalledWith('p1', 'no_show', undefined);
    });

    it('allows withdrew from invited', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'invited' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      (repo.updateStatus as jest.Mock).mockResolvedValue({ id: 'p1', status: 'withdrew' });
      await service.updateParticipantStatus('p1', 'withdrew', 'u', 'instructor');
      expect(repo.updateStatus).toHaveBeenCalledWith('p1', 'withdrew', undefined);
    });
  });

  describe('removeParticipant', () => {
    it('throws when participant not found', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue(null);
      await expect(service.removeParticipant('p1', 'u', 'instructor')).rejects.toThrow('Participant not found');
    });

    it('throws when no permission', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'invited' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue(null);
      await expect(service.removeParticipant('p1', 'u', 'instructor')).rejects.toThrow(
        'You do not have permission to remove this participant'
      );
    });

    it('throws when participant attended', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'attended' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      await expect(service.removeParticipant('p1', 'u', 'instructor')).rejects.toThrow(
        'Cannot remove a participant who has already attended or no-show'
      );
    });

    it('throws when participant no_show', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'no_show' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      await expect(service.removeParticipant('p1', 'u', 'instructor')).rejects.toThrow(
        'Cannot remove a participant who has already attended or no-show'
      );
    });

    it('removes participant and updates count', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', event_id: 'evt', status: 'invited' });
      (eventService.getEventDetails as jest.Mock).mockResolvedValue({ id: 'evt' });
      (repo.removeParticipant as jest.Mock).mockResolvedValue({ id: 'p1' });
      (repo.countByEvent as jest.Mock).mockResolvedValue(4);

      await service.removeParticipant('p1', 'u', 'instructor');

      expect(repo.removeParticipant).toHaveBeenCalledWith('p1');
      expect(eventService.updateEvent).toHaveBeenCalledWith('evt', { max_participants: 4 }, 'u');
    });
  });

  describe('markAttendedBySubmission', () => {
    it('throws when participant not found', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue(null);
      await expect(service.markAttendedBySubmission('p1', 'sub1')).rejects.toThrow('Participant not found');
    });

    it('marks attended when invited', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', status: 'invited' });
      (repo.markAttended as jest.Mock).mockResolvedValue({ id: 'p1' });
      (repo.updateSubmissionId as jest.Mock).mockResolvedValue({ id: 'p1' });

      await service.markAttendedBySubmission('p1', 'sub1');

      expect(repo.markAttended).toHaveBeenCalledWith('p1', expect.any(Date));
      expect(repo.updateSubmissionId).toHaveBeenCalledWith('p1', 'sub1');
    });

    it('marks attended when registered', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', status: 'registered' });
      (repo.markAttended as jest.Mock).mockResolvedValue({ id: 'p1' });
      (repo.updateSubmissionId as jest.Mock).mockResolvedValue({ id: 'p1' });

      await service.markAttendedBySubmission('p1', 'sub1');

      expect(repo.markAttended).toHaveBeenCalled();
    });

    it('does not mark attended for already attended participant', async () => {
      (repo.getParticipantById as jest.Mock).mockResolvedValue({ id: 'p1', status: 'attended' });
      (repo.updateSubmissionId as jest.Mock).mockResolvedValue({ id: 'p1' });

      await service.markAttendedBySubmission('p1', 'sub1');

      expect(repo.markAttended).not.toHaveBeenCalled();
      expect(repo.updateSubmissionId).toHaveBeenCalledWith('p1', 'sub1');
    });
  });

  describe('getParticipantByEventStudent', () => {
    it('delegates to repo', async () => {
      (repo.findByEventAndStudent as jest.Mock).mockResolvedValue({ id: 'p1' });
      const result = await service.getParticipantByEventStudent('evt', 'stu');
      expect(result).toEqual({ id: 'p1' });
      expect(repo.findByEventAndStudent).toHaveBeenCalledWith('evt', 'stu');
    });
  });
});
