# Audit Logging Integration Guide

## Overview

This guide documents the audit logging integration for the HaMi Code Việt platform.

## Current State

### Tables Created (P0.2)
- `audit_logs` - Records all sensitive actions
- `security_events` - Records security-related events

### Functions Available (P0.2)
- `logAuditEvent()` - Log sensitive actions
- `logSecurityEvent()` - Log security events
- `auditLoggingMiddleware()` - Auto-log write operations

## Integration Status

### ✅ Fully Integrated
- **Admin routes** (admin.ts) - All write operations logged
- **Products routes** (products.ts) - All write operations logged
- **Entitlements routes** (entitlements.ts) - All write operations logged
- **Refunds routes** (refunds.ts) - All write operations logged
- **Auth routes** (auth.ts) - Signup, login, failed login logged

### ⏸️ Partially Integrated
- **Payments routes** (payments.ts) - Demo mode logged, PayPal pending
- **Guardian routes** (guardian.ts) - Not integrated
- **Consent routes** (consent.ts) - Not integrated
- **Courses routes** (courses.ts) - Not integrated
- **Progress routes** (progress.ts) - Not integrated

## How to Integrate

### Step 1: Import Functions

```typescript
import { logAuditEvent, logSecurityEvent } from '../lib/audit';
```

### Step 2: Log Audit Events

```typescript
await logAuditEvent(c.env, {
  actor_id: user.id,
  actor_type: 'user',
  action: 'resource.action',
  resource_type: 'resource',
  resource_id: resourceId,
  changes: data,
  ip: c.req.header('cf-connecting-ip'),
  user_agent: c.req.header('user-agent'),
  request_id: c.get('requestId'),
});
```

### Step 3: Log Security Events

```typescript
await logSecurityEvent(c.env, {
  event_type: 'security_event_type',
  severity: 'medium',
  user_id: user.id,
  ip: c.req.header('cf-connecting-ip'),
  user_agent: c.req.header('user-agent'),
  details: { ... },
  request_id: c.get('requestId'),
});
```

### Step 4: Use Middleware (Optional)

```typescript
import { auditLoggingMiddleware } from '../lib/audit';

app.post('/resource', auditLoggingMiddleware('resource.create', 'resource'), async (c) => {
  // ... route handler
});
```

## Audit Event Types

### User Actions
- `user.signup` - User registration
- `user.login` - User login
- `user.update` - User profile update
- `user.delete` - User deletion
- `user.update_status` - User status change (suspend/activate)

### Resource Actions
- `course.create` - Course creation
- `course.update` - Course update
- `course.delete` - Course deletion
- `payment.create` - Payment creation
- `refund.approve` - Refund approval
- `refund.reject` - Refund rejection
- `entitlement.grant` - Entitlement grant
- `entitlement.revoke` - Entitlement revocation

## Security Event Types

### Authentication
- `login_failed` - Failed login attempt
- `login_success` - Successful login
- `password_reset` - Password reset
- `account_locked` - Account locked

### Authorization
- `unauthorized_access` - Unauthorized access attempt
- `permission_denied` - Permission denied
- `role_change` - Role change

### Data Protection
- `data_export` - Data export
- `data_deletion` - Data deletion
- `sensitive_access` - Access to sensitive data

## Monitoring

### Queries

**Recent audit logs:**
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;
```

**Audit logs by user:**
```sql
SELECT * FROM audit_logs WHERE actor_id = 'user-id' ORDER BY created_at DESC;
```

**Security events by severity:**
```sql
SELECT * FROM security_events WHERE severity = 'high' ORDER BY created_at DESC;
```

**Unresolved security events:**
```sql
SELECT * FROM security_events WHERE resolved = false ORDER BY created_at DESC;
```

## Retention Policy

**Audit logs:** 1 year
**Security events:** 1 year

## Next Steps

1. Integrate audit logging to remaining routes:
   - Guardian routes
   - Consent routes
   - Courses routes
   - Progress routes

2. Add audit logging middleware to all write operations

3. Create audit log viewer in admin panel

4. Set up alerts for high-severity security events

## References

- Audit logging implementation: `api/src/lib/audit.ts`
- Audit tables: `api/migrations/20240624000002_add_audit_tables.js`
