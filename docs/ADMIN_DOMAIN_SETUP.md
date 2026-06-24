# Admin Domain Setup Guide

## Overview

This guide documents the setup of the dedicated admin domain `admin.hamicodeviet.com` for the HaMi Code Việt platform.

## Prerequisites

- Cloudflare account access
- hamicodeviet.com zone access
- Admin Pages project

## Step 1: Create Admin Pages Project

### Using Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Navigate to Workers & Pages
3. Click "Create application"
4. Select "Pages"
5. Name: `hamicodeviet-admin`
6. Build output: `app/dist` (reuse existing app build)
7. Branch: `main`
8. Create project

### Using Wrangler CLI

```bash
cd app
npx wrangler pages project create hamicodeviet-admin --production-branch main
```

## Step 2: Configure Custom Domain

### Using Cloudflare Dashboard

1. Go to Workers & Pages → hamicodeviet-admin
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter: `admin.hamicodeviet.com`
5. Click "Continue"
6. Verify DNS records (Cloudflare will add CNAME)
7. Wait for SSL certificate (usually 1-5 minutes)

### Using Wrangler CLI

```bash
npx wrangler pages domain create admin.hamicodeviet.com --project-name hamicodeviet-admin
```

## Step 3: Configure DNS Records

### CNAME Record

```
Type: CNAME
Name: admin
Content: hamicodeviet-admin.pages.dev
Proxy: Yes
```

### Verification

```bash
# Check DNS propagation
dig admin.hamicodeviet.com
```

## Step 4: Configure Noindex

### Using Cloudflare Page Rules

1. Go to hamicodeviet.com zone
2. Navigate to Rules → Page Rules
3. Create page rule:
   - URL: `admin.hamicodeviet.com/*`
   - Setting: "Disable indexing"
   - Value: "On"

### Using _headers File

Create `app/public/_headers`:

```
/admin/*
  X-Robots-Tag: noindex
  X-Robots-Tag: nofollow
```

## Step 5: Configure Security Headers

### Using Cloudflare Page Rules

1. Go to hamicodeviet.com zone
2. Navigate to Rules → Page Rules
3. Create page rule:
   - URL: `admin.hamicodeviet.com/*`
   - Setting: "SSL"
   - Value: "Full (Strict)"
   - Setting: "Browser Integrity Check"
   - Value: "On"

### Using _headers File

Add to `app/public/_headers`:

```
/admin/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Step 6: Deploy Admin Application

### Build Admin Pages

```bash
cd app
npm run build
```

### Deploy to Admin Project

```bash
npx wrangler pages deploy dist --project-name hamicodeviet-admin --branch main
```

### Configure Build Command (Optional)

Add to `wrangler.toml`:

```toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

## Step 7: Configure Access Control

### IP Whitelist (Optional)

### Using Cloudflare Access

1. Go to hamicodeviet.com zone
2. Navigate to Zero Trust → Access
3. Create Access policy:
   - Application: `admin.hamicodeviet.com`
   - Policy type: "Allow"
   - Include: Email addresses
   - Add admin emails

### Using Cloudflare WAF

1. Go to hamicodeviet.com zone
2. Navigate to Security → WAF
3. Create custom rule:
   - Field: URI Path
   - Operator: contains
   - Value: `/admin`
   - Action: Block
   - Exception: IP in list (add admin IPs)

## Step 8: Configure Short Session Duration

### Update Session Expiry

Modify `api/src/lib/auth.ts`:

```typescript
// Admin sessions: 1 hour
const ADMIN_SESSION_DURATION = 60 * 60; // 1 hour
const USER_SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days

export async function createSession(
  env: Env,
  userId: string,
  ip: string | null,
  userAgent: string | null,
  isAdmin: boolean = false
) {
  const duration = isAdmin ? ADMIN_SESSION_DURATION : USER_SESSION_DURATION;
  const expiresAt = new Date(Date.now() + duration * 1000);
  
  // ... rest of function
}
```

## Step 9: Configure Re-authentication

### Sensitive Actions Require Re-auth

Add re-auth middleware:

```typescript
export function requireReauth() {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    const lastAuth = c.req.header('x-last-auth');
    
    // Require re-auth if last auth > 5 minutes ago
    if (lastAuth && Date.now() - parseInt(lastAuth) > 5 * 60 * 1000) {
      return c.json({ error: 'reauth_required' }, 401);
    }
    
    await next();
  };
}
```

Apply to sensitive routes:

```typescript
admin.put('/users/:id/status', requireReauth(), async (c) => {
  // ... route handler
});
```

## Step 10: Verify Deployment

### Test Admin Domain

```bash
# Test admin domain
curl https://admin.hamicodeviet.com

# Test admin login
curl https://admin.hamicodeviet.com/login

# Test admin API
curl https://api.hamicodeviet.com/admin/stats
```

### Check Headers

```bash
# Check security headers
curl -I https://admin.hamicodeviet.com

# Check robots tag
curl -I https://admin.hamicodeviet.com | grep robots
```

### Check DNS

```bash
# Check DNS resolution
nslookup admin.hamicodeviet.com

# Check SSL
curl -v https://admin.hamicodeviet.com
```

## Troubleshooting

### Domain Not Resolving

1. Check DNS records
2. Verify CNAME is correct
3. Check DNS propagation
4. Clear local DNS cache

### SSL Certificate Not Issuing

1. Wait 5-10 minutes for Cloudflare
2. Check DNS records are correct
3. Verify domain ownership
4. Check Cloudflare SSL/TLS settings

### 404 Errors

1. Verify Pages project is deployed
2. Check build output directory
3. Verify custom domain is configured
4. Check branch name matches

### Access Denied

1. Check Access policy configuration
2. Verify IP whitelist
3. Check WAF rules
4. Check firewall settings

## Security Checklist

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Noindex configured
- [ ] Security headers configured
- [ ] Access control configured (optional)
- [ ] Short session duration configured
- [ ] Re-authentication for sensitive actions
- [ ] Audit logging enabled
- [ ] IP/risk logging enabled
- [ ] Admin role required
- [ ] MFA configured (future)

## References

- [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Access documentation](https://developers.cloudflare.com/cloudflare-one/)
- [Cloudflare WAF documentation](https://developers.cloudflare.com/waf/)
- [Security headers reference](https://owasp.org/www-project-secure-headers/)
