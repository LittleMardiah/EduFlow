# PRD (Product Requirement Document) - EduFlow

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*For Solo Developer - Production Grade | Portfolio Project*

---

## 📌 HEADER & METADATA

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Version** | v2.0 |
| **Created Date** | 2026-07-28 |
| **Last Updated** | 2026-07-28 |
| **Author** | M. Arif Aulia (Portfolio Project) |
| **Status** | Approved & Locked for Development |
| **Portfolio Goal** | Demonstrate full-stack mastery matching Education Republic job requirements |

---

## 📋 EXECUTIVE SUMMARY

### Problem Statement

Educational institutions struggle with fragmented assessment tooling. Currently, they need:
- **Quiz bank management** (time-consuming manual creation & organization)
- **Automated grading** (reducing teacher workload from hours to minutes)
- **Standardized testing simulations** (IELTS/TOEFL-style timed exams with authentic UX)
- **Learning analytics** (tracking student performance trends and cohort insights)
- **Event scheduling** (managing who takes what quiz when)

The status quo: 3-4 disconnected tools (LMS, quiz tool, grading spreadsheet, analytics dashboard). This creates friction, data silos, and poor user experience.

### Solution Overview

**EduFlow** is a unified, production-ready EdTech platform consolidating:
1. **Quiz Bank Management** - Create, organize, and version control question banks
2. **Auto-Grading Engine** - Instant scoring for MCQ, true/false, short-answer questions
3. **IELTS Simulation Mode** - Authentic timed testing with section breakdown (Listening, Reading, Writing, Speaking UI placeholders)
4. **Event-Based Testing** - Schedule quizzes, manage participant rosters, track attendance
5. **Analytics Dashboard** - Real-time student performance, progress tracking, cohort reports
6. **Role-Based Access Control** - Admins, Instructors, Students with proper data isolation

**Tech Stack:** Node.js + React 18 + PostgreSQL (Supabase) + TypeScript, deployed on Vercel.

### Value Proposition

| Benefit | Business Value | User Impact |
|---------|-----------------|------------|
| **Instant Auto-Grading** | Reduces teacher grading time by 80%+ | Students get immediate feedback instead of waiting days |
| **Single Unified Platform** | Eliminates tool-switching; faster onboarding | Instructors save 5+ hours/week on admin |
| **IELTS Simulation** | Positions as premium assessment tool | Students practice with authentic exam format & timing |
| **Learning Analytics** | Data-driven insights for curriculum | Admins identify struggling cohorts early; pivot teaching |
| **Role-Based Workflows** | Enforces proper access controls | Secure, compliant student data handling |
| **Free Tier Deployment** | Zero infrastructure cost to launch | Rapid time-to-market; proof-of-concept viability |

### Target Users (Persona Analysis)

**Primary:** Online learning platforms (e.g., Education Republic)
- Segment: EdTech platforms, language learning centers, corporate training
- Need: Scalable, reliable assessment backend + reporting
- Pain: Manual grading, student dropoff from slow feedback cycles

**Secondary:** Academic institutions
- Segment: K-12 schools, colleges, universities
- Need: Integrated quiz + attendance tracking
- Pain: Fragmented tools, compliance/data protection concerns

**Tertiary:** Tutoring & Test Prep Centers
- Segment: IELTS/TOEFL prep, SAT/ACT centers
- Need: Authentic timed simulations + detailed score analysis
- Pain: Expensive proprietary systems; limited customization

---

## 🎯 OBJECTIVES & SUCCESS CRITERIA

### Primary Objectives

1. **Build Production-Grade EdTech Platform**
   - All core features (F001-F012) working end-to-end
   - <300ms API response times; 99.5% uptime on free tier
   - Zero data loss; automated backups working
   - Proper error handling & user feedback

2. **Demonstrate Mastery of Full-Stack JavaScript + Database Design**
   - Clean, well-documented code (90%+ test coverage)
   - Proper separation of concerns (service layer, data layer, API layer)
   - Advanced database design (normalized schema, efficient queries, RLS)
   - Git history showing iterative development

3. **Align with Education Republic's Tech Stack & Hiring Criteria**
   - ✅ 2+ years full-stack development experience demonstrated
   - ✅ Backend (Node.js/Express with proper middleware & validation)
   - ✅ Frontend (React with state management, responsive design)
   - ✅ Database (PostgreSQL with schema design, migrations)
   - ✅ REST API design (proper HTTP methods, error codes, contract)
   - ✅ Authentication & authorization (JWT, role-based access)
   - ✅ Version control (Git with clean commit history)

4. **Create Portfolio-Quality Deliverable**
   - Professional README with setup instructions
   - Architecture diagram showing system design
   - Live demo accessible 24/7 (Vercel + Supabase free tier)
   - This PRD included in `/docs/PRD.md`
   - Comprehensive API documentation

### Success Metrics

| Metric | Target | How to Measure | Acceptance Criteria |
|--------|--------|-----------------|-------------------|
| **MVP Completion** | All P0 features (F001-F012) working | Manual feature checklist | ✅ 12/12 features functional |
| **Auto-Grading Accuracy** | 100% correct answer matching | Test suite with 50+ test cases | ✅ All edge cases handled |
| **API Response Time** | <300ms p95 for 95% of requests | Load testing with 50 concurrent users | ✅ No request >500ms |
| **Frontend Performance** | Page load <2s, interactive <3s | Lighthouse audit | ✅ Score >90 mobile, >95 desktop |
| **Test Coverage** | >80% code coverage | Jest/Mocha test reports | ✅ Backend >85%, Frontend >75% |
| **Role-Based Access** | Zero unauthorized data access | Security audit checklist | ✅ All 9 RBAC rules enforced |
| **Deployment Ready** | Live public demo, CI/CD working | Accessible URL + GitHub Actions logs | ✅ /health endpoint responds |
| **Code Quality** | Clean, well-documented | ESLint, Prettier, code review | ✅ Zero critical violations |
| **Portfolio Presentation** | Clear story of development | README, diagrams, this PRD | ✅ Interviewer can understand all decisions |

---

## 📦 SCOPE DEFINITION

### In Scope (V1.0 MVP - MUST have)

**Core Modules (P0 - Critical for Launch):**

| Feature ID | Feature Name | Epic | Dependencies | Effort |
|-----------|-------------|------|--------------|--------|
| **F001** | Authentication & Authorization | Auth | None | M |
| F001a | User registration (email/password) | Auth | - | S |
| F001b | JWT-based session management | Auth | F001a | S |
| F001c | Role-based access control (Admin/Instructor/Student) | Auth | F001b | M |
| F001d | Row-level security in database | Auth | F001c | M |
| **F002** | Quiz Bank Management (CRUD) | Quiz | F001 | L |
| F002a | Create quiz (title, description, time limit, passing score) | Quiz | F001 | M |
| F002b | Edit quiz metadata & settings | Quiz | F002a | S |
| F002c | Publish/draft status control | Quiz | F002a | S |
| F002d | List & search quizzes (paginated, filterable) | Quiz | F002a | M |
| **F003** | Question Management | Quiz | F002 | L |
| F003a | Multiple question types (MCQ, T/F, short-answer, matching) | Quiz | F002 | L |
| F003b | Difficulty tagging (easy/medium/hard) | Quiz | F003a | S |
| F003c | Question reusability (add from bank to quiz) | Quiz | F003a | M |
| F003d | Bulk question operations (copy, move, delete) | Quiz | F003a | M |
| **F004** | Auto-Grading Engine | Grading | F003 | L |
| F004a | MCQ & true/false grading (perfect accuracy) | Grading | F003 | M |
| F004b | Short-answer grading (exact match + case-insensitive) | Grading | F003 | M |
| F004c | Matching question grading | Grading | F003 | M |
| F004d | Essay questions marked by instructor (manual) | Grading | F003 | S |
| **F005** | Quiz Attempt & Submission | Quiz Taking | F004 | L |
| F005a | Quiz UI with timer (countdown visible) | Quiz Taking | F001, F002 | L |
| F005b | Auto-save every 30 seconds (loss prevention) | Quiz Taking | F005a | M |
| F005c | Answer review before submit | Quiz Taking | F005a | M |
| F005d | Submit answers & lock quiz (no retake if deadline) | Quiz Taking | F005a | M |
| F005e | Resume incomplete quiz (if time remains) | Quiz Taking | F005a | S |
| **F006** | IELTS Simulation Mode | Advanced | F005 | L |
| F006a | Section-based layout (Listening, Reading, Writing, Speaking) | Advanced | F005 | L |
| F006b | Real-time section timer (separate for each section) | Advanced | F006a | M |
| F006c | Section navigation (next/prev, jump to section) | Advanced | F006a | M |
| F006d | Score breakdown by section + overall band | Advanced | F006a | M |
| **F007** | Testing Session/Event Management | Events | F002 | M |
| F007a | Create test event (date, time, duration, timezone) | Events | F001 | M |
| F007b | Add/remove students to event | Events | F007a | S |
| F007c | Lock event after completion | Events | F007a | S |
| F007d | View participant list & attempt status | Events | F007a | S |
| **F008** | Student Results & Feedback | Results | F005, F006 | M |
| F008a | Show instant score & correct answers | Results | F005 | M |
| F008b | Detailed answer breakdown (what student answered vs correct) | Results | F005 | M |
| F008c | Performance analytics (time spent, accuracy %) | Results | F005 | S |
| **F009** | Instructor Analytics Dashboard | Analytics | F008 | L |
| F009a | Quiz performance summary (class avg, top/bottom students) | Analytics | F008 | M |
| F009b | Student progress tracking (quiz history, trends) | Analytics | F008 | M |
| F009c | Export results to CSV | Analytics | F008 | S |
| **F010** | Admin Dashboard | Admin | F001, F002 | M |
| F010a | User management (create, edit, deactivate, role assignment) | Admin | F001 | M |
| F010b | Content management (view/delete quizzes, bulk operations) | Admin | F002 | M |
| F010c | System health monitoring (DB status, API uptime) | Admin | - | S |
| **F011** | Learning Progress Tracking | Analytics | F008 | M |
| F011a | Student progress over time (graph: quizzes completed, avg score) | Analytics | F008 | M |
| F011b | Cohort comparison (how student compares to class) | Analytics | F008 | M |
| **F012** | Real-Time Notifications | Real-time | F007, F008 | M |
| F012a | Quiz available notification (student dashboard) | Real-time | F007 | M |
| F012b | Results ready notification (submission scored) | Real-time | Real-time | M |
| F012c | Event reminder 24 hours before start | Real-time | F007 | S |

