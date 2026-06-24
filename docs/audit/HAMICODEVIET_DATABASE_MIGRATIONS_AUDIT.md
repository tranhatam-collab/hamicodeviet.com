# HaMi Code Việt — Database & Migrations Audit

**Audit Date:** 2026-06-24
**Auditor:** Devin AI
**Database Provider:** Neon PostgreSQL (Serverless)
**Project:** blue-thunder-03199745

---

## Executive Summary

The database audit reveals that the platform has a basic schema for MVP Phase 1 but lacks comprehensive tables for full commercial launch. Critical gaps include no migration system, no product/pricing tables, no entitlement system, no audit logging, and missing tables for AI, marketplace, school, and other advanced features.

**Overall Verdict:** ❌ FAIL — Database schema incomplete, no migration system, missing critical tables for go-live.

---

## 1. Database Infrastructure

### Provider Configuration

| Setting | Value | Status |
|---------|-------|--------|
| Provider | Neon PostgreSQL | ✅ Configured |
| Project ID | blue-thunder-03199745 | ✅ Active |
| Type | Serverless | ✅ Configured |
| Branches | main, staging | ✅ Configured |
| Connection | .env.neon (gitignored) | ✅ Secure |

### Branches

| Branch | ID | Purpose | Status |
|--------|----|---------|--------|
| main | br-misty-sea-afnny291 | Production | ✅ Active |
| staging | br-curly-wind-afckj9hp | Staging/Test | ✅ Active |

### Connection Method

```typescript
// api/src/lib/db.ts
import { neon } from '@neondatabase/serverless';

export function getDb(env: Env) {
  return neon(env.DATABASE_URL);
}
```

**Status:** ✅ PASS — Serverless driver configured correctly

---

## 2. Current Schema Analysis

### Existing Tables (19)

#### 2.1 Core User Tables

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| users | id, email, password_hash, status, email_verified, created_at, updated_at | User accounts | ✅ Complete |
| profiles | user_id, display_name, birth_year, country, language, created_at, updated_at | User profile data | ✅ Complete |
| roles | id, name, description | Role definitions | ✅ Complete |
| user_roles | user_id, role_id | User-role assignments | ✅ Complete |
| sessions | user_id, token_hash, expires_at, ip, user_agent, created_at | User sessions | ✅ Complete |

**Assessment:** ✅ PASS — Core user tables complete

#### 2.2 Authentication Tables

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| email_verifications | user_id, token_hash, expires_at, created_at | Email verification tokens | ✅ Complete |
| password_resets | user_id, token_hash, expires_at, ip, created_at | Password reset tokens | ✅ Complete |

**Assessment:** ✅ PASS — Authentication tables complete

#### 2.3 Guardian & Consent Tables

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| guardians | id, user_id, email, display_name, relationship, verification_method, verification_status, created_at, updated_at | Guardian records | ✅ Complete |
| guardian_links | guardian_id, learner_id, status, invitation_token, created_at, updated_at | Guardian-learner links | ✅ Complete |
| policy_versions | id, policy_type, version, content, created_at | Policy versioning | ✅ Complete |
| consents | id, user_id, policy_type, policy_version, consent_state, source, ip, country_code, policy_content_hash, acceptance_method, request_id, created_at, withdrawn_at | Consent records | ✅ Complete |
| consent_types | id, name, description | Consent type definitions | ✅ Complete |
| country_policies | country_code, policy_type, requirements, created_at, updated_at | Country-specific policies | ✅ Complete |

**Assessment:** ✅ PASS — Guardian and consent tables complete

#### 2.4 Learning Tables

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| courses | id, slug, track_id, title_vi, title_en, description_vi, description_en, level, duration_hours, price_cents, currency, status, created_at, updated_at | Course catalog | ✅ Complete |
| lessons_db | id, course_id, title_vi, title_en, content_vi, content_en, objectives, age_range, level, duration_minutes, order, created_at, updated_at | Lesson content | ✅ Complete |
| enrollments | user_id, course_id, status, enrolled_at, completed_at | User course enrollments | ✅ Complete |
| lesson_progress | user_id, lesson_id, status, started_at, completed_at, time_spent_sec | Lesson completion tracking | ✅ Complete |

