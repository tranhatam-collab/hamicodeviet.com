# QA, SECURITY VÀ GO-LIVE

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Release verdict

Chỉ sử dụng một trong bốn trạng thái:

- **PASS - GO-LIVE VERIFIED**
- **CONDITIONAL PASS - CORE LIVE, RESTRICTED MODULES DISABLED**
- **HOLD - NOT READY FOR GO-LIVE**
- **FAIL - CRITICAL BLOCKERS**

Không dùng “all green” nếu còn feature chưa xác minh.

## 2. Release gates

| Gate | Điều kiện tối thiểu |
|---|---|
| Product | Không placeholder; routes và CTA chính hoạt động; content MVP đầy đủ |
| Functional | Core E2E pass; auth, guardian, learning và public modules pass |
| Security | 0 P0; 0 unresolved P1; authorization/secret/dependency tests pass |
| Child Safety | Consent, privacy default, report abuse, AI restriction pass |
| Data Protection | Policy versioning, export/delete, retention và incident flow |
| Accessibility | Automated + keyboard + screen reader sample; no blocker |
| Performance | Core Web Vitals đo được; không regression nghiêm trọng |
| SEO | Canonical, hreflang, sitemap, robots, noindex private routes |
| Operations | Monitoring, alerts, backup, restore test, runbook, rollback |
| Production Evidence | URL, SHA, deployment ID, timestamp, live tests, screenshots |

## 3. Critical E2E flows

1. Adult signup/login/logout/recovery.
2. Child/teen signup → guardian invite → consent → activation.
3. Language switch, free lesson, progress.
4. Create/run/save/submit project.
5. Parent views progress and privacy settings.
6. Purchase → webhook → entitlement → cancel/refund.
7. Teacher class/assignment/review.
8. Portfolio privacy and certificate verify.
9. AI quota, provider failure, policy refusal.
10. Data export/delete.
11. Admin audit and unauthorized access rejection.
12. Marketplace submit/review/sale/refund khi feature bật.

## 4. Security tests

- OWASP Top 10/ASVS-aligned review.
- SAST, dependency, secret and container scan.
- IDOR/BOLA across every resource.
- XSS, CSRF, SQLi, SSRF, upload, path traversal.
- Rate limit, brute force, session fixation, token revocation.
- Webhook signature/idempotency/replay.
- Sandbox escape/resource exhaustion/network exfiltration.

## 5. Performance budgets

- LCP mục tiêu ≤ 2,5s ở điều kiện đại diện.
- CLS ≤ 0,1.
- INP ≤ 200ms khi khả thi.
- Route and API budgets được đo theo percentile.
- Bundle, image, font, cache và database query budgets.

Không che giấu route chưa đạt; ghi route, kết quả, nguyên nhân và remediation.

## 6. QA fix loop

Issue → classify P0-P3 → reproduce → root cause → regression test → fix → local test → full regression → preview verify → merge → production deploy → live verify → evidence → close.

## 7. Production Evidence Packet

Bắt buộc ghi:

- Repository, branch, commit SHA.
- Deployment ID/time/URL.
- Domain/DNS/SSL.
- Build/test/security/accessibility/performance summary.
- Database migration version.
- Core live flow results.
- Screenshots desktop/mobile.
- Feature flags and disabled modules.
- Known limitations and accepted risks.
- Rollback procedure và release owner.