*Legend: S=Small (1-2 days), M=Medium (2-5 days), L=Large (5-10 days)*

### Nice-to-Have Features (V1.1+)

| Feature ID | Feature Name | Rationale | Estimated Version |
|-----------|-------------|-----------|-------------------|
| F013 | Course Management & Quiz Linking | Organize quizzes into courses; adds structure | v1.1 |
| F014 | Leaderboard & Gamification | Boost engagement; not critical for MVP | v1.1 |
| F015 | Student Cohort Reporting | Institutional need; deferred for time | v1.1 |
| F016 | Email Notifications & Reminders | Nice UX polish; SMS fallback | v1.1 |
| F017 | Question Bank Bulk Import (CSV) | Reduce manual data entry | v1.2 |
| F018 | Proctoring Integration | Cheat prevention; requires third-party API | v2.0 |
| F019 | Essay AI Grading | Future ML feature | v2.0 |
| F020 | Mobile App (React Native) | Requires separate codebase | v2.0 |

### Explicitly Out of Scope (V1.0)

| Category | Excluded Features | Reason |
|----------|------------------|--------|
| **Media** | Video/audio hosting, conferencing integration | Use YouTube embeds, Zoom for AV; outside portfolio scope |
| **Advanced Features** | ML content recommendations, adaptive learning | No time; better as v2.0 post-launch |
| **Compliance** | LTI integration, SCORM, GDPR advanced features | Single-tenant model sufficient for V1 |
| **Localization** | Multi-language UI, i18n | English-only; 1-2 weeks work deferred |
| **Mobile** | Native iOS/Android apps | Responsive web design sufficient; React Native post-launch |
| **Payment** | Stripe integration, subscription management | Not needed for portfolio; demo use only |
| **Social** | Peer collaboration, discussion forums | Outside assessment scope |

**Scope Lock Rationale:** V1 focuses on assessment excellence—the core value of EduFlow. Cutting these features keeps timeline at 6-8 weeks (realistic for solo dev), allowing for quality execution rather than feature sprawl. Post-launch, prioritize based on user feedback.

---

## 👥 USER STORIES & ACCEPTANCE CRITERIA

### User Story 1: Admin Creates & Publishes Quiz to Instructor

```
AS AN admin
I WANT to create a quiz with 50+ questions, set grading rules, and publish it
SO THAT instructors can immediately assign it to students without delays

Acceptance Criteria:
- [ ] Admin accesses "Create Quiz" form with intuitive UI
- [ ] Admin enters quiz metadata (title, description, time limit, passing score)
- [ ] Admin can add questions one-by-one or in bulk (import CSV in V1.1)
- [ ] Admin can set 5+ question types (MCQ, T/F, short-answer, matching, essay)
- [ ] Admin can configure correct answer per question
- [ ] Admin can preview the entire quiz flow before publishing
- [ ] Admin saves quiz; system generates unique quiz ID
- [ ] Admin can publish quiz (status = "published"); instructors see it within 5 seconds
- [ ] Admin receives confirmation with quiz link to share

Edge Cases & Behavior:
- If admin refreshes mid-creation, quiz draft is auto-saved (no data loss)
- If admin tries to publish without time limit, system shows validation error
- If question has no correct answer configured, publish is blocked
- Duplicate question detection prevents redundant content
- Admin can revert quiz from published → draft (archives quiz from instructor view)

Estimated Effort: L (Large: 10+ days including UI, validation, API)
Priority: P0 (MVP launch blocker)
```

### User Story 2: Instructor Schedules IELTS Simulation Event & Roster

```
AS AN instructor
I WANT to create a test event for IELTS simulation on specific date, add students, and track who shows up
SO THAT I can manage exam administrations and monitor attendance

Acceptance Criteria:
- [ ] Instructor clicks "Schedule Event" in dashboard
- [ ] Instructor selects quiz from list (shows only published quizzes)
- [ ] Instructor sets event date, start time, duration (overrides quiz time limit? → time limit wins)
- [ ] Instructor sets timezone (defaults to profile timezone, but can override)
- [ ] Instructor uploads student roster (CSV: email, name) or manually adds students one-by-one
- [ ] System shows "X students added" with success message
- [ ] Instructor sets event status (upcoming/active/closed); can only close after deadline
- [ ] Instructor sees live participant list with attempt status (not started/in progress/submitted/graded)
- [ ] System prevents scheduling events in the past (validation)
- [ ] Instructor can send bulk reminder to participants (scheduled 24h before start)

Edge Cases & Behavior:
- If student not in system, instructor can auto-provision account (email-based)
- If student already took quiz outside event, system prevents double-registration
- If instructor changes event time <1 hour before start, warning is shown
- System auto-closes event 24 hours after deadline

Estimated Effort: M (Medium: 5-7 days including CSV parsing, notifications)
Priority: P0 (core scheduling capability)
```

### User Story 3: Student Takes IELTS Simulation with Authentic Timing

```
AS A student
I WANT to take an IELTS simulation quiz with separate section timers and authentic UI
SO THAT I practice with real exam format and build confidence

Acceptance Criteria:
- [ ] Student sees quiz landing page with instructions & time estimate
- [ ] Student starts quiz; timer begins counting down (HH:MM:SS visible)
- [ ] Student sees questions in section order (Listening → Reading → Writing → Speaking placeholder)
- [ ] Each section has its own timer (e.g., Listening = 30 min, Reading = 60 min)
- [ ] Timer warns student at 5 minutes remaining (visual highlight)
- [ ] Timer warns student at 1 minute remaining (urgent visual + sound)
- [ ] Student can navigate within section (next/previous question)
- [ ] Student can jump to any question in current section (no section jumping allowed)
- [ ] Student can review answers within section before moving to next
- [ ] Answers are auto-saved every 30 seconds (network resilience)
- [ ] If network drops mid-quiz, student can resume (last save point restored)
- [ ] Submit button only appears at end of final section
- [ ] If time expires, system auto-submits all answers (with warning "30 seconds remaining")
- [ ] After submission, student sees score + section breakdown (Listening: 7.0, Reading: 8.5, etc.)
- [ ] Student cannot retake quiz if event locked or deadline passed

Edge Cases & Behavior:
- If student's session expires (JWT token), system asks to re-authenticate and resume quiz
- If student closes browser mid-quiz, quiz state is preserved; can resume from same position
- If student's device loses internet, local cache holds answers until sync resumes
- If question fails to load, system shows "Question unavailable" with retry button
- Section timer persists across question navigation (not reset per question)

Estimated Effort: L (Large: 10+ days for complex UI, auto-save, resume flow)
Priority: P0 (core user experience)
```

### User Story 4: Student Receives Instant Grades & Detailed Feedback

```
AS A student
I WANT to see my quiz score immediately after submission with detailed answer breakdowns
SO THAT I understand my performance and areas for improvement

Acceptance Criteria:
- [ ] Student submits quiz; system grades automatically (MCQ, T/F, short-answer)
- [ ] Within 2 seconds, student sees:
  - Overall score (e.g., "73/100")
  - Grade letter (A/B/C/D/F or Pass/Fail)
  - Time taken vs time available
  - For IELTS: Band score + section breakdown
- [ ] Student can click "View Answers" to see:
  - Question text
  - Student's answer
  - Correct answer (if applicable)
  - Whether marked correct/incorrect
  - For essay: "Marked by instructor" badge + instructor notes (if any)
- [ ] Student can print or download results as PDF
- [ ] Student sees timestamp: "Submitted on July 28, 2026 at 3:45 PM"
- [ ] If retakes allowed, student sees "Take Quiz Again" button

Edge Cases & Behavior:
- For essay questions, student sees "Pending instructor grading" (no auto-grade)
- If instructor later grades an essay, student gets notification
- Short answer grading shows partial credit (e.g., "1/2 points") with fuzzy matching explanation

Estimated Effort: M (Medium: 5-6 days for feedback UI + logic)
Priority: P0 (critical user feedback loop)
```

