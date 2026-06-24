# Observability & Monitoring Guide

## Overview

This guide documents the observability infrastructure for HaMi Code Việt, including logging, metrics, monitoring, and alerting.

## Components Implemented

### 1. Request ID Tracking

**Middleware:** `requestIdMiddleware()`

- Generates unique request ID for each request
- Adds `x-request-id` header to response
- Tracks request ID globally for logging

**Usage:**
```typescript
import { requestIdMiddleware } from './lib/observability';
app.use('*', requestIdMiddleware());
```

### 2. Structured Logging

**Class:** `Logger`

- JSON-formatted logs
- Consistent structure (timestamp, level, context, message, requestId)
- Multiple log levels (info, warn, error, debug)

**Usage:**
```typescript
import { createLogger } from './lib/observability';
const logger = createLogger('auth');
logger.info('User logged in', { userId: '123' });
```

### 3. Metrics Collection

**Class:** `Metrics`

- Request counters
- Response time histograms
- Status code tracking
- In-memory storage (for Cloudflare Workers)

**Middleware:** `metricsMiddleware()`

- Tracks request count per endpoint
- Tracks response time per endpoint
- Tracks status codes

**Metrics Endpoint:** `GET /metrics`

Returns:
```json
{
  "counters": {
    "requests.total": 1000,
    "requests.get./health": 500,
    "status.200": 950,
    "status.401": 50
  },
  "histograms": {
    "response_time./health": {
      "count": 500,
      "min": 5,
      "max": 50,
      "avg": 12.5
    }
  }
}
```

### 4. Audit Logging

**Tables:** `audit_logs`, `security_events`

**Functions:**
- `logAuditEvent()` - Logs sensitive actions
- `logSecurityEvent()` - Logs security events
- `auditLoggingMiddleware()` - Auto-logs write operations

**Usage:**
```typescript
import { logAuditEvent, logSecurityEvent } from './lib/audit';

await logAuditEvent(env, {
  actor_id: user.id,
  actor_type: 'user',
  action: 'user.update',
  resource_type: 'user',
  resource_id: user.id,
  changes: { email: 'new@example.com' },
  ip: req.ip,
});

await logSecurityEvent(env, {
  event_type: 'login_failure',
  severity: 'medium',
  user_id: user.id,
  ip: req.ip,
  details: { attempts: 5 },
});
```

### 5. Error Logging

**Middleware:** `errorLoggingMiddleware()`

- Catches errors
- Logs with context (path, method, status, stack trace)
- Re-throws error for normal error handling

## Monitoring Setup

### Current State

**Implemented:**
- ✅ Request ID tracking
- ✅ Structured logging
- ✅ Metrics collection
- ✅ Audit logging tables
- ✅ Security event logging
- ✅ Error logging

**Not Yet Implemented:**
- ❌ Log aggregation service
- ❌ Metrics visualization
- ❌ Real-time monitoring
- ❌ Alerting system
- ❌ Uptime monitoring

### Recommended Services

#### Log Aggregation

**Options:**
1. **Cloudflare Workers Analytics** (Built-in)
   - Free tier available
   - Basic request logs
   - Limited retention

2. **Logtail** (Better Stack)
   - Cloudflare Workers integration
   - Structured log support
   - Real-time search
   - Pricing: $0.50/GB

3. **Datadog**
   - Full observability platform
   - Expensive but comprehensive
   - Pricing: $15/host/month

**Recommendation:** Start with Cloudflare Workers Analytics, upgrade to Logtail if needed.

#### Metrics Visualization

**Options:**
1. **Cloudflare Workers Analytics** (Built-in)
   - Basic metrics
   - No custom metrics

2. **Grafana + Prometheus**
   - Open source
   - Requires self-hosting
   - Complex setup

3. **Datadog**
   - Integrated metrics
   - Dashboards
   - Expensive

**Recommendation:** Use Cloudflare Workers Analytics for now, consider Grafana for custom metrics.

#### Uptime Monitoring

**Options:**
1. **UptimeRobot** (Free)
   - Basic uptime monitoring
   - 50 monitors free
   - Email alerts

2. **Pingdom** (Paid)
   - Advanced monitoring
   - SMS alerts
   - Pricing: $10/month

