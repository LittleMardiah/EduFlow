import { ParticipantStatus } from "@eduflow/database";
import { logger } from "@eduflow/core";
import { EventParticipantRepository, getUserById } from "@eduflow/repositories";
import { eventService } from "./EventService";

const participantRepo = new EventParticipantRepository();

const validTransitions: Record<ParticipantStatus, ParticipantStatus[]> = {
  invited: ["registered", "withdrew"],
  registered: ["attended", "no_show", "withdrew"],
  attended: ["withdrew"],
  no_show: ["withdrew"],
  withdrew: [],
};

export class EventParticipantService {
  async addParticipant(eventId: string, studentId: string, instructorId: string) {
    const event = await eventService.getEventDetails(eventId, instructorId, "instructor");
    if (!event) {
      throw new Error("Event not found or you do not have permission");
    }

    if (event.status === "completed" || event.status === "cancelled") {
      throw new Error("Cannot add participants to a completed or cancelled event");
    }

    const student = await getUserById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const existing = await participantRepo.findByEventAndStudent(eventId, studentId);
    if (existing) {
      throw new Error("Student already registered for this event");
    }

    if (event.max_participants) {
      const currentCount = await participantRepo.countByEvent(eventId);
      if (currentCount >= event.max_participants) {
        throw new Error("Event has reached maximum participants");
      }
    }

    const participant = await participantRepo.addParticipant(eventId, studentId, "invited");
    logger.info(`Participant added: student ${studentId} to event ${eventId}`);

    const newCount = await participantRepo.countByEvent(eventId);
    await eventService.updateEvent(eventId, { max_participants: newCount }, instructorId);

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
    const event = await eventService.getEventDetails(eventId, userId, userRole);
    if (!event) {
      throw new Error("Event not found or you do not have permission");
    }

    return participantRepo.findByEvent(eventId, filters);
  }

  async updateParticipantStatus(
    participantId: string,
    newStatus: ParticipantStatus,
    userId: string,
    userRole: string
  ) {
    const participant = await participantRepo.getParticipantById(participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    const event = await eventService.getEventDetails(participant.event_id, userId, userRole);
    if (!event) {
      throw new Error("You do not have permission to update this participant");
    }

    const currentStatus = participant.status;
    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    let attendedAt = null;
    if (newStatus === "attended") {
      attendedAt = new Date();
    }

    const updated = await participantRepo.updateStatus(participantId, newStatus, attendedAt ?? undefined);
    logger.info(`Participant ${participantId} status updated to ${newStatus} by ${userId}`);

    return updated;
  }

  async removeParticipant(participantId: string, userId: string, userRole: string) {
    const participant = await participantRepo.getParticipantById(participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    const event = await eventService.getEventDetails(participant.event_id, userId, userRole);
    if (!event) {
      throw new Error("You do not have permission to remove this participant");
    }

    if (participant.status === "attended" || participant.status === "no_show") {
      throw new Error("Cannot remove a participant who has already attended or no-show");
    }

    const removed = await participantRepo.removeParticipant(participantId);
    logger.info(`Participant ${participantId} removed from event ${participant.event_id}`);

    const newCount = await participantRepo.countByEvent(participant.event_id);
    await eventService.updateEvent(participant.event_id, { max_participants: newCount }, userId);

    return removed;
  }

  async markAttendedBySubmission(participantId: string, submissionId: string) {
    const participant = await participantRepo.getParticipantById(participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    if (participant.status === "invited" || participant.status === "registered") {
      await participantRepo.markAttended(participantId, new Date());
    }

    await participantRepo.updateSubmissionId(participantId, submissionId);

    return participant;
  }

  async getParticipantByEventStudent(eventId: string, studentId: string) {
    return participantRepo.findByEventAndStudent(eventId, studentId);
  }
}

export const eventParticipantService = new EventParticipantService();