### User Story 5: Instructor Views Analytics & Identifies Struggling Students

```
AS AN instructor
I WANT to see class performance analytics: average score, student rankings, weak questions
SO THAT I can adapt teaching, re-teach difficult concepts, and personalize student support

Acceptance Criteria:
- [ ] Instructor opens Analytics Dashboard
- [ ] Dashboard shows:
  - Quiz-level stats (class avg: 72%, min: 45%, max: 98%, pass rate: 85%)
  - Student ranking (leaderboard: top 5, bottom 5)
  - Question-level analysis (which questions most missed?)
  - Time analysis (avg time per question, students running out of time?)
- [ ] Instructor can filter by:
  - Quiz (dropdown)
  - Date range (quiz taken between X and Y)
  - Student segment (All, Top 25%, Bottom 25%, etc.)
- [ ] Instructor can click on individual student name to see:
  - Quiz history (all attempts)
  - Trend graph (improving/declining over time?)
  - Detailed answer breakdown for this quiz
- [ ] Instructor can export data to CSV for further analysis (Excel, Google Sheets)
- [ ] Analytics update in real-time as students submit (no page refresh needed)

Edge Cases & Behavior:
- If no students have taken quiz yet, dashboard shows "No data available"
- Analytics exclude students marked as "deleted" or "inactive"
- Instructor cannot see other instructor's analytics (data isolation)

Estimated Effort: L (Large: 10+ days for charts, filtering, real-time updates)
Priority: P0 (drives instructor value & retention)
```

---

## 📐 FUNCTIONAL REQUIREMENTS (Detailed)

### Requirement F001: Authentication & Role-Based Access Control

**Description:** System must authenticate users securely (JWT) and enforce role-based permissions (Admin, Instructor, Student). All data access is row-level secured.

**Actors & Roles:**
- **Admin:** Can create quizzes, manage all users, view system analytics, delete content
- **Instructor:** Can schedule events, create/edit own quizzes, view student results, grade essays
- **Student:** Can only view assigned quizzes, take quizzes in events, view own results

**Inputs:**
- Registration: email (unique), password (8+ chars, uppercase+number+special), first name, last name, role
- Login: email, password
- Session tokens: JWT with 24h expiry

**Process (Registration):**
1. User submits registration form
2. System validates email format & uniqueness
3. System hashes password (bcrypt, 10 rounds)
4. System creates user record with role = "student" (default) or "instructor" (admin-assigned)
5. System generates JWT token (sub = user_id, role = role, exp = now + 24h)
6. System sends confirmation email (v1.1; skipped V1)

**Process (Login):**
1. User submits email + password
2. System queries user by email
3. System compares password hash (bcrypt verify)
4. If match: generate JWT token, return to frontend
5. If mismatch: return 401 Unauthorized

**Process (Authorization Check - every API call):**
1. Frontend sends request with Authorization header: `Bearer <JWT_token>`
2. Middleware verifies JWT signature & expiry
3. Middleware extracts user_id & role from JWT payload
4. Middleware attaches user context to request: `req.user = { id, role }`
5. Route handler checks `req.user.role` against allowed roles
6. If unauthorized: return 403 Forbidden
7. If authorized: proceed to route logic

**Process (Row-Level Security in Database):**
1. Database tables (quizzes, submissions, events) include `created_by_user_id` & `accessible_by_role` columns
2. PostgreSQL RLS policies enforce:
   - Student can only see quizzes in their assigned events
   - Instructor can only see quizzes they created or admin assigned
   - Admin can see all quizzes
3. Every database query filters by `WHERE created_by_user_id = current_user_id OR role = 'admin'`

**Outputs:**
- Registration: JWT token, user_id, role, message: "Account created successfully"
- Login: JWT token, user_id, role, redirect to dashboard
- Unauthorized: 401/403 error with message: "Unauthorized: insufficient permissions"

**API Endpoints:**
- `POST /auth/register` → { email, password, firstName, lastName } → JWT, user
- `POST /auth/login` → { email, password } → JWT, user
- `POST /auth/logout` → invalidate token (optional for stateless JWT)
- `GET /auth/me` → verify JWT, return current user

**Edge Cases & Behavior:**
| Scenario | Expected Behavior |
|----------|------------------|
| User registers with existing email | Reject: "Email already in use" |
| User registers with weak password | Reject: "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char" |
| User logs in with wrong password 5x | Account locked for 15 minutes (v1.1) |
| JWT token expired | 401 Unauthorized, frontend redirects to login |
| Admin tries to access student quiz | 403 Forbidden (data isolation) |
| Student tries to access quiz not in event | 404 Not Found (hidden from unauthorized users) |

**Testing Strategy:**
- Unit tests: hashing, JWT generation/verification (20+ tests)
- Integration tests: registration flow, login flow, RLS policies (15+ tests)
- Security tests: SQL injection prevention, password complexity, token expiry

---

### Requirement F002: Quiz Bank Management (CRUD)

**Description:** Admins and Instructors can create, read, update, delete quizzes. Quizzes are versioned and reusable across events.

**Inputs:**
- Quiz creation: title (string, 1-100 chars), description (0-500 chars), time_limit_minutes (integer, 5-180), passing_score_percent (integer, 0-100), difficulty (easy/medium/hard), subject_tags (array of strings)
- Metadata: created_by_user_id, status (draft/published), version_number, created_at, updated_at

**Process (Create Quiz):**
1. Instructor submits quiz form via UI
2. System validates all inputs (title not empty, time_limit > 0, etc.)
3. System creates quiz record in `quizzes` table with status = "draft"
4. System generates unique quiz_id (UUID)
5. System returns quiz_id + success message
6. Instructor can now add questions to this quiz

**Process (Edit Quiz):**
1. Instructor opens quiz in edit mode
2. Instructor modifies metadata (title, description, time_limit, passing_score)
3. Instructor clicks "Save"
4. System increments version_number (auto-versioning)
5. System updates `quizzes` table
6. System triggers audit log entry
7. System returns updated quiz object

**Process (Publish Quiz):**
1. Instructor clicks "Publish" button
2. System validates quiz has ≥1 question
3. System validates all questions have correct answers configured
4. System changes status = "published"
5. System locks quiz from accidental deletion
6. Instructors can now view this quiz in their available list

**Process (Delete Quiz):**
1. Instructor or Admin initiates delete
2. System checks if quiz is used in any events
3. If used in events: Soft delete (hide from list, but data remains for audit)
4. If not used: Hard delete (option for admins only)
5. System logs deletion for compliance

**Process (List & Search Quizzes):**
1. Instructor opens "Quiz Bank" page
2. System queries quizzes where `created_by_user_id = current_instructor` AND `status = 'published'`
3. System returns paginated results (10 per page) with:
   - Quiz title, description, time_limit, num_questions, difficulty, created_date
4. Instructor can filter/sort by:
   - Date created (newest first, oldest first)
   - Difficulty (easy, medium, hard)
   - Subject tags (multi-select)
   - Text search (title or description contains X)
5. System displays results + pagination controls

**Outputs:**
- Create: quiz_id, status: "draft", message: "Quiz created. Add questions next."
- Publish: status: "published", message: "Quiz published successfully"
- List: Array of quiz objects + total_count, page_number, has_more_pages
- Delete: message: "Quiz deleted" or "Quiz archived"

**Database Schema (overview):**
```sql
CREATE TABLE quizzes (
  quiz_id UUID PRIMARY KEY,
  created_by_user_id UUID NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 60,
  passing_score_percent INTEGER DEFAULT 50,
  status ENUM ('draft', 'published') DEFAULT 'draft',
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
);
```

**Edge Cases:**
| Scenario | Expected Behavior |
|----------|------------------|
| Instructor tries to edit published quiz | Allow (create new version or edit directly, track changes) |
| Instructor deletes quiz used in past event | Soft delete; past submissions retained for audit |
| Admin deletes instructor's quiz | Audit log records who deleted, when, why |
| Quiz with 0 questions | Cannot publish; UI shows "Add questions before publishing" |

---

### Requirement F003: Question Management

**Description:** Support multiple question types (MCQ, T/F, short-answer, matching, essay) with flexible grading rules.

**Question Types:**

| Type | Format | Grading | Example |
|------|--------|---------|---------|
| **Multiple Choice (MCQ)** | 1 question + 4-6 options + 1 correct | Auto-grade: exact match | "What is 2+2?" Options: A) 3, B) 4 ✓, C) 5 |
| **True/False** | Statement + True/False | Auto-grade: exact match | "Paris is the capital of France" → True ✓ |
| **Short Answer** | Open-ended text input | Auto-grade: string matching (case-insensitive, fuzzy) | "Name 3 colors" → expects keywords: red, blue, green |
| **Matching** | Left column + Right column, drag-to-match | Auto-grade: all pairs must be correct | Match countries to capitals |
| **Essay** | Long-form text area (500+ words) | Manual: instructor grade | "Discuss the causes of World War II" |

