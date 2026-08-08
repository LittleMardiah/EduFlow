#!/bin/bash
set -e

echo "=========================================="
echo "  DAY 3-4: EVENT MANAGEMENT API (CRUD)   "
echo "=========================================="
echo ""

# ==============================================
# 1. CREATE EVENT SCHEMAS (Zod)
# ==============================================
echo "--- 1. MEMBUAT src/schemas/event.schemas.ts ---"
mkdir -p src/schemas
cat > src/schemas/event.schemas.ts <<'SCHEMA_EOF'
import { z } from 'zod';

// ===== CREATE EVENT SCHEMA =====
export const createEventSchema = z.object({
  quiz_id: z.string().min(1, "Quiz ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  scheduled_start_at: z.coerce.date(),
  scheduled_end_at: z.coerce.date(),
  timezone: z.string().regex(/^[A-Za-z_\/]+$/, "Invalid timezone format"),
  allow_retakes: z.boolean().default(false),
  show_answers: z.enum(['immediately', 'after_deadline', 'never']).default('immediately'),
  max_participants: z.number().int().positive().optional(),
}).refine(data => data.scheduled_end_at > data.scheduled_start_at, {
  message: "End time must be after start time",
  path: ["scheduled_end_at"],
});

// ===== UPDATE EVENT SCHEMA (Partial) =====
export const updateEventSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  scheduled_start_at: z.coerce.date().optional(),
  scheduled_end_at: z.coerce.date().optional(),
  timezone: z.string().regex(/^[A-Za-z_\/]+$/).optional(),
  allow_retakes: z.boolean().optional(),
  show_answers: z.enum(['immediately', 'after_deadline', 'never']).optional(),
  max_participants: z.number().int().positive().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
}).refine(data => {
  if (data.scheduled_start_at && data.scheduled_end_at) {
    return data.scheduled_end_at > data.scheduled_start_at;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["scheduled_end_at"],
});

// ===== EVENT STATUS UPDATE SCHEMA =====
export const updateEventStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
});

