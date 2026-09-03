import { EventStatus } from "@eduflow/database";
import { logger } from "@eduflow/core";
import {
  EventRepository,
  CreateEventDTO,
  UpdateEventDTO,
  EventFilters,
  getQuizById,
  getUserById,
} from "@eduflow/repositories";

const eventRepo = new EventRepository();

const validTransitions: Record<EventStatus, EventStatus[]> = {
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

export class EventService {
  async createEvent(
    payload: Omit<CreateEventDTO, "created_by" | "organization_id">,
    instructorId: string
  ) {
    const quiz = await getQuizById(payload.quiz_id);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    if (quiz.instructor_id !== instructorId) {
      throw new Error("You do not own this quiz");
    }

    if (!payload.timezone || !payload.timezone.match(/^[A-Za-z_\/]+$/)) {
      throw new Error("Invalid timezone format");
    }

    if (payload.scheduled_end_at <= payload.scheduled_start_at) {
      throw new Error("End time must be after start time");
    }

    if (
      payload.max_participants !== undefined &&
      payload.max_participants !== null &&
      payload.max_participants <= 0
    ) {
      throw new Error("max_participants must be positive");
    }

    const user = await getUserById(instructorId);
    if (!user || !user.organization_id) {
      throw new Error("Instructor does not have an organization");
    }

    const createData: CreateEventDTO = {
      ...payload,
      created_by: instructorId,
      organization_id: user.organization_id,
      max_participants: payload.max_participants ?? null,
    };

    const event = await eventRepo.create(createData);

    logger.info(`Event created: ${event.id} (${event.title}) by instructor ${instructorId}`);
    return event;
  }

  async getEventDetails(eventId: string, userId: string, userRole: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const isInstructor = event.created_by === userId;
    const isAdmin = userRole === "admin";
    const isParticipant = event.participants.some((p) => p.student_id === userId);

    if (!isInstructor && !isAdmin && !isParticipant) {
      throw new Error("Unauthorized: You do not have access to this event");
    }

    return event;
  }

  async updateEvent(eventId: string, payload: UpdateEventDTO, instructorId: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.created_by !== instructorId) {
      throw new Error("Only the event creator can update this event");
    }

    if (event.status === "completed" || event.status === "cancelled") {
      throw new Error("Cannot update a completed or cancelled event");
    }

    if (payload.timezone && !payload.timezone.match(/^[A-Za-z_\/]+$/)) {
      throw new Error("Invalid timezone format");
    }

    if (payload.scheduled_start_at && payload.scheduled_end_at) {
      if (payload.scheduled_end_at <= payload.scheduled_start_at) {
        throw new Error("End time must be after start time");
      }
    }

    if (payload.status) {
      const currentStatus = event.status;
      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(payload.status)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${payload.status}`);
      }
    }

    const updated = await eventRepo.update(eventId, payload);
    logger.info(`Event updated: ${eventId} by instructor ${instructorId}`);
    return updated;
  }

  async deleteEvent(eventId: string, instructorId: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.created_by !== instructorId) {
      throw new Error("Only the event creator can delete this event");
    }

    await eventRepo.softDelete(eventId);
    logger.info(`Event soft-deleted: ${eventId} by instructor ${instructorId}`);
  }

  async listEvents(filters: EventFilters, userId: string, userRole: string) {
    if (userRole === "student" && filters.instructor_id) {
      throw new Error("Students cannot filter by instructor");
    }

    if (userRole === "student") {
      const events = await eventRepo.findAll({ ...filters, instructor_id: undefined });
      return events;
    }

    if (userRole === "instructor") {
      filters.instructor_id = filters.instructor_id || userId;
    }

    return eventRepo.findAll(filters);
  }

  async updateEventStatus(
    eventId: string,
    newStatus: EventStatus,
    userId: string,
    userRole: string
  ) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const isInstructor = event.created_by === userId;
    const isAdmin = userRole === "admin";

    if (!isInstructor && !isAdmin) {
      throw new Error("Only the event creator or admin can update event status");
    }

    const currentStatus = event.status;
    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updated = await eventRepo.update(eventId, { status: newStatus });
    logger.info(`Event status updated: ${eventId} -> ${newStatus} by ${userId}`);
    return updated;
  }
}

export const eventService = new EventService();