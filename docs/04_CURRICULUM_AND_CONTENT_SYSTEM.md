# KIẾN TRÚC CHƯƠNG TRÌNH VÀ NỘI DUNG

**Phiên bản:** 1.0  
**Ngày:** 23/06/2026  
**Dự án:** HaMi Code Việt - hamicodeviet.com

---

## 1. Kiến trúc học thuật

Nội dung được tổ chức theo bốn tầng:

1. **Learning Path:** 5 lộ trình chính.
2. **Course:** 100-300 khóa học chuẩn hóa khi hệ trưởng thành.
3. **Module:** 1.000-3.000 module có mục tiêu cụ thể.
4. **Learning Object:** bài tập, snippet, quiz, demo, vocabulary, challenge và project variant.

Không tạo hàng trăm nghìn khóa học độc lập. Hàng trăm nghìn đơn vị học tập chỉ được mở rộng sau khi có schema, test, review và versioning.

## 2. Năm lộ trình

### Creative Explorer - 8-10

- Logic không màn hình.
- Scratch cơ bản, kể chuyện và hoạt hình.
- Game mê cung, quiz hình ảnh.
- Từ vựng Anh-Việt trong ngữ cảnh.
- An toàn mạng và sáng tạo có kiểm soát.
- Không chat AI mở; phụ huynh/giáo viên giám sát.

### Junior Builder - 11-13

- Scratch nâng cao.
- HTML/CSS và JavaScript trực quan.
- Game, quiz, website đầu tiên.
- Digital citizenship, privacy và AI literacy căn bản.

### Young Creator - 14-17

- Python, JavaScript, Git, web, game 2D, UI/UX.
- AI literacy, fact-checking, project teamwork.
- Portfolio và thuyết trình song ngữ.

### Product Developer - 18-20

- Full-stack, API, database, testing, deployment.
- AI Agent, automation, security basics.
- Product delivery, freelance fundamentals.

### Builder & Entrepreneur - 21-24

- SaaS, system design, cloud, DevOps, security.
- Product management, marketplace, startup operations.
- Mentoring, leadership và business model.

## 3. Lesson schema bắt buộc

Mỗi lesson phải có:

- `lesson_id`, `slug`, `locale`, `title`, `summary`.
- `age_band`, `difficulty`, `language_level`, `estimated_time`.
- `learning_objectives`, `prerequisites`, `vocabulary`, `concepts`.
- `instructions`, `starter_code`, `solution_code`, `tests`.
- `project_output`, `rubric`, `ai_usage_policy`, `safety_notes`.
- `teacher_notes`, `parent_notes`, `copyright_status`.
- `review_status`, `version`, `published_at`, `reviewer_ids`.

## 4. Chuẩn bài học song ngữ

Mỗi bài gồm:

1. Mục tiêu tiếng Việt.
2. Từ vựng tiếng Anh trọng tâm.
3. Giải thích song ngữ theo ngữ cảnh.
4. Demo hoặc starter project.
5. Thực hành có test.
6. Yêu cầu trình bày sản phẩm.
7. Phản hồi AI có giới hạn.
8. Review người thật khi cần.
9. Evidence và portfolio.

Không hiển thị hai bản dịch dài song song trên cùng màn hình. Dùng locale switcher và glossary thống nhất.

## 5. MVP content pack

- 5 learning paths.
- 30 lessons hoàn chỉnh.
- 100 code/project demos.
- 10 capstone projects.
- 5 parent guides.
- 5 teacher guides.
- 1 khóa digital safety.
- 1 khóa AI literacy.
- 1 bilingual technology glossary.
- 1 placement assessment.

## 6. Content QA pipeline

> Schema validation → Draft → Technical test → Copyright check → Language review → Age suitability → Accessibility review → Human approval → Publish → Feedback → Version update

Mỗi code demo phải chạy được trên môi trường được hỗ trợ, có README, license, dependencies, expected output và automated test khi khả thi.

## 7. Assessment model

Đánh giá theo rubric:

- Correctness.
- Completeness.
- Creativity.
- Code quality.
- Documentation.
- Language use.
- Accessibility.
- Security.
- Originality.
- Iteration.

AI chỉ chấm sơ bộ. Certificate quan trọng cần human gate hoặc policy được founder duyệt.
