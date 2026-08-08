#!/bin/bash
set -e

echo "=========================================="
echo "  DAY 5-7: PARTICIPANT MANAGEMENT API    "
echo "=========================================="
echo ""

# ==============================================
# 1. CREATE SCHEMAS
# ==============================================
echo "--- 1. MEMBUAT src/schemas/event-participant.schemas.ts ---"
mkdir -p src/schemas
cat > src/schemas/event-participant.schemas.ts <<'SCHEMA_EOF'
import { z } from 'zod';

export const addParticipantSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
});

export const bulkAddParticipantsSchema = z.object({
  student_ids: z.array(z.string().min(1)).min(1, "At least one student ID required").max(1000, "Max 1000 students per batch"),
});

export const updateParticipantStatusSchema = z.object({
  status: z.enum(['invited', 'registered', 'attended', 'no_show', 'withdrew']),
});

export const listParticipantsQuerySchema = z.object({
  status: z.enum(['invited', 'registered', 'attended', 'no_show', 'withdrew']).optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
SCHEMA_EOF
echo "✅ Schemas created"
echo ""

# ==============================================
# 2. CREATE REPOSITORY
# ==============================================
echo "--- 2. MEMBUAT src/repositories/EventParticipantRepository.ts ---"
mkdir -p src/repositories
cat > src/repositories/EventParticipantRepository.ts <<'REPO_EOF'
import { PrismaClient, ParticipantStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface ParticipantFilters {
  status?: ParticipantStatus;
  limit?: number;
  offset?: number;
}

export class EventParticipantRepository {
  async addParticipant(eventId: string, studentId: string, status: ParticipantStatus = 'invited') {
    return prisma.eventParticipant.create({
      data: {
        event_id: eventId,
        student_id: studentId,
        status,
        registered_at: status === 'registered' ? new Date() : null,
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
      orderBy: { created_at: 'desc' },
    });
  }

  async updateStatus(participantId: string, status: ParticipantStatus, attendedAt?: Date) {
    const data: any = { status };
    if (status === 'registered' && !attendedAt) {
      data.registered_at = new Date();
    }
    if (status === 'attended' && attendedAt) {
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
    // Soft delete: set status to 'withdrew'
    return prisma.eventParticipant.update({
      where: { id: participantId },
      data: { status: 'withdrew' },
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
        status: 'attended',
        attended_at: attendedAt,
      },
    });
  }
}
REPO_EOF
echo "✅ Repository created"
echo ""

# ==============================================
# 3. CREATE SERVICE
# ==============================================
echo "--- 3. MEMBUAT src/services/EventParticipantService.ts ---"
mkdir -p src/services
cat > src/services/EventParticipantService.ts <<'SERV_EOF'
import { ParticipantStatus } from '@prisma/client';
import { EventParticipantRepository } from '../repositories/EventParticipantRepository';
import { eventService } from './EventService';
import { getUserById } from '../repositories/user.repository';
import { logger } from '../utils/logger';

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
SERV_EOF
echo "✅ Service created"
echo ""

# ==============================================
# 4. CREATE ROUTES
# ==============================================
echo "--- 4. MEMBUAT src/routes/event-participants.ts ---"
mkdir -p src/routes
cat > src/routes/event-participants.ts <<'ROUTE_EOF'
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { eventParticipantService } from '../services/EventParticipantService';
import {
  addParticipantSchema,
  bulkAddParticipantsSchema,
  updateParticipantStatusSchema,
  listParticipantsQuerySchema,
} from '../schemas/event-participant.schemas';
import logger from '../utils/logger';

const router = Router({ mergeParams: true });

// ===== ADD SINGLE PARTICIPANT =====
router.post(
  '/',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(addParticipantSchema),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId || req.params.id;
      const { student_id } = req.body;
      const userId = req.user!.userId;

      const participant = await eventParticipantService.addParticipant(
        eventId,
        student_id,
        userId
      );

      res.status(201).json({
        success: true,
        data: participant,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Add participant error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('already registered') ? 409 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== BULK ADD PARTICIPANTS =====
router.post(
  '/bulk',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(bulkAddParticipantsSchema),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId || req.params.id;
      const { student_ids } = req.body;
      const userId = req.user!.userId;

      const result = await eventParticipantService.bulkAddParticipants(
        eventId,
        student_ids,
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Bulk add participants error: ${error.message}`);
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== GET PARTICIPANTS ROSTER =====
router.get(
  '/',
  authMiddleware,
  validate(listParticipantsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId || req.params.id;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const filters = req.query;

      const participants = await eventParticipantService.getParticipants(
        eventId,
        userId,
        userRole,
        filters
      );

      res.json({
        success: true,
        data: participants,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Get participants error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 : 403;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== UPDATE PARTICIPANT STATUS =====
router.patch(
  '/:participantId/status',
  authMiddleware,
  requireRole('instructor', 'admin'),
  validate(updateParticipantStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { participantId } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const updated = await eventParticipantService.updateParticipantStatus(
        participantId,
        status,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: updated,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error: any) {
      logger.error(`Update participant status error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('Invalid status') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

// ===== REMOVE PARTICIPANT =====
router.delete(
  '/:participantId',
  authMiddleware,
  requireRole('instructor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { participantId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await eventParticipantService.removeParticipant(participantId, userId, userRole);

      res.status(204).send();
    } catch (error: any) {
      logger.error(`Remove participant error: ${error.message}`);
      const status = error.message.includes('not found') ? 404 :
                     error.message.includes('cannot remove') ? 422 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }
);

export default router;
ROUTE_EOF
echo "✅ Routes created"
echo ""

# ==============================================
# 5. REGISTER ROUTES IN APP.TS
# ==============================================
echo "--- 5. REGISTER ROUTES DI APP.TS ---"
if ! grep -q "eventParticipantRoutes" src/app.ts; then
  sed -i '/import.*routes/a import eventParticipantRoutes from "./routes/event-participants";' src/app.ts
  sed -i '/app.use.*\/api\/v1\/events/a \  app.use("/api/v1/events/:id/participants", eventParticipantRoutes);' src/app.ts
  echo "✅ Routes registered in app.ts"
else
  echo "⚠️ Routes already registered"
fi
echo ""

# ==============================================
# 6. INTEGRATION TEST (AUTO)
# ==============================================
echo "--- 6. RUNNING INTEGRATION TEST ---"
# Start server
pkill -f "tsx.*index.ts" 2>/dev/null || true
sleep 2
pnpm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "🔁 Server PID: $SERVER_PID"

echo "⏳ Menunggu server siap..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server siap!"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

echo "▶️ Testing participant endpoints..."

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"auto_test@example.com","password":"SecurePass123!"}' | jq -r '.data.token')

# Get event ID
EVENT_ID=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

# Register a student
STUDENT_REG=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student_participant@example.com","password":"SecurePass123!","first_name":"Student","last_name":"Participant","role":"student"}')
STUDENT_ID=$(echo "$STUDENT_REG" | jq -r '.data.user.id')

echo "✅ Student ID: $STUDENT_ID"

# Add participant
ADD_RESP=$(curl -s -X POST "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":\"$STUDENT_ID\"}")
echo "📄 Add participant response:"
echo "$ADD_RESP" | jq .

# Get roster
ROSTER=$(curl -s -X GET "http://localhost:3000/api/v1/events/$EVENT_ID/participants" \
  -H "Authorization: Bearer $TOKEN")
echo "📄 Roster:"
echo "$ROSTER" | jq .

# Kill server
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "=========================================="
echo "  ✅ DAY 5-7 PARTICIPANT API SELESAI    "
echo "=========================================="
