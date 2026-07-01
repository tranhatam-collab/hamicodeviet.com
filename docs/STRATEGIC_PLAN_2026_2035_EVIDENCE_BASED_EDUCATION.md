# KẾ HOẠCH CHIẾN LƯỢC HaMi Code Việt 2026–2035

## Dựa trên báo cáo "Giáo dục tương lai mà trường lớp không thể tự mình làm được"

**Ngày lập:** 01/07/2026
**Phiên bản:** 2.0
**Tham chiếu:** Báo cáo nghiên cứu giáo dục công nghệ tương lai (UNESCO, OECD, WEF, World Bank, Nature)

---

## PHẦN A: PHÁN QUYẾT ĐIỀU HÀNH

### A.1. Định vị lại HaMi Code Việt

**Trước:** Nền tảng giáo dục công nghệ song ngữ cho người học 8-24 tuổi.

**Sau:** **Hệ sinh thái giáo dục thực chứng** — tầng giáo dục ngoài trường, liên kết nhà trường – gia đình – doanh nghiệp – chuyên gia – cộng đồng – AI – thị trường, tạo ra người học có năng lực thật, bằng chứng thật, trách nhiệm thật.

### A.2. Năm việc trường lớp không làm được — HaMi Code Việt phải làm

| # | Việc trường khó làm | HaMi Code Việt giải quyết bằng |
|---|---|---|
| 1 | Đưa người học vào tình huống thật | **Project Workshop** — dự án thật có khách hàng, deadline, rủi ro |
| 2 | Cập nhật năng lực nhanh | **CodeLab + 15 sản phẩm code** — cập nhật theo công nghệ, không theo kỳ học |
| 3 | Cá nhân hóa sâu | **AI Tutor adaptive** — 11 agents + Learning Compass theo từng người |
| 4 | Xác minh năng lực thật | **Evidence Portfolio** — 6 lớp bằng chứng, không chỉ điểm số |
| 5 | Đồng hành suốt đời | **Lifelong Competence Account** — tài khoản năng lực không đóng khi tốt nghiệp |

### A.3. Chỉ số thành công mới

**Trước:** Số sản phẩm đạt chuẩn / người học hoạt động

**Sau:** Số người học có **bằng chứng năng lực được xác minh** đang tạo giá trị kinh tế hoặc xã hội thật

---

## PHẦN B: KHOẢNG CÁCH GIỮA HIỆN TRẠNG VÀ TƯƠNG LAI

### B.1. Hiện trạng (đã deploy 30/06/2026)

| Khu vực | Đã có | Trạng thái |
|---|---|---|
| Public site | 91 trang song ngữ | Live, SEO chuẩn, JSON-LD, hreflang |
| Sản phẩm code | 15 web app thật | Live, chạy được, tải xuống được |
| AI agents | 11 agents + quota | Live, Cloudflare Workers AI |
| API | 87 endpoints, 52 bảng DB | Live, 0 TypeScript errors |
| CodeLab | Code runner + 10 exercises | Live |
| Marketplace | Listings + purchase | Live (PayPal) |
| School | 9 endpoints + UI | Live |
| Portfolio | API + UI | Live |
| Certificates | API + verification page | Live |
| App | 32 trang | Live |
| Guardian | Consent + verify | Live |
| Notifications | API + UI | Live |
| Feature Flags | API + UI | Live |
| CD Pipeline | GitHub Actions → Cloudflare | Live |

### B.2. Khoảng cách cần lấp — map theo báo cáo nghiên cứu

