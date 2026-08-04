# TDD (Technical Design Document) - EduFlow

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*Production-Grade Technical Specifications for Solo Developer Implementation*

---

## 📌 DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Type** | Technical Design Document |
| **Version** | v1.0 |
| **Created Date** | 2026-07-28 |
| **Author** | M. Arif Aulia |
| **Status** | ✅ Complete & Ready for Development |
| **Related Documents** | PRD.md, DATABASE_SCHEMA.md, LOGIC_FLOW.md, HALAMAN.md |
| **Target Audience** | Solo developer, code reviewers, technical interviewers |

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Project Structure](#3-architecture--project-structure)
4. [Database Design & Migrations](#4-database-design--migrations)
5. [API Contract & Endpoints](#5-api-contract--endpoints)
6. [Business Logic Implementation](#6-business-logic-implementation)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Error Handling & Logging](#8-error-handling--logging)
9. [Performance & Scalability](#9-performance--scalability)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment & DevOps](#11-deployment--devops)
12. [Dependencies & Versioning](#12-dependencies--versioning)
13. [Known Limitations & Future Work](#13-known-limitations--future-work)

---

## 1. EXECUTIVE SUMMARY

### Problem Being Solved

Educational institutions need a **unified platform** to:
- Create and manage question banks (quizzes with versioning)
- Grade submissions instantly (auto-grading for MCQ, T/F, short-answer)
- Schedule and track quiz events with participant rosters
- Analyze student performance with learning analytics
- Enforce role-based access control (Admin, Instructor, Student)

Current state: fragmented tools (LMS, quiz tool, grading spreadsheet, analytics sheet) = inefficiency, data silos, poor UX.

### MVP Scope (P0 Features)

All 12 core features from PRD (F001-F012) must be implemented in v1.0:

| Feature ID | Feature Name | Status |
|-----------|------------|--------|
| F001 | Authentication & RBAC | ✅ Included |
| F002 | Quiz Bank Management | ✅ Included |
| F003 | Question Bank (MCQ, T/F, SA) | ✅ Included |
| F004 | Auto-Grading Engine | ✅ Included |
| F005 | Quiz Submissions & Scoring | ✅ Included |
| F006 | IELTS Simulation Mode | ✅ Included (Section field) |
| F007 | Event-Based Testing | ✅ Included |
| F008 | Results Dashboard | ✅ Included |
| F009 | Role-Based Access Control | ✅ Included |
| F010 | Audit Logging | ✅ Included |
| F011 | Notifications | ⚠️ Optional (v1.0) |
| F012 | Analytics & Reporting | ✅ Included |

**Out of Scope for v1:**
- OAuth2 (Google/GitHub login) → v1.1
- Two-factor authentication (2FA) → v1.2
- Payment processing → v2.0
- Mobile app → v2.0
- Real-time WebSocket features → v1.1
- File uploads (quiz import/export) → v1.1

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| MVP Feature Completion | 12/12 (P0 only) | Manual checklist |
| API Response Time | <300ms p95 | Load testing, APM |
| Page Load Time | <2s (landing), <3s (dashboard) | Lighthouse, WebVitals |
| Test Coverage | >80% (backend), >70% (frontend) | Jest/Vitest coverage report |
| Auto-Grading Accuracy | 100% correct answer matching | 50+ test cases |
| Zero Unplanned Downtime | 99.5% uptime | Uptime monitoring |
| RBAC Enforcement | 100% - no data leaks across roles | Security test checklist |

### Implementation Timeline

**6-8 weeks (solo developer, 40 hrs/week):**
- **Week 1-2:** Database + Auth + Core API scaffolding
- **Week 2-3:** Quiz management + auto-grading engine
- **Week 3-4:** Event scheduling + submissions pipeline
- **Week 4-5:** Analytics + Frontend dashboards
- **Week 5-6:** Testing + Security audit
- **Week 6-8:** Deployment + Optimization + Documentation

---

## 2. TECHNOLOGY STACK

### Backend

**Language & Runtime:**
- **Language:** TypeScript 5.3+
- **Runtime:** Node.js 18.x LTS (stable, widely supported)
- **Framework:** Express.js 4.18+ (lightweight, battle-tested) OR Nest.js 10+ (more structured, DI built-in)
- **Recommendation:** **Express.js** for this MVP (simpler, fewer abstraction layers, faster to ship)

**Rationale:**
- TypeScript: Type safety catches bugs early; production-grade
- Node.js: Excellent ecosystem (npm), familiar to React developers
- Express: Minimal framework, maximum control; easy to add middleware
- Alternative rejected: Fastify (overkill for this scale), Nest.js (overhead for solo dev)

### Frontend

**Framework & Build Tools:**
- **Framework:** React 18.2+ with Vite (build tooling, not Next.js for simplicity)
- **Styling:** Tailwind CSS v3.4+ (utility-first, rapid UI development)
- **State Management:** React Query (async state) + Zustand (global state)
- **Package Manager:** pnpm (fast, efficient dependency management)
- **Build Tool:** Vite (instant HMR, fast builds)

**Rationale:**
- React: Industry standard, large ecosystem
- Vite: 10x faster than CRA, modern build tool
- Tailwind: No CSS-in-JS overhead; rapid prototyping
- React Query: Handles server state elegantly (submissions, analytics)
- Zustand: Lightweight state management (vs Redux bloat)

**Alternative rejected:** Next.js (added SSR complexity for MVP; Vercel deployment only)

### Database

**Primary Datastore:**
- **Type:** PostgreSQL 14+ (ACID, JSON support, full-text search)
- **Hosting:** Supabase (serverless Postgres, free tier with 500MB)
  - Alternative: Railway, Render, or self-managed Postgres on VPS
- **ORM:** Prisma 5+ (type-safe queries, excellent migrations)
  - Alternative rejected: TypeORM (verbose), raw SQL (no type safety)

**Why Prisma:**
- Auto-generates TypeScript types from schema
- Migration management built-in
- Supports row-level security (RLS) via SQL
- Single schema file (DATABASE_SCHEMA.md → schema.prisma)

**Database Indexing Strategy:**
```sql
-- Critical indexes (already in DATABASE_SCHEMA.md)
- idx_users_email (fast login lookup)
- idx_submissions_student (student results)
- idx_submissions_quiz (quiz performance)
- idx_event_participants_event (event rosters)
- idx_answers_submission (grading lookups)
- idx_audit_logs_table_record (compliance queries)
```

### Caching & Session

**Session Management:**
- **Method:** JWT (JSON Web Tokens) stored in HTTP-only cookies
- **Duration:** 24 hours for web, 7 days for "remember me"
- **Refresh Token:** Separate long-lived token (14 days) for silent refresh
- **No Redis for v1:** Acceptable for <10K MAU; add in v1.1 if needed

**Rationale:** Stateless JWT avoids session DB queries; simpler deployment.

### External Services

| Service | Purpose | Provider | Alternative |
|---------|---------|----------|------------|
| **Email** | Transactional (welcome, password reset) | Resend or SendGrid | Mailgun, AWS SES |
| **Logging** | Error tracking & monitoring | Sentry (free tier) | Rollbar, Datadog |
| **Deployment** | Frontend hosting | Vercel (free) | Netlify, GitHub Pages |
| **Backend** | API hosting | Railway, Render (free tier) | Fly.io, Heroku |
| **File Storage** | Quiz export/import (future) | AWS S3 / Cloudinary | MinIO self-hosted |

**For MVP, keep minimal:** Sentry + Vercel + Railway = cost-free launch.

### DevOps & Deployment

**Containerization:**
- **Container:** Docker (consistency dev → prod)
- **Compose:** docker-compose.yml for local PostgreSQL + Express dev stack

**CI/CD:**
- **Platform:** GitHub Actions (free for public repos)
- **Workflow:** Lint → Test → Build → Deploy on push to `main` branch

**Hosting:**
- **Frontend:** Vercel (auto-deploy on git push, free tier includes edge functions)
- **Backend:** Railway.app or Render.com (free tier PostgreSQL + app container)
- **Database:** Supabase (free 500MB PostgreSQL, auto-backups)

---

## 3. ARCHITECTURE & PROJECT STRUCTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│            FRONTEND (React + Vite)              │
│  ┌──────────────────────────────────────────┐  │
│  │ Landing | Auth | Dashboards | Quiz UI   │  │
│  │ (Deployed on Vercel)                     │  │
│  └──────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────┘
                    │ REST API (HTTPS)
                    ↓
┌─────────────────────────────────────────────────┐
│          BACKEND (Express + TypeScript)         │
│  ┌──────────────────────────────────────────┐  │
│  │ API Layer (Controllers)                  │  │
│  │ /auth, /quizzes, /submissions, /events   │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │ Business Logic (Services)                │  │
│  │ GradingService, AnalyticsService, etc.   │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │ Data Access (Repositories)               │  │
│  │ Prisma ORM queries                       │  │
│  └──────────────────────────────────────────┘  │
│  (Deployed on Railway/Render)                  │
└───────────────────┬─────────────────────────────┘
                    │ SQL (Connection Pool)
                    ↓
┌─────────────────────────────────────────────────┐
│    DATABASE (PostgreSQL on Supabase)            │
│  13 tables (users, quizzes, submissions, etc.)  │
│  Row-Level Security (RLS) enabled               │
│  Automatic backups                              │
└─────────────────────────────────────────────────┘
```

### Backend Folder Structure

```
backend/
├── src/
│   ├── controllers/              # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── quiz.controller.ts
│   │   ├── submission.controller.ts
│   │   ├── event.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── services/                 # Business logic
│   │   ├── auth.service.ts       # JWT, password hashing, registration
│   │   ├── quiz.service.ts       # CRUD, versioning
│   │   ├── grading.service.ts    # Auto-grading algorithm
│   │   ├── submission.service.ts # Submit, score, record answers
│   │   ├── event.service.ts      # Schedule, roster, status
│   │   ├── analytics.service.ts  # Aggregate stats, trends
│   │   ├── email.service.ts      # Send emails (reset, welcome)
│   │   └── notification.service.ts # Create notifications
│   │
│   ├── repositories/             # Database queries (Prisma)
│   │   ├── user.repository.ts
│   │   ├── quiz.repository.ts
│   │   ├── submission.repository.ts
│   │   ├── event.repository.ts
│   │   └── analytics.repository.ts
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts    # JWT validation
│   │   ├── rbac.middleware.ts    # Role-based access check
│   │   ├── validation.middleware.ts # Zod schema validation
│   │   ├── error.middleware.ts   # Global error handler
│   │   └── logging.middleware.ts # Request/response logging
│   │
│   ├── models/                   # TypeScript types & schemas
│   │   ├── user.model.ts
│   │   ├── quiz.model.ts
│   │   ├── submission.model.ts
│   │   ├── error.model.ts        # Custom error classes
│   │   └── response.model.ts     # API response wrapper
│   │
│   ├── utils/                    # Helper functions
│   │   ├── jwt.util.ts           # JWT generation/verification
│   │   ├── hash.util.ts          # Bcrypt password hashing
│   │   ├── validator.util.ts     # Input validation helpers
│   │   ├── error-codes.util.ts   # Standardized error codes
│   │   └── logger.util.ts        # Winston or Pino logging
│   │
│   ├── config/
│   │   └── config.ts             # Environment variables, config object
│   │
│   ├── routes/                   # Express route definitions
│   │   ├── auth.routes.ts
│   │   ├── quiz.routes.ts
│   │   ├── submission.routes.ts
│   │   ├── event.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── index.ts              # Combine all routes
│   │
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma schema (tables + relationships)
│   │   └── migrations/           # Auto-generated migration files
│   │
│   └── app.ts                    # Express app initialization
│
├── tests/
│   ├── unit/                     # Unit tests (services, utils)
│   │   ├── grading.service.test.ts
│   │   ├── auth.service.test.ts
│   │   └── hash.util.test.ts
│   │
│   ├── integration/              # Integration tests (API + DB)
│   │   ├── auth.integration.test.ts
│   │   ├── quiz.integration.test.ts
│   │   └── submission.integration.test.ts
│   │
│   └── fixtures/                 # Test data, factories
│       ├── user.fixture.ts
│       └── quiz.fixture.ts
│
├── .env.example                  # Template for secrets
├── .env.local                    # Local (git-ignored)
├── docker-compose.yml            # Local dev: Express + PostgreSQL
├── Dockerfile                    # Production image
├── package.json
├── tsconfig.json
├── jest.config.js                # Test configuration
└── README.md                     # Setup, run, deploy instructions

```

### Frontend Folder Structure

```
frontend/
├── src/
│   ├── pages/                    # Page components (Vite)
│   │   ├── index.tsx             # Landing page (/)
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── InstructorDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── quiz/
│   │   │   ├── QuizList.tsx
│   │   │   ├── QuizEditor.tsx
│   │   │   ├── QuizTake.tsx       # Main quiz-taking UI
│   │   │   └── QuizResults.tsx
│   │   ├── event/
│   │   │   ├── EventList.tsx
│   │   │   ├── EventCreate.tsx
│   │   │   └── EventDetails.tsx
│   │   ├── analytics/
│   │   │   ├── StudentProgress.tsx
│   │   │   ├── QuizPerformance.tsx
│   │   │   └── CohortReport.tsx
│   │   ├── admin/
│   │   │   ├── UserManagement.tsx
│   │   │   ├── SystemHealth.tsx
│   │   │   └── AuditLogs.tsx
│   │   └── NotFound.tsx           # 404
│   │
│   ├── components/               # Reusable React components
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ProtectedRoute.tsx # Role-based routing
│   │   ├── form/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── QuizForm.tsx
│   │   │   ├── QuestionEditor.tsx
│   │   │   └── EventForm.tsx
│   │   ├── quiz/
│   │   │   ├── QuestionCard.tsx   # MCQ, T/F, SA rendering
│   │   │   ├── QuestionBank.tsx
│   │   │   ├── QuestionList.tsx
│   │   │   └── AnswerInput.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── RosterTable.tsx
│   │   └── ui/                   # Primitives (Button, Input, Modal)
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Tabs.tsx
│   │       ├── Table.tsx
│   │       └── Toast.tsx
│   │
│   ├── hooks/                    # React custom hooks
│   │   ├── useAuth.ts            # Auth context + login/logout
│   │   ├── useFetch.ts           # Data fetching wrapper
│   │   ├── useForm.ts            # Form state management
│   │   ├── useQuiz.ts            # Quiz state (current q, time, etc.)
│   │   └── useAnalytics.ts       # Analytics data fetching
│   │
│   ├── context/
│   │   ├── AuthContext.tsx       # Global auth state
│   │   └── ToastContext.tsx      # Global notifications
│   │
│   ├── services/                 # API client
│   │   ├── api.ts                # Axios instance + interceptors
│   │   ├── auth.api.ts           # /auth endpoints
│   │   ├── quiz.api.ts           # /quizzes endpoints
│   │   ├── submission.api.ts     # /submissions endpoints
│   │   ├── event.api.ts          # /events endpoints
│   │   └── analytics.api.ts      # /analytics endpoints
│   │
│   ├── utils/
│   │   ├── format.ts             # Date, number formatting
│   │   ├── validation.ts         # Client-side validation
│   │   ├── storage.ts            # localStorage helpers (session, token)
│   │   └── constants.ts          # API URLs, error codes
│   │
│   ├── types/
│   │   ├── index.ts              # Shared TypeScript types
│   │   ├── api.ts                # API response types
│   │   ├── auth.ts               # Auth types
│   │   └── quiz.ts               # Quiz/Submission types
│   │
│   ├── styles/
│   │   ├── globals.css           # Tailwind imports, base styles
│   │   └── variables.css         # CSS custom properties
│   │
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Vite entry point
│
├── public/                       # Static assets
│   ├── logo.svg
│   └── favicon.ico
│
├── .env.example                  # Template (VITE_API_URL, etc.)
├── .env.local                    # Local (git-ignored)
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Vitest (unit tests)
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── README.md
```

### Data Flow Diagram

```
User Action (e.g., "Submit Quiz")
    ↓
React Component (QuizTake.tsx)
    ↓
useQuiz() Hook + API Call (submission.api.ts)
    ↓
HTTP POST /api/submissions/submit
    ↓
Backend: submission.controller.ts
    ├─ Validate JWT (auth.middleware.ts)
    ├─ Check RBAC (rbac.middleware.ts) → student role?
    ├─ Validate request body (validation.middleware.ts)
    ↓
Business Logic: submission.service.ts
    ├─ Fetch submission from DB
    ├─ Verify quiz is open & student is allowed
    ├─ Mark submission as "submitted"
    ├─ Call grading.service.ts to score
    ├─ Update scores in submissions table
    ├─ Record answers in answers table
    ├─ Trigger analytics.service.ts to refresh stats
    ↓
Database (Prisma ORM)
    ├─ INSERT answers / UPDATE submissions
    ├─ Apply Row-Level Security filters
    ├─ Return updated submission data
    ↓
HTTP Response (200 OK + submission JSON)
    ↓
React Component updates state
    ↓
User sees results dashboard
```

---

## 4. DATABASE DESIGN & MIGRATIONS

### Schema Overview

**Total Tables:** 13 (from DATABASE_SCHEMA.md)

```
Core Tables:
- users (identity & auth)
- organizations (multi-tenancy)
- quizzes (question banks)
- quiz_versions (versioning)
- questions (items)
- options (MCQ/T/F choices)
- submissions (student attempts)
- answers (per-question responses)
- events (scheduled sessions)
- event_participants (rosters)
- analytics (aggregated stats)
- audit_logs (compliance trail)
- notifications (optional for v1)
```

### Prisma Schema (Simplified Example)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// === USERS ===
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          UserRole
  status        AccountStatus @default(ACTIVE)
  organizationId String?
  
  submissions   Submission[]
  quizzes       Quiz[]         @relation("instructor")
  events        Event[]        @relation("organizer")
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  @@index([email])
  @@index([role])
}

enum UserRole {
  ADMIN
  INSTRUCTOR
  STUDENT
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  ARCHIVED
}

// === QUIZZES ===
model Quiz {
  id              String      @id @default(cuid())
  title           String
  description     String?
  instructorId    String
  instructor      User        @relation("instructor", fields: [instructorId], references: [id])
  questions       Question[]
  submissions     Submission[]
  events          Event[]
  
  totalQuestions  Int         @default(0)
  passingScore    Float       @default(60)
  maxAttempts     Int         @default(1)
  currentVersion  Int         @default(1)
  
  status          QuizStatus  @default(DRAFT)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([instructorId])
  @@index([status])
}

enum QuizStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// === QUESTIONS ===
model Question {
  id          String      @id @default(cuid())
  quizId      String
  quiz        Quiz        @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  questionText String
  type        QuestionType
  explanation String?
  points      Int         @default(1)
  orderInQuiz Int
  section     String?     // For IELTS: "Listening", "Reading", etc.
  
  // Matching question pairs (per F003a)
  matchingPairs Json?      // Array of {left, right} pairs for matching type
  
  // Essay grading rubric (per F003a)
  essayRubric String?      // Guidelines for instructor grading essays
  
  options     Option[]
  answers     Answer[]
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([quizId])
  @@index([quizId, orderInQuiz])
}

enum QuestionType {
  MCQ
  TRUE_FALSE
  SHORT_ANSWER
  MATCHING
  ESSAY
}

// === OPTIONS (MCQ/T/F choices) ===
model Option {
  id          String      @id @default(cuid())
  questionId  String
  question    Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  optionText  String
  optionKey   String      // A, B, C, D
  isCorrect   Boolean     @default(false)
  order       Int
  
  answers     Answer[]
  
  @@unique([questionId, optionKey])
}

// === SUBMISSIONS ===
model Submission {
  id              String      @id @default(cuid())
  quizId          String
  quiz            Quiz        @relation(fields: [quizId], references: [id])
  studentId       String
  student         User        @relation(fields: [studentId], references: [id])
  eventId         String?
  
  status          SubmissionStatus @default(IN_PROGRESS)
  attemptNumber   Int         @default(1)
  
  totalPoints     Int         @default(0)
  maxPoints       Int
  scorePercentage Float       @default(0)
  isPassed        Boolean     @default(false)
  
  // IELTS section scores (per F006d: score breakdown by section)
  listeningScore  Float?      // IELTS band 0-9
  readingScore    Float?      // IELTS band 0-9
  writingScore    Float?      // IELTS band 0-9
  speakingScore   Float?      // IELTS band 0-9 (usually manual only)
  overallBand     Float?      // Calculated overall IELTS band
  
  answers         Answer[]
  startedAt       DateTime    @default(now())
  submittedAt     DateTime?
  timeTakenSeconds Int?
  
  createdAt       DateTime    @default(now())

  @@unique([quizId, studentId, attemptNumber])
  @@index([studentId])
  @@index([quizId])
}

enum SubmissionStatus {
  IN_PROGRESS
  SUBMITTED
  GRADED
}

// === ANSWERS ===
model Answer {
  id              String      @id @default(cuid())
  submissionId    String
  submission      Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  questionId      String
  question        Question    @relation(fields: [questionId], references: [id])
  optionId        String?
  option          Option?     @relation(fields: [optionId], references: [id])
  
  answerText      String?     // For short-answer
  isCorrect       Boolean?
  pointsEarned    Int         @default(0)
  matchScore      Float?      // Fuzzy match score (0-1)
  
  gradingStatus   GradingStatus @default(PENDING)
  answeredAt      DateTime    @default(now())

  @@index([submissionId])
}

enum GradingStatus {
  PENDING
  AUTO_GRADED
  MANUAL_REVIEW
}

// === EVENTS ===
model Event {
  id              String      @id @default(cuid())
  title           String
  description     String?
  quizId          String
  quiz            Quiz        @relation(fields: [quizId], references: [id])
  organizerId     String
  organizer       User        @relation("organizer", fields: [organizerId], references: [id])
  
  scheduledStartAt DateTime
  scheduledEndAt   DateTime
  timezone        String      @default("UTC")  // IANA timezone (per F007a)
  
  status          EventStatus @default(SCHEDULED)
  accessCode      String?
  maxParticipants Int         @default(999)
  actualParticipants Int      @default(0)
  
  participants    EventParticipant[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([quizId])
  @@index([status])
}

enum EventStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// === EVENT_PARTICIPANTS ===
model EventParticipant {
  id              String      @id @default(cuid())
  eventId         String
  event           Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  studentId       String
  student         User        @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  status          ParticipantStatus @default(INVITED)
  joinedAt        DateTime?
  submissionId    String?     @unique
  
  scorePercentage Float?
  isPassed        Boolean?
  
  createdAt       DateTime    @default(now())

  @@unique([eventId, studentId])
}

enum ParticipantStatus {
  INVITED
  REGISTERED
  ATTENDED
  NO_SHOW
  WITHDREW
}

// === ANALYTICS ===
model Analytics {
  id              String      @id @default(cuid())
  studentId       String
  quizId          String
  eventId         String?
  
  totalAttempts   Int         @default(0)
  avgScore        Float       @default(0)
  maxScore        Float       @default(0)
  passedCount     Int         @default(0)
  failedCount     Int         @default(0)
  
  improvementTrend Float?
  lastAttemptAt   DateTime?
  
  updatedAt       DateTime    @updatedAt

  @@unique([studentId, quizId, eventId])
  @@index([studentId])
}

// === AUDIT_LOGS ===
model AuditLog {
  id              String      @id @default(cuid())
  tableName       String
  recordId        String
  operation       AuditOperation
  
  actorId         String?
  oldValues       Json?       // Previous state
  newValues       Json?       // New state
  changeReason    String?
  
  createdAt       DateTime    @default(now())

  @@index([tableName, recordId])
  @@index([createdAt])
}

enum AuditOperation {
  INSERT
  UPDATE
  DELETE
}
```

### Migration Strategy

**Using Prisma Migrations:**

```bash
# Generate migration after schema change
npx prisma migrate dev --name add_quiz_section

# Apply migrations in production
npx prisma migrate deploy

# Reset DB (dev only!)
npx prisma migrate reset
```

**Naming Convention:**
- `add_users_table`
- `add_quiz_versioning`
- `add_event_participants`

**No complex custom SQL needed for v1.** Prisma handles all migrations.

### Row-Level Security (RLS)

While Prisma doesn't directly enable RLS, implement filtering in service layer:

```typescript
// grading.service.ts
async gradeSubmission(submissionId: string, userId: string, userRole: UserRole) {
  // Only student who submitted OR instructor of quiz OR admin can grade
  const submission = await submissionRepo.getById(submissionId);
  
  if (userRole === 'student' && submission.studentId !== userId) {
    throw new ForbiddenError('Cannot grade others\' submissions');
  }
  
  if (userRole === 'instructor') {
    const quiz = await quizRepo.getById(submission.quizId);
    if (quiz.instructorId !== userId) {
      throw new ForbiddenError('Cannot grade submissions for others\' quizzes');
    }
  }
  
  // Proceed with grading
  ...
}
```

Alternatively, enable PostgreSQL RLS:
```sql
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_isolation ON submissions
  USING (student_id = current_user_id())
  WITH CHECK (student_id = current_user_id());
```

---

## 5. API CONTRACT & ENDPOINTS

### Response Format Standard

**All endpoints return JSON:**

```typescript
// Success (200, 201)
{
  "success": true,
  "data": { /* actual payload */ },
  "meta": { "timestamp": "2026-07-28T10:30:00Z" }
}

// Error (4xx, 5xx)
{
  "success": false,
  "error": {
    "code": "QUIZ_NOT_FOUND",
    "message": "Quiz with ID xyz not found",
    "statusCode": 404
  }
}
```

### Authentication Endpoints

```
POST /api/auth/register
  Body: { email, password, firstName, lastName, role }
  Response: { userId, email, token, refreshToken }
  Status: 201

POST /api/auth/login
  Body: { email, password }
  Response: { userId, email, token, refreshToken }
  Status: 200

POST /api/auth/refresh-token
  Body: { refreshToken }
  Response: { token, refreshToken }
  Status: 200

POST /api/auth/logout
  Header: Authorization: Bearer <token>
  Status: 204

GET /api/auth/me
  Header: Authorization: Bearer <token>
  Response: { userId, email, role, firstName, lastName }
  Status: 200
```

### Quiz Management Endpoints

```
GET /api/quizzes
  Query: ?status=published&limit=20&offset=0
  Response: { quizzes: [...], total, hasMore }
  Status: 200

POST /api/quizzes
  Header: Authorization (instructor/admin only)
  Body: { title, description, passingScore, maxAttempts }
  Response: { quizId, title, status: 'draft', ... }
  Status: 201

GET /api/quizzes/:quizId
  Response: { quiz object with questions }
  Status: 200

PATCH /api/quizzes/:quizId
  Header: Authorization (owner only)
  Body: { title, description, passingScore, ... }
  Response: { updated quiz }
  Status: 200

POST /api/quizzes/:quizId/publish
  Header: Authorization (owner only)
  Response: { quizId, status: 'published', ... }
  Status: 200

DELETE /api/quizzes/:quizId
  Header: Authorization (owner only)
  Response: {}
  Status: 204
```

### Question Management Endpoints

```
POST /api/quizzes/:quizId/questions
  Body: {
    questionText,
    type,  // Per F003a: mcq | true_false | short_answer | matching | essay
    points,
    section,  // For IELTS: "Listening", "Reading", "Writing", "Speaking"
    options: [...],  // For MCQ/T/F types
    matchingPairs: [...],  // For matching type: [{left, right}, ...]
    essayRubric: "..."  // For essay type: grading guidelines
  }
  Response: { questionId, ... }
  Status: 201

PATCH /api/quizzes/:quizId/questions/:questionId
  Body: { questionText, points, options: [...], matchingPairs: [...], essayRubric: "..." }
  Response: { updated question }
  Status: 200

DELETE /api/quizzes/:quizId/questions/:questionId
  Response: {}
  Status: 204

POST /api/quizzes/:quizId/questions/:questionId/options
  Body: { optionText, isCorrect }
  Response: { optionId, ... }
  Status: 201
```

### Submission Endpoints

```
POST /api/submissions
  Body: { quizId, eventId?, attemptNumber? }
  Response: { submissionId, quizId, startedAt, ... }
  Status: 201

GET /api/submissions/:submissionId
  Response: { submission with answers array }
  Status: 200

POST /api/submissions/:submissionId/answer
  Body: { questionId, selectedOptionKey?, answerText? }
  Response: { answerId, questionId, ... }
  Status: 201

POST /api/submissions/:submissionId/submit
  Body: {} (no body, just marks as submitted)
  Response: { submissionId, status: 'submitted', scorePercentage, isPassed, ... }
  Status: 200
  // Backend auto-grades here

GET /api/submissions?quizId=xyz&studentId=abc
  Query: ?status=graded&limit=20
  Response: { submissions: [...], total }
  Status: 200
```

### Event Endpoints

```
GET /api/events
  Query: ?status=scheduled&limit=20
  Response: { events: [...], total }
  Status: 200

POST /api/events
  Header: Authorization (instructor/admin only)
  Body: { title, quizId, scheduledStartAt, scheduledEndAt, maxParticipants }
  Response: { eventId, ... }
  Status: 201

PATCH /api/events/:eventId
  Body: { title, scheduledStartAt, ... }
  Response: { updated event }
  Status: 200

GET /api/events/:eventId/participants
  Response: { participants: [...], total, eventDetails }
  Status: 200

POST /api/events/:eventId/participants
  Body: { studentIds: [...] }  // Bulk invite
  Response: { added: N, failed: 0 }
  Status: 200

GET /api/events/:eventId/status
  Response: { eventId, status, startedAt, endedAt, actualParticipants }
  Status: 200
```

### Analytics Endpoints

```
GET /api/analytics/student/:studentId
  Query: ?quizId=xyz (optional filter)
  Response: { totalAttempts, avgScore, maxScore, passedCount, improvementTrend }
  Status: 200

GET /api/analytics/quiz/:quizId
  Response: { averageScore, totalSubmissions, passRate, questionAnalysis: [...] }
  Status: 200

GET /api/analytics/event/:eventId/report
  Response: { eventDetails, participants: [...with scores], statistics }
  Status: 200

GET /api/analytics/cohort?eventId=xyz
  Response: { cohortStats, distribution (score ranges), topPerformers, strugglingStudents }
  Status: 200
```

### Admin Endpoints

```
GET /api/admin/users
  Query: ?role=student&search=john&limit=20
  Response: { users: [...], total }
  Status: 200

POST /api/admin/users
  Body: { email, firstName, lastName, role }
  Response: { userId, ... }
  Status: 201

PATCH /api/admin/users/:userId
  Body: { role, status }
  Response: { updated user }
  Status: 200

DELETE /api/admin/users/:userId
  Response: {}
  Status: 204

GET /api/admin/audit-logs
  Query: ?tableName=quizzes&limit=50
  Response: { logs: [...], total }
  Status: 200

GET /api/admin/health
  Response: { status: 'healthy', uptime, dbConnected, version }
  Status: 200
```

### Utility Endpoints

```
GET /health
  Response: { status: 'ok', version, timestamp }
  Status: 200 (no auth required)

GET /api/config/public
  Response: { siteName, supportEmail, version }
  Status: 200 (no auth required)
```

---

## 6. BUSINESS LOGIC IMPLEMENTATION

### Authentication Flow

```typescript
// 1. Registration
export async function register(email, password, firstName, lastName, role) {
  // Validate input
  if (!isValidEmail(email)) throw new ValidationError('Invalid email');
  if (password.length < 8) throw new ValidationError('Password too short');
  
  // Check if user exists
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError('Email already registered');
  
  // Hash password
  const passwordHash = await hash(password, 12); // bcrypt
  
  // Create user
  const user = await userRepo.create({
    email, passwordHash, firstName, lastName, role, status: 'active'
  });
  
  // Generate tokens
  const token = generateJWT(user.id, user.role, '24h');
  const refreshToken = generateJWT(user.id, user.role, '7d');
  
  // Send welcome email (async, don't wait)
  emailService.sendWelcome(email, firstName).catch(console.error);
  
  return { userId: user.id, email, token, refreshToken };
}

// 2. Login
export async function login(email, password) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AuthError('Invalid credentials');
  if (user.status === 'suspended') throw new AuthError('Account suspended');
  
  const isValid = await compare(password, user.passwordHash);
  if (!isValid) throw new AuthError('Invalid credentials');
  
  // Update last login
  await userRepo.updateLastLogin(user.id);
  
  const token = generateJWT(user.id, user.role, '24h');
  const refreshToken = generateJWT(user.id, user.role, '7d');
  
  return { userId: user.id, email: user.email, token, refreshToken };
}

// 3. Validate Token
export function validateToken(token: string) {
  try {
    const decoded = verifyJWT(token);
    return decoded; // { userId, role, exp, iat }
  } catch (error) {
    throw new AuthError('Invalid token');
  }
}
```

### Auto-Grading Algorithm

```typescript
// Core grading logic (grading.service.ts)
export async function gradeSubmission(submissionId: string) {
  const submission = await submissionRepo.getWithAnswers(submissionId);
  let totalPoints = 0;
  let maxPoints = 0;
  
  for (const answer of submission.answers) {
    const question = await questionRepo.getById(answer.questionId);
    maxPoints += question.points;
    
    let earned = 0;
    
    if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
      // Objective grading (F004a: MCQ & true/false grading)
      const correctOption = await optionRepo.findCorrect(question.id);
      earned = answer.selectedOptionKey === correctOption.key 
        ? question.points 
        : 0;
      
      await answerRepo.updateGrade(answer.id, {
        isCorrect: earned > 0,
        pointsEarned: earned,
        gradingStatus: 'auto_graded'
      });
      
    } else if (question.type === 'SHORT_ANSWER') {
      // Fuzzy matching for short-answer (F004b: exact match + case-insensitive)
      const correctAnswers = await optionRepo.findCorrect(question.id);
      const { isCorrect, matchScore } = fuzzyMatch(
        answer.answerText,
        correctAnswers.map(o => o.optionText),
        question.fuzzyThreshold || 0.85
      );
      
      earned = isCorrect ? question.points : 0;
      
      await answerRepo.updateGrade(answer.id, {
        isCorrect,
        pointsEarned: earned,
        matchScore,
        gradingStatus: isCorrect ? 'auto_graded' : 'manual_review'
      });
      
    } else if (question.type === 'MATCHING') {
      // Matching question grading (F004c: match pairs)
      const studentPairs = JSON.parse(answer.answerText); // [{left, right}, ...]
      const correctPairs = JSON.parse(question.matchingPairs);
      
      let correctMatches = 0;
      for (const studentPair of studentPairs) {
        for (const correctPair of correctPairs) {
          if (studentPair.left === correctPair.left && 
              studentPair.right === correctPair.right) {
            correctMatches++;
            break;
          }
        }
      }
      
      // Points proportional to correct matches
      earned = Math.round((correctMatches / correctPairs.length) * question.points);
      const isCorrect = earned === question.points;
      
      await answerRepo.updateGrade(answer.id, {
        isCorrect,
        pointsEarned: earned,
        gradingStatus: 'auto_graded'
      });
      
    } else if (question.type === 'ESSAY') {
      // Essay grading - manual only (F004d: instructor review required)
      await answerRepo.updateGrade(answer.id, {
        isCorrect: null, // Unknown until graded
        pointsEarned: 0,  // No points until instructor grades
        gradingStatus: 'manual_review' // Requires instructor grading
      });
      // NOTE: totalPoints updated only after instructor grades essays
    }
    
    totalPoints += earned;
  }
  
  const scorePercentage = (totalPoints / maxPoints) * 100;
  const isPassed = scorePercentage >= submission.quiz.passingScore;
  
  // Calculate IELTS section scores if quiz has sections (F006d: section breakdown)
  let sectionScores: any = {};
  if (submission.quiz.quizType === 'ielts_simulation') {
    const sections = ['Listening', 'Reading', 'Writing', 'Speaking'];
    for (const section of sections) {
      const sectionAnswers = submission.answers.filter(a => 
        a.question.section === section
      );
      if (sectionAnswers.length > 0) {
        const sectionPoints = sectionAnswers.reduce((sum, a) => 
          sum + (a.pointsEarned || 0), 0
        );
        const sectionMax = sectionAnswers.reduce((sum, a) => 
          sum + a.question.points, 0
        );
        const sectionPercentage = (sectionPoints / sectionMax) * 100;
        // Convert percentage to IELTS band (0-9 scale)
        const ieltsScore = convertPercentageToIELTSBand(sectionPercentage);
        sectionScores[section.toLowerCase() + 'Score'] = ieltsScore;
      }
    }
    // Calculate overall IELTS band as average of sections
    const allScores = Object.values(sectionScores).filter(v => v !== undefined) as number[];
    if (allScores.length > 0) {
      sectionScores.overallBand = allScores.reduce((a, b) => a + b) / allScores.length;
    }
  }
  
  // Update submission
  await submissionRepo.update(submission.id, {
    status: 'graded',
    totalPoints,
    maxPoints,
    scorePercentage,
    isPassed,
    submittedAt: new Date(),
    ...sectionScores  // Include IELTS scores if applicable
  });
  
  // Update analytics (async)
  analyticsService.refreshStudentStats(submission.studentId, submission.quizId)
    .catch(console.error);
  
  return { totalPoints, scorePercentage, isPassed };
}

// Fuzzy matching helper (for short-answer)
function fuzzyMatch(
  studentAnswer: string,
  correctAnswers: string[],
  threshold: number
): { isCorrect: boolean; matchScore: number } {
  const normalized = (s: string) => s.trim().toLowerCase();
  const student = normalized(studentAnswer);
  
  // Exact match first
  if (correctAnswers.map(normalized).includes(student)) {
    return { isCorrect: true, matchScore: 1.0 };
  }
  
  // Fuzzy match using Levenshtein distance
  let maxScore = 0;
  for (const correct of correctAnswers) {
    const score = levenshteinSimilarity(student, normalized(correct));
    maxScore = Math.max(maxScore, score);
  }
  
  return {
    isCorrect: maxScore >= threshold,
    matchScore: maxScore
  };
}

function levenshteinSimilarity(a: string, b: string): number {
  // Calculate Levenshtein distance, return similarity (0-1)
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - (distance / maxLen);
}

function levenshteinDistance(a: string, b: string): number {
  // Standard algorithm (DP table)
  const m = a.length, n = b.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Helper: Convert percentage score to IELTS band (0-9 scale) per F006d
function convertPercentageToIELTSBand(percentage: number): number {
  // IELTS band scale mapping (0-100% → 0-9 bands)
  if (percentage >= 90) return 9.0;   // Expert user
  if (percentage >= 85) return 8.5;
  if (percentage >= 80) return 8.0;   // Very good user
  if (percentage >= 75) return 7.5;
  if (percentage >= 70) return 7.0;   // Good user
  if (percentage >= 60) return 6.5;
  if (percentage >= 50) return 6.0;   // Competent user
  if (percentage >= 40) return 5.5;
  if (percentage >= 30) return 5.0;   // Modest user
  if (percentage >= 20) return 4.5;
  if (percentage >= 10) return 4.0;   // Limited user
  if (percentage > 0) return 3.5;
  return 0.0;                         // Non-user
}
```

### Event & Submission Flow

```typescript
// event.service.ts
export async function scheduleEvent(data: CreateEventRequest) {
  // Validate quiz exists
  const quiz = await quizRepo.getById(data.quizId);
  if (!quiz) throw new NotFoundError('Quiz not found');
  
  // Validate dates
  if (data.scheduledEndAt <= data.scheduledStartAt) {
    throw new ValidationError('End time must be after start time');
  }
  
  // Create event
  const event = await eventRepo.create({
    title: data.title,
    quizId: data.quizId,
    organizerId: currentUserId,
    scheduledStartAt: data.scheduledStartAt,
    scheduledEndAt: data.scheduledEndAt,
    status: 'scheduled'
  });
  
  return event;
}

export async function inviteStudents(eventId: string, studentIds: string[]) {
  // Bulk insert into event_participants
  const participants = studentIds.map(id => ({
    eventId,
    studentId: id,
    status: 'invited',
    createdAt: new Date()
  }));
  
  await eventParticipantRepo.createMany(participants);
  
  // Send emails (async)
  studentIds.forEach(id => {
    emailService.sendEventInvite(eventId, id).catch(console.error);
  });
}

export async function registerForEvent(eventId: string, studentId: string) {
  // Check if space available
  const event = await eventRepo.getById(eventId);
  const count = await eventParticipantRepo.countByEvent(eventId);
  
  if (count >= event.maxParticipants) {
    throw new ConflictError('Event is full');
  }
  
  // Mark as registered
  await eventParticipantRepo.update(eventId, studentId, {
    status: 'registered',
    joinedAt: new Date()
  });
}

export async function startEventQuiz(eventId: string, studentId: string) {
  // Check if student is registered
  const participant = await eventParticipantRepo.get(eventId, studentId);
  if (participant.status !== 'registered') {
    throw new ForbiddenError('You are not registered for this event');
  }
  
  // Create submission
  const submission = await submissionRepo.create({
    quizId: event.quizId,
    studentId,
    eventId,
    attemptNumber: 1,
    status: 'in_progress'
  });
  
  // Mark participant as attended
  await eventParticipantRepo.update(eventId, studentId, {
    status: 'attended',
    submissionId: submission.id
  });
  
  return submission;
}
```

### Analytics Refresh

```typescript
// analytics.service.ts
export async function refreshStudentStats(studentId: string, quizId: string) {
  // Calculate aggregates from submissions
  const submissions = await submissionRepo.getByStudentAndQuiz(studentId, quizId);
  
  const stats = {
    totalAttempts: submissions.length,
    avgScore: submissions.reduce((sum, s) => sum + s.scorePercentage, 0) / submissions.length || 0,
    maxScore: Math.max(...submissions.map(s => s.scorePercentage), 0),
    passedCount: submissions.filter(s => s.isPassed).length,
    failedCount: submissions.filter(s => !s.isPassed).length,
    improvementTrend: calculateImprovement(submissions),
    lastAttemptAt: submissions[submissions.length - 1]?.submittedAt
  };
  
  // Upsert into analytics
  await analyticsRepo.upsert({
    studentId,
    quizId,
    ...stats
  });
}

function calculateImprovement(submissions: Submission[]): number | null {
  if (submissions.length < 2) return null;
  
  const firstScore = submissions[0].scorePercentage;
  const lastScore = submissions[submissions.length - 1].scorePercentage;
  
  return lastScore - firstScore; // Percentage point difference
}
```

---

## 7. AUTHENTICATION & AUTHORIZATION

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  iat: number;      // Issued at
  exp: number;      // Expiration
  type: 'access' | 'refresh';
}

// Token in HTTP-only cookie (secure, not vulnerable to XSS)
export function setTokenCookie(res: Response, token: string, expiresIn: number) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge: expiresIn * 1000  // milliseconds
  });
}
```

### RBAC (Role-Based Access Control)

**Three roles with permission matrix:**

| Action | Admin | Instructor | Student |
|--------|-------|-----------|---------|
| Create Quiz | ✅ | ✅ | ❌ |
| Edit Own Quiz | ✅ | ✅ | ❌ |
| Edit Others' Quiz | ✅ | ❌ | ❌ |
| Delete Quiz | ✅ | ✅ (own) | ❌ |
| Schedule Event | ✅ | ✅ | ❌ |
| Take Quiz | ✅ | ✅ | ✅ |
| View Own Submissions | ✅ | ✅ | ✅ |
| View Others' Submissions | ✅ | ✅ (own quizzes) | ❌ |
| View Analytics (own) | ✅ | ✅ | ✅ |
| View Analytics (all) | ✅ | ✅ (own quizzes) | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |

**Implementation:**

```typescript
// middleware/rbac.middleware.ts
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Attached by auth middleware
    
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
}

// Usage
router.post('/quizzes', 
  auth(),                        // Verify JWT
  requireRole('admin', 'instructor'),  // RBAC check
  quizController.create          // Handler
);
```

### Data Isolation

```typescript
// services/quiz.service.ts
export async function getQuiz(quizId: string, userId: string, userRole: UserRole) {
  const quiz = await quizRepo.getById(quizId);
  if (!quiz) throw new NotFoundError('Quiz not found');
  
  // Public quizzes visible to everyone
  if (quiz.isPublic) return quiz;
  
  // Private quizzes: only owner, admins
  if (userRole === 'admin') return quiz;
  if (quiz.instructorId === userId) return quiz;
  
  throw new ForbiddenError('You do not have access to this quiz');
}

// Similar for submissions
export async function getSubmission(submissionId: string, userId: string, userRole: UserRole) {
  const submission = await submissionRepo.getById(submissionId);
  
  // Student: only own submissions
  if (userRole === 'student') {
    if (submission.studentId !== userId) {
      throw new ForbiddenError('Cannot view others\' submissions');
    }
    return submission;
  }
  
  // Instructor: own quizzes' submissions
  if (userRole === 'instructor') {
    const quiz = await quizRepo.getById(submission.quizId);
    if (quiz.instructorId !== userId) {
      throw new ForbiddenError('Cannot view others\' quiz submissions');
    }
    return submission;
  }
  
  // Admin: all submissions
  return submission;
}
```

---

## 8. ERROR HANDLING & LOGGING

### Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'AUTH_ERROR', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
  }
}
```

### Global Error Handler Middleware

```typescript
// middleware/error.middleware.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let appError: AppError;
  
  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = new ValidationError(err.errors[0].message);
  } else {
    // Log unexpected errors
    logger.error('Unexpected error', { error: err, url: req.url });
    appError = new InternalError();
  }
  
  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode
    }
  });
}

// Register in app.ts
app.use(errorHandler);
```

### Logging

```typescript
// utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false
    }
  }
});

// Usage
logger.info('User registered', { userId, email });
logger.warn('Quiz quota exceeded', { instructorId });
logger.error('Database connection failed', { error: err.message });
```

**Log what?**
- User actions (login, logout, quiz submission)
- Data changes (create/update/delete)
- Errors (with stack trace)
- Performance metrics (response time, DB queries)

**Don't log:**
- Passwords or tokens
- PII (unless anonymized)
- Sensitive config values

---

## 9. PERFORMANCE & SCALABILITY

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| API response time (p95) | <300ms | Indexed queries, connection pooling |
| Page load time | <2s (landing), <3s (app) | Code splitting, lazy loading, CDN |
| Concurrent users | 100+ (free tier) | Horizontal scale with Railway/Render |
| Database queries | <50ms p95 | N+1 prevention, proper indexing |

### Query Optimization

**Avoid N+1 queries:**

```typescript
// ❌ Bad: N+1 query problem
const quizzes = await quizRepo.getAll();
for (const quiz of quizzes) {
  quiz.questions = await questionRepo.getByQuiz(quiz.id); // N queries
}

// ✅ Good: Single query with joins
const quizzes = await db.quiz.findMany({
  include: { questions: true } // Prisma join
});
```

**Index Strategy:**

```sql
-- From DATABASE_SCHEMA.md
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_quiz ON submissions(quiz_id);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_answers_submission ON answers(submission_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
```

**Connection Pooling:**

```typescript
// config.ts
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  max: 20,  // Max 20 connections (free tier Postgres)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Frontend Performance

**Code Splitting:**

```typescript
// App.tsx
import { Suspense, lazy } from 'react';

const QuizTake = lazy(() => import('./pages/quiz/QuizTake'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/quiz/:id/take" element={<QuizTake />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

**Image Optimization:**

```typescript
// Use webp with fallback, lazy load
<img 
  src="image.webp" 
  alt="quiz"
  loading="lazy"
  decoding="async"
/>
```

### Scaling Strategy (v1 → v1.1)

**v1.0 (Free Tier):**
- Single Supabase instance (500MB, 1GB total)
- Single Railway/Render backend
- No caching layer (Redis)
- Acceptable for <5K MAU

**v1.1 (Upgrade):**
- Add Redis for session + leaderboard cache
- Database connection pooling via pgBouncer
- CDN for static assets (Cloudflare)

---

## 10. TESTING STRATEGY

### Test Coverage Goals

| Layer | Coverage | Tools |
|-------|----------|-------|
| Backend | >85% | Jest + Supertest |
| Frontend | >70% | Vitest + React Testing Library |
| E2E | Critical paths only | Playwright |

### Unit Tests (Backend)

```typescript
// tests/unit/grading.service.test.ts
describe('GradingService', () => {
  let service: GradingService;
  let mockSubmissionRepo: jest.Mocked<SubmissionRepository>;
  let mockAnswerRepo: jest.Mocked<AnswerRepository>;
  
  beforeEach(() => {
    mockSubmissionRepo = jest.genMockFromModule<SubmissionRepository>(...);
    mockAnswerRepo = jest.genMockFromModule<AnswerRepository>(...);
    service = new GradingService(mockSubmissionRepo, mockAnswerRepo);
  });
  
  test('should grade MCQ correctly', async () => {
    const submission = { ... };
    const answer = { selectedOptionKey: 'A', questionId: 'q1' };
    
    mockSubmissionRepo.getWithAnswers.mockResolvedValue(submission);
    
    const result = await service.gradeSubmission('sub123');
    
    expect(result.scorePercentage).toBe(100);
    expect(result.isPassed).toBe(true);
  });
  
  test('should handle fuzzy matching for short-answer', async () => {
    // Test typos, case-insensitivity
    const result = fuzzyMatch('pris', ['Paris'], 0.85);
    expect(result.isCorrect).toBe(true);
  });
});
```

### Integration Tests (Backend)

```typescript
// tests/integration/submission.integration.test.ts
describe('Submission API', () => {
  let app: Express;
  let db: PrismaClient;
  
  beforeAll(async () => {
    app = createTestApp();
    db = new PrismaClient();
    await db.$executeRawUnsafe('TRUNCATE TABLE submissions CASCADE');
  });
  
  test('should submit quiz and auto-grade', async () => {
    // Setup: Create quiz, questions, options
    const quiz = await db.quiz.create({ ... });
    const question = await db.question.create({ ... });
    const option = await db.option.create({ isCorrect: true, ... });
    
    // Create submission
    const submitRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ quizId: quiz.id });
    
    expect(submitRes.status).toBe(201);
    const submissionId = submitRes.body.data.submissionId;
    
    // Answer question
    await request(app)
      .post(`/api/submissions/${submissionId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: question.id, selectedOptionKey: 'A' });
    
    // Submit quiz
    const result = await request(app)
      .post(`/api/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(result.status).toBe(200);
    expect(result.body.data.scorePercentage).toBe(100);
    expect(result.body.data.isPassed).toBe(true);
  });
});
```

### Component Tests (Frontend)

```typescript
// tests/QuizTake.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import QuizTake from './pages/quiz/QuizTake';

describe('QuizTake Component', () => {
  test('should render quiz title', () => {
    render(<QuizTake quizId="q1" />);
    expect(screen.getByText('Sample Quiz')).toBeInTheDocument();
  });
  
  test('should update answer when option selected', () => {
    render(<QuizTake quizId="q1" />);
    const optionA = screen.getByLabelText('Option A');
    fireEvent.click(optionA);
    expect(optionA).toBeChecked();
  });
  
  test('should submit quiz and show results', async () => {
    render(<QuizTake quizId="q1" />);
    fireEvent.click(screen.getByText('Submit'));
    
    await screen.findByText('Your Score: 100%');
    expect(screen.getByText('Passed!')).toBeInTheDocument();
  });
});
```

### End-to-End Tests (Critical paths only)

```typescript
// tests/e2e/quiz-flow.spec.ts
import { test, expect } from '@playwright/test';

test('student takes quiz and sees results', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'student@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Select quiz
  await page.goto('/quizzes');
  await page.click('text=Sample Quiz');
  
  // Answer questions
  await page.click('label:has-text("Option A")');
  await page.click('button:has-text("Next")');
  
  // Submit
  await page.click('button:has-text("Submit")');
  
  // Verify results
  await expect(page).toHaveURL('/submissions/*');
  await expect(page.locator('text=Score: 100%')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests (requires DB)
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 11. DEPLOYMENT & DEVOPS

### Local Development

```bash
# 1. Clone + install
git clone <repo>
cd backend && npm install
cd ../frontend && npm install

# 2. Setup env
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
# Edit with local values

# 3. Start database
docker-compose up -d postgres

# 4. Migrations
cd backend && npx prisma migrate deploy

# 5. Seed data (optional)
npm run seed

# 6. Start servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Backend at http://localhost:3000
# Frontend at http://localhost:5173
```

### Docker Setup

```dockerfile
# Dockerfile (backend)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Prisma needs to generate client
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

```yaml
# docker-compose.yml (local dev)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: eduflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/eduflow
      JWT_SECRET: dev-secret
      NODE_ENV: development
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/test-and-deploy.yml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: cd backend && npm ci && npm run test
      - run: cd frontend && npm ci && npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy backend (Railway)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: npx railway up
      
      - name: Deploy frontend (Vercel)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel deploy --prod
```

### Production Environment Variables

```bash
# backend/.env.production
DATABASE_URL=postgresql://user:pass@host:5432/eduflow
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=https://key@sentry.io/project
EMAIL_PROVIDER=resend
RESEND_API_KEY=<key>
CORS_ORIGIN=https://eduflow.com
```

### Monitoring & Alerts

**Sentry Setup (Error Tracking):**

```typescript
// app.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Health Check Endpoint:**

```typescript
// routes/health.routes.ts
router.get('/health', async (req, res) => {
  try {
    // Test DB connection
    await db.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});
```

---

## 12. DEPENDENCIES & VERSIONING

### Node.js & Runtime

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Backend Dependencies (Key Packages)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.0",
    "@prisma/client": "^5.4.0",
    "@types/node": "^20.8.0",
    "jsonwebtoken": "^9.1.0",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4",
    "pino": "^8.16.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "resend": "^2.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.5",
    "prisma": "^5.4.0"
  }
}
```

**Rationale:**
- **Express:** Lightweight, proven framework
- **Prisma:** Type-safe ORM with migrations
- **JWT:** Stateless auth
- **Bcrypt:** Password hashing (battle-tested)
- **Zod:** Runtime type validation
- **Pino:** Fast, structured logging
- **Helmet:** Security headers
- **Resend:** Transactional email (simple API)

### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "vite": "^5.0.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.25.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "vitest": "^0.34.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.5",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0"
  }
}
```

### Database Version

```
PostgreSQL: 14+ (Supabase default is 14)
```

---

## 13. KNOWN LIMITATIONS & FUTURE WORK

### v1.0 Limitations (Document for Interview Transparency)

**Authentication:**
- ❌ No OAuth2 (Google, GitHub login) → v1.1
- ❌ No two-factor authentication (2FA) → v1.2
- ❌ Stateless JWT only (can't revoke token early)

**Performance:**
- ❌ No caching layer (Redis) → acceptable for <10K MAU
- ❌ No CDN for frontend → Vercel provides edge network
- ❌ Single database instance (no replication)

**Features:**
- ❌ No real-time notifications → WebSocket in v1.1
- ❌ No file uploads → v1.1
- ❌ No IELTS audio/speaking module → future
- ❌ No payment processing → v2.0
- ❌ No mobile app → v2.0

**Operations:**
- ❌ Manual backups only (rely on Supabase)
- ❌ No multi-region deployment
- ❌ No horizontal scaling without redesign

### v1.1 Roadmap (Examples)

**High Priority (2-3 months post-launch):**
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Resend email templates (HTML emails, transactional)
- [ ] Quiz import/export (CSV, file uploads to S3)
- [ ] Password reset flow

**Medium Priority (3-4 months):**
- [ ] Redis caching (session, leaderboard)
- [ ] WebSocket real-time notifications
- [ ] Advanced search & filters
- [ ] Role-based admin dashboard
- [ ] API rate limiting per user

**Low Priority (5+ months):**
- [ ] Two-factor authentication (2FA)
- [ ] Payment integration (Stripe)
- [ ] Analytics dashboard (more charts)
- [ ] Mobile app (React Native or Flutter)

---

## APPENDIX: QUICK REFERENCE

### Directory Structure (One-Liner)

```bash
# Backend
backend/
├── src/{controllers,services,repositories,middleware,models,utils,config,routes}
├── tests/{unit,integration,fixtures}
├── prisma/{schema.prisma,migrations}
└── docker-compose.yml

# Frontend
frontend/
├── src/{pages,components,hooks,context,services,utils,types,styles}
├── public/
├── tests/
└── vite.config.ts
```

### Key Commands

```bash
# Development
npm run dev          # Start server with hot reload
npm run test         # Run all tests
npm run test:watch   # Watch mode

# Database
npx prisma studio   # GUI for database
npx prisma migrate dev --name <name>

# Build & Deploy
npm run build        # Compile TypeScript
npm run start        # Run production build
npm run deploy       # Deploy to Railway/Vercel
```

### Version Checklist

- ✅ Node.js 18+
- ✅ PostgreSQL 14+
- ✅ TypeScript 5.3+
- ✅ Express 4.18+
- ✅ React 18+
- ✅ Prisma 5.4+

---

## SIGN-OFF

| Role | Name | Date | Status |
|------|------|------|--------|
| Tech Lead | Aulia | 2026-07-28 | ✅ Approved |

**TDD Validation Checklist:**
- ✅ Covers all P0 features (F001-F012) with implementation strategy
- ✅ Practical, not over-engineered (Express, Prisma, Vite - no bloat)
- ✅ 6-8 week timeline realistic (solo dev, 40 hrs/week)
- ✅ Tech stack matches PRD (Node + React + PostgreSQL)
- ✅ Database schema aligned with DATABASE_SCHEMA.md
- ✅ API endpoints cover all LOGIC_FLOW scenarios
- ✅ Security (JWT + RBAC + RLS) implemented
- ✅ Testing strategy defined (unit, integration, E2E)
- ✅ Deployment workflow clear (GitHub Actions → Railway + Vercel)
- ✅ Error handling & monitoring specified
- ✅ Production-ready, portfolio-quality

**Next Steps:**
1. Review & sign off TDD (this document)
2. Proceed to **API_CONTRACT.md** (detailed endpoint specifications)
3. Start backend development (Week 1: Auth + scaffolding)

---

*TDD.md v1.0 | EduFlow | Approved 2026-07-28*

*Status: ✅ Complete & Ready for Development*
