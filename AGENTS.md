# HaMi Code Việt

Nền tảng giáo dục công nghệ song ngữ Việt–Anh dành cho người học 8–24 tuổi.

## Architecture (Monorepo)

```
hamicodeviet.com/        # Public website (Astro static)
  src/                   # Pages, components, layouts, data
  dist/                  # Build output
  public/                # Static assets, _headers

api/                     # Backend API (Cloudflare Workers + Hono)
  src/
    index.ts             # App entry, CORS, routes
    routes/auth.ts       # Signup, login, verify-email, password reset
    routes/guardian.ts   # Guardian links, approve/revoke
    routes/consent.ts    # Consent management
    lib/db.ts            # Neon serverless driver
    lib/password.ts      # PBKDF2 password hashing (Web Crypto)
    lib/jwt.ts           # JWT sign/verify (HMAC-SHA256)
    lib/email.ts         # Email via mail.iai.one
  wrangler.toml          # Worker config, routes

app/                     # User learning app (Astro static)
  src/
    pages/               # login, signup, dashboard, verify-email, reset-password
    layouts/             # AppLayout.astro
    lib/api.ts           # API client (fetch wrapper, token management)
    styles/global.css    # App styles
  dist/                  # Build output
```

## Stack

- **Public site**: Astro v4 static, Cloudflare Pages
- **App**: Astro v4 static (client-side auth), Cloudflare Pages
- **API**: Hono on Cloudflare Workers
- **Database**: Neon PostgreSQL (serverless)
- **Auth**: Custom JWT + PBKDF2 (Web Crypto API), session-based
- **Email**: mail.iai.one (transactional)
- **Styling**: Custom CSS với CSS variables

## Dev commands

### Public website (root)
```bash
npm run dev       # Local dev server
npm run build     # Build static
npm run deploy    # Build + deploy lên Cloudflare Pages
```

### API (api/)
```bash
cd api
npm run dev       # Local dev (wrangler dev)
npm run deploy    # Deploy to Cloudflare Workers
```

### App (app/)
```bash
cd app
npm run dev       # Local dev server
npm run build     # Build static
# Deploy: CLOUDFLARE_ACCOUNT_ID=93112cc... npx wrangler pages deploy dist --project-name hamicodeviet-app --branch main
```

## Deploy targets

| Component | Platform | Project | URL |
|-----------|----------|---------|-----|
| Public site | Cloudflare Pages | hamicodeviet-com | hamicodeviet.com |
| App | Cloudflare Pages | hamicodeviet-app | app.hamicodeviet.com |
| API | Cloudflare Workers | hamicodeviet-api | api.hamicodeviet.com |

Account Cloudflare: Tranhatam66@gmail.com (ID: 93112cc89181e75335cbd7ef7e392ba3)
Zone: hamicodeviet.com (ID: 2ee52b49c6e7b62964623e7d6e62058c)

## Database

Neon project: blue-thunder-03199745
Connection: .env.neon (gitignored)
Tables: users, profiles, roles, user_roles, sessions, email_verifications, password_resets, guardians, guardian_links, policy_versions, consents

## Auth flow

1. Signup → tạo user + profile + role + email verification token + session
2. Login → verify password + tạo session
3. Verify email → mark email_verified
4. Forgot password → send reset token
5. Reset password → update password + revoke all sessions
6. Guardian flow → tạo guardian + link (pending) → guardian approves

## Brand

- Primary: `#00A8CC` (tech blue)
- Navy: `#102A43`
- Yellow: `#FFC857` (creative)
- Green: `#20A779` (success)
- Bg dark: `#081826`
- Bg light: `#F7FAFC`

## Nhà sáng lập

Trần Đỗ Hà Mi — Nền tảng Giáo dục Công nghệ Song ngữ HaMi Code Việt
Đơn vị bảo trợ: Công ty TNHH Đầu tư Thương mại Thành Tâm Phát