3. **StatusCake** (Free tier)
   - Basic monitoring
   - 10 monitors free

**Recommendation:** Start with UptimeRobot (free), upgrade if needed.

#### Alerting

**Options:**
1. **Email alerts** (Free)
   - Cloudflare Workers Analytics
   - UptimeRobot

2. **Slack alerts** (Paid)
   - Webhook integration
   - Real-time notifications

3. **PagerDuty** (Paid)
   - On-call rotation
   - Escalation
   - Pricing: $21/user/month

**Recommendation:** Start with email alerts, add Slack if needed.

## Alert Configuration

### Critical Alerts

**Site Down:**
- Condition: HTTP 5xx or timeout
- Severity: Critical
- Channels: Email, Slack
- Escalation: 5 minutes → 15 minutes → 30 minutes

**API Error Spike:**
- Condition: Error rate > 5% for 5 minutes
- Severity: High
- Channels: Email, Slack
- Escalation: 10 minutes → 30 minutes

**Login Attack:**
- Condition: Failed login rate > 10/minute from single IP
- Severity: High
- Channels: Email
- Escalation: Immediate

**Payment Failure:**
- Condition: Payment webhook failure or payment error rate > 1%
- Severity: Critical
- Channels: Email, Slack
- Escalation: Immediate

**Database Saturation:**
- Condition: Connection pool > 90% or query time > 5s
- Severity: Critical
- Channels: Email, Slack
- Escalation: 5 minutes → 15 minutes

**Email Outage:**
- Condition: Email delivery failure rate > 10%
- Severity: High
- Channels: Email
- Escalation: 10 minutes → 30 minutes

### Warning Alerts

**High Response Time:**
- Condition: P95 response time > 2s
- Severity: Warning
- Channels: Email
- Escalation: None

**Disk Space Low:**
- Condition: Database storage > 80%
- Severity: Warning
- Channels: Email
- Escalation: None

**Certificate Expiring:**
- Condition: SSL certificate expires in < 30 days
- Severity: Warning
- Channels: Email
- Escalation: None

## Monitoring Dashboard

### Key Metrics to Track

**Application Metrics:**
- Request rate (requests/second)
- Error rate (percentage)
- Response time (P50, P95, P99)
- Status code distribution
- Active users

**Business Metrics:**
- Signups per day
- Payments per day
- Revenue per day
- Active subscriptions
- Course enrollments

**Infrastructure Metrics:**
- Worker CPU usage
- Worker memory usage
- Database connection pool
- Database query time
- Email queue depth

### Dashboard Layout

**Overview:**
- Uptime status
- Request rate
- Error rate
- Response time

**Application:**
- Endpoint performance
- Error distribution
- Active users

**Business:**
- Signups
- Payments
- Revenue
- Subscriptions

**Infrastructure:**
- Worker health
- Database health
- Email queue health

## Log Retention Policy

**Current:** Logs stored in console only (no retention)

**Recommended:**
- Application logs: 30 days
- Audit logs: 1 year
- Security logs: 1 year
- Access logs: 90 days

## Troubleshooting

### No logs appearing

1. Check middleware is applied
2. Check logger context is correct
3. Check request ID is being set
4. Check console output

### Metrics not updating

1. Check metrics middleware is applied
2. Check `/metrics` endpoint is accessible
3. Check global metrics object is initialized

### Audit logs not saving

1. Check database connection
2. Check audit_logs table exists
3. Check DB is attached to env
4. Check logAuditEvent() is being called

## Next Steps

1. **Set up log aggregation** (Cloudflare Workers Analytics or Logtail)
2. **Set up uptime monitoring** (UptimeRobot)
3. **Configure alerts** (email → Slack → PagerDuty)
4. **Create monitoring dashboard** (Grafana or Datadog)
5. **Define alert thresholds** (based on baseline metrics)
6. **Test alerting** (simulate failures)
7. **Document runbooks** (response procedures)

## References

- [Cloudflare Workers Analytics](https://developers.cloudflare.com/workers/analytics/)
- [Logtail documentation](https://betterstack.com/docs/logtail)
- [Grafana documentation](https://grafana.com/docs/)
- [UptimeRobot documentation](https://uptimerobot.com/)