| Nghiên cứu yêu cầu | HaMi Code Việt hiện có | Cần xây thêm |
|---|---|---|
| Tầng 1: Nền tảng con người | ✅ 5 lộ trình, 30 bài học | Cần bổ sung: đọc-viết-tóan foundation, vận động, thiên nhiên |
| Tầng 2: Năng lực AI và số | ✅ 11 AI agents, AI literacy | Cần: AI declaration system, bias detection, fact-checking tools |
| Tầng 3: Xưởng dự án thực tế | ⚠️ CodeLab + 15 sản phẩm | Cần: **Project Workshop** — dự án thật có khách hàng, mentor, deadline |
| Tầng 4: Học nghề cùng chuyên gia | ❌ Chưa có | Cần: **Mentor Network** — chuyên gia bán thời gian, apprenticeship |
| Tầng 5: Thị trường năng lực | ⚠️ Portfolio + Certificates | Cần: **Evidence Portfolio v2** — 6 lớp bằng chứng, verification |
| Tầng 6: Học tập suốt đời | ❌ Chưa có | Cần: **Lifelong Competence Account** — tài khoản không đóng |
| Đánh giá 3 chế độ (A/B/C) | ❌ Chưa có | Cần: **Assessment Engine** — no-AI, declared-AI, with-AI |
| 12 năng lực cốt lõi | ⚠️ Code + AI only | Cần: bổ sung 8 năng lực còn lại (xem B.3) |
| Living Learning Lab | ❌ Chưa có | Cần: **Physical Lab** — Đà Lạt/Lạc Dương hoặc đối tác |
| Vietnam-specific gaps | ⚠️ Partial | Cần: 6 nhóm nhân lực AI, vùng nông thôn, tiếng Việt AI |

### B.3. 12 năng lực — map với HaMi Code Việt

| # | Năng lực (báo cáo) | HaMi Code Việt hiện có | Cần xây |
|---|---|---|---|
| 1 | Đối diện vấn đề chưa định nghĩa | ⚠️ CodeLab có challenges | **Problem Discovery Module** |
| 2 | Chịu hậu quả thật | ❌ | **Real Project Gate** — deadline, khách hàng, rủi ro |
| 3 | Tri thức ngầm & phán đoán | ❌ | **Mentor Sessions** — chuyên gia 1-on-1 |
| 4 | Hợp tác với người khác mình | ⚠️ School có nhóm | **Cross-team Projects** — đa tuổi, đa ngành |
| 5 | Tự quản trị | ⚠️ Progress tracking | **Self-Management Dashboard** — thời gian, cảm xúc, thói quen |
| 6 | Tạo giá trị kinh tế | ⚠️ Marketplace | **Startup Sandbox** — giao dịch thật quy mô nhỏ |
| 7 | Xây dựng uy tín | ⚠️ Portfolio | **Reputation Ledger** — lịch sử hành động có xác minh |
| 8 | Lựa chọn con đường sống | ❌ | **Life Path Explorer** — thử nghiệm nghề nghiệp |
| 9 | Đạo đức trong tình huống mơ hồ | ❌ | **Ethics Lab** — tranh biện, tình huống thật |
| 10 | Sống cùng tự nhiên | ❌ | **Nature-Tech Bridge** — nông nghiệp, môi trường |
| 11 | Làm việc với AI như hệ thống | ✅ 11 agents | Nâng cấp: **AI System Design Course** |
| 12 | Học lại suốt đời | ❌ | **Lifelong Learning Engine** — chẩn đoán, kế hoạch, phản hồi |

---

## PHẦN C: KIẾN TRÚC SẢN PHẨM MỚI

### C.1. Sáu tầng sản phẩm (map với 6 tầng báo cáo)

```
Tầng 6: Lifelong Competence Account (mới)
   ↕
Tầng 5: Evidence Portfolio v2 (nâng cấp)
   ↕
Tầng 4: Mentor Network + Apprenticeship (mới)
   ↕
Tầng 3: Project Workshop (mới) — xưởng dự án thực tế
   ↕
Tầng 2: AI & Digital Literacy (nâng cấp) — 11 agents + AI declaration
   ↕
Tầng 1: Foundation Learning (hiện tại) — 5 lộ trình, 30 bài học, CodeLab
```

### C.2. Chi tiết 6 sản phẩm mới cần xây

#### Sản phẩm 1: Project Workshop (Tầng 3)

