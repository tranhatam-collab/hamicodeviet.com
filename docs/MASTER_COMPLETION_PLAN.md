# KẾ HOẠCH HOÀN THIỆN TOÀN BỘ NỀN TẢNG — KHÔNG ĐỂ TRỐNG

**Ngày lập:** 29/06/2026
**Mục tiêu:** Hoàn thiện 100% mọi feature trên web — không còn placeholder, không còn "đang xây dựng", không còn stub.

---

## TỔNG QUAN AUDIT

### Hiện trạng (đã verify)

| Khu vực | Tổng | Hoàn thiện | Trống/Stub |
|---|---|---|---|
| API endpoints | 87 | 82 | 5 stub/demo |
| Public pages | 24 | 20 | 2 "đang xây dựng" + 2 form tắt |
| App pages | 18 | 18 | 0 (nhưng thiếu nhiều trang feature) |
| DB tables | 49 | 49 | 1 table referenced nhưng không có migration (ai_usage) |
| Lib modules | 12 | 12 | 0 stub |

### 5 API endpoints STUB/DEMO cần fix

| # | File | Endpoint | Vấn đề |
|---|---|---|---|
| 1 | codelab.ts:94 | POST /codelab/exercises/:id/submit | Không chạy code, trả "pending" |
| 2 | guardian.ts:171 | POST /guardian/verify | Chấp nhận mọi mã 6 số |
| 3 | marketplace.ts:120 | POST /marketplace/listings/:id/purchase | Không xử lý payment |
| 4 | payments.ts:55 | POST /payments/checkout | Demo mode fallback |
| 5 | refunds.ts:126 | POST /refunds/:id/approve | Demo mode fallback |

### 4 Public pages TRỐNG/CẬT

| # | Page | Vấn đề |
|---|---|---|
| 1 | marketplace/index.astro | "Đang xây dựng — Ra mắt Q4 2026" |
| 2 | codelab/index.astro | "Đang xây dựng — Ra mắt Q3 2026" |
| 3 | lien-he/index.astro | Form liên hệ bị disable |
| 4 | giao-vien/index.astro | Form đăng ký giáo viên bị disable |
| (5) | portfolio/index.astro | "In development" |

### App pages THIẾU hoàn toàn (API có nhưng không có UI)

| # | Feature | API có | UI app |
|---|---|---|---|
| 1 | CodeLab | ✅ 4 endpoints | ❌ Không có trang |
| 2 | Marketplace | ✅ 8 endpoints | ❌ Không có trang |
| 3 | School | ✅ 9 endpoints | ❌ Không có trang |
| 4 | AI Chat | ✅ 7 endpoints | ❌ Không có trang |
| 5 | Portfolio | ❌ | ❌ Không có |
| 6 | Certificates | ❌ | ❌ Không có |
| 7 | Refunds | ✅ 5 endpoints | ❌ Không có trang user |
| 8 | GDPR | ✅ 4 endpoints | ❌ Không có trang user |

---

## KẾ HOẠCH 7 GIAI ĐOẠN — BUILD TẤT CẢ

### GIAI ĐOẠN 1 — Fix API stubs + DB (CORE FIX)

**Mục tiêu:** Mọi API endpoint hoạt động thật, không còn stub.

| Task | Chi tiết | Files |
|---|---|---|
| 1.1 Fix guardian verify | Lưu verification code vào DB khi declare, verify against code thật, gửi email code qua Resend | guardian.ts, email.ts |
| 1.2 Fix CodeLab submit | Implement code runner bằng WebAssembly (Pyodide cho Python, QuickJS cho JS) — chạy trong Worker, không cần Docker | codelab.ts, lib/runner.ts (mới) |
| 1.3 Fix marketplace purchase | Tích hợp PayPal checkout cho marketplace (tạo order → capture → tạo purchase record) | marketplace.ts, lib/paypal.ts |
| 1.4 Fix payments demo mode | Xóa demo fallback, bắt buộc PayPal credentials (đã có Live keys) | payments.ts |
| 1.5 Fix refunds demo mode | Xóa demo fallback, gọi PayPal refund API thật | refunds.ts, lib/paypal.ts |
| 1.6 Tạo ai_usage migration | Migration mới cho ai_usage table (user_id, tokens_used, model, created_at) | migrations/20240624000013_add_ai_usage.cjs |
| 1.7 Seed data Marketplace | 5-10 listings mẫu (templates, lesson packs) | scripts/seed-marketplace.cjs |
| 1.8 Seed data School | 1 school mẫu + 2 classes + 3 assignments | scripts/seed-school.cjs |

**Exit gate:** 87/87 endpoints hoạt động thật, 0 stub, 0 demo mode.

---

### GIAI ĐOẠN 2 — Public pages hoàn thiện

**Mục tiêu:** Không còn trang "đang xây dựng" trên public site.

| Task | Chi tiết | Files |
|---|---|---|
| 2.1 CodeLab public page | Thay "đang xây dựng" bằng trang giới thiệu CodeLab thật — editor preview, danh sách exercises, CTA vào app | src/pages/codelab/index.astro |
| 2.2 Marketplace public page | Thay "đang xây dựng" bằng trang marketplace thật — grid listings, filter, search, detail | src/pages/marketplace/index.astro, src/pages/marketplace/[id].astro |
| 2.3 Contact form | Enable form, POST tới API endpoint mới /contact (lưu vào DB + email notify) | src/pages/lien-he/index.astro, api/src/routes/contact.ts (mới) |
| 2.4 Teacher registration | Enable form, POST tới /auth/signup với role=teacher + tạo teacher application record | src/pages/giao-vien/index.astro |
| 2.5 Portfolio public page | Thay "in development" bằng trang giải thích portfolio + verify certificate | src/pages/portfolio/index.astro |
| 2.6 Status page | Tạo /status page hiển thị health check các services | src/pages/status/index.astro |

**Exit gate:** 0 trang "đang xây dựng", 0 form disabled, 26/26 public pages complete.

---

### GIAI ĐOẠN 3 — App pages: CodeLab + AI Chat

**Mục tiêu:** User có thể dùng CodeLab và AI trong app.

| Task | Chi tiết | Files |
|---|---|---|
| 3.1 App CodeLab page | Danh sách exercises, chọn exercise → editor (Monaco hoặc CodeMirror) + console output + submit | app/src/pages/codelab.astro, app/src/pages/codelab/[slug].astro |
| 3.2 CodeLab editor component | CodeMirror 6 (lightweight, chạy client-side), syntax highlight Python/JS, autosave | app/src/components/CodeEditor.astro (mới) |
| 3.3 CodeLab result display | Hiển thị test results (pass/fail per test case), output console | app/src/pages/codelab/[slug].astro |
| 3.4 App AI Chat page | Chat UI — chọn agent → conversation → message list + input | app/src/pages/ai.astro, app/src/pages/ai/[id].astro |
| 3.5 AI agent selection | Dropdown/grid chọn 11 agents (Tutor, Code Coach, etc.) | app/src/components/AgentSelector.astro |

**Exit gate:** CodeLab + AI chat hoạt động end-to-end trong app.

---

### GIAI ĐOẠN 4 — App pages: Marketplace + School

**Mục tiêu:** User có thể mua marketplace và dùng school features.

| Task | Chi tiết | Files |
|---|---|---|
| 4.1 App Marketplace listing | Grid listings + filter + search + detail page | app/src/pages/marketplace.astro, app/src/pages/marketplace/[id].astro |
| 4.2 Marketplace purchase flow | Detail → buy button → PayPal checkout → purchase record → download/access | app/src/pages/marketplace/[id].astro |
| 4.3 Marketplace my-listings | Creator dashboard — list, create, edit listings | app/src/pages/marketplace/sell.astro |
| 4.4 Marketplace my-purchases | Buyer dashboard — purchased items list | app/src/pages/marketplace/purchases.astro |
| 4.5 App School dashboard | School admin view — stats, classes, members | app/src/pages/school.astro |
| 4.6 School classes | Class list + create + detail | app/src/pages/school/classes.astro, app/src/pages/school/classes/[id].astro |
| 4.7 School assignments | Assignment list + create + submission view | app/src/pages/school/assignments.astro |
| 4.8 School enrollments | Enroll students, view roster | app/src/pages/school/classes/[id].astro |

**Exit gate:** Marketplace + School hoạt động end-to-end trong app.

---

### GIAI ĐOẠN 5 — App pages: Portfolio + Certificates + Refunds + GDPR

**Mục tiêu:** Đầy đủ user-facing features.

| Task | Chi tiết | Files |
|---|---|---|
| 5.1 Portfolio API | Migration + routes — projects, privacy levels, evidence | migrations/20240624000014_add_portfolio.cjs, api/src/routes/portfolio.ts |
| 5.2 App Portfolio page | List projects, create, set privacy, upload evidence | app/src/pages/portfolio.astro, app/src/pages/portfolio/[id].astro |
| 5.3 Certificate API | Migration + routes — generate certificate ID, QR verify endpoint | migrations/20240624000015_add_certificates.cjs, api/src/routes/certificates.ts |
| 5.4 App Certificates page | List certificates, verify page (public QR scan) | app/src/pages/certificates.astro, src/pages/verify/[id].astro |
| 5.5 App Refunds page | User view — request refund, history | app/src/pages/refunds.astro |
| 5.6 App GDPR page | Data export button, deletion request flow | app/src/pages/privacy.astro |

**Exit gate:** Portfolio + Certificates + Refunds + GDPR có UI đầy đủ.

---

### GIAI ĐOẠN 6 — AI: 11 Agents đầy đủ

**Mục tiêu:** Không chỉ basic chat — 11 specialized agents hoạt động.

| Task | Chi tiết | Files |
|---|---|---|
| 6.1 Agent registry | Seed 11 agents vào ai_agents table với system prompts riêng | scripts/seed-ai-agents.cjs |
| 6.2 Tutor Agent | Giải thích bài học song ngữ Việt-Anh | system prompt + route logic |
| 6.3 Code Coach Agent | Gợi ý fix code, không làm thay | system prompt + route logic |
| 6.4 Code Reviewer Agent | Lint, security hints | system prompt + route logic |
| 6.5 Assessment Agent | Chấm điểm theo rubric | system prompt + route logic |
| 6.6 Curriculum Planner | Gợi ý lộ trình học | system prompt + route logic |
| 6.7 Project Planner | Chia project thành steps | system prompt + route logic |
| 6.8 Safety Guardian | Moderation, age policy enforcement | system prompt + route logic |
| 6.9 Parent Report Agent | Tóm tắt tiến độ cho phụ huynh | system prompt + route logic |
| 6.10 Teacher Copilot | Lesson plan, assignment draft | system prompt + route logic |
| 6.11 Marketplace Reviewer | Scan listings (claims, code, license) | system prompt + route logic |
| 6.12 Quota + cost tracking | Per-user quota, cost dashboard, kill switch | ai.ts, lib/ai-quota.ts |

**Exit gate:** 11 agents hoạt động, quota + kill switch có.

---

### GIAI ĐOẠN 7 — Production hardening + CD

**Mục tiêu:** Deploy tự động, monitoring, không manual.

| Task | Chi tiết | Files |
|---|---|---|
| 7.1 CD Pipeline | GitHub Actions: build → test → deploy 3 targets (public, app, API) | .github/workflows/deploy.yml |
| 7.2 Migration check | CI check: migration files vs DB state | .github/workflows/ci.yml |
| 7.3 Notification system | Email notifications (course complete, payment, guardian) — qua Queue có sẵn | api/src/routes/notifications.ts, lib/notifications.ts |
| 7.4 Feature flags | Simple DB-based feature flags + middleware | migrations/20240624000016_add_feature_flags.cjs, lib/featureFlags.ts |
| 7.5 Status dashboard | Public /status page với health checks | src/pages/status/index.astro |
| 7.6 Final smoke test | E2E test toàn bộ user journeys (6 journeys từ PRD) | api/test/e2e.test.ts |
| 7.7 Build + deploy | Build 3 targets, deploy lên Cloudflare, verify production | — |

**Exit gate:** CD pipeline xanh, production verified, 0 placeholder trên web.

---

## TỔNG KẾT

| Giai đoạn | Tasks | Output |
|---|---|---|
| 1. Fix API stubs + DB | 8 | 87/87 endpoints thật |
| 2. Public pages | 6 | 26/26 pages complete |
| 3. App CodeLab + AI | 5 | CodeLab + AI chat UI |
| 4. App Marketplace + School | 8 | Marketplace + School UI |
| 5. Portfolio + Cert + Refunds + GDPR | 6 | User features đầy đủ |
| 6. AI 11 Agents | 12 | 11 specialized agents |
| 7. Production + CD | 7 | Auto-deploy, monitoring |
| **TỔNG** | **52 tasks** | **100% complete** |

## THỨ TỰ ƯU TIÊN

```
GĐ1 (API fixes) → GĐ2 (Public) → GĐ3 (CodeLab+AI app) → GĐ4 (Market+School app)
                                                              ↓
GĐ7 (CD) ← GĐ6 (11 Agents) ← GĐ5 (Portfolio+Cert)
```

GĐ1 và GĐ2 là foundation — phải xong trước. GĐ3-6 có thể song song. GĐ7 cuối cùng.

## RỦI RO + LƯU Ý

1. **CodeLab runner**: WebAssembly (Pyodide ~10MB, QuickJS ~1MB) chạy trong Worker — giới hạn 30s CPU, 512MB RAM. Không cần Docker.
2. **Marketplace payment**: PayPal cho marketplace cần receiver account khác (hoặc platform fee). Cần quyết định model.
3. **School data isolation**: Cần RLS (Row Level Security) ở Neon hoặc application-level filter chặt.
4. **AI cost**: 11 agents + quota — cần monitor token usage chặt để không vượt budget.
5. **Certificate verify**: Cần QR code generation (qrcode lib) + public verify endpoint không cần auth.