**Inputs (Create Question):**
- question_text (required, string)
- question_type (enum: mcq, truefalse, shortanswer, matching, essay)
- difficulty (easy, medium, hard)
- points_value (integer, 1-10)
- explanation (optional, string for correct answer explanation)
- correct_answer (varies by type):
  - MCQ: `{ option_letter: 'B' }`
  - T/F: `{ answer: true }`
  - Short answer: `{ keywords: ['keyword1', 'keyword2'], match_type: 'any' | 'all' }` (all = all keywords required)
  - Matching: `{ pairs: [{ left: 'France', right: 'Paris' }, ...] }`
  - Essay: `{ rubric: 'Free form text or JSON scoring rubric' }`

**Process (Create MCQ Question):**
1. Admin submits question form
2. System validates:
   - question_text not empty
   - At least 2 options provided
   - Exactly 1 option marked as correct
   - Correct option exists in options list
3. System creates question record with type = 'mcq'
4. System links question to quiz_id
5. System returns question_id + order_in_quiz

**Process (Auto-Grade MCQ):**
1. Student submits answer: `{ question_id, student_answer: 'B' }`
2. System queries question: SELECT correct_answer WHERE question_id = X
3. System compares: student_answer == correct_answer['option_letter']
4. If match: award full points; if no match: award 0 points
5. System logs: `{ question_id, student_answer, correct_answer, is_correct, points_awarded, timestamp }`

**Process (Auto-Grade Short Answer):**
1. Student submits answer: `{ question_id, student_answer: 'The capital of France is Paris' }`
2. System normalizes text (lowercase, trim whitespace, remove punctuation)
3. System checks if ALL keywords are present (or ANY, depending on `match_type`)
4. Keyword matching is fuzzy (Levenshtein distance < 2 characters tolerance)
5. If match: award points; if no match: 0 points
6. System logs answer for instructor review

**Process (Manual Essay Grading):**
1. Student submits essay
2. System stores submission WITHOUT auto-grade
3. Instructor receives notification: "Essay submitted, awaiting your grading"
4. Instructor opens submission and reads essay
5. Instructor assigns points (0 to max_points) + optional notes
6. System records grading: `{ graded_by_user_id, points, grader_notes, graded_at }`
7. Student receives notification with score + notes

**Outputs:**
- Create question: question_id, order_in_quiz, message: "Question added"
- Grade submission: is_correct (boolean), points_awarded, correct_answer (revealed after submit)

**Edge Cases:**
| Scenario | Expected Behavior |
|----------|------------------|
| Short answer: student types "paris" vs correct "Paris" | Fuzzy match succeeds (case-insensitive) |
| Short answer: student types "The capital is Paris" vs keyword "Paris" | Fuzzy match succeeds (keywords within text) |
| Essay: instructor submits grade, then tries to edit | Allow grade update; track audit log of all versions |
| Admin deletes question used in 10 student submissions | Soft delete; submissions retain answer data for audit |

---

### Requirement F004: Auto-Grading Engine

**Description:** Background service that grades all auto-gradable questions immediately after submission; supports manual grading for essays.

**Inputs:**
- Submission: `{ submission_id, student_id, quiz_id, answers: [{ question_id, answer }], submitted_at }`

**Process (Auto-Grade Submission):**
1. System receives submission
2. For each question_id in submission:
   a. Fetch question metadata (type, correct_answer, points_value)
   b. Fetch student's answer
   c. Call grade_{question_type}() function
   d. Receive is_correct + points_awarded
3. Sum total_points_awarded
4. Calculate score_percent = (total_points_awarded / total_possible_points) * 100
5. Determine pass/fail based on passing_score_percent threshold
6. Store grading result: `{ submission_id, total_points, score_percent, is_passed, graded_at }`
7. Trigger notification to student: "Your quiz has been graded! Score: 75%"

**Grading Functions:**

```javascript
// MCQ: exact match
gradeMultipleChoice(studentAnswer, correctAnswer) {
  return studentAnswer === correctAnswer.option_letter;
}

// T/F: exact match
gradeTrueFalse(studentAnswer, correctAnswer) {
  return studentAnswer === correctAnswer.answer;
}

// Short Answer: fuzzy keyword matching
gradeShortAnswer(studentAnswer, correctAnswer) {
  const normalizeText = (str) => str.toLowerCase().trim().replace(/[.,!?;:]/g, '');
  const normalized = normalizeText(studentAnswer);
  const keywords = correctAnswer.keywords.map(normalizeText);
  
  if (correctAnswer.match_type === 'all') {
    return keywords.every(kw => 
      normalized.includes(kw) || levenshteinDistance(kw, normalized) <= 2
    );
  } else { // 'any'
    return keywords.some(kw => 
      normalized.includes(kw) || levenshteinDistance(kw, normalized) <= 2
    );
  }
}

// Matching: all pairs correct
gradeMatching(studentAnswer, correctAnswer) {
  const correctPairs = correctAnswer.pairs;
  return studentAnswer.length === correctPairs.length &&
         studentAnswer.every(pair =>
           correctPairs.some(cp => cp.left === pair.left && cp.right === pair.right)
         );
}

// Essay: manual (no auto-grade)
gradeEssay(studentAnswer, correctAnswer) {
  return { is_correct: null, manual_grade_required: true };
}
```

**Outputs:**
- Grading result: `{ question_id, is_correct, points_awarded, feedback }`
- Submission summary: `{ submission_id, total_score, score_percent, is_passed, graded_details: [...] }`

**Performance Requirements:**
- Grade single submission: <500ms (even with 100 questions)
- Bulk grade 1000 submissions: <30 seconds (batch processing)

**Testing:**
- Unit test: each grading function with 20+ test cases (edge cases: empty answer, special chars, etc.)
- Integration test: end-to-end submission → grading → notification

---

### Requirement F005: Quiz Attempt & Submission

**Description:** Student-facing feature allowing quiz taking with timers, auto-save, and submit functionality.

**Inputs:**
- Quiz attempt initiation: student_id, quiz_id, event_id (optional)
- Answer submission: question_id, answer (varies by question type)

**Process (Start Quiz):**
1. Student clicks "Start Quiz" button on quiz details page
2. System verifies student is authorized (in event or standalone)
3. System checks if student has remaining attempts (if limited)
4. System creates attempt record: `{ attempt_id, student_id, quiz_id, started_at, status: 'in_progress' }`
5. System calculates end_time = started_at + time_limit_minutes
6. System initializes answer storage: `{ attempt_id, answers: [] }`
7. Frontend displays quiz UI with timer

**Process (Quiz UI - Rendering Questions):**
1. Frontend fetches questions for quiz_id: `GET /quizzes/{quiz_id}/questions`
2. Backend returns: `{ questions: [{ question_id, question_text, type, options (for MCQ) }] }`
3. Frontend renders questions one-by-one or all (depending on quiz settings)
4. Frontend displays timer: countdown in MM:SS format, updates every 1 second

**Process (Auto-Save Answers):**
1. Student clicks option/types answer
2. Frontend stores answer in local state
3. Every 30 seconds, frontend sends: `POST /attempts/{attempt_id}/answers` with all current answers
4. Backend stores: `{ attempt_id, question_id, answer, last_saved_at }`
5. If save fails (network error), frontend queues and retries on next interval
6. Frontend shows quiet indicator "Saved at 3:45 PM" (no annoying popup)

**Process (Review Answers - Before Submit):**
1. Student clicks "Review" or "Summary" tab
2. Frontend shows all questions with student's answers filled in
3. Student can see which questions they answered and which they skipped
4. Student can click on any question to go back and edit answer
5. Edited answers are auto-saved per usual

**Process (Submit Quiz):**
1. Student clicks "Submit Quiz" button
2. System shows confirmation: "Are you sure? You cannot retake this quiz after submission."
3. Student confirms
4. Frontend sends: `POST /attempts/{attempt_id}/submit` with final answers
5. Backend:
   a. Validates submission is within time window (end_time >= now)
   b. Marks attempt: status = 'submitted', submitted_at = now
   c. Calls auto-grading engine (Requirement F004)
   d. Updates attempt: total_score, score_percent, is_passed
   e. Returns grading result to frontend
6. Frontend displays results page immediately (see Requirement F008)

**Process (Auto-Submit on Time Expiry):**
1. Frontend timer reaches 00:00
2. Frontend shows warning: "Time is up! Your quiz will be submitted automatically."
3. Frontend waits 5 seconds
4. Frontend sends submit request automatically
5. Backend processes submission as normal

**Process (Resume Incomplete Quiz):**
1. Student re-enters quiz event page after exiting
2. System checks: does student have in_progress attempt?
3. If yes, show "Resume Quiz" button (instead of "Start Quiz")
4. Student clicks "Resume"
5. Frontend calculates time remaining: end_time - now
6. Frontend fetches student's saved answers: `GET /attempts/{attempt_id}/answers`
7. Frontend restores UI state (scroll to where they left off, show saved answers)
8. Timer continues counting down from remaining time

**Outputs:**
- Start: attempt_id, end_time, quiz_id, questions (full question data)
- Save: status: "ok", last_saved_at, unsaved_changes: false
- Submit: grade result (see F004), message: "Quiz submitted successfully!", redirect to results page
- Resume: attempt data, remaining time, saved answers, questions

