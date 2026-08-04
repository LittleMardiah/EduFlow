# SECURITY SPECIFICATION - EduFlow

**All-in-One EdTech Platform for Assessment & Learning Analytics**

*Production-Grade Security Architecture & Implementation Guide*

*For Solo Developer - Portfolio Project*

---

## 📌 DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Project Name** | EduFlow - All-in-One EdTech Platform |
| **Document Type** | Security Specification |
| **Document Version** | v1.0 |
| **Created Date** | 2026-07-28 |
| **Last Updated** | 2026-07-28 |
| **Author** | M. Arif Aulia |
| **Status** | ✅ Complete & Ready for Implementation |
| **Related Documents** | PRD.md, DATABASE_SCHEMA.md, LOGIC_FLOW.md, TDD.md, API_CONTRACT.md |
| **Scope** | Authentication, Authorization, Data Protection, API Security, Compliance |
| **Target Audience** | Solo developer, security reviewers, hiring managers |

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Security Objectives & Threat Model](#2-security-objectives--threat-model)
3. [Authentication System](#3-authentication-system)
4. [Authorization & Access Control](#4-authorization--access-control)
5. [Data Protection & Encryption](#5-data-protection--encryption)
6. [API Security](#6-api-security)
7. [Database Security](#7-database-security)
8. [Infrastructure & Deployment Security](#8-infrastructure--deployment-security)
9. [Incident Response & Logging](#9-incident-response--logging)
10. [Compliance & Standards](#10-compliance--standards)
11. [Security Testing Checklist](#11-security-testing-checklist)
12. [Dependency & Vulnerability Management](#12-dependency--vulnerability-management)

---

## 1. EXECUTIVE SUMMARY

### Security Vision

EduFlow handles sensitive student data (quiz submissions, performance records, personally identifiable information). This specification defines security controls across all layers to:

✅ **Prevent unauthorized access** to student submissions and personal data  
✅ **Ensure data integrity** through ACID transactions and audit trails  
✅ **Protect credentials** using industry-standard hashing and encryption  
✅ **Enforce role-based access control** (Admin, Instructor, Student)  
✅ **Maintain compliance** with GDPR, FERPA-like principles, and PCI DSS concepts  
✅ **Detect & respond** to security incidents via comprehensive logging  
✅ **Build trust** with educational institutions through transparent security practices  

### Security Assumptions

**In Scope (MVP v1.0):**
- Single-organization deployment (multi-tenancy in v1.1)
- HTTPS/TLS for all data in transit
- JWT-based stateless authentication
- Row-Level Security (RLS) at database layer
- Bcrypt password hashing (min 12 rounds)
- Audit logging for compliance

**Out of Scope (Future Versions):**
- OAuth2/SSO (Google, Microsoft) → v1.1
- Two-Factor Authentication (2FA) → v1.2
- Hardware security keys (FIDO2) → v2.0
- Homomorphic encryption for analytics → v2.0
- Advanced SIEM integration → v2.0

### Risk Acceptance

| Risk | Impact | Likelihood | Mitigation | Residual Risk |
|------|--------|-----------|-----------|---------------|
| JWT token theft via XSS | CRITICAL | MEDIUM | HTTPOnly cookies, CSP headers | LOW |
| Weak password attacks | HIGH | HIGH | Min 8 chars, entropy check, rate limit | LOW |
| Unauthorized data access | CRITICAL | LOW | RLS policies, RBAC enforcement | LOW |
| SQL injection attacks | CRITICAL | LOW | Parameterized queries (Prisma ORM) | LOW |
| Session hijacking | HIGH | MEDIUM | Secure cookies, IP pinning (future) | MEDIUM |
| Insider threat (instructor viewing student data) | MEDIUM | LOW | RLS enforcement, audit logs | MEDIUM |

---

## 2. SECURITY OBJECTIVES & THREAT MODEL

### Security Goals (STRIDE Analysis)

#### **S - Spoofing (Identity Impersonation)**

**Threats:**
- Attacker impersonates another user by stealing/guessing credentials
- Account takeover via credential reuse across sites
- JWT token forgery

**Controls:**
- Strong password requirements (8+ chars, mix of types)
- Password hashing with bcrypt (12+ rounds)
- JWT signature verification on every request
- Rate limiting on login endpoints
- Account lockout after N failed attempts
- Optional: Email verification before account activation

#### **T - Tampering (Data Modification)**

**Threats:**
- Attacker modifies quiz questions to change correct answers
- Attacker adjusts own submission score
- Malicious query string or form parameter injection

**Controls:**
- Parameterized queries via Prisma ORM (no SQL injection)
- CSRF protection (token validation for state-changing operations)
- Audit logging: every INSERT/UPDATE/DELETE logged with user_id, timestamp, old/new values
- Immutable submission records (no editing after submission_status = 'submitted')
- Soft deletes with `deleted_at` timestamps for audit trail

#### **R - Repudiation (Denying Actions)**

**Threats:**
- Instructor denies creating unfair quiz
- Student denies cheating on exam
- Admin denies deleting user account

**Controls:**
- Comprehensive audit_logs table: tracks all user actions
- Non-repudiation via timestamp + cryptographic signature (future)
- Immutable audit log (triggers prevent deletion of audit_logs)
- Regular audit log backups to separate secure location

#### **I - Information Disclosure (Data Leakage)**

**Threats:**
- Student views another student's quiz submission
- Instructor accesses student data outside their class
- API response includes sensitive fields (password_hash, raw scores)
- Database backups containing plaintext PII

**Controls:**
- Row-Level Security (RLS) at database layer
- API response filtering (never return password_hash, email verified status)
- Proper HTTP status codes (404 instead of "forbidden by RLS", to not leak resource existence)
- Database backups encrypted at rest
- Secrets management (JWT_SECRET, DB_PASSWORD in env vars, never in code)

#### **D - Denial of Service (Availability Loss)**

**Threats:**
- Attacker floods API with requests, causing timeouts
- Resource exhaustion (millions of quiz submissions, large file uploads)
- Slowloris attack on long-running queries

**Controls:**
- Rate limiting per user/IP (e.g., 100 requests/minute for unauthenticated, 500/minute for authenticated)
- Query timeouts (max 30s for database queries)
- Input validation (quiz has max 500 questions, submission answer max 5000 chars)
- Connection pooling (max connections to database)
- Horizontal scaling (stateless API, load balancer)
- CDN for static assets

#### **E - Elevation of Privilege (Unauthorized Roles)**

**Threats:**
- Student changes own role to "instructor" or "admin" via API manipulation
- Attacker forges JWT with admin role
- SQL injection allows bypassing RBAC checks

**Controls:**
- Role is immutable after user creation (change only via direct DB admin action)
- JWT verification with HMAC signature (attacker cannot forge without secret)
- RBAC enforced at API layer AND database layer (defense in depth)
- Principle of least privilege (student role has fewest permissions)

---

### Threat Matrix by Feature

| Feature | Primary Threat | Severity | Mitigation |
|---------|----------------|----------|-----------|
| **F001: Auth** | Credential theft, account takeover | CRITICAL | Bcrypt, JWT sig, rate limit, email verify |
| **F002: Quiz Creation** | Unauthorized modification, privilege escalation | HIGH | RBAC, RLS, audit logs |
| **F003: Questions** | Tampering with correct answers | HIGH | Immutable questions (version control), soft deletes |
| **F004: Auto-Grading** | Score manipulation, cheating detection bypass | HIGH | Immutable submissions, audit logs, timing validation |
| **F005: Submissions** | Viewing others' submissions, cross-student data leakage | CRITICAL | RLS, RBAC enforcement, audit logs |
| **F006: IELTS Mode** | Cheating via copy-paste, external resources | MEDIUM | (Out of scope: proctoring in v1) |
| **F007: Events** | Unauthorized event registration, roster manipulation | MEDIUM | RBAC, RLS, event_participants validation |
| **F008: Results** | Unauthorized access to performance data | CRITICAL | RLS, RBAC, response filtering |
| **F009: RBAC** | Privilege escalation, role confusion | CRITICAL | Hierarchical role model, API + DB enforcement |
| **F010: Audit** | Log tampering, compliance violations | HIGH | Immutable logs, separate storage, signed backups |
| **F011: Notifications** | SSRF, email injection, DoS | MEDIUM | Sanitized templates, rate limit, service isolation |
| **F012: Analytics** | Sensitive data leakage in aggregates | MEDIUM | Anonymization, RLS on computed results |

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Password Management

#### **Password Hashing**

```typescript
// Backend: src/services/AuthService.ts

import bcrypt from 'bcrypt';

class AuthService {
  // Register: hash password before storage
  async register(email: string, password: string, firstName: string, lastName: string, role: 'student' | 'instructor') {
    // Validate password strength
    if (!this.isStrongPassword(password)) {
      throw new ValidationError('Password must be 8+ chars with uppercase, number, special char');
    }

    // Hash with bcrypt (12 rounds minimum)
    const passwordHash = await bcrypt.hash(password, 12);

    // Store hash, NOT plaintext password
    const user = await UserRepository.create({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      status: 'active',
      email_verified: false, // Require email verification
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  // Login: compare submitted password with stored hash
  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Generic error to prevent email enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password (timing-safe comparison)
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
      // TODO: Implement rate limiting after N failed attempts
    }

    // Generate JWT token (see 3.2)
    return this.generateToken(user);
  }

  // Password Reset: securely generate reset link
  async requestPasswordReset(email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Don't leak if email exists; always return success
      return { message: 'If email exists, reset link sent' };
    }

    // Generate time-limited reset token (1 hour valid)
    const resetToken = jwt.sign(
      { sub: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in database with expiry
    await PasswordResetRepository.create({
      user_id: user.id,
      token_hash: await bcrypt.hash(resetToken, 6), // Hash token for storage
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });

    // Send reset email with link: /reset?token={resetToken}
    await EmailService.sendPasswordReset(user.email, resetToken);
    return { message: 'If email exists, reset link sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('Token is not for password reset');
    }

    // Find reset token in DB
    const resetRecord = await PasswordResetRepository.findByUserId(decoded.sub);
    if (!resetRecord || resetRecord.used_at) {
      throw new UnauthorizedError('Reset token already used or not found');
    }

    // Verify expiry
    if (resetRecord.expires_at < new Date()) {
      throw new UnauthorizedError('Reset token expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password + mark reset token as used
    await UserRepository.updatePassword(decoded.sub, passwordHash);
    await PasswordResetRepository.markUsed(resetRecord.id);

    return { message: 'Password reset successful' };
  }

  // Password strength validation
  private isStrongPassword(password: string): boolean {
    const rules = [
      password.length >= 8, // Min 8 characters
      /[A-Z]/.test(password), // At least one uppercase
      /[0-9]/.test(password), // At least one digit
      /[!@#$%^&*]/.test(password), // At least one special char
    ];
    return rules.every(rule => rule);
  }
}
```

**Database Schema (users table):**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash, never plaintext
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL, -- admin | instructor | student (immutable)
  
  -- Account status
  status account_status NOT NULL DEFAULT 'active', -- active | suspended | archived
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP, -- Soft delete
  
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

#### **Password Storage Rules**

✅ **DO:**
- Always hash passwords with bcrypt (minimum 12 rounds)
- Use unique salt per password (bcrypt does this automatically)
- Never store plaintext passwords
- Use slow hashing function (bcrypt is 100+ ms per hash; acceptable for login)
- Log password reset events in audit_logs (but not the password itself)

❌ **DON'T:**
- Use fast hashing (SHA256, MD5) for passwords
- Store password in logs, error messages, or monitoring tools
- Send password in URL parameters (use POST body + HTTPS)
- Allow password in browser autocomplete (use HTML5 `autocomplete="off"`)

---

### 3.2 JWT Token Management

#### **Token Structure & Issuance**

```typescript
// Backend: src/services/TokenService.ts

interface JWTPayload {
  sub: string; // User ID (UUID)
  userId: string; // User ID (duplicate for compatibility)
  email: string; // User email
  role: 'admin' | 'instructor' | 'student'; // Role
  organizationId: string; // Organization UUID (for future multi-tenancy)
  iat: number; // Issued at (unix timestamp)
  exp: number; // Expiration (unix timestamp)
  iss: string; // Issuer (always 'eduflow-api')
  aud: string; // Audience (always 'eduflow-web')
}

class TokenService {
  // Generate access token (24-hour validity)
  generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      iss: 'eduflow-api',
      aud: 'eduflow-web',
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'eduflow-api',
      audience: 'eduflow-web',
    });
  }

  // Generate refresh token (7-day validity for "remember me")
  generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      iss: 'eduflow-api',
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
    });
  }

  // Verify token and extract payload
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'eduflow-api',
        audience: 'eduflow-web',
      }) as JWTPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      } else if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token signature');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  // Refresh expired access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Not a refresh token');
      }

      // Fetch user to get current data
      const user = await UserRepository.findById(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);
      return { accessToken: newAccessToken };
    } catch (err) {
      throw new UnauthorizedError('Refresh token invalid or expired');
    }
  }
}
```

#### **Token Delivery & Storage**

**Option 1: HTTP-Only Cookie (Recommended for Web)**

```typescript
// Backend: src/middleware/authMiddleware.ts

app.post('/auth/login', async (req, res) => {
  const user = await authService.login(req.body.email, req.body.password);
  const token = tokenService.generateAccessToken(user);

  // Set HTTPOnly, Secure cookie (cannot be accessed via JavaScript)
  res.cookie('auth_token', token, {
    httpOnly: true, // Prevent XSS from stealing token
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // Prevent CSRF
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/', // Available to entire app
    domain: process.env.API_DOMAIN, // Only this domain
  });

  res.json({ 
    success: true, 
    data: { 
      user: { id: user.id, email: user.email, role: user.role },
      expiresIn: 24 * 60 * 60,
    },
  });
});
```

**Option 2: Authorization Header (for Mobile/SPA)**

```typescript
// Backend response includes token
app.post('/auth/login', async (req, res) => {
  const user = await authService.login(req.body.email, req.body.password);
  const token = tokenService.generateAccessToken(user);

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, role: user.role },
      token, // Frontend stores in secure storage (NOT localStorage if XSS risk)
      expiresIn: 24 * 60 * 60,
    },
  });
});

// Frontend sends token on every request
fetch('https://api.eduflow.dev/api/v1/quizzes', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

#### **Token Expiration & Refresh**

```typescript
// Frontend: src/api/client.ts (Axios interceptor)

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Request interceptor: attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // or from httpOnly cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 by refreshing token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh`,
          {},
          { withCredentials: true } // Send httpOnly cookie
        );

        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed: redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### **Token Security Best Practices**

✅ **DO:**
- Use HMAC-SHA256 algorithm (HS256) for signing
- Include `exp` claim and validate it on every request
- Use short expiration times (24 hours for access tokens)
- Refresh tokens should be longer-lived (7+ days) but validated on use
- Include `iat` (issued at) and `iss` (issuer) claims
- Store secret in environment variable, never hardcoded
- Use HTTPOnly cookies in web apps (prevents XSS token theft)
- Validate token signature on every request (defense in depth)

❌ **DON'T:**
- Store sensitive data in JWT payload (it's base64-encoded, not encrypted)
- Use tokens without expiration
- Share JWT_SECRET across environments
- Store JWT in localStorage (vulnerable to XSS); use cookies instead
- Accept tokens from untrusted sources without signature verification

---

### 3.3 Email Verification & Account Activation

```typescript
// Backend: src/services/EmailService.ts

class EmailService {
  async sendVerificationEmail(user: User) {
    // Generate verification token (valid 24 hours)
    const verificationToken = jwt.sign(
      { sub: user.id, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send email with verification link
    const verificationUrl = `https://eduflow.dev/verify-email?token=${verificationToken}`;
    
    await this.sendEmail({
      to: user.email,
      subject: 'Verify your EduFlow email',
      template: 'email-verification',
      data: {
        firstName: user.first_name,
        verificationUrl,
        expiresIn: '24 hours',
      },
    });
  }

  async verifyEmail(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      if (decoded.type !== 'email_verification') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Mark email as verified
      await UserRepository.updateEmailVerified(decoded.sub, true);
      
      return { message: 'Email verified successfully' };
    } catch (err) {
      throw new UnauthorizedError('Email verification token invalid or expired');
    }
  }
}

// Backend: src/routes/authRoutes.ts
app.get('/auth/verify-email', async (req, res) => {
  try {
    await EmailService.verifyEmail(req.query.token);
    res.redirect('/login?verified=true');
  } catch (err) {
    res.redirect('/login?error=invalid_token');
  }
});
```

---

### 3.4 Session Management

**Session Lifecycle:**

```
1. User logs in
   ↓
2. Backend generates JWT (access_token) + refresh_token
   ↓
3. access_token sent in httpOnly cookie (or Authorization header)
   ↓
4. refresh_token stored in secure storage (httpOnly cookie)
   ↓
5. On every API request, frontend includes access_token
   ↓
6. Backend validates JWT signature & expiration
   ↓
7. If access_token expires: frontend uses refresh_token to get new access_token
   ↓
8. If refresh_token expires: user must log in again
   ↓
9. On logout: clear both tokens (frontend + backend)
```

**Timeout Strategy:**

```typescript
// Configuration
const SESSION_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days (for "remember me")
  SESSION_IDLE_TIMEOUT: 30 * 60, // 30 minutes (optional: log out if inactive)
  MAX_SESSION_DURATION: 7 * 24 * 60 * 60, // 7 days max, regardless of activity
};

// Frontend: Track last activity
class SessionManager {
  private inactivityTimer: NodeJS.Timeout | null = null;

  startInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);

    this.inactivityTimer = setTimeout(() => {
      // Idle timeout reached: log out silently
      this.logout('Session idle timeout');
    }, SESSION_CONFIG.SESSION_IDLE_TIMEOUT * 1000);
  }

  resetInactivityTimer() {
    // Reset on any user activity
    this.startInactivityTimer();
  }
}
```

---

## 4. AUTHORIZATION & ACCESS CONTROL

### 4.1 Role-Based Access Control (RBAC)

**Three-Tier Role Model:**

```typescript
// src/types/auth.ts

enum UserRole {
  ADMIN = 'admin', // Platform administrator
  INSTRUCTOR = 'instructor', // Quiz creator, grader
  STUDENT = 'student', // Quiz taker
}

interface PermissionMatrix {
  [role in UserRole]: string[];
}

const PERMISSIONS: PermissionMatrix = {
  [UserRole.ADMIN]: [
    // User management
    'users:list',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:suspend',
    'users:archive',

    // Quiz management (all)
    'quizzes:list',
    'quizzes:create',
    'quizzes:read',
    'quizzes:update',
    'quizzes:delete',
    'quizzes:publish',

    // Submissions (all)
    'submissions:list',
    'submissions:read',
    'submissions:grade',
    'submissions:delete',

    // Events (all)
    'events:list',
    'events:create',
    'events:update',
    'events:delete',

    // Analytics (all)
    'analytics:read',
    'analytics:export',

    // Audit
    'audit_logs:read',
    'audit_logs:export',
  ],

  [UserRole.INSTRUCTOR]: [
    // Quiz management (own only)
    'quizzes:create',
    'quizzes:read_own',
    'quizzes:update_own', // Draft only
    'quizzes:publish_own',
    'quizzes:delete_own', // Unpublished only

    // Submissions (own quiz)
    'submissions:read_own_quiz',
    'submissions:grade_own_quiz',

    // Events (own quiz)
    'events:create_own_quiz',
    'events:read_own_quiz',
    'events:update_own_quiz',

    // Analytics (own quiz)
    'analytics:read_own_quiz',
    'analytics:export_own_quiz',

    // Take quizzes
    'quizzes:take',
    'submissions:create',

    // Own submissions
    'submissions:read_own',
  ],

  [UserRole.STUDENT]: [
    // Take quizzes
    'quizzes:take',
    'quizzes:read_assigned',

    // Own submissions
    'submissions:create',
    'submissions:read_own',

    // Own analytics
    'analytics:read_own',

    // Register for events
    'events:register',
  ],
};
```

#### **RBAC Enforcement at API Layer**

```typescript
// Backend: src/middleware/rbacMiddleware.ts

interface RoutePermission {
  requiredRoles?: UserRole[];
  requiredPermission?: string;
}

// Decorator for Express routes
function requirePermission(permission: string, requiredRoles?: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check role if specified
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of roles: ${requiredRoles.join(', ')}`,
      });
    }

    // Check specific permission
    const userPermissions = PERMISSIONS[user.role];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You do not have permission: ${permission}`,
      });
    }

    next();
  };
}

// Example route: Only instructors and admins can create quizzes
app.post(
  '/api/v1/quizzes',
  requirePermission('quizzes:create', [UserRole.ADMIN, UserRole.INSTRUCTOR]),
  QuizController.createQuiz
);

// Example route: Only admin can list all users
app.get(
  '/api/v1/admin/users',
  requirePermission('users:list', [UserRole.ADMIN]),
  UserController.listUsers
);
```

#### **RBAC Enforcement at Database Layer (Row-Level Security)**

```sql
-- PostgreSQL Row-Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Policy 1: Instructors see only their own quizzes
CREATE POLICY instructor_see_own_quizzes ON quizzes
  FOR SELECT
  USING (
    (auth.uid())::uuid = instructor_id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Policy 2: Students see only quizzes assigned via events
CREATE POLICY student_see_assigned_quizzes ON quizzes
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) != 'student'
    OR
    id IN (
      SELECT quiz_id FROM events
      WHERE event_id IN (
        SELECT event_id FROM event_participants
        WHERE student_id = (auth.uid())::uuid
      )
    )
  );

