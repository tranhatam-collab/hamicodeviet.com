# Child Safety Enforcement Guide

## Overview

This guide documents the child safety enforcement implementation for the HaMi Code Việt platform, ensuring compliance with child protection laws and best practices.

## Legal Framework

### Key Regulations

1. **COPPA (Children's Online Privacy Protection Act)** - USA
   - Applies to children under 13
   - Requires parental consent for data collection
   - Requires privacy policy disclosure

2. **GDPR-K (General Data Protection Regulation for Children)** - EU
   - Applies to children under 16 (varies by country)
   - Requires parental consent for data processing
   - Enhanced data protection measures

3. **Vietnam Law on Cybersecurity** - Vietnam
   - Applies to all users
   - Requires data protection measures
   - Requires user consent for data processing

### Age-Based Restrictions

| Age Group | Restrictions | Requirements |
|-----------|-------------|--------------|
| Under 13 | No public portfolio, no marketplace, limited AI, no messaging | Guardian required, privacy defaults |
| 13-17 | Limited public portfolio, no marketplace, limited AI, no messaging | Guardian consent required |
| 18+ | Full access | None |

## Implementation

### 1. Database Schema

**Tables Added:**
- `child_safety_settings` - User-specific safety settings
- `profiles.age_verified` - Age verification status
- `country_policies` - Country-specific age requirements

**Migration:** `20240624000005_add_child_safety.js`

### 2. Child Safety Middleware

**File:** `api/src/lib/childSafety.ts`

**Functions:**
- `calculateAge()` - Calculate age from birth year
- `isMinor()` - Check if user is under 18
- `isChild()` - Check if user is under 13
- `isYoungTeen()` - Check if user is 13-17
- `enforceChildSafety()` - Enforce age-based restrictions
- `childSafetyMiddleware()` - Middleware for route protection
- `applyDefaultChildSafetySettings()` - Apply default settings for new users

### 3. Route Integration

**Apply to sensitive routes:**

```typescript
import { childSafetyMiddleware } from '../lib/childSafety';

// Payments - require 18+
payments.post('/checkout', childSafetyMiddleware('payment'), async (c) => {
  // ... payment logic
});

// Public portfolio - require guardian consent for under 16
portfolio.put('/visibility', childSafetyMiddleware('public_portfolio'), async (c) => {
  // ... portfolio logic
});

// Marketplace - require 18+
marketplace.get('/products', childSafetyMiddleware('marketplace_access'), async (c) => {
  // ... marketplace logic
});

// AI interactions - limited for under 13
ai.post('/chat', childSafetyMiddleware('ai_interaction'), async (c) => {
  // ... AI logic
});

// Messaging - disabled for under 13
messaging.post('/send', childSafetyMiddleware('messaging'), async (c) => {
  // ... messaging logic
});
```

### 4. Age Verification

**Methods:**
1. **Self-declaration** - User enters birth year
2. **Parent verification** - Guardian confirms age
3. **ID verification** - Government ID (future, requires third-party service)

**Implementation:**

```typescript
// Self-declaration during signup
await applyDefaultChildSafetySettings(env, userId, birthYear);

// Parent verification
await sql`
  UPDATE profiles
  SET age_verified = true,
      age_verification_method = 'parent',
      age_verified_at = now()
  WHERE user_id = ${userId}
`;
```

### 5. Guardian Approval

**Flow:**
1. User requests access to restricted feature
2. System checks if guardian approval required
3. If required, send approval request to guardian
4. Guardian approves via email link
5. System grants access

**Implementation:**

```typescript
// Check if guardian approval required
const requiresApproval = await requiresGuardianApproval(env, userId, action);

if (requiresApproval) {
  const hasApproval = await hasGuardianApproval(env, userId);
  if (!hasApproval) {
    return c.json({
      error: 'guardian_approval_required',
      message: 'This action requires guardian approval',
    }, 403);
  }
}
```

### 6. Privacy Defaults

**For Children (Under 13):**
- Portfolio: Private
- Marketplace: Disabled
- AI: Limited interactions
- Messaging: Disabled
- Data collection: Minimal

**For Young Teens (13-17):**
- Portfolio: Guardian-only
- Marketplace: Disabled
- AI: Standard interactions
- Messaging: Disabled
- Data collection: Standard

**For Adults (18+):**
- Portfolio: Public
- Marketplace: Enabled
- AI: Full access
- Messaging: Enabled
- Data collection: Standard

## Security Events

**Logged Events:**
- `minor_payment_attempt` - Minor attempts payment
- `minor_public_portfolio` - Minor has public portfolio
- `minor_marketplace_access` - Minor accesses marketplace
- `minor_messaging_attempt` - Minor attempts messaging
- `age_verification_failed` - Age verification failed

**Severity:**
- High: Payment attempts, marketplace access
- Medium: Public portfolio, messaging
- Low: Age verification failures

## Country-Specific Policies

**Vietnam:**
- Minimum age for payment: 18
- Guardian required for under: 13
- Guardian consent required for under: 16

**USA (COPPA):**
- Minimum age for payment: 18
- Guardian required for under: 13
- Guardian consent required for under: 13

**EU (GDPR-K):**
- Minimum age for payment: 18
- Guardian required for under: 16
- Guardian consent required for under: 16

## Testing

### Test Age Calculation

```typescript
// Test current year
const age = calculateAge(2010); // Should be ~16
console.log(age);

// Test child
const isChild = isChild(2015); // Should be true
console.log(isChild);

// Test minor
const isMinor = isMinor(2010); // Should be true
console.log(isMinor);
```

### Test Child Safety Enforcement

```typescript
// Test payment restriction
const result = await enforceChildSafety(env, {
  userId: 'test-user-id',
  action: 'payment',
});
console.log(result); // { allowed: false, reason: '...' }

// Test public portfolio
const result = await enforceChildSafety(env, {
  userId: 'test-user-id',
  action: 'public_portfolio',
});
console.log(result); // { allowed: false, reason: '...' }
```

## Monitoring

### Metrics to Track

- Number of minors attempting restricted actions
- Number of guardian approvals
- Number of age verification failures
- Number of security events by type

### Alerts

- High rate of minor payment attempts
- High rate of minor marketplace access
- High rate of age verification failures

## Compliance Checklist

- [ ] Age verification implemented
- [ ] Guardian approval system implemented
- [ ] Privacy defaults applied
- [ ] Country-specific policies configured
- [ ] Security events logged
- [ ] Monitoring configured
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Parent consent forms created
- [ ] Data minimization implemented

## Privacy Policy Updates

**Add to Privacy Policy:**

```markdown
## Child Safety

We take special precautions to protect children who use our platform.

### Age-Based Restrictions

- Users under 13 have limited access to features
- Users 13-17 require guardian consent for certain features
- Users 18+ have full access to all features

### Data Collection for Children

- We collect minimal data from children under 13
- We require parental consent for data collection
- We do not sell or share children's data

### Guardian Rights

- Parents can request access to their child's data
- Parents can request deletion of their child's data
- Parents can withdraw consent at any time
```

## Terms of Service Updates

**Add to Terms of Service:**

```markdown
## Age Requirements

- You must be at least 8 years old to use this platform
- Users under 18 require guardian consent for certain features
- Users under 13 have limited access to features

## Parental Responsibility

- Parents are responsible for their child's use of the platform
- Parents must provide consent for data collection
- Parents can monitor their child's activity
```

## References

- [COPPA](https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/childrens-online-privacy-protection-rule)
- [GDPR-K](https://gdpr-info.eu/)
- [Vietnam Law on Cybersecurity](https://luatvietnam.vn/luat-an-ninh-mang-2020-118593-d0.html)
- [Child Online Protection](https://www.unicef.org/protection/child-online-protection)
