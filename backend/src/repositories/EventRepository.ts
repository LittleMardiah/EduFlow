import { PrismaClient, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateEventDTO {
  quiz_id: string;
  title: string;
  description?: string;
  scheduled_start_at: Date;
  scheduled_end_at: Date;
  timezone: string;
  allow_retakes?: boolean;
  show_answers?: 'immediately' | 'after_deadline' | 'never';
  max_participants?: number | null;
  created_by: string;
  organization_id: string;
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  scheduled_start_at?: Date;
  scheduled_end_at?: Date;
  timezone?: string;
  allow_retakes?: boolean;
  show_answers?: 'immediately' | 'after_deadline' | 'never';
  max_participants?: number | null;
  status?: EventStatus;
}

export interface EventFilters {
  status?: EventStatus;
  quiz_id?: string;
  instructor_id?: string;
  limit?: number;
  offset?: number;
}

export class EventRepository {
  async create(data: CreateEventDTO) {
    return prisma.event.create({
      data: {
        quiz_id: data.quiz_id,
        created_by: data.created_by,
        organization_id: data.organization_id,
        title: data.title,
        description: data.description,
        scheduled_start_at: data.scheduled_start_at,
        scheduled_end_at: data.scheduled_end_at,
        timezone: data.timezone,
        allow_retakes: data.allow_retakes ?? false,
        show_answers: data.show_answers ?? 'immediately',
        max_participants: data.max_participants,
      },
      include: {
        quiz: true,
        instructor: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        participants: {
          include: { student: true },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id, deleted_at: null },
      include: {
        quiz: true,
        instructor: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        participants: {
          include: { student: true },
        },
        submissions: true,
        analytics: true,
      },
    });
  }

  async findByInstructor(instructor_id: string) {
    return prisma.event.findMany({
      where: { created_by: instructor_id, deleted_at: null },
      include: {
        quiz: true,
        participants: { include: { student: true } },
      },
      orderBy: { scheduled_start_at: 'asc' },
    });
  }

  async findByQuiz(quiz_id: string) {
    return prisma.event.findMany({
      where: { quiz_id, deleted_at: null },
      include: {
        participants: { include: { student: true } },
      },
      orderBy: { scheduled_start_at: 'asc' },
    });
  }

  async findByStatus(status: EventStatus) {
    return prisma.event.findMany({
      where: { status, deleted_at: null },
      include: {
        quiz: true,
        participants: { include: { student: true } },
      },
      orderBy: { scheduled_start_at: 'asc' },
    });
  }

  async findAll(filters: EventFilters = {}) {
    const where: any = { deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.quiz_id) where.quiz_id = filters.quiz_id;
    if (filters.instructor_id) where.created_by = filters.instructor_id;

    return prisma.event.findMany({
      where,
      include: {
        quiz: true,
        instructor: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        participants: {
          include: { student: true },
          take: 5, // limit participants preview
        },
      },
      skip: filters.offset || 0,
      take: filters.limit || 20,
      orderBy: { scheduled_start_at: 'asc' },
    });
  }

  async update(id: string, data: UpdateEventDTO) {
    return prisma.event.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        quiz: true,
        instructor: {
          select: { id: true, email: true, first_name: true, last_name: true },
        },
        participants: {
          include: { student: true },
        },
      },
    });
  }

  async softDelete(id: string) {
    return prisma.event.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async count(filters: EventFilters = {}) {
    const where: any = { deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.quiz_id) where.quiz_id = filters.quiz_id;
    if (filters.instructor_id) where.created_by = filters.instructor_id;

    return prisma.event.count({ where });
  }
}