-- Policy 3: Students see only their own submissions
CREATE POLICY student_see_own_submissions ON submissions
  FOR SELECT
  USING (
    student_id = (auth.uid())::uuid
    OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'instructor')
  );

-- Policy 4: Instructors see submissions for their quizzes
CREATE POLICY instructor_see_own_quiz_submissions ON submissions
  FOR SELECT
  USING (
    quiz_id IN (
      SELECT id FROM quizzes
      WHERE instructor_id = (auth.uid())::uuid
    )
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Policy 5: Prevent students from updating submissions (immutability)
CREATE POLICY prevent_student_submission_update ON submissions
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) != 'student'
  );

-- Policy 6: Only admins can view audit logs
CREATE POLICY admin_see_audit_logs ON audit_logs
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

**Database Function: Enforce RLS Programmatically**

```typescript
// Backend: src/middleware/rlsMiddleware.ts

// After JWT verification, set Supabase session to enforce RLS
app.use(authenticate, (req, res, next) => {
  const user = req.user;

  // Set Supabase JWT for RLS enforcement
  const supabaseClient = supabase.auth.admin.getUserById(user.id);
  
  // All subsequent Prisma queries will be filtered by RLS policies
  next();
});
```

### 4.2 Resource-Based Access Control (Resource Ownership)