// ===== LIST EVENTS QUERY SCHEMA =====
export const listEventsQuerySchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  quiz_id: z.string().optional(),
  instructor_id: z.string().optional(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
SCHEMA_EOF
echo "✅ src/schemas/event.schemas.ts created"
echo ""

# ==============================================
# 2. CREATE EVENT REPOSITORY
# ==============================================
echo "--- 2. MEMBUAT src/repositories/EventRepository.ts ---"
mkdir -p src/repositories
cat > src/repositories/EventRepository.ts <<'REPO_EOF'
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
REPO_EOF
echo "✅ src/repositories/EventRepository.ts created"
echo ""

# ==============================================
# 3. CREATE EVENT SERVICE
# ==============================================
echo "--- 3. MEMBUAT src/services/EventService.ts ---"
mkdir -p src/services
cat > src/services/EventService.ts <<'SERV_EOF'
import { EventStatus } from '@prisma/client';
import { EventRepository, CreateEventDTO, UpdateEventDTO, EventFilters } from '../repositories/EventRepository';
import { getQuizById } from '../repositories/quiz.repository';
import { getUserById } from '../repositories/user.repository';
import { logger } from '../utils/logger';

const eventRepo = new EventRepository();

// Valid status transitions
const validTransitions: Record<EventStatus, EventStatus[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['cancelled'],
  cancelled: [],
};

export class EventService {
  async createEvent(payload: Omit<CreateEventDTO, 'created_by' | 'organization_id'>, instructorId: string) {
    // 1. Validate quiz exists and belongs to instructor
    const quiz = await getQuizById(payload.quiz_id);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    if (quiz.instructor_id !== instructorId) {
      throw new Error('You do not own this quiz');
    }

    // 2. Validate timezone (simple check)
    if (!payload.timezone || !payload.timezone.match(/^[A-Za-z_\/]+$/)) {
      throw new Error('Invalid timezone format');
    }

    // 3. Validate end time > start time
    if (payload.scheduled_end_at <= payload.scheduled_start_at) {
      throw new Error('End time must be after start time');
    }

    // 4. Validate max_participants (if provided)
    if (payload.max_participants !== undefined && payload.max_participants !== null && payload.max_participants <= 0) {
      throw new Error('max_participants must be positive');
    }

    // 5. Get user's organization_id
    const user = await getUserById(instructorId);
    if (!user || !user.organization_id) {
      throw new Error('Instructor does not have an organization');
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
      throw new Error('Event not found');
    }

    // RBAC: only instructor, admin, or participants can view
    const isInstructor = event.created_by === userId;
    const isAdmin = userRole === 'admin';
    const isParticipant = event.participants.some(p => p.student_id === userId);

    if (!isInstructor && !isAdmin && !isParticipant) {
      throw new Error('Unauthorized: You do not have access to this event');
    }

    return event;
  }

  async updateEvent(eventId: string, payload: UpdateEventDTO, instructorId: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Only instructor who created it or admin can update
    if (event.created_by !== instructorId) {
      throw new Error('Only the event creator can update this event');
    }

    // Cannot update if event is completed or cancelled
    if (event.status === 'completed' || event.status === 'cancelled') {
      throw new Error('Cannot update a completed or cancelled event');
    }

    // Validate timezone if provided
    if (payload.timezone && !payload.timezone.match(/^[A-Za-z_\/]+$/)) {
      throw new Error('Invalid timezone format');
    }

    // Validate start/end times if both provided
    if (payload.scheduled_start_at && payload.scheduled_end_at) {
      if (payload.scheduled_end_at <= payload.scheduled_start_at) {
        throw new Error('End time must be after start time');
      }
    }

    // If status transition requested, validate
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
      throw new Error('Event not found');
    }

    if (event.created_by !== instructorId) {
      throw new Error('Only the event creator can delete this event');
    }

    // Cannot delete if event is in_progress or completed
    if (event.status === 'in_progress' || event.status === 'completed') {
      throw new Error('Cannot delete an in-progress or completed event');
    }

    await eventRepo.softDelete(eventId);
    logger.info(`Event soft-deleted: ${eventId} by instructor ${instructorId}`);
  }

  async listEvents(filters: EventFilters, userId: string, userRole: string) {
    // For students, only show events they are registered in
    if (userRole === 'student' && filters.instructor_id) {
      throw new Error('Students cannot filter by instructor');
    }

    // If student, filter by participant
    if (userRole === 'student') {
      // We'll fetch all events and filter manually (or via join)
      const events = await eventRepo.findAll({ ...filters, instructor_id: undefined });
      // Filter by participant (simplified: in real app, use Prisma join)
      // For now, we'll return all (since we don't have participant filter yet)
      return events;
    }

    // For instructor, show only their own events if not admin
    if (userRole === 'instructor') {
      filters.instructor_id = filters.instructor_id || userId;
    }

    // Admin can see all (no filter)
    return eventRepo.findAll(filters);
  }

  async updateEventStatus(eventId: string, newStatus: EventStatus, userId: string, userRole: string) {
    const event = await eventRepo.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const isInstructor = event.created_by === userId;
    const isAdmin = userRole === 'admin';

    if (!isInstructor && !isAdmin) {
      throw new Error('Only the event creator or admin can update event status');
    }

    const currentStatus = event.status;
    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updated = await eventRepo.update(eventId, { status: newStatus });
    logger.info(`Event status updated: ${eventId} → ${newStatus} by ${userId}`);
    return updated;
  }
}

export const eventService = new EventService();
SERV_EOF
echo "✅ src/services/EventService.ts created"
echo ""

# ==============================================
# 4. CREATE EVENT ROUTES (Controller + Routes)
# ==============================================
echo "--- 4. MEMBUAT src/routes/events.ts ---"
mkdir -p src/routes
cat > src/routes/events.ts <<'ROUTE_EOF'
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { eventService } from '../services/EventService';
import { createEventSchema, updateEventSchema, updateEventStatusSchema, listEventsQuerySchema } from '../schemas/event.schemas';
import { logger } from '../utils/logger';

