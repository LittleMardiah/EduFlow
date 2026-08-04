# ROADMAP FASE 4 - EduFlow

## Events & Analytics (Weeks 4-5)

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*Detailed Implementation Roadmap for Phase 4 | Solo Developer | Portfolio Project*

---

## 📌 DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Type** | Implementation Roadmap - FASE 4 (IMPROVED v1.1) |
| **Document Version** | v1.1 (Enhanced & Validated) |
| **Created Date** | 2026-07-29 |
| **Last Updated** | 2026-07-29 |
| **Revision** | Comprehensive improvements based on LAPORAN_VALIDASI_ROADMAP.md |
| **Author** | M. Arif Aulia |
| **Status** | ✅ Complete, Detailed & Ready for Implementation |
| **Duration** | Weeks 4-5 (14 days, ~100 hours solo dev time) |
| **Previous Phase** | ROADMAP_FASE_3.md (Submission & Grading Pipeline) |
| **Next Phase** | ROADMAP_FASE_5.md (Frontend, Testing & Deployment) |
| **Source Documents** | PRD.md v2.0, DATABASE_SCHEMA.md v1.0, LOGIC_FLOW.md v1.0, HALAMAN.md v2.0, TDD.md v1.0, API_CONTRACT.md v1.0, SECURITY_SPEC.md v1.0, DRP.md, STP.md v1.0, BLUEPRINT_ROADMAP.md v1.1 |
| **Dependencies** | FASE 1-3 completion (auth, quiz mgmt, submission pipeline) |
| **Integration Points** | All tables from FASE 1-3 + new event/analytics/notification tables |

---

## 🎯 FASE 4 OBJECTIVES & SUCCESS CRITERIA

### Primary Objectives

1. **Event Scheduling System (F007) - CRITICAL**
   - ✅ Create, read, update, delete events with full CRUD API
   - ✅ Event lifecycle: `scheduled` → `in_progress` → `completed` (or `cancelled`)
   - ✅ Set start/end times with **timezone-aware storage (UTC in DB, display per user timezone)**
   - ✅ Configure event settings: `allow_retakes`, `show_answers` timing, `max_participants` (optional)
   - ✅ Persist event metadata: title, description, instructor_id, quiz_id, organization_id
   - ✅ Support soft deletes (deleted_at timestamp for audit compliance)
   - **Timezone Specification** (FROM SECURITY_SPEC.md & TDD.md):
     - All times stored in UTC in database (`scheduled_start_at`, `scheduled_end_at` as TIMESTAMP with UTC)
     - User `preferred_timezone` stored in users table (IANA timezone string e.g., "Asia/Jakarta", "US/Eastern")
     - Frontend displays times converted to user's timezone (date-fns library)
     - DST (Daylight Saving Time) handled automatically by timezone library
     - API always returns times in ISO 8601 UTC format; client converts on display

2. **Event Participant Management (F007b) - CRITICAL**
   - ✅ Add/remove participants to events (bulk CSV upload via frontend)
   - ✅ Track participant roster with status: `invited` → `registered` → `attended` (or `no_show`, `withdrew`)
   - ✅ Record metadata: `registered_at`, `attended_at` timestamps (marked when submission created)
   - ✅ Link `event_participants` to submissions (one-to-one: one submission per event per student)
   - ✅ Enforce UNIQUE constraint `(event_id, student_id)` - prevent duplicate enrollment
   - ✅ Support status transitions with validation (invited can only move to registered/withdrew)
   - ✅ Attendance tracking: auto-mark `attended_at` when student creates submission for event

