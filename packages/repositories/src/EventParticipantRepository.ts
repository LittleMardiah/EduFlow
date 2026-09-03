import { prisma } from "@eduflow/database";
import { ParticipantStatus } from "@eduflow/database";

export interface ParticipantFilters {
  status?: ParticipantStatus;
  limit?: number;
  offset?: number;
}

export class EventParticipantRepository {
  async addParticipant(
    eventId: string,
    studentId: string,
    status: ParticipantStatus = "invited"
  ) {
    return prisma.eventParticipant.create({
      data: {
        event_id: eventId,
        student_id: studentId,
        status,
        registered_at: status === "registered" ? new Date() : null,
      },
      include: {
        student: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        submission: true,
      },
    });
  }

  async findByEventAndStudent(eventId: string, studentId: string) {
    return prisma.eventParticipant.findUnique({
      where: {
        event_id_student_id: {
          event_id: eventId,
          student_id: studentId,
        },
      },
      include: {
        student: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        submission: true,
      },
    });
  }

  async findByEvent(eventId: string, filters: ParticipantFilters = {}) {
    const where: any = { event_id: eventId };
    if (filters.status) where.status = filters.status;

    return prisma.eventParticipant.findMany({
      where,
      include: {
        student: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        submission: true,
      },
      skip: filters.offset || 0,
      take: filters.limit || 50,
      orderBy: { created_at: "desc" },
    });
  }

  async updateStatus(participantId: string, status: ParticipantStatus, attendedAt?: Date) {
    const data: any = { status };
    if (status === "registered" && !attendedAt) {
      data.registered_at = new Date();
    }
    if (status === "attended" && attendedAt) {
      data.attended_at = attendedAt;
    }
    return prisma.eventParticipant.update({
      where: { id: participantId },
      data,
      include: {
        student: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        submission: true,
      },
    });
  }

  async removeParticipant(participantId: string) {
    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: { status: "withdrew" },
    });
  }

  async countByEvent(eventId: string, status?: ParticipantStatus) {
    const where: any = { event_id: eventId };
    if (status) where.status = status;
    return prisma.eventParticipant.count({ where });
  }

  async getParticipantById(participantId: string) {
    return prisma.eventParticipant.findUnique({
      where: { id: participantId },
      include: {
        student: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        submission: true,
      },
    });
  }

  async updateSubmissionId(participantId: string, submissionId: string) {
    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: { submission_id: submissionId },
    });
  }

  async markAttended(participantId: string, attendedAt: Date) {
    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: {
        status: "attended",
        attended_at: attendedAt,
      },
    });
  }
}