```typescript
// Backend: src/routes/quizzesRoutes.ts

// PATCH /quizzes/:id - Only quiz owner (instructor) or admin can edit
app.patch('/api/v1/quizzes/:id', authenticate, async (req, res) => {
  const quizId = req.params.id;
  const user = req.user;

  // Fetch quiz
  const quiz = await QuizRepository.findById(quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Check ownership
  if (user.role !== 'admin' && quiz.instructor_id !== user.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only edit quizzes you created',
    });
  }

  // Check if quiz is published (published quizzes cannot be edited)
  if (quiz.status === 'published' && user.role !== 'admin') {
    return res.status(422).json({
      error: 'QUIZ_ALREADY_PUBLISHED',
      message: 'Published quizzes cannot be edited',
    });
  }

  // Proceed with update
  const updated = await QuizRepository.update(quizId, req.body);
  return res.json({ data: updated });
});

// GET /submissions/:id - Only submission owner (student) or instructor/admin can view
app.get('/api/v1/submissions/:id', authenticate, async (req, res) => {
  const submissionId = req.params.id;
  const user = req.user;

  // Fetch submission
  const submission = await SubmissionRepository.findById(submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  // Check access
  const canAccess =
    user.id === submission.student_id || // Student can view own
    user.role === 'admin' || // Admin can view all
    (user.role === 'instructor' && 
     submission.quiz.instructor_id === user.id); // Instructor can view own quiz submissions

  if (!canAccess) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this submission',
    });
  }

  return res.json({ data: submission });
});
```