**Edge Cases:**
| Scenario | Expected Behavior |
|----------|------------------|
| Student's internet drops mid-quiz | Answers auto-saved until internet returns; can resume |
| Student closes browser mid-quiz | Attempt remains in_progress; can resume from same spot |
| Student tries to re-enter quiz after deadline | System shows "Quiz deadline passed" + link to view results |
| Student tries to take quiz twice in same event | Prevent: "You have already submitted this quiz" |
| Timer expires while student still typing | Auto-submit triggers; last-saved answers graded |

**Database Schema (overview):**
```sql
CREATE TABLE attempts (
  attempt_id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  event_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  total_score DECIMAL(5,2),
  score_percent DECIMAL(5,2),
  is_passed BOOLEAN,
  status ENUM ('in_progress', 'submitted', 'graded') DEFAULT 'in_progress',
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE answers (
  answer_id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,
  student_answer TEXT,
  is_correct BOOLEAN,
  points_awarded DECIMAL(5,2),
  last_saved_at TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(attempt_id),
  FOREIGN KEY (question_id) REFERENCES questions(question_id)
);
```

---

### Requirement F006: IELTS Simulation Mode

**Description:** Special quiz layout for standardized testing with section-based structure, separate timers, and band score calculation.

**IELTS Structure:**
- **Listening:** 30 minutes → 40 questions → 9 band scale (0-9)
- **Reading:** 60 minutes → 40 questions → 9 band scale
- **Writing:** 60 minutes → 2 tasks (Task 1: 20 min, Task 2: 40 min) → 9 band scale
- **Speaking:** 11-14 minutes → 3 parts → 9 band scale (not fully simulated in V1; placeholder UI)

**Inputs:**
- Quiz with `is_ielts_simulation = true` flag
- Questions organized into sections with section_id, section_name (Listening, Reading, etc.), section_duration_minutes

**Process (Start IELTS Simulation):**
1. Student starts quiz with `is_ielts_simulation = true`
2. System creates attempt as normal (Requirement F005)
3. Frontend loads IELTS-specific UI:
   - Section navigation bar (Listening | Reading | Writing | Speaking)
   - Section-specific timer (e.g., 30:00 for Listening)
   - Question counter (e.g., "Question 5 of 40")
   - Section progress bar
4. Student starts with Listening section; other sections locked

**Process (Answer Questions in Section):**
1. Student answers questions within current section
2. Timer counts down specific to that section
3. Student can navigate next/previous within section (no section jumping)
4. Auto-save occurs every 30 seconds (same as regular quiz)
5. When section timer expires:
   a. System auto-moves to next section
   b. Previous section is locked (no going back)
   c. New section timer starts

**Process (View Section-Level Scores):**
1. After submission (all sections answered):
   a. System grades all sections
   b. For each section: calculate band score (0-9) based on correct_count / total_questions * 9
   c. Average band scores across sections for overall IELTS band
2. Results page shows:
   - Overall Band: 6.5 (e.g.)
   - Section Breakdown:
     - Listening: 7.0 (28/40 correct)
     - Reading: 6.0 (24/40 correct)
     - Writing: 6.5 (essay graded by instructor)
     - Speaking: TBD (instructor grades)

**Process (IELTS Band Scoring Calculation):**
```javascript
calculateIELTSBand(correct_count, total_questions) {
  // Academic scale (9-band)
  const percentage = (correct_count / total_questions) * 100;
  
  if (percentage >= 88) return 9;
  if (percentage >= 83) return 8.5;
  if (percentage >= 78) return 8;
  if (percentage >= 72) return 7.5;
  if (percentage >= 67) return 7;
  if (percentage >= 61) return 6.5;
  if (percentage >= 55) return 6;
  if (percentage >= 49) return 5.5;
  if (percentage >= 43) return 5;
  if (percentage >= 37) return 4.5;
  return 4;
}
```

**Outputs:**
- Results: `{ overall_band: 6.5, section_scores: { listening: 7, reading: 6, writing: 6.5, speaking: null }, detailed_breakdown: [...] }`
- UI: Clear section-based results page with visual band indicators

**Edge Cases:**
| Scenario | Expected Behavior |
|----------|------------------|
| Student finishes Listening early | Cannot proceed to Reading until timer expires (prevents time advantage) |
| Student's session expires mid-Reading | Can resume from same section (not restart from Listening) |
| Writing section has 2 tasks with different timers | Timer tracks overall Writing time; student can allocate as needed |
| Speaking section has no auto-grading questions (all essays) | Show "Pending instructor grading" for Speaking band |

---

### Requirement F007: Testing Session/Event Management

**Description:** Admins and Instructors can schedule quiz events with participant rosters, manage attendance, and track completion.

**Inputs (Create Event):**
- quiz_id (required)
- event_name (string, optional; defaults to quiz title + date)
- scheduled_start_datetime (required)
- event_duration_minutes (optional; defaults to quiz time_limit)
- timezone (required; e.g., "Asia/Jakarta")
- participant_list (array of student_ids or email addresses)
- status (draft/scheduled/in_progress/completed)

**Process (Schedule Event):**
1. Instructor submits event form
2. System validates:
   - scheduled_start >= now (no past events)
   - quiz_id exists and is published
   - At least 1 participant added
   - Timezone is valid
3. System creates event record: `{ event_id, quiz_id, created_by_user_id, scheduled_start_datetime, timezone, status: 'draft' }`
4. System provisions student accounts (if needed): email → auto-create user with temporary password
5. System adds entries to event_participants: `{ event_id, student_id, invitation_status: 'invited', accepted_at: null }`
6. System schedules notifications:
   - 24h before: reminder to participants
   - At start_time: auto-transition status to 'in_progress'
   - 1h after: auto-transition status to 'completed' (or manually by instructor)
7. Return event_id + confirmation

**Process (Add Students to Event):**
1. Instructor clicks "Add Participants" on existing event
2. Instructor uploads CSV (email, first_name, last_name) or enters emails manually
3. System validates emails
4. For each email:
   a. Check if user exists in system
   b. If exists: add to event_participants
   c. If not exists: auto-create user with temp password, send invite email
5. System sends notification: "You're invited to quiz X on [date] at [time]"
6. Return list of added participants + count

**Process (Student Accepts/Joins Event):**
1. Student receives notification or sees event in "Upcoming Quizzes" dashboard
2. Student clicks "Accept" or "Start Quiz"
3. System records: accepted_at = now, status = 'joined'
4. Student can now take quiz (Requirement F005)

**Process (Track Event Progress):**
1. Instructor opens event details page
2. Instructor sees participant table:
   - Student name, email, acceptance status (invited/joined/submitted/graded)
   - Attempt status (not started, in progress, submitted, graded)
   - Score (if graded)
   - Submission time
3. Instructor can click on student name to see detailed results
4. System provides live update (no page refresh) as students submit

**Process (Close/Complete Event):**
1. Scheduled end time arrives (or instructor manually closes)
2. System transitions status: 'in_progress' → 'completed'
3. System locks event: no new quiz attempts can be started
4. Instructor can still grade outstanding essays

**Outputs:**
- Create event: event_id, status: "draft", message: "Event created. Add participants next."
- Add participants: count_added, count_failed, failed_list (with reasons)
- Get event details: event object + participant list + attempt statuses
- Close event: message: "Event closed. All submissions received."

**Database Schema (overview):**
```sql
CREATE TABLE events (
  event_id UUID PRIMARY KEY,
  quiz_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  event_name VARCHAR(255),
  scheduled_start_datetime TIMESTAMP NOT NULL,
  scheduled_end_datetime TIMESTAMP,
  timezone VARCHAR(50) DEFAULT 'UTC',
  status ENUM ('draft', 'scheduled', 'in_progress', 'completed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE event_participants (
  participant_id UUID PRIMARY KEY,
  event_id UUID NOT NULL,
  student_id UUID NOT NULL,
  invitation_status ENUM ('invited', 'joined', 'declined') DEFAULT 'invited',
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(event_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);
```

---

### Requirement F008: Student Results & Feedback

**Description:** Immediate display of graded results with detailed answer breakdown and performance analytics.

**Inputs:**
- Grading result from Requirement F004 (grades already computed)
- Submission data: answers + question details

**Process (Display Results):**
1. After submission is graded (F005), system renders results page
2. Page shows:
   - **Header:** Quiz title, date taken, time spent, overall score (e.g., "73/100" or "7.2 out of 9 band")
   - **Summary Stats:**
     - Overall score percent: 73%
     - Grade letter: C or "Pass" / "Fail"
     - Time taken vs time available: "Completed in 45 min of 60 min allowed"
     - Accuracy: "Answered 36 of 50 correctly" (can skip counting essays)
   - **Section Breakdown (if IELTS):** Table with Listening/Reading/Writing/Speaking bands

3. Page includes tabs:
   - **"View Answers":** Detailed answer-by-answer breakdown
   - **"Performance":** Graph of score trends (if multiple attempts)
   - **"Feedback":** Instructor notes + essay grades (if applicable)