**Mục tiêu:** Mỗi người học hoàn thành ít nhất 1 dự án thật/năm

**Cấu trúc:**
- 10 bước: Quan sát → Phát hiện vấn đề → Nghiên cứu → Gặp người liên quan → Đề xuất → Nguyên mẫu → Thử nghiệm → Đo kết quả → Sửa sai → Công bố
- Dự án theo lĩnh vực: nông nghiệp, du lịch, công nghệ, giáo dục, truyền thông, môi trường, sức khỏe, văn hóa, dịch vụ, kinh doanh
- Mỗi dự án có: mentor, deadline, khách hàng (thật hoặc mô phỏng cao), ngân sách, rủi ro
- AI hỗ trợ: nghiên cứu, thiết kế, phân tích — nhưng con người quyết định

**Tech:**
- DB: `projects`, `project_milestones`, `project_evidence`, `project_mentors`
- API: `/projects/*` — CRUD, submit, review, publish
- App: Project dashboard, milestone tracker, evidence uploader
- AI: Project Planner agent (đã có) + mới: Project Reviewer agent

#### Sản phẩm 2: Mentor Network (Tầng 4)

**Mục tiêu:** Mỗi người học có cơ hội làm việc với chuyên gia thật

**Cấu trúc:**
- Mentor profile: chuyên môn, kinh nghiệm, đánh giá, availability
- Matching: AI gợi ý mentor theo năng lực, mục tiêu, lịch
- Session types: quan sát (shadowing), làm nhiệm vụ nhỏ, phản hồi, tăng tự chủ
- Apprenticeship track: 4-12 tuần, có đánh giá từ mentor

**Tech:**
- DB: `mentors`, `mentor_sessions`, `apprenticeships`, `mentor_feedback`
- API: `/mentors/*` — profile, booking, session log, feedback
- App: Mentor marketplace, booking calendar, session notes
- AI: Mentor Match agent (mới)

#### Sản phẩm 3: Evidence Portfolio v2 (Tầng 5)

**Mục tiêu:** Hồ sơ năng lực có 6 lớp bằng chứng, verification

**6 lớp bằng chứng (theo báo cáo):**
1. **Hiểu** — Giải thích bằng lời của mình (video/voice)
2. **Làm** — Thực hiện nhiệm vụ (code, artifact, demo)
3. **Chuyển giao** — Làm được trong bối cảnh khác (project khác)
4. **Phản biện** — Nhận ra lỗi và giới hạn (review, critique)
5. **Trách nhiệm** — Giải trình quyết định (decision log)
6. **Tác động** — Kết quả đối với người dùng/cộng đồng (metrics, testimonials)

**Mỗi bằng chứng trả lời:**
> Ai đã làm gì, trong điều kiện nào, cho ai, với kết quả nào, được ai xác minh?

**Tech:**
- DB: `evidence`, `evidence_verification`, `evidence_reviews`
- Nâng cấp portfolio hiện tại → thêm 6 layers, verification workflow
- API: `/portfolio/evidence/*` — submit, verify, publish
- AI: Portfolio Agent (đã có) + mới: Evidence Verifier agent

#### Sản phẩm 4: Assessment Engine (Đánh giá 3 chế độ)

**Mục tiêu:** Đánh giá năng lực thật trong thời đại AI

**3 chế độ (theo báo cáo):**
- **Chế độ A — Không AI:** Kiến thức nền, suy luận độc lập, viết/tính cốt lõi
- **Chế độ B — AI có khai báo:** Công cụ, prompts, nguồn, phần AI vs human, kiểm chứng
- **Chế độ C — Làm việc cùng AI:** Workflow design, orchestration, error detection, cost management

**Tech:**
- DB: `assessments`, `assessment_modes`, `assessment_rubrics`, `assessment_results`
- API: `/assessments/*` — create, submit, grade (human + AI), verify
- App: Assessment interface (3 modes), rubric viewer, result dashboard
- AI: Assessment Agent (đã có) + mới: AI Declaration Checker

