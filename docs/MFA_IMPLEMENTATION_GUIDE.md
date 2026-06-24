# MFA Implementation Guide

## Overview

This guide documents the implementation of Multi-Factor Authentication (MFA) for admin accounts in the HaMi Code Việt platform.

## Approach

For Cloudflare Workers environment, we'll use TOTP (Time-based One-Time Password) as the MFA method, compatible with Google Authenticator, Authy, and other authenticator apps.

## Prerequisites

- TOTP library (compatible with Cloudflare Workers)
- Admin accounts already have admin role
- User device for authenticator app

## Implementation

### 1. Install TOTP Library

```bash
cd api
npm install otpauth
```

### 2. Create MFA Tables

```javascript
// migrations/20240624000004_add_mfa.js
exports.up = (pgm) => {
  pgm.createTable('mfa_secrets', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    secret: {
      type: 'text',
      notNull: true,
    },
    enabled: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    backup_codes: {
      type: 'text[]',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('mfa_secrets');
};
```

### 3. Create MFA API Routes

```typescript
// routes/mfa.ts
import { Hono } from 'hono';
import { authenticator } from 'otplib/authenticator';
import { randomBytes } from 'crypto';

const mfa = new Hono<AppBindings>();

// Generate TOTP secret
mfa.post('/setup', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  // Generate secret
  const secret = authenticator.generateSecret();
  const backupCodes = Array.from({ length: 10 }, () =>
    randomBytes(4).toString('hex')
  );

  // Store in database
  await sql`
    INSERT INTO mfa_secrets (user_id, secret, backup_codes)
    VALUES (${user.id}, ${secret}, ${backupCodes})
    ON CONFLICT (user_id) DO UPDATE SET
      secret = ${secret},
      backup_codes = ${backup_codes}
  `;

  // Generate QR code URL
  const issuer = 'HaMi Code Viet';
  const account = user.email;
  const otpauthUrl = authenticator.keyuri(account, issuer, secret);

  return c.json({
    secret,
    otpauthUrl,
    backupCodes,
  });
});

// Verify TOTP code
mfa.post('/verify', async (c) => {
  const user = c.get('user') as any;
  const body = await c.req.json();
  const { code } = body;
  const sql = getDb(c.env);

  const [mfaData] = await sql`
    SELECT secret, backup_codes FROM mfa_secrets WHERE user_id = ${user.id}
  `;

  if (!mfaData) {
    return c.json({ error: 'mfa_not_setup' }, 400);
  }

  // Verify TOTP code
  const isValid = authenticator.verify({
    token: code,
    secret: mfaData.secret,
  });

  if (isValid) {
    // Enable MFA
    await sql`
      UPDATE mfa_secrets
      SET enabled = true, verified = true
      WHERE user_id = ${user.id}
    `;
    return c.json({ success: true });
  }

  // Check backup codes
  if (mfaData.backup_codes.includes(code)) {
    // Remove used backup code
    const remainingCodes = mfaData.backup_codes.filter((c: string) => c !== code);
    await sql`
      UPDATE mfa_secrets
      SET backup_codes = ${remainingCodes}
      WHERE user_id = ${user.id}
    `;
    return c.json({ success: true, method: 'backup_code' });
  }

  return c.json({ error: 'invalid_code' }, 400);
});

// Disable MFA
mfa.post('/disable', async (c) => {
  const user = c.get('user') as any;
  const sql = getDb(c.env);

  await sql`
    UPDATE mfa_secrets
    SET enabled = false
    WHERE user_id = ${user.id}
  `;

  return c.json({ success: true });
});

export default mfa;
```

### 4. Add MFA to Admin Middleware

```typescript
// lib/mfa.ts
export async function requireMFA(env: any, userId: string): Promise<boolean> {
  const sql = env.DB;
  const [mfaData] = await sql`
    SELECT enabled FROM mfa_secrets WHERE user_id = ${userId}
  `;

  return mfaData?.enabled || false;
}

// Middleware
export function mfaMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    // Check if user has MFA enabled
    const mfaEnabled = await requireMFA(c.env, user.id);
    
    if (mfaEnabled) {
      const mfaCode = c.req.header('x-mfa-code');
      
      if (!mfaCode) {
        return c.json({ error: 'mfa_required' }, 401);
      }

      // Verify MFA code
      const valid = await verifyMFACode(c.env, user.id, mfaCode);
      
      if (!valid) {
        return c.json({ error: 'invalid_mfa_code' }, 401);
      }
    }

    await next();
  };
}
```

### 5. Integrate MFA into Admin Routes

```typescript
// routes/admin.ts
import { mfaMiddleware } from '../lib/mfa';

admin.use('*', mfaMiddleware());
```

## Client-Side Implementation

### QR Code Generation

```typescript
// app/src/lib/mfa.ts
import QRCode from 'qrcode';

export function generateQRCode(otpauthUrl: string): string {
  return QRCode.toDataURL(otpauthUrl);
}
```

### MFA Setup Flow

1. User goes to admin settings
2. User clicks "Enable MFA"
3. Backend generates secret and QR code
4. User scans QR code with authenticator app
5. User enters TOTP code to verify
6. MFA enabled for account

### MFA Login Flow

1. User enters email/password
2. Backend validates credentials
3. Backend checks if MFA enabled
4. If enabled, prompt for MFA code
5. User enters MFA code
6. Backend verifies code
7. User logged in

## Security Considerations

### Secret Storage

- Store secrets encrypted in database
- Use environment variable for encryption key
- Never log secrets

### Backup Codes

- Generate 10 backup codes
- Display only once during setup
- Allow regeneration (invalidates old codes)
- Track used codes

### Rate Limiting

- Limit MFA verification attempts
- 5 attempts per 5 minutes
- Lock account after failed attempts

### Recovery

- Allow backup codes for recovery
- Require re-authentication to disable MFA
- Email backup codes to user (optional)

## Testing

### Test TOTP Generation

```typescript
import { authenticator } from 'otplib/authenticator';

const secret = authenticator.generateSecret();
const token = authenticator.generate(secret);
console.log(token); // 6-digit code
```

### Test Verification

```typescript
const isValid = authenticator.verify({
  token: '123456',
  secret: 'JBSWY3DPEHPK3PXP',
});

console.log(isValid); // true or false
```

## Rollback Plan

If MFA causes issues:

1. Disable MFA for specific users via database
2. Remove MFA middleware temporarily
3. Allow password-only login
4. Investigate and fix issues
5. Re-enable MFA

## References

- [otplib documentation](https://github.com/yeqown/google-authenticator/wiki/Key-Uri-Format)
- [Cloudflare Workers limitations](https://developers.cloudflare.com/workers/platform/limits/)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
