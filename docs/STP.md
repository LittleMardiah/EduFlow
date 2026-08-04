# STP (System Test Plan) - EduFlow

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*Production-Grade System Testing Strategy & Acceptance Criteria*

*Quality Assurance Perspective | Portfolio Project*

---

## 📌 DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Type** | System Test Plan (STP) |
| **Document Version** | v1.0 |
| **Created Date** | 2026-07-28 |
| **Last Updated** | 2026-07-28 |
| **Author** | M. Arif Aulia (QA Team) |
| **Status** | ✅ Complete & Ready for Testing |
| **Related Documents** | PRD.md, DATABASE_SCHEMA.md, LOGIC_FLOW.md, HALAMAN.md, TDD.md, API_CONTRACT.md, SECURITY_SPEC.md, DRP.md |
| **Scope** | Functional Testing, Non-Functional Testing, Security Testing, Integration Testing, UAT, Load Testing |
| **Target Audience** | QA Engineers, Developers, Product Manager, Security Reviewers |
| **Testing Duration** | 2-3 weeks (parallel with development iterations) |
| **Test Environment** | Development (localhost), Staging (pre-production), Production (live) |

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Test Strategy Overview](#2-test-strategy-overview)
3. [Test Scope & Coverage](#3-test-scope--coverage)
4. [Testing Phases & Timeline](#4-testing-phases--timeline)
5. [Test Cases: Authentication & Authorization (F001)](#5-test-cases-authentication--authorization-f001)
6. [Test Cases: Quiz Management (F002-F003)](#6-test-cases-quiz-management-f002-f003)
7. [Test Cases: Auto-Grading Engine (F004)](#7-test-cases-auto-grading-engine-f004)
8. [Test Cases: Quiz Submissions (F005)](#8-test-cases-quiz-submissions-f005)
9. [Test Cases: IELTS Simulation (F006)](#9-test-cases-ielts-simulation-f006)
10. [Test Cases: Event Management (F007)](#10-test-cases-event-management-f007)
11. [Test Cases: Results Display & Analytics (F008-F009)](#11-test-cases-results-display--analytics-f008-f009)
12. [Test Cases: Admin Management & Audit (F010-F011)](#12-test-cases-admin-management--audit-f010-f011)
13. [Non-Functional Testing](#13-non-functional-testing)
14. [Security Testing Checklist](#14-security-testing-checklist)
15. [API Contract Validation](#15-api-contract-validation)
16. [Database Integrity Testing](#16-database-integrity-testing)
17. [Integration Testing](#17-integration-testing)
18. [User Acceptance Testing (UAT)](#18-user-acceptance-testing-uat)
19. [Performance & Load Testing](#19-performance--load-testing)
20. [Test Reporting & Sign-Off](#20-test-reporting--sign-off)

---

## 1. EXECUTIVE SUMMARY

### Purpose

This STP defines comprehensive testing strategy for EduFlow to ensure:
- ✅ All 12 MVP features (F001-F012) function correctly end-to-end
- ✅ Non-functional requirements met (performance, security, scalability)
- ✅ API contracts honored (request/response validation)
- ✅ Database integrity & ACID compliance
- ✅ Security controls enforced (RBAC, data protection, audit logging)
- ✅ Edge cases and error scenarios handled gracefully
- ✅ Disaster recovery procedures validated

### Testing Approach

**Multi-Layer Testing Strategy:**
1. **Unit Tests** - Individual functions (Jest for backend, Vitest for frontend)
2. **Integration Tests** - API endpoints + Database interactions
3. **System Tests** - End-to-end feature workflows
4. **Security Tests** - RBAC, authentication, data protection
5. **Performance Tests** - Load, response time, throughput
6. **UAT Tests** - User-facing feature acceptance

### Success Criteria (Acceptance Gates)

| Metric | Target | Status |
|--------|--------|--------|
| **Functional Coverage** | All 12 features (F001-F012) with 0 P0 bugs | GATE 1 |
| **Test Coverage** | Backend >85%, Frontend >75% | GATE 2 |
| **API Contract Compliance** | 100% request/response validation | GATE 3 |
| **Security Vulnerabilities** | 0 critical/high, <5 medium | GATE 4 |
| **Performance Baseline** | API <300ms p95, UI <2s load time | GATE 5 |
| **Database Health** | RLS policies enforced, no orphaned data | GATE 6 |

---

## 2. TEST STRATEGY OVERVIEW

### Testing Pyramid

```
┌─────────────────────────────────────────┐
│                                         │
│      E2E / UI Tests (10-15%)           │
│         (Selenium, Cypress)            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│    Integration Tests (30-40%)          │
│    (API + Database + External Svcs)   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│     Unit Tests (45-55%)                │
│   (Business logic, utilities)          │
│                                         │
└─────────────────────────────────────────┘
```

### Test Environment Matrix

| Environment | Purpose | Database | API URL | Data Reset |
|-------------|---------|----------|---------|-----------|
| **Local** | Development, unit testing | SQLite or PostgreSQL | localhost:3001 | Each test |
| **Staging** | Integration & system testing | PostgreSQL (Supabase) | staging-api.eduflow.dev | Nightly reset |
| **Production** | Live user acceptance | PostgreSQL (Supabase) | api.eduflow.dev | N/A (immutable) |

### Test Tools & Technology Stack

**Backend Testing:**
- **Unit Tests:** Jest (Node.js) + Supertest (HTTP testing)
- **Test Database:** PostgreSQL with test schema + fixtures
- **Coverage Tool:** Istanbul/nyc
- **Assertion Library:** Jest matchers

**Frontend Testing:**
- **Component Tests:** Vitest + React Testing Library
- **E2E Tests:** Cypress or Playwright
- **Visual Regression:** Percy.io (optional for portfolio)

**API Testing:**
- **Contract Validation:** Postman or API Testing tool (optional)
- **Load Testing:** K6 or Apache JMeter
- **Monitoring:** Sentry (error tracking), DataDog (optional)

**Database Testing:**
- **Schema Validation:** pg_catalog queries
- **Data Integrity:** Custom SQL validation scripts
- **RLS Testing:** Row-level security policy audits

---

## 3. TEST SCOPE & COVERAGE

### Features Included (P0 - In Scope)

| Feature ID | Feature Name | Test Type | Priority |
|-----------|-------------|-----------|----------|
| **F001** | Authentication & Authorization | Functional + Security | CRITICAL |
| **F002** | Quiz Bank Management | Functional + Integration | CRITICAL |
| **F003** | Question Management | Functional + Integration | CRITICAL |
| **F004** | Auto-Grading Engine | Functional + Algorithm | CRITICAL |
| **F005** | Quiz Submissions | Functional + Integration | CRITICAL |
| **F006** | IELTS Simulation Mode | Functional | HIGH |
| **F007** | Event-Based Testing | Functional + Integration | HIGH |
| **F008** | Results Dashboard | Functional + UI | HIGH |
| **F009** | Analytics & Reporting | Functional + Data | HIGH |
| **F010** | Audit Logging | Functional + Compliance | HIGH |
| **F011** | Role-Based Access Control | Functional + Security | CRITICAL |
| **F012** | Admin User Management | Functional + Admin | HIGH |

### Features Excluded (Out of Scope)

- OAuth2 / SSO (v1.1)
- Two-Factor Authentication (v1.2)
- Payment processing (v2.0)
- Mobile app (v2.0)
- Real-time WebSocket features (v1.1)
- File upload/import (v1.1)

### Test Coverage Goals

| Layer | Target Coverage | Tool | Frequency |
|-------|-----------------|------|-----------|
| **Backend Services** | >85% | Jest | Per commit |
| **Backend Controllers** | >80% | Jest | Per commit |
| **Frontend Components** | >75% | Vitest | Per commit |
| **Frontend Pages** | >60% | Vitest | Weekly |
| **API Endpoints** | 100% (contract) | Postman | Before release |
| **Database Queries** | >80% | Custom SQL | Before release |

---

## 4. TESTING PHASES & TIMELINE

### Phase 1: Unit Testing (Week 1-2)
**Parallel with development**

- **Backend Services:** Auth service, Quiz service, Grading service, Analytics service
- **Frontend Utilities:** Validation helpers, formatting utilities
- **Goal:** 85%+ backend coverage, all unit tests passing
- **Pass Criteria:** Zero failing unit tests before sprint merge

### Phase 2: Integration Testing (Week 2-3)
**After API scaffolding complete**

- **API Integration:** All endpoints tested with real database
- **Database Integrity:** Schema constraints, foreign keys, indexes
- **External Services:** Supabase connection, email service (if present)
- **Goal:** All APIs working correctly with database
- **Pass Criteria:** Zero integration test failures

### Phase 3: System & End-to-End Testing (Week 3-4)
**After feature implementation complete**

- **Feature Workflows:** Full user journeys (login → create quiz → submit → view results)
- **Cross-Feature Integration:** Features working together
- **Edge Cases:** Boundary conditions, error scenarios
- **Goal:** All features functioning end-to-end
- **Pass Criteria:** All system tests passing, 0 P0 bugs

### Phase 4: Performance & Load Testing (Week 4-5)
**Before production release**

- **Response Time:** API <300ms p95
- **Page Load:** <2s landing, <3s dashboard
- **Concurrency:** 50+ concurrent users, 10 submissions/sec
- **Database:** Query optimization, index validation
- **Goal:** Meet performance targets
- **Pass Criteria:** No response timeout, <300ms p95 response time

### Phase 5: Security Testing (Week 5)
**Continuous, with dedicated pass**

- **RBAC Enforcement:** Role-based access control validation
- **Authentication:** Login flow, token expiration, password reset
- **Data Protection:** Encryption, PII handling, soft deletes
- **API Security:** Input validation, CSRF, SQL injection, XSS
- **Goal:** All security controls enforced
- **Pass Criteria:** Zero critical vulnerabilities

### Phase 6: UAT & Production Release (Week 6)
**With stakeholder validation**

- **User Workflows:** Real users test core features
- **Accessibility:** WCAG compliance, screen readers
- **Browser Compatibility:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Data Migration:** Test backups, restore procedures
- **Goal:** Ready for production
- **Pass Criteria:** Stakeholder sign-off

---

## 5. TEST CASES: AUTHENTICATION & AUTHORIZATION (F001)

### TC-001: User Registration - Valid Data

**Objective:** Verify user registration succeeds with valid email and password

**Preconditions:**
- No user with test email exists in database
- Backend service running

**Test Steps:**
1. POST `/api/v1/auth/register` with email=`test@example.com`, password=`SecurePass123!`, firstName=`John`, lastName=`Doe`, role=`student`
2. Verify response status: **201 Created**
3. Verify response body contains: `{ success: true, data: { userId, email, role } }`
4. Verify password is **not** returned in response
5. Verify user created in database with bcrypt hashed password

**Expected Result:** User account created successfully, password hashed, response excludes sensitive fields

**Pass Criteria:**
- [ ] HTTP 201 status
- [ ] Response includes userId (UUID format)
- [ ] User exists in database
- [ ] password_hash in DB is bcrypt ($2b$ prefix), not plaintext
- [ ] No password_hash in API response

---

### TC-002: User Registration - Duplicate Email

**Objective:** Verify registration fails when email already exists

**Preconditions:**
- User with email `existing@example.com` exists in database

**Test Steps:**
1. POST `/api/v1/auth/register` with email=`existing@example.com`, password=`SecurePass123!`
2. Verify response status: **409 Conflict**
3. Verify error code: `DUPLICATE_EMAIL`
4. Verify error message: `"Email already registered"`

**Expected Result:** Registration rejected, duplicate email error returned

**Pass Criteria:**
- [ ] HTTP 409 status
- [ ] Error code is `DUPLICATE_EMAIL`
- [ ] No new user created

---

### TC-003: User Registration - Weak Password

**Objective:** Verify registration fails when password is too weak

**Test Steps:**
1. POST `/api/v1/auth/register` with password=`123` (too short)
2. Verify response status: **400 Bad Request**
3. Verify error includes: `"Password must be at least 8 characters"`

**Test Steps (variant):**
1. POST with password=`password` (lowercase only, no numbers/symbols)
2. Verify response status: **400 Bad Request**
3. Verify error includes: `"Password must contain uppercase, lowercase, numbers, and symbols"`

**Expected Result:** Registration rejected with password validation error

**Pass Criteria:**
- [ ] HTTP 400 status
- [ ] Clear error message about password requirements
- [ ] No user created

---

### TC-004: User Login - Valid Credentials

**Objective:** Verify JWT token issued on successful login

**Preconditions:**
- User exists with email=`test@example.com`, password=`SecurePass123!`

**Test Steps:**
1. POST `/api/v1/auth/login` with email=`test@example.com`, password=`SecurePass123!`
2. Verify response status: **200 OK**
3. Verify response includes: `{ success: true, data: { accessToken, refreshToken, user: { userId, email, role } } }`
4. Decode accessToken JWT
5. Verify JWT payload contains: `userId`, `email`, `role`, `exp` (24 hours from now)

**Expected Result:** Valid JWT token issued, user logged in

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] accessToken is valid JWT (3 parts separated by dots)
- [ ] JWT payload includes all required fields
- [ ] JWT expires in ~24 hours
- [ ] refreshToken provided

---

### TC-005: User Login - Wrong Password

**Objective:** Verify login fails with incorrect password

**Preconditions:**
- User exists with email=`test@example.com`, password=`SecurePass123!`

**Test Steps:**
1. POST `/api/v1/auth/login` with email=`test@example.com`, password=`WrongPassword!`
2. Verify response status: **401 Unauthorized**
3. Verify error code: `INVALID_CREDENTIALS`

**Expected Result:** Login rejected, no token issued

**Pass Criteria:**
- [ ] HTTP 401 status
- [ ] No accessToken in response
- [ ] Error message does not reveal whether email or password is wrong (security)

---

### TC-006: Protected Route - Missing JWT Token

**Objective:** Verify protected endpoints reject requests without JWT

**Test Steps:**
1. GET `/api/v1/quizzes` without Authorization header
2. Verify response status: **401 Unauthorized**
3. Verify error message: `"Missing or invalid token"`

**Expected Result:** Request rejected, user must authenticate

**Pass Criteria:**
- [ ] HTTP 401 status
- [ ] Error indicates authentication required

---

### TC-007: Protected Route - Expired JWT Token

**Objective:** Verify expired tokens are rejected

**Preconditions:**
- Token is expired (exp < current time)

**Test Steps:**
1. GET `/api/v1/quizzes` with expired Authorization header: `Bearer <expired_token>`
2. Verify response status: **401 Unauthorized**
3. Verify error message: `"Token expired"`

**Expected Result:** Expired token rejected, user must login again

**Pass Criteria:**
- [ ] HTTP 401 status
- [ ] Error indicates token expired

---

### TC-008: RBAC - Student Cannot Access Admin Endpoint

**Objective:** Verify role-based access control prevents unauthorized access

**Preconditions:**
- Student user with valid JWT token

**Test Steps:**
1. GET `/api/v1/admin/users` with student's JWT token
2. Verify response status: **403 Forbidden**
3. Verify error code: `INSUFFICIENT_PERMISSIONS`

**Expected Result:** Student cannot access admin endpoint

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] No data returned

---

### TC-009: RBAC - Instructor Cannot Delete User (Admin Only)

**Objective:** Verify instructor lacks admin privileges

**Preconditions:**
- Instructor user with valid JWT token

**Test Steps:**
1. DELETE `/api/v1/admin/users/{userId}` with instructor's JWT token
2. Verify response status: **403 Forbidden**

**Expected Result:** Instructor cannot delete users

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] User still exists in database

---

### TC-010: RBAC - Resource Ownership Check

**Objective:** Verify users cannot access others' resources

**Preconditions:**
- Student A has quiz X
- Student B trying to access quiz X (should fail)

**Test Steps:**
1. Student B login, get JWT token
2. GET `/api/v1/quizzes/{quiz_id_of_student_a}` with student B's token
3. Verify response status: **404 Not Found** (prefer 404 over 403 to not leak resource existence)

**Expected Result:** Student B cannot see Student A's quiz

**Pass Criteria:**
- [ ] HTTP 404 status
- [ ] Quiz details not returned

---

### TC-011: Token Refresh - Valid Refresh Token

**Objective:** Verify refresh token generates new access token

**Preconditions:**
- User has valid refreshToken

**Test Steps:**
1. POST `/api/v1/auth/refresh` with refreshToken in body
2. Verify response status: **200 OK**
3. Verify new accessToken issued
4. Verify new accessToken has exp = 24 hours from now

**Expected Result:** New access token issued without re-authenticating

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] New accessToken provided
- [ ] New token is valid JWT

---

### TC-012: Logout - Token Invalidation

**Objective:** Verify user cannot use token after logout

**Preconditions:**
- User has valid JWT token

**Test Steps:**
1. POST `/api/v1/auth/logout` with valid JWT token
2. Verify response status: **200 OK**
3. Attempt GET `/api/v1/quizzes` with same token
4. Verify response status: **401 Unauthorized**

**Expected Result:** Token revoked, user cannot use it after logout

**Pass Criteria:**
- [ ] Logout returns 200
- [ ] Subsequent request with same token returns 401

---

## 6. TEST CASES: QUIZ MANAGEMENT (F002-F003)

### TC-201: Create Quiz - Valid Data

**Objective:** Verify instructor can create quiz with valid configuration

**Preconditions:**
- Instructor user logged in

**Test Steps:**
1. POST `/api/v1/quizzes` with:
   ```json
   {
     "title": "English Proficiency Quiz",
     "description": "Test your English skills",
     "quizType": "standard",
     "durationMinutes": 60,
     "passingScore": 70,
     "maxAttempts": 3
   }
   ```
2. Verify response status: **201 Created**
3. Verify response includes: `{ quizId, title, status: "draft" }`
4. Verify quiz exists in database with instructor_id matching current user

**Expected Result:** Quiz created in draft status

**Pass Criteria:**
- [ ] HTTP 201 status
- [ ] quizId is UUID format
- [ ] status = "draft"
- [ ] instructor_id = current user ID
- [ ] Quiz in database

---

### TC-202: Create Quiz - Minimum Questions Validation

**Objective:** Verify quiz cannot be created without enough questions before publishing

**Preconditions:**
- Instructor wants to publish quiz

**Test Steps:**
1. Create quiz with 3 questions
2. PATCH `/api/v1/quizzes/{quizId}` with `status: "published"`
3. Verify response status: **400 Bad Request**
4. Verify error message: `"Quiz must have at least 5 questions to publish"`

**Expected Result:** Publish fails due to insufficient questions

**Pass Criteria:**
- [ ] HTTP 400 status
- [ ] Quiz remains in "draft" status

---

### TC-203: Edit Quiz - Cannot Edit Published Quiz

**Objective:** Verify published quizzes cannot be edited (version control)

**Preconditions:**
- Published quiz exists

**Test Steps:**
1. PATCH `/api/v1/quizzes/{quizId}` with new title and updated description
2. Verify response status: **403 Forbidden**
3. Verify error message: `"Published quizzes cannot be edited. Create a new version instead."`

**Expected Result:** Edit rejected for published quiz

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] Quiz title unchanged

---

### TC-204: Publish Quiz - Valid Transition

**Objective:** Verify quiz transitions from draft to published

**Preconditions:**
- Quiz in draft status with >=5 questions

**Test Steps:**
1. PATCH `/api/v1/quizzes/{quizId}` with `status: "published"`
2. Verify response status: **200 OK**
3. Verify response includes: `{ status: "published", publishedAt: timestamp }`
4. Verify quiz.status in database = "published"
5. Verify quiz.published_at timestamp set

**Expected Result:** Quiz published successfully

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] status in response = "published"
- [ ] published_at populated in database

---

### TC-205: Delete Quiz - Cannot Delete Published Quiz

**Objective:** Verify published quizzes cannot be deleted (soft delete only for unpublished)

**Preconditions:**
- Published quiz exists

**Test Steps:**
1. DELETE `/api/v1/quizzes/{quizId}`
2. Verify response status: **403 Forbidden**
3. Verify error message: `"Published quizzes cannot be deleted"`

**Expected Result:** Delete rejected

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] Quiz still appears in instructor's list

---

### TC-206: Quiz Visibility - Public Quiz

**Objective:** Verify public quizzes can be accessed without role restrictions (for metadata only)

**Preconditions:**
- Quiz is public (is_public = true)

**Test Steps:**
1. GET `/api/v1/quizzes/{quizId}/metadata` without authentication
2. Verify response status: **200 OK**
3. Verify response includes: title, description, but NOT questions
4. Verify response does NOT include: correct answers, instructor contact info

**Expected Result:** Public quiz metadata accessible, but sensitive data hidden

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Title and description returned
- [ ] Questions NOT returned
- [ ] Correct answers NOT returned

---

### TC-207: Add Question to Quiz - MCQ Type

**Objective:** Verify instructor can add MCQ question

**Preconditions:**
- Quiz in draft status

**Test Steps:**
1. POST `/api/v1/quizzes/{quizId}/questions` with:
   ```json
   {
     "questionText": "What is 2+2?",
     "questionType": "mcq",
     "points": 2,
     "options": [
       { "text": "3", "isCorrect": false },
       { "text": "4", "isCorrect": true },
       { "text": "5", "isCorrect": false }
     ]
   }
   ```
2. Verify response status: **201 Created**
3. Verify questionId in response
4. Verify question_type = "mcq" in database

**Expected Result:** MCQ question added

**Pass Criteria:**
- [ ] HTTP 201 status
- [ ] Question in database
- [ ] Options in database (3 rows)
- [ ] One option marked as isCorrect

---

### TC-208: Add Question - Short Answer with Fuzzy Matching Config

**Objective:** Verify short-answer question accepts fuzzy matching configuration

**Test Steps:**
1. POST `/api/v1/quizzes/{quizId}/questions` with:
   ```json
   {
     "questionText": "What is the capital of France?",
     "questionType": "short_answer",
     "points": 5,
     "correctAnswer": "Paris",
     "fuzzyThreshold": 0.85
   }
   ```
2. Verify response status: **201 Created**
3. Verify fuzzy_threshold = 0.85 in database

**Expected Result:** Short-answer question with fuzzy matching configured

**Pass Criteria:**
- [ ] HTTP 201 status
- [ ] fuzzy_threshold stored in database

---

### TC-209: Question Versioning - Archive Old Version

**Objective:** Verify editing questions creates version history

**Preconditions:**
- Question exists in quiz
- Quiz published

**Test Steps:**
1. Create new quiz version (via admin/instructor feature)
2. Verify quiz.current_version incremented in database
3. Verify old questions backed up in quiz_versions table

**Expected Result:** Question history preserved

**Pass Criteria:**
- [ ] quiz_versions table contains old question data
- [ ] current_version incremented

---

### TC-210: Bulk Question Operations - Upload & Validation

**Objective:** Verify bulk question upload with validation (future feature, document expected behavior)

**Preconditions:**
- CSV file with questions prepared

**Test Steps:**
1. POST `/api/v1/quizzes/{quizId}/questions/bulk` with CSV file
2. API validates each question (format, required fields)
3. On error, return list of invalid rows

**Expected Result:** Bulk upload with validation (v1.1 feature)

**Pass Criteria:**
- [ ] Invalid rows identified
- [ ] Error message specifies line number and reason

---

## 7. TEST CASES: AUTO-GRADING ENGINE (F004)

### TC-301: Auto-Grade MCQ - Correct Answer

**Objective:** Verify MCQ grading correctly identifies correct answer

**Preconditions:**
- Submission submitted with MCQ answer pointing to correct option

**Test Steps:**
1. Call grading service with:
   - question_type = "mcq"
   - student_answer = "option_id_2" (correct option)
   - correct_option_id = "option_id_2"
2. Verify is_correct = true
3. Verify points_earned = question.points

**Expected Result:** Correct answer scored full points

**Pass Criteria:**
- [ ] is_correct = true
- [ ] points_earned matches question.points

---

### TC-302: Auto-Grade MCQ - Incorrect Answer

**Objective:** Verify MCQ grading penalizes incorrect answers

**Preconditions:**
- Submission submitted with wrong MCQ option

**Test Steps:**
1. Call grading service with:
   - student_answer = "option_id_1" (wrong)
   - correct_option_id = "option_id_2"
2. Verify is_correct = false
3. Verify points_earned = 0

**Expected Result:** Incorrect answer gets 0 points

**Pass Criteria:**
- [ ] is_correct = false
- [ ] points_earned = 0

---

### TC-303: Auto-Grade True/False - Correct

**Objective:** Verify T/F question grading

**Test Steps:**
1. Grade T/F submission with correct answer
2. Verify is_correct = true, points_earned = points

**Expected Result:** T/F correct answer scored

**Pass Criteria:**
- [ ] is_correct = true

---

### TC-304: Auto-Grade Short Answer - Exact Match

**Objective:** Verify short-answer grading with exact match

**Preconditions:**
- Short-answer question: "What is Paris?" with correctAnswer = "Paris"
- Student answer: "Paris"

**Test Steps:**
1. Grade submission
2. Verify is_correct = true (case-insensitive match)

**Expected Result:** Exact match (case-insensitive) scored correctly

**Pass Criteria:**
- [ ] is_correct = true
- [ ] Matching is case-insensitive (Paris = paris = PARIS)

---

### TC-305: Auto-Grade Short Answer - Fuzzy Match Pass

**Objective:** Verify fuzzy matching accepts similar answers

**Preconditions:**
- Question with correctAnswer = "Paris", fuzzyThreshold = 0.85
- Student answer: "Pari" (typo)

**Test Steps:**
1. Calculate Levenshtein distance between "Pari" and "Paris"
2. Calculate similarity = 1 - (distance / max_length) = 1 - (1/5) = 0.8
3. Verify similarity (0.8) < threshold (0.85) → not accepted

**Expected Result:** Typo rejected (too dissimilar)

**Pass Criteria:**
- [ ] is_correct = false (below threshold)

**Test Variant:**
- Student answer: "paris " (extra space) → normalize and match → should pass
- Expected: is_correct = true (after normalization)

---

### TC-306: Auto-Grade Short Answer - Fuzzy Match Fail

**Objective:** Verify fuzzy matching rejects very different answers

**Preconditions:**
- Question: "What is the capital of France?" → "Paris"
- Student answer: "London"

**Test Steps:**
1. Levenshtein distance is high, similarity << 0.85
2. Verify is_correct = false

**Expected Result:** Dissimilar answer rejected

**Pass Criteria:**
- [ ] is_correct = false

---

### TC-307: Calculate Overall Score - Mixed Question Types

**Objective:** Verify overall submission score calculation

**Preconditions:**
- Submission with 3 questions:
  - Q1: MCQ, 2 points, correct (2 points earned)
  - Q2: T/F, 3 points, wrong (0 points earned)
  - Q3: Short-answer, 5 points, correct (5 points earned)
- Total points = 10

**Test Steps:**
1. Grade submission
2. Verify total_points = 2 + 0 + 5 = 7
3. Verify score_percentage = (7 / 10) * 100 = 70%
4. Verify is_passed = true (if passing_score = 70%)

**Expected Result:** Overall score calculated correctly

**Pass Criteria:**
- [ ] total_points = 7
- [ ] score_percentage = 70%
- [ ] is_passed = true

---

### TC-308: Grading Performance - 100 Questions

**Objective:** Verify grading doesn't timeout with large submissions

**Preconditions:**
- Submission with 100 questions

**Test Steps:**
1. Submit and grade 100-question quiz
2. Measure grading time
3. Verify grading completes in < 5 seconds

**Expected Result:** Grading completes quickly

**Pass Criteria:**
- [ ] Grading time < 5 seconds
- [ ] All 100 questions graded correctly

---

### TC-309: Handle Missing Option - Deleted After Submission

**Objective:** Verify grading handles option deleted after submission (edge case)

**Preconditions:**
- Student submitted MCQ answer pointing to option_id_X
- Option_id_X was then deleted

**Test Steps:**
1. Attempt to grade submission
2. Verify grading continues (doesn't crash)
3. Verify answer treated as incorrect (option not found)

**Expected Result:** Grading fails gracefully

**Pass Criteria:**
- [ ] No 500 error
- [ ] is_correct = false
- [ ] Error logged in audit_logs

---

### TC-310: Division by Zero Protection

**Objective:** Verify scoring handles edge case of 0 max_points

**Preconditions:**
- Quiz with all questions worth 0 points (edge case)

**Test Steps:**
1. Grade submission
2. Verify score_percentage calculated without division error
3. Verify score_percentage = 0% (or handle gracefully)

**Expected Result:** No division by zero error

**Pass Criteria:**
- [ ] No HTTP 500 error
- [ ] score_percentage = 0%

---

## 8. TEST CASES: QUIZ SUBMISSIONS (F005)

### TC-401: Start Quiz - Valid Request

**Objective:** Verify student can initiate quiz submission

**Preconditions:**
- Published quiz exists
- Student has access (event or direct access)

**Test Steps:**
1. POST `/api/v1/submissions` with `quizId`
2. Verify response status: **201 Created**
3. Verify response includes: `{ submissionId, status: "in_progress", startedAt }`
4. Verify submission in database with status = "in_progress"

**Expected Result:** Submission created in in_progress status

**Pass Criteria:**
- [ ] HTTP 201 status
- [ ] submission.status = "in_progress"
- [ ] submission.started_at timestamp set

---

### TC-402: Submit Answer to Question

**Objective:** Verify student can save answer during quiz

**Preconditions:**
- Active submission (in_progress status)

**Test Steps:**
1. POST `/api/v1/submissions/{submissionId}/answers` with:
   ```json
   {
     "questionId": "q123",
     "answer": "option_id_2"
   }
   ```
2. Verify response status: **200 OK**
3. Verify answer stored in database with submission_id and question_id

**Expected Result:** Answer saved to submission

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Answer in answers table

---

### TC-403: Auto-Save Functionality

**Objective:** Verify auto-save prevents data loss

**Preconditions:**
- Student typing answer during quiz

**Test Steps:**
1. Frontend calls POST `/api/v1/submissions/{submissionId}/answers` every 30 seconds
2. Verify no errors on multiple saves
3. Verify idempotency: saving same answer twice = one record (or update)

**Expected Result:** Auto-save works without losing data

**Pass Criteria:**
- [ ] Answers saved without errors
- [ ] Only one answer record per question (or latest update)

---

### TC-404: Submit Quiz - Valid Submission

**Objective:** Verify student can submit completed quiz

**Preconditions:**
- Submission in in_progress status
- All answers provided

**Test Steps:**
1. POST `/api/v1/submissions/{submissionId}/submit` with action = "submit"
2. Verify response status: **200 OK**
3. Verify response includes: `{ status: "submitted", submittedAt }`
4. Verify submission.status = "submitted" in database
5. Verify grading triggered (async or sync)
6. Verify analytics updated

**Expected Result:** Quiz submitted and graded

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] submission.status = "submitted"
- [ ] Grading completed or queued
- [ ] submission.score_percentage populated

---

### TC-405: Submit Quiz - After Deadline

**Objective:** Verify late submissions are rejected or flagged

**Preconditions:**
- Event deadline: 2026-07-28 14:00:00
- Current time: 2026-07-28 14:05:00 (after deadline)

**Test Steps:**
1. POST `/api/v1/submissions/{submissionId}/submit`
2. Verify response status: **400 Bad Request** OR **403 Forbidden**
3. Verify error message: `"Event deadline has passed"`

**Expected Result:** Late submission rejected

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] Submission not finalized
- [ ] submission.status remains "in_progress"

---

### TC-406: Timeout Protection - Auto-Submit at Deadline

**Objective:** Verify quiz auto-submits when time expires

**Preconditions:**
- Quiz duration = 60 minutes
- Student started quiz at 14:00
- Current time = 15:00 (deadline)

**Test Steps:**
1. Frontend countdown timer reaches 0:00
2. Frontend POST `/api/v1/submissions/{submissionId}/submit` with `autoSubmitted: true`
3. Verify response status: **200 OK**
4. Verify submission.status = "submitted"

**Expected Result:** Quiz auto-submits at deadline

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Submission finalized
- [ ] Answers up to auto-submit included in grading

---

### TC-407: Quiz Resumption - Browser Close & Reopen

**Objective:** Verify student can resume quiz if browser closes

**Preconditions:**
- Submission in in_progress status (answers saved)
- Browser closed

**Test Steps:**
1. Student closes browser mid-quiz
2. Student reopens browser and logs in
3. GET `/api/v1/submissions/{submissionId}`
4. Verify response includes: all previously saved answers
5. Verify status: "in_progress"
6. Verify remaining time recalculated based on deadline

**Expected Result:** Quiz can be resumed with previous answers intact

**Pass Criteria:**
- [ ] All answers retrieved
- [ ] submission.status = "in_progress"
- [ ] Timer can be resumed

---

### TC-408: Max Attempts Enforcement

**Objective:** Verify student cannot exceed max_attempts

**Preconditions:**
- Quiz with max_attempts = 3
- Student completed 3 attempts

**Test Steps:**
1. Student attempts to start 4th submission
2. POST `/api/v1/submissions` with quizId
3. Verify response status: **400 Bad Request** OR **403 Forbidden**
4. Verify error message: `"You have reached maximum attempts (3) for this quiz"`

**Expected Result:** 4th attempt rejected

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] No submission created

---

### TC-409: Unlimited Attempts Support

**Objective:** Verify quiz with max_attempts = -1 allows unlimited attempts

**Preconditions:**
- Quiz with max_attempts = -1

**Test Steps:**
1. Student completes 10 submissions
2. Each submission succeeds (HTTP 201)
3. All submissions stored

**Expected Result:** Multiple attempts allowed

**Pass Criteria:**
- [ ] All 10 submissions created
- [ ] All in submissions table

---

### TC-410: Question Randomization

**Objective:** Verify question order randomized if enabled

**Preconditions:**
- Quiz with randomize_questions = true

**Test Steps:**
1. Student A submits quiz → questions in order Q1, Q2, Q3, Q4, Q5
2. Student B submits quiz → questions in order Q3, Q1, Q5, Q2, Q4
3. Verify questions are in different order

**Expected Result:** Question order randomized per student

**Pass Criteria:**
- [ ] Question orders differ between submissions
- [ ] All questions still presented

---

### TC-411: MCQ Option Randomization

**Objective:** Verify MCQ options randomized if enabled

**Preconditions:**
- Quiz with randomize_options = true
- MCQ question with options: "A", "B", "C", "D"

**Test Steps:**
1. Student A sees options in order: A, B, C, D
2. Student B sees options in order: C, A, D, B
3. Verify is_correct flag maintained (correct answer still correct regardless of position)

**Expected Result:** Options displayed in random order, correctness maintained

**Pass Criteria:**
- [ ] Option orders differ
- [ ] Grading remains accurate

---

## 9. TEST CASES: IELTS SIMULATION (F006)

### TC-501: IELTS Sections - Sequential Navigation

**Objective:** Verify IELTS sections proceed in order (no backward navigation)

**Preconditions:**
- IELTS simulation quiz started

**Test Steps:**
1. Student starts quiz on Listening section (15 min)
2. Verify "Previous" button disabled or hidden
3. Student completes Listening, clicks "Next"
4. Verify transitions to Reading section (60 min)
5. Verify "Previous" button disabled for Reading
6. Student completes Reading, clicks "Next"
7. Verify transitions to Writing section (60 min)
8. Verify "Previous" button disabled
9. After Writing, transitions to Speaking section (UI placeholder in V1)

**Expected Result:** Sections proceed forward only, no backward navigation

**Pass Criteria:**
- [ ] Cannot navigate backward
- [ ] Each section transitions correctly
- [ ] Total time = 15 + 60 + 60 + 15 = 150 minutes displayed

---

### TC-502: IELTS Section Timer - Auto-Submit on Time Expiry

**Objective:** Verify section auto-submits when section timer expires

**Preconditions:**
- Listening section duration = 15 minutes
- Student started section at 14:00

**Test Steps:**
1. Section timer counts down
2. At 14:15 (deadline), frontend auto-submits Listening section
3. Verify POST `/api/v1/submissions/{submissionId}/section-submit` called
4. Verify response includes: next_section = "reading"
5. Verify Reading section timer starts

**Expected Result:** Section auto-submits at deadline, next section starts

**Pass Criteria:**
- [ ] HTTP 200 on section submit
- [ ] Next section initialized
- [ ] Reading timer starts

---

### TC-503: IELTS Band Calculation - All Sections Complete

**Objective:** Verify IELTS 9-band score calculated correctly

**Preconditions:**
- All 4 sections submitted and graded

**Test Steps:**
1. Listening: 38/40 = 9.0 band
2. Reading: 36/40 = 8.5 band
3. Writing: 6.5/9.0 (manual grade pending) = TBD
4. Speaking: not graded yet = TBD
5. GET `/api/v1/submissions/{submissionId}/results`
6. Verify response includes:
   ```json
   {
     "listening": { "score": 38, "band": 9.0 },
     "reading": { "score": 36, "band": 8.5 },
     "writing": { "score": null, "band": null, "status": "pending_review" },
     "speaking": { "score": null, "band": null, "status": "not_completed" },
     "overallBand": null,
     "overallBandStatus": "pending_writing_speaking"
   }
   ```

**Expected Result:** Band scores calculated, overall band shows as pending

**Pass Criteria:**
- [ ] listening.band = 9.0
- [ ] reading.band = 8.5
- [ ] writing.status = "pending_review"
- [ ] overallBand = null (until all sections graded)

---

### TC-504: IELTS Speaking Section - Text Response (V1)

**Objective:** Verify Speaking section accepts text responses in V1

**Preconditions:**
- Speaking section presented (audio recording not in V1)

**Test Steps:**
1. Student sees prompt: "Describe a memorable trip"
2. Student types text response (textarea)
3. POST `/api/v1/submissions/{submissionId}/answers` with:
   ```json
   {
     "questionId": "speaking_part1",
     "answer": "Last year I went to..."
   }
   ```
4. Verify response status: **200 OK**
5. Verify answer saved

**Expected Result:** Text response accepted for Speaking

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Answer stored
- [ ] Marked for manual review (grading_status = "manual_review")

---

### TC-505: IELTS Writing Sections - Word Count Validation

**Objective:** Verify Writing section enforces word count requirements

**Preconditions:**
- Writing Part 1 (letter): minimum 150 words
- Writing Part 2 (essay): minimum 250 words

**Test Steps:**
1. Student writes 100-word letter for Part 1
2. POST answer
3. Verify response includes: `{ wordCount: 100, warning: "Minimum 150 words required" }`
4. Allow submission anyway (warning, not error)
5. After grading, flag for reviewer: "Insufficient word count for Part 1"

**Expected Result:** Word count validated, warning shown

**Pass Criteria:**
- [ ] wordCount calculated and returned
- [ ] Warning message shown
- [ ] Submission still accepted (penalty applied in grading)

---

### TC-506: IELTS Overall Time Budget - Visual Progress

**Objective:** Verify total time (150 min) displayed and monitored

**Test Steps:**
1. Frontend displays: "Total time: 2:30 (150 minutes)"
2. As student progresses through sections, remaining time shows:
   - Listening (15 min elapsed) → Remaining: 2:15
   - Reading (60 min elapsed) → Remaining: 1:15
   - Writing (60 min elapsed) → Remaining: 0:15
3. Verify timer countdown

**Expected Result:** Overall time managed and displayed

**Pass Criteria:**
- [ ] Timer displays correctly
- [ ] Time decrements accurately

---

## 10. TEST CASES: EVENT MANAGEMENT (F007)

### TC-601: Create Event - Valid Data

**Objective:** Verify instructor can schedule quiz event

**Preconditions:**
- Instructor logged in
- Published quiz exists

**Test Steps:**
1. POST `/api/v1/events` with:
   ```json
   {
     "quizId": "q123",
     "title": "Midterm Exam",
     "description": "English proficiency test",
     "scheduledStartAt": "2026-08-15T14:00:00Z",
     "scheduledEndAt": "2026-08-15T15:00:00Z",
     "maxParticipants": 50,
     "requiresRegistration": true
   }
   ```
2. Verify response status: **201 Created**
3. Verify eventId in response
4. Verify event.status = "scheduled"

**Expected Result:** Event created successfully

**Pass Criteria:**
- [ ] HTTP 201 status
- [ ] event.status = "scheduled"
- [ ] Event in database

---

### TC-602: Event Validation - End Time After Start Time

**Objective:** Verify event cannot have end time before start time

**Test Steps:**
1. POST `/api/v1/events` with:
   - scheduledStartAt = 2026-08-15 15:00:00
   - scheduledEndAt = 2026-08-15 14:00:00 (before start)
2. Verify response status: **400 Bad Request**
3. Verify error message: `"End time must be after start time"`

**Expected Result:** Event creation fails

**Pass Criteria:**
- [ ] HTTP 400 status
- [ ] Event not created

---

### TC-603: Add Participants to Event

**Objective:** Verify instructor can add students to event

**Preconditions:**
- Event exists

**Test Steps:**
1. POST `/api/v1/events/{eventId}/participants` with:
   ```json
   {
     "studentIds": ["student1", "student2", "student3"]
   }
   ```
2. Verify response status: **200 OK**
3. Verify 3 rows inserted into event_participants table

**Expected Result:** Participants added

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] 3 participants in event_participants table
- [ ] status = "invited" for each

---

### TC-604: Event Registration - Student Accepts Invite

**Objective:** Verify student can register for invited event

**Preconditions:**
- Event exists
- Student invited (status = "invited")

**Test Steps:**
1. Student logs in
2. GET `/api/v1/events/my-invitations` → sees invitation
3. POST `/api/v1/events/{eventId}/register` with action = "accept"
4. Verify response status: **200 OK**
5. Verify event_participant.status = "registered"

**Expected Result:** Student registered for event

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] participant.status = "registered"

---

### TC-605: Event Status Transition - In Progress

**Objective:** Verify event transitions to in_progress when start time reached

**Preconditions:**
- Event scheduled for 2026-08-15 14:00:00
- Current time: 2026-08-15 14:00:00

**Test Steps:**
1. Backend job checks event status (could be scheduled separately)
2. If current_time >= scheduled_start_at, update event.status = "in_progress"
3. GET `/api/v1/events/{eventId}` 
4. Verify status = "in_progress"

**Expected Result:** Event marked as in progress

**Pass Criteria:**
- [ ] event.status = "in_progress" after start time

---

### TC-606: Event Status Transition - Completed

**Objective:** Verify event transitions to completed after end time

**Preconditions:**
- Event scheduled to end at 2026-08-15 15:00:00
- Current time: 2026-08-15 15:05:00

**Test Steps:**
1. GET `/api/v1/events/{eventId}`
2. Verify status = "completed"

**Expected Result:** Event marked as completed

**Pass Criteria:**
- [ ] event.status = "completed"

---

### TC-607: Event Deadline Enforcement - No Late Submissions

**Objective:** Verify students cannot submit after event deadline

**Preconditions:**
- Event ended at 15:00:00
- Current time: 15:05:00

**Test Steps:**
1. Student attempts to submit quiz
2. POST `/api/v1/submissions/{submissionId}/submit`
3. Verify response status: **403 Forbidden**
4. Verify error: `"Event deadline has passed"`

**Expected Result:** Late submission rejected

**Pass Criteria:**
- [ ] HTTP 403 status
- [ ] Submission not finalized

---

### TC-608: Event Attendance Tracking

**Objective:** Verify system tracks who attended (submitted) vs no-show

**Preconditions:**
- Event completed
- 3 students invited: A, B, C
- Only A and B submitted

**Test Steps:**
1. GET `/api/v1/events/{eventId}/participants`
2. Verify response includes:
   ```json
   {
     "attended": [
       { "studentId": "A", "status": "attended", "submissionId": "s1", "score": 75 },
       { "studentId": "B", "status": "attended", "submissionId": "s2", "score": 82 }
     ],
     "noShow": [
       { "studentId": "C", "status": "no_show" }
     ]
   }
   ```

**Expected Result:** Attendance tracked

**Pass Criteria:**
- [ ] A and B marked as "attended"
- [ ] C marked as "no_show"

---

### TC-609: Timezone Handling - Event Scheduling

**Objective:** Verify events respect instructor's timezone

**Preconditions:**
- Instructor timezone: Asia/Jakarta
- Event scheduled for 14:00 Jakarta time

**Test Steps:**
1. POST event with scheduledStartAt = "2026-08-15T14:00:00+07:00" (Jakarta)
2. Verify stored time is consistent
3. GET event as student in Asia/Bangkok timezone (+07:00)
4. Verify frontend converts and displays: 14:00 (same zone) or 15:00 Bangkok

**Expected Result:** Timezone handled correctly

**Pass Criteria:**
- [ ] Stored time correct
- [ ] Frontend displays local time

---

## 11. TEST CASES: RESULTS DISPLAY & ANALYTICS (F008-F009)

### TC-701: View Submission Results - Student

**Objective:** Verify student can view own submission results

**Preconditions:**
- Submission graded
- Student logged in

**Test Steps:**
1. GET `/api/v1/submissions/{submissionId}/results`
2. Verify response status: **200 OK**
3. Verify response includes:
   ```json
   {
     "score": 75,
     "scorePercentage": 75.0,
     "isPassed": true,
     "totalPoints": 15,
     "earnedPoints": 15,
     "answers": [
       { "questionId": "q1", "isCorrect": true, "earnedPoints": 5 },
       { "questionId": "q2", "isCorrect": true, "earnedPoints": 5 },
       { "questionId": "q3", "isCorrect": true, "earnedPoints": 5 }
     ]
   }
   ```

**Expected Result:** Student sees detailed results

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] All answer details included

---

### TC-702: View Results - Show Correct Answers

**Objective:** Verify correct answers displayed if quiz config allows

**Preconditions:**
- Quiz with show_correct_answers = true
- Submission graded

**Test Steps:**
1. GET `/api/v1/submissions/{submissionId}/results`
2. Verify response includes: `correctAnswer` for each question
3. Verify quiz with show_correct_answers = false hides correct answers

**Expected Result:** Correct answers shown/hidden based on config

**Pass Criteria:**
- [ ] If show_correct_answers=true: correctAnswer included
- [ ] If show_correct_answers=false: correctAnswer excluded

---

### TC-703: View Results - Cannot See Others' Submissions

**Objective:** Verify student cannot access others' results

**Preconditions:**
- Student A trying to access Student B's submission

**Test Steps:**
1. Student A logged in
2. GET `/api/v1/submissions/{student_b_submission_id}`
3. Verify response status: **404 Not Found**

**Expected Result:** Cannot access others' results

**Pass Criteria:**
- [ ] HTTP 404 status

---

### TC-704: Instructor View - All Student Results

**Objective:** Verify instructor can view all results for their quiz

**Preconditions:**
- Instructor created quiz
- Multiple students submitted

**Test Steps:**
1. Instructor logged in
2. GET `/api/v1/quizzes/{quizId}/submissions`
3. Verify response includes all submissions with scores
4. Verify only own quizzes shown (not others' quizzes)

**Expected Result:** Instructor sees all student results for own quiz

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] All submissions for quiz returned
- [ ] Instructor cannot see others' quizzes

---

### TC-705: Analytics - Quiz Performance Summary

**Objective:** Verify analytics dashboard shows quiz-level statistics

**Preconditions:**
- Multiple students took quiz
- All graded

**Test Steps:**
1. GET `/api/v1/quizzes/{quizId}/analytics`
2. Verify response includes:
   ```json
   {
     "totalAttempts": 25,
     "averageScore": 72.4,
     "medianScore": 75,
     "passRate": 0.84,
     "failRate": 0.16,
     "minScore": 45,
     "maxScore": 98,
     "standardDeviation": 12.3
   }
   ```

**Expected Result:** Quiz analytics calculated correctly

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Statistics calculated correctly

---

### TC-706: Analytics - Per-Question Difficulty

**Objective:** Verify system tracks question difficulty

**Preconditions:**
- 20 students took quiz

**Test Steps:**
1. GET `/api/v1/quizzes/{quizId}/analytics/questions`
2. Verify response includes per-question stats:
   ```json
   {
     "questionId": "q1",
     "questionText": "What is 2+2?",
     "correctCount": 18,
     "totalAttempts": 20,
     "correctPercentage": 90,
     "difficulty": "easy"
   }
   ```

**Expected Result:** Question difficulty calculated

**Pass Criteria:**
- [ ] correctPercentage = (18/20) * 100 = 90%
- [ ] difficulty = "easy" (90%+ correct)

---

### TC-707: Analytics - Progression Over Time

**Objective:** Verify analytics show student progress trends

**Preconditions:**
- Student took same quiz 3 times:
  - Attempt 1: 60%
  - Attempt 2: 70%
  - Attempt 3: 85%

**Test Steps:**
1. GET `/api/v1/submissions?studentId={studentId}&quizId={quizId}`
2. Verify response returns all 3 submissions in chronological order
3. Verify scorePercentage progression: 60 → 70 → 85

**Expected Result:** Progress trends visible

**Pass Criteria:**
- [ ] All submissions returned
- [ ] Scores show improvement

---

### TC-708: Analytics - No Data Handling

**Objective:** Verify analytics gracefully handle empty datasets

**Preconditions:**
- Quiz published, no submissions yet

**Test Steps:**
1. GET `/api/v1/quizzes/{quizId}/analytics`
2. Verify response status: **200 OK**
3. Verify response includes: `{ message: "No submissions yet", submissions: [] }`

**Expected Result:** Empty analytics handled gracefully

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Clear message that no data available

---

### TC-709: Analytics - Student Cannot View Class Analytics

**Objective:** Verify students cannot access aggregate analytics

**Preconditions:**
- Student logged in

**Test Steps:**
1. GET `/api/v1/quizzes/{quizId}/analytics`
2. Verify response status: **403 Forbidden**

**Expected Result:** Student cannot view class-level analytics

**Pass Criteria:**
- [ ] HTTP 403 status

---

### TC-710: Export Results to CSV

**Objective:** Verify instructor can export results

**Preconditions:**
- 10 submissions for quiz

**Test Steps:**
1. GET `/api/v1/quizzes/{quizId}/submissions/export?format=csv`
2. Verify response status: **200 OK**
3. Verify content-type: `text/csv`
4. Verify CSV contains columns: StudentID, Email, Score, PassFail, SubmittedAt
5. Verify 10 data rows (+ 1 header row)

**Expected Result:** CSV export works

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Valid CSV format
- [ ] 10 students exported

---

## 12. TEST CASES: ADMIN MANAGEMENT & AUDIT (F010-F011)

### TC-801: Admin View All Users

**Objective:** Verify admin can view all users in system

**Preconditions:**
- Admin logged in
- 100+ users in system

**Test Steps:**
1. GET `/api/v1/admin/users` (paginated)
2. Verify response status: **200 OK**
3. Verify response includes first 20 users with pagination
4. Verify fields: userId, email, role, status, createdAt, lastLoginAt

**Expected Result:** Admin sees all users

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] Pagination working (page 1 of 5)

---

### TC-802: Admin Suspend User

**Objective:** Verify admin can suspend user account

**Preconditions:**
- User account active

**Test Steps:**
1. PATCH `/api/v1/admin/users/{userId}` with `status: "suspended"`
2. Verify response status: **200 OK**
3. Verify user.status in database = "suspended"
4. Attempt login as suspended user
5. Verify response status: **403 Forbidden** with message: "Account suspended"

**Expected Result:** User cannot login after suspension

**Pass Criteria:**
- [ ] User status updated
- [ ] Login fails for suspended user

---

### TC-803: Admin Delete User (Soft Delete)

**Objective:** Verify admin can soft-delete user

**Preconditions:**
- User exists

**Test Steps:**
1. DELETE `/api/v1/admin/users/{userId}`
2. Verify response status: **200 OK**
3. Verify user.deleted_at timestamp set in database
4. Verify user NOT returned in GET `/api/v1/admin/users` (soft delete)
5. Verify submissions still exist (referential integrity)

**Expected Result:** User soft-deleted, data preserved

**Pass Criteria:**
- [ ] deleted_at set
- [ ] User not visible in user list
- [ ] Submissions not deleted

---

### TC-804: Audit Log - Record Creation

**Objective:** Verify all user actions logged

**Preconditions:**
- User creates a quiz

**Test Steps:**
1. POST `/api/v1/quizzes` with quiz data
2. Verify quiz created (response 201)
3. Query audit_logs table:
   ```sql
   SELECT * FROM audit_logs 
   WHERE actor_id = $1 
   ORDER BY created_at DESC LIMIT 1
   ```
4. Verify audit log entry:
   - table_name = "quizzes"
   - operation = "INSERT"
   - actor_id = current user
   - record_data contains quiz JSON
   - timestamp accurate

**Expected Result:** Creation logged

**Pass Criteria:**
- [ ] Audit log created
- [ ] Fields populated correctly

---

### TC-805: Audit Log - Record Modification

**Objective:** Verify updates logged with before/after values

**Preconditions:**
- Quiz exists

**Test Steps:**
1. PATCH `/api/v1/quizzes/{quizId}` with new title
2. Query audit_logs:
   ```sql
   SELECT * FROM audit_logs 
   WHERE record_id = $1 AND table_name = 'quizzes'
   ORDER BY created_at DESC LIMIT 1
   ```
3. Verify audit log entry:
   - operation = "UPDATE"
   - old_values = old quiz data
   - new_values = new quiz data
   - Changes tracked: title field

**Expected Result:** Update logged with before/after

**Pass Criteria:**
- [ ] Audit log created with UPDATE operation
- [ ] old_values and new_values populated

---

### TC-806: Audit Log Immutability

**Objective:** Verify audit logs cannot be modified or deleted

**Preconditions:**
- Audit logs exist

**Test Steps:**
1. Attempt UPDATE audit_logs SET record_data = '{}' WHERE id = $1
2. Verify query fails (trigger prevents modification)
3. Attempt DELETE FROM audit_logs WHERE id = $1
4. Verify query fails (trigger prevents deletion)

**Expected Result:** Audit logs immutable

**Pass Criteria:**
- [ ] Cannot update audit_logs
- [ ] Cannot delete audit_logs

---

### TC-807: View Audit Trail - Admin

**Objective:** Verify admin can view audit trail for compliance

**Preconditions:**
- Admin logged in
- Audit logs exist

**Test Steps:**
1. GET `/api/v1/admin/audit-logs?entityType=quizzes&entityId={quizId}`
2. Verify response includes full history of changes to quiz
3. Verify each entry shows: timestamp, actor, operation, old_values, new_values

**Expected Result:** Complete audit trail visible

**Pass Criteria:**
- [ ] HTTP 200 status
- [ ] All changes listed chronologically

---

### TC-808: Notifications - Submission Graded

**Objective:** Verify student notified when submission graded

**Preconditions:**
- Submission submitted, grading complete

**Test Steps:**
1. Submission graded automatically
2. System creates notification: `{ type: "submission_graded", studentId, submissionId, score }`
3. GET `/api/v1/notifications` as student
4. Verify notification includes: "Your quiz 'English Proficiency Quiz' has been graded. Score: 75%"

**Expected Result:** Student receives grading notification

**Pass Criteria:**
- [ ] Notification created
- [ ] Student can see notification

---

## 13. NON-FUNCTIONAL TESTING

### Performance Testing

#### TP-1001: API Response Time - Baseline Measurement

**Objective:** Establish performance baseline

**Test Steps:**
1. Run load test with 1 concurrent user
2. Measure response times for key endpoints:
   - GET `/api/v1/quizzes` - should be <200ms
   - POST `/api/v1/submissions/{submissionId}/answers` - should be <100ms
   - GET `/api/v1/submissions/{submissionId}/results` - should be <300ms
3. Capture p50, p95, p99 latencies

**Pass Criteria:**
- [ ] All endpoints <300ms for p95 latency

---

#### TP-1002: Page Load Time - Landing Page

**Objective:** Verify landing page loads quickly

**Test Steps:**
1. Access `https://eduflow.dev` with cold cache
2. Measure: First Contentful Paint (FCP), Largest Contentful Paint (LCP), Time to Interactive (TTI)
3. Run Lighthouse audit

**Pass Criteria:**
- [ ] FCP <1.5s
- [ ] LCP <2.5s
- [ ] TTI <3s
- [ ] Lighthouse score >90

---

#### TP-1003: Load Testing - 50 Concurrent Users

**Objective:** Verify system handles expected load

**Test Steps:**
1. Load test with K6 or JMeter: 50 concurrent users
2. Each user: takes 1 quiz (30 API calls)
3. Measure:
   - Response time distribution
   - Error rate
   - Throughput (requests/second)
   - Database connections

**Pass Criteria:**
- [ ] <300ms p95 latency at 50 concurrent users
- [ ] <1% error rate
- [ ] >50 requests/second throughput

---

#### TP-1004: Load Testing - 100 Concurrent Users

**Objective:** Verify system handles spike load

**Test Steps:**
1. Load test with 100 concurrent users
2. Monitor for:
   - Breaking point (where errors increase significantly)
   - Database connection exhaustion
   - API timeouts

**Pass Criteria:**
- [ ] System remains stable at 100 concurrent users
- [ ] <5% error rate (acceptable for spike)

---

#### TP-1005: Database Query Performance

**Objective:** Verify queries complete within acceptable time

**Test Steps:**
1. Enable query logging (PostgreSQL log_duration)
2. Run key queries:
   ```sql
   SELECT * FROM submissions WHERE quiz_id = $1;
   SELECT * FROM answers WHERE submission_id = $1;
   SELECT * FROM analytics WHERE quiz_id = $1;
   ```
3. Verify each query <100ms (with indexes)

**Pass Criteria:**
- [ ] All queries <100ms
- [ ] Indexes used (EXPLAIN ANALYZE confirms)

---

#### TP-1006: Large Submission Handling

**Objective:** Verify system handles large quiz (100 questions)

**Test Steps:**
1. Create quiz with 100 questions
2. Student submits answers to all 100 questions
3. Verify:
   - Submission completes without timeout
   - Grading completes in <5 seconds
   - All 100 answers stored correctly

**Pass Criteria:**
- [ ] No timeouts
- [ ] Grading <5 seconds
- [ ] 100 answers in database

---

### Scalability Testing

#### SC-1001: Database Scalability - 10K Users

**Objective:** Verify schema scales to 10K users

**Test Steps:**
1. Load test database: 10K users, 100K quiz submissions, 500K answers
2. Run key queries and measure performance
3. Verify indexes prevent N+1 queries

**Pass Criteria:**
- [ ] Queries still perform <100ms with 10K users
- [ ] No connection pool exhaustion

---

#### SC-1002: API Horizontal Scaling - Multiple Instances

**Objective:** Verify API can scale horizontally

**Test Steps:**
1. Deploy 2 API instances behind load balancer
2. Run 100 concurrent user load test
3. Verify load balanced between instances
4. Verify no session loss (stateless JWT)

**Pass Criteria:**
- [ ] Load balanced correctly
- [ ] No 502 Bad Gateway errors

---

### Reliability Testing

#### RE-1001: Uptime Monitoring

**Objective:** Track system uptime

**Test Steps:**
1. Deploy uptime monitoring (Uptime Robot)
2. Check `/api/v1/health` endpoint every 5 minutes
3. Track uptime percentage over 2-week period

**Pass Criteria:**
- [ ] >99.5% uptime (52 minutes downtime/month acceptable)

---

#### RE-1002: Graceful Degradation - Database Unavailable

**Objective:** Verify API handles database down gracefully

**Test Steps:**
1. Kill database connection (simulate down)
2. Send request to API
3. Verify response status: **503 Service Unavailable**
4. Verify error message: "Service temporarily unavailable"
5. Verify no 500 errors (not "unhandled exception")

**Pass Criteria:**
- [ ] HTTP 503 returned
- [ ] Graceful error message

---

#### RE-1003: Retry Logic - Transient Errors

**Objective:** Verify system retries transient failures

**Test Steps:**
1. Simulate network timeout on grading service
2. First attempt fails
3. System retries (exponential backoff)
4. 2nd or 3rd attempt succeeds

**Pass Criteria:**
- [ ] Submission eventually succeeds (not stuck)
- [ ] Audit log shows retries

---

---

## 14. SECURITY TESTING CHECKLIST

### Authentication Security

- [ ] **TC-SEC-001:** Password stored as bcrypt hash (verify with `$2b$12$` prefix)
- [ ] **TC-SEC-002:** Password minimum 8 characters enforced
- [ ] **TC-SEC-003:** Password requires mix of uppercase, lowercase, numbers, symbols
- [ ] **TC-SEC-004:** Login rate limiting (max 5 attempts/minute per IP)
- [ ] **TC-SEC-005:** Account lockout after N failed attempts (temp 15 min)
- [ ] **TC-SEC-006:** JWT token signed with HMAC-SHA256
- [ ] **TC-SEC-007:** JWT token expires in 24 hours (configurable)
- [ ] **TC-SEC-008:** Refresh token expires in 7 days
- [ ] **TC-SEC-009:** Cannot forge JWT without secret key
- [ ] **TC-SEC-010:** Session management: stateless (no server-side sessions for MVP)

### Authorization (RBAC)

- [ ] **TC-SEC-011:** Student cannot access admin endpoints
- [ ] **TC-SEC-012:** Student cannot view other students' submissions
- [ ] **TC-SEC-013:** Instructor cannot delete users
- [ ] **TC-SEC-014:** Instructor can only edit own quizzes
- [ ] **TC-SEC-015:** Admin can perform all actions
- [ ] **TC-SEC-016:** Role immutable after creation (only DB admin can change)

### Data Protection

- [ ] **TC-SEC-017:** Password_hash never returned in API responses
- [ ] **TC-SEC-018:** HTTPS/TLS enforced for all endpoints (not HTTP)
- [ ] **TC-SEC-019:** CORS configured to allow only trusted origins
- [ ] **TC-SEC-020:** Soft deletes preserve data (never hard delete user/submission)
- [ ] **TC-SEC-021:** Audit logs immutable (cannot delete/modify)
- [ ] **TC-SEC-022:** PII (email, names) encrypted in transit

### API Security

- [ ] **TC-SEC-023:** SQL injection prevented (parameterized queries via ORM)
- [ ] **TC-SEC-024:** XSS prevented (React auto-escapes, no dangerouslySetInnerHTML)
- [ ] **TC-SEC-025:** CSRF tokens not needed (stateless JWT, SameSite cookies)
- [ ] **TC-SEC-026:** Input validation on all endpoints (Zod schemas)
- [ ] **TC-SEC-027:** Rate limiting per user (e.g., 500 req/min)
- [ ] **TC-SEC-028:** Rate limiting per IP (e.g., 1000 req/min)
- [ ] **TC-SEC-029:** No sensitive data in error messages (generic "Invalid credentials")
- [ ] **TC-SEC-030:** No sensitive data in logs (PII redacted)

### Dependency Security

- [ ] **TC-SEC-031:** npm audit passes (no critical vulnerabilities)
- [ ] **TC-SEC-032:** Dependency versions pinned (no ^ or ~)
- [ ] **TC-SEC-033:** Node.js LTS version used (18.x)

---

## 15. API CONTRACT VALIDATION

### Request Validation

- [ ] **TC-API-001:** All requests validated against Zod schema
- [ ] **TC-API-002:** Missing required fields return 400 with field-level errors
- [ ] **TC-API-003:** Invalid JSON returns 400 "Malformed request"
- [ ] **TC-API-004:** Unsupported HTTP method returns 405 Method Not Allowed

### Response Validation

- [ ] **TC-API-005:** All responses follow consistent JSON structure (success, data, meta)
- [ ] **TC-API-006:** Success status codes: 200, 201, 202, 204
- [ ] **TC-API-007:** Error status codes: 400, 401, 403, 404, 409, 422, 500
- [ ] **TC-API-008:** Error response includes code and message
- [ ] **TC-API-009:** meta.timestamp in ISO 8601 format

### Endpoint Contract Testing

- [ ] **TC-API-010:** POST /auth/register matches contract
- [ ] **TC-API-011:** POST /auth/login matches contract
- [ ] **TC-API-012:** GET /quizzes matches contract
- [ ] **TC-API-013:** POST /quizzes matches contract
- [ ] **TC-API-014:** POST /submissions matches contract
- [ ] **TC-API-015:** GET /submissions/:id matches contract
- [ ] *All 40+ endpoints tested against API_CONTRACT.md*

---

## 16. DATABASE INTEGRITY TESTING

### Schema Validation

- [ ] **TC-DB-001:** All tables exist (users, quizzes, questions, options, submissions, answers, events, analytics, audit_logs)
- [ ] **TC-DB-002:** All enums defined (user_role, quiz_type, question_type, etc.)
- [ ] **TC-DB-003:** Primary keys on all tables
- [ ] **TC-DB-004:** Foreign key constraints enforced
- [ ] **TC-DB-005:** Unique constraints enforced (email unique, etc.)
- [ ] **TC-DB-006:** Check constraints enforced (passing_score 0-100, etc.)

### Data Integrity

- [ ] **TC-DB-007:** No orphaned submissions (all reference valid quiz_id)
- [ ] **TC-DB-008:** No orphaned answers (all reference valid submission_id)
- [ ] **TC-DB-009:** Referential integrity maintained on DELETE (cascade/restrict)
- [ ] **TC-DB-010:** Soft deletes: deleted_at set, NOT removed

### Row-Level Security (RLS)

- [ ] **TC-DB-011:** Student query SELECT * FROM submissions returns only own submissions
- [ ] **TC-DB-012:** Instructor query returns only own quizzes
- [ ] **TC-DB-013:** Admin query returns all data

### Performance

- [ ] **TC-DB-014:** Indexes exist on all filter/sort columns
- [ ] **TC-DB-015:** N+1 queries avoided (bulk loads used)
- [ ] **TC-DB-016:** Query plans optimized (EXPLAIN ANALYZE)

---

## 17. INTEGRATION TESTING

### Feature Integration - F001 + F002

**TC-INT-001:** User Registration → Create Quiz
- Register new instructor
- Immediately create quiz
- Verify quiz.instructor_id = newly created user

**Expected Result:** Quiz created by registered user

---

### Feature Integration - F002 + F005

**TC-INT-002:** Create Quiz → Student Submits
- Instructor creates and publishes quiz
- Student starts quiz (creates submission)
- Student submits answers
- Verify submission.quiz_id links to correct quiz

**Expected Result:** Submission linked to quiz

---

### Feature Integration - F005 + F004 + F008

**TC-INT-003:** Submit Quiz → Auto-Grade → View Results
- Student submits completed quiz
- Grading service processes (auto-grades)
- Student views results
- Verify score calculated correctly

**Expected Result:** Full pipeline works

---

### Feature Integration - F007 + F005

**TC-INT-004:** Event Scheduling → Quiz Submission
- Instructor schedules event
- Students register
- Event deadline enforced on submission
- Verify late submissions rejected

**Expected Result:** Event-based constraints enforced

---

### Feature Integration - F009 + F005

**TC-INT-005:** Quiz Submission → Analytics Update
- Multiple students submit quiz
- Analytics engine refreshes
- Dashboard shows updated statistics

**Expected Result:** Analytics reflect latest submissions

---

## 18. USER ACCEPTANCE TESTING (UAT)

### Stakeholder Sign-Off

**UAT Participants:**
- Product Manager (Arif)
- End Users (simulated instructors, students)
- Hiring Manager (Education Republic)

**UAT Scenarios:**

#### UAT-001: Instructor Workflow
- [ ] Can register and login
- [ ] Can create quiz with questions
- [ ] Can publish quiz
- [ ] Can schedule event with students
- [ ] Can view student results and analytics
- [ ] Can review and grade essays (if present)

#### UAT-002: Student Workflow
- [ ] Can register and login
- [ ] Can see available quizzes/events
- [ ] Can take quiz (with timer, questions, answers)
- [ ] Can submit and see results immediately
- [ ] Can retry quiz (if allowed)
- [ ] Can view analytics of own performance

#### UAT-003: Admin Workflow
- [ ] Can view all users
- [ ] Can suspend/delete users
- [ ] Can view audit logs
- [ ] Can access admin dashboard

**UAT Sign-Off Gate:**
- [ ] All workflows functional
- [ ] UI intuitive (no confusing flows)
- [ ] Error messages clear
- [ ] Performance acceptable
- [ ] Stakeholder approval: ___________

---

## 19. PERFORMANCE & LOAD TESTING

### Performance Baseline

| Endpoint | Target p95 | Target p99 | Test Date |
|----------|-----------|-----------|-----------|
| GET /quizzes | <200ms | <300ms | TBD |
| POST /submissions | <100ms | <150ms | TBD |
| GET /results | <250ms | <400ms | TBD |
| POST /answers | <50ms | <100ms | TBD |

### Load Test Results

| Test Scenario | Concurrent Users | Error Rate | p95 Latency | Pass/Fail |
|---------------|-----------------|-----------|------------|-----------|
| Baseline | 1 | <0.1% | TBD | ___ |
| Normal Load | 50 | <1% | TBD | ___ |
| Spike Load | 100 | <5% | TBD | ___ |
| Stress Test | 200+ | >10% (find break) | TBD | ___ |

### Database Performance

| Query | Target | Actual | Pass/Fail |
|-------|--------|--------|-----------|
| SELECT submissions WHERE quiz_id | <100ms | ___ | ___ |
| SELECT answers WHERE submission_id | <50ms | ___ | ___ |
| Analytics aggregate query | <500ms | ___ | ___ |

---

## 20. TEST REPORTING & SIGN-OFF

### Test Execution Summary

**Test Period:** Week 1-6 (parallel with development)

**Test Environment:**
- Database: PostgreSQL (staging)
- Backend: Node.js (staging)
- Frontend: React (staging)

**Test Coverage:**

| Category | Total Test Cases | Passed | Failed | Pass % |
|----------|-----------------|--------|--------|---------|
| Functional (F001-F012) | 150+ | ___ | ___ | ___ |
| Non-Functional | 30+ | ___ | ___ | ___ |
| Security | 35+ | ___ | ___ | ___ |
| API Contract | 40+ | ___ | ___ | ___ |
| Database | 20+ | ___ | ___ | ___ |
| **TOTAL** | **275+** | ___ | ___ | **__%** |

**Pass Criteria:**
- [ ] >95% test pass rate
- [ ] 0 critical bugs
- [ ] <5 high-severity bugs
- [ ] All security tests passing

### Bug Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | ✅ |
| High | <5 | ✅ |
| Medium | <10 | ⚠️ |
| Low | <15 | ⚠️ |

### Defect Resolution

- [ ] All critical bugs fixed
- [ ] All high-severity bugs resolved or documented
- [ ] Medium/low bugs tracked in backlog

### Release Approval

**Quality Gate Sign-Off:**

| Gate | Status | Approver | Date |
|------|--------|----------|------|
| **Gate 1: Functional Coverage** | ✅ | QA Lead | ___ |
| **Gate 2: Code Quality** | ✅ | Tech Lead | ___ |
| **Gate 3: Security** | ✅ | Security | ___ |
| **Gate 4: Performance** | ✅ | DevOps | ___ |
| **Gate 5: UAT Sign-Off** | ✅ | PM | ___ |

**Final Approval:**

| Role | Name | Date | Sign-Off |
|------|------|------|----------|
| QA Manager | Arif | ___ | _____ |
| Product Manager | Arif | ___ | _____ |
| Tech Lead | Arif | ___ | _____ |

### Production Readiness Checklist

- [ ] All test gates passed
- [ ] Code deployed to staging environment
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Backups verified and tested
- [ ] Runbooks created for on-call support
- [ ] Monitoring configured (Sentry, uptime)
- [ ] Documentation complete
- [ ] Stakeholders trained
- [ ] Go-live plan reviewed

**Status:** ✅ READY FOR PRODUCTION | ⚠️ CONDITIONAL | ❌ NOT READY

---

## 📝 APPENDIX: TEST DATA FIXTURES

### Sample Test Users

```json
{
  "admin": {
    "email": "admin@eduflow.test",
    "password": "AdminPass123!",
    "role": "admin"
  },
  "instructor": {
    "email": "instructor@eduflow.test",
    "password": "InstructorPass123!",
    "role": "instructor"
  },
  "student": {
    "email": "student@eduflow.test",
    "password": "StudentPass123!",
    "role": "student"
  }
}
```

### Sample Quiz Data

```json
{
  "title": "English Proficiency Test",
  "durationMinutes": 60,
  "passingScore": 70,
  "questions": [
    {
      "text": "What is 2+2?",
      "type": "mcq",
      "points": 2,
      "options": [
        { "text": "3", "isCorrect": false },
        { "text": "4", "isCorrect": true }
      ]
    }
  ]
}
```

---

## 🔄 VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| **v1.0** | 2026-07-28 | M. Arif Aulia (QA) | Initial STP: all 12 features covered, comprehensive test cases, acceptance criteria |

---

## ✅ APPROVAL & SIGN-OFF

| Role | Name | Date | Status | Notes |
|------|------|------|--------|-------|
| QA Lead | Arif | 2026-07-28 | ✅ Approved | STP complete, ready for implementation |
| Tech Lead | Arif | 2026-07-28 | ✅ Approved | Test strategy aligns with TDD & architecture |
| Product Manager | Arif | 2026-07-28 | ✅ Approved | All PRD requirements covered in test cases |

**Overall Status:** ✅ **APPROVED & READY FOR TESTING**

---

*STP.md v1.0 | EduFlow Portfolio Project | System Test Plan | Quality Assurance Perspective*

*Last Updated: 2026-07-28 | All 12 Core Features (F001-F012) Covered | 275+ Test Cases*

*Next: Execute test cases parallel with development | Target completion: Week 6*