#### Sản phẩm 5: Lifelong Competence Account (Tầng 6)

**Mục tiêu:** Tài khoản năng lực không đóng khi tốt nghiệp

**Cấu trúc:**
- Competence map: năng lực hiện tại, khoảng trống, kế hoạch
- Project history: tất cả dự án suốt đời
- Micro-credentials: tích lũy, blockchain-verifiable
- Career history: vai trò, kết quả, phản hồi
- Learning plan: chẩn đoán → kế hoạch → thực hành → phản hồi
- Access: cố vấn, cộng đồng nghề nghiệp

**Tech:**
- DB: `competence_accounts`, `competence_map`, `micro_credentials`, `career_history`
- API: `/account/*` — competence map, credentials, history, plan
- App: Lifelong dashboard, competence map visualizer, credential wallet
- AI: Lifelong Learning Agent (mới) — chẩn đoán lỗ hổng, gợi ý kế hoạch

#### Sản phẩm 6: AI Declaration System

**Mục tiêu:** Minh bạch sử dụng AI trong mọi sản phẩm học tập

**Cấu trúc:**
- Mỗi bài nộp phải khai báo: công cụ AI, prompts, phần AI hỗ trợ, phần human quyết định, cách kiểm chứng
- AI Declaration Checker: xác minh khai báo có nhất quán không
- Evidence: so sánh "with AI" vs "without AI" để đo năng lực thật

**Tech:**
- DB: `ai_declarations`, `ai_usage_logs` (đã có), `ai_verification`
- API: `/declarations/*` — submit, verify, audit
- Tích hợp vào CodeLab, Project Workshop, Assessment Engine

---

## PHẦN D: LỘ TRÌNH TRIỂN KHAI 2026–2035

### D.1. Giai đoạn 1: 2026 Q3–Q4 — Thử nghiệm có kiểm soát

**Mục tiêu:** Ra mắt 3 sản phẩm mới cốt lõi, thí điểm với 100-500 người học

| Tuần | Sản phẩm | Deliverable |
|---|---|---|
| 1-4 | Project Workshop | DB + API + App UI + 5 dự án mẫu |
| 5-8 | Evidence Portfolio v2 | Nâng cấp portfolio + 6 layers + verification |
| 9-12 | Assessment Engine | 3 chế độ + rubrics + 10 bài đánh giá mẫu |
| 13-16 | AI Declaration System | Declaration form + checker + tích hợp CodeLab |
| 17-20 | Mentor Network (MVP) | Mentor profiles + booking + 10 mentors đầu tiên |
| 21-24 | Lifelong Account (MVP) | Competence map + credential wallet + dashboard |

**Kết quả Q4 2026:**
- 6 sản phẩm mới live
- 100 người học thí điểm
- 10 mentors hoạt động
- 5 dự án thật hoàn thành
- 50 evidence portfolios được xác minh

### D.2. Giai đoạn 2: 2027–2028 — Công nhận chính thức

**Mục tiêu:** Micro-credentials được công nhận, 5.000 người học, 50 mentors

**Hoạt động:**
- Công nhận tín chỉ từ dự án doanh nghiệp và cộng đồng
- Micro-credentials tích lũy vào chương trình (blockchain-verifiable)
- Chuẩn hóa hồ sơ bằng chứng năng lực
- Doanh nghiệp tham gia đánh giá
- Kỳ bảo vệ dự án công khai
- Hỗ trợ vùng nông thôn và nhóm yếu thế
- Đào tạo 100 giáo viên về sư phạm AI + kiểm chứng