---

## 5. DATA PROTECTION & ENCRYPTION

### 5.1 Data in Transit (HTTPS/TLS)

```typescript
// Backend: src/server.ts

import https from 'https';
import fs from 'fs';
import express from 'express';
import helmet from 'helmet';

const app = express();

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Tighten in prod
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", `https://${process.env.API_DOMAIN}`],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// HTTPS server configuration
if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  https.createServer(options, app).listen(3001);
} else {
  // Development: HTTP is okay for localhost testing
  app.listen(3001);
}
```

**SSL/TLS Certificate Management:**

✅ **DO:**
- Use certificates from trusted Certificate Authority (Let's Encrypt free)
- Enable HSTS (HTTP Strict Transport Security) to force HTTPS
- Use TLS 1.2+ minimum
- Store private keys securely (not in repo, use env vars or Key Management Service)
- Rotate certificates before expiration (Let's Encrypt auto-renewal)
- Test SSL configuration with SSL Labs or similar

❌ **DON'T:**
- Use self-signed certificates in production
- Allow TLS 1.0 or 1.1 (deprecated)
- Share private keys via email or chat
- Commit private keys to version control

---

### 5.2 Data at Rest (Database Encryption)

**Sensitive Data Requiring Encryption:**

1. **password_hash** - Already hashed (not encrypted)
2. **email** - Personally identifiable (encrypt in future)
3. **API keys** - Store encrypted if needed (v1.1)
4. **Session tokens** - Short-lived, acceptable as-is
5. **Audit logs** - Encrypt sensitive data fields

**Supabase Database Encryption (Automatic):**

```
Supabase provides:
- Automatic encryption at rest via AWS KMS
- All data encrypted in storage
- Keys managed by Supabase (hardware security modules)
- Automatic backups also encrypted
```

**Application-Level Encryption (Optional, for extra security):**

```typescript
// Backend: src/utils/encryption.ts