**Process (Detailed Answer Breakdown):**
1. Student clicks "View Answers" tab
2. System renders table with columns:
   | Question # | Question Text | Your Answer | Correct Answer | Result |
   | - | - | - | - | - |
   | 1 | What is 2+2? | 4 | 4 | ✓ Correct |
   | 2 | True or False: Paris is in France | True | True | ✓ Correct |
   | 3 | Name 3 colors | Red, blue | Red, blue, green | ⚠ Partial (2/3) |
   | 4 | Explain photosynthesis | [essay text] | [instructor notes] | ⏳ Pending grading |

3. For each question, student can click to expand:
   - Full question text
   - Explanation (if provided by quiz creator)
   - Instructor notes (if graded)

**Process (Export Results):**
1. Student clicks "Download Results" or "Print"
2. System generates PDF or sends email with results
3. PDF includes: quiz title, student name, date, all scores, answer breakdown

**Outputs:**
- Results page: quiz result object + grading details + student performance metrics
- Answer breakdown: array of answers with correct_answer + is_correct + points_awarded + explanation
- PDF export: printable format with branding

**Edge Cases:**
| Scenario | Expected Behavior |
|----------|------------------|
| Essay question: no grade yet | Show "Pending instructor grading" with indicator |
| Quiz with partial credit (some questions worth 2 pts, some 1 pt) | Show both raw score (e.g., 27/30) and percent (90%) |
| Student retakes quiz: show both attempts | Display "Attempt 1: 65%, Attempt 2: 78%" with trend |
| Quiz has question explanation | Show explanation after student views correct answer |

---

### Requirement F009: Instructor Analytics Dashboard

**Description:** Instructors view class-wide performance data, identify struggling students, and track trends over time.

**Inputs:**
- Filter parameters: quiz_id, date_range, student_segment (all, top 25%, bottom 25%, etc.)

**Process (Load Analytics Dashboard):**
1. Instructor opens /dashboard/analytics
2. System calculates metrics (may take 1-2 seconds for large classes):
   - **Quiz-Level Stats:**
     - Class average score: 72%
     - Min/max scores: 45% / 98%
     - Pass rate: 85% (students scoring >= passing_score)
     - Median score: 74%
     - Standard deviation: 12%
   - **Question-Level Stats (which questions were hardest):**
     - Question 1: 95% correct (easiest)
     - Question 2: 72% correct
     - Question 3: 45% correct (hardest)
   - **Student Ranking:**
     - Top 5: [names + scores]
     - Bottom 5: [names + scores]
   - **Time Analysis:**
     - Avg time per question: 2.3 min
     - Students running over time: 15% (rushed?)
     - Students finishing early: 30% (skipping?)

3. Page displays as **interactive charts:**
   - Score distribution (histogram)
   - Student ranking (bar chart)
   - Question difficulty (sorted hardest → easiest)
   - Time spent vs score (scatter plot)

**Process (Student-Level Drill-Down):**
1. Instructor clicks on student name in ranking list
2. System shows student-specific view:
   - Quiz attempt history (all attempts for this student)
   - Score trend over time (line graph)
   - This quiz detailed answer breakdown:
     - Questions answered correctly/incorrectly
     - Time spent per section
   - Comparison: "This student scored 65%, class average is 72% (below class)"

**Process (Filter & Segment):**
1. Instructor selects filters:
   - Quiz dropdown (which quiz to analyze)
   - Date range picker (quizzes taken between X and Y)
   - Student segment: "Bottom 25%" or "Top 25%" or "All"
2. System re-calculates metrics for filtered subset
3. Charts update in real-time (or show loading spinner)

**Process (Export Data):**
1. Instructor clicks "Export to CSV"
2. System generates CSV with:
   - Student name, email, score, time spent, correct_count, status
   - One row per student attempt
3. File downloads; instructor can import to Google Sheets, Excel, etc.

**Outputs:**
- Dashboard data: aggregated stats, student rankings, question difficulty metrics, charts
- Student drill-down: attempt history, score trend, answer breakdown
- CSV export: student performance data

**Database Query Strategy:**
- Pre-compute aggregations (V1: real-time; V1.1: caching layer with 5-min refresh)
- Use PostgreSQL aggregate functions: AVG(), MIN(), MAX(), STDDEV()
- Sample query:
```sql
SELECT 
  quiz_id,
  COUNT(DISTINCT student_id) as student_count,
  AVG(score_percent) as avg_score,
  MIN(score_percent) as min_score,
  MAX(score_percent) as max_score,
  STDDEV(score_percent) as stddev_score
FROM attempts
WHERE quiz_id = $1 AND status = 'graded'
GROUP BY quiz_id;
```

---

### Requirement F010: Admin Dashboard

**Description:** Admins manage system-wide content, users, and monitor health.

**Sections:**

1. **User Management:**
   - View all users (table: name, email, role, created_date, status)
   - Create user (admin-assigned role)
   - Edit user (change role, deactivate account)
   - Reset password (send reset link via email in v1.1)
   - Bulk operations (export users, deactivate multiple)

2. **Content Management:**
   - View all quizzes (table: title, creator, created_date, num_questions, status, usage_count)
   - Search/filter quizzes (by creator, status, subject)
   - Delete quiz (soft delete for audit trail)
   - View question bank (all questions across all quizzes)
   - Bulk operations (export questions, delete multiple)

3. **System Health:**
   - Database status (connected? response time?)
   - API uptime (last 24h, 7d, 30d)
   - Error logs (recent errors, error rate)
   - User count (total, active last 7d, new this week)
   - Quiz activity (quizzes taken today, this week)

4. **Audit Trail:**
   - Log of all major actions: user creation, quiz deletion, grades changed, etc.
   - Filter by action type, date range, actor (which user did it)

---

### Requirement F011: Learning Progress Tracking

**Description:** Students & instructors see progress trends over time and cohort comparisons.

**Inputs:**
- Student_id, date_range (optional)

**Process (Student View Progress):**
1. Student opens /dashboard/progress
2. System shows:
   - **Trend Graph:** Score over time (line chart of all quiz attempts)
   - **Quizzes Completed:** Count (e.g., "You've completed 8 quizzes this month")
   - **Average Score:** Across all quizzes (e.g., "Your average: 74%")
   - **Improvement:** "Your score improved by 8% since last month"
   - **Cohort Comparison:** "You're in the top 30% of your class"
   - **Goals (optional):** Target score, quizzes to complete this week

**Process (Instructor View Cohort Progress):**
1. Instructor opens /dashboard/progress-cohort
2. System shows:
   - **Overall Class Trend:** Average class score over time (line chart)
   - **Student Progress Matrix:** Table of students with:
     - Total quizzes completed
     - Average score
     - Trend (↑ improving, ↓ declining, → stable)
     - Last quiz date
   - **Identify At-Risk Students:** Flag students with <50% average or declining trend
   - **Top Performers:** List of top 5 improving students

---

### Requirement F012: Real-Time Notifications

**Description:** Push notifications (in-app) for quiz availability, results, and event reminders.

**Notification Types:**

| Event | Trigger | Message |
|-------|---------|---------|
| Quiz Available | Instructor schedules event | "Quiz 'English Midterm' is now available. Event starts [date/time]" |
| Quiz Starting Soon | 1 hour before event start | "Reminder: 'English Midterm' starts in 1 hour" |
| Results Ready | After auto-grading completes | "Your quiz has been graded! Score: 75%. View results" |
| Essay Graded | Instructor grades essay | "Your essay submission has been graded by [Instructor Name]. Score: 8/10. Feedback: ..." |
| Event Reminder | 24 hours before event | "Don't forget! 'English Midterm' is tomorrow at 2:00 PM" |

**Process (Send Notification):**
1. Trigger event occurs (e.g., instructor publishes event)
2. System determines recipient (all participants in event)
3. System creates notification record: `{ notification_id, user_id, type, message, created_at, read_at: null }`
4. System pushes to frontend (WebSocket or polling fallback)
5. Frontend displays in-app toast/banner: "Quiz available: English Midterm"
6. Student can click notification to navigate to quiz page

**Notification Storage & Retrieval:**
- In-app notifications: stored in `notifications` table (user_id, message, read_at)
- Email notifications: queued for future implementation (v1.1)
- SMS notifications: queued for future implementation (v2.0)

**Outputs:**
- Notification record created in database
- Real-time push to connected user (via WebSocket or HTTP polling)
- Dashboard badge: "3 unread notifications" (dot next to notification icon)

---

## ⚙️ NON-FUNCTIONAL REQUIREMENTS (NFR)

### Performance

**API Response Times:**
- GET endpoints (quiz list, student results): <200ms p95
- POST endpoints (submit quiz, create question): <500ms p95
- Analytics queries (dashboard stats): <1000ms p95
- Bulk operations (grade 1000 submissions): <30s total

**Frontend Performance:**
- Page load (quiz listing page): <2s (First Contentful Paint)
- Interactive (quiz page): <3s (Time to Interactive)
- JavaScript bundle size: <500KB (gzipped)
- CSS bundle size: <100KB (gzipped)

**Database Performance:**
- Single query execution: <100ms
- Complex aggregation (analytics): <2s
- Connection pool: 20 connections (adjust for scale)