3. **Event Settings & Workflow (F007c) - CRITICAL**
   - ✅ `allow_retakes` Boolean: if false, student can only submit once per event
   - ✅ `show_answers` Enum: `immediately` (show after submit), `after_deadline` (show after event ends), `never` (don't show)
   - ✅ Max attempts per event (inherited from quiz config, optionally overridden per event)
   - ✅ Handle event status transitions with timezone considerations:
     - `scheduled` → `in_progress`: triggered by time passing OR manual admin trigger
     - `in_progress` → `completed`: triggered by scheduled_end_at time OR manual admin trigger
     - Any → `cancelled`: admin can cancel anytime (notifies participants)
   - ✅ Respect quiz configuration while allowing event-level overrides (quiz says allow_retakes=false, but event can say true)
   - ✅ Validation: `scheduled_end_at` must be > `scheduled_start_at`, within reasonable bounds (not 10+ years out)

4. **Analytics System (F009) - CRITICAL**
   - ✅ **Aggregated performance metrics** stored in `analytics` table:
     - `attempt_count`: number of quiz attempts by student
     - `best_score`: highest score percentage across all attempts
     - `avg_score`: average score percentage across attempts
     - `pass_count`: number of attempts where score >= passing_score
     - `fail_count`: number of attempts where score < passing_score
     - `avg_time_spent_seconds`: average time spent per attempt
     - `first_attempt_at`, `last_attempt_at`: timestamps for trend tracking
   - ✅ **Student personal analytics view**:
     - My quizzes: list of quizzes I've taken with scores
     - My progress: score trends over time (graph-friendly data)
     - My performance by question: which question types I struggle with
     - Comparison to class average (if in event with cohort)
   - ✅ **Instructor class analytics view**:
     - Students' performance table: [Student Name | Best Score | Avg Score | Attempts | Status]
     - Cohort insights: class average, median, standard deviation, percentile distribution
     - Assignment results: per-quiz performance summary
     - Performance by question: aggregate % correct per question (identify difficult questions)
   - ✅ **Cohort reports** (GROUP BY event_id):
     - **Cohort definition**: All students invited to the same event = one cohort
     - Average performance: class avg score, median, 25th/75th percentile
     - Score distribution: histogram of score ranges (0-25%, 25-50%, 50-75%, 75-100%)
     - Trends over time: performance improvement across multiple quiz events
     - Identify at-risk students: those scoring <50% or showing declining trend
   - ✅ **Performance by question** (GROUP BY question_id):
     - % of cohort that got each question correct
     - Difficulty ranking (which questions are hardest)
     - Item-difficulty index (classical test theory metric)
   - ✅ **Time-series analytics**:
     - Track score improvement across attempts (attempt 1 vs 2 vs 3)
     - Identify if students are learning (trend = positive slope) or stalling
     - Filter by date range (week, month, semester)

5. **Performance Metrics Calculation (F009a) - CRITICAL**
   - ✅ Average score calculation: `SUM(score_percentage) / COUNT(submissions)` per student per quiz
   - ✅ Best score tracking: `MAX(score_percentage)` per student per quiz
   - ✅ Score distribution: `HISTOGRAM(score_percentage, bins=[0,25,50,75,100])`
   - ✅ Performance by question: `SUM(is_correct) / COUNT(answers)` per question across cohort
   - ✅ Trends over time: plot score vs attempt_number; calculate trend line (linear regression or simple slope)
   - ✅ Time spent analytics: `AVG(time_spent_seconds)`, `MIN()`, `MAX()` per quiz per cohort
   - ✅ Pass/fail rates: `COUNT(submissions WHERE score >= passing_score) / COUNT(submissions)` per quiz per cohort
   - ✅ **Analytics Aggregation Strategy (FROM LAPORAN VALIDASI)**:
     - **Real-time refresh**: Analytics updated immediately after each submission (not batched, not delayed)
     - **No scheduled jobs needed**: Simpler architecture for MVP (update analytics in same transaction as submission)
     - **Update logic**: After submission is graded, INSERT or UPDATE analytics record for that student+quiz+event combo
     - **Data freshness guarantee**: <1 second latency between submission graded → analytics displayed
     - **Cache invalidation**: When analytics changes, frontend cache invalidated via WebSocket/polling
     - **Performance optimization**: Index on `(student_id, quiz_id, event_id)` for fast lookups
     - **Scaling**: For 1000+ concurrent users, consider async aggregation in v1.1 (but v1.0 synchronous is fine)

6. **Notifications System (F011 - OPTIONAL P1)**
   - ✅ **Event reminders**: Notification created 1 hour before event start (triggered by scheduled job or client polling)
   - ✅ **Submission graded alerts**: Notification created when auto-grading completes
   - ✅ **Quiz published notifications**: Notification sent to all enrolled students when instructor publishes quiz
   - ✅ **Event started alerts**: Notification when event transitions from scheduled to in_progress
   - ✅ **In-app notification display**: Notifications stored in `notifications` table, client polls for unread
   - ✅ **Notification status tracking**: `pending` → `sent` → `read` (or `failed` if delivery fails)
   - ✅ **MVP scope**: In-app notifications only (no email in v1.0)
   - ✅ **Email notifications deferred to v1.1**: Requires SendGrid/Resend integration (not in MVP)
   - ✅ **Real-time delivery** (FROM LAPORAN VALIDASI):
     - MVP: In-app notifications only, stored in notifications table
     - Client polls GET `/notifications?unread=true` endpoint every 5-10 seconds
     - Notification structure: { id, user_id, type, title, message, data (JSON), read_at, created_at }
     - Email notifications → v1.1 feature (requires email service setup)
     - WebSocket real-time updates → v1.1 (adds complexity, not needed for MVP)

7. **Database Schema Extension (FASE 4 Tables)**
   - ✅ `events` table (scheduled quiz sessions, 300+ rows per deployment)
   - ✅ `event_participants` table (roster, 10K+ rows per deployment at scale)
   - ✅ `analytics` table (aggregated metrics, auto-updated per submission)
   - ✅ `notifications` table (optional P1, for notification tracking)
   - ✅ Proper foreign key constraints: `ON DELETE CASCADE` (cleanup), `ON DELETE SET NULL` (preserve history)
   - ✅ Performance indexes on common queries: `(quiz_id)`, `(status)`, `(scheduled_start_at)`, `(student_id, quiz_id)`
   - ✅ Soft deletes via `deleted_at` timestamp (audit compliance per DRP.md)
   - ✅ Unique constraints prevent data integrity issues: `UNIQUE(event_id, student_id)`, `UNIQUE(student_id, quiz_id, event_id)`

8. **Testing & Validation (CRITICAL for Portfolio)**
   - ✅ Unit tests for analytics calculation service (target >85% coverage):
     - Test avg score calculation with 0, 1, 5, 10 submissions
     - Test edge cases: single attempt, all perfect scores, all failing scores
     - Test null handling (no submissions = NULL, not 0)
   - ✅ Integration tests for event endpoints (Supertest + database):
     - POST /events: create event, verify all fields persisted, status=scheduled
     - GET /events/:id: retrieve with participants, validate relationships
     - PATCH /events/:id: update fields, verify validation (end_time > start_time)
     - DELETE /events/:id: soft delete, verify deleted_at set, audit_logs entry created
     - POST /events/:id/participants: add participant, verify UNIQUE constraint
   - ✅ Participant roster management testing:
     - Add single participant: status=invited
     - Bulk add participants (CSV simulation): all added with correct status
     - Update participant status: invited → registered → attended workflow
     - Prevent duplicate enrollment: attempt to add same student twice → 409 Conflict
     - Remove participant: soft delete, participant_status = withdrew
   - ✅ Analytics aggregation accuracy testing:
     - Submit quiz 5 times with scores [60, 70, 80, 75, 85]
     - Verify: avg_score=74, best_score=85, attempt_count=5, pass_count=5
     - Multi-question analytics: verify % correct per question
   - ✅ Timezone handling validation:
     - Event created with timezone="Asia/Jakarta"
     - Verify stored time is UTC in database
     - Verify API returns ISO 8601 UTC format
     - Test DST transitions (spring forward, fall back)
   - ✅ Edge case handling:
     - No submissions for a quiz: analytics shows attempt_count=0, avg_score=NULL
     - Single attempt: avg_score = best_score = that score
     - Multiple attempts: best_score ≥ avg_score always
     - Event with 0 participants: valid event, empty roster

### Success Metrics (FASE 4)

| Metric | Target | Measurement Method | Pass Criteria |
|--------|--------|------------------|---|
| **Event Creation API** | 100% | POST /events with valid payload | ✅ Event created with status=scheduled, all fields persisted |
| **Event Retrieval API** | 100% | GET /events/:id | ✅ Correct event data + participant list returned |
| **Event Update API** | 100% | PATCH /events/:id | ✅ Fields updated, status transitions validated |
| **Event Deletion API** | 100% | DELETE /events/:id | ✅ Soft delete (deleted_at set), audit_logs entry created |
| **Event List API** | 100% | GET /events?status=scheduled | ✅ Filtered list correct, pagination working |
| **Participant Add API** | 100% | POST /events/:id/participants | ✅ Participant added with status=invited |
| **Participant List API** | 100% | GET /events/:id/participants | ✅ Roster returned with all participants + metadata |
| **Participant Status Update** | 100% | PATCH /participants/:id | ✅ Status transitions valid (invited→registered→attended) |
| **Participant Uniqueness** | 100% | Try duplicate add | ✅ Duplicate rejected (409 Conflict), UNIQUE constraint enforced |
| **Event Status Lifecycle** | 100% | State machine validation | ✅ scheduled→in_progress→completed transitions valid, cancel works |
| **Timezone Storage** | 100% | Database inspection | ✅ All times in UTC, timezone field set, DST handled |
| **Analytics Aggregation** | 100% | Service unit tests | ✅ avg_score, best_score, attempt_count calculated correctly |
| **Student Analytics API** | 100% | GET /analytics/student | ✅ Personal metrics returned, accurate calculations |
| **Instructor Analytics API** | 100% | GET /analytics/instructor | ✅ Class metrics + student list with scores returned |
| **Instructor Cohort Report** | 100% | GET /analytics/instructor/events/:id | ✅ Cohort metrics: avg, median, std dev, percentile distribution |
| **Performance by Question** | 100% | GET /analytics/questions/:id | ✅ % correct per question calculated, ranked by difficulty |
| **Trend Calculation** | 100% | Multiple submissions | ✅ Score improvement tracked over attempts, trend visible |
| **Notification Creation** | 100% | Auto-trigger on events | ✅ Notification created for event_reminder, submission_graded, etc. |
| **Notification API** | 100% | GET /notifications?unread=true | ✅ Unread notifications returned, read_at set on mark-as-read |
| **Database Integrity** | 100% | Constraint validation | ✅ FK constraints enforced, soft deletes working, unique constraints prevent duplicates |
| **Test Coverage (Backend)** | >85% | Jest coverage report | ✅ Events/analytics/notification services >85% covered |
| **Integration Tests** | 100% | Supertest suite | ✅ All event/analytics/notification endpoints tested |
| **Performance** | <500ms | Load test response times | ✅ Event queries <500ms, analytics aggregation <2s |
| **API Response Format** | 100% | JSON validation | ✅ Consistent format: { success, data, meta, error (if applicable) } |
| **RBAC Enforcement** | 100% | Endpoint permission checks | ✅ Only instructors can create events for their quizzes, only students in roster can participate |

---

## 📋 WEEKLY BREAKDOWN (DETAILED)

### WEEK 4: Event System & Basic Analytics (Days 1-7)

#### Day 1-2: Database Schema Extension & Migrations

**Tasks (16 hours):**

1. **Extend Prisma Schema with FASE 4 Models**
   - [ ] Update `prisma/schema.prisma` with new enums:
     - `EventStatus`: scheduled, in_progress, completed, cancelled
     - `ParticipantStatus`: invited, registered, attended, no_show, withdrew
     - `ShowAnswersType`: immediately, after_deadline, never
     - `NotificationType`: event_reminder, submission_graded, quiz_published, event_started
     - `NotificationStatus`: pending, sent, read, failed
   
   - [ ] Add `Event` model:
     ```prisma
     model Event {
       id                String          @id @default(uuid())
       quiz_id           String          // FK to Quiz
       quiz              Quiz            @relation("EventQuiz", fields: [quiz_id], references: [id], onDelete: Cascade)
       
       created_by        String          // FK to User (instructor)
       instructor        User            @relation("EventCreatedBy", fields: [created_by], references: [id], onDelete: Cascade)
       
       organization_id   String          // FK to Organization
       organization      Organization    @relation(fields: [organization_id], references: [id], onDelete: Cascade)
       
       title             String          @db.VarChar(255)
       description       String?         @db.Text
       scheduled_start_at DateTime        // UTC time in database
       scheduled_end_at  DateTime        // UTC time in database
       timezone          String          @db.VarChar(50)  // IANA timezone (e.g., "Asia/Jakarta")
       
       status            EventStatus     @default(scheduled)
       allow_retakes     Boolean         @default(false)
       show_answers      ShowAnswersType @default(immediately)
       max_participants  Int?            // Nullable, no hard limit in MVP
       
       // Metadata
       total_participants Int            @default(0)  // Denormalized for quick access
       created_at        DateTime        @default(now())
       updated_at        DateTime        @updatedAt
       deleted_at        DateTime?       // Soft delete
       
       // Relations
       participants      EventParticipant[]
       submissions       Submission[]    // FK from submissions.event_id
       analytics         Analytics[]
       auditLogs         AuditLog[]
       
       // Indexes for common queries
       @@index([quiz_id])
       @@index([created_by])
       @@index([status])
       @@index([scheduled_start_at])
       @@index([deleted_at])
       @@index([organization_id])
     }
     ```
   
   - [ ] Add `EventParticipant` model:
     ```prisma
     model EventParticipant {
       id            String           @id @default(uuid())
       event_id      String           // FK to Event
       event         Event            @relation(fields: [event_id], references: [id], onDelete: Cascade)
       
       student_id    String           // FK to User
       student       User             @relation("EventParticipants", fields: [student_id], references: [id], onDelete: Cascade)
       
       status        ParticipantStatus @default(invited)
       submission_id String?          // FK to Submission (filled when attended)
       submission    Submission?      @relation("SubmissionParticipant", fields: [submission_id], references: [id], onDelete: SetNull)
       
       registered_at DateTime?        // When student enrolled
       attended_at   DateTime?        // Auto-set when submission created for this event
       
       created_at    DateTime         @default(now())
       updated_at    DateTime         @updatedAt
       
       // Constraints & Indexes
       @@unique([event_id, student_id])  // One enrollment per event per student
       @@index([event_id])
       @@index([student_id])
       @@index([status])
     }
     ```
   
   - [ ] Add `Analytics` model:
     ```prisma
     model Analytics {
       id                    String   @id @default(uuid())
       student_id            String   // FK to User
       student               User     @relation("StudentAnalytics", fields: [student_id], references: [id], onDelete: Cascade)
       
       quiz_id               String   // FK to Quiz
       quiz                  Quiz     @relation("QuizAnalytics", fields: [quiz_id], references: [id], onDelete: Cascade)
       
       event_id              String?  // FK to Event (nullable for standalone quizzes)
       event                 Event?   @relation(fields: [event_id], references: [id], onDelete: SetNull)
       
       // Aggregated metrics
       attempt_count         Int      @default(0)
       best_score            Decimal  @db.Decimal(5, 2)
       avg_score             Decimal  @db.Decimal(5, 2)
       first_attempt_at      DateTime?
       last_attempt_at       DateTime?
       pass_count            Int      @default(0)
       fail_count            Int      @default(0)
       avg_time_spent_seconds Int     @default(0)
       
       updated_at            DateTime @updatedAt
       
       // Constraints & Indexes
       @@unique([student_id, quiz_id, event_id])
       @@index([student_id, quiz_id])
       @@index([event_id])
     }
     ```
   
   - [ ] Add `Notification` model:
     ```prisma
     model Notification {
       id        String             @id @default(uuid())
       user_id   String             // FK to User
       user      User               @relation("UserNotifications", fields: [user_id], references: [id], onDelete: Cascade)
       
       type      NotificationType
       title     String             @db.VarChar(255)
       message   String             @db.Text
       data      Json?              // Metadata: event_id, submission_id, quiz_id, etc.
       
       status    NotificationStatus @default(pending)
       read_at   DateTime?
       sent_at   DateTime?
       
       created_at DateTime          @default(now())
       
       @@index([user_id, status])
       @@index([user_id, created_at])
     }
     ```
   
   - [ ] Update `User` model to add timezone:
     ```prisma
     // Add to existing User model:
     preferred_timezone  String  @default("UTC")  // IANA timezone
     ```
   
   - [ ] Update `Submission` model (if not already done in FASE 3):
     ```prisma
     // In Submission model, ensure:
     event_id        String?         // FK to Event
     event           Event?          @relation(fields: [event_id], references: [id], onDelete: SetNull)
     event_participant EventParticipant? @relation("SubmissionParticipant")
     ```

2. **Create Prisma Migration**
   - [ ] Run: `npx prisma migrate dev --name add_fase4_event_analytics_notification`
   - [ ] Verify migration generates SQL for all new tables
   - [ ] Check generated migration file in `prisma/migrations/` for correctness
   - [ ] Test migration on local database: should create all tables with constraints

3. **Seed Database (Optional - for testing)**
   - [ ] Create `prisma/seed.ts` with sample data:
     - 3 sample events for different quizzes
     - 10 sample participants (mix of all status types)
     - Sample analytics records (various attempt counts, scores)
   - [ ] Run: `npx prisma db seed`
   - [ ] Verify data in database via Prisma Studio: `npx prisma studio`

**Deliverables:**
- ✅ Prisma schema updated with all 4 new models
- ✅ Migration created and tested
- ✅ Database schema matches DATABASE_SCHEMA.md exactly
- ✅ All enums defined and used correctly
- ✅ Indexes created for performance

**Time Estimate: 16 hours**

---

#### Day 3-4: Event Management API (CRUD)

**Tasks (20 hours):**

1. **Repository Layer (Data Access)**
   - [ ] Create `src/repositories/EventRepository.ts`:
     ```typescript
     interface EventRepository {
       create(payload: CreateEventDTO): Promise<Event>;
       findById(id: string): Promise<Event | null>;
       findByInstructor(instructor_id: string): Promise<Event[]>;
       findByQuiz(quiz_id: string): Promise<Event[]>;
       findByStatus(status: EventStatus): Promise<Event[]>;
       update(id: string, payload: UpdateEventDTO): Promise<Event>;
       softDelete(id: string): Promise<void>;
       findAll(filters?: EventFilters): Promise<Event[]>;
     }
     ```
   - [ ] Implement using Prisma (example):
     ```typescript
     async findById(id: string) {
       return await prisma.event.findUnique({
         where: { id },
         include: {
           quiz: true,
           instructor: { select: { id: true, email: true, first_name: true, last_name: true } },
           participants: { include: { student: true } },
         },
       });
     }
     ```
   - [ ] Include proper error handling (not found → null, not throw)
   - [ ] All queries check `deleted_at IS NULL` (soft delete filter)

2. **Service Layer (Business Logic)**
   - [ ] Create `src/services/EventService.ts`:
     ```typescript
     class EventService {
       async createEvent(payload: CreateEventDTO, instructor_id: string): Promise<Event>;
       async getEventDetails(event_id: string, user_id: string): Promise<Event>;
       async updateEvent(event_id: string, payload: UpdateEventDTO, instructor_id: string): Promise<Event>;
       async deleteEvent(event_id: string, instructor_id: string): Promise<void>;
       async listEvents(filters: EventFilters, user_id: string): Promise<Event[]>;
       async updateEventStatus(event_id: string, new_status: EventStatus): Promise<Event>;
     }
     ```
   - [ ] Implement business logic:
     - Authorization check: only instructor or admin can create/update events
     - Validation: `scheduled_end_at > scheduled_start_at`
     - Validation: timezone is valid IANA timezone
     - Validation: `created_by` (instructor) owns the quiz being referenced
     - Validation: `max_participants` is reasonable (null or >0)
   - [ ] Status transitions validation:
     ```typescript
     // Only allow transitions: scheduled→in_progress, in_progress→completed, any→cancelled
     const validTransitions = {
       scheduled: ['in_progress', 'cancelled'],
       in_progress: ['completed', 'cancelled'],
       completed: ['cancelled'],
       cancelled: []
     };
     ```

3. **Controller Layer (API Endpoints)**
   - [ ] Create `src/routes/events.ts`:
     - `POST /events` - Create event
     - `GET /events/:id` - Get event details
     - `PUT /events/:id` - Full update
     - `PATCH /events/:id` - Partial update
     - `DELETE /events/:id` - Soft delete
     - `GET /events` - List events with filters
     - `PATCH /events/:id/status` - Update status
   
   - [ ] Implement endpoint handlers (example POST):
     ```typescript
     router.post('/events', requireAuth, validateRole('instructor', 'admin'), async (req, res) => {
       const { error, data } = EventCreateSchema.safeParse(req.body);
       if (error) return res.status(400).json({ success: false, error: error.flatten() });
       
       try {
         const event = await eventService.createEvent(data, req.user.id);
         res.status(201).json({
           success: true,
           data: event,
           meta: { timestamp: new Date().toISOString() }
         });
       } catch (err) {
         handleError(res, err);
       }
     });
     ```
   
   - [ ] Implement Zod validation schemas:
     ```typescript
     const EventCreateSchema = z.object({
       quiz_id: z.string().uuid(),
       title: z.string().min(3).max(255),
       description: z.string().optional(),
       scheduled_start_at: z.coerce.date(),
       scheduled_end_at: z.coerce.date(),
       timezone: z.string().regex(/^[A-Za-z_\/]+$/), // Simple IANA validation
       allow_retakes: z.boolean().default(false),
       show_answers: z.enum(['immediately', 'after_deadline', 'never']).default('immediately'),
       max_participants: z.number().int().positive().optional(),
     }).refine(data => data.scheduled_end_at > data.scheduled_start_at, {
       message: "End time must be after start time",
       path: ["scheduled_end_at"]
     });
     ```

4. **Testing (Unit + Integration)**
   - [ ] Unit tests for EventService:
     - `test('createEvent creates event with correct fields')`
     - `test('createEvent validates timezone')`
     - `test('createEvent rejects end_time < start_time')`
     - `test('updateEventStatus validates state transitions')`
     - `test('authorization: only instructor can create own events')`
   
   - [ ] Integration tests with Supertest:
     - `test('POST /events creates and returns event')`
     - `test('GET /events/:id returns event with participants')`
     - `test('PATCH /events/:id updates fields')`
     - `test('DELETE /events/:id soft deletes')`
     - `test('PATCH /events/:id/status rejects invalid transitions')`
   
   - [ ] Target: >85% test coverage for EventService

**Deliverables:**
- ✅ EventRepository fully implemented
- ✅ EventService with validation and authorization
- ✅ All 7 event endpoints implemented
- ✅ Request validation via Zod schemas
- ✅ Comprehensive test suite (unit + integration)
- ✅ Error handling matches API_CONTRACT.md

**Time Estimate: 20 hours**

---

#### Day 5-7: Participant Management & Event Status Transitions

**Tasks (18 hours):**

1. **Participant Repository & Service**
   - [ ] Create `EventParticipantRepository.ts`:
     - `addParticipant(event_id, student_id, status)`
     - `removeParticipant(event_id, student_id)`
     - `updateStatus(participant_id, new_status)`
     - `getParticipants(event_id, filters?)`
     - `getParticipantByEventStudent(event_id, student_id)`
   
   - [ ] Implement validation:
     - UNIQUE constraint check (prevent duplicate enrollment)
     - Return 409 Conflict if duplicate detected
     - Validate status transitions (invited→registered→attended only)
     - Auto-set `attended_at` when status = attended

2. **Participant API Endpoints**
   - [ ] `POST /events/:id/participants` - Add single participant
   - [ ] `POST /events/:id/participants/bulk` - Bulk add (CSV simulation)
   - [ ] `GET /events/:id/participants` - Get roster
   - [ ] `PATCH /events/:id/participants/:participantId` - Update participant status
   - [ ] `DELETE /events/:id/participants/:participantId` - Remove participant
   
   - [ ] Request validation:
     ```typescript
     const AddParticipantSchema = z.object({
       student_id: z.string().uuid(),
     });
     
     const BulkAddSchema = z.object({
       student_ids: z.array(z.string().uuid()).min(1).max(1000),
     });
     ```

3. **Event Status Transitions & Automation**
   - [ ] Implement status transition logic:
     - `scheduled` → `in_progress`: manual trigger via PATCH endpoint
     - `in_progress` → `completed`: manual trigger OR automatic at `scheduled_end_at`
     - Any → `cancelled`: admin only, notifies participants
   
   - [ ] Add automated status updates (optional, can be polling-based in MVP):
     - Backend job (run every 5 minutes): check events where `scheduled_start_at` <= now and status=scheduled → transition to in_progress
     - Backend job: check events where `scheduled_end_at` <= now and status=in_progress → transition to completed
     - For MVP: Can use polling from frontend (check event status on dashboard load)
   
   - [ ] Notification triggers on status change:
     - scheduled → in_progress: create notifications for all participants (type: event_started)
     - in_progress → completed: create notifications for all participants (type: event_completed)
     - → cancelled: create notifications with cancellation reason

4. **Attendance Tracking**
   - [ ] Auto-set `attended_at` when student creates submission for event:
     ```typescript
     // In SubmissionService.createSubmission():
     if (event_id) {
       const eventParticipant = await eventParticipantRepo.getByEventStudent(event_id, student_id);
       if (eventParticipant) {
         await eventParticipantRepo.updateStatus(eventParticipant.id, 'attended', { attended_at: now() });
       }
     }
     ```
   
   - [ ] Track no_show participants: After event completes, mark those with status=registered (never submitted) as no_show

5. **Testing**
   - [ ] Unit tests:
     - `test('addParticipant with duplicate rejects with 409')`
     - `test('addParticipant sets status=invited')`
     - `test('updateStatus validates transition rules')`
     - `test('removeParticipant soft deletes participant')`
   
   - [ ] Integration tests:
     - `test('POST /events/:id/participants adds participant')`
     - `test('GET /events/:id/participants returns roster')`
     - `test('PATCH status transitions work correctly')`
     - `test('Submission creation auto-marks participant as attended')`

**Deliverables:**
- ✅ Participant CRUD fully implemented
- ✅ Status transition validation
- ✅ Attendance tracking automated
- ✅ All 5 participant endpoints working
- ✅ Test coverage >85%

**Time Estimate: 18 hours**

---

### WEEK 5: Advanced Analytics & Notifications (Days 8-14)

#### Day 8-9: Analytics Calculation & Aggregation

**Tasks (18 hours):**

1. **Analytics Repository & Service**
   - [ ] Create `AnalyticsRepository.ts`:
     - `getStudentAnalytics(student_id, quiz_id, event_id?)`
     - `getInstructorAnalytics(instructor_id, filters?)`
     - `getQuestionAnalytics(quiz_id, filters?)`
     - `getTrendAnalytics(student_id, quiz_id, timerange?)`
     - `getCohortAnalytics(event_id)`
     - `updateAnalytics(student_id, quiz_id, event_id?, metrics)` - upsert
   
   - [ ] Implement aggregation queries using Prisma:
     ```typescript
     // Example: Get student personal analytics
     async getStudentAnalytics(student_id: string) {
       const submissions = await prisma.submission.findMany({
         where: { student_id, deleted_at: null },
         include: { quiz: true, event: true, answers: true },
       });
       
       return submissions.map(sub => ({
         quiz_id: sub.quiz_id,
         event_id: sub.event_id,
         score: sub.score_percentage,
         attempt_number: sub.attempt_number,
         submitted_at: sub.submitted_at,
         time_spent: sub.time_spent_seconds,
       }));
     }
     ```

2. **Analytics Aggregation Strategy** (FROM LAPORAN VALIDASI)
   - [ ] **Real-time update on submission**:
     - After submission is graded (FASE 3), immediately update analytics record
     - No scheduled jobs (simpler MVP architecture)
     - Use single database transaction (grading + analytics update = atomic)
   
   - [ ] **Update logic**:
     ```typescript
     // After grading submission:
     const analytics = await analyticsRepo.getByStudentQuizEvent(student_id, quiz_id, event_id);
     
     if (analytics) {
       // Update existing
       const newAttempts = analytics.attempt_count + 1;
       const newAvgScore = (analytics.avg_score * analytics.attempt_count + submission.score) / newAttempts;
       const newBestScore = Math.max(analytics.best_score, submission.score);
       
       await analyticsRepo.update(analytics.id, {
         attempt_count: newAttempts,
         avg_score: newAvgScore,
         best_score: newBestScore,
         pass_count: submission.score >= quiz.passing_score ? analytics.pass_count + 1 : analytics.pass_count,
         fail_count: submission.score < quiz.passing_score ? analytics.fail_count + 1 : analytics.fail_count,
         last_attempt_at: submission.submitted_at,
       });
     } else {
       // Create new
       await analyticsRepo.create({
         student_id, quiz_id, event_id,
         attempt_count: 1,
         best_score: submission.score,
         avg_score: submission.score,
         pass_count: submission.score >= quiz.passing_score ? 1 : 0,
         fail_count: submission.score < quiz.passing_score ? 1 : 0,
         first_attempt_at: submission.submitted_at,
         last_attempt_at: submission.submitted_at,
       });
     }
     ```
   
   - [ ] **Data freshness**: <1 second latency (same transaction)
   - [ ] **No batch processing**: Eliminates delay between submission and visible score

3. **Student Personal Analytics Endpoint**
   - [ ] `GET /analytics/student` - My quizzes & progress
   - [ ] `GET /analytics/student/:quizId` - My performance on specific quiz
   - [ ] Response structure:
     ```json
     {
       "success": true,
       "data": {
         "quizzes": [
           {
             "quiz_id": "...",
             "quiz_title": "English Assessment",
             "best_score": 85,
             "avg_score": 78,
             "attempt_count": 3,
             "pass_count": 2,
             "fail_count": 1,
             "class_avg": 72,
             "percentile_rank": 85,
             "attempts": [
               { "attempt": 1, "score": 70, "submitted_at": "2026-07-29T10:00:00Z" },
               { "attempt": 2, "score": 80, "submitted_at": "2026-07-29T11:00:00Z" },
               { "attempt": 3, "score": 85, "submitted_at": "2026-07-29T12:00:00Z" }
             ],
             "trend": "improving"  // improving, stable, declining
           }
         ]
       }
     }
     ```
   - [ ] Include comparison to class average (if in event)
   - [ ] Include percentile rank (where student ranks in cohort)
   - [ ] Show improvement trend (calculated from multiple attempts)

4. **Instructor Analytics Endpoint**
   - [ ] `GET /analytics/instructor` - My class analytics
   - [ ] `GET /analytics/instructor/events/:eventId` - Cohort report
   - [ ] `GET /analytics/instructor/quizzes/:quizId` - Quiz performance across students
   - [ ] Response includes:
     ```json
     {
       "success": true,
       "data": {
         "cohort": {
           "event_id": "...",
           "event_title": "Midterm English Test",
           "participant_count": 30,
           "submission_count": 28,
           "class_average": 72.5,
           "median_score": 75,
           "std_dev": 12.3,
           "pass_rate": 0.833,
           "score_distribution": {
             "0-25%": 2,
             "25-50%": 3,
             "50-75%": 10,
             "75-100%": 13
           },
           "students": [
             { "student_id": "...", "name": "Alice", "best_score": 90, "avg_score": 88, "attempts": 2, "status": "passed" },
             { "student_id": "...", "name": "Bob", "best_score": 45, "avg_score": 42, "attempts": 1, "status": "failed" }
           ]
         }
       }
     }
     ```
   - [ ] Sort students by best_score (descending)
   - [ ] Identify at-risk students (score <50% or <passing_score)

5. **Question-Level Analytics**
   - [ ] `GET /analytics/questions/:questionId` - Performance on specific question
   - [ ] Aggregate across all students who answered this question:
     ```json
     {
       "success": true,
       "data": {
         "question_id": "...",
         "question_text": "What is the capital of France?",
         "question_type": "mcq",
         "total_responses": 150,
         "correct_count": 120,
         "correct_percentage": 80,
         "difficulty_rank": 2,  // Among all questions in quiz
         "difficulty_level": "easy",  // If provided in question metadata
         "by_question_type": {
           "mcq": { "total": 150, "correct": 120, "percentage": 80 }
         },
         "student_performance": [
           { "student_id": "...", "is_correct": true, "time_spent": 15 },
           { "student_id": "...", "is_correct": false, "time_spent": 45 }
         ]
       }
     }
     ```

6. **Trend Analysis**
   - [ ] `GET /analytics/trends/:quizId` - Score trends over time
   - [ ] Calculate for each attempt:
     - Attempt number vs score (plot: (1, 70), (2, 75), (3, 82))
     - Calculate trend line (linear regression or simple slope)
     - Identify if improving (slope > 0), stable (slope ≈ 0), declining (slope < 0)
   - [ ] Response:
     ```json
     {
       "success": true,
       "data": {
         "quiz_id": "...",
         "trend": "improving",
         "slope": 6.5,  // Points improvement per attempt
         "attempts": [
           { "attempt": 1, "score": 70, "timestamp": "2026-07-25T10:00:00Z" },
           { "attempt": 2, "score": 75, "timestamp": "2026-07-26T10:00:00Z" },
           { "attempt": 3, "score": 82, "timestamp": "2026-07-27T10:00:00Z" }
         ]
       }
     }
     ```

7. **Cohort Reporting** (FROM LAPORAN VALIDASI)
   - [ ] **Cohort definition**: All students invited to the same event = one cohort
   - [ ] **Metrics shown**:
     - Class average score: `AVG(score_percentage)`
     - Median score: 50th percentile
     - Percentile distribution: 25th, 50th, 75th percentile
     - Standard deviation: spread of scores
     - Score distribution histogram: count in bins [0-25%, 25-50%, 50-75%, 75-100%]
   - [ ] **Trends over multiple events**:
     - Compare performance across Quiz A → Quiz B → Quiz C (if student took all three)
     - Show improvement or decline over semester/course
   - [ ] **At-risk identification**:
     - Automatic flag: students with score < 50% in latest attempt
     - Automatic flag: students showing declining trend (slope < 0)
     - Sort by risk level for instructor attention

8. **Testing**
   - [ ] Unit tests for analytics calculations:
     - `test('average score calculation: [60,70,80] → 70')`
     - `test('best score tracking: max(60,70,80) → 80')`
     - `test('pass/fail counting: 2 pass, 1 fail for passing_score=65')`
     - `test('null handling: no submissions → avg_score is NULL')`
     - `test('single attempt: avg_score equals that score')`
   
   - [ ] Integration tests:
     - `test('GET /analytics/student returns personal metrics')`
     - `test('GET /analytics/instructor returns class metrics')`
     - `test('GET /analytics/questions/:id calculates % correct')`
     - `test('POST submission auto-updates analytics')`
   
   - [ ] Edge case tests:
     - Zero submissions: no analytics record or default values
     - Perfect scores: best_score = avg_score = 100
     - All failing scores: pass_count = 0
     - Multiple attempts: verify attempt_count increments correctly

**Deliverables:**
- ✅ AnalyticsRepository fully implemented
- ✅ Real-time aggregation strategy (no batch jobs)
- ✅ Student personal analytics API
- ✅ Instructor cohort analytics API
- ✅ Question-level performance analysis
- ✅ Trend calculation for multiple attempts
- ✅ Comprehensive test suite (>85% coverage)

**Time Estimate: 18 hours**

---

#### Day 10-11: Notifications System

**Tasks (16 hours):**

1. **Notification Repository & Service**
   - [ ] Create `NotificationRepository.ts`:
     - `create(notification_data)`
     - `getByUser(user_id, filters?)`
     - `getUnread(user_id)`
     - `markAsRead(notification_id)`
     - `markAsReadBulk(notification_ids[])`
     - `delete(notification_id)`
   
   - [ ] Create `NotificationService.ts`:
     - `triggerEventReminder(event_id)` - 1 hour before event start
     - `triggerSubmissionGraded(submission_id)`
     - `triggerQuizPublished(quiz_id)`
     - `triggerEventStarted(event_id)`
     - Private: `createNotification(user_id, type, title, message, data)`

2. **Notification Triggers** (FROM LAPORAN VALIDASI)
   - [ ] **Event Reminder** (Type: event_reminder):
     - Triggered: 1 hour before `scheduled_start_at`
     - Recipients: All participants with status != withdrew
     - Message: "English Midterm starts in 1 hour. Click to view event."
     - Data: { event_id, quiz_id }
     - **Implementation**: Optional async job or polling (can defer to v1.1)
     - **MVP approach**: Rely on frontend polling (check event status on dashboard load)
   
   - [ ] **Submission Graded** (Type: submission_graded):
     - Triggered: Immediately when auto-grading completes (same transaction as grading)
     - Recipients: Student who submitted
     - Message: "Your submission for English Assessment has been graded: 82%"
     - Data: { submission_id, quiz_id, score }
     - **Implementation**: Synchronous (within SubmissionService.grade() call)
   
   - [ ] **Quiz Published** (Type: quiz_published):
     - Triggered: When instructor publishes quiz
     - Recipients: All students (or specific cohort if event is created first)
     - Message: "New quiz available: English Assessment"
     - Data: { quiz_id, event_id }
     - **Implementation**: Synchronous when quiz status changes to published
   
   - [ ] **Event Started** (Type: event_started):
     - Triggered: When event status transitions to in_progress
     - Recipients: All participants
     - Message: "English Midterm has started. Go to event to take quiz."
     - Data: { event_id, quiz_id }
     - **Implementation**: Synchronous when event status updated

3. **Notification API Endpoints**
   - [ ] `GET /notifications?unread=true` - List unread notifications
   - [ ] `GET /notifications?limit=20&offset=0` - List with pagination
   - [ ] `PATCH /notifications/:id/read` - Mark one as read
   - [ ] `PATCH /notifications/read` - Mark all as read (bulk)
   - [ ] `DELETE /notifications/:id` - Delete notification
   - [ ] Response format:
     ```json
     {
       "success": true,
       "data": {
         "notifications": [
           {
             "id": "...",
             "type": "submission_graded",
             "title": "Quiz Graded",
             "message": "Your submission scored 82%",
             "data": { "submission_id": "...", "score": 82 },
             "read_at": null,
             "created_at": "2026-07-29T10:30:00Z"
           }
         ],
         "unread_count": 3,
         "total_count": 25
       }
     }
     ```

4. **Real-time Notification Delivery** (FROM LAPORAN VALIDASI)
   - [ ] **MVP approach**: In-app notifications only (no email)
   - [ ] **Storage**: notifications table (all notifications persisted)
   - [ ] **Client polling strategy**:
     - Frontend polls `GET /notifications?unread=true` every 5-10 seconds
     - Reduces server load vs WebSocket (simpler for MVP)
     - Acceptable latency: <15 seconds for notification visibility
   - [ ] **Status tracking**:
     - `pending` → `sent` (when notification created in table)
     - `sent` → `read` (when user views or clicks `PATCH /notifications/:id/read`)
     - `failed` (if delivery attempt fails, can retry in v1.1)
   - [ ] **Email notifications deferred to v1.1**:
     - Requires SendGrid/Resend integration
     - Out of scope for MVP
     - Leave TODO comment in code for future implementation

5. **Notification Context in Frontend**
   - [ ] Add React Query hook for notifications:
     ```typescript
     useQuery({
       queryKey: ['notifications', 'unread'],
       queryFn: () => fetch('/api/v1/notifications?unread=true').then(r => r.json()),
       refetchInterval: 5000, // Poll every 5 seconds
     });
     ```
   - [ ] Display notification badge on header (show unread count)
   - [ ] Toast/banner for new notifications (optional)

6. **Testing**
   - [ ] Unit tests:
     - `test('triggerSubmissionGraded creates notification for student')`
     - `test('triggerEventReminder creates 1 hour before start')`
     - `test('notification status transitions: pending→sent→read')`
     - `test('markAsRead sets read_at timestamp')`
   
   - [ ] Integration tests:
     - `test('POST submission → notification created')`
     - `test('GET /notifications returns unread only when filtered')`
     - `test('PATCH /notifications/:id/read marks as read')`
     - `test('Bulk mark-as-read works')`
   
   - [ ] Scenario tests:
     - `test('Event reminder created 1 hour before start')`
     - `test('Quiz publication notifies relevant students')`

**Deliverables:**
- ✅ NotificationRepository fully implemented
- ✅ NotificationService with all 4 trigger types
- ✅ All 6 notification endpoints working
- ✅ Real-time delivery via polling (MVP)
- ✅ Comprehensive test suite
- ✅ Email notifications documented as v1.1 feature

**Time Estimate: 16 hours**

---

#### Day 12-14: Integration, Performance Testing & Documentation

**Tasks (18 hours):**

1. **End-to-End Integration Testing**
   - [ ] Create comprehensive test scenarios:
     1. **Full Event Workflow**:
        ```typescript
        // 1. Instructor creates event
        POST /events → event_id
        // 2. Add 5 participants
        POST /events/:id/participants (5x)
        // 3. Participants take quiz
        POST /submissions (5x from different students)
        // 4. Auto-grading happens (FASE 3)
        // 5. Analytics updated (real-time)
        GET /analytics/instructor/events/:id → cohort metrics with all 5 students
        // 6. Notifications created
        GET /notifications → submission_graded notifications
        // 7. Event transitions to completed
        PATCH /events/:id → status = completed
        ```
     
     2. **Instructor Personal Analytics**:
        ```typescript
        GET /analytics/instructor → all my events with aggregate metrics
        ```
     
     3. **Student Personal Analytics**:
        ```typescript
        GET /analytics/student → my quizzes, trends, comparison to class
        ```

2. **Performance Testing**
   - [ ] Load test analytics calculation (100 concurrent submissions):
     ```bash
     k6 run k6-analytics-load-test.js
     ```
     - Scenario: 100 concurrent students submit quiz → analytics updated for all
     - Assert: All analytics records updated within 2 seconds
     - Assert: Response time <500ms for GET /analytics/instructor
   
   - [ ] Test timezone conversion performance:
     - Create event with timezone="Asia/Jakarta"
     - Verify time conversion <5ms per request
   
   - [ ] Stress test event participant additions:
     - Add 1000 participants to single event
     - Assert: Bulk add completes <10 seconds

3. **Timezone Validation Tests**
   - [ ] Test valid IANA timezones:
     - "UTC", "Asia/Jakarta", "US/Eastern", "Europe/London", etc.
   - [ ] Test invalid timezones → 400 Bad Request
   - [ ] Test DST transitions (spring forward, fall back)
   - [ ] Test event display across timezones (create in UTC, display in multiple zones)

4. **API Documentation**
   - [ ] Update API_CONTRACT.md with all FASE 4 endpoints:
     - Event CRUD (5 endpoints)
     - Participant management (5 endpoints)
     - Analytics (6 endpoints)
     - Notifications (6 endpoints)
     - Total: 22 new endpoints
   - [ ] Document request/response for each endpoint
   - [ ] Document error codes (400, 401, 403, 404, 409, 500)
   - [ ] Add example requests/responses

5. **README Updates**
   - [ ] Update ROADMAP.md with completion note for FASE 4
   - [ ] Update architecture diagram to include analytics flow
   - [ ] Document analytics aggregation strategy
   - [ ] Document timezone handling approach
   - [ ] Add troubleshooting section for common issues

6. **Code Quality Review**
   - [ ] Run ESLint on all new code: `npm run lint`
   - [ ] Run Prettier: `npm run format`
   - [ ] Run TypeScript check: `npm run typecheck`
   - [ ] Code review: 2 critical paths
     - Analytics aggregation logic
     - Timezone conversion logic

7. **Database Backup & Recovery Testing**
   - [ ] Test backup procedure (per DRP.md):
     - Create sample event data
     - Trigger backup
     - Verify data integrity post-backup
   - [ ] Test recovery scenario:
     - Simulate data loss
     - Recover from backup
     - Verify all tables restored

8. **Security Review**
   - [ ] Verify RBAC enforcement:
     - Only instructors can create events for their quizzes
     - Only admin can view all events
     - Students can only see their own analytics
   - [ ] Verify audit logging:
     - All event creation/updates logged
     - All analytics queries (optional, can log in frontend)
   - [ ] Verify soft deletes:
     - Deleted events not shown in queries
     - Deleted records preserved in audit_logs

9. **Deployment Readiness Checklist**
   - [ ] All tests passing: `npm test`
   - [ ] Coverage >85%: `npm run test:coverage`
   - [ ] No TypeScript errors: `npm run typecheck`
   - [ ] No ESLint errors: `npm run lint`
   - [ ] Database migrations ready: `npx prisma migrate status`
   - [ ] Environment variables documented: `.env.example`
   - [ ] API documentation complete: `/docs/api/events.md`
   - [ ] Performance baseline established: <500ms event queries, <2s analytics

**Deliverables:**
- ✅ Full end-to-end integration tests (3+ scenarios)
- ✅ Performance test results (k6 report)
- ✅ Timezone handling validated
- ✅ API documentation updated
- ✅ README updated with analytics details
- ✅ Code quality checks passed
- ✅ Deployment readiness confirmed

**Time Estimate: 18 hours**

---

## 🔄 FASE 4 DELIVERABLES SUMMARY

### Backend Code

| Component | Files | Lines | Coverage |
|-----------|-------|-------|----------|
| EventRepository | `src/repositories/EventRepository.ts` | 150+ | >85% |
| EventService | `src/services/EventService.ts` | 200+ | >85% |
| EventController | `src/routes/events.ts` | 250+ | >80% |
| EventParticipantService | `src/services/EventParticipantService.ts` | 180+ | >85% |
| AnalyticsService | `src/services/AnalyticsService.ts` | 300+ | >85% |
| AnalyticsController | `src/routes/analytics.ts` | 250+ | >80% |
| NotificationService | `src/services/NotificationService.ts` | 150+ | >85% |
| NotificationController | `src/routes/notifications.ts` | 120+ | >80% |
| **Total** | 8 files | **1,600+ lines** | **>83% average** |

### Database

| Artifact | Details |
|----------|---------|
| New Tables | events, event_participants, analytics, notifications |
| New Enums | EventStatus, ParticipantStatus, ShowAnswersType, NotificationType, NotificationStatus |
| New Indexes | 15+ indexes on common query patterns |
| Migrations | `prisma/migrations/XXX_add_fase4_*.sql` |
| Schema | 100% compliant with DATABASE_SCHEMA.md |

### Tests

| Test Type | Count | Coverage Target |
|-----------|-------|-----------------|
| Unit Tests | 35+ | >85% |
| Integration Tests | 20+ | >80% |
| E2E Tests (scenario-based) | 5+ | Full workflows |
| Performance Tests | 3+ | <500ms event queries |
| **Total** | **63+ tests** | **>83% coverage** |

### Documentation

| Document | Purpose |
|----------|---------|
| API_CONTRACT.md (updated) | 22 new endpoints documented |
| README.md (updated) | Analytics aggregation strategy explained |
| ROADMAP_FASE_4.md | This file (complete implementation guide) |
| Code comments | Timezone, analytics, notification explanations |

### APIs Implemented

#### Event Management (7 endpoints)
- POST `/events` - Create event
- GET `/events/:id` - Get event details
- PUT `/events/:id` - Full update
- PATCH `/events/:id` - Partial update
- DELETE `/events/:id` - Soft delete
- GET `/events?filters` - List with filtering
- PATCH `/events/:id/status` - Update status

#### Participant Management (5 endpoints)
- POST `/events/:id/participants` - Add participant
- POST `/events/:id/participants/bulk` - Bulk add
- GET `/events/:id/participants` - Get roster
- PATCH `/events/:id/participants/:participantId` - Update status
- DELETE `/events/:id/participants/:participantId` - Remove participant

#### Analytics (8 endpoints)
- GET `/analytics/student` - Personal analytics
- GET `/analytics/student/:quizId` - Quiz-specific analytics
- GET `/analytics/instructor` - Class analytics
- GET `/analytics/instructor/events/:eventId` - Cohort report
- GET `/analytics/instructor/quizzes/:quizId` - Quiz performance
- GET `/analytics/questions/:questionId` - Question analysis
- GET `/analytics/trends/:quizId` - Score trends
- GET `/analytics/cohort/:eventId` - Detailed cohort metrics

#### Notifications (6 endpoints)
- GET `/notifications?unread=true` - List unread
- GET `/notifications?limit=20&offset=0` - Paginated list
- PATCH `/notifications/:id/read` - Mark one as read
- PATCH `/notifications/read` - Mark all as read
- DELETE `/notifications/:id` - Delete notification
- GET `/notifications/count` - Unread count (optional)

**Total APIs: 26 new endpoints in FASE 4**

---

## ⚠️ CRITICAL NOTES FOR IMPLEMENTATION

### Timezone Handling (HIGH PRIORITY)
- ✅ **Storage**: Always UTC in database
- ✅ **API**: Always return ISO 8601 UTC
- ✅ **Frontend**: Convert to user's `preferred_timezone` on display
- ✅ **Library**: Use `date-fns` with timezone support OR `moment-timezone`
- ✅ **Testing**: Test DST transitions explicitly
- ✅ **Reference**: See SECURITY_SPEC.md section on timezone handling

### Analytics Real-Time Aggregation (HIGH PRIORITY)
- ✅ **No batch jobs**: Update analytics synchronously with submission grading
- ✅ **Single transaction**: Grading + analytics update = atomic operation
- ✅ **Freshness**: <1 second latency guaranteed
- ✅ **Scaling**: For v1.0, acceptable; v1.1 can defer to async job if needed
- ✅ **Reference**: See LAPORAN_VALIDASI_ROADMAP.md Analytics section

### Event Status Automation (MEDIUM PRIORITY)
- ⚠️ **MVP Approach**: Rely on manual PATCH or frontend polling
- ⚠️ **Scheduled jobs optional**: Can add in v1.1 for automatic transitions
- ⚠️ **Alternative**: Frontend can check event status on load, trigger transition if needed
- ⚠️ **Reference**: See BLUEPRINT_ROADMAP.md event lifecycle section

### Notifications Delivery (MEDIUM PRIORITY)
- ✅ **MVP**: In-app only (no email)
- ✅ **Polling**: Frontend polls every 5-10 seconds
- ✅ **Email**: Deferred to v1.1 with TODO comment
- ✅ **WebSocket**: Also deferred to v1.1
- ✅ **Reference**: See LAPORAN_VALIDASI_ROADMAP.md Notifications section

### Cohort Definition (CRITICAL CLARIFICATION)
- ✅ **Cohort = students in same event**
- ✅ **Metrics**: Class average, median, std dev, percentile ranks
- ✅ **Instructor view**: Can see analytics for all their events
- ✅ **Student view**: Can see comparison to their cohort (if in event)
- ✅ **Reference**: See LAPORAN_VALIDASI_ROADMAP.md Cohort Definition section

---

## 🚀 SUCCESS CRITERIA RECAP

### Functional Completeness
- ✅ All 7 event endpoints working (CRUD + status)
- ✅ All 5 participant endpoints working (roster management)
- ✅ All 8 analytics endpoints working (student, instructor, cohort, trend)
- ✅ All 6 notification endpoints working
- ✅ Total: 26 new API endpoints, 100% functional

### Non-Functional Requirements
- ✅ Analytics real-time aggregation (<1s latency)
- ✅ Event queries <500ms (p95)
- ✅ Timezone handling (UTC storage, per-user display)
- ✅ Soft deletes (audit trail preservation)
- ✅ RBAC enforcement (instructor/student/admin isolation)

### Quality Metrics
- ✅ Test coverage >85% (target >80%)
- ✅ Integration tests >20 scenarios
- ✅ Performance load testing (100 concurrent users)
- ✅ Code quality checks (ESLint, TypeScript, Prettier)

### Portfolio Quality
- ✅ Clear, detailed documentation (this roadmap)
- ✅ Comprehensive API documentation
- ✅ Thoughtful design decisions (real-time analytics, timezone handling)
- ✅ Production-grade implementation (error handling, validation, testing)

---

## 📅 TIMELINE SUMMARY

| Week | Duration | Focus | Deliverables |
|------|----------|-------|--------------|
| **Week 4** | 7 days (56 hours) | Events + Participants + Basic Analytics | All 12 endpoints, database setup, core tests |
| **Week 5** | 7 days (44 hours) | Advanced Analytics + Notifications | Remaining 14 endpoints, full test suite, deployment ready |
| **Total** | **14 days** | **~100 hours** | **FASE 4 Complete** |

---

## 🔗 DEPENDENCIES & HANDOFF

### Dependencies on Previous Phases
- ✅ FASE 1: Auth, RBAC, JWT validation (all event endpoints require auth)
- ✅ FASE 2: Quiz CRUD (events link to quizzes)
- ✅ FASE 3: Submission + auto-grading (analytics depends on submission data)

### Handoff to FASE 5
- ✅ Backend APIs fully functional
- ✅ Comprehensive integration tests passing
- ✅ Database migrations ready for production
- ✅ API documentation complete
- → Frontend development can now start (Weeks 5-8)
- → E2E tests can use live backend APIs
- → Deployment pipeline ready

---

## 📝 VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| **v1.0** | 2026-07-29 | Aulia | Initial ROADMAP FASE 4 (1033 lines) |
| **v1.1** | 2026-07-29 | Aulia | IMPROVED: +300 lines, detailed gap fixes from LAPORAN_VALIDASI_ROADMAP.md |

---

## ✅ SIGN-OFF & APPROVAL

| Role | Name | Date | Status | Notes |
|------|------|------|--------|-------|
| Developer | Aulia | 2026-07-29 | ✅ Ready | FASE 4 specification complete, aligned with BLUEPRINT_ROADMAP.md |
| Architect | Aulia | 2026-07-29 | ✅ Approved | Database schema, API design, performance strategy validated |

**Quality Assurance:**
- ✅ Covers all F007, F009, F011 features from PRD
- ✅ All gaps from LAPORAN_VALIDASI_ROADMAP.md addressed
- ✅ Timezone handling detailed and testable
- ✅ Analytics aggregation strategy clear (real-time, no batch jobs)
- ✅ Cohort definition explicit (event = cohort)
- ✅ Notification delivery strategy documented (MVP = in-app + polling)
- ✅ 26 API endpoints specified with validation
- ✅ >85% test coverage target with concrete test scenarios
- ✅ Performance baselines defined (<500ms event queries, <2s analytics)
- ✅ Deployment ready (migrations, documentation, checklists)

---

*ROADMAP FASE 4.md v1.1 (IMPROVED) | EduFlow Portfolio Project | Events & Analytics (Weeks 4-5) | Approved 2026-07-29*

*Status: ✅ COMPLETE, DETAILED & READY FOR IMPLEMENTATION*