/**
 * Seed 5 project templates — 5 domains, 5 age groups
 * Based on research report: real-world projects with mentors, deadlines, evidence
 */
module.exports = {
  up(pgm) {
    // Template 1: Agriculture — 8-10 tuổi
    pgm.sql(`INSERT INTO project_templates (slug, title, title_en, description, description_en, domain, age_group, difficulty, duration_weeks, budget_vnd, milestones, skills, learning_outcomes, ai_tools_allowed, ai_declaration_required)
    VALUES (
      'vuon-nha-tu-can',
      'Làm vườn nhà từ lon can',
      'Home garden from plastic containers',
      'Quan sát không gian nhà, tìm chỗ có ánh sáng, trồng rau từ lon can tái chế, đo lường sự phát triển, ghi chép bằng ảnh và số liệu.',
      'Observe home space, find sunny spots, grow vegetables from recycled containers, measure growth, record with photos and data.',
      'agriculture', '8-10', 'beginner', 3, 50000,
      '[{"step":0,"name":"Quan sát","name_en":"Observe"},{"step":1,"name":"Phát hiện vấn đề","name_en":"Identify Problem"},{"step":2,"name":"Nghiên cứu","name_en":"Research"},{"step":3,"name":"Gặp người liên quan","name_en":"Engage Stakeholders"},{"step":4,"name":"Đề xuất giải pháp","name_en":"Propose Solution"},{"step":5,"name":"Tạo nguyên mẫu","name_en":"Build Prototype"},{"step":6,"name":"Thử nghiệm","name_en":"Test"},{"step":7,"name":"Đo kết quả","name_en":"Measure Results"},{"step":8,"name":"Sửa sai","name_en":"Iterate"},{"step":9,"name":"Công bố bằng chứng","name_en":"Publish Evidence"}]'::jsonb,
      '["observation","measurement","photography","basic-data"]'::jsonb,
      '["Hiểu vòng đời thực vật","Thực hành tái chế","Đo lường và ghi chép","Kiểm chứng bằng ảnh"]'::jsonb,
      true, true
    )`);

    // Template 2: Technology — 11-13 tuổi
    pgm.sql(`INSERT INTO project_templates (slug, title, title_en, description, description_en, domain, age_group, difficulty, duration_weeks, budget_vnd, milestones, skills, learning_outcomes, ai_tools_allowed, ai_declaration_required)
    VALUES (
      'website-cua-hang-tieu',
      'Website cửa hàng tiểu vùng',
      'Neighborhood mini-store website',
      'Tạo website thật cho một cửa hàng nhỏ gần nhà: gặp chủ quán, chụp ảnh, xây website, đưa lên mạng, đo lường xem có ai vào không.',
      'Build a real website for a small store near home: meet the owner, take photos, build the website, deploy it, measure visitors.',
      'technology', '11-13', 'beginner', 4, 0,
      '[{"step":0,"name":"Quan sát","name_en":"Observe"},{"step":1,"name":"Phát hiện vấn đề","name_en":"Identify Problem"},{"step":2,"name":"Nghiên cứu","name_en":"Research"},{"step":3,"name":"Gặp người liên quan","name_en":"Engage Stakeholders"},{"step":4,"name":"Đề xuất giải pháp","name_en":"Propose Solution"},{"step":5,"name":"Tạo nguyên mẫu","name_en":"Build Prototype"},{"step":6,"name":"Thử nghiệm","name_en":"Test"},{"step":7,"name":"Đo kết quả","name_en":"Measure Results"},{"step":8,"name":"Sửa sai","name_en":"Iterate"},{"step":9,"name":"Công bố bằng chứng","name_en":"Publish Evidence"}]'::jsonb,
      '["html","css","photography","client-communication","deployment"]'::jsonb,
      '["Giao tiếp với khách hàng thật","Xây website HTML/CSS","Deploy lên Cloudflare Pages","Đo lường visitor"]'::jsonb,
      true, true
    )`);

    // Template 3: Environment — 14-17 tuổi
    pgm.sql(`INSERT INTO project_templates (slug, title, title_en, description, description_en, domain, age_group, difficulty, duration_weeks, budget_vnd, milestones, skills, learning_outcomes, ai_tools_allowed, ai_declaration_required)
    VALUES (
      'phan-loai-rac-ai',
      'Phân loại rác bằng AI',
      'AI trash classifier',
      'Xây dựng công cụ phân loại rác tái chế/hữu cơ/lạ bằng AI, thử nghiệm tại trường hoặc cộng đồng, đo lường độ chính xác và tác động.',
      'Build an AI tool to classify recyclable/organic/other waste, test at school or community, measure accuracy and impact.',
      'environment', '14-17', 'intermediate', 6, 200000,
      '[{"step":0,"name":"Quan sát","name_en":"Observe"},{"step":1,"name":"Phát hiện vấn đề","name_en":"Identify Problem"},{"step":2,"name":"Nghiên cứu","name_en":"Research"},{"step":3,"name":"Gặp người liên quan","name_en":"Engage Stakeholders"},{"step":4,"name":"Đề xuất giải pháp","name_en":"Propose Solution"},{"step":5,"name":"Tạo nguyên mẫu","name_en":"Build Prototype"},{"step":6,"name":"Thử nghiệm","name_en":"Test"},{"step":7,"name":"Đo kết quả","name_en":"Measure Results"},{"step":8,"name":"Sửa sai","name_en":"Iterate"},{"step":9,"name":"Công bố bằng chứng","name_en":"Publish Evidence"}]'::jsonb,
      '["python","ai-ml","computer-vision","data-collection","impact-measurement"]'::jsonb,
      '["Xây AI classifier với TensorFlow.js","Thu thập dữ liệu ảnh rác","Đo độ chính xác và bias","Đo tác động môi trường"]'::jsonb,
      true, true
    )`);

    // Template 4: Business — 18-20 tuổi
    pgm.sql(`INSERT INTO project_templates (slug, title, title_en, description, description_en, domain, age_group, difficulty, duration_weeks, budget_vnd, milestones, skills, learning_outcomes, ai_tools_allowed, ai_declaration_required)
    VALUES (
      'saas-to-nho-that',
      'SaaS nhỏ thật — có khách hàng thật',
      'Real micro-SaaS — with real customers',
      'Xây một SaaS nhỏ (vd: công cụ tính thuế, tạo hóa đơn, quản lý đơn hàng), có khách hàng thật trả tiền thật, đo MRR, xử lý phản hồi.',
      'Build a small SaaS (e.g. tax calculator, invoice generator, order manager), with real paying customers, measure MRR, handle feedback.',
      'business', '18-20', 'advanced', 8, 500000,
      '[{"step":0,"name":"Quan sát","name_en":"Observe"},{"step":1,"name":"Phát hiện vấn đề","name_en":"Identify Problem"},{"step":2,"name":"Nghiên cứu","name_en":"Research"},{"step":3,"name":"Gặp người liên quan","name_en":"Engage Stakeholders"},{"step":4,"name":"Đề xuất giải pháp","name_en":"Propose Solution"},{"step":5,"name":"Tạo nguyên mẫu","name_en":"Build Prototype"},{"step":6,"name":"Thử nghiệm","name_en":"Test"},{"step":7,"name":"Đo kết quả","name_en":"Measure Results"},{"step":8,"name":"Sửa sai","name_en":"Iterate"},{"step":9,"name":"Công bố bằng chứng","name_en":"Publish Evidence"}]'::jsonb,
      '["fullstack","payments","customer-interview","analytics","mrr-tracking"]'::jsonb,
      '["Customer interview thật","Build + deploy SaaS","Tích hợp Stripe/PayPal","Đo MRR và churn","Xử lý phản hồi khách hàng"]'::jsonb,
      true, true
    )`);

    // Template 5: Education — 21-24 tuổi
    pgm.sql(`INSERT INTO project_templates (slug, title, title_en, description, description_en, domain, age_group, difficulty, duration_weeks, budget_vnd, milestones, skills, learning_outcomes, ai_tools_allowed, ai_declaration_required)
    VALUES (
      'khoa-hoc-online-that',
      'Khóa học online thật — có học viên thật',
      'Real online course — with real students',
      'Thiết kế và giảng dạy một khóa học online ngắn (4-8 buổi), có học viên thật đăng ký, hoàn thành, đánh giá. Đo completion rate và satisfaction.',
      'Design and teach a short online course (4-8 sessions), with real enrolled students who complete and review. Measure completion and satisfaction.',
      'education', '18-24', 'advanced', 8, 300000,
      '[{"step":0,"name":"Quan sát","name_en":"Observe"},{"step":1,"name":"Phát hiện vấn đề","name_en":"Identify Problem"},{"step":2,"name":"Nghiên cứu","name_en":"Research"},{"step":3,"name":"Gặp người liên quan","name_en":"Engage Stakeholders"},{"step":4,"name":"Đề xuất giải pháp","name_en":"Propose Solution"},{"step":5,"name":"Tạo nguyên mẫu","name_en":"Build Prototype"},{"step":6,"name":"Thử nghiệm","name_en":"Test"},{"step":7,"name":"Đo kết quả","name_en":"Measure Results"},{"step":8,"name":"Sửa sai","name_en":"Iterate"},{"step":9,"name":"Công bố bằng chứng","name_en":"Publish Evidence"}]'::jsonb,
      '["curriculum-design","video-production","lms","student-feedback","completion-analytics"]'::jsonb,
      '["Thiết kế curriculum có mục tiêu đo được","Quay và sản xuất video bài giảng","Tuyển học viên thật","Đo completion rate và NPS","Lặp lại dựa trên phản hồi"]'::jsonb,
      true, true
    )`);
  },
  down(pgm) {
    pgm.sql(`DELETE FROM project_templates WHERE slug IN (
      'vuon-nha-tu-can',
      'website-cua-hang-tieu',
      'phan-loai-rac-ai',
      'saas-to-nho-that',
      'khoa-hoc-online-that'
    )`);
  },
};