**Scalability Targets:**
- Concurrent users: 50 simultaneous quiz-takers (V1 acceptable)
- Total users: 1000 (grow to 10k in V1.1)
- Quizzes: 100 (grow to 1000 in V1.1)
- Questions: 10,000 (grow to 100k in V1.1)

### Security

**Authentication:**
- JWT tokens: 24-hour expiry (refresh token in V1.1)
- Password hashing: bcrypt with 10 rounds minimum
- Login rate limiting: max 5 attempts per 15 minutes per IP
- Session invalidation on logout (optional for stateless JWT)

**Authorization:**
- Role-based access control (RBAC): Admin, Instructor, Student
- Row-level security (RLS) in database: users only see their own data
- Endpoint-level authorization: middleware checks req.user.role before processing

**Data Protection:**
- Database: PostgreSQL with encrypted passwords + RLS policies
- Transit: HTTPS only (enforced by Vercel)
- Secrets: environment variables (API keys, JWT secrets)
- Input validation: whitelist validation, sanitize all user inputs
- SQL injection prevention: parameterized queries (no string concatenation)

**Audit & Compliance:**
- Audit log: record all significant actions (create/delete/grade operations)
- Data retention: delete old submissions after 1 year (GDPR-friendly)
- GDPR compliance: user can request data export, right to deletion

### Reliability & Availability

**Uptime Target:**
- 99.5% uptime SLA (acceptable for free tier; no guarantee)
- Graceful degradation: if analytics fails, quiz still works

**Backups:**
- Automated daily backups (Supabase handles)
- Point-in-time recovery: 7-day backup retention (default)
- Test restore monthly

**Disaster Recovery:**
- RTO (Recovery Time Objective): 1 hour (manual intervention for free tier)
- RPO (Recovery Point Objective): 24 hours (daily backups)

**Error Handling:**
- All API errors return JSON: `{ error: "message", code: "ERROR_CODE" }`
- Frontend displays user-friendly error messages (not raw exceptions)
- Server logs all errors for debugging (use Vercel logs)
- Critical errors trigger admin email alert (v1.1)

### Scalability

**Horizontal Scaling:**
- Stateless API (no server-side sessions): easy to scale to multiple servers
- Database: single PostgreSQL instance (V1); read replicas in V1.1

**Database Optimization:**
- Indexing: composite indexes on frequent queries (quiz_id + status, student_id + attempted_at)
- Query optimization: avoid N+1 queries, use JOIN for relationships
- Data partitioning: not needed for V1 scale

**Caching Strategy:**
- Quiz content: cache in React Query (client-side, 5-min TTL)
- User sessions: cache JWT in frontend localStorage
- Static assets: CDN via Vercel
- Database query results: consider Redis in V1.1 for analytics

### Usability

**Responsive Design:**
- Mobile (375px - 767px): Single-column layout, large touch targets (44px minimum)
- Tablet (768px - 1023px): Two-column layout (sidebar + content)
- Desktop (1024px+): Three-column layout (sidebar + main + details)

**Accessibility (WCAG 2.1 Level A):**
- Color contrast: 4.5:1 for text (AA standard)
- Focus indicators: always visible, not removed
- Form labels: associated with inputs (<label htmlFor="...">, not placeholder-only)
- Alt text: on images (none in V1, but prepared for future)
- Keyboard navigation: tab through all interactive elements, Enter to submit
- Screen reader support: semantic HTML (<button>, <nav>, <main>, not <div role="button">)
- Quiz timer: accessible to screen readers (aria-live updates)

**User Testing:**
- Conduct with 5+ users covering roles: admin, instructor, student
- Test core flows: register → create quiz → schedule event → take quiz → view results
- Acceptance: 80%+ task completion on first attempt (no instructions)
- Feedback collection: NASA TLX survey (mental workload score <50)

---

## 🔗 INTEGRATION & DEPENDENCIES

### External Services

| Service | Purpose | Provider | Criticality | Cost |
|---------|---------|----------|------------|------|
| **Supabase PostgreSQL** | Primary database, auth, realtime | Supabase | Critical | Free (1GB storage) |
| **Supabase Auth** | User authentication via JWT | Supabase | Critical | Free (50k users/month) |
| **Supabase Realtime** | WebSocket for live notifications | Supabase | Important | Free (within limits) |
| **Vercel** | Frontend deployment (React app) | Vercel | Critical | Free (Pro features optional) |
| **GitHub** | Source code version control, CI/CD | GitHub | Critical | Free |
| **SendGrid** | Email notifications (future) | SendGrid | Important | Free (100 emails/day) |
| **Sentry** | Error tracking & monitoring (future) | Sentry | Optional | Free (basic tier) |

### Internal Dependencies

- None (solo developer, no internal APIs to depend on)

### Technology Constraints

**Language & Runtime:**
- Backend: JavaScript/TypeScript, Node.js v18+ (LTS)
- Frontend: JavaScript/TypeScript, React 18+, browser ES2020+
- No Python, Java, C#, or other languages

**Framework & Libraries:**
- Backend: Express.js or Fastify (lightweight, REST API focus)
- Frontend: React 18 with hooks, Context API or Redux for state
- Testing: Jest + Supertest (backend), Jest + React Testing Library (frontend)
- Database: PostgreSQL via Supabase (no NoSQL)

**Authentication:**
- Method: JWT tokens (no OAuth v1, no SAML in V1)
- Storage: localStorage (frontend), bearer token in Authorization header
- Expiry: 24 hours (refresh token in V1.1)

**Deployment:**
- Frontend: Vercel (automatic deployments from GitHub)
- Backend: Vercel serverless functions OR self-hosted Node.js server
- Database: Supabase cloud (free tier)
- Domain: Custom domain (optional; free vercel.app domain works)

---

## ⚠️ ASSUMPTIONS & CONSTRAINTS

### Assumptions

- Users have stable internet connection (not designed for offline mode in V1)
- Students are honest (no cheating prevention/proctoring in V1, add in v2.0)
- Instructors manually review essay answers (no AI grading in V1)
- Quizzes are for internal institutional use (GDPR compliance is responsibility of data controller)
- Students have valid email addresses (for notifications)
- Timezone data is accurate (system admin responsibility to configure)
- Quiz creators don't need version control (overwrite in place; audit log tracks changes)

### Constraints

**Timeline:**
- Target: 6-8 weeks for MVP (solo developer, 40 hours/week)
- Weeks 1-2: Backend setup (auth, db schema, core API)
- Weeks 2-3: Quiz CRUD + auto-grading engine (backend complete)
- Weeks 3-4: Event management, submission flow
- Weeks 4-5: Frontend UI for all modules (60+ components)
- Weeks 5-6: IELTS simulation, analytics dashboard, testing
- Weeks 6-8: Bug fixes, polish, deployment, documentation

**Budget:**
- Free tier only (Supabase free, Vercel free, GitHub free)
- No paid APIs (SendGrid free tier for testing)
- Cost: $0/month until scale demands paid tier

**Technical:**
- No mobile app: responsive web design sufficient
- No real-time WebSocket for V1 (use polling + Supabase realtime fallback)
- No video/audio: text & images only
- No AI-powered grading: manual instructor review for essays
- No social features: no peer collaboration, forums, comments
- Single-tenancy: not multi-tenant SaaS in V1 (add in v2.0)

**Resource:**
- Solo developer: Aulia (1 person)
- Availability: 40 hours/week (firm constraint)
- No QA team: developer is responsible for all testing

**Infrastructure:**
- Single PostgreSQL instance (no clustering)
- Single Vercel deployment region (free tier default)
- Designed for <100 concurrent users (scale post-launch)

---

## 🚨 RISKS & MITIGATION