**Assessment:** ⚠️ WARN — Basic learning tables complete, missing modules, learning_objects, assessments, rubrics, reviews

#### 2.5 Payment Tables

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| subscriptions | user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at | User subscriptions | ⚠️ Partial (no plan_id foreign key) |
| payments | user_id, amount_cents, currency, status, provider, description, stripe_checkout_session_id, metadata, created_at | Payment records | ⚠️ Partial (no order_id, no invoice_id) |

**Assessment:** ⚠️ WARN — Basic payment tables exist, missing products, prices, plans, orders, entitlements, refunds, payment_events, webhook_events

#### 2.6 Certificate Tables

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| certificates | user_id, course_id, certificate_number, created_at | Certificate records | ⚠️ Partial (no issuer, no criteria, no evidence, no verification_route, no revocation_state) |

**Assessment:** ⚠️ WARN — Basic certificate table exists, missing certificate_events, verification details

---

## 3. Missing Tables (Required per Master Command)

### 3.1 Critical Missing Tables (P0/P1)

| Table | Purpose | Impact | Priority |
|-------|---------|--------|----------|
| permissions | RBAC permissions | No fine-grained access control | P1 |
| guardian_verifications | Guardian verification flow | No guardian verification | P1 |
| products | Product catalog | No product management | P1 |
| prices | Price management | No price management | P1 |
| plans | Plan management | Hardcoded in code | P1 |
| orders | Order system | No order tracking | P1 |
| entitlements | Entitlement system | No entitlement granting | P1 |
| refunds | Refund tracking | No refund processing | P1 |
| payment_events | Payment audit trail | No payment audit | P1 |
| webhook_events | Webhook audit trail | No webhook audit | P1 |
| audit_logs | Audit logging | No audit trail | P1 |
| security_events | Security event tracking | No security audit | P1 |
| data_export_requests | GDPR export | No export tracking | P1 |
| deletion_requests | GDPR deletion | No deletion tracking | P1 |

### 3.2 Important Missing Tables (P2)

| Table | Purpose | Impact | Priority |
|-------|---------|--------|----------|
| organizations | School platform | No school system | P2 |
| schools | School platform | No school system | P2 |
| classrooms | School platform | No school system | P2 |
| memberships | School platform | No school system | P2 |
| learning_paths | Learning path system | No learning paths | P2 |
| modules | Course module structure | No module organization | P2 |
| learning_objects | Granular content tracking | No granular tracking | P2 |
| projects | Project system | No project system | P2 |
| project_versions | Project versioning | No project versioning | P2 |
| submissions | Project submission | No submission tracking | P2 |
| assessments | Assessment system | No assessment system | P2 |
| rubrics | Rubric system | No rubric system | P2 |
| reviews | Review system | No review system | P2 |
| certificate_events | Certificate audit trail | No certificate audit | P2 |
| creators | Creator system | No creator system | P2 |
| marketplace_products | Marketplace | No marketplace | P2 |
| marketplace_versions | Marketplace | No marketplace | P2 |
| licenses | Marketplace | No marketplace | P2 |
| payout_accounts | Marketplace | No marketplace | P2 |
| payouts | Marketplace | No marketplace | P2 |
| ai_agents | AI system | No AI system | P2 |
| ai_agent_versions | AI system | No AI system | P2 |
| ai_sessions | AI system | No AI system | P2 |
| ai_usage | AI system | No AI system | P2 |
| ai_evaluations | AI system | No AI system | P2 |
| notifications | Notification system | No notifications | P2 |
| email_jobs | Email job tracking | No email job tracking | P2 |
| email_events | Email audit trail | No email audit | P2 |
| abuse_reports | Moderation system | No moderation | P2 |
| moderation_cases | Moderation system | No moderation | P2 |
| appeals | Moderation system | No moderation | P2 |
| feature_flags | Feature flag system | No feature flags | P2 |
| deployments | Deployment tracking | No deployment tracking | P2 |
| system_events | System event tracking | No system events | P2 |