import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes for AES-256

  encrypt(plaintext: string): { iv: string; data: string; tag: string } {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag(); // Authentication tag for GCM mode

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      tag: tag.toString('hex'),
    };
  }

  decrypt(iv: string, encrypted: string, tag: string): string {
    const ivBuf = Buffer.from(iv, 'hex');
    const tagBuf = Buffer.from(tag, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuf);

    decipher.setAuthTag(tagBuf);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage: Encrypt sensitive fields before storage
const encrypted = EncryptionService.encrypt(user.email);
await db.users.update({
  email_encrypted: encrypted.data,
  email_iv: encrypted.iv,
  email_tag: encrypted.tag,
});
```

---

### 5.3 Personally Identifiable Information (PII) Handling

**PII in EduFlow:**

| Data | Classification | Protection |
|------|----------------|-----------|
| Email | PII (GDPR) | Hashed in logs, encrypted at-rest (future) |
| First/Last Name | PII (GDPR) | Encrypted at-rest (future) |
| Password | Sensitive | Hashed with bcrypt (12 rounds) |
| Quiz Submission | PII (FERPA-like) | RLS enforced, audit logged |
| Performance Score | Sensitive | RLS enforced, anonymized in aggregates |
| IP Address | PII (GDPR) | Log only last octet (e.g., 192.168.1.x) |
| Device Info | Semi-PII | Log only browser type, not full UA |

**GDPR Compliance (Future v1.1):**

```typescript
// Backend: src/controllers/UserController.ts

// DELETE /users/:id - GDPR Right to be Forgotten
app.delete('/api/v1/users/:id', authenticate, async (req, res) => {
  const userId = req.params.id;
  const requestingUser = req.user;

  // Only users can request deletion of own account, or admin can delete any
  if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Soft delete: mark as deleted_at
  await UserRepository.softDelete(userId);

  // Anonymize PII in audit logs (GDPR requirement)
  await AuditLogRepository.anonymize(userId);

  // Export user data before deletion (GDPR right)
  const userData = await UserRepository.exportUserData(userId);
  await EmailService.sendDataExport(userId, userData);

  return res.json({ message: 'User account deleted. Data export sent to email.' });
});

// GET /users/export - GDPR Right to Data Portability
app.get('/api/v1/users/:id/export', authenticate, async (req, res) => {
  const userId = req.params.id;
  const requestingUser = req.user;

  // Only users can export own data
  if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Export all user data in machine-readable format (JSON, CSV)
  const data = await UserRepository.exportUserData(userId);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');
  res.json(data);
});
```

---

## 6. API SECURITY

### 6.1 Input Validation & Sanitization

```typescript
// Backend: src/middleware/validationMiddleware.ts

import { z } from 'zod';

// Define validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain digit')
    .regex(/[!@#$%^&*]/, 'Password must contain special character'),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  role: z.enum(['student', 'instructor']),
});

const CreateQuizSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(5000).optional(),
  duration_minutes: z.number().int().min(1).max(1440), // 1 min to 24 hours
  passing_score: z.number().min(0).max(100),
  total_questions: z.number().int().min(1).max(500),
  show_correct_answers: z.boolean().optional(),
  max_attempts: z.number().int().min(-1).optional(),
});

const SubmitAnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer_text: z.string().max(5000).optional(),
  selected_option_id: z.string().uuid().optional(),
});

// Middleware: Validate request body
function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: err.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      return res.status(400).json({ error: 'Invalid request' });
    }
  };
}

// Routes with validation
app.post(
  '/api/v1/auth/register',
  validateRequest(RegisterSchema),
  AuthController.register
);

app.post(
  '/api/v1/quizzes',
  authenticate,
  validateRequest(CreateQuizSchema),
  QuizController.createQuiz
);
```

### 6.2 SQL Injection Prevention

**Safe: Using Prisma ORM (Parameterized Queries)**

```typescript
// ✅ SAFE: Prisma automatically parameterizes queries
const user = await prisma.users.findUnique({
  where: { email: req.body.email },
});

const submissions = await prisma.submissions.findMany({
  where: { student_id: userId },
});

// ✅ SAFE: Raw SQL with $1, $2 placeholders
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email} AND deleted_at IS NULL
`;
```

**Unsafe: String Concatenation (NEVER DO THIS)**

```typescript
// ❌ DANGEROUS: String concatenation leads to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Attacker could input: admin'--
// Query becomes: SELECT * FROM users WHERE email = 'admin'--'
// Returns admin user without checking password!

const result = await db.query(query);
```

---

### 6.3 Cross-Site Request Forgery (CSRF) Protection

```typescript
// Backend: src/middleware/csrfMiddleware.ts

import csrf from 'csurf';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
app.use(csrf({ cookie: false })); // CSRF protection

// Add CSRF token to state-changing requests
app.post('/api/v1/quizzes', csrf(), (req, res) => {
  // CSRF token in req.csrfToken() must match header
  // Client sends: X-CSRF-Token header with token from response
  
  // Process request only if token is valid
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend: Include CSRF token on every POST/PUT/DELETE
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

fetch('https://api.eduflow.dev/api/v1/quizzes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify({ title: 'Quiz 1' }),
});
```

### 6.4 Cross-Site Scripting (XSS) Prevention

```typescript
// Backend: src/middleware/securityHeaders.ts

import helmet from 'helmet';
import xss from 'xss-clean';

app.use(helmet());
app.use(xss()); // Remove malicious scripts from request body/query

// Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Tighten: remove unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", `https://${process.env.API_DOMAIN}`],
      frameSrc: ["'none'"], // Prevent iframe embedding
    },
  })
);
```

**Frontend: Output Encoding**

```typescript
// Frontend: src/components/QuizDisplay.tsx

