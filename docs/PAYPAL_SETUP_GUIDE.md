# PayPal Setup Guide

## Overview

This guide documents the PayPal configuration for hamicodeviet.com payment processing using PayPal Sandbox for testing.

## Prerequisites

1. PayPal Developer account (https://developer.paypal.com)
2. PayPal Sandbox credentials
3. PayPal Webhook URL

## Step 1: Get PayPal Sandbox Credentials

### Create PayPal Developer Account

1. Go to https://developer.paypal.com
2. Sign up or log in
3. Navigate to "Apps & Credentials"
4. Click "Create App"
5. App name: `HaMi Code Viet`
6. Select: "Merchant"
7. Create app

### Get Sandbox Credentials

1. In the app details, find "Sandbox" section
2. Copy the following:
   - Client ID: `AXxxxxx...`
   - Client Secret: `EKxxxxx...`

### Get Live Credentials (for production later)

1. In the app details, find "Live" section
2. Copy the following:
   - Client ID: `AXxxxxx...`
   - Client Secret: `EKxxxxx...`

## Step 2: Configure Webhook

### Create Webhook Endpoint

1. Go to https://developer.paypal.com/webhooks/
2. Click "Add Webhook"
3. Webhook URL: `https://api.hamicodeviet.com/payments/webhook`
4. Webhook events to listen for:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`

### Get Webhook ID

1. After creating webhook, copy the webhook ID
2. Webhook ID format: `xxxxx...`

## Step 3: Set Worker Secrets

### For Development (Sandbox)

```bash
cd api
npx wrangler secret put PAYPAL_CLIENT_ID
# Enter: AXxxxxx... (Sandbox)

npx wrangler secret put PAYPAL_CLIENT_SECRET
# Enter: EKxxxxx... (Sandbox)

npx wrangler secret put PAYPAL_WEBHOOK_ID
# Enter: xxxxx...

npx wrangler secret put PAYPAL_MODE
# Enter: sandbox
```

### For Production (Live)

```bash
cd api
npx wrangler secret put PAYPAL_CLIENT_ID
# Enter: AXxxxxx... (Live)

npx wrangler secret put PAYPAL_CLIENT_SECRET
# Enter: EKxxxxx... (Live)

npx wrangler secret put PAYPAL_WEBHOOK_ID
# Enter: xxxxx...

npx wrangler secret put PAYPAL_MODE
# Enter: live
```

## Step 4: Update Code

### Install PayPal SDK

```bash
cd api
npm install @paypal/paypal-server-sdk
```

### Update env.d.ts

Ensure `env.d.ts` includes PayPal secrets:

```typescript
interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_URL: string;
  RESEND_API_KEY string;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_WEBHOOK_ID: string;
  PAYPAL_MODE: 'sandbox' | 'live';
  RATE_LIMITER: DurableObjectNamespace;
  EMAIL_QUEUE: Queue<EmailQueueMessage>;
  EMAIL_DLQ: Queue<EmailQueueMessage>;
}
```

### Update payments.ts

Implement PayPal integration:

```typescript
import { PayPalClient, PayPalEnvironment } from '@paypal/paypal-server-sdk';

function getPayPalClient(env: Env) {
  const environment = env.PAYPAL_MODE === 'live'
    ? new PayPalEnvironment.Live(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET)
    : new PayPalEnvironment.Sandbox(env.PAYPAL_CLIENT_ID, env.PAYPAL_CLIENT_SECRET);

  return new PayPalClient(environment);
}
```

## Step 5: Test Payment Flow

### Sandbox Test

1. Use PayPal Sandbox test accounts:
   - Buyer: `sb-xxxxx@personal.example.com`
   - Password: `password123`
2. Test payment flow
3. Verify webhook received
4. Verify subscription created

### Live Test (later)

1. Use real PayPal account
2. Small amount (e.g., $1.00)
3. Verify payment succeeds
4. Verify webhook received
5. Verify subscription created

## Step 6: Verify End-to-End

### Checklist

- [ ] PayPal credentials configured in Worker secrets
- [ ] Webhook endpoint created in PayPal
- [ ] Webhook ID configured in Worker
- [ ] Sandbox payment succeeds
- [ ] Webhook received
- [ ] Subscription created in database
- [ ] Payment recorded in database
- [ ] Entitlement granted
- [ ] User can access paid content

## Troubleshooting

### Webhook not received

1. Check webhook endpoint is accessible
2. Check PayPal webhook logs
3. Verify webhook ID matches
4. Check Worker logs

### Payment fails

1. Check PayPal logs
2. Check Worker logs
3. Verify API keys are correct
4. Check webhook signature verification

### Entitlement not granted

1. Check webhook processing
2. Check database records
3. Check entitlement logic
4. Verify user subscription status

## Security Notes

- **Never** commit PayPal secrets to git
- **Never** log PayPal secrets
- **Always** use environment variables
- **Always** verify webhook signatures
- **Always** use HTTPS for webhooks
- **Use Sandbox for development**

## References

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Webhooks Documentation](https://developer.paypal.com/docs/api/webhooks/)
- [PayPal SDK Documentation](https://github.com/paypal/Checkout-NodeJS-SDK)
