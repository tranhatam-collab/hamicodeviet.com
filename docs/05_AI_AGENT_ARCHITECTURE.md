# KIẾN TRÚC AI AGENT

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Vai trò của `aiagent.iai.one`

`aiagent.iai.one` là lớp model gateway, orchestration, policy, audit và cost control. HaMi Code Việt không kết nối tùy tiện trực tiếp từ trình duyệt tới nhà cung cấp AI.

## 2. Agent catalog

| Agent | Chức năng | Human Gate |
|---|---|---|
| Curriculum Planner | Gợi ý lộ trình, prerequisite, sequence | Curriculum Lead duyệt |
| Lesson Draft Agent | Soạn bản nháp bài học | Editor + reviewer duyệt |
| Bilingual Tutor | Giải thích Việt-Anh | Giới hạn theo tuổi/policy |
| Code Coach | Gợi ý sửa lỗi, không làm hộ toàn bộ | Learner controls |
| Code Reviewer | Lint, test, security hints | Reviewer quyết định cuối |
| Assessment Agent | Chấm sơ bộ theo rubric | Human gate cho certificate |
| Project Planner | Chia dự án thành bước | Learner/mentor xác nhận |
| Safety Guardian | Moderation, age policy | Escalate tới trust team |
| Parent Report Agent | Tóm tắt tiến độ | Không lộ nội dung riêng tư thừa |
| Teacher Copilot | Lesson plan, assignment draft | Teacher duyệt |
| Marketplace Reviewer | Scan claim, code, license | Human marketplace review |
| Portfolio Agent | Tổng hợp evidence | Learner/guardian quyết định public |

## 3. Agent contract

Mỗi agent phải định nghĩa:

- ID và version.
- Purpose và non-goals.
- Allowed/prohibited inputs.
- Output JSON schema.
- Model/provider policy.
- Token và cost ceiling.
- Timeout, retry, fallback.
- Moderation và age rules.
- Human approval rules.
- Audit fields.
- Eval dataset và acceptance threshold.
- Failure modes và safe fallback.

## 4. AI request flow

1. Frontend gửi request tới backend.
2. Backend kiểm tra auth, role, age, consent, entitlement, quota.
3. PII minimization/redaction.
4. Policy engine chọn agent, prompt version và model.
5. Gọi `aiagent.iai.one`.
6. Validate output schema, moderation, code scan.
7. Ghi usage/cost/audit.
8. Trả response có cảnh báo và nguồn nếu phù hợp.
9. Escalate tới human reviewer khi vượt policy.

## 5. Safety controls

- Prompt injection defense.
- Model output validation.
- Code execution tách khỏi model generation.
- Kill switch theo agent/model/provider.
- Quota theo plan, age và use case.
- Không gửi full profile trẻ em nếu không cần.
- Không dùng nội dung riêng tư để train nếu chưa có căn cứ và consent.
- Không để AI tự xuất bản, tự refund, tự ban tài khoản hoặc tự giải quyết tranh chấp cuối cùng.
- Dưới 13 tuổi: không chat AI mở; dùng guided interactions hoặc teacher/guardian mode.

## 6. AI evaluation

Mỗi release phải đánh giá:

- Correctness.
- Harmful content refusal.
- Age appropriateness.
- Vietnamese quality.
- English quality.
- Hallucination rate.
- Code pass rate.
- Security issue detection.
- Prompt injection resistance.
- Cost per successful learning outcome.

## 7. Cost control

- Small model first.
- Cache deterministic outputs.
- Daily/monthly hard caps.
- Per-user/per-school quota.
- Budget alerts.
- Fallback to non-AI UX khi provider lỗi.
- Usage dashboard và anomaly detection.