---

## 4. Migration System Audit

### Current State

| Aspect | Status | Evidence |
|--------|--------|----------|
| Migration files | ❌ None | No .sql files found |
| Migration framework | ❌ None | No node-pg-migrate or similar |
| Migration versioning | ❌ None | No version tracking |
| Migration rollback | ❌ None | No rollback strategy |
| Migration testing | ❌ None | No migration tests |
| Environment separation | ⚠️ Manual | Manual cleanup of test data |
| Migration backup | ❌ None | No backup before migration |

### Current Schema Creation Method

**SQL embedded in route files:**

```typescript
// Example from api/src/routes/auth.ts
const [user] = await sql`
  INSERT INTO users (email, password_hash, status)
  VALUES (${email}, ${passwordHash}, 'active')
`;
```

**Issues:**
- No migration files
- SQL scattered across route files
- No version control for schema changes
- No rollback strategy
- No separation between environments
- Manual test data cleanup
- Risk of schema drift

### Recommended Migration Framework

**Option 1: node-pg-migrate**

```bash
npm install node-pg-migrate pg
```

```javascript
// migrations/20240624000001_create_users_table.js
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'active',
    },
    email_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
```

**Option 2: dbmate**

```bash
npm install -g dbmate
```

```sql
-- migrations/20240624000001_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

```sql
-- migrations/20240624000001_create_users_table.down.sql
DROP TABLE users;
```

### Recommended Migration Strategy

1. **Extract current schema** from database
2. **Create initial migration** with current schema
3. **Set up migration framework** (node-pg-migrate or dbmate)
4. **Create migration files** for all existing tables
5. **Implement rollback** for all migrations
6. **Add migration to CI/CD** pipeline
7. **Test migrations** on staging before production
8. **Backup before migration** (automated)
9. **Implement migration testing** (unit tests)
10. **Document migration process**

---

## 5. Schema Quality Assessment

### 5.1 Data Integrity

| Check | Status | Evidence |
|-------|--------|----------|
| Primary keys | ✅ All tables have primary keys | All tables have `id` or composite PK |
| Foreign keys | ⚠️ Partial | Some missing (e.g., subscriptions.plan_id) |
| Unique constraints | ✅ Critical fields unique | email unique |
| Not null constraints | ✅ Critical fields not null | Critical fields have NOT NULL |
| Check constraints | ❌ None | No check constraints found |
| Indexes | ⚠️ Basic | Only implicit indexes from PK/FK |

### 5.2 Data Types

| Check | Status | Evidence |
|-------|--------|----------|
| Appropriate types | ✅ Good | UUID for IDs, TEXT for strings, TIMESTAMP for dates |
| Consistent types | ✅ Good | Consistent use of types across tables |
| JSONB usage | ⚠️ Limited | Only in payments.metadata |
| Array usage | ❌ None | No array types used |

### 5.3 Naming Conventions

| Check | Status | Evidence |
|-------|--------|----------|
| Table names | ✅ Good | snake_case, plural |
| Column names | ✅ Good | snake_case |
| Consistent naming | ✅ Good | Consistent across tables |
| Reserved words | ✅ Good | No reserved words used |

### 5.4 Normalization

| Check | Status | Evidence |
|-------|--------|----------|
| First normal form | ✅ Good | No repeating groups |
| Second normal form | ✅ Good | No partial dependencies |
| Third normal form | ✅ Good | No transitive dependencies |

---

## 6. Performance Assessment

### 6.1 Indexing

| Table | Indexes | Status |
|-------|---------|--------|
| users | PRIMARY KEY (id), UNIQUE (email) | ✅ Good |
| profiles | PRIMARY KEY (user_id) | ⚠️ Missing index on user_id |
| roles | PRIMARY KEY (id) | ✅ Good |
| user_roles | PRIMARY KEY (user_id, role_id) | ✅ Good |
| sessions | PRIMARY KEY (id), INDEX (user_id) | ⚠️ Missing index on token_hash |
| email_verifications | PRIMARY KEY (id), INDEX (user_id) | ⚠️ Missing index on token_hash |
| password_resets | PRIMARY KEY (id), INDEX (user_id) | ⚠️ Missing index on token_hash |
| guardians | PRIMARY KEY (id) | ⚠️ Missing index on user_id, email |
| guardian_links | PRIMARY KEY (guardian_id, learner_id) | ✅ Good |
| courses | PRIMARY KEY (id), UNIQUE (slug) | ✅ Good |
| lessons_db | PRIMARY KEY (id), INDEX (course_id) | ✅ Good |
| enrollments | PRIMARY KEY (user_id, course_id) | ✅ Good |
| lesson_progress | PRIMARY KEY (user_id, lesson_id) | ✅ Good |
| subscriptions | PRIMARY KEY (id), INDEX (user_id) | ⚠️ Missing index on stripe_subscription_id |
| payments | PRIMARY KEY (id), INDEX (user_id) | ⚠️ Missing index on stripe_checkout_session_id |
| certificates | PRIMARY KEY (id), UNIQUE (certificate_number) | ✅ Good |

**Recommendations:**
- Add index on profiles.user_id
- Add index on sessions.token_hash
- Add index on email_verifications.token_hash
- Add index on password_resets.token_hash
- Add index on guardians.user_id
- Add index on guardians.email
- Add index on subscriptions.stripe_subscription_id
- Add index on payments.stripe_checkout_session_id

### 6.2 Query Performance

| Query Pattern | Status | Evidence |
|---------------|--------|----------|
| User lookup by email | ✅ Good | Unique index on email |
| Session lookup by token | ⚠️ Missing index | No index on token_hash |
| Token lookup by hash | ⚠️ Missing index | No index on token_hash |
| Course lookup by slug | ✅ Good | Unique index on slug |
| Enrollment lookup | ✅ Good | Composite PK on user_id, course_id |
| Progress lookup | ✅ Good | Composite PK on user_id, lesson_id |

**Recommendations:**
- Add indexes for all token_hash lookups
- Add composite indexes for common query patterns
- Analyze query performance with EXPLAIN ANALYZE
- Implement query optimization

### 6.3 Connection Pooling

| Check | Status | Evidence |
|-------|--------|----------|
| Connection pooling | ⚠️ Default | Using Neon default pooling |
| Pool size configuration | ❌ None | No custom configuration |
| Connection timeout | ❌ None | No custom configuration |

**Recommendations:**
- Configure connection pool size
- Configure connection timeout
- Monitor connection pool usage
- Implement connection pool monitoring

---

## 7. Security Assessment

### 7.1 Data Security

| Check | Status | Evidence |
|-------|--------|----------|
| Password hashing | ✅ Good | PBKDF2 with 100,000 iterations |
| Token hashing | ✅ Good | SHA-256 for tokens |
| Sensitive data encryption | ❌ None | No encryption at rest |
| PII protection | ⚠️ Partial | Basic protection, no field-level encryption |
| Data masking | ❌ None | No data masking in logs |

### 7.2 Access Control

| Check | Status | Evidence |
|-------|--------|----------|
| Row-level security | ❌ None | No RLS policies |
| Column-level security | ❌ None | No column-level permissions |
| Database user permissions | ⚠️ Default | Using default Neon user |
| Least privilege | ⚠️ Partial | Basic role separation |

**Recommendations:**
- Implement row-level security (RLS)
- Implement column-level security
- Configure database user permissions
- Implement least privilege principle
- Implement data masking in logs

---

## 8. Backup & Recovery Assessment

### 8.1 Backup Strategy

| Check | Status | Evidence |
|-------|--------|----------|
| Automated backups | ❌ None | No automated backups |
| Backup retention | ❌ None | No retention policy |
| Backup verification | ❌ None | No backup verification |
| Offsite backups | ❌ None | No offsite storage |
| Backup encryption | ❌ None | No backup encryption |

### 8.2 Recovery Strategy

| Check | Status | Evidence |
|-------|--------|----------|
| Recovery procedure | ❌ None | No documented procedure |
| Recovery testing | ❌ None | No recovery tests |
| Point-in-time recovery | ⚠️ Neon feature | Neon supports PITR but not configured |
| RPO definition | ❌ None | No RPO defined |
| RTO definition | ❌ None | No RTO defined |

**Recommendations:**
- Implement automated daily backups
- Define backup retention policy (30 days)
- Implement backup verification (weekly)
- Implement offsite backup storage
- Implement backup encryption
- Document recovery procedure
- Implement recovery testing (monthly)
- Configure point-in-time recovery
- Define RPO (1 hour)
- Define RTO (4 hours)

---

## 9. Environment Separation

### Current State

| Environment | Database | Status |
|-------------|----------|--------|
| Local | .env.neon (local) | ⚠️ Shared connection |
| Development | Not configured | ❌ Not configured |
| Staging | br-curly-wind-afckj9hp | ✅ Configured |
| Production | br-misty-sea-afnny291 | ✅ Configured |
| Test | Not configured | ❌ Not configured |

**Issues:**
- No development environment
- No test environment
- Local uses production connection string (risk)
- No environment-specific configurations
- Manual test data cleanup

**Recommendations:**
- Create development environment
- Create test environment
- Use environment-specific connection strings
- Implement environment-specific configurations
- Implement automated test data cleanup
- Implement environment promotion process

---

## 10. Data Retention & Cleanup

### Current State

| Check | Status | Evidence |
|-------|--------|----------|
| Retention policy | ❌ None | No retention policy |
| Data cleanup | ❌ Manual | Manual cleanup only |
| Automated cleanup | ❌ None | No automated cleanup |
| Archive strategy | ❌ None | No archive strategy |
| Data purging | ❌ None | No data purging |

**Recommendations:**
- Define retention policy for each table
- Implement automated data cleanup
- Implement archive strategy for old data
- Implement data purging for expired data
- Document retention policy
- Implement retention monitoring

---

## 11. GDPR Compliance

### Current State

| Check | Status | Evidence |
|-------|--------|----------|
| Data export | ❌ None | No export functionality |
| Data deletion | ❌ None | No deletion functionality |
| Right to be forgotten | ❌ None | No implementation |
| Data portability | ❌ None | No implementation |
| Consent management | ✅ Good | Consent tracking exists |
| Data minimization | ⚠️ Partial | Basic minimization |

**Recommendations:**
- Implement data export functionality
- Implement data deletion functionality
- Implement right to be forgotten
- Implement data portability
- Enhance data minimization
- Document GDPR compliance

---

## 12. Recommendations

### Immediate Actions (P0)

1. **Implement migration framework**
   - Choose node-pg-migrate or dbmate
   - Extract current schema
   - Create initial migration
   - Implement rollback strategy

2. **Add missing critical tables**
   - permissions
   - products
   - prices
   - plans
   - orders
   - entitlements
   - refunds
   - payment_events
   - webhook_events
   - audit_logs
   - security_events
   - data_export_requests
   - deletion_requests

3. **Implement backup strategy**
   - Automated daily backups
   - Backup retention policy
   - Backup verification
   - Offsite storage
   - Recovery procedure
   - Recovery testing

4. **Implement environment separation**
   - Create development environment
   - Create test environment
   - Environment-specific configurations
   - Automated test data cleanup

### Phase 2 Actions (P1)

1. **Add missing important tables**
   - guardian_verifications
   - organizations
   - schools
   - classrooms
   - memberships
   - learning_paths
   - modules
   - learning_objects
   - projects
   - project_versions
   - submissions
   - assessments
   - rubrics
   - reviews
   - certificate_events

2. **Improve indexing**
   - Add missing indexes
   - Optimize query performance
   - Implement query monitoring

3. **Implement security**
   - Row-level security
   - Column-level security
   - Data encryption at rest
   - Data masking in logs

### Phase 3 Actions (P2)

1. **Add remaining tables**
   - creators
   - marketplace_products
   - marketplace_versions
   - licenses
   - payout_accounts
   - payouts
   - ai_agents
   - ai_agent_versions
   - ai_sessions
   - ai_usage
   - ai_evaluations
   - notifications
   - email_jobs
   - email_events
   - abuse_reports
   - moderation_cases
   - appeals
   - feature_flags
   - deployments
   - system_events

2. **Implement advanced features**
   - Connection pooling configuration
   - Query optimization
   - Data retention policy
   - Automated data cleanup
   - Archive strategy

3. **Implement GDPR compliance**
   - Data export functionality
   - Data deletion functionality
   - Right to be forgotten
   - Data portability

---

## 13. Migration Plan

### Step 1: Extract Current Schema

```bash
# Connect to production database
psql $DATABASE_URL

