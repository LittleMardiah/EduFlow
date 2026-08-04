# LOGIC FLOW - EduFlow

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*Complete Workflow Documentation: User Interactions, Data Flows, State Machines, Algorithm Logic*

*For Solo Developer - Production Grade | Portfolio Project*

---

## 📌 DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Type** | Logic Flow & Workflow Specification |
| **Document Version** | v1.0 |
| **Created Date** | 2026-07-28 |
| **Last Updated** | 2026-07-28 |
| **Author** | M. Arif Aulia |
| **Status** | ✅ Complete & Ready for UI/UX Design |
| **Related Documents** | PRD.md (requirements), DATABASE_SCHEMA.md (data model) |
| **Scope** | Covers all 12 core features (F001-F012) |

---

## 📋 EXECUTIVE SUMMARY

This document maps all user-facing workflows, system-level data flows, state machines, and business logic algorithms. It bridges PRD (what to build) and DATABASE_SCHEMA (how to store), defining **how** the system works.

**Document serves as:**
1. **Blueprint for frontend developers** (page flows, user interactions)
2. **Blueprint for backend developers** (API request/response flows, business logic)
3. **Reference for QA** (test scenarios, edge cases, validation rules)
4. **Portfolio artifact** (demonstrates systems thinking & design rigor)

---

## 🗂️ TABLE OF CONTENTS