**Sản phẩm mới:**
- **Startup Sandbox** — giao dịch thật quy mô nhỏ (Tầng 3 mở rộng)
- **Ethics Lab** — tranh biện, tình huống mơ hồ (12 năng lực #9)
- **Life Path Explorer** — thử nghiệm nghề nghiệp (12 năng lực #8)
- **Reputation Ledger** — lịch sử hành động có xác minh (12 năng lực #7)

**Tech:**
- Blockchain credentials (W3C Verifiable Credentials + CLR 2.0)
- VR/AR pilot cho CodeLab (metaverse education)
- AI Tutor adaptive v2 — Learning Compass 2030 integration

### D.3. Giai đoạn 3: 2029–2030 — Hệ sinh thái học tập suốt đời

**Mục tiêu:** 50.000 người học, 500 mentors, 20 đối tác doanh nghiệp, 10 trường học

**Hoạt động:**
- Mỗi công dân có tài khoản năng lực
- Đại học cung cấp dịch vụ học tập suốt đời
- Người lao động quay lại học mô-đun ngắn
- Dữ liệu năng lực thuộc quyền người học
- AI hỗ trợ đề xuất con đường học, không tự quyết định

**Sản phẩm mới:**
- **Living Learning Lab** — không gian vật lý tại Đà Lạt/Lạc Dương
- **Nature-Tech Bridge** — nông nghiệp, môi trường, vật chất (12 năng lực #10)
- **Cross-team Projects** — đa tuổi, đa ngành, đa văn hóa (12 năng lực #4)
- **Self-Management Dashboard** — thời gian, cảm xúc, thói quen (12 năng lực #5)

**Tech:**
- Quantum literacy pilot (16+ tuổi)
- EEG attention tracking pilot (non-invasive, opt-in)
- BCI-ready architecture cho tương lai

### D.4. Giai đoạn 4: 2031–2035 — Human-AI Symbiosis

**Mục tiêu:** 500.000 người học, top 3 EdTech Việt Nam, regional expansion

**Sản phẩm:**
- **AI Orchestrator Curriculum** — thay thế coding curriculum
- **Quantum Lab** — quantum computing education (16+)
- **Neural-Enhanced Learning** — BCI pilot (opt-in, ethical)
- **Cognitive Portfolio** — neural data + blockchain
- **Post-Human Ethics Course** — philosophy, consciousness

---

## PHẦN E: KIẾN TRÚC KỸ THUẬT

### E.1. Stack hiện tại (giữ)

- Public: Astro static → Cloudflare Pages
- App: Astro static → Cloudflare Pages
- API: Hono → Cloudflare Workers
- DB: Neon PostgreSQL
- AI: Cloudflare Workers AI + aiagent.iai.one
- Email: Resend
- Payments: PayPal → thêm Stripe
- CI/CD: GitHub Actions

### E.2. Stack mới cần thêm

| Component | Technology | Lý do |
|---|---|---|
| Blockchain credentials | W3C Verifiable Credentials + CLR 2.0 | Micro-credentials verifiable suốt đời |
| VR/AR CodeLab | WebXR + A-Frame | Immersive learning, metaverse education |
| Video evidence | Cloudflare Stream | Portfolio video/voice evidence |
| Real-time collaboration | Cloudflare Durable Objects | Mentor sessions, project teams |
| Competence graph | Neo4j hoặc D1 graph | Competence map, learning paths |
| AI Declaration | Custom + AI verification | Minh bạch sử dụng AI |
| Quantum access | IBM Quantum (cloud) | Quantum literacy pilot |

### E.3. DB migrations mới (19 → 35+ tables)

```sql
-- Project Workshop
CREATE TABLE projects (...);
CREATE TABLE project_milestones (...);
CREATE TABLE project_evidence (...);
CREATE TABLE project_mentors (...);

-- Mentor Network
CREATE TABLE mentors (...);
CREATE TABLE mentor_sessions (...);
CREATE TABLE apprenticeships (...);
CREATE TABLE mentor_feedback (...);

-- Evidence Portfolio v2
CREATE TABLE evidence (...);
CREATE TABLE evidence_verification (...);
CREATE TABLE evidence_reviews (...);

-- Assessment Engine
CREATE TABLE assessments (...);
CREATE TABLE assessment_modes (...);
CREATE TABLE assessment_rubrics (...);
CREATE TABLE assessment_results (...);

-- AI Declaration
CREATE TABLE ai_declarations (...);
CREATE TABLE ai_verification (...);

-- Lifelong Competence Account
CREATE TABLE competence_accounts (...);
CREATE TABLE competence_map (...);
CREATE TABLE micro_credentials (...);
CREATE TABLE career_history (...);

-- Reputation Ledger
CREATE TABLE reputation_events (...);
CREATE TABLE reputation_verifications (...);

-- Ethics Lab
CREATE TABLE ethics_scenarios (...);
CREATE TABLE ethics_debates (...);
```

---

## PHẦN F: MÔ HÌNH KINH DOANH MỚI

### F.1. Từ subscription → evidence-based value

**Trước:** Free → Paid Academy → CodeLab → Marketplace → School License

**Sau:** Free Foundation → Project Workshop → Evidence Portfolio → Mentor Network → Lifelong Account → Enterprise/Government

### F.2. Bảng giá mới (giữ hiện tại + thêm)

| Plan | Giá | Bao gồm |
|---|---|---|
| Free | 0 | Foundation learning, CodeLab, 3 projects/năm |
| Personal | 299K VND/mo | + Project Workshop không giới hạn, Evidence Portfolio |
| Family | 599K | + Mentor matching, 2 accounts, guardian dashboard |
| Creator | 999K | + Marketplace selling, Reputation Ledger, micro-credentials |
| Founder | 1.999M | + Startup Sandbox, Life Path Explorer, Ethics Lab |
| Business | 4.999M | + Team projects, apprenticeship tracks, assessment engine |
| School | 7.999M | + Full platform, teacher copilot, school analytics |
| Government | Custom | + Regional rollout, workforce data, policy tools |

### F.3. Doanh thu dự kiến

| Năm | Người học | Doanh thu | Nguồn chính |
|---|---|---|---|
| 2026 Q4 | 100 | 50M VND | Thí điểm |
| 2027 | 5.000 | 500M VND | Subscription + mentor |
| 2028 | 20.000 | 2B VND | + Marketplace + school |
| 2030 | 50.000 | 8B VND | + Enterprise + government |
| 2035 | 500.000 | 50B VND | + Lifelong accounts + quantum |

---

## PHẦN G: RỦI RO VÀ ĐIỀU TUYỆT ĐỐI KHÔNG LÀM

### G.1. Rủi ro từ báo cáo nghiên cứu

| Rủi ro | Mitigation |
|---|---|
| AI psychosis & de-skilling | Chế độ A (no AI) bắt buộc cho foundation |
| Cognitive debt | AI Declaration + "without AI" evidence |
| Digital divide | Free tier + vùng nông thôn + tiếng Việt AI |
| Ethics gap | Ethics Lab + human approval gates |
| Thin AI SEO pages | Không tạo — mọi content có sources, evidence |

### G.2. Điều tuyệt đối không làm (từ báo cáo + AGENTS.md)

1. Không biến giáo dục AI thành môn "sử dụng phần mềm"
2. Không để AI trả lời trước khi người học hình thành suy nghĩ
3. Không đồng nhất tốc độ hoàn thành với năng lực
4. Không dùng công nghệ thay thế toàn bộ tương tác con người
5. Không cấp chứng nhận chỉ dựa trên xem video + trắc nghiệm
6. Không public placeholder, route rỗng, khóa học trống
7. Không cho AI tự xuất bản, tự cấp chứng nhận, tự phê duyệt
8. Không bán dữ liệu, không quảng cáo hành vi cho trẻ em
9. Không hứa thu nhập, việc làm khi chưa có căn cứ
10. Không mở marketplace trước moderation, license, copyright

---

## PHẦN H: 12 NGUYÊN TẮC THIẾT KẾ CHO MỌI SẢN PHẨM MỚI

1. **Con người suy nghĩ trước, AI sau** — mọi bài học yêu cầu phán đoán ban đầu trước khi gọi AI
2. **Bằng chứng, không điểm số** — mọi output phải có evidence có thể verify
3. **AI Declaration bắt buộc** — mọi bài nộp khai báo mức độ sử dụng AI
4. **Hậu quả thật** — dự án có deadline, khách hàng, rủi ro (quy mô an toàn)
5. **Mentor con người** — AI không thay thế chuyên gia con người
6. **Song ngữ thật** — Việt-Anh trong bối cảnh thực hành, không dịch máy
7. **Công bằng** — free tier có giá trị thật, không chỉ demo
8. **An toàn trẻ em** — guardian, consent, moderation, age policy
9. **Trách nhiệm** — người học giải trình quyết định, không đổ cho AI
10. **Tốc độ cập nhật** — nội dung cập nhật theo công nghệ, không theo kỳ học
11. **Suốt đời** — tài khoản không đóng, năng lực tích lũy liên tục
12. **Kiểm chứng** — mọi tuyên bố có nguồn, mọi năng lực có bằng chứng

---

## PHẦN I: BƯỚC TIẾP THEO NGAY (Q3 2026)

### I.1. Ưu tiên xây dựng (tuần 1-12)

1. **Project Workshop** — DB + API + App + 5 dự án mẫu
2. **Evidence Portfolio v2** — nâng cấp portfolio hiện tại
3. **Assessment Engine** — 3 chế độ đánh giá
4. **AI Declaration System** — tích hợp CodeLab

### I.2. Cần quyết định

- [ ] Living Learning Lab: địa điểm cụ thể (Đà Lạt? Lạc Dương? đối tác?)
- [ ] Mentor Network: nguồn mentors đầu tiên (doanh nghiệp? cựu học sinh? chuyên gia?)
- [ ] Blockchain credentials: dùng chain nào? (Hyperledger? Ethereum L2? Cloudflare?)
- [ ] VR/AR: dùng WebXR hay native app? thiết bị target?
- [ ] Quantum access: đối tác IBM Quantum? Qiskit? 

### I.3. Cần nghiên cứu thêm

- [ ] Chi tiết 6 nhóm nhân lực AI cho Việt Nam
- [ ] Mô hình công nhận micro-credentials với Bộ GD&ĐT
- [ ] Đối tác doanh nghiệp cho Project Workshop
- [ ] Chiến lược vùng nông thôn + nhóm yếu thế
- [ ] Tích hợp PISA Creative Thinking framework

---

## KẾT LUẬN

Báo cáo nghiên cứu chỉ ra rằng giáo dục tương lai không phải "trường học có thêm AI" mà là **hệ sinh thái trong đó con người học qua việc sống, làm việc, tạo ra giá trị, chịu trách nhiệm và liên tục chứng minh năng lực trong thế giới thật.**

HaMi Code Việt đã có nền tảng kỹ thuật vững (91 trang, 15 sản phẩm, 11 AI agents, 87 API endpoints). Để trở thành **hệ sinh thái giáo dục thực chứng**, cần xây thêm 6 sản phẩm cốt lõi:

1. **Project Workshop** — dự án thật
2. **Mentor Network** — chuyên gia thật
3. **Evidence Portfolio v2** — bằng chứng thật
4. **Assessment Engine** — đánh giá thật
5. **Lifelong Competence Account** — suốt đời thật
6. **AI Declaration System** — minh bạch thật

Công thức mới:

> **Học nền tảng → trải nghiệm → làm thật → dùng AI → kiểm chứng → chịu trách nhiệm → tạo giá trị → tích lũy uy tín → học lại suốt đời.**

HaMi Code Việt không thay thế trường học. HaMi Code Việt là **tầng giáo dục lớn hơn trường học** — nơi trường học trở lại đúng vai trò: nền móng của sự phát triển con người, và HaMi Code Việt xây phần còn lại của cuộc đời học tập.