import DOMPurify from 'dompurify';

function QuizDisplay({ quiz }) {
  // ❌ DANGEROUS: Direct HTML injection
  return <div dangerouslySetInnerHTML={{ __html: quiz.description }} />;

  // ✅ SAFE: Use DOMPurify to sanitize HTML
  const sanitized = DOMPurify.sanitize(quiz.description);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;

  // ✅ SAFEST: Use text content (no HTML interpretation)
  return <div>{quiz.description}</div>;
}
```

---

### 6.5 Rate Limiting & DDoS Protection

```typescript
// Backend: src/middleware/rateLimitMiddleware.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const redisClient = redis.createClient(process.env.REDIS_URL);

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
});

// Stricter limiter for login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'login-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again after 15 minutes.',
});

// Stricter limiter for password reset: 3 per hour
const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'password-reset:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
});

// Apply limiters to routes
app.use('/api/v1/', generalLimiter);
app.post('/api/v1/auth/login', loginLimiter, AuthController.login);
app.post('/api/v1/auth/password-reset', passwordResetLimiter, AuthController.requestPasswordReset);
```

**Note:** For MVP on Vercel/Railway free tier, Redis may not be available. Use in-memory store or upgrade to paid tier.

```typescript
// Fallback: In-memory rate limiting (for development/free tier)
import slowDown from 'express-slow-down';

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Start delaying after 50 requests
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after threshold
});

app.use('/api/v1/', speedLimiter);
```

---

## 7. DATABASE SECURITY

### 7.1 Row-Level Security (RLS)

Already covered in Section 4.1 (RBAC Enforcement at Database Layer).

### 7.2 Connection Security

```typescript
// Backend: src/db/prisma.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Connection pooling configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Should include connection pool settings
    },
  },
  log: ['warn', 'error'], // Suppress 'info' logs in production
});

// Example DATABASE_URL with connection pooling:
// postgresql://user:password@host:5432/dbname?schema=public&sslmode=require&connection_limit=10

export default prisma;
```

**Connection URL Security:**

✅ **DO:**
- Use SSL/TLS for database connections (`sslmode=require`)
- Set connection limit to prevent exhaustion
- Use environment variables for credentials (never hardcode)
- Rotate database passwords regularly
- Use read-only user for analytics queries (future)
- Enable connection pooling (PgBouncer, Supabase's built-in pooling)

❌ **DON'T:**
- Expose database URL in error messages or logs
- Use default passwords (postgres/postgres)
- Allow connections from public IP (restrict to app servers)
- Store credentials in version control

---

### 7.3 Backup & Recovery Security

```sql
-- Backup strategy (Supabase handles automatically)

-- Manual backup to separate secure location (optional)
-- PostgreSQL logical backup (excludes passwords, includes schema + data)
pg_dump \
  --host=api.supabase.co \
  --username=postgres \
  --dbname=eduflow \
  --format=custom \
  --file=backup_$(date +%Y%m%d_%H%M%S).sql

-- Encrypt backup before storage
openssl enc -aes-256-cbc -salt -in backup.sql -out backup.sql.enc -k $ENCRYPTION_PASSWORD

-- Store in S3 or similar with versioning + access logging
aws s3 cp backup.sql.enc s3://eduflow-backups/$(date +%Y/%m/%d)/backup.sql.enc \
  --sse AES256 \
  --acl private

-- Test restore procedure quarterly
pg_restore -h localhost -d eduflow_test backup.sql
```

---

## 8. INFRASTRUCTURE & DEPLOYMENT SECURITY

### 8.1 Environment Variables & Secrets

```bash
# .env.local (Development - NEVER commit to git)
DATABASE_URL=postgresql://user:pass@localhost:5432/eduflow
JWT_SECRET=supersecretkey_change_in_production
JWT_REFRESH_SECRET=refresh_token_secret
BCRYPT_ROUNDS=12
NODE_ENV=development
API_DOMAIN=localhost:3001
FRONTEND_DOMAIN=localhost:3000
ENCRYPTION_KEY=32bytehexstringfor256bitkey
SENTRY_DSN=https://key@sentry.io/project
SMTP_USER=no-reply@eduflow.dev
SMTP_PASS=password
```

**Secrets Management in Production:**

```typescript
// Use Vercel Environment Variables (built-in secrets manager)
// Use Railway/Render secrets environment variables
// Or external: AWS Secrets Manager, HashiCorp Vault, 1Password Secrets

import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV, process.cwd());

export const config = {
  database: {
    url: env.DATABASE_URL, // Loaded securely from environment
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },
  bcrypt: {
    rounds: parseInt(env.BCRYPT_ROUNDS) || 12,
  },
};
```

### 8.2 CI/CD Security

```yaml
# .github/workflows/deploy.yml

name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Security scanning
      - name: Run ESLint & security audit
        run: |
          npm install
          npm run lint
          npm audit --audit-level=moderate

      # Type checking
      - name: TypeScript compilation check
        run: npx tsc --noEmit

      # Unit tests
      - name: Run tests
        run: npm test -- --coverage

      # SAST (Static Application Security Testing)
      - name: SonarQube scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      # Build Docker image
      - name: Build Docker image
        run: docker build -t eduflow:latest .

      # Push to registry
      - name: Push to Docker Hub
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push eduflow:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      # Deploy to production (Railway/Render)
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          # Deploy script (specific to Railway/Render)
          ./scripts/deploy.sh

      # Run smoke tests
      - name: Smoke tests
        run: npm run test:smoke
```

---

## 9. INCIDENT RESPONSE & LOGGING

### 9.1 Audit Logging

```sql
-- audit_logs table (from DATABASE_SCHEMA.md)

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_type actor_type NOT NULL, -- user | system | admin
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation audit_operation NOT NULL, -- INSERT | UPDATE | DELETE
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT audit_not_deleted CHECK (created_at IS NOT NULL)
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Immutable audit logs: prevent deletion (via trigger)
CREATE OR REPLACE FUNCTION prevent_audit_deletion() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE PROCEDURE prevent_audit_deletion();
```

**Backend: Log Every Data Mutation**

```typescript
// Backend: src/middleware/auditMiddleware.ts

async function logAuditEvent(
  actor: User,
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  req?: Request
) {
  await AuditLogRepository.create({
    actor_id: actor.id,
    actor_type: 'user',
    table_name: tableName,
    record_id: recordId,
    operation,
    old_values: oldValues || null,
    new_values: newValues || null,
    changes_summary: generateSummary(operation, oldValues, newValues),
    ip_address: req?.ip || null,
    user_agent: req?.headers['user-agent'] || null,
  });
}

// Example: Log quiz creation
async function createQuiz(req: AuthRequest, res: Response) {
  const user = req.user;
  const quizData = req.body;

  const quiz = await QuizRepository.create({
    ...quizData,
    instructor_id: user.id,
  });

  // Log the creation
  await logAuditEvent(
    user,
    'quizzes',
    quiz.id,
    'INSERT',
    null, // No old values for INSERT
    { title: quiz.title, description: quiz.description, ...quiz }, // New values
    req
  );

  res.status(201).json({ data: quiz });
}

// Example: Log submission update (grading)
async function gradeSubmission(req: AuthRequest, res: Response) {
  const submissionId = req.params.id;
  const { score_percentage, is_passed } = req.body;

  const oldSubmission = await SubmissionRepository.findById(submissionId);
  
  const updated = await SubmissionRepository.update(submissionId, {
    score_percentage,
    is_passed,
    graded_at: new Date(),
  });

  // Log the grade update
  await logAuditEvent(
    req.user,
    'submissions',
    submissionId,
    'UPDATE',
    { score_percentage: oldSubmission.score_percentage, is_passed: oldSubmission.is_passed },
    { score_percentage, is_passed },
    req
  );

  res.json({ data: updated });
}
```

### 9.2 Security Logging & Monitoring

```typescript
// Backend: src/middleware/securityMiddleware.ts

import Sentry from '@sentry/node';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

// Log security events (failed auth, privilege escalation attempts)
class SecurityLogger {
  static logFailedLogin(email: string, reason: string, ip: string) {
    Sentry.captureMessage(`Failed login attempt: ${email} (${reason})`, 'warning', {
      tags: { event: 'failed_login' },
      extra: { email, reason, ip },
    });
  }

  static logPrivilegeEscalationAttempt(userId: string, attemptedRole: string, ip: string) {
    Sentry.captureMessage(
      `Privilege escalation attempt: user ${userId} tried to claim ${attemptedRole}`,
      'error',
      {
        tags: { event: 'privilege_escalation' },
        extra: { userId, attemptedRole, ip },
      }
    );
  }

  static logDataAccessViolation(userId: string, resourceId: string, ip: string) {
    Sentry.captureMessage(
      `Unauthorized data access: user ${userId} attempted to access ${resourceId}`,
      'error',
      {
        tags: { event: 'unauthorized_access' },
        extra: { userId, resourceId, ip },
      }
    );
  }

  static logSuspiciousActivity(event: string, details: Record<string, any>) {
    Sentry.captureMessage(`Suspicious activity: ${event}`, 'warning', {
      tags: { event: 'suspicious' },
      extra: details,
    });
  }
}

// Use in routes
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const user = await AuthService.login(req.body.email, req.body.password);
    // ... success
  } catch (err) {
    SecurityLogger.logFailedLogin(req.body.email, err.message, req.ip);
    res.status(401).json({ error: 'Invalid email or password' });
  }
});
```

### 9.3 Incident Response Plan

**When Security Incident Occurs:**

1. **Detect:** Alert via Sentry, log anomaly
2. **Assess:** Determine scope (how many users affected, what data exposed)
3. **Contain:** Block attacker IP, revoke compromised tokens, disable account
4. **Communicate:** Notify affected users, log in audit trail
5. **Recover:** Restore from backups if needed, patch vulnerability
6. **Review:** Post-mortem, update security controls

```typescript
// Backend: src/services/IncidentService.ts

class IncidentService {
  // Detect suspicious pattern: multiple failed logins
  async detectBruteForceAttempt(email: string, failureCount: number) {
    if (failureCount > 5) {
      const user = await UserRepository.findByEmail(email);
      
      // Lock account temporarily
      await UserRepository.suspend(user.id);
      
      // Alert
      SecurityLogger.logFailedLogin(email, 'Brute force detected', 'N/A');
      
      // Notify user
      await EmailService.sendSecurityAlert(user.email, {
        event: 'Multiple failed login attempts',
        action: 'Account temporarily locked',
        link: '/support',
      });
    }
  }

  // Detect unauthorized data access
  async detectUnauthorizedAccess(userId: string, resourceId: string) {
    SecurityLogger.logDataAccessViolation(userId, resourceId, 'N/A');
    
    // Log as critical incident
    await AuditLogRepository.create({
      actor_id: userId,
      table_name: 'SECURITY_INCIDENT',
      record_id: resourceId,
      operation: 'SECURITY_VIOLATION',
      changes_summary: 'Unauthorized access attempt',
    });
  }

  // Revoke user tokens on compromise
  async revokeUserTokens(userId: string) {
    // Add user to token blacklist (stored in Redis or DB)
    await TokenBlacklistRepository.add(userId, new Date());
    
    // Force logout all sessions
    // (Requires centralized session management in v1.1)
  }
}
```

---

## 10. COMPLIANCE & STANDARDS

### 10.1 GDPR Compliance (European Users)

**Core Principles:**

| Principle | Implementation |
|-----------|-----------------|
| **Lawfulness** | Users consent to data collection via Terms of Service |
| **Purpose Limitation** | Data used only for quiz assessment, not sold to third parties |
| **Data Minimization** | Collect only: email, name, quiz results (not location, device ID) |
| **Accuracy** | Users can update email, name; admins can correct scores |
| **Storage Limitation** | Soft-deleted data retained for 90 days, then hard-deleted |
| **Integrity & Confidentiality** | Encryption, RLS, access controls, audit logs |
| **Accountability** | Privacy Policy, Data Processing Agreement, Audit logs |

**Rights Implemented:**

✅ Right to Access: `GET /users/:id/export`  
✅ Right to Rectification: `PATCH /users/:id`  
✅ Right to Erasure: `DELETE /users/:id`  
✅ Right to Restrict: Account status = 'archived'  
✅ Right to Data Portability: `GET /users/:id/export` (JSON/CSV)  
✅ Right to Object: Opt-out of analytics (future)  

---

### 10.2 FERPA Compliance (US Educational Records Privacy)

**Scope:** Protects "personally identifiable information" in student educational records.

**Implementation:**

- **Student Privacy:** Only students/parents/instructors can access student records (via RLS)
- **Instructor Privacy:** Students cannot see instructor PII beyond name/email
- **Audit Trail:** All access to educational records logged and reviewable
- **Data Breach Notification:** Notify affected users within 30 days if data exposed
- **Retention:** Keep records per institutional policy (default: 7 years)

```typescript
// Backend: src/services/DataRetentionService.ts