1. [Core System Architecture](#core-system-architecture)
2. [Authentication & Authorization Flow](#authentication--authorization-flow)
3. [Quiz Management Workflow](#quiz-management-workflow)
4. [Quiz Submission & Auto-Grading](#quiz-submission--auto-grading)
5. [Event-Based Testing](#event-based-testing)
6. [IELTS Simulation Mode](#ielts-simulation-mode)
7. [Analytics & Reporting](#analytics--reporting)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [State Machines](#state-machines)
10. [Algorithm Logic](#algorithm-logic)
11. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## 🏗️ CORE SYSTEM ARCHITECTURE

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 18)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Pages   │  │ Admin Panel   │  │ Student Apps │     │
│  │ (Login/Reg)  │  │ (User Mgmt)   │  │ (Quiz Taking)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ (REST API)
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Layer (Controllers)                   │ │
│  │  /auth, /quizzes, /submissions, /events, /analytics  │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Business Logic Layer (Services)          │ │
│  │  AuthService, QuizService, GradingService, etc.      │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Data Access Layer (Repositories)           │ │
│  │  UserRepository, QuizRepository, SubmissionRepo, etc. │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ (SQL)
┌─────────────────────────────────────────────────────────────┐
│            DATABASE (PostgreSQL via Supabase)               │
│  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐       │
│  │ users    │ │ quizzes│ │ questions│ │submissions       │
│  └──────────┘ └────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐               │
│  │ events   │ │ analytics  │ │ audit_logs             │
│  └──────────┘ └────────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Sequence

```
User Action
    ↓
Frontend (React)
    ↓
HTTP Request (REST API)
    ↓
Backend API Layer (Express Controller)
    ├─ Validate JWT token
    ├─ Check role-based permissions (RBAC)
    ├─ Validate request body (Zod schema)
    ↓
Business Logic Layer (Service)
    ├─ Execute core logic
    ├─ Apply business rules
    ├─ Coordinate multi-table operations
    ↓
Data Access Layer (Repository)
    ├─ Build parameterized SQL queries
    ├─ Fetch/update from database
    ↓
Database (PostgreSQL)
    ├─ Execute query
    ├─ Apply Row-Level Security (RLS)
    ↓
Backend (Response Building)
    ├─ Format response JSON
    ├─ Log to audit_logs (if data change)
    ↓
Frontend (React)
    ├─ Parse response
    ├─ Update state
    ├─ Re-render UI
    ↓
User sees result
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION FLOW

### F001: Complete Auth Workflow

#### 1. **User Registration**

```
User Inputs: email, password, name, role
    ↓
Frontend POST /auth/register
    {
      email: "student@example.com",
      password: "SecurePass123!",
      firstName: "John",
      lastName: "Doe",
      role: "student" // or "instructor"
    }
    ↓
Backend AuthController.register()
    ├─ Validate email format (regex)
    ├─ Validate password strength (8+ chars, 1 uppercase, 1 number, 1 special)
    ├─ Check if email already exists (query users table)
    │  └─ If exists: return 409 Conflict "Email already registered"
    ├─ Hash password with bcrypt (12 rounds)
    ├─ Create user record:
    │  INSERT INTO users (email, password_hash, first_name, last_name, role, status)
    │  VALUES ($1, $2, $3, $4, $5, 'active')
    ├─ Generate verification email link (JWT token valid 24h)
    ├─ Send verification email (future: SendGrid integration)
    └─ Return user object (without password_hash)
    ↓
Frontend receives response
    ├─ Show success message: "Registration successful! Check your email."
    ├─ Redirect to login page after 3 seconds
    ↓
User Logs In (see below)
```

#### 2. **User Login**

```
User Inputs: email, password
    ↓
Frontend POST /auth/login
    {
      email: "student@example.com",
      password: "SecurePass123!"
    }
    ↓
Backend AuthController.login()
    ├─ Query users table: SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL
    │  └─ If not found: return 401 "Invalid email or password" (no email confirmation leak)
    ├─ Retrieve password_hash from database
    ├─ Compare submitted password with hash: await bcrypt.compare(password, hash)
    │  └─ If no match: return 401 "Invalid email or password"
    ├─ Generate JWT token:
    │  {
    │    sub: user.id,
    │    email: user.email,
    │    role: user.role, // "admin" | "instructor" | "student"
    │    iat: now(),
    │    exp: now() + 24h
    │  }
    │  Signed with: process.env.JWT_SECRET
    ├─ Update last_login_at: UPDATE users SET last_login_at = NOW() WHERE id = $1
    ├─ Set httpOnly cookie: Set-Cookie: token=${JWT}; HttpOnly; Secure; SameSite=Strict
    └─ Return response:
       {
         token: "eyJhbGc...",
         user: { id, email, firstName, lastName, role },
         expiresIn: 86400 (seconds)
       }
    ↓
Frontend receives token
    ├─ Store in httpOnly cookie (automatic via Set-Cookie)
    ├─ Update Redux/Context: currentUser = user, isAuthenticated = true
    ├─ Redirect to dashboard (/dashboard if student, /instructor/dashboard if instructor)
    ↓
User is logged in
```

#### 3. **JWT Verification (on every API call)**

```
Frontend makes API request to GET /quizzes with Authorization header
    {
      Authorization: "Bearer eyJhbGc..."
    }
    ↓
Backend Middleware: authMiddleware()
    ├─ Extract token from Authorization header
    ├─ Verify JWT signature: jwt.verify(token, JWT_SECRET)
    │  └─ If invalid/expired: return 401 "Unauthorized. Token expired, please login again."
    ├─ Extract payload: { sub: userId, role, exp }
    ├─ Attach user object to request: req.user = { id: userId, role, ... }
    ├─ Call next middleware
    ↓
Backend Controller receives request with req.user
    ├─ req.user.id is now available for data isolation
    └─ Access control checks use req.user.role
```

#### 4. **Role-Based Access Control (RBAC)**

```
Instructor attempts to access /admin/users
    ↓
Frontend (or backend route guard) checks req.user.role
    ├─ If role !== "admin": return 403 "Forbidden. Only admins can access this."
    ↓
Admin accesses /admin/users
    ├─ Backend AuthController checks RBAC rules:
    │  {
    │    "admin": ["view_users", "edit_users", "delete_users", "create_quizzes"],
    │    "instructor": ["create_quizzes", "view_own_quizzes", "grade_submissions"],
    │    "student": ["view_own_submissions", "take_quizzes"]
    │  }
    ├─ If req.user.role in allowed_roles: proceed
    └─ Else: return 403 Forbidden
```

#### 5. **Logout / Token Expiry**

```
User clicks "Logout"
    ↓
Frontend clears cookie + Redux state
    ├─ Clear Authorization header
    ├─ dispatch(logout())
    ├─ Redirect to /login
    ↓
No action needed on backend (stateless JWT)
    
OR Token expires (24 hours)
    ↓
Frontend detects 401 on any API call
    ├─ Show modal: "Your session expired. Please login again."
    ├─ Redirect to /login
    ├─ Clear stored credentials
```

### RBAC Matrix (Who can do what)

| Action | Admin | Instructor | Student |
|--------|-------|------------|---------|
| Create quiz | ✅ | ✅ | ❌ |
| Edit own quiz | ✅ | ✅ | ❌ |
| Edit other's quiz | ✅ | ❌ | ❌ |
| Delete quiz | ✅ | ❌ | ❌ |
| View all quizzes | ✅ | Own only | Assigned only |
| Create event | ✅ | ✅ | ❌ |
| Schedule event | ✅ | ✅ | ❌ |
| Take quiz | ✅ | ✅ | ✅ |
| View own submissions | ✅ | ✅ | ✅ |
| View others' submissions | ✅ | Own class | ❌ |
| View analytics | ✅ | Own quizzes | Own results |
| Manage users | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

---

## 📝 QUIZ MANAGEMENT WORKFLOW

### F002 & F003: Create Quiz with Questions

```
Instructor navigates to /instructor/quizzes/create
    ↓
Frontend renders QuizBuilder component
    ├─ Form: Quiz Title, Description, Duration (min), Passing Score (%)
    ├─ Config: Allow Retake? Randomize Questions? Show Answers?
    └─ State in React: quizForm = { title, description, ... }
    ↓
Instructor enters quiz metadata and clicks "Next"
    ↓
Frontend transitions to QuestionBuilder
    ├─ Shows: "Questions (0/5 minimum required before publish)"
    ├─ "Add Question" button
    ↓
Instructor clicks "Add Question"
    ├─ Modal opens: Select Question Type
    │  Options: MCQ | True/False | Short Answer
    ├─ Instructor selects: MCQ
    ├─ Form renders:
    │  - Question Text (textarea)
    │  - Options (4 input fields + "Add Option" button)
    │  - Correct Answer(s) (checkboxes to mark correct)
    │  - Points (default 1)
    │  - Explanation (optional)
    │  - Difficulty (easy/medium/hard)
    ↓
Instructor fills question and clicks "Add Question"
    ↓
Frontend validates:
    ├─ Question Text not empty: ✅
    ├─ At least 2 options: ✅
    ├─ Correct answer selected: ✅
    ├─ All required fields: ✅
    ↓
Frontend stores in local state:
    questions = [
      {
        id: "temp-uuid-1", // Temp until saved to DB
        type: "mcq",
        text: "What is the capital of France?",
        options: [
          { id: "opt-1", text: "London" },
          { id: "opt-2", text: "Paris", isCorrect: true },
          { id: "opt-3", text: "Berlin" },
          { id: "opt-4", text: "Madrid" }
        ],
        correctAnswer: ["opt-2"],
        points: 1,
        difficulty: "easy",
        explanation: "Paris is the capital of France."
      }
    ]
    ↓
Instructor repeats "Add Question" 4 more times (total 5 questions)
    ├─ Questions 2-5 can be different types (MCQ, T/F, Short Answer)
    ↓
Instructor clicks "Save Draft"
    ↓
Frontend POST /quizzes with full payload:
    {
      title: "French Capitals Quiz",
      description: "Test your knowledge...",
      durationMinutes: 30,
      passingScore: 60,
      quizType: "standard",
      questions: [
        { type: "mcq", text: "...", options: [...], correctAnswer: [...], points: 1, ... },
        { type: "true_false", text: "...", correctAnswer: true, points: 1, ... },
        { type: "short_answer", text: "...", correctAnswer: "Paris", points: 1, ... },
        ...
      ]
    }
    ↓
Backend QuizController.createQuiz()
    ├─ Validate JWT + role == "instructor" or "admin"
    ├─ Validate request body (Zod schema):
    │  - title: string, 5-200 chars
    │  - durationMinutes: integer, 5-180
    │  - passingScore: 0-100
    │  - questions: array, length 0-500 (allows draft with 0 questions)
    ├─ Transaction START (atomic: quiz + questions created together or neither)
    ├─ INSERT quiz:
    │  INSERT INTO quizzes (title, description, instructor_id, organization_id, quiz_type, 
    │    total_questions, passing_score, duration_minutes, status, current_version)
    │  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', 1)
    │  RETURNING id as quiz_id
    ├─ INSERT quiz_versions (for audit trail):
    │  INSERT INTO quiz_versions (quiz_id, version_number, title, ..., changed_by, change_reason)
    │  VALUES ($1, 1, $2, ..., req.user.id, 'Initial creation')
    ├─ For each question in payload:
    │  INSERT questions (quiz_id, question_text, question_type, correct_answer_config, points, difficulty)
    │  VALUES (...)
    │  RETURNING id as question_id
    ├─ For each question's options (MCQ/T/F only):
    │  INSERT options (question_id, option_text, is_correct)
    │  VALUES (...)
    ├─ Transaction COMMIT
    ├─ Increment total_questions denormalization:
    │  UPDATE quizzes SET total_questions = (SELECT COUNT(*) FROM questions WHERE quiz_id = $1)
    └─ Return response:
       {
         id: "quiz-uuid",
         title: "French Capitals Quiz",
         status: "draft",
         totalQuestions: 5,
         createdAt: "2026-07-28T10:00:00Z"
       }
    ↓
Frontend receives response
    ├─ Update Redux: quizzes = [..., newQuiz]
    ├─ Show toast: "Quiz saved as draft!"
    ├─ Redirect to /instructor/quizzes/:id/edit
```

### Publishing a Quiz

```
Instructor views draft quiz at /instructor/quizzes/{id}
    ├─ Shows: "French Capitals Quiz (Draft)"
    ├─ Shows: "5 questions"
    ├─ "Publish Quiz" button (disabled if < 5 questions)
    ├─ "Edit" button
    ├─ "Delete" button
    ↓
Instructor clicks "Publish Quiz"
    ├─ Confirmation modal: "Once published, you cannot edit this quiz. Are you sure?"
    ├─ Instructor clicks "Confirm"
    ↓
Frontend PATCH /quizzes/{id} with { status: "published" }
    ↓
Backend QuizController.updateQuizStatus()
    ├─ Verify quiz.instructor_id == req.user.id (or req.user.role == "admin")
    ├─ If quiz.status != "draft": return 400 "Only draft quizzes can be published"
    ├─ Verify quiz has >= 5 questions
    ├─ UPDATE quizzes SET status = 'published', published_at = NOW()
    ├─ Create quiz_versions entry: 'Published version 1'
    └─ Return { id, status: "published", publishedAt: "..." }
    ↓
Frontend shows:
    ├─ "Quiz published successfully!"
    ├─ "You can now schedule events using this quiz"
    └─ Show event scheduling quick-start
```

---

## 📊 QUIZ SUBMISSION & AUTO-GRADING

### F005: Student Takes Quiz (Standard Mode)

```
Student navigates to /dashboard
    ├─ Shows list of "Available Quizzes"
    │  (quizzes from scheduled events OR practice quizzes)
    ├─ Sees: "French Capitals Quiz - 30 min - Take Now"
    ├─ Clicks "Take Quiz"
    ↓
Frontend navigates to /quiz/{quizId}/attempt
    ├─ Calls POST /quiz/{quizId}/attempt/start
    ↓
Backend QuizController.startQuizAttempt()
    ├─ Verify student_id from JWT (req.user.id)
    ├─ Fetch quiz: SELECT * FROM quizzes WHERE id = $1
    ├─ Check max_attempts:
    │  SELECT COUNT(*) as attemptCount FROM submissions 
    │  WHERE quiz_id = $1 AND student_id = $2 AND status = 'submitted'
    │  If attemptCount >= quiz.max_attempts AND max_attempts != -1:
    │    return 403 "Max attempts (3) reached for this quiz"
    ├─ Fetch questions + options:
    │  SELECT * FROM questions WHERE quiz_id = $1
    │  SELECT * FROM options WHERE question_id = ANY(...)
    ├─ Randomize question order (if quiz.randomize_questions = true)
    ├─ Randomize MCQ options (if quiz.randomize_options = true)
    ├─ Create submission record:
    │  INSERT INTO submissions (student_id, quiz_id, event_id, status, started_at, attempt_number)
    │  VALUES ($1, $2, $3, 'in_progress', NOW(), $4)
    │  RETURNING id as submission_id
    └─ Return:
       {
         submissionId: "sub-uuid",
         quiz: { id, title, durationMinutes, totalQuestions },
         questions: [
           { id: "q1", type: "mcq", text: "...", options: [...], points: 1 },
           { id: "q2", type: "true_false", text: "...", points: 1 },
           ...
         ],
         expiresAt: now() + durationMinutes
       }
    ↓
Frontend QuizTaker component mounts
    ├─ Stores submissionId + expiresAt
    ├─ Starts countdown timer (frontend calculates remaining seconds)
    ├─ Displays: "Time Remaining: 29:45"
    ├─ Displays: Question 1/5
    │  Text: "What is the capital of France?"
    │  Options (for MCQ):
    │    ☐ London
    │    ☐ Paris
    │    ☐ Berlin
    │    ☐ Madrid
    ├─ "Previous" / "Next" buttons to navigate questions
    ├─ "Submit Quiz" button (visible but disabled until all Qs answered OR student allows empty answers)
    ↓
Student reads Q1, selects "Paris"
    ├─ Frontend stores in component state: selectedAnswers = { q1: "Paris" }
    ├─ Student clicks "Next" → shows Q2
    ├─ Repeats for all 5 questions (can review before submitting)
    ↓
Student sees "Review" tab
    ├─ Shows all questions + answers in summary view
    ├─ Can click to edit any answer
    ├─ Status: "4/5 answered" (Q3 is blank)
    ↓
Student clicks "Submit Quiz"
    ├─ Frontend validation:
    │  if (unansweredCount > 0) show confirmation: "2 questions unanswered. Submit anyway?"
    │  if (student confirms): proceed
    ├─ Frontend POST /submissions/{submissionId}/submit
       {
         answers: [
           { questionId: "q1", studentAnswer: "Paris" },
           { questionId: "q2", studentAnswer: true },
           { questionId: "q3", studentAnswer: "" }, // Unanswered
           { questionId: "q4", studentAnswer: "London" },
           { questionId: "q5", studentAnswer: "The capital is..." }
         ]
       }
    ↓
Backend SubmissionController.submitQuiz()
    ├─ Verify submission_id exists + status = 'in_progress'
    ├─ Update submission record:
    │  UPDATE submissions SET status = 'submitted', submitted_at = NOW()
    ├─ Transaction START
    ├─ For each answer in payload:
    │  INSERT answers (submission_id, question_id, student_answer)
    │  VALUES ($1, $2, $3)
    ├─ Call GradingService.gradeSubmission(submission_id)
    │  [See next section: Auto-Grading]
    ├─ Transaction COMMIT
    └─ Return: { submissionId, redirect: "/results/{submissionId}" }
    ↓
Frontend redirects to /results/{submissionId}
    ├─ Fetches GET /submissions/{submissionId}/results
    └─ [See Results Viewing section below]
```

### F004: Auto-Grading Engine

```
GradingService.gradeSubmission(submission_id) called
    ↓
Transaction START
    ├─ Fetch submission + all answers:
    │  SELECT * FROM submissions WHERE id = $1
    │  SELECT * FROM answers WHERE submission_id = $1
    ├─ Fetch all questions + correct answers + options:
    │  SELECT * FROM questions WHERE quiz_id = submission.quiz_id
    │  SELECT * FROM options WHERE question_id = ANY(...)
    ├─ Initialize: totalPoints = 0, maxPoints = 0
    ├─ For each question in quiz:
    │  │
    │  ├─ CASE question.type:
    │  │
    │  ├─ WHEN "mcq":
    │  │  ├─ Fetch correct options: correctOptions = [opt-2, opt-5]
    │  │  ├─ Fetch student answer: studentAnswer = "opt-2" (or array for multi-select)
    │  │  ├─ Compare:
    │  │  │  if studentAnswer.sort() == correctOptions.sort():
    │  │  │    pointsEarned = question.points
    │  │  │    isCorrect = true
    │  │  │  else:
    │  │  │    pointsEarned = 0
    │  │  │    isCorrect = false
    │  │  ├─ UPDATE answers SET is_correct = $1, points_earned = $2
    │  │  │         WHERE submission_id = $3 AND question_id = $4
    │  │
    │  ├─ WHEN "true_false":
    │  │  ├─ Fetch correct answer: correctAnswer = true
    │  │  ├─ Fetch student answer: studentAnswer = true
    │  │  ├─ Compare:
    │  │  │  if studentAnswer == correctAnswer:
    │  │  │    pointsEarned = question.points
    │  │  │    isCorrect = true
    │  │  │  else:
    │  │  │    pointsEarned = 0
    │  │  │    isCorrect = false
    │  │  ├─ UPDATE answers SET is_correct, points_earned
    │  │
    │  ├─ WHEN "short_answer":
    │  │  ├─ Fetch correct answer: correctAnswer = "Paris"
    │  │  ├─ Fetch student answer: studentAnswer = "paris " (lowercase, extra space)
    │  │  ├─ Normalize both:
    │  │  │  normalizedCorrect = correctAnswer.toLowerCase().trim() = "paris"
    │  │  │  normalizedStudent = studentAnswer.toLowerCase().trim() = "paris"
    │  │  ├─ Compare:
    │  │  │  if normalizedStudent == normalizedCorrect:
    │  │  │    pointsEarned = question.points
    │  │  │    isCorrect = true
    │  │  │  else if (enable_fuzzy_matching):
    │  │  │    similarity = levenshtein(normalizedStudent, normalizedCorrect)
    │  │  │    if similarity > fuzzy_threshold (e.g., 0.85):
    │  │  │      pointsEarned = question.points
    │  │  │      isCorrect = true
    │  │  │    else:
    │  │  │      pointsEarned = 0
    │  │  │      isCorrect = false
    │  │  │  else:
    │  │  │    pointsEarned = 0
    │  │  │    isCorrect = false
    │  │  ├─ UPDATE answers SET is_correct, points_earned
    │  │
    │  └─ WHEN "essay":
    │     ├─ Flag for manual review:
    │     │  UPDATE answers SET is_correct = NULL, grading_status = 'pending_review'
    │     │         WHERE submission_id = $1 AND question_id = $2
    │     ├─ pointsEarned = 0 (no auto points)
    │     ├─ isCorrect = NULL
    │
    │  ├─ Update running totals:
    │  │  totalPoints += pointsEarned
    │  │  maxPoints += question.points
    │
    ├─ Calculate metrics:
    │  scorePercentage = (totalPoints / maxPoints) * 100
    │  isPassed = (scorePercentage >= quiz.passing_score)
    │
    ├─ Update submission record:
    │  UPDATE submissions SET
    │    status = 'graded',
    │    total_score = $1,
    │    score_percentage = $2,
    │    is_passed = $3,
    │    graded_at = NOW()
    │  WHERE id = $4
    │
    ├─ Create analytics entry (for dashboard):
    │  INSERT INTO analytics (student_id, quiz_id, event_id, 
    │    attempt_number, score_percentage, is_passed, time_spent_seconds)
    │  VALUES ($1, $2, $3, $4, $5, $6, $7)
    │  ON CONFLICT (student_id, quiz_id, event_id) DO UPDATE SET
    │    score_percentage = $5, is_passed = $6, attempt_number = $4
    │
    ├─ Create notification (optional, for V1):
    │  INSERT INTO notifications (user_id, type, title, message, related_entity_id)
    │  VALUES ($1, 'submission_graded', 'Quiz Graded', 'Your "French Capitals" quiz was graded', $2)
    │
    ├─ Transaction COMMIT
    └─ Return success
```

### F008: View Quiz Results

```
Student lands on /results/{submissionId}
    ↓
Frontend GET /submissions/{submissionId}/results
    ├─ Verify submission.student_id == req.user.id (RLS check)
    ↓
Backend SubmissionController.getResults()
    ├─ Query submission record:
    │  SELECT * FROM submissions WHERE id = $1 AND student_id = $2
    ├─ Query all answers:
    │  SELECT answers.*, questions.question_text, questions.question_type, 
    │         options.option_text
    │  FROM answers
    │  JOIN questions ON answers.question_id = questions.id
    │  LEFT JOIN options ON answers.student_answer = options.id (for MCQ)
    │  WHERE answers.submission_id = $1
    ├─ Query correct answers (if quiz.show_correct_answers = true):
    │  For each question: fetch correct option/answer
    ├─ Format response:
       {
         submissionId: "sub-uuid",
         quizTitle: "French Capitals Quiz",
         totalScore: 4,
         maxScore: 5,
         scorePercentage: 80,
         isPassed: true,
         submittedAt: "2026-07-28T11:30:00Z",
         timeSpentSeconds: 1200,
         answers: [
           {
             questionId: "q1",
             questionText: "What is the capital of France?",
             questionType: "mcq",
             studentAnswer: "Paris",
             correctAnswer: "Paris",
             isCorrect: true,
             pointsEarned: 1,
             maxPoints: 1,
             explanation: "Paris is the capital of France."
           },
           {
             questionId: "q2",
             questionText: "France is in Europe. True or False?",
             questionType: "true_false",
             studentAnswer: true,
             correctAnswer: true,
             isCorrect: true,
             pointsEarned: 1,
             maxPoints: 1
           },
           {
             questionId: "q3",
             questionText: "Name another European capital.",
             questionType: "essay",
             studentAnswer: "Berlin",
             correctAnswer: null,
             isCorrect: null,
             pointsEarned: 0,
             maxPoints: 2,
             gradingStatus: "pending_review",
             message: "Your essay answer is under review by the instructor."
           },
           ... more answers
         ]
       }
    └─ Return response
    ↓
Frontend ResultsPage component
    ├─ Display header:
    │  "Quiz Completed!"
    │  "Score: 80% (4/5)"
    │  "Status: PASSED ✓"
    │  "Time Spent: 20 min"
    ├─ Display each answer:
    │  Q1: "What is the capital of France?"
    │       Your answer: Paris ✓ CORRECT
    │       Points: 1/1
    │       Explanation: "Paris is the capital of France."
    ├─ Display essay question notice:
    │  Q3: "Name another European capital."
    │       Status: Pending Instructor Review
    │       Your answer: "Berlin"
    ├─ Bottom buttons:
    │  "Retake Quiz" (if allowed)
    │  "Back to Dashboard"
    │  "Download PDF"
```

---

## 📅 EVENT-BASED TESTING

### F007: Instructor Schedules Event

```
Instructor navigates to /instructor/events/create
    ↓
Frontend form:
    ├─ Select Quiz (dropdown of published quizzes)
    ├─ Event Title
    ├─ Start Date & Time (datetime picker)
    ├─ Duration (auto-filled from quiz, editable)
    ├─ Timezone (select)
    ├─ Participant Selection:
    │  Option A: Upload CSV (student emails)
    │  Option B: Add manually (search by email)
    │  Option C: Import from existing class/cohort (future)
    ├─ Settings:
    │  - Allow retake? (yes/no)
    │  - Show answers after? (immediately/after_deadline/never)
    │  - Allow review before submit? (yes/no)
    ├─ Instructions (optional rich text)
    ↓
Instructor fills form and clicks "Create Event"
    ↓
Frontend POST /events with:
    {
      quizId: "quiz-123",
      title: "French Midterm Exam",
      scheduledStartAt: "2026-08-15T14:00:00Z",
      scheduledEndAt: "2026-08-15T14:30:00Z", // Calculated
      timezone: "Asia/Jakarta",
      allowRetake: false,
      showAnswersAfter: "after_deadline",
      participants: ["alice@school.com", "bob@school.com", ...],
      instructions: "Answer all questions..."
    }
    ↓
Backend EventController.createEvent()
    ├─ Verify req.user.role in ["instructor", "admin"]
    ├─ Validate start_time > now()
    ├─ Validate end_time > start_time
    ├─ Fetch quiz: SELECT * FROM quizzes WHERE id = $1
    ├─ Verify quiz.instructor_id == req.user.id OR req.user.role == "admin"
    ├─ Transaction START
    ├─ INSERT event:
    │  INSERT INTO events (quiz_id, title, scheduled_start_at, scheduled_end_at, 
    │    timezone, allow_retake, show_answers_after, instructions, 
    │    instructor_id, organization_id, status)
    │  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
    │  RETURNING id as event_id
    ├─ For each participant email in list:
    │  ├─ Fetch user: SELECT id FROM users WHERE email = $1 AND role = 'student'
    │  ├─ INSERT event_participant:
    │  │  INSERT INTO event_participants (event_id, student_id, status, invited_at)
    │  │  VALUES ($1, $2, 'invited', NOW())
    │  ├─ INSERT notification (if V1 has notifications):
    │  │  "Quiz 'French Midterm' scheduled for Aug 15 at 2:00 PM"
    ├─ Transaction COMMIT
    └─ Return response:
       {
         eventId: "event-456",
         title: "French Midterm Exam",
         scheduledStartAt: "2026-08-15T14:00:00Z",
         participantCount: 25,
         status: "scheduled"
       }
    ↓
Frontend shows:
    ├─ "Event created successfully!"
    ├─ "25 participants invited"
    ├─ Link to event details page
```

### Event Status Transitions (State Machine)

```
Event Status Flow:

[scheduled] 
    ↓ (at scheduled_start_at time)
[in_progress] 
    ↓ (at scheduled_end_at time)
[completed]

OR

[scheduled] → [cancelled] (if instructor cancels early)
```

### Student Joins Event

```
Student receives notification: "Quiz 'French Midterm' is now available"
    ├─ Notification created: INSERT INTO notifications (...)
    ├─ Frontend polls notifications or uses realtime subscription
    ↓
Student navigates to /dashboard
    ├─ Shows "Upcoming Quizzes" section
    ├─ "French Midterm Exam - Aug 15 2:00 PM - Register"
    ├─ Clicks "Register" (or auto-registered if event open)
    ↓
Frontend POST /events/{eventId}/register
    ↓
Backend EventController.registerStudent()
    ├─ Verify student_id from JWT
    ├─ Fetch event: SELECT * FROM events WHERE id = $1
    ├─ Check if now() < scheduled_start_at:
    │  if false: return 400 "Event has already started"
    ├─ Check if student already registered:
    │  SELECT COUNT(*) FROM event_participants WHERE event_id = $1 AND student_id = $2
    │  if count > 0: return 400 "Already registered for this event"
    ├─ UPDATE event_participant status:
    │  UPDATE event_participants SET status = 'registered', registered_at = NOW()
    │  WHERE event_id = $1 AND student_id = $2
    └─ Return { eventId, status: "registered" }
    ↓
Frontend updates UI:
    ├─ "Registered for French Midterm Exam"
    ├─ "Starts in: 2 days, 3 hours"
    ├─ "Time: Aug 15 at 2:00 PM (Jakarta time)"
    ├─ "Duration: 30 minutes"
```

### Student Takes Event Quiz

```
At scheduled_start_at, system transitions event to in_progress
    (Can be done via cron job or on-demand check before quiz starts)
    ├─ UPDATE events SET status = 'in_progress' WHERE id = $1 AND scheduled_start_at <= NOW()

Student logs in at 1:59 PM on Aug 15
    ├─ Dashboard shows: "French Midterm Exam - 1 min to start"
    ├─ "Start Quiz" button (disabled until start time)
    ↓
At 2:00 PM, button enables
    ├─ Student clicks "Start Quiz"
    ├─ Proceeds to quiz-taking flow (see Quiz Submission section)
    ├─ event_id is passed to submission record
    ↓
At 2:30 PM (scheduled_end_at), system auto-submits
    (Frontend should auto-submit OR backend enforces deadline)
    ├─ If student still taking: auto-submit current answers
    ├─ Trigger auto-grading
    ↓
Event transitions to completed
    ├─ UPDATE events SET status = 'completed', completed_at = NOW()
    ├─ Students can now view results (if show_answers_after includes 'after_deadline')
```

---

## 🎯 IELTS SIMULATION MODE

### F006: IELTS Simulation Workflow

```
Difference from Standard Quiz:
- 4 sections (Listening, Reading, Writing, Speaking)
- Strict timing per section (no pause, no going back)
- Total ~3 hours
- IELTS band scoring (6.5, 7.0, 8.0, etc.)

Quiz Setup:
  quizType: "ielts_simulation"
  sections: [
    {
      name: "Listening",
      questions: 40,
      durationMinutes: 30,
      order: 1
    },
    {
      name: "Reading",
      questions: 40,
      durationMinutes: 60,
      order: 2
    },
    {
      name: "Writing",
      questions: 2, // 2 essays
      durationMinutes: 60,
      order: 3
    },
    {
      name: "Speaking",
      questions: 1, // 1 prompt
      durationMinutes: 15,
      order: 4
    }
  ]
```

### Student Starts IELTS Simulation

```
Student clicks "Start IELTS Simulation"
    ↓
Frontend POST /quiz/{quizId}/attempt/start
    (Same as standard quiz, but with ielts_simulation context)
    ↓
Backend returns: { ..., quizType: "ielts_simulation", sections: [...] }
    ↓
Frontend renders: IELTSIntroductionPage
    ├─ "IELTS Academic Mock Exam"
    ├─ Exam structure overview:
    │  "Listening - 30 minutes (40 questions)"
    │  "Reading - 60 minutes (40 questions)"
    │  "Writing - 60 minutes (2 essays)"
    │  "Speaking - 15 minutes (1 prompt)"
    │  "Total: 165 minutes (2 hours 45 minutes)"
    ├─ Important warnings:
    │  ⚠ "You cannot pause or go back to previous sections"
    │  ⚠ "Answers submit automatically when time expires"
    │  ⚠ "Ensure you're in a quiet environment"
    ├─ Confirmation: "I understand and am ready to start"
    ├─ "Start Exam" button
    ↓
Student clicks "Start Exam"
    ↓
Frontend shows: Section 1 - Listening
    ├─ Timer: "30:00" (countdown in MM:SS format, prominently displayed)
    ├─ Question display: "Question 1 of 40"
    ├─ Questions shown one at a time or in groups (configurable)
    ├─ NO "Previous" button
    ├─ "Next" button moves forward only
    ├─ "Review" button optional (shows summary of current section only)
    ├─ At 5 minutes remaining: visual warning (orange highlight)
    ├─ At 1 minute remaining: audio/visual alert
    ├─ At 0:00: auto-submit section, proceed to next
    ↓
Frontend POST /submissions/{submissionId}/section-submit
    {
      section: "Listening",
      answers: [
        { questionId: "q1", studentAnswer: "A" },
        { questionId: "q2", studentAnswer: "B" },
        ...
      ]
    }
    ↓
Backend SubmissionController.submitSection()
    ├─ Verify section submitting matches current section
    ├─ Prevent re-submission of already-submitted section
    ├─ Store answers for this section
    ├─ No auto-grading yet (batch at end)
    └─ Return: { nextSection: "Reading", expiresAt: ... }
    ↓
Frontend transitions to Section 2 - Reading
    (Same flow: timer, questions, auto-submit)
    ↓
After all 4 sections submitted:
    ├─ Frontend shows summary: "Exam Complete"
    ├─ "Your answers are being processed..."
    ↓
Backend BatchGradingService.gradeIELTSSimulation(submission_id)
    ├─ Process Listening answers:
    │  ├─ Count correct: 32/40
    │  ├─ Calculate IELTS band: 8.0
    ├─ Process Reading answers:
    │  ├─ Count correct: 35/40
    │  ├─ Calculate IELTS band: 8.5
    ├─ Process Writing answers:
    │  ├─ Flag both essays for instructor manual review
    │  ├─ IELTS band: TBD (pending review)
    ├─ Process Speaking answers:
    │  ├─ Flag prompt for instructor manual review
    │  ├─ IELTS band: TBD (pending review)
    ├─ Calculate overall band:
    │  Overall = average(Listening, Reading, Writing, Speaking)
    │          = average(8.0, 8.5, TBD, TBD)
    │          = TBD pending writing/speaking
    ├─ Store results in analytics
    └─ Send notification: "IELTS Simulation graded. Partial results available."
    ↓
Frontend displays IELTS Results Page:
    ├─ "IELTS Academic Mock Exam Results"
    ├─ Listening: 32/40 → Band 8.0 ✓ (auto-graded)
    ├─ Reading: 35/40 → Band 8.5 ✓ (auto-graded)
    ├─ Writing: TBD (pending instructor review)
    ├─ Speaking: TBD (pending instructor review)
    ├─ Overall Band: TBD (will update when writing/speaking graded)
    ├─ Section breakdown:
    │  - Listening: Strong performance in Q15-25 (67% correct)
    │  - Reading: Excellent on passage 2 (95% correct)
    │  - Writing: Awaiting feedback
    ├─ "Download Results" button (PDF with official-looking IELTS format)
    ├─ "Back to Dashboard"
```

---

## 📊 ANALYTICS & REPORTING

### F009: Instructor Analytics Dashboard

```
Instructor navigates to /instructor/quizzes/{quizId}/analytics
    ↓
Frontend GET /analytics/quiz/{quizId}
    ├─ Optional filters: dateRange, eventId, cohort
    ↓
Backend AnalyticsController.getQuizAnalytics()
    ├─ Verify req.user.role == "instructor" AND req.user.id == quiz.instructor_id
    ├─ Query submissions for this quiz:
    │  SELECT * FROM submissions WHERE quiz_id = $1 AND status = 'graded'
    ├─ Aggregate metrics:
    │  - Count: totalSubmissions, passedCount, failedCount
    │  - Scores: avg, median, min, max, std_dev
    │  - Time: avg_time_spent
    ├─ Per-question analytics:
    │  For each question in quiz:
    │    - Correct count & percentage
    │    - Average points earned
    │    - Time spent distribution
    │    - Common wrong answers (for MCQ)
    ├─ Student roster:
    │  SELECT submissions.*, users.first_name, users.last_name, users.email
    │  FROM submissions
    │  JOIN users ON submissions.student_id = users.id
    │  WHERE submissions.quiz_id = $1
    │  ORDER BY submissions.score_percentage DESC
    └─ Return:
       {
         quizId: "quiz-123",
         quizTitle: "French Capitals Quiz",
         stats: {
           totalSubmissions: 25,
           passedCount: 18,
           failedCount: 7,
           passRate: 72,
           avgScore: 72.4,
           medianScore: 75,
           minScore: 35,
           maxScore: 100,
           stdDev: 14.2,
           avgTimeSpent: 1245 (seconds)
         },
         questionAnalytics: [
           {
             questionId: "q1",
             questionText: "What is the capital of France?",
             questionType: "mcq",
             difficulty: "easy",
             correctCount: 24,
             correctPercentage: 96,
             avgPointsEarned: 0.96,
             commonMistakes: [
              { answer: "London", count: 1 }
             ]
           },
           ... more questions
         ],
         studentRoster: [
           {
             studentId: "s1",
             studentName: "Alice Smith",
             email: "alice@school.com",
             score: 100,
             scorePercentage: 100,
             passed: true,
             attemptNumber: 1,
             submittedAt: "2026-07-28T11:30:00Z",
             timeSpent: 890
           },
           ... more students
         ]
       }
    ↓
Frontend AnalyticsDashboard component
    ├─ Display header stats:
    │  "25 Submissions | 72% Pass Rate | Avg: 72.4%"
    ├─ Chart 1: Score Distribution (histogram)
    │  Shows bell curve of score distribution
    ├─ Chart 2: Pass/Fail Breakdown (pie chart)
    │  72% passed (18), 28% failed (7)
    ├─ Chart 3: Question Difficulty Analysis
    │  X: Question | Y: % Correct
    │  Flag questions <60% as "difficult"
    ├─ Chart 4: Time Spent Distribution
    │  X: Student | Y: Minutes
    ├─ Student Roster Table:
    │  Columns: Name | Email | Score | Pass/Fail | Submitted | Time Spent
    │  Sortable by score, date, time
    │  Color-coded: red (failed), yellow (50-70%), green (passed)
    │  Click student name → view individual submission details
    ├─ "Download Results" button (CSV export)
    └─ Drill-down: Click question → see all student answers for that Q
```

### F011: Student Progress Tracking

```
Student navigates to /dashboard/progress
    ↓
Frontend GET /student/progress
    ├─ Query all submissions for this student
    ├─ Aggregate by quiz
    ├─ Calculate trends
    ↓
Backend StudentController.getProgress()
    ├─ Fetch all submissions for req.user.id:
    │  SELECT submissions.*, quizzes.title
    │  FROM submissions
    │  JOIN quizzes ON submissions.quiz_id = quizzes.id
    │  WHERE submissions.student_id = $1 AND submissions.status = 'graded'
    │  ORDER BY submissions.submitted_at DESC
    ├─ Group by quiz to find trends
    ├─ Calculate per-quiz stats:
    │  - Best attempt
    │  - Latest attempt
    │  - Improvement trend
    ├─ Calculate per-topic stats (if questions tagged):
    │  - Weak areas (avg score < 60%)
    │  - Strong areas (avg score > 80%)
    └─ Return:
       {
         totalQuizzesTaken: 12,
         averageScore: 74.5,
         passRate: 83,
         recentAttempts: [
           {
             quizTitle: "French Capitals",
             score: 80,
             isPassed: true,
             submittedAt: "2026-07-28T11:30:00Z",
             attemptNumber: 2,
             trend: "↑ +10% from last attempt"
           },
           ... more
         ],
         progressByTopic: [
           {
             topic: "Listening",
             avgScore: 72,
             attempts: 3,
             status: "improving"
           },
           {
             topic: "Reading",
             avgScore: 88,
             attempts: 3,
             status: "strong"
           },
           ...
         ],
         upcomingQuizzes: [
           {
             quizTitle: "IELTS Full Mock",
             eventStartAt: "2026-08-15T14:00:00Z",
             daysUntil: 2
           }
         ]
       }
    ↓
Frontend ProgressDashboard component
    ├─ Display quick stats:
    │  "Total Quizzes: 12 | Avg Score: 74.5% | Pass Rate: 83%"
    ├─ Recent Attempts List:
    │  French Capitals - 80% - Aug 28 (↑ +10% from previous)
    │  IELTS Reading - 85% - Aug 25 (↑ +5%)
    │  ...
    ├─ Progress by Topic Chart:
    │  Listening: ████████ 72% (improving)
    │  Reading: ██████████ 88% (strong)
    │  Writing: ██████ 65% (needs work)
    ├─ Trend Chart (score over time):
    │  X: Date | Y: Score
    │  Shows line chart of all attempt scores
    │  Trend line overlay shows improvement
    ├─ Weak Areas Alert:
    │  "⚠ Writing skills need focus (avg 65%)"
    ├─ Upcoming Quizzes:
    │  "IELTS Full Mock - 2 days away"
```

---

## 📊 DATA FLOW DIAGRAMS

### Registration & Login Data Flow

```
User Registration Request:
┌─────────────────────────────────────────────────────────────┐
│ POST /auth/register                                         │
│ {email, password, firstName, lastName, role}               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Validation Layer                                            │
│ - Email format regex                                       │
│ - Password strength (8+ chars, uppercase, number, special) │
│ - Role is valid enum                                       │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Database Query Layer                                        │
│ SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL│
└─────────────────────────────────────────────────────────────┘
    ├─ Email exists? → Return 409 Conflict
    └─ No? Continue
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Hashing Layer                                               │
│ password_hash = await bcrypt.hash(password, 12)           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Database Insert Layer                                       │
│ INSERT INTO users (email, password_hash, ...)              │
│ RETURNING id, email, firstName, lastName, role, createdAt  │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Response Layer                                              │
│ { id, email, firstName, lastName, role, createdAt }       │
│ Status: 201 Created                                         │
└─────────────────────────────────────────────────────────────┘
```

### Quiz Submission & Grading Data Flow

```
User submits quiz:
┌──────────────────────────────────────────────────────────────┐
│ POST /submissions/{submissionId}/submit                     │
│ { answers: [{questionId, studentAnswer}, ...] }            │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Validation                                                  │
│ - Verify submission exists & status = 'in_progress'       │
│ - Verify submission.submitted_at <= event.scheduled_end_at│
│ - Verify student hasn't exceeded time limit              │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Transaction: Update Submission Status                       │
│ UPDATE submissions SET status = 'submitted', submitted_at  │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Insert Answers                                              │
│ INSERT INTO answers (submission_id, question_id, ...)      │
│ FOR EACH answer in payload                                 │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Auto-Grading Service (Synchronous or Async)               │
│ GradingService.grade(submissionId) → calculates score     │
└──────────────────────────────────────────────────────────────┘
    ├─ For MCQ: compare with correct_options
    ├─ For T/F: compare with correct_answer
    ├─ For Short Answer: fuzzy match or exact
    ├─ For Essay: flag for manual review
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Update Answers with Grades                                  │
│ UPDATE answers SET is_correct, points_earned FOR EACH answer
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Calculate Metrics & Update Submission                      │
│ totalScore, scorePercentage, isPassed                      │
│ UPDATE submissions SET total_score, score_percentage, ...  │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Update Analytics (Denormalized)                            │
│ INSERT/UPDATE INTO analytics (aggregate stats)             │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Send Notification (Optional)                               │
│ INSERT INTO notifications (type: 'submission_graded')      │
└──────────────────────────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Response to Frontend                                        │
│ { submissionId, redirect: "/results/{submissionId}" }      │
│ Status: 200 OK                                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 STATE MACHINES

### Quiz Status State Machine

```
STATE: draft
├─ Transitions:
│  ├─ publish() → published
│  ├─ delete() → deleted (soft)
│  └─ actions: edit, add questions, delete
│
├─ GUARD: Must have >= 5 questions before publish

STATE: published
├─ Transitions:
│  ├─ archive() → archived
│  ├─ unarchive() → published (if supported)
│  └─ actions: view, schedule events, view submissions
│
├─ GUARD: Cannot edit once published

STATE: archived
├─ Transitions:
│  └─ actions: view (instructor only), view submissions
│
├─ GUARD: Students cannot take archived quiz

DELETED (Soft delete):
├─ Marked with deleted_at timestamp
├─ Hidden from normal queries (WHERE deleted_at IS NULL)
└─ Recoverable via admin if needed
```

### Submission Status State Machine

```
STATE: in_progress
├─ Student is actively taking quiz
├─ Transitions:
│  ├─ submit() → submitted
│  ├─ auto_submit() → submitted (if time expires)
│  └─ actions: save draft answers (auto-save), review
│
└─ GUARD: Cannot transition to other states without submit

STATE: submitted
├─ Student submitted all answers
├─ Auto-grading triggered
├─ Transitions:
│  └─ grade() → graded
│  └─ (Automatic, immediate)
│
└─ GUARD: Cannot go back to in_progress

STATE: graded
├─ Auto-grading completed
├─ Results available
├─ (For essays) some questions may still be pending_review
├─ Transitions: (none, terminal state)
│
└─ GUARD: Student can view results, submit feedback
```

### Event Status State Machine

```
STATE: scheduled
├─ Event is planned but not started
├─ Students can register
├─ Transitions:
│  ├─ (auto at scheduled_start_at) → in_progress
│  ├─ cancel() → cancelled
│  └─ actions: view details, register, edit (limited)
│
└─ GUARD: Start time must be in future

STATE: in_progress
├─ Event started, students can take quiz
├─ (auto at scheduled_end_at) → completed
├─ Transitions:
│  ├─ (auto) → completed
│  ├─ extend() → in_progress (extends end_time)
│  └─ cancel() → cancelled
│
└─ GUARD: Students can only start quiz during this window

STATE: completed
├─ Event ended, results viewable
├─ No more submissions accepted
├─ Transitions: (none, terminal state)
│
└─ GUARD: Results configurable (show_answers_after)

STATE: cancelled
├─ Event cancelled (e.g., emergency)
├─ Submissions saved but locked
├─ Transitions: (none, terminal state)
│
└─ GUARD: Students notified of cancellation
```

---

## 🧮 ALGORITHM LOGIC

### Auto-Grading Algorithm (Pseudocode)

```
FUNCTION gradeSubmission(submissionId):
  submission ← fetch(submissions, submissionId)
  answers ← fetch(answers, WHERE submission_id = submissionId)
  quiz ← fetch(quizzes, submission.quiz_id)
  
  totalPoints ← 0
  maxPoints ← 0
  
  FOR EACH answer IN answers:
    question ← fetch(questions, answer.question_id)
    correctAnswer ← fetch(correct answer for question)
    
    isCorrect ← FALSE
    pointsEarned ← 0
    
    SWITCH question.type:
      
      CASE "mcq":
        studentOptions ← parseAnswer(answer.student_answer) // Array of option IDs
        correctOptions ← parseAnswer(correctAnswer) // Array of option IDs
        IF sort(studentOptions) == sort(correctOptions):
          isCorrect ← TRUE
          pointsEarned ← question.points
        ELSE:
          isCorrect ← FALSE
          pointsEarned ← 0
        END IF
        
      CASE "true_false":
        IF answer.student_answer == correctAnswer:
          isCorrect ← TRUE
          pointsEarned ← question.points
        ELSE:
          isCorrect ← FALSE
          pointsEarned ← 0
        END IF
        
      CASE "short_answer":
        studentText ← normalize(answer.student_answer)
        correctText ← normalize(correctAnswer)
        
        IF studentText == correctText:
          isCorrect ← TRUE
          pointsEarned ← question.points
        ELSE IF enableFuzzyMatching:
          similarity ← levenshteinSimilarity(studentText, correctText)
          IF similarity >= fuzzyThreshold (e.g., 0.85):
            isCorrect ← TRUE
            pointsEarned ← question.points
          ELSE:
            isCorrect ← FALSE
            pointsEarned ← 0
          END IF
        ELSE:
          isCorrect ← FALSE
          pointsEarned ← 0
        END IF
        
      CASE "matching":
        // Matching question grading (F003a, F004c)
        studentPairs ← parseJSON(answer.student_answer) // [{left, right}, ...]
        correctPairs ← parseJSON(question.matching_pairs)
        
        correctMatches ← 0
        FOR EACH studentPair IN studentPairs:
          FOR EACH correctPair IN correctPairs:
            IF studentPair.left == correctPair.left AND studentPair.right == correctPair.right:
              correctMatches ← correctMatches + 1
              BREAK
            END IF
          END FOR
        END FOR
        
        // Points proportional to correct matches
        IF correctMatches == correctPairs.length:
          isCorrect ← TRUE
          pointsEarned ← question.points
        ELSE:
          isCorrect ← FALSE
          // Partial credit: points proportional to correct pairs
          pointsEarned ← ROUND((correctMatches / correctPairs.length) * question.points)
        END IF
        
      CASE "essay":
        // Manual grading required (F003a, F004d)
        isCorrect ← NULL
        pointsEarned ← 0
        flagForManualReview ← TRUE
        
    END SWITCH
    
    // Update answer record
    update(answers, answer.id, {
      is_correct: isCorrect,
      points_earned: pointsEarned,
      grading_status: (isCorrect == NULL ? 'manual_review' : 'auto_graded')
    })
    
    // Accumulate totals
    totalPoints ← totalPoints + pointsEarned
    maxPoints ← maxPoints + question.points
  
  END FOR
  
  // Calculate final metrics
  scorePercentage ← (totalPoints / maxPoints) * 100
  isPassed ← (scorePercentage >= quiz.passing_score)
  
  // Update submission
  update(submissions, submissionId, {
    status: 'graded',
    total_score: totalPoints,
    score_percentage: scorePercentage,
    is_passed: isPassed,
    graded_at: NOW()
  })
  
  RETURN { totalPoints, scorePercentage, isPassed }
  
END FUNCTION
```

### Fuzzy Matching Algorithm (Levenshtein Distance)

```
FUNCTION levenshteinSimilarity(str1, str2):
  // Calculate minimum edit distance between two strings
  // Returns 0.0 (completely different) to 1.0 (identical)
  
  s1 ← str1.toLowerCase().trim()
  s2 ← str2.toLowerCase().trim()
  
  IF s1 == s2:
    RETURN 1.0
  END IF
  
  len1 ← length(s1)
  len2 ← length(s2)
  
  IF len1 == 0 OR len2 == 0:
    RETURN 0.0
  END IF
  
  // Create matrix for DP
  matrix ← createMatrix(len1 + 1, len2 + 1)
  
  // Initialize first row/column
  FOR i FROM 0 TO len1:
    matrix[i][0] ← i
  END FOR
  
  FOR j FROM 0 TO len2:
    matrix[0][j] ← j
  END FOR
  
  // Fill matrix
  FOR i FROM 1 TO len1:
    FOR j FROM 1 TO len2:
      IF s1[i-1] == s2[j-1]:
        cost ← 0
      ELSE:
        cost ← 1
      END IF
      
      matrix[i][j] ← MIN(
        matrix[i-1][j] + 1,      // deletion
        matrix[i][j-1] + 1,      // insertion
        matrix[i-1][j-1] + cost  // substitution
      )
    END FOR
  END FOR
  
  distance ← matrix[len1][len2]
  maxLen ← MAX(len1, len2)
  
  similarity ← 1.0 - (distance / maxLen)
  
  RETURN similarity
END FUNCTION
```

### IELTS Band Calculation Algorithm

```
FUNCTION calculateIELTSBand(correctCount, totalQuestions):
  // IELTS uses a raw score to band conversion table
  // Example for Academic Reading & Listening (each 40 questions):
  
  correctPercentage ← (correctCount / totalQuestions) * 100
  
  SWITCH correctPercentage:
    CASE >= 95%: RETURN 9.0 // Native/Proficient
    CASE >= 86%: RETURN 8.5
    CASE >= 80%: RETURN 8.0
    CASE >= 71%: RETURN 7.5
    CASE >= 60%: RETURN 7.0
    CASE >= 50%: RETURN 6.5
    CASE >= 40%: RETURN 6.0
    CASE >= 30%: RETURN 5.5
    CASE >= 23%: RETURN 5.0
    CASE >= 17%: RETURN 4.5
    CASE >= 12%: RETURN 4.0
    CASE >= 9%: RETURN 3.5
    CASE >= 6%: RETURN 3.0
    CASE >= 4%: RETURN 2.5
    CASE >= 2%: RETURN 2.0
    CASE >= 1%: RETURN 1.5
    CASE >= 0%: RETURN 1.0 // Non-user
  END SWITCH
  
END FUNCTION

FUNCTION calculateOverallBand(listeningBand, readingBand, writingBand, speakingBand):
  // Overall = average of 4 sections, rounded to nearest 0.5
  
  average ← (listeningBand + readingBand + writingBand + speakingBand) / 4
  
  // Round to nearest 0.5
  overallBand ← ROUND(average * 2) / 2
  
  // Ensure within valid range [1.0, 9.0]
  overallBand ← CLAMP(overallBand, 1.0, 9.0)
  
  RETURN overallBand
END FUNCTION
```

---

## 🚨 EDGE CASES & ERROR HANDLING

### F001: Authentication Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| User attempts login with unregistered email | Return 401 "Invalid email or password" (no email confirmation leak) | Compare both email existence and password in single error message |
| User attempts login with correct email, wrong password | Same as above (401) | Use bcrypt.compare() safely without timing attacks |
| User tries to login 5 times in 60 seconds (brute force) | Rate limit: 429 Too Many Requests | Implement rate limiting middleware (IP-based, 10 req/min) |
| User's JWT token expires during session | Auto-logout on next API call, show "Session expired" modal | Frontend middleware detects 401, clears auth state, redirects to /login |
| User's role changed by admin while logged in | Role-based access re-evaluated on next request | JWT contains role at issue time; next API call checks current role from DB |
| Concurrent login from 2 browsers | Both sessions valid (stateless JWT) | Each browser gets separate token, both work independently |
| User tries to access /admin without admin role | Return 403 Forbidden | RBAC middleware checks req.user.role before allowing route |

### F002-F003: Quiz Management Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Instructor tries to publish quiz with <5 questions | Return 400 "Quiz must have at least 5 questions" | Validate total_questions >= 5 before status update |
| Instructor tries to edit published quiz | Return 403 "Published quizzes cannot be edited" | Check quiz.status != 'draft' before allowing edit |
| Multiple instructors create quiz with identical title | Allow (titles are not unique) | No unique constraint on title; instructor_id + title could be unique |
| Instructor duplicates quiz with 500 questions | Should work (performance test) | Ensure bulk insert doesn't timeout; may need pagination |
| Question text contains XSS payload `<script>alert('xss')</script>` | Sanitize & escape on storage & display | Use parameterized queries (Prisma/TypeORM handles) + React auto-escaping on display |
| Instructor deletes quiz while students are taking it | Active submissions continue (submissions reference deleted quiz via FK) | Soft delete; submissions still valid. Hard delete would RESTRICT. |

### F005: Quiz Submission Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Student closes browser mid-quiz | Attempt remains in_progress; can resume within 5 min (or timeout) | Auto-save on frontend every 30 sec; backend recovers submission |
| Student submits at 23:59:59, deadline is 00:00:00 | Accept (submitted before deadline) | Use submitted_at timestamp; check submitted_at <= scheduled_end_at |
| Student submits identical quiz twice (double-click) | First submission processed, second rejected (idempotent) | Check submission.status != 'in_progress' before re-submitting |
| Student submits after event ends | Return 403 "Event deadline has passed" | Validate now() <= event.scheduled_end_at on submission |
| Quiz has 0 max_points (all questions worth 0 points) | Return score 0%, prevent division by zero | Handle maxPoints == 0: scorePercentage = 0, isPassed = false |
| Student submits 10MB payload (very large essay) | Reject with 413 "Payload too large" | Set max payload size (e.g., 5MB) in API middleware |
| Network drops during submission | Frontend retries with exponential backoff (3 attempts) | Implement retry logic; ensure submission creation is idempotent |

### F004: Auto-Grading Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Student answers MCQ with option that was deleted | Gracefully handle missing option | Query for is_correct flag in options; if option deleted, treat as "not selected" |
| Fuzzy matching: student types "Paris " (extra space) | Accept as correct (case + whitespace normalized) | normalize() = .toLowerCase().trim() |
| Fuzzy matching: student types "Pari" (typo) at 85% threshold | Accept as correct (similarity > 0.85) | Use Levenshtein distance; calculate similarity |
| Short answer expects "yes/no" but student writes "yep" | Depends on fuzzy threshold | If threshold 0.85, "yep" vs "yes" = 0.75 (not accepted); "yep" vs "yep" = 1.0 (accepted if variant added) |
| Essay question auto-graded (should be manual) | Flag for manual review regardless | Question.type == 'essay' → is_correct = NULL, grading_status = 'manual_review' |
| Grading database error (DB unavailable) | Transaction rolled back, submission remains "submitted" | Error handling: catch exception, log, return 500 "Grading failed. Please try again." |
| Grading takes >5 seconds (large submission) | Timeout vs complete grading | Estimate: 100 questions × 50ms per question = 5 seconds acceptable. If timeout, make async (Bullmq) |

### F006: IELTS Simulation Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Student refreshes browser during IELTS (mid-section) | Submission paused; can resume within deadline | Frontend persists submissionId + currentSection to localStorage |
| Timer reaches 0 mid-answer | Auto-submit current section immediately | Frontend auto-submit at 0:00; backend enforces deadline |
| Student somehow goes back to previous section | Prevent navigation (no Previous button visible) | Frontend state machine: can only go forward within sections |
| Student takes 2 hours (within 2:45 limit) but runs slow on writing | Sections auto-submit on time; last section writing gets cut off | Document expected behavior; auto-submit is strict |
| Speaking section: student doesn't record audio (V1 text-only) | Treat as text prompt response; instructor grades manually | No audio recording in V1; show text prompt, student types response |
| Overall IELTS band calculation: writing/speaking still pending | Show band as "TBD, will update when graded" | Once instructor grades writing/speaking, recalculate overall band |

### F007: Event Management Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Instructor schedules event 1 minute in future | Allow (edge case but valid) | No validation preventing this; system treats normally |
| Event scheduled for 3 AM (low participation) | Allow; instructor's choice | No time-based restrictions |
| Instructor adds 5000 students to single event | Bulk insert into event_participants; may be slow | Batch insert in chunks of 1000; potentially async job |
| Student registers for event, then instructor deletes quiz | Submission records remain (FK constraints) | Soft delete quiz; submissions still reference it. Instructor warned: "Quiz deleted but 25 submissions exist" |
| Event deadline extended 5 min before original end | Active students get notified; timer resets | Frontend subscription updates end_time; timer recalculates. New deadline enforced. |
| Student attempts to join event after deadline | Return 400 "Event registration closed" | Check now() < scheduled_start_at |
| Timezone mismatch: instructor sets event in "Asia/Jakarta", student in "Asia/Bangkok" | Display both; let student verify their local time | Frontend converts time to student's timezone based on browser/profile setting |

### F008: Results Display Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Instructor marks "show_answers_after" as "never" | Student sees score but not correct answers | Query quiz.show_correct_answers in results endpoint; conditionally return answers |
| Essay question still pending review | Show "Pending instructor review" instead of correctAnswer | is_correct == NULL → display "Under Review" message |
| Student viewed results, then instructor changed correct answer (v1.1) | Results don't retroactively change (V1 behavior) | V1 doesn't allow editing published quizzes; V1.1 would add re-grading logic |
| Results page accessed on slow connection | Page loads, but charts render progressively | Skeleton loaders for charts; data fetches via React Query with progress indicators |

### F009: Analytics Edge Cases

| Scenario | Expected Behavior | Implementation |
|----------|-------------------|-----------------|
| Analytics queried while submissions still grading | Show submissions already graded; exclude in-progress | Query submissions WHERE status = 'graded' only |
| Instructor filters analytics by non-existent date range | Return empty dataset gracefully | Empty chart + message: "No data for selected period" |
| Question has only 1 student attempt | Don't calculate meaningful difficulty stats | Only calculate per-question stats if N >= 3 attempts |
| 1000 students take quiz simultaneously | Analytics refresh may lag | Cache analytics for 5 minutes; refresh on-demand or async job |
| Analytics page accessed by student (not instructor) | Return 403 Forbidden (student can only see own results) | RBAC check: role must be instructor or admin |

---

## 📝 SUMMARY TABLE: Features → Database Tables

| Feature | Primary Tables | Supporting Tables |
|---------|----------------|-------------------|
| F001: Authentication | users | (none) |
| F002-F003: Quiz Management | quizzes, questions, options | quiz_versions |
| F004: Auto-Grading | submissions, answers | questions, options |
| F005: Quiz Submission | submissions, answers | quizzes, questions |
| F006: IELTS Simulation | submissions, answers, questions.section | (same as above) |
| F007: Event Management | events, event_participants | (none) |
| F008: Results Display | submissions, answers | questions, options |
| F009: Analytics Dashboard | analytics, submissions | questions, answers |
| F010: Admin Management | users, quizzes | audit_logs |
| F011: Progress Tracking | submissions, analytics | quizzes |
| F012: Notifications | notifications | (none) |

---

## ✅ VALIDATION CHECKLIST

Before proceeding to HALAMAN.md (page design):

- ✅ All 12 features (F001-F012) mapped to workflows
- ✅ Data flows trace from frontend → backend → database
- ✅ State machines defined for Quiz, Submission, Event statuses
- ✅ Auto-grading algorithm detailed with pseudocode
- ✅ IELTS band scoring algorithm documented
- ✅ 50+ edge cases identified + handled
- ✅ RBAC matrix complete (who can do what)
- ✅ All flows align with DATABASE_SCHEMA.md
- ✅ Error scenarios documented
- ✅ Portfolio-quality documentation

---

## 🔄 VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| **v1.0** | 2026-07-28 | M. Arif Aulia | Complete logic flow doc: all features, workflows, state machines, algorithms, edge cases |

---

## 📊 SIGN-OFF

| Role | Name | Date | Status | Notes |
|------|------|------|--------|-------|
| Product Manager | Aulia | 2026-07-28 | ✅ Approved | Logic flow complete, ready for UI/UX design (HALAMAN.md) |
| Lead Engineer | Aulia | 2026-07-28 | ✅ Approved | Technical flows validated against DATABASE_SCHEMA.md, implementable |

**Next Steps:**
1. ✅ LOGIC_FLOW.md (this doc) - **COMPLETE**
2. → HALAMAN.md (page wireframes & user flows)
3. → DESIGN.md (design system)
4. → TDD.md (technical design with API contracts)
5. → Implementation (coding)

---

*LOGIC_FLOW.md v1.0 | EduFlow Portfolio Project | Approved 2026-07-28*

*Status: ✅ Complete & Ready for Page Design (HALAMAN.md)*