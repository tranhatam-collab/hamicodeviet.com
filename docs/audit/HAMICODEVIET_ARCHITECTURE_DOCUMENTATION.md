# HaMi Code Việt — Architecture Documentation

**Document Version:** 1.0
**Last Updated:** 2026-06-24
**Architecture Status:** MVP Phase 1

---

## Table of Contents

1. [Overview](#overview)
2. [Public Web Architecture](#public-web-architecture)
3. [App Architecture](#app-architecture)
4. [Admin Architecture](#admin-architecture)
5. [Docs Architecture](#docs-architecture)
6. [API Architecture](#api-architecture)
7. [Database Architecture](#database-architecture)
8. [Auth Architecture](#auth-architecture)
9. [Guardian Architecture](#guardian-architecture)
10. [Consent Architecture](#consent-architecture)
11. [AI Architecture](#ai-architecture)
12. [CodeLab Architecture](#codelab-architecture)
13. [Payment Architecture](#payment-architecture)
14. [Marketplace Architecture](#marketplace-architecture)
15. [School Architecture](#school-architecture)
16. [Observability Architecture](#observability-architecture)
17. [Backup Architecture](#backup-architecture)
18. [Deployment Architecture](#deployment-architecture)

---

## Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare Edge                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Public     │  │     App      │  │    Admin     │          │
│  │   Website    │  │  Platform    │  │  Platform    │          │
│  │  (Astro)     │  │   (Astro)    │  │   (Astro)    │          │
│  │  Pages       │  │   Pages      │  │   Pages      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                           ▼                                     │
│                  ┌──────────────┐                               │
│                  │     API      │                               │
│                  │  (Workers)   │                               │
│                  │    (Hono)    │                               │
│                  └──────┬───────┘                               │
│                         │                                       │
│         ┌───────────────┼───────────────┐                       │
│         │               │               │                       │
│         ▼               ▼               ▼                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │   Neon DB    │ │   Resend     │ │   Stripe     │           │
│  │ (PostgreSQL) │ │   Email      │ │  Payments    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Astro v4 | Static site generation |
| Backend | Hono on Cloudflare Workers | Serverless API |
| Database | Neon PostgreSQL | Serverless database |
| Auth | Custom JWT + PBKDF2 | Session-based authentication |
| Email | Resend API | Transactional email |
| Rate Limiting | Cloudflare Durable Objects | Globally consistent rate limiting |
| Queues | Cloudflare Queues | Email delivery with retry |
| Payment | Stripe | Payment processing |
| CDN | Cloudflare | Global edge delivery |
| DNS | Cloudflare | DNS management |

### Deployment Targets

| Component | Platform | Project | URL |
|-----------|----------|---------|-----|
| Public site | Cloudflare Pages | hamicodeviet-com | hamicodeviet.com |
| App | Cloudflare Pages | hamicodeviet-app | app.hamicodeviet.com |
| API | Cloudflare Workers | hamicodeviet-api | api.hamicodeviet.com |

---

## Public Web Architecture

### Current Implementation

```
hamicodeviet.com/
├── src/
│   ├── pages/              # Static pages
│   │   ├── index.astro     # Homepage
│   │   ├── ve-chung-toi.astro
│   │   ├── lo-trinh/       # Learning paths
│   │   ├── bai-hoc/        # Free lessons
│   │   ├── phap-ly/        # Legal pages
│   │   └── tai-lieu/       # Documentation
│   ├── components/         # Reusable components
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── data/               # Static data
│   │   ├── lessons.ts
│   │   ├── tracks.ts
│   │   └── products.ts
│   └── layouts/            # Page layouts
├── public/                 # Static assets
│   ├── _headers            # Cloudflare headers
│   ├── _redirects          # Cloudflare redirects
│   └── favicon.svg
└── astro.config.mjs        # Astro configuration
```

### Architecture Characteristics

- **Type:** Static site generation (SSG)
- **Build:** Astro v4
- **Deployment:** Cloudflare Pages
- **Routing:** File-based routing
- **Styling:** Custom CSS with CSS variables
- **I18n:** Manual bilingual content (VI/EN)
- **SEO:** Basic meta tags, robots.txt

### Data Flow

```
User Request → Cloudflare CDN → Astro Static Files → Response
```

### Current Limitations

- No dynamic content
- No personalization
- No user-specific data
- No real-time features
- Manual bilingual management
- No content management system

### Future Enhancements

- [ ] Content management system
- [ ] Dynamic personalization
- [ ] A/B testing framework
- [ ] Advanced SEO (structured data)
- [ ] Automated i18n workflow

---

## App Architecture

### Current Implementation

```
app/
├── src/
│   ├── pages/              # App pages
│   │   ├── index.astro     # App shell
│   │   ├── login.astro
│   │   ├── signup.astro
│   │   ├── dashboard.astro
│   │   ├── courses.astro
│   │   ├── course/[slug].astro
│   │   ├── lesson/[id].astro
│   │   ├── settings.astro
│   │   ├── billing.astro
│   │   ├── admin.astro
│   │   └── admin/users.astro
│   ├── layouts/            # App layouts
│   │   └── AppLayout.astro
│   ├── lib/                # Client-side utilities
│   │   └── api.ts          # API client
│   └── styles/             # App styles
│       └── global.css
├── public/                 # Static assets
│   ├── favicon.svg
│   └── favicon.ico
└── astro.config.mjs        # Astro configuration
```

### Architecture Characteristics

- **Type:** Static site with client-side auth
- **Build:** Astro v7
- **Deployment:** Cloudflare Pages
- **Routing:** File-based routing with dynamic segments
- **Auth:** Client-side JWT in localStorage
- **API Communication:** Fetch wrapper with token management
- **State Management:** Local state, no global store

### Data Flow

```
User Request → Cloudflare CDN → Astro Static Files
    ↓
User Action → API Client (fetch with token) → Cloudflare Workers API
    ↓
API Response → Client State Update → UI Re-render
```

### Authentication Flow

```
1. User enters credentials
2. POST /auth/login
3. API validates credentials
4. API returns JWT token
5. Client stores token in localStorage
6. Client includes token in Authorization header
7. API validates token on each request
```

### Current Limitations

- No server-side rendering
- No session management on server
- Token stored in localStorage (XSS risk)
- No token refresh mechanism
- No global state management
- No offline support

### Future Enhancements

- [ ] Server-side rendering with Astro SSR
- [ ] HttpOnly cookies for token storage
- [ ] Token refresh mechanism
- [ ] Global state management (Zustand/Redux)
- [ ] Offline support with service workers
- [ ] PWA capabilities

---

## Admin Architecture

### Current Implementation

```
app/src/pages/
├── admin.astro             # Admin dashboard
└── admin/
    └── users.astro         # User management
```

### Architecture Characteristics

- **Type:** Static pages with API integration
- **Auth:** Role-based access control (basic)
- **Deployment:** Same as app (app.hamicodeviet.com)
- **Routing:** File-based routing

### Current Features

- User listing
- User detail view
- User suspend/activate
- Basic statistics dashboard

### Current Limitations

- No dedicated admin domain
- No MFA
- No RBAC (only basic role check)
- No audit logging
- No IP/risk logging
- No dedicated admin authentication
- No session management
- No comprehensive admin panels

### Future Architecture (Planned)

```
admin.hamicodeviet.com/
├── src/
│   ├── pages/
│   │   ├── index.astro         # Admin dashboard
│   │   ├── users/
│   │   │   ├── index.astro    # User listing
│   │   │   └── [id].astro     # User detail
│   │   ├── guardians/
│   │   ├── consents/
│   │   ├── courses/
│   │   ├── payments/
│   │   ├── ai/
│   │   ├── schools/
│   │   ├── marketplace/
│   │   ├── security/
│   │   └── system/
│   ├── middleware/
│   │   └── auth.ts            # Admin auth middleware
│   └── lib/
│       └── api.ts
└── astro.config.mjs
```

### Future Enhancements

- [ ] Dedicated admin domain
- [ ] MFA/passkey authentication
- [ ] Full RBAC implementation
- [ ] Audit logging
- [ ] IP/risk logging
- [ ] Short session duration
- [ ] Re-authentication for sensitive actions
- [ ] Comprehensive admin panels

---

## Docs Architecture

### Current Implementation

```
src/pages/tai-lieu/
├── index.astro               # Docs index
└── [slug].astro              # Doc pages
```

### Architecture Characteristics

- **Type:** Static pages
- **Deployment:** Main site (hamicodeviet.com/tai-lieu)
- **Routing:** File-based routing with dynamic segments
- **Content:** Static markdown-like content

### Current Limitations

- No dedicated docs domain
- No search functionality
- No versioning
- No last updated tracking
- No owner tracking
- No code examples
- No broken-link testing
- No docs-to-product consistency testing

### Future Architecture (Planned)

```
docs.hamicodeviet.com/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── getting-started/
│   │   ├── learner/
│   │   ├── guardian/
│   │   ├── teacher/
│   │   ├── school/
│   │   ├── creator/
│   │   ├── api/
│   │   ├── ai/
│   │   ├── privacy/
│   │   ├── security/
│   │   ├── billing/
│   │   ├── marketplace/
│   │   ├── changelog/
│   │   └── troubleshooting/
│   ├── components/
│   │   ├── Search.astro
│   │   ├── CodeBlock.astro
│   │   └── VersionSelector.astro
│   └── lib/
│       ├── search.ts
│       └── versioning.ts
└── astro.config.mjs
```

### Future Enhancements

- [ ] Dedicated docs domain
- [ ] Search functionality
- [ ] Versioning
- [ ] Last updated tracking
- [ ] Owner tracking
- [ ] Code examples with syntax highlighting
- [ ] Broken-link testing
- [ ] Docs-to-product consistency testing
- [ ] API documentation with interactive examples

---

## API Architecture

### Current Implementation

```
api/
├── src/
│   ├── index.ts                 # App entry, CORS, routes, queue consumer
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── guardian.ts          # Guardian endpoints
│   │   ├── consent.ts           # Consent endpoints
│   │   ├── countryPolicy.ts     # Country policy endpoints
│   │   ├── courses.ts           # Course endpoints
│   │   ├── progress.ts          # Progress endpoints
│   │   ├── payments.ts          # Payment endpoints
│   │   └── admin.ts             # Admin endpoints
│   └── lib/
│       ├── db.ts                # Database client
│       ├── password.ts          # Password hashing
│       ├── jwt.ts               # JWT signing/verification
│       ├── email.ts             # Email sending
│       ├── rateLimit.ts         # Rate limiting middleware
│       ├── rateLimiterDO.ts     # Durable Object for rate limiting
│       └── auth.ts              # Auth middleware
├── wrangler.toml                # Worker configuration
└── tsconfig.json                # TypeScript configuration
```

### Architecture Characteristics

- **Type:** Serverless API
- **Framework:** Hono
- **Runtime:** Cloudflare Workers
- **Database:** Neon PostgreSQL (serverless)
- **Auth:** Custom JWT + PBKDF2
- **Rate Limiting:** Durable Objects (globally consistent)
- **Email:** Resend API + Cloudflare Queues
- **Payment:** Stripe (demo mode)

### Request Flow

```
Client Request → Cloudflare CDN → Cloudflare Workers
    ↓
Hono Router → Middleware (CORS, Rate Limit, Auth)
    ↓
Route Handler → Business Logic
    ↓
Database Query → Neon PostgreSQL
    ↓
Response → Cloudflare CDN → Client
```

### Current Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/signup | Public | User registration |
| POST | /auth/login | Public | User login |
| POST | /auth/logout | Authenticated | User logout |
| POST | /auth/logout-all | Authenticated | Logout all sessions |
| GET | /auth/me | Authenticated | Get current user |
| POST | /auth/forgot-password | Public | Request password reset |
| POST | /auth/reset-password | Public | Reset password |
| GET | /auth/verify-email | Public | Verify email |
| POST | /auth/resend-verification | Authenticated | Resend verification |
| PUT | /auth/profile | Authenticated | Update profile |
| POST | /guardian/register | Authenticated | Register as guardian |
| POST | /guardian/link | Authenticated | Link to child |
| POST | /guardian/approve | Authenticated | Approve link |
| POST | /guardian/revoke | Authenticated | Revoke link |
| GET | /guardian/links | Authenticated | List links |
| POST | /consent/grant | Authenticated | Grant consent |
| POST | /consent/withdraw | Authenticated | Withdraw consent |
| GET | /consent/history | Authenticated | Consent history |
| GET | /country-policy | Public | Get country policy |
| GET | /courses | Public | List courses |
| GET | /courses/:slug | Public | Course detail |
| POST | /courses/:slug/enroll | Authenticated | Enroll in course |
| GET | /progress | Authenticated | Get progress |
| POST | /progress/lesson/start | Authenticated | Start lesson |
| POST | /progress/lesson/complete | Authenticated | Complete lesson |
| GET | /payments/plans | Public | List plans |
| POST | /payments/checkout | Authenticated | Create checkout |
| POST | /payments/webhook | Public | Stripe webhook |
| GET | /payments/history | Authenticated | Payment history |
| GET | /admin/stats | Admin | Dashboard stats |
| GET | /admin/users | Admin | List users |
| GET | /admin/users/:id | Admin | User detail |
| POST | /admin/users/:id/suspend | Admin | Suspend user |
| POST | /admin/users/:id/activate | Admin | Activate user |
| POST | /admin/courses | Admin | Create course |
| GET | /health | Public | Health check |
| GET | /health/email | Public | Email health check |

### Middleware Stack

```
Request → CORS → Rate Limit → Auth → Route Handler → Response
```

### Current Limitations

- No request ID tracking
- No comprehensive error handling
- No request logging
- No response compression
- No API versioning
- No OpenAPI/Swagger documentation
- No API key management
- No webhook signature verification (Stripe not configured)

### Future Enhancements

- [ ] Request ID tracking
- [ ] Comprehensive error handling
- [ ] Request logging
- [ ] Response compression
- [ ] API versioning
- [ ] OpenAPI/Swagger documentation
- [ ] API key management
- [ ] Webhook signature verification
- [ ] GraphQL endpoint (optional)
- [ ] GraphQL playground (optional)

---

## Database Architecture

### Current Implementation

```
Neon PostgreSQL (Serverless)
├── main branch (br-misty-sea-afnny291) — production
└── staging branch (br-curly-wind-afckj9hp) — staging/test
```

### Current Tables (19)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| users | User accounts | id, email, password_hash, status, email_verified |
| profiles | User profile data | user_id, display_name, birth_year, country, language |
| roles | Role definitions | id, name, description |
| user_roles | User-role assignments | user_id, role_id |
| sessions | User sessions | user_id, token_hash, expires_at, ip, user_agent |
| email_verifications | Email verification tokens | user_id, token_hash, expires_at |
| password_resets | Password reset tokens | user_id, token_hash, expires_at, ip |
| guardians | Guardian records | id, user_id, email, display_name, relationship |
| guardian_links | Guardian-learner links | guardian_id, learner_id, status, invitation_token |
| policy_versions | Policy versioning | id, policy_type, version, content |
| consents | Consent records | user_id, policy_type, policy_version, consent_state |
| consent_types | Consent type definitions | id, name, description |
| country_policies | Country-specific policies | country_code, policy_type, requirements |
| courses | Course catalog | id, slug, title_vi, title_en, status |
| lessons_db | Lesson content | id, course_id, title_vi, title_en, content |
| enrollments | User course enrollments | user_id, course_id, status |
| lesson_progress | Lesson completion tracking | user_id, lesson_id, status, completed_at |
| subscriptions | User subscriptions | user_id, plan_id, status, stripe_subscription_id |
| payments | Payment records | user_id, amount_cents, status, provider |
| certificates | Certificate records | user_id, course_id, certificate_number |

### Database Connection

```typescript
// api/src/lib/db.ts
import { neon } from '@neondatabase/serverless';

export function getDb(env: Env) {
  return neon(env.DATABASE_URL);
}
```

### Query Pattern

```typescript
// Parameterized queries (SQL injection safe)
const [user] = await sql`SELECT id FROM users WHERE email = ${email}`;
```

### Current Limitations

- No migration files
- SQL embedded in route files
- No versioning
- No rollback strategy
- No separation between environments (manual cleanup)
- No query optimization
- No connection pooling configuration
- No read replicas
- No backup strategy

### Future Enhancements

- [ ] Migration framework (node-pg-migrate or similar)
- [ ] Separate migration files
- [ ] Migration versioning
- [ ] Rollback strategy
- [ ] Environment-specific configurations
- [ ] Query optimization
- [ ] Connection pooling configuration
- [ ] Read replicas for scaling
- [ ] Automated backup strategy
- [ ] Backup restore testing

---

## Auth Architecture

### Current Implementation

### Components

1. **Password Hashing** (api/src/lib/password.ts)
   - Algorithm: PBKDF2
   - Iterations: 100,000
   - Hash length: 64 bytes
   - Salt length: 16 bytes
   - Implementation: Web Crypto API

2. **JWT Signing/Verification** (api/src/lib/jwt.ts)
   - Algorithm: HMAC-SHA256
   - Secret: JWT_SECRET (Worker secret)
   - Token expiry: 7 days
   - Payload: user_id, email, email_verified, status

3. **Session Management** (api/src/routes/auth.ts)
   - Storage: Database (sessions table)
   - Token: SHA-256 hash
   - Expiry: 7 days
   - Tracking: IP, user-agent

4. **Token Management** (api/src/routes/auth.ts)
   - Verification tokens: 24 hours expiry
   - Reset tokens: 1 hour expiry
   - Single-use: Revoked after use
   - Storage: SHA-256 hash in database

### Auth Flow

```
Signup:
1. User submits email, password, profile
2. Server hashes password (PBKDF2)
3. Server creates user record
4. Server creates profile record
5. Server assigns learner role
6. Server generates verification token
7. Server hashes verification token
8. Server stores token hash in database
9. Server sends verification email
10. Server creates session
11. Server returns JWT token

Login:
1. User submits email, password
2. Server retrieves user by email
3. Server verifies password (PBKDF2)
4. Server checks user status
5. Server creates session
6. Server returns JWT token

Token Verification:
1. Client includes token in Authorization header
2. Server extracts token
3. Server verifies JWT signature
4. Server checks token expiry
5. Server checks user status
6. Server proceeds with request
```

### Security Measures

- ✅ Passwords hashed with PBKDF2 (100,000 iterations)
- ✅ Tokens stored as SHA-256 hashes
- ✅ Tokens not logged
- ✅ Tokens single-use
- ✅ Tokens have TTL
- ✅ Tokens revoked on use
- ✅ Rate limiting on auth endpoints
- ⚠️ Tokens stored in localStorage (XSS risk)
- ❌ No token refresh mechanism
- ❌ No MFA
- ❌ No passkey support

### Current Limitations

- Token stored in localStorage (XSS risk)
- No token refresh mechanism
- No MFA
- No passkey support
- No device fingerprinting
- No suspicious activity detection
- No account lockout policy
- No password complexity requirements
- No password history
- No session management UI

### Future Enhancements

- [ ] HttpOnly cookies for token storage
- [ ] Token refresh mechanism
- [ ] MFA for admin
- [ ] Passkey support
- [ ] Device fingerprinting
- [ ] Suspicious activity detection
- [ ] Account lockout policy
- [ ] Password complexity requirements
- [ ] Password history
- [ ] Session management UI

---

## Guardian Architecture

### Current Implementation

### Components

1. **Guardian Registration** (api/src/routes/guardian.ts)
   - User can register as guardian
   - Stores guardian record
   - Tracks relationship, verification method, status

2. **Guardian-Learner Link** (api/src/routes/guardian.ts)
   - Guardian can link to learner account
   - Generates invitation token
   - Link status: pending, approved, revoked

3. **Guardian Approval** (api/src/routes/guardian.ts)
   - Guardian can approve pending links
   - Updates link status
   - Activates guardian relationship

4. **Guardian Revocation** (api/src/routes/guardian.ts)
   - Guardian can revoke links
   - Updates link status
   - Deactivates guardian relationship

### Guardian Flow

```
Guardian Registration:
1. User submits guardian registration
2. Server creates guardian record
3. Server sets verification status to pending
4. Server returns success

Guardian-Learner Link:
1. Guardian submits child email
2. Server retrieves child account
3. Server generates invitation token
4. Server creates guardian link (pending)
5. Server sends invitation email to guardian
6. Server returns success

Guardian Approval:
1. Guardian approves link
2. Server updates link status to approved
3. Server activates guardian relationship
4. Server returns success

Guardian Revocation:
1. Guardian revokes link
2. Server updates link status to revoked
3. Server deactivates guardian relationship
4. Server returns success
```

### Current Limitations

- No guardian verification flow
- No guardian consent UI
- No guardian notification system
- No guardian dashboard
- No guardian permissions management
- No guardian activity tracking
- No guardian reporting

### Future Enhancements

- [ ] Guardian verification flow
- [ ] Guardian consent UI
- [ ] Guardian notification system
- [ ] Guardian dashboard
- [ ] Guardian permissions management
- [ ] Guardian activity tracking
- [ ] Guardian reporting
- [ ] Guardian approval for payments
- [ ] Guardian approval for public portfolio
- [ ] Guardian approval for marketplace

---

## Consent Architecture

### Current Implementation

### Components

1. **Consent Recording** (api/src/routes/consent.ts)
   - Records user consent
   - Tracks policy type, version, state
   - Stores content hash, country, IP
   - Records acceptance method, request ID

2. **Consent Withdrawal** (api/src/routes/consent.ts)
   - Allows users to withdraw consent
   - Updates consent state
   - Records withdrawal timestamp

3. **Policy Versioning** (database)
   - policy_versions table
   - Tracks policy type, version, content
   - Supports policy updates

4. **Country Policy** (api/src/routes/countryPolicy.ts)
   - country_policies table
   - Tracks country-specific requirements
   - API endpoint for lookup

### Consent Flow

```
Consent Grant:
1. User submits consent
2. Server retrieves current policy version
3. Server calculates content hash
4. Server records consent
5. Server stores policy type, version, state
6. Server stores content hash, country, IP
7. Server records acceptance method, request ID
8. Server returns success

Consent Withdrawal:
1. User withdraws consent
2. Server retrieves consent record
3. Server updates consent state to withdrawn
4. Server records withdrawal timestamp
5. Server returns success

Country Policy Lookup:
1. Client requests country policy
2. Server retrieves policy by country code
3. Server returns policy requirements
```

### Consent Types

- Terms
- Privacy
- Guardian consent
- Child assent
- Payment
- Auto-renewal
- Public portfolio
- Image/video
- Marketing
- Marketplace
- AI improvement/training

### Current Limitations

- No consent UI (backend only)
- No consent withdrawal UI
- No consent history UI
- No consent expiration
- No consent renewal reminders
- No consent versioning UI
- No consent export
- No consent deletion

### Future Enhancements

- [ ] Consent UI
- [ ] Consent withdrawal UI
- [ ] Consent history UI
- [ ] Consent expiration
- [ ] Consent renewal reminders
- [ ] Consent versioning UI
- [ ] Consent export
- [ ] Consent deletion
- [ ] Consent analytics
- [ ] Consent compliance reporting

---

## AI Architecture

### Current Implementation

**Status:** Not implemented

### Planned Architecture

```
aiagent.iai.one (Backend-Only AI Service)
├── Agents
│   ├── Tutor Agent
│   ├── Code Coach Agent
│   ├── Code Reviewer Agent
│   ├── Curriculum Agent
│   ├── Assessment Agent
│   ├── Project Planner Agent
│   ├── Parent Report Agent
│   ├── Teacher Copilot Agent
│   ├── Portfolio Agent
│   ├── Marketplace Reviewer Agent
│   └── Safety Guardian Agent
├── Infrastructure
│   ├── Agent Registry
│   ├── Version Management
│   ├── Input/Output Schema Validation
│   ├── Moderation Layer
│   ├── Quota Management
│   ├── Cost Tracking
│   ├── Audit Logging
│   └── Kill Switch
└── Integration
    ├── API Gateway
    ├── Webhook System
    └── Event Bus
```

### AI Request Flow

```
Client Request → Cloudflare Workers API
    ↓
Auth & Permission Check
    ↓
Quota Check
    ↓
Request to aiagent.iai.one
    ↓
Agent Selection & Versioning
    ↓
Input Schema Validation
    ↓
Prohibited Data Check
    ↓
AI Processing
    ↓
Output Schema Validation
    ↓
Moderation Check
    ↓
Cost Tracking
    ↓
Audit Logging
    ↓
Response to Client
```

### Agent Specifications

Each agent must have:
- Agent ID
- Version
- Purpose
- Permitted roles
- Permitted ages
- Input schema
- Output schema
- Prohibited data
- Model
- Fallback
- Timeout
- Retry
- Quota
- Cost limit
- Moderation
- Human review
- Audit
- Eval dataset
- Kill switch

### Safety Measures

- No PII in AI requests
- No inappropriate content generation
- Prompt injection protection
- Output injection protection
- Hallucination detection
- Code vulnerability detection
- Provider failure handling
- Timeout handling
- Excessive cost prevention
- Quota bypass prevention

### Current Limitations

- Not implemented
- No AI integration
- No aiagent.iai.one backend
- No agent registry
- No version management
- No schema validation
- No moderation layer
- No quota management
- No cost tracking
- No audit logging
- No kill switch

### Future Enhancements

- [ ] Implement aiagent.iai.one backend
- [ ] Implement agent registry
- [ ] Implement version management
- [ ] Implement schema validation
- [ ] Implement moderation layer
- [ ] Implement quota management
- [ ] Implement cost tracking
- [ ] Implement audit logging
- [ ] Implement kill switch
- [ ] Implement all 11 agents

---

## CodeLab Architecture

### Current Implementation

**Status:** Not implemented

### Planned Architecture

```
CodeLab System
├── Frontend
│   ├── Code Editor (Monaco Editor)
│   ├── Preview Panel
│   ├── Console Output
│   ├── Test Runner
│   └── Submit Button
├── Backend
│   ├── Sandbox Service
│   ├── Execution Service
│   ├── Test Service
│   ├── Version Service
│   └── Review Service
└── Infrastructure
    ├── CPU Limiting
    ├── RAM Limiting
    ├── Execution Timeout
    ├── Process Isolation
    ├── Filesystem Isolation
    ├── Network Deny
    ├── Package Allowlist
    ├── Secret Isolation
    ├── Cleanup Service
    ├── Monitoring Service
    └── Abuse Detection
```

### CodeLab Flow

```
User Opens CodeLab
    ↓
Load Lesson/Project
    ↓
User Writes Code
    ↓
Autosave (Periodic)
    ↓
User Runs Code
    ↓
Send to Sandbox
    ↓
Execute in Isolated Environment
    ↓
Enforce Limits (CPU, RAM, Timeout)
    ↓
Return Output
    ↓
Display in Preview/Console
    ↓
User Submits Code
    ↓
Run Tests
    ↓
Generate Review
    ↓
Store Submission
    ↓
Return Results
```

### Sandbox Security

- CPU limit: 1 core max
- RAM limit: 512MB max
- Execution timeout: 30s max
- Process isolation: Container/VM
- Filesystem isolation: Temporary filesystem
- Network deny: No network access
- Package allowlist: Whitelisted packages only
- Secret isolation: No access to secrets
- Cleanup: Automatic cleanup after execution
- Monitoring: Resource usage tracking
- Abuse detection: Pattern detection

### Security Tests

- Infinite loop detection
- Fork bomb detection
- Crypto mining detection
- Reverse shell detection
- Filesystem access detection
- Network exfiltration detection
- Memory exhaustion detection
- XSS detection
- Iframe escape detection
- Secret access detection

### Current Limitations

- Not implemented
- No code editor
- No preview panel
- No sandbox
- No execution service
- No test runner
- No review service
- No security measures

### Future Enhancements

- [ ] Implement code editor
- [ ] Implement preview panel
- [ ] Implement sandbox
- [ ] Implement execution service
- [ ] Implement test runner
- [ ] Implement review service
- [ ] Implement all security measures
- [ ] Implement all security tests
- [ ] Implement monitoring
- [ ] Implement abuse detection

---

## Payment Architecture

### Current Implementation

### Components

1. **Payment Plans** (api/src/routes/payments.ts)
   - Hardcoded plans (Family Pass, Creator Pass)
   - Plan ID, name, price, currency, interval

2. **Checkout** (api/src/routes/payments.ts)
   - Demo mode only
   - Stripe checkout session creation
   - Returns checkout URL

3. **Webhook** (api/src/routes/payments.ts)
   - Stripe webhook handler
   - signature verification (not configured)
   - Subscription creation
   - Payment recording

4. **Subscription** (database)
   - subscriptions table
   - Tracks user subscriptions
   - Links to Stripe subscription

5. **Payment** (database)
   - payments table
   - Tracks payment records
   - Links to Stripe payment

### Payment Flow

```
Demo Mode (Current):
1. User selects plan
2. Client requests checkout
3. Server creates demo checkout
4. Server returns success URL
5. Client redirects to success
6. Server creates subscription record
7. Server creates payment record
8. Server grants entitlement

Production Mode (Planned):
1. User selects plan
2. Client requests checkout
3. Server creates Stripe checkout session
4. Server returns Stripe checkout URL
5. User completes payment on Stripe
6. Stripe sends webhook
7. Server verifies webhook signature
8. Server creates subscription record
9. Server creates payment record
10. Server grants entitlement
```

### Current Limitations

- Demo mode only
- No Stripe keys configured
- No live transaction tested
- No webhook signature verification
- No idempotency
- No billing portal
- No cancellation flow
- No refund flow
- No dispute handling
- No reconciliation
- No entitlement system

### Future Enhancements

- [ ] Configure Stripe keys
- [ ] Test live transaction
- [ ] Implement webhook signature verification
- [ ] Implement idempotency
- [ ] Implement billing portal
- [ ] Implement cancellation flow
- [ ] Implement refund flow
- [ ] Implement dispute handling
- [ ] Implement reconciliation
- [ ] Implement entitlement system

---

## Marketplace Architecture

### Current Implementation

**Status:** Not implemented

### Planned Architecture

```
Marketplace System
├── Creator Portal
│   ├── Creator Verification
│   ├── Product Submission
│   ├── Version Management
│   ├── License Management
│   └── Payout Management
├── Buyer Portal
│   ├── Product Discovery
│   ├── Product Purchase
│   ├── Download Management
│   └── License Management
├── Admin Portal
│   ├── Product Review
│   ├── Moderation
│   ├── Takedown
│   ├── Dispute Resolution
│   └── Payout Management
└── Infrastructure
    ├── Malware Scanning
    ├── Secret Scanning
    ├── Technical Review
    ├── Content Review
    ├── Age Suitability Check
    ├── Payout Processing
    ├── Payout Hold
    └── Audit Logging
```

### Marketplace Flow

```
Creator Verification:
1. Creator submits verification
2. Admin reviews verification
3. Admin approves/rejects
4. Creator status updated

Product Submission:
1. Creator submits product
2. Product undergoes malware scan
3. Product undergoes secret scan
4. Product undergoes technical review
5. Product undergoes content review
6. Product undergoes age suitability check
7. Admin approves/rejects
8. Product published

Product Purchase:
1. Buyer discovers product
2. Buyer purchases product
3. Payment processed
4. License granted
5. Download available
6. Creator payout scheduled

Payout:
1. Payout scheduled
2. Payout held for review period
3. Payout processed
4. Creator receives payment
5. Payout recorded
```

### Current Limitations

- Not implemented
- No creator portal
- No buyer portal
- No admin portal
- No verification system
- No submission system
- No review system
- No payout system

### Future Enhancements

- [ ] Implement creator portal
- [ ] Implement buyer portal
- [ ] Implement admin portal
- [ ] Implement verification system
- [ ] Implement submission system
- [ ] Implement review system
- [ ] Implement payout system
- [ ] Implement all security measures
- [ ] Implement all review processes

---

## School Architecture

### Current Implementation

**Status:** Not implemented

### Planned Architecture

```
School Platform
├── School Admin Portal
│   ├── Organization Management
│   ├── Teacher Management
│   ├── Classroom Management
│   ├── Student Management
│   ├── License Management
│   └── Reporting
├── Teacher Portal
│   ├── Classroom Management
│   ├── Assignment Management
│   ├── Submission Review
│   ├── Student Progress
│   └── Reporting
├── Student Portal
│   ├── Classroom Access
│   ├── Assignment Access
│   ├── Submission
│   ├── Progress Tracking
│   └── Resources
└── Infrastructure
    ├── Organization Data Isolation
    ├── License Management
    ├── Access Control
    └── Audit Logging
```

### School Flow

```
Organization Setup:
1. School admin creates organization
2. School admin configures settings
3. School admin purchases license
4. License activated

Teacher Setup:
1. School admin adds teacher
2. Teacher account created
3. Teacher assigned to organization
4. Teacher granted permissions

Classroom Setup:
1. Teacher creates classroom
2. Teacher adds students
3. Teacher assigns courses
4. Teacher creates assignments

Student Learning:
1. Student accesses classroom
2. Student views assignments
3. Student completes assignments
4. Student submits work
5. Teacher reviews submission
6. Teacher provides feedback
7. Student views progress

Reporting:
1. School admin views organization report
2. Teacher views classroom report
3. Student views progress report
```

### Data Isolation

- Organization data isolated
- Teacher can only view their classrooms
- Student can only view their classrooms
- School admin can view entire organization
- Cross-organization access prevented

### Current Limitations

- Not implemented
- No school admin portal
- No teacher portal
- No student portal
- No organization management
- No classroom management
- No assignment management
- No license management

### Future Enhancements

- [ ] Implement school admin portal
- [ ] Implement teacher portal
- [ ] Implement student portal
- [ ] Implement organization management
- [ ] Implement classroom management
- [ ] Implement assignment management
- [ ] Implement license management
- [ ] Implement data isolation
- [ ] Implement reporting

---

## Observability Architecture

### Current Implementation

**Status:** Not implemented

### Planned Architecture

```
Observability System
├── Logging
│   ├── Request Logging
│   ├── Error Logging
│   ├── Audit Logging
│   └── Security Event Logging
├── Metrics
│   ├── Request Metrics
│   ├── Error Metrics
│   ├── Performance Metrics
│   ├── Business Metrics
│   └── Custom Metrics
├── Tracing
│   ├── Request Tracing
│   ├── Database Tracing
│   ├── External Service Tracing
│   └── Custom Tracing
├── Monitoring
│   ├── Uptime Monitoring
│   ├── Health Checks
│   ├── Resource Monitoring
│   └── Dependency Monitoring
└── Alerting
    ├── Site Down Alert
    ├── API Error Spike Alert
    ├── Login Attack Alert
    ├── Payment Failure Alert
    ├── Webhook Backlog Alert
    ├── AI Cost Anomaly Alert
    ├── Database Saturation Alert
    ├── Email Outage Alert
    ├── Sandbox Abuse Alert
    └── Certificate Failure Alert
```

### Logging Strategy

- Request ID for all requests
- Structured logging (JSON)
- Log levels: DEBUG, INFO, WARN, ERROR
- Sensitive data redaction
- Log retention policy
- Log aggregation

### Metrics Strategy

- Request count by endpoint
- Request latency by endpoint
- Error rate by endpoint
- Database query time
- External service latency
- Business metrics (signups, payments, etc.)
- Custom metrics per feature

### Tracing Strategy

- Distributed tracing
- Request context propagation
- Database query tracing
- External service tracing
- Custom span creation

### Monitoring Strategy

- Uptime monitoring (external)
- Health check endpoints
- Resource usage monitoring
- Dependency health monitoring
- Synthetic transactions

### Alerting Strategy

- Alert severity levels
- Alert escalation
- Alert notification channels
- Alert on-call rotation
- Alert runbooks

### Current Limitations

- Not implemented
- No logging
- No metrics
- No tracing
- No monitoring
- No alerting
- No request IDs

### Future Enhancements

- [ ] Implement logging
- [ ] Implement metrics
- [ ] Implement tracing
- [ ] Implement monitoring
- [ ] Implement alerting
- [ ] Implement request IDs
- [ ] Implement all alerts

---

## Backup Architecture

### Current Implementation

**Status:** Not implemented

### Planned Architecture

```
Backup & Disaster Recovery System
├── Database Backup
│   ├── Automated Backups
│   ├── Backup Retention
│   ├── Backup Verification
│   └── Backup Restoration
├── Object Storage Backup
│   ├── Automated Backups
│   ├── Backup Retention
│   ├── Backup Verification
│   └── Backup Restoration
├── Configuration Backup
│   ├── Version Control
│   ├── Configuration Export
│   └── Configuration Restoration
├── Secret Recovery
│   ├── Secret Storage
│   ├── Secret Rotation
│   └── Secret Recovery Process
└── Disaster Recovery
    ├── RPO Definition
    ├── RTO Definition
    ├── Incident Owner
    ├── Rollback Procedure
    └── Restore Test
```

### Backup Strategy

- Automated daily backups
- Backup retention: 30 days
- Backup verification: Weekly
- Offsite backup storage
- Backup encryption

### Disaster Recovery Strategy

- RPO: 1 hour
- RTO: 4 hours
- Incident owner defined
- Rollback procedure documented
- Restore test: Monthly

### Current Limitations

- Not implemented
- No database backup
- No object storage backup
- No configuration backup
- No secret recovery
- No disaster recovery plan

### Future Enhancements

- [ ] Implement database backup
- [ ] Implement object storage backup
- [ ] Implement configuration backup
- [ ] Implement secret recovery
- [ ] Implement disaster recovery plan
- [ ] Define RPO/RTO
- [ ] Document rollback procedure
- [ ] Implement restore test

---

## Deployment Architecture

### Current Implementation

### Deployment Process

```
Manual Deployment:
1. Developer makes changes
2. Developer commits to git
3. Developer pushes to GitHub
4. CI runs (typecheck, build, secret scan, token log scan)
5. Developer manually deploys API: cd api && npm run deploy
6. Developer manually deploys public site: npm run deploy
7. Developer manually deploys app: cd app && npm run build && wrangler pages deploy
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
- Typecheck API
- Build Public Website
- Build App
- Secret Scan
- Token Logging Scan
```

### Deployment Targets

| Component | Platform | Project | Command |
|-----------|----------|---------|---------|
| Public site | Cloudflare Pages | hamicodeviet-com | npm run deploy |
| App | Cloudflare Pages | hamicodeviet-app | wrangler pages deploy |
| API | Cloudflare Workers | hamicodeviet-api | wrangler deploy |

### Current Limitations

- Manual deployment
- No automated deployment
- No backup before deploy
- No migration check
- No health checks
- No smoke tests
- No E2E tests
- No monitoring validation
- No release notes
- No rollback on failure
- Local .env.cloudflare for account selection

### Future Enhancements

- [ ] Implement automated deployment
- [ ] Implement backup before deploy
- [ ] Implement migration check
- [ ] Implement health checks
- [ ] Implement smoke tests
- [ ] Implement E2E tests
- [ ] Implement monitoring validation
- [ ] Implement release notes
- [ ] Implement rollback on failure
- [ ] Implement environment verification

---

## Conclusion

### Current Architecture Status

**MVP Phase 1** — Core infrastructure in place:
- ✅ Public website (static)
- ✅ Learning app (static with client-side auth)
- ✅ API (serverless with basic auth)
- ✅ Database (PostgreSQL)
- ✅ Email delivery (Resend + Queues)
- ✅ Rate limiting (Durable Objects)
- ✅ Guardian framework
- ✅ Consent framework
- ⚠️ Admin (basic)
- ⚠️ Payment (demo only)

### Architecture Gaps

- ❌ No dedicated admin domain
- ❌ No dedicated docs domain
- ❌ No AI system
- ❌ No CodeLab
- ❌ No marketplace
- ❌ No school platform
- ❌ No observability
- ❌ No backup/DR
- ❌ No automated deployment
- ❌ No comprehensive security testing
- ❌ No accessibility testing
- ❌ No performance testing

### Next Steps

1. Address P0 blockers (payment, observability, backup/DR, admin, accessibility, child safety)
2. Implement Phase 2 core features (AI, CodeLab, product system, entitlement, refund)
3. Implement Phase 3 advanced features (marketplace, school, notifications, feature flags)
4. Implement comprehensive testing (security, accessibility, performance)
5. Implement observability (logging, metrics, tracing, monitoring, alerting)
6. Implement backup/DR strategy
7. Implement automated deployment
8. Run full E2E test matrix
9. Only then consider commercial go-live

---

**Document Completed:** 2026-06-24
**Next Review:** After architecture updates
