import { EventService } from '../../src/services/EventService';
import { EventRepository } from '../../src/repositories/EventRepository';
import { getQuizById } from '../../src/repositories/quiz.repository';
import { getUserById } from '../../src/repositories/user.repository';

jest.mock('../../src/repositories/EventRepository', () => {
  const repoInstance = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  return {
    __repo: repoInstance,
    EventRepository: jest.fn().mockImplementation(() => repoInstance),
  };
});

jest.mock('../../src/repositories/quiz.repository', () => ({
  getQuizById: jest.fn(),
}));

jest.mock('../../src/repositories/user.repository', () => ({
  getUserById: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
  EventStatus: {
    scheduled: 'scheduled',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  },
}));

const repo: any = (jest.requireMock('../../src/repositories/EventRepository') as any).__repo;
const service = new EventService();

const validEvent = {
  id: 'evt',
  created_by: 'inst',
  status: 'scheduled',
  participants: [],
};

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    const payload = {
      quiz_id: 'q1',
      title: 'Exam',
      scheduled_start_at: new Date('2020-01-01'),
      scheduled_end_at: new Date('2020-01-02'),
      timezone: 'Asia/Jakarta',
    };

    it('creates event successfully', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'inst' });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'inst', organization_id: 'org' });
      (repo.create as jest.Mock).mockResolvedValue({ id: 'evt', title: 'Exam' });

      const result = await service.createEvent(payload, 'inst');

      expect(result.id).toBe('evt');
      const call = (repo.create as jest.Mock).mock.calls[0][0];
      expect(call.created_by).toBe('inst');
      expect(call.organization_id).toBe('org');
    });

    it('throws when quiz not found', async () => {
      (getQuizById as jest.Mock).mockResolvedValue(null);
      await expect(service.createEvent(payload, 'inst')).rejects.toThrow('Quiz not found');
    });

    it('throws when quiz not owned by instructor', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'other' });
      await expect(service.createEvent(payload, 'inst')).rejects.toThrow('You do not own this quiz');
    });

    it('throws on invalid timezone format', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'inst' });
      await expect(service.createEvent({ ...payload, timezone: 'UTC-5;DROP' }, 'inst'))
        .rejects.toThrow('Invalid timezone format');
    });

    it('throws when end time equals or before start time', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'inst' });
      await expect(service.createEvent({
        ...payload,
        scheduled_start_at: new Date('2020-01-02'),
        scheduled_end_at: new Date('2020-01-01'),
      }, 'inst')).rejects.toThrow('End time must be after start time');
    });

    it('throws when max_participants is non-positive', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'inst' });
      await expect(service.createEvent({ ...payload, max_participants: 0 }, 'inst'))
        .rejects.toThrow('max_participants must be positive');
    });

    it('allows null max_participants', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'inst' });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'inst', organization_id: 'org' });
      (repo.create as jest.Mock).mockResolvedValue({ id: 'evt' });
      await service.createEvent({ ...payload, max_participants: null }, 'inst');
      const call = (repo.create as jest.Mock).mock.calls[0][0];
      expect(call.max_participants).toBeNull();
    });

    it('throws when instructor has no organization', async () => {
      (getQuizById as jest.Mock).mockResolvedValue({ id: 'q1', instructor_id: 'inst' });
      (getUserById as jest.Mock).mockResolvedValue({ id: 'inst', organization_id: null });
      await expect(service.createEvent(payload, 'inst')).rejects.toThrow('Instructor does not have an organization');
    });
  });

  describe('getEventDetails', () => {
    it('throws when event not found', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.getEventDetails('evt', 'u', 'instructor')).rejects.toThrow('Event not found');
    });

    it('allows the creating instructor', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, created_by: 'u' });
      const result = await service.getEventDetails('evt', 'u', 'instructor');
      expect(result.id).toBe('evt');
    });

    it('allows admin', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, created_by: 'other' });
      const result = await service.getEventDetails('evt', 'u', 'admin');
      expect(result.id).toBe('evt');
    });

    it('allows a participant', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, participants: [{ student_id: 'u' }] });
      const result = await service.getEventDetails('evt', 'u', 'student');
      expect(result.id).toBe('evt');
    });

    it('denies unauthorized user', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, created_by: 'other', participants: [] });
      await expect(service.getEventDetails('evt', 'u', 'student')).rejects.toThrow(
        'Unauthorized: You do not have access to this event'
      );
    });
  });

  describe('updateEvent', () => {
    it('throws when event not found', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.updateEvent('evt', { title: 'x' }, 'inst')).rejects.toThrow('Event not found');
    });

    it('throws when not the creator', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, created_by: 'other' });
      await expect(service.updateEvent('evt', { title: 'x' }, 'inst')).rejects.toThrow(
        'Only the event creator can update this event'
      );
    });

    it('throws when event completed', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, status: 'completed' });
      await expect(service.updateEvent('evt', { title: 'x' }, 'inst')).rejects.toThrow(
        'Cannot update a completed or cancelled event'
      );
    });

    it('throws when event cancelled', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, status: 'cancelled' });
      await expect(service.updateEvent('evt', { title: 'x' }, 'inst')).rejects.toThrow(
        'Cannot update a completed or cancelled event'
      );
    });

    it('throws on invalid timezone', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(validEvent);
      await expect(service.updateEvent('evt', { timezone: 'bad timezone!' }, 'inst'))
        .rejects.toThrow('Invalid timezone format');
    });

    it('throws when end before start', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(validEvent);
      await expect(service.updateEvent('evt', {
        scheduled_start_at: new Date('2020-01-02'),
        scheduled_end_at: new Date('2020-01-01'),
      }, 'inst')).rejects.toThrow('End time must be after start time');
    });

    it('throws on invalid status transition', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(validEvent);
      await expect(service.updateEvent('evt', { status: 'completed' as any }, 'inst')).rejects.toThrow(
        'Invalid status transition from scheduled to completed'
      );
    });

    it('updates event successfully', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(validEvent);
      (repo.update as jest.Mock).mockResolvedValue({ id: 'evt' });
      const result = await service.updateEvent('evt', { title: 'New' }, 'inst');
      expect(result.id).toBe('evt');
      expect(repo.update).toHaveBeenCalledWith('evt', { title: 'New' });
    });
  });

  describe('deleteEvent', () => {
    it('throws when event not found', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.deleteEvent('evt', 'inst')).rejects.toThrow('Event not found');
    });

    it('throws when not creator', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, created_by: 'other' });
      await expect(service.deleteEvent('evt', 'inst')).rejects.toThrow('Only the event creator can delete this event');
    });

    it('soft deletes on success', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(validEvent);
      (repo.softDelete as jest.Mock).mockResolvedValue({ id: 'evt' });
      await service.deleteEvent('evt', 'inst');
      expect(repo.softDelete).toHaveBeenCalledWith('evt');
    });
  });

  describe('listEvents', () => {
    it('throws when student filters by instructor', async () => {
      await expect(service.listEvents({ instructor_id: 'x' } as any, 's', 'student'))
        .rejects.toThrow('Students cannot filter by instructor');
    });

    it('returns all events for student (no instructor filter)', async () => {
      (repo.findAll as jest.Mock).mockResolvedValue([{ id: 'e1' }]);
      const result = await service.listEvents({}, 's', 'student');
      expect(result).toEqual([{ id: 'e1' }]);
    });

    it('sets instructor filter to own id for instructor', async () => {
      (repo.findAll as jest.Mock).mockResolvedValue([]);
      await service.listEvents({}, 'inst', 'instructor');
      const call = (repo.findAll as jest.Mock).mock.calls[0][0];
      expect(call.instructor_id).toBe('inst');
    });

    it('keeps provided instructor filter for instructor', async () => {
      (repo.findAll as jest.Mock).mockResolvedValue([]);
      await service.listEvents({ instructor_id: 'other' } as any, 'inst', 'instructor');
      const call = (repo.findAll as jest.Mock).mock.calls[0][0];
      expect(call.instructor_id).toBe('other');
    });

    it('returns all for admin without forcing instructor filter', async () => {
      (repo.findAll as jest.Mock).mockResolvedValue([]);
      const filters: any = {};
      await service.listEvents(filters, 'admin', 'admin');
      expect(filters.instructor_id).toBeUndefined();
      expect(repo.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('updateEventStatus', () => {
    it('throws when event not found', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.updateEventStatus('evt', 'in_progress' as any, 'u', 'instructor'))
        .rejects.toThrow('Event not found');
    });

    it('denies non-creator non-admin', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, created_by: 'other' });
      await expect(service.updateEventStatus('evt', 'in_progress' as any, 'u', 'instructor'))
        .rejects.toThrow('Only the event creator or admin can update event status');
    });

    it('throws on invalid transition', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, status: 'completed' });
      await expect(service.updateEventStatus('evt', 'scheduled' as any, 'inst', 'instructor'))
        .rejects.toThrow('Invalid status transition from completed to scheduled');
    });

    it('updates status for admin', async () => {
      (repo.findById as jest.Mock).mockResolvedValue(validEvent);
      (repo.update as jest.Mock).mockResolvedValue({ id: 'evt' });
      const result = await service.updateEventStatus('evt', 'in_progress' as any, 'u', 'admin');
      expect(result.id).toBe('evt');
      expect(repo.update).toHaveBeenCalledWith('evt', { status: 'in_progress' });
    });

    it('updates via completed transition for creator', async () => {
      (repo.findById as jest.Mock).mockResolvedValue({ ...validEvent, status: 'in_progress' });
      (repo.update as jest.Mock).mockResolvedValue({ id: 'evt' });
      await service.updateEventStatus('evt', 'completed' as any, 'inst', 'instructor');
      expect(repo.update).toHaveBeenCalledWith('evt', { status: 'completed' });
    });
  });
});