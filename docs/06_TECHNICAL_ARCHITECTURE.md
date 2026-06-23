# KIẾN TRÚC KỸ THUẬT

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Kiến trúc tham chiếu

Nền tảng chia thành các lớp:

1. Web/PWA frontend.
2. API/BFF.
3. Identity, session, RBAC và guardian relation.
4. LMS/curriculum.
5. Project, portfolio và assessment.
6. CodeLab/sandbox.
7. AI orchestration.
8. Payment/entitlement.
9. Marketplace/moderation.
10. Notification/email.
11. Audit/compliance.
12. Analytics/observability.
13. Admin/operations.

Kiến trúc phải module hóa, có feature flag và không khóa cứng vào một cloud hoặc AI provider nếu không cần thiết.

## 2. Data domains

- Identity: users, profiles, roles, permissions, sessions.
- Guardian: guardian_links, consents, consent_versions.
- Learning: paths, courses, modules, lessons, objects, enrollments, progress.
- Projects: projects, versions, submissions, artifacts, tests.
- Assessment: assessments, rubrics, reviews, certificates.
- Commerce: plans, prices, subscriptions, orders, payments, refunds, entitlements.
- Marketplace: creators, products, licenses, files, sales, payouts, disputes.
- School: organizations, schools, classrooms, memberships, assignments.
- Trust: reports, moderation_cases, sanctions, audit_logs.
- AI: sessions, requests, usage, prompt_versions, eval_results.
- Privacy: exports, deletions, retention_jobs, breach_records.

## 3. Data rules

- Public IDs không tuần tự.
- UTC timestamps; locale chỉ cho presentation.
- Password hashing chuẩn; không tự thiết kế crypto.
- PII tách và least privilege.
- Không log token, password, payment data hoặc full child content.
- Audit log append-only trong phạm vi kỹ thuật khả thi.
- Migration versioned, có backup và rollback/forward plan.
- Seed data không chứa dữ liệu cá nhân thật.

## 4. Auth/RBAC

Roles: Learner, Guardian, Teacher, Mentor, Reviewer, Creator, School Admin, Support, Compliance, Platform Admin.

Authorization phải kiểm tra ở server cho từng resource; không tin frontend route guards. Bắt buộc test IDOR/BOLA cho learner, guardian, class, project, payment, portfolio, certificate, product và admin actions.

## 5. Code sandbox

- Isolated runtime/container/worker.
- CPU/RAM/time limits.
- Network denied by default.
- No host filesystem or secret access.
- Disposable environment.
- Queue, concurrency and abuse limits.
- Malware/dependency scan.
- Output sanitization, iframe sandbox và CSP.

Test infinite loop, fork bomb, memory exhaustion, mining, network exfiltration, filesystem access, XSS và malicious package.

## 6. Payment architecture

- Prices cấu hình trong database.
- Checkout server-created.
- Entitlement chỉ cấp sau webhook/server verification.
- Webhook signature, idempotency và replay protection.
- Subscription state machine: pending, active, past_due, paused, canceled, expired, refunded, disputed.
- Reconciliation, invoice, refund, cancellation và failed-payment recovery.

## 7. Environments và CI/CD

Tách local, test, preview, staging, production; tách database, secrets, payment mode, email, AI quota và analytics.

PR pipeline: install → lint → typecheck → unit → component → build → security scan → preview → E2E core.

Production pipeline: backup → migration check → deploy → health check → smoke test → critical E2E → monitoring check → release note → rollback nếu thất bại.

## 8. Observability

- Uptime, structured logs, request IDs, errors, metrics, traces khi phù hợp.
- Health cho auth, database, queue, email, payment webhooks, AI gateway, sandbox.
- Status page không lộ hạ tầng nhạy cảm.
- Runbook cho site down, auth, payment, email, AI, sandbox, breach và rollback.

## 9. API groups đề xuất

- `/api/auth/*`
- `/api/guardians/*`
- `/api/consents/*`
- `/api/learning/*`
- `/api/courses/*`
- `/api/lessons/*`
- `/api/projects/*`
- `/api/assessments/*`
- `/api/portfolio/*`
- `/api/ai/*`
- `/api/codelab/*`
- `/api/payments/*`
- `/api/subscriptions/*`
- `/api/marketplace/*`
- `/api/moderation/*`
- `/api/schools/*`
- `/api/privacy/*`
- `/api/admin/*`

Mỗi endpoint phải có auth requirement, request/response schema, rate limit, error contract và audit requirement.
