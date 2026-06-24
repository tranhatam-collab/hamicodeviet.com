# HaMi Code Việt — Payment & Subscription Audit

**Audit Date:** 2026-06-24
**Auditor:** Devin AI
**Payment Provider:** Stripe (demo mode only)

---

## Executive Summary

The payment audit reveals that the platform has basic payment infrastructure in place but is not production-ready. Critical issues include no Stripe keys configured, demo mode only, no live transaction tested, no entitlement system, no refund system, and no billing portal.

**Overall Verdict:** ❌ FAIL — Payment not production-ready, missing critical components for go-live.

---

## 1. Payment Infrastructure

### 1.1 Provider Configuration

| Setting | Value | Status |
|---------|-------|--------|
| Provider | Stripe | ✅ Configured |
| Mode | Demo only | ❌ Not production |
| Secret key | ❌ NOT SET | Not configured |
| Webhook secret | ❌ NOT SET | Not configured |
| Publishable key | ❌ NOT SET | Not configured |

**Assessment:** ❌ FAIL — No Stripe keys configured

### 1.2 Payment Flow

#### Current Flow (Demo Mode)

```
1. User selects plan
2. Client requests checkout: POST /payments/checkout
3. Server creates demo checkout (no Stripe session)
4. Server returns success URL
5. Client redirects to success
6. Server creates subscription record
7. Server creates payment record
8. Server grants entitlement (implicit)
```

#### Production Flow (Planned)

```
1. User selects plan
2. Client requests checkout: POST /payments/checkout
3. Server creates Stripe checkout session
4. Server returns Stripe checkout URL
5. User completes payment on Stripe
6. Stripe sends webhook: POST /payments/webhook
7. Server verifies webhook signature
8. Server creates subscription record
9. Server creates payment record
10. Server grants entitlement
```

**Assessment:** ❌ FAIL — Demo mode only, no production flow

---

## 2. Payment Components

### 2.1 Plans

| Check | Status | Evidence |
|-------|--------|----------|
| Plan management | ❌ Hardcoded | Hardcoded in payments.ts |
| Plan database | ❌ None | No plans table |
| Plan versioning | ❌ None | No versioning |
| Plan pricing | ⚠️ Hardcoded | Hardcoded in code |
| Plan metadata | ❌ None | No metadata |

**Current Plans (Hardcoded):**

```typescript
// api/src/routes/payments.ts
const plans = [
  {
    id: 'family-pass',
    name: 'Family Pass',
    priceCents: 990000,
    currency: 'VND',
    interval: 'monthly',
    description: 'Family Pass - Monthly'
  },
  {
    id: 'creator-pass',
    name: 'Creator Pass',
    priceCents: 1990000,
    currency: 'VND',
    interval: 'monthly',
    description: 'Creator Pass - Monthly'
  }
];
```

**Assessment:** ❌ FAIL — Hardcoded plans, no database

### 2.2 Checkout

| Check | Status | Evidence |
|-------|--------|----------|
| Checkout endpoint | ✅ Yes | POST /payments/checkout |
| Stripe integration | ⚠️ Demo only | Demo mode |
| Checkout session creation | ⚠️ Demo only | No real session |
| Idempotency | ❌ None | No idempotency key |
| Metadata tracking | ⚠️ Partial | Basic metadata |
| Error handling | ⚠️ Basic | Basic error handling |

**Assessment:** ⚠️ WARN — Basic checkout, demo mode only

### 2.3 Webhook

| Check | Status | Evidence |
|-------|--------|----------|
| Webhook endpoint | ✅ Yes | POST /payments/webhook |
| Signature verification | ❌ Not configured | Secret not set |
| Event handling | ⚠️ Partial | Basic handling |
| Idempotency | ❌ None | No idempotency |
| Retry handling | ❌ None | No retry logic |
| DLQ | ❌ None | No DLQ |
| Webhook logging | ❌ None | No logging |

**Assessment:** ❌ FAIL — Webhook not production-ready

### 2.4 Subscription

| Check | Status | Evidence |
|-------|--------|----------|
| Subscription table | ✅ Yes | subscriptions table |
| Subscription creation | ✅ Yes | Webhook creates subscription |
| Subscription updates | ❌ None | No update handling |
| Subscription cancellation | ❌ None | No cancellation flow |
| Subscription renewal | ❌ None | No renewal handling |
| Subscription status tracking | ⚠️ Partial | Basic status |
| Billing portal | ❌ None | No billing portal |

**Assessment:** ⚠️ WARN — Basic subscription, missing critical features

### 2.5 Payment

| Check | Status | Evidence |
|-------|--------|----------|
| Payment table | ✅ Yes | payments table |
| Payment creation | ✅ Yes | Webhook creates payment |
| Payment tracking | ⚠️ Partial | Basic tracking |
| Payment status | ⚠️ Partial | Basic status |
| Payment metadata | ⚠️ Partial | Basic metadata |
| Payment reconciliation | ❌ None | No reconciliation |
| Payment refund | ❌ None | No refund system |

