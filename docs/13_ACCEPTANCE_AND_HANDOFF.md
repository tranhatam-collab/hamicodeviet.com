# NGHIỆM THU VÀ BÀN GIAO

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Hồ sơ bàn giao bắt buộc

### Strategy

- Founder Lock.
- Product Strategy.
- Business Model.
- Growth Plan.

### Product & Curriculum

- PRD.
- User roles/journeys.
- Curriculum Architecture.
- Content Schema.
- Marketplace/School specs.

### Engineering

- System/Data/API/AI/Sandbox/Deployment architecture.
- Environment matrix.
- Secret setup guide không chứa secret thật.

### Security & Compliance

- Threat Model.
- Security Controls/Test Report.
- Incident Response.
- Privacy/Child Safety/AI policy drafts.

### QA & Release

- Test Plan, E2E Matrix.
- Accessibility Audit.
- Performance Report.
- Final QA Audit.
- Live Verification Report.
- Go-Live Checklist.
- Release Notes.
- Production Evidence Packet.
- Final Handoff.

## 2. Acceptance criteria cấp dự án

Dự án core chỉ được nghiệm thu go-live khi:

1. Domain production ổn định và SSL hợp lệ.
2. Public website song ngữ, menu và CTA không lỗi.
3. Auth và guardian flow hoạt động.
4. 30 lessons và 100 demos đã QA.
5. Learning/project flow hoạt động thật.
6. AI có policy, quota, audit, eval và kill switch nếu bật.
7. Không secret leak; không P0/P1 mở.
8. Privacy, consent, export/delete và child safety pass.
9. Payment lifecycle pass nếu public paid plans.
10. Monitoring, backup, restore test và rollback có bằng chứng.
11. Live E2E chạy trên domain canonical.
12. Production Evidence Packet được ký duyệt.

## 3. Conditional release

Có thể release core platform khi marketplace, school hoặc CodeLab nâng cao chưa sẵn sàng, với điều kiện:

- Module bị tắt bằng feature flag.
- Không xuất hiện CTA gây hiểu lầm.
- Không có route public giả hoạt động.
- Báo cáo ghi rõ `DISABLED`, `PILOT` hoặc `PASS`.

## 4. Handoff ownership

Mỗi hệ thống phải có:

- Product owner.
- Technical owner.
- Operations owner.
- Security/privacy owner.
- Documentation owner.
- On-call/escalation contact.
- Review date.

## 5. 30/60/90 ngày sau go-live

### 30 ngày

- Stabilization, issue triage, first cohort feedback.
- Đo activation, project completion, AI cost, support load.
- Không mở thêm module lớn nếu core retention thấp.

### 60 ngày

- Cải tiến onboarding, curriculum, parent report.
- School pilot và CodeLab performance.
- Security/accessibility regression audit.

### 90 ngày

- Quyết định mở rộng marketplace/school dựa trên evidence.
- Cập nhật pricing, unit economics và roadmap.
- Independent security/privacy/legal review theo ngân sách và thị trường.
