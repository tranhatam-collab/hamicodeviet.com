# Stripe Setup Guide

## Overview

This guide documents the required Stripe configuration for hamicodeviet.com payment processing.

## Prerequisites

1. Stripe account (https://dashboard.stripe.com)
2. Stripe API keys
3. Stripe webhook secret

## Step 1: Get Stripe API Keys

### Test Mode (Development)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the following keys:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

### Live Mode (Production)

1. Go to https://dashboard.stripe.com/apikeys
2. Toggle to "Live mode"
3. Copy the following keys:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

## Step 2: Configure Webhook

### Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://api.hamicodeviet.com/payments/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### Get Webhook Secret

1. After creating webhook, click on the webhook
2. Click "Reveal" next to "Signing secret"
3. Copy the secret: `whsec_...`

## Step 3: Set Worker Secrets

### For Development (Test Mode)

```bash
cd api
npx wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_test_...

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_...

npx wrangler secret put STRIPE_PUBLISHABLE_KEY
# Enter: pk_test_...
```

### For Production (Live Mode)

```bash
cd api
npx wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_live_...

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_...

npx wrangler secret put STRIPE_PUBLISHABLE_KEY
# Enter: pk_live_...
```

## Step 4: Update Code

### Update env.d.ts

Ensure `env.d.ts` includes Stripe secrets:

```typescript
interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_URL: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  RATE_LIMITER: DurableObjectNamespace;
  EMAIL_QUEUE: Queue<EmailQueueMessage>;
  EMAIL_DLQ: Queue<EmailQueueMessage>;
}
```

### Update payments.ts

Ensure webhook signature verification is implemented:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Webhook signature verification
const signature = c.req.header('stripe-signature');
const event = stripe.webhooks.constructEvent(
  await c.req.text(),
  signature,
  env.STRIPE_WEBHOOK_SECRET
);
```

## Step 5: Test Payment Flow

### Test Mode Transaction

1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future date
3. Any CVC
4. Any postal code

### Live Mode Transaction

1. Use real card
2. Small amount (e.g., $1.00)
3. Verify payment succeeds
4. Verify webhook received
5. Verify subscription created
6. Verify entitlement granted

## Step 6: Verify End-to-End

### Checklist

- [ ] Stripe keys configured in Worker secrets
- [ ] Webhook endpoint created in Stripe
- [ ] Webhook secret configured in Worker
- [ ] Test payment succeeds
- [ ] Webhook received
- [ ] Subscription created in database
- [ ] Payment recorded in database
- [ ] Entitlement granted
- [ ] User can access paid content

## Troubleshooting

### Webhook not received

1. Check webhook endpoint is accessible
2. Check Stripe webhook logs
3. Verify webhook secret matches
4. Check Worker logs

### Payment fails

1. Check Stripe logs
2. Check Worker logs
3. Verify API keys are correct
4. Check webhook signature verification

### Entitlement not granted

1. Check webhook processing
2. Check database records
3. Check entitlement logic
4. Verify user subscription status

## Security Notes

- **Never** commit Stripe secrets to git
- **Never** log Stripe secrets
- **Always** use environment variables
- **Always** verify webhook signatures
- **Always** use HTTPS for webhooks

## References

- [Stripe API documentation](https://stripe.com/docs/api)
- [Stripe webhooks documentation](https://stripe.com/docs/webhooks)
- [Stripe test cards](https://stripe.com/docs/testing)