**Assessment:** ⚠️ WARN — Basic payment tracking, missing critical features

### 2.6 Entitlement

| Check | Status | Evidence |
|-------|--------|----------|
| Entitlement system | ❌ None | No entitlement table |
| Entitlement granting | ⚠️ Implicit | Implicit from subscription |
| Entitlement revocation | ❌ None | No revocation |
| Entitlement tracking | ❌ None | No tracking |
| Entitlement validation | ❌ None | No validation |

**Assessment:** ❌ FAIL — No entitlement system

---

## 3. Missing Components

### 3.1 Critical Missing (P0)

| Component | Purpose | Impact |
|-----------|---------|--------|
| Stripe keys | Production payment | Cannot process real payments |
| Webhook signature verification | Webhook security | Security risk |
| Live transaction test | Production verification | No production verification |
| Entitlement system | Access control | No proper access control |
| Refund system | Refund processing | Cannot process refunds |

### 3.2 Important Missing (P1)

| Component | Purpose | Impact |
|-----------|---------|--------|
| Plans table | Plan management | Cannot manage plans |
| Products table | Product management | Cannot manage products |
| Prices table | Price management | Cannot manage prices |
| Orders table | Order tracking | No order tracking |
| Billing portal | User self-service | Poor UX |
| Cancellation flow | Subscription cancellation | Poor UX |
| Idempotency | Duplicate prevention | Risk of duplicates |
| Webhook retry | Reliability | Poor reliability |
| Webhook DLQ | Error handling | Poor error handling |

### 3.3 Advanced Missing (P2)

| Component | Purpose | Impact |
|-----------|---------|--------|
| Payment events | Payment audit | No audit trail |
| Webhook events | Webhook audit | No audit trail |
| Dispute handling | Dispute resolution | Cannot handle disputes |
| Invoice system | Invoicing | No invoicing |
| Tax calculation | Tax compliance | No tax handling |
| Multi-currency | International | Single currency only |
| Payment methods | Flexibility | Limited payment methods |
| Payment scheduling | Recurring payments | Limited scheduling |

---

## 4. Security Assessment

### 4.1 Payment Security

| Check | Status | Evidence |
|-------|--------|----------|
| PCI compliance | ⚠️ Partial | Stripe handles PCI |
| Webhook signature verification | ❌ Not configured | Security risk |
| API key security | ✅ Yes | Worker secrets |
| Payment data logging | ⚠️ Partial | Basic logging |
| PII protection | ⚠️ Partial | Basic protection |

**Assessment:** ⚠️ WARN — Basic security, webhook signature not configured

### 4.2 Fraud Prevention

| Check | Status | Evidence |
|-------|--------|----------|
| Fraud detection | ❌ None | Not implemented |
| Risk scoring | ❌ None | Not implemented |
| Velocity checks | ❌ None | Not implemented |
| Blacklist | ❌ None | Not implemented |
| Whitelist | ❌ None | Not implemented |

**Assessment:** ❌ FAIL — No fraud prevention

---

## 5. Compliance Assessment

### 5.1 Payment Compliance

| Check | Status | Evidence |
|-------|--------|----------|
| PCI DSS | ⚠️ Partial | Stripe handles PCI |
| GDPR | ⚠️ Partial | Basic compliance |
| PSD2 | ❌ None | Not applicable (Vietnam) |
| SCA | ❌ None | Not applicable (Vietnam) |
| Tax compliance | ❌ None | No tax handling |

**Assessment:** ⚠️ WARN — Partial compliance

### 5.2 Refund Policy

| Check | Status | Evidence |
|-------|--------|----------|
| Refund policy | ❌ None | Not defined |
| Refund system | ❌ None | Not implemented |
| Refund tracking | ❌ None | Not implemented |
| Refund reporting | ❌ None | Not implemented |

**Assessment:** ❌ FAIL — No refund policy or system

---

## 6. Testing Assessment

### 6.1 Payment Testing

| Check | Status | Evidence |
|-------|--------|----------|
| Unit tests | ❌ None | Not implemented |
| Integration tests | ❌ None | Not implemented |
| E2E tests | ❌ None | Not implemented |
| Webhook tests | ❌ None | Not implemented |
| Refund tests | ❌ None | Not implemented |
| Dispute tests | ❌ None | Not implemented |
| Live transaction test | ❌ None | Not performed |

**Assessment:** ❌ FAIL — No payment testing

### 6.2 Test Scenarios