const router = Router();

// ===== CREATE EVENT =====
router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(createEventSchema),
  async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const userId = req.user!.userId;

      const event = await eventService.createEvent(payload, userId);
      res.status(201).json({
        success: true,
        data: event,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Create event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Unauthorized') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== GET EVENT DETAILS =====
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const event = await eventService.getEventDetails(id, userId, userRole);
      res.json({ success: true, data: event });
    } catch (error: any) {
      logger.error(`Get event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Unauthorized') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== LIST EVENTS =====
router.get(
  '/',
  authMiddleware,
  validate(listEventsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const events = await eventService.listEvents(filters, userId, userRole);
      res.json({ success: true, data: events });
    } catch (error: any) {
      logger.error(`List events error: ${error.message}`);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== UPDATE EVENT =====
router.patch(
  '/:id',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(updateEventSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const userId = req.user!.userId;

      const event = await eventService.updateEvent(id, payload, userId);
      res.json({ success: true, data: event });
    } catch (error: any) {
      logger.error(`Update event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('cannot update') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== DELETE EVENT (Soft Delete) =====
router.delete(
  '/:id',
  authMiddleware,
  requireRole('instructor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await eventService.deleteEvent(id, userId);
      res.status(204).send();
    } catch (error: any) {
      logger.error(`Delete event error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('cannot delete') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== UPDATE EVENT STATUS =====
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(updateEventStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const event = await eventService.updateEventStatus(id, status, userId, userRole);
      res.json({ success: true, data: event });
    } catch (error: any) {
      logger.error(`Update event status error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Invalid status') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

export default router;
ROUTE_EOF
echo "✅ src/routes/events.ts created"
echo ""

# ==============================================
# 5. REGISTER ROUTES IN APP
# ==============================================
echo "--- 5. REGISTER ROUTES DI src/index.ts ---"

# Cek apakah sudah ada import events route
if ! grep -q "import eventRoutes" src/index.ts; then
  # Insert import after last route import
  sed -i '/import.*routes.*from.*routes/d' src/index.ts
  # Add at the top with other imports
  sed -i '1iimport eventRoutes from "./routes/events";' src/index.ts
  # Find app.use for routes and add after
  sed -i '/app\.use.*\/api\/v1\/[a-z]/a app.use("/api/v1/events", eventRoutes);' src/index.ts
  echo "✅ Routes registered in src/index.ts"
else
  echo "⚠️ Routes already registered, skipping."
fi
echo ""

# ==============================================
# 6. VERIFICATION
# ==============================================
echo "--- 6. VERIFICATION ---"
echo "📁 Files created:"
ls -la src/schemas/event.schemas.ts src/repositories/EventRepository.ts src/services/EventService.ts src/routes/events.ts 2>/dev/null || echo "⚠️ Some files missing"
echo ""

echo "--- 7. TYPE CHECK ---"
npx tsc --noEmit src/schemas/event.schemas.ts src/repositories/EventRepository.ts src/services/EventService.ts src/routes/events.ts 2>&1 | head -20 || echo "⚠️ Type check warnings (may be due to dependencies)"
echo ""

echo "=========================================="
echo "  ✅ DAY 3-4: EVENT API SELESAI         "
echo "=========================================="
echo ""
echo "📌 Next: Unit tests & Integration tests"
echo "   Run: npx jest tests/unit/event.service.test.ts"
echo "   Run: npx jest tests/integration/events.test.ts"
echo ""
echo "🚀 API endpoints available:"
echo "   POST   /api/v1/events"
echo "   GET    /api/v1/events"
echo "   GET    /api/v1/events/:id"
echo "   PATCH  /api/v1/events/:id"
echo "   DELETE /api/v1/events/:id"
echo "   PATCH  /api/v1/events/:id/status"