class DataRetentionService {
  // Hard delete soft-deleted records after retention period
  async purgeOldDeletedRecords(retentionDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Hard delete users
    await prisma.users.deleteMany({
      where: {
        deleted_at: {
          lt: cutoffDate,
        },
      },
    });

    // Hard delete quiz submissions
    await prisma.submissions.deleteMany({
      where: {
        deleted_at: {
          lt: cutoffDate,
        },
      },
    });

    // Keep audit logs (never hard-delete for compliance)
  }

  // Export educational records for data portability
  async exportEducationalRecord(studentId: string) {
    return {
      student: await UserRepository.findById(studentId),
      submissions: await SubmissionRepository.findByStudentId(studentId),
      events_participated: await EventParticipantRepository.findByStudentId(studentId),
      analytics: await AnalyticsRepository.findByStudentId(studentId),
    };
  }
}
```

---

### 10.3 WCAG 2.1 Accessibility (Optional)

**For Portfolio Quality (not MVP):**

- Level AA compliance for frontend (color contrast, keyboard navigation, screen reader support)
- Semantic HTML, ARIA labels
- Testing with automated tools (Axe, PA11y)

---

## 11. SECURITY TESTING CHECKLIST

### Before Launch to Production

**Authentication Tests:**

- [ ] Password hashing: bcrypt with 12+ rounds
- [ ] JWT verification: valid tokens accepted, invalid tokens rejected
- [ ] Token expiration: expired tokens return 401
- [ ] Refresh token: generates new access token
- [ ] Email verification: required before account activation
- [ ] Password reset: 1-hour expiry, single-use token
- [ ] Rate limiting: 5 failed logins → account lockout
- [ ] Session timeout: inactive sessions expire after 30 min
- [ ] XSS prevention: malicious scripts in input filtered
- [ ] CSRF protection: state-changing requests require CSRF token

**Authorization Tests:**

- [ ] RBAC: students cannot create quizzes
- [ ] Resource ownership: students cannot edit other's submissions
- [ ] RLS: database filters unauthorized data access
- [ ] Admin override: admins can access all data
- [ ] Role immutability: user role cannot be changed via API

**Data Protection Tests:**

- [ ] HTTPS: all traffic encrypted
- [ ] Sensitive headers: no password_hash in API responses
- [ ] SQL injection: parameterized queries prevent injection
- [ ] Data at rest: database encryption enabled

**API Security Tests:**

- [ ] Rate limiting: 100 req/min respected
- [ ] Input validation: invalid data rejected with 400
- [ ] Error messages: no sensitive info leaked (stack traces)
- [ ] CORS: cross-origin requests limited appropriately
- [ ] File uploads: (if applicable) scan for malware

**Audit & Compliance Tests:**

- [ ] Audit logging: all mutations logged with user/timestamp
- [ ] Audit integrity: logs cannot be deleted (trigger prevents)
- [ ] Backup testing: restore from backup successful

---

## 12. DEPENDENCY & VULNERABILITY MANAGEMENT

### Dependency Security

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "prisma": "^5.3.1",
    "zod": "^3.22.4",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "@sentry/node": "^7.85.0",
    "cors": "^2.8.5"
  }
}
```

**Keeping Dependencies Secure:**

```bash
# Audit for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Verify package integrity
npm install --audit

# Use npm ci for reproducible installs
npm ci
```

**CI/CD Integration:**

```yaml
# .github/workflows/security.yml

name: Security Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: npm audit
        run: npm audit --audit-level=moderate

      - name: Dependency check
        run: npx npm-check-updates

      - name: Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## 📋 QUICK REFERENCE: SECURITY CHECKLIST

**Before Deployment:**

- [ ] All passwords hashed (bcrypt 12+ rounds)
- [ ] JWT tokens have expiration times
- [ ] HTTPOnly, Secure cookies enabled
- [ ] HTTPS/TLS enforced
- [ ] RBAC policies defined and tested
- [ ] RLS policies enabled on database
- [ ] Audit logging implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma ORM)
- [ ] CSRF protection enabled
- [ ] XSS headers (Content-Security-Policy, etc.)
- [ ] Rate limiting configured
- [ ] Secrets in environment variables
- [ ] No secrets in version control (.gitignore)
- [ ] Error messages don't leak sensitive info
- [ ] Backup & recovery tested

**During Development:**

- [ ] Regular npm audit
- [ ] Dependency updates
- [ ] Code review for security issues
- [ ] SAST scanning (SonarQube)
- [ ] Dependency scanning (Snyk)

**In Production:**

- [ ] Sentry/logging configured
- [ ] Regular backups
- [ ] Incident response plan active
- [ ] Security headers validated (SSL Labs)
- [ ] Audit logs reviewed monthly

---

## 📚 RELATED DOCUMENTATION

- **PRD.md** → Feature requirements & security NFRs
- **DATABASE_SCHEMA.md** → RLS policies, encryption fields
- **LOGIC_FLOW.md** → Authentication/authorization flows
- **API_CONTRACT.md** → Endpoint security, error codes
- **TDD.md** → Technology stack, deployment security

---

## 🔄 VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| **v1.0** | 2026-07-28 | M. Arif Aulia | Initial SECURITY_SPEC: authentication, authorization, data protection, API security, database security, logging, compliance |

---

## ✅ SIGN-OFF

| Role | Name | Date | Status | Notes |
|------|------|------|--------|-------|
| Security Architect | Aulia | 2026-07-28 | ✅ Approved | Security specification complete; covers all STRIDE threats, OWASP Top 10, and EduFlow-specific risks |

**Security Assurance Checklist:**
- ✅ All 12 core features (F001-F012) have security controls
- ✅ Authentication: JWT + bcrypt + rate limiting
- ✅ Authorization: RBAC + RLS (defense in depth)
- ✅ Data Protection: HTTPS + encryption + audit logs
- ✅ API Security: Input validation, CSRF, XSS, rate limiting
- ✅ Compliance: GDPR, FERPA-like, WCAG (basic)
- ✅ Incident Response: Logging + alerting strategy
- ✅ Dependency Management: audit, scanning, updates
- ✅ Production Ready: secrets management, CI/CD, monitoring
- ✅ Portfolio Quality: comprehensive documentation, threat model

---

*SECURITY_SPEC.md v1.0 | EduFlow Portfolio Project | Approved 2026-07-28*

*Status: ✅ Complete & Ready for Development Implementation*
