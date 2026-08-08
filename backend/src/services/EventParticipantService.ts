import { ParticipantStatus } from '@prisma/client';
import { EventParticipantRepository } from '../repositories/EventParticipantRepository';
import { eventService } from './EventService';
import { getUserById } from '../repositories/user.repository';
import logger from '../utils/logger';

const participantRepo = new EventParticipantRepository();

// Valid status transitions
const validTransitions: Record<ParticipantStatus, ParticipantStatus[]> = {
  invited: ['registered', 'withdrew'],
  registered: ['attended', 'no_show', 'withdrew'],
  attended: ['withdrew'],
  no_show: ['withdrew'],
  withdrew: [],
};

export class EventParticipantService {
  async addParticipant(eventId: string, studentId: string, instructorId: string) {
    // 1. Check event exists and user is instructor/owner
    const event = await eventService.getEventDetails(eventId, instructorId, 'instructor');
    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }

    // 2. Check if event is still accepting participants (not completed/cancelled)
    if (event.status === 'completed' || event.status === 'cancelled') {
      throw new Error('Cannot add participants to a completed or cancelled event');
    }

    // 3. Check if student exists
    const student = await getUserById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // 4. Check if student already registered
    const existing = await participantRepo.findByEventAndStudent(eventId, studentId);
    if (existing) {
      throw new Error('Student already registered for this event');
    }

    // 5. Check max_participants (if set)
    if (event.max_participants) {
      const currentCount = await participantRepo.countByEvent(eventId);
      if (currentCount >= event.max_participants) {
        throw new Error('Event has reached maximum participants');
      }
    }

    // 6. Add participant
    const participant = await participantRepo.addParticipant(eventId, studentId, 'invited');
    logger.info(`Participant added: student ${studentId} to event ${eventId}`);

    // 7. Update total_participants denormalized
    const newCount = await participantRepo.countByEvent(eventId);
    await eventService.updateEvent(eventId, { total_participants: newCount }, instructorId);

    return participant;
  }

  async bulkAddParticipants(eventId: string, studentIds: string[], instructorId: string) {
    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const participant = await this.addParticipant(eventId, studentId, instructorId);
        results.push(participant);
      } catch (error: any) {
        errors.push({ studentId, error: error.message });
      }
    }

    return { results, errors, totalAdded: results.length, totalFailed: errors.length };
  }

  async getParticipants(eventId: string, userId: string, userRole: string, filters: any) {
    // RBAC: only instructor/owner or admin can view participants
    const event = await eventService.getEventDetails(eventId, userId, userRole);
    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }

    return participantRepo.findByEvent(eventId, filters);
  }

  async updateParticipantStatus(participantId: string, newStatus: ParticipantStatus, userId: string, userRole: string) {
    // Get participant with event
    const participant = await participantRepo.getParticipantById(participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    // Check permission
    const event = await eventService.getEventDetails(participant.event_id, userId, userRole);
    if (!event) {
      throw new Error('You do not have permission to update this participant');
    }

    // Validate status transition
    const currentStatus = participant.status;
    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Auto-set attended_at if new status is attended
    let attendedAt = null;
    if (newStatus === 'attended') {
      attendedAt = new Date();
    }

    const updated = await participantRepo.updateStatus(participantId, newStatus, attendedAt);
    logger.info(`Participant ${participantId} status updated to ${newStatus} by ${userId}`);

    return updated;
  }

  async removeParticipant(participantId: string, userId: string, userRole: string) {
    const participant = await participantRepo.getParticipantById(participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    // Check permission
    const event = await eventService.getEventDetails(participant.event_id, userId, userRole);
    if (!event) {
      throw new Error('You do not have permission to remove this participant');
    }

    // Cannot remove if already attended or no_show
    if (participant.status === 'attended' || participant.status === 'no_show') {
      throw new Error('Cannot remove a participant who has already attended or no-show');
    }

    const removed = await participantRepo.removeParticipant(participantId);
    logger.info(`Participant ${participantId} removed from event ${participant.event_id}`);

    // Update total_participants denormalized
    const newCount = await participantRepo.countByEvent(participant.event_id);
    await eventService.updateEvent(participant.event_id, { total_participants: newCount }, userId);

    return removed;
  }

  async markAttendedBySubmission(participantId: string, submissionId: string) {
    const participant = await participantRepo.getParticipantById(participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    // Only mark if status is invited or registered
    if (participant.status === 'invited' || participant.status === 'registered') {
      await participantRepo.markAttended(participantId, new Date());
    }

    // Link submission
    await participantRepo.updateSubmissionId(participantId, submissionId);

    return participant;
  }

  async getParticipantByEventStudent(eventId: string, studentId: string) {
    return participantRepo.findByEventAndStudent(eventId, studentId);
  }
}

export const eventParticipantService = new EventParticipantService();