| Risk | Likelihood | Impact | Severity | Mitigation |
|------|------------|--------|----------|-----------|
| **Supabase free tier rate limits exceeded** | Low | High | 🟡 | Monitor usage weekly; implement caching; upgrade to paid if needed |
| **Auto-grading logic has bugs (scores incorrect)** | Medium | Critical | 🔴 | Comprehensive unit tests (50+ cases); spot-check 10 random submissions; manual review option |
| **Student loses answers mid-quiz (network fail)** | Low | High | 🟡 | Auto-save every 30s; implement resume functionality; test with offline simulation |
| **Regex for short-answer grading is too strict** | Medium | High | 🟡 | Use simple string matching V1; defer complex matching to v1.1; fuzzy matching with Levenshtein |
| **Database migration fails (data loss)** | Low | Critical | 🔴 | Test migrations locally first; backup before prod; versioned migrations with rollback |
| **Real-time notifications don't work (WebSocket fails)** | Medium | Medium | 🟠 | Fallback to polling (every 5s); add error logging; graceful degradation (notify on page load) |
| **Performance degrades with 1000 questions in quiz** | Low | Medium | 🟠 | Load test with large dataset; pagination in quiz editor; lazy-load questions |
| **Unauthorized access (student sees another's submission)** | Medium | Critical | 🔴 | Unit tests for RLS; manual security audit; row-level security in database; test with multiple users |
| **Quiz accidentally deleted (no undo)** | Low | Medium | 🟠 | Soft delete implementation; admin recovery tool in v1.1; audit trail logs all deletions |
| **Timeline overrun (more than 8 weeks)** | Medium | High | 🟡 | Strict scope lock (no new features); weekly progress tracking; cut P1 features if behind |
| **Forgot password flow breaks (students locked out)** | Low | Medium | 🟠 | Implement password reset email (v1.1); manual reset via admin dashboard |
| **Export to CSV generates invalid file** | Low | Low | 🟢 | Test CSV generation with Excel, Google Sheets; validate CSV format |

**Risk Response Strategy:**
- High-risk items: plan mitigation before development starts
- Medium-risk items: have fallback plan, monitor during development
- Low-risk items: monitor, respond if they occur

---

## 📚 DOCUMENT REFERENCES

Link to related documents (to be created in pipeline order):

- **Logic Flow:** [LOGIC_FLOW.md] *(create immediately after PRD)*
- **Wireframes/Halaman:** [HALAMAN.md] *(create after logic flow)*
- **Database Schema:** [DATABASE_SCHEMA.md] *(create now, based on this PRD)*
- **Visual Design:** [DESIGN.md] *(design system, colors, typography)*
- **High-Fidelity Prototypes:** [DESIGN_MOBILE.md] / [DESIGN_WEB.md] *(Figma optional for solo)*
- **Technical Design Document:** [TDD.md] *(create after DB schema)*
- **API Contract:** [API_CONTRACT.md] *(REST API spec, detailed endpoints)*
- **Test Plan:** [TEST_PLAN.md] *(unit, integration, E2E tests)*
- **Security Specification:** [SECURITY_SPEC.md] *(authentication, data protection)*
- **Disaster Recovery Plan:** [DRP.md] *(backup, restore, worst-case scenarios)*
- **Deployment Runbook:** [DEPLOYMENT.md] *(setup, environment variables, CI/CD)*
- **System Test Plan:** [STP.md] *(load testing, uptime, compliance)*
- **Product Roadmap:** [ROADMAP.md] *(v1.1, v2.0 features, timeline)*

---

## 📊 ACCEPTANCE & SIGN-OFF

| Role | Name | Date | Status | Notes |
|------|------|------|--------|-------|
| Product Manager | Aulia | 2026-07-28 | ✅ Approved | PRD locked for development start |
| Lead Engineer | Aulia | 2026-07-28 | ✅ Approved | Scope realistic for 6-8 week timeline |

**Approval Checklist:**
- ✅ All P0 features defined (F001-F012)
- ✅ Non-functional requirements documented (performance, security, scalability)
- ✅ Risks identified + mitigation strategies
- ✅ Success metrics are measurable
- ✅ Tech stack confirmed (Node + React + PostgreSQL)
- ✅ Timeline constraints acknowledged (6-8 weeks)
- ✅ Scope locked: no features beyond F001-F012 without schedule extension

**Sign-off Notes:**
- **Scope:** Finalized all MVP features (F001-F012); v1.1 features deferred
- **Timeline:** 6-8 weeks aggressive but realistic for solo dev with focused execution
- **Deployment:** Live demo on Vercel + Supabase free tier on day 1
- **Portfolio Quality:** PRD + code + architecture will demonstrate production engineering skills
- **Next Steps:** Proceed to LOGIC_FLOW.md immediately; unblock DATABASE_SCHEMA.md design

---

## 📝 APPENDIX: GLOSSARY

| Term | Definition | Example |
|------|-----------|---------|
| **Auto-Grading** | Automatic scoring of objective questions (MCQ, T/F, short-answer) without human intervention | Student submits MCQ answer; system immediately grades and shows score |
| **IELTS** | International English Language Testing System; standardized English proficiency exam with 4 sections (Listening, Reading, Writing, Speaking) and 9-band scale | EduFlow's IELTS simulation mode mimics official timing and structure |
| **JWT Token** | JSON Web Token; cryptographic token containing user info (user_id, role, expiry) for stateless authentication | Issued on login; sent in Authorization header on every request |
| **RBAC** | Role-Based Access Control; permission model where users have roles (Admin, Instructor, Student) with different access levels | Admin can delete any quiz; Instructor can only delete own quizzes; Student can't delete |
| **Submission** | Student's completed quiz attempt containing all answers and computed score | One submission per student per quiz (or multiple if retakes allowed) |
| **Event** | Scheduled quiz testing session with specific date, time, participant list, and duration | "English Midterm, July 28 2026 at 2:00 PM, 60 minutes, 25 students invited" |
| **Edge Case** | Unusual input or scenario that may cause unexpected behavior if not handled | Student closes browser during quiz, timezone change during event, etc. |
| **P0 / P1** | Priority 0 (must-have for MVP) / Priority 1 (important, can follow shortly after MVP) | F001-F012 are P0; F013-F019 are P1 |
| **Soft Delete** | Mark record as deleted in database (keeps data for audit, hides from users) | Deleted quiz still exists in DB; only hidden from instructor list |
| **Hard Delete** | Permanently remove record from database (no recovery) | Admin option to purge deleted quizzes after retention period |
| **Async** | Asynchronous processing; operation doesn't block user interaction | Auto-save happens in background while student still types |
| **Idempotent** | Operation that produces same result if repeated multiple times; safe to retry | Submit quiz twice = submitted once (idempotent); buy subscription twice = subscribed once |
| **Row-Level Security (RLS)** | Database security layer that filters data per user/role at query level | Student query: SELECT ... WHERE student_id = current_user; returns only own data |
| **Fuzzy Matching** | Approximate string matching; tolerates typos, case differences, word order | Student answers "pris" for capital "Paris" → fuzzy match succeeds |
| **Band Scale** | IELTS 9-band scoring system; 9 = native/expert, 1 = non-user, 6.5+ = university admission | Student's overall score: 6.5 band = moderately proficient English |
| **Throughput** | Number of transactions/operations system can handle per unit time | EduFlow designed for 100 concurrent quiz-takers; 10 submissions/second |
| **Load Testing** | Testing system under high concurrency to find breaking points | Simulate 50 students taking quiz simultaneously; measure response times |

---

## 📌 VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| **v1.0** | 2026-07-28 | Aulia | Initial PRD; all core features F001-F012 defined, scope locked for MVP |
| **v2.0** | 2026-07-28 | Aulia | Improved based on Education Republic job requirements; added detailed functional requirements, risk mitigation, security NFRs |

---

## 🎓 USAGE NOTES FOR SOLO DEVELOPER

### Before You Code

1. **Read this PRD in full** (takes 1-2 hours). This is your north star.
2. **Highlight the sections relevant to each sprint:**
   - Sprint 1 (Weeks 1-2): Focus on F001 (Auth) + F002-F003 schema design
   - Sprint 2 (Weeks 2-3): Focus on F004 (Grading) + F005 (Quiz Submission)
   - Sprint 3 (Weeks 3-4): Focus on F007 (Events) + F008 (Results)
   - Continue sprint planning...

3. **Scope lock:** The PRD is **locked**. Do not add features beyond F001-F012 without extending the timeline.
4. **If unsure about requirements:** Re-read the relevant section. If still unclear, it's a good interview talking point ("I clarified ambiguous requirements with the PM").

### During Development

1. **Reference this PRD constantly.** Before implementing a feature, review the acceptance criteria.
2. **Track progress:** Update VERSION_HISTORY if you find errors or need clarifications.
3. **Test against acceptance criteria:** Each feature should pass the listed criteria, not just "work".
4. **Example:** When implementing F001 (Auth), verify:
   - [ ] Password hashing works (bcrypt)
   - [ ] JWT generation & verification works
   - [ ] Role-based checks enforce RBAC
   - [ ] Row-level security works (test with multiple users)
   - [ ] All unit tests pass (20+ test cases)

### After Development

1. **Create Architecture Diagram:** Draw system design (users → frontend → API → database)
2. **Write API Documentation:** Document all endpoints (method, path, request/response)
3. **Record a Demo Video:** 5-10 min walkthrough of core flows (create quiz → schedule event → take quiz → view results)
4. **Portfolio Presentation:** "This is the PRD I wrote as PM, covering all functional requirements. Here's the system I built to spec."
5. **Add to GitHub:** Include `/docs/PRD.md` in your repo for hiring managers to review.

### Interview Talking Points

- "I wrote a detailed PRD before coding, which helped me stay focused and not over-engineer."
- "I prioritized MVP features (F001-F012) over scope creep, completing on time."
- "I designed this to match the Education Republic tech stack: Node.js + React + PostgreSQL."
- "The auto-grading engine handles 5+ question types with 100% accuracy on edge cases."
- "I implemented row-level security so students can only see their own submissions."
- "I deployed to production (Vercel + Supabase) within 6-8 weeks, meeting all success metrics."

**Golden Rule:** If a feature isn't in F001-F012, it's out of scope. Focus builds quality. Feature bloat = unfinished portfolio = no job offer. **Depth over breadth.**

---

*PRD Template: Production-Grade for Solo Developer | EduFlow v2.0 | Portfolio Project for Education Republic*

*Last Updated: 2026-07-28 | Status: ✅ Approved & Locked for Development*