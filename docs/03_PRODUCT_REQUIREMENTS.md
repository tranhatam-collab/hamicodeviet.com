# ĐẶC TẢ SẢN PHẨM TOÀN NỀN TẢNG

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Product thesis

HaMi Code Việt giải quyết bốn vấn đề:

1. Người học tiếp cận công nghệ nhưng thiếu lộ trình theo tuổi và năng lực.
2. Học tiếng Anh tách rời thực hành nên khó sử dụng trong công việc công nghệ.
3. Khóa học thường đo bằng thời lượng xem, không đo bằng sản phẩm và bằng chứng năng lực.
4. AI tạo nội dung nhanh nhưng dễ sinh nội dung trùng lặp, sai, không an toàn và không được kiểm định.

Sản phẩm phải chuyển người học từ **người tiêu thụ nội dung** thành **người tạo sản phẩm**.

## 2. Người dùng và nhu cầu

| Nhóm | Nhu cầu chính | Kết quả cần đạt |
|---|---|---|
| 8-10 | Học vui, an toàn, có phụ huynh | Truyện, hoạt hình, game đơn giản |
| 11-13 | Thử sức code và web | Game, quiz, website đầu tiên |
| 14-17 | Xây kỹ năng và portfolio | Python/web/game, dự án nhóm |
| 18-20 | Năng lực nghề và triển khai | Full-stack, API, database, AI Agent |
| 21-24 | Sản phẩm và kinh doanh | SaaS, marketplace, startup/project lead |
| Phụ huynh | An toàn, tiến độ, chi phí rõ | Báo cáo, consent, kiểm soát quyền công khai |
| Giáo viên | Học liệu, giao bài, đánh giá | Classroom, rubric, lesson pack |
| Trường học | Quản trị, báo cáo, license | School dashboard, data isolation |
| Creator | Xuất bản và bán sản phẩm | Product review, license, payout |

## 3. Product ladder

### 3.1 HaMi Learn

- Bài học miễn phí có đầu ra 15-30 phút.
- 5 lộ trình tuổi.
- Bài đánh giá đầu vào.
- Project cơ bản, glossary và digital safety.
- Portfolio cơ bản, quota AI giới hạn.

### 3.2 HaMi Academy

- Khóa tự học, cohort, lớp online/offline, 1:1.
- Mentor, code review, assessment, Demo Day.
- Chứng nhận dựa trên evidence, không dựa trên xem video.

### 3.3 HaMi CodeLab

- HTML/CSS/JavaScript/Python.
- Editor, preview, test runner, autosave, version history.
- Sandbox cô lập, giới hạn CPU/RAM/time/network.

### 3.4 HaMi Verify

- Rubric, review, project version, certificate ID, QR verify.
- Privacy levels: private, guardian-only, link-only, public.

### 3.5 HaMi Market

- Source code, template, game, asset, lesson pack, educational tool.
- Creator onboarding, copyright declaration, malware scan, review, refund, dispute.

### 3.6 HaMi Schools

- Classroom, assignment, progress, teacher resources, license, reports.
- Organization-level RBAC và data segmentation.

## 4. Route map tối thiểu

### Public

`/`, `/vi`, `/en`, `/hoc-mien-phi`, `/lo-trinh`, `/khoa-hoc`, `/du-an`, `/codelab`, `/marketplace`, `/phu-huynh`, `/giao-vien`, `/truong-hoc`, `/hoc-bong`, `/ve-chung-toi`, `/nha-sang-lap`, `/an-toan`, `/chinh-sach-ai`, `/quyen-rieng-tu`, `/dieu-khoan`, `/ban-quyen`, `/lien-he`, `/status` và route tiếng Anh tương ứng.

### Auth

`/login`, `/signup`, `/signup/learner`, `/signup/guardian`, `/signup/teacher`, `/verify-email`, `/forgot-password`, `/reset-password`, `/consent`, `/link-guardian`, `/auth/callback`.

### Learner App

`/app`, `/app/learn`, `/app/courses`, `/app/course/:slug`, `/app/lesson/:lessonId`, `/app/codelab`, `/app/projects`, `/app/project/:id`, `/app/portfolio`, `/app/assessments`, `/app/certificates`, `/app/settings`.

### Parent, Teacher, School, Creator, Admin

Tách route và quyền độc lập; không dùng một dashboard hiển thị mọi module dựa trên frontend-only checks.

## 5. User journeys bắt buộc

1. Khách chọn độ tuổi → đánh giá đầu vào → nhận lộ trình → học bài miễn phí → tạo project.
2. Learner dưới tuổi quy định → mời guardian → guardian xác minh → consent → tài khoản hoạt động.
3. Free learner → xem giá trị nâng cao → thanh toán → webhook xác minh → entitlement.
4. Learner → CodeLab → lưu version → submit → review → portfolio → certificate.
5. Creator → xác minh → submit sản phẩm → scan/review → publish → sale → payout.
6. Teacher → tạo lớp → giao bài → learner nộp → rubric → report.

## 6. Non-functional requirements

- Mobile-first, PWA-ready.
- Mục tiêu WCAG 2.2 AA; chỉ công bố sau audit.
- Core routes không 404, không console error, không broken asset.
- Production logs, monitoring, backup, rollback.
- Locale-aware SEO, `hreflang`, canonical và noindex cho private routes.
- Không lưu PII trong analytics events.