# Extract schema
pg_dump --schema-only > current_schema.sql
```

### Step 2: Set Up Migration Framework

```bash
# Install node-pg-migrate
npm install node-pg-migrate pg

# Create migrations directory
mkdir -p migrations
```

### Step 3: Create Initial Migration

```bash
# Create initial migration from current schema
npx node-pg-migrate create initial_schema --migrations-dir ./migrations
```

### Step 4: Implement Rollback

```javascript
// Ensure all migrations have down() functions
exports.down = (pgm) => {
  pgm.dropTable('table_name');
};
```

### Step 5: Add to CI/CD

```yaml
# .github/workflows/ci.yml
- name: Run migrations
  run: npx node-pg-migrate up --migrations-dir ./migrations
```

### Step 6: Test on Staging

```bash
# Run migrations on staging
DATABASE_URL=$STAGING_DATABASE_URL npx node-pg-migrate up --migrations-dir ./migrations
```

### Step 7: Backup Before Production Migration

```bash
# Backup production database
pg_dump $DATABASE_URL > backup_before_migration.sql
```

### Step 8: Run Production Migration

```bash
# Run migrations on production
DATABASE_URL=$PRODUCTION_DATABASE_URL npx node-pg-migrate up --migrations-dir ./migrations
```

### Step 9: Verify Migration

```bash
# Verify schema
psql $DATABASE_URL -c "\dt"
```

### Step 10: Monitor

```bash
# Monitor for issues
# Check logs
# Run smoke tests
```

---

## 14. Conclusion

**Current State:** Basic schema for MVP Phase 1, but missing critical tables for commercial launch. No migration system, no backup strategy, no environment separation.

**Go-Live Readiness:** ❌ NOT READY — Missing 14 critical tables, no migration system, no backup strategy.

**Recommended Path:**
1. Implement migration framework (immediate)
2. Add missing critical tables (immediate)
3. Implement backup strategy (immediate)
4. Implement environment separation (immediate)
5. Add missing important tables (Phase 2)
6. Improve indexing and security (Phase 2)
7. Add remaining tables (Phase 3)
8. Implement advanced features (Phase 3)
9. Implement GDPR compliance (Phase 3)

**Estimated Effort:** 2-3 weeks for P0, 3-4 weeks for P1, 2-3 weeks for P2.

---

**Audit Completed:** 2026-06-24
**Next Audit:** After migration framework implemented
