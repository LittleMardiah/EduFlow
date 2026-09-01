# API CONTRACT - EduFlow (FASE 4)

## Event Management (7 endpoints)

### POST /api/v1/events

Create a new quiz event.

- **Auth:** Instructor/Admin
- **Body:** { title, description, quizId, scheduledStartAt, scheduledEndAt, timezone, maxParticipants }
- **Response:** 201 Created with event object
- **Error:** 400 (invalid timezone), 404 (quiz not found)

### GET /api/v1/events

List events with filters.

- **Auth:** All authenticated
- **Query:** status, quizId, page, limit
- **Response:** 200 with paginated events

### GET /api/v1/events/:id

Get event details.

- **Auth:** Instructor/Admin (own events), Student (registered)
- **Response:** 200 with event + participants

### PATCH /api/v1/events/:id

Update event metadata.

- **Auth:** Instructor/Admin (own)
- **Body:** title, description, scheduledStartAt, scheduledEndAt, maxParticipants
- **Response:** 200 with updated event

### PATCH /api/v1/events/:id/status

Update event status (scheduled → in_progress → completed → cancelled)

- **Auth:** Instructor/Admin (own)
- **Body:** { status }
- **Response:** 200 with updated event
- **Error:** 422 (invalid status transition)

### DELETE /api/v1/events/:id

Soft delete event.

- **Auth:** Instructor/Admin (own)
- **Response:** 204 No Content

## Participant Management (5 endpoints)

### POST /api/v1/events/:id/participants

Add single participant.

- **Auth:** Instructor/Admin (own)
- **Body:** { studentId }
- **Response:** 201 Created

### POST /api/v1/events/:id/participants/bulk

Add multiple participants.

- **Auth:** Instructor/Admin (own)
- **Body:** { studentIds: [] }
- **Response:** 201 Created with added count
- **Error:** 409 (already registered)

### GET /api/v1/events/:id/participants

Get participant roster.

- **Auth:** Instructor/Admin (own), Student (own)
- **Query:** status, page, limit
- **Response:** 200 with paginated participants

### PATCH /api/v1/events/:id/participants/:participantId

Update participant status (invited → registered → attended → withdrew)

- **Auth:** Instructor/Admin (own)
- **Body:** { status }
- **Response:** 200 with updated participant
- **Error:** 422 (invalid status transition)

### DELETE /api/v1/events/:id/participants/:participantId

Remove participant (soft delete).

- **Auth:** Instructor/Admin (own)
- **Response:** 204 No Content

## Analytics (8 endpoints)

### GET /api/v1/analytics/student

Get personal analytics for logged-in student.

- **Auth:** Student
- **Query:** quizId (optional)
- **Response:** 200 with { totalQuizzes, avgScore, passRate, trends }

### GET /api/v1/analytics/student/:quizId

Get detailed analytics for specific quiz.

- **Auth:** Student (own)
- **Response:** 200 with quiz details, score, question breakdown

### GET /api/v1/analytics/instructor

Get instructor dashboard analytics.

- **Auth:** Instructor
- **Query:** eventId, quizId, dateRange
- **Response:** 200 with { events, totalStudents, avgScores }

### GET /api/v1/analytics/instructor/events/:eventId

Get cohort analytics for specific event.

- **Auth:** Instructor (own)
- **Response:** 200 with { cohort: { avg, median, passRate, distribution, students } }

### GET /api/v1/analytics/instructor/quizzes/:quizId

Get quiz performance analytics.

- **Auth:** Instructor (own)
- **Response:** 200 with { avgScore, passRate, questionBreakdown }

### GET /api/v1/analytics/questions/:questionId

Get question-level analytics.

- **Auth:** Instructor (own quiz)
- **Response:** 200 with { correctPercentage, difficulty, studentPerformance }

### GET /api/v1/analytics/trends/:quizId

Get score trends over time.

- **Auth:** Instructor (own) or Student (own)
- **Response:** 200 with { trend, attempts: [{ attempt, score, date }] }

### GET /api/v1/analytics/cohort/:eventId

Detailed cohort metrics (percentile, distribution).

- **Auth:** Instructor (own)
- **Response:** 200 with { avg, median, p25, p75, stdDev, histogram }

## Notifications (6 endpoints)

### GET /api/v1/notifications

List user notifications.

- **Auth:** All authenticated
- **Query:** unread=true, limit, offset
- **Response:** 200 with paginated notifications

### GET /api/v1/notifications?unread=true

Get unread notifications only.

- **Auth:** All authenticated
- **Response:** 200 with unread notifications

### GET /api/v1/notifications/count

Get unread count.

- **Auth:** All authenticated
- **Response:** 200 with { count }

### PATCH /api/v1/notifications/:id/read

Mark single notification as read.

- **Auth:** All authenticated (own)
- **Response:** 200 with updated notification
- **Error:** 404 (not found), 403 (unauthorized)

### PATCH /api/v1/notifications/read

Mark all notifications as read.

- **Auth:** All authenticated (own)
- **Response:** 200 with { updated: count }

### DELETE /api/v1/notifications/:id

Delete notification.

- **Auth:** All authenticated (own)
- **Response:** 204 No Content
- **Error:** 404 (not found), 403 (unauthorized)

## Error Codes (FASE 4)

| Code | Meaning                                                       |
| ---- | ------------------------------------------------------------- |
| 400  | Validation error, invalid timezone, invalid status transition |
| 401  | Unauthorized                                                  |
| 403  | Forbidden (RBAC)                                              |
| 404  | Not found (event, quiz, notification)                         |
| 409  | Conflict (already registered)                                 |
| 422  | Unprocessable (invalid status transition)                     |
| 500  | Internal server error                                         |