| Scenario | Status | Evidence |
|----------|--------|----------|
| Successful payment | ❌ Not tested | Not tested |
| Failed payment | ❌ Not tested | Not tested |
| Timeout | ❌ Not tested | Not tested |
| Duplicate | ❌ Not tested | Not tested |
| Wrong signature | ❌ Not tested | Not tested |
| Delayed webhook | ❌ Not tested | Not tested |
| Cancel | ❌ Not tested | Not tested |
| Renewal | ❌ Not tested | Not tested |
| Refund | ❌ Not tested | Not tested |
| Dispute | ❌ Not tested | Not tested |
| Entitlement revoke | ❌ Not tested | Not tested |
| Guardian payer | ❌ Not tested | Not tested |
| School invoice | ❌ Not tested | Not tested |

**Assessment:** ❌ FAIL — No test scenarios covered

---

## 7. Operational Assessment

### 7.1 Payment Operations

| Check | Status | Evidence |
|-------|--------|----------|
| Payment monitoring | ❌ None | Not implemented |
| Payment alerts | ❌ None | Not implemented |
| Payment reconciliation | ❌ None | Not implemented |
| Payment reporting | ❌ None | Not implemented |
| Payment analytics | ❌ None | Not implemented |

**Assessment:** ❌ FAIL — No payment operations

### 7.2 Webhook Operations

| Check | Status | Evidence |
|-------|--------|----------|
| Webhook monitoring | ❌ None | Not implemented |
| Webhook alerts | ❌ None | Not implemented |
| Webhook backlog monitoring | ❌ None | Not implemented |
| Webhook replay | ❌ None | Not implemented |
| Webhook debugging | ❌ None | Not implemented |

**Assessment:** ❌ FAIL — No webhook operations

---

## 8. Recommendations

### Immediate Actions (P0)

1. **Configure Stripe keys**
   - Set STRIPE_SECRET_KEY
   - Set STRIPE_WEBHOOK_SECRET
   - Set STRIPE_PUBLISHABLE_KEY
   - Test key configuration

2. **Implement webhook signature verification**
   - Add signature verification
   - Test signature verification
   - Handle signature errors

3. **Run live transaction test**
   - Perform test transaction
   - Verify webhook receipt
   - Verify subscription creation
   - Verify payment creation
   - Verify entitlement granting

4. **Implement entitlement system**
   - Create entitlements table
   - Implement entitlement granting
   - Implement entitlement validation
   - Implement entitlement revocation

5. **Implement refund system**
   - Create refunds table
   - Implement refund API
   - Implement refund webhook handling
   - Test refund flow

### Phase 2 Actions (P1)

1. **Implement plan management**
   - Create plans table
   - Implement plan CRUD
   - Implement plan versioning
   - Migrate hardcoded plans

2. **Implement product management**
   - Create products table
   - Implement product CRUD
   - Implement product versioning
   - Link products to plans

3. **Implement order system**
   - Create orders table
   - Implement order creation
   - Implement order tracking
   - Implement order status

4. **Implement billing portal**
   - Integrate Stripe billing portal
   - Implement cancellation flow
   - Implement payment method update
   - Implement invoice access

5. **Implement idempotency**
   - Add idempotency keys
   - Implement idempotency checking
   - Test idempotency

6. **Implement webhook retry**
   - Add retry logic
   - Configure retry policy
   - Implement retry backoff
   - Add webhook DLQ

### Phase 3 Actions (P2)

1. **Implement audit trails**
   - Create payment_events table
   - Create webhook_events table
   - Log all payment events
   - Log all webhook events

2. **Implement dispute handling**
   - Add dispute webhook handling
   - Implement dispute response
   - Implement dispute tracking
   - Implement dispute reporting

3. **Implement invoice system**
   - Integrate Stripe invoices
   - Implement invoice access
   - Implement invoice download
   - Implement invoice history

4. **Implement tax calculation**
   - Integrate tax provider
   - Implement tax calculation
   - Implement tax reporting
   - Implement tax compliance

5. **Implement fraud prevention**
   - Add fraud detection
   - Add risk scoring
   - Add velocity checks
   - Add blacklist/whitelist

---

## 9. Conclusion

**Current State:** Basic payment infrastructure in place, but not production-ready. Demo mode only, no Stripe keys configured, no live transaction tested, no entitlement system, no refund system.

**Go-Live Readiness:** ❌ NOT READY — Missing critical components (Stripe keys, webhook signature verification, live transaction test, entitlement system, refund system).

**Recommended Path:**
1. Configure Stripe keys (immediate)
2. Implement webhook signature verification (immediate)
3. Run live transaction test (immediate)
4. Implement entitlement system (immediate)
5. Implement refund system (immediate)
6. Implement plan management (Phase 2)
7. Implement product management (Phase 2)
8. Implement order system (Phase 2)
9. Implement billing portal (Phase 2)
10. Implement idempotency and webhook retry (Phase 2)

**Estimated Effort:** 1-2 weeks for P0, 2-3 weeks for P1, 2-3 weeks for P2.

---

**Audit Completed:** 2026-06-24
**Next Audit:** After Stripe keys configured and live transaction tested
