/**
 * Project Workshop — Hệ sinh thái giáo dục thực chứng
 * Tầng 3: Xưởng dự án thực tế theo báo cáo nghiên cứu giáo dục tương lai
 *
 * 10 bước: Quan sát → Phát hiện vấn đề → Nghiên cứu → Gặp người liên quan →
 *          Đề xuất giải pháp → Tạo nguyên mẫu → Thử nghiệm → Đo kết quả →
 *          Sửa sai → Công bố bằng chứng
 *
 * Mỗi dự án có: mentor, deadline, khách hàng, ngân sách, rủi ro, bằng chứng
 */
module.exports = {
  up(pgm) {
    // ===== project_templates — mẫu dự án theo lĩnh vực =====
    pgm.createTable('project_templates', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      slug: { type: 'text', notNull: true, unique: true },
      title: { type: 'text', notNull: true },
      title_en: { type: 'text', notNull: true },
      description: { type: 'text', notNull: true },
      description_en: { type: 'text', notNull: true },
      domain: { type: 'text', notNull: true }, // agriculture, tourism, technology, education, media, environment, health, culture, service, business
      age_group: { type: 'text', notNull: true }, // 8-10, 11-13, 14-17, 16-20, 18-24
      difficulty: { type: 'text', notNull: true, default: 'beginner' }, // beginner, intermediate, advanced
      duration_weeks: { type: 'integer', notNull: true, default: 4 },
      budget_vnd: { type: 'integer', default: 0 }, // ngân sách gợi ý (VND)
      milestones: { type: 'jsonb', notNull: true, default: '[]' }, // 10 bước template
      skills: { type: 'jsonb', default: '[]' }, // kỹ năng cần có
      learning_outcomes: { type: 'jsonb', default: '[]' }, // kết quả học tập
      ai_tools_allowed: { type: 'boolean', notNull: true, default: true },
      ai_declaration_required: { type: 'boolean', notNull: true, default: true },
      is_published: { type: 'boolean', notNull: true, default: true },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('project_templates', 'slug');
    pgm.createIndex('project_templates', 'domain');
    pgm.createIndex('project_templates', 'age_group');

    // ===== projects — dự án thực tế của người học =====
    pgm.createTable('projects', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      template_id: { type: 'uuid', references: 'project_templates(id)' },
      title: { type: 'text', notNull: true },
      title_en: { type: 'text' },
      description: { type: 'text', notNull: true },
      description_en: { type: 'text' },
      domain: { type: 'text', notNull: true },
      age_group: { type: 'text', notNull: true },
      status: { type: 'text', notNull: true, default: 'draft' },
      // draft → planning → in_progress → submitted → reviewed → published → archived
      current_step: { type: 'integer', notNull: true, default: 0 }, // 0-9 (10 bước)
      // 10 bước: 0=Quan sát, 1=Phát hiện vấn đề, 2=Nghiên cứu, 3=Gặp người liên quan,
      //          4=Đề xuất giải pháp, 5=Tạo nguyên mẫu, 6=Thử nghiệm, 7=Đo kết quả,
      //          8=Sửa sai, 9=Công bố bằng chứng
      mentor_id: { type: 'uuid', references: 'users(id)' },
      client_name: { type: 'text' }, // khách hàng thật (nếu có)
      client_type: { type: 'text' }, // real, simulated, community
      budget_vnd: { type: 'integer', default: 0 },
      deadline: { type: 'timestamp' },
      risk_level: { type: 'text', default: 'low' }, // low, medium, high
      ai_declaration: { type: 'jsonb', default: '{}' }, // khai báo sử dụng AI
      ai_tools_used: { type: 'jsonb', default: '[]' },
      final_report: { type: 'text' },
      final_report_en: { type: 'text' },
      review_score: { type: 'integer' }, // 0-100
      review_feedback: { type: 'text' },
      reviewed_by: { type: 'uuid', references: 'users(id)' },
      reviewed_at: { type: 'timestamp' },
      published_at: { type: 'timestamp' },
      privacy_level: { type: 'text', notNull: true, default: 'private' }, // private, mentor_only, link_only, public
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('projects', 'user_id');
    pgm.createIndex('projects', 'status');
    pgm.createIndex('projects', 'domain');
    pgm.createIndex('projects', 'mentor_id');

    // ===== project_milestones — 10 bước của từng dự án =====
    pgm.createTable('project_milestones', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      project_id: { type: 'uuid', notNull: true, references: 'projects(id)', onDelete: 'cascade' },
      step: { type: 'integer', notNull: true }, // 0-9
      step_name: { type: 'text', notNull: true },
      step_name_en: { type: 'text', notNull: true },
      status: { type: 'text', notNull: true, default: 'pending' }, // pending, in_progress, completed, skipped
      notes: { type: 'text' },
      completed_at: { type: 'timestamp' },
      mentor_feedback: { type: 'text' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('project_milestones', 'project_id');
    pgm.createIndex('project_milestones', ['project_id', 'step'], { unique: true });

    // ===== project_evidence — bằng chứng cho từng milestone =====
    pgm.createTable('project_evidence', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      project_id: { type: 'uuid', notNull: true, references: 'projects(id)', onDelete: 'cascade' },
      milestone_id: { type: 'uuid', references: 'project_milestones(id)', onDelete: 'cascade' },
      evidence_type: { type: 'text', notNull: true },
      // understand, do, transfer, critique, responsibility, impact (6 layers)
      title: { type: 'text', notNull: true },
      description: { type: 'text' },
      artifact_url: { type: 'text' }, // link tới code, document, image, video
      artifact_type: { type: 'text' }, // code, document, image, video, audio, data, link
      ai_used: { type: 'boolean', notNull: true, default: false },
      ai_declaration: { type: 'jsonb', default: '{}' }, // công cụ, prompts, phần AI vs human
      verified_by: { type: 'uuid', references: 'users(id)' },
      verified_at: { type: 'timestamp' },
      verification_status: { type: 'text', default: 'pending' }, // pending, verified, rejected
      verification_notes: { type: 'text' },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('project_evidence', 'project_id');
    pgm.createIndex('project_evidence', 'milestone_id');
    pgm.createIndex('project_evidence', 'evidence_type');

    // ===== project_mentors — chuyên gia hướng dẫn =====
    pgm.createTable('project_mentors', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      display_name: { type: 'text', notNull: true },
      bio: { type: 'text' },
      bio_en: { type: 'text' },
      expertise: { type: 'jsonb', notNull: true, default: '[]' }, // lĩnh vực chuyên môn
      domains: { type: 'jsonb', notNull: true, default: '[]' }, // agriculture, technology, etc.
      age_groups: { type: 'jsonb', default: '[]' }, // 8-10, 11-13, etc.
      years_experience: { type: 'integer', default: 0 },
      hourly_rate_vnd: { type: 'integer', default: 0 }, // 0 = volunteer/free
      availability_hours_per_week: { type: 'integer', default: 2 },
      languages: { type: 'jsonb', default: '["vi","en"]' },
      is_verified: { type: 'boolean', notNull: true, default: false },
      is_active: { type: 'boolean', notNull: true, default: true },
      rating: { type: 'numeric', default: 0 }, // 0-5
      total_sessions: { type: 'integer', default: 0 },
      total_projects: { type: 'integer', default: 0 },
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('project_mentors', 'user_id');
    pgm.createIndex('project_mentors', 'is_verified');
    pgm.createIndex('project_mentors', 'is_active');

    // ===== project_sessions — phiên hướng dẫn mentor ↔ learner =====
    pgm.createTable('project_sessions', {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      project_id: { type: 'uuid', notNull: true, references: 'projects(id)', onDelete: 'cascade' },
      mentor_id: { type: 'uuid', notNull: true, references: 'project_mentors(id)', onDelete: 'cascade' },
      learner_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
      session_type: { type: 'text', notNull: true, default: 'feedback' },
      // observation, small_task, feedback, autonomous, review
      scheduled_at: { type: 'timestamp', notNull: true },
      duration_minutes: { type: 'integer', default: 30 },
      status: { type: 'text', notNull: true, default: 'scheduled' }, // scheduled, completed, cancelled, no_show
      notes: { type: 'text' },
      mentor_feedback: { type: 'text' },
      learner_feedback: { type: 'text' },
      rating: { type: 'integer' }, // 1-5
      created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    });
    pgm.createIndex('project_sessions', 'project_id');
    pgm.createIndex('project_sessions', 'mentor_id');
    pgm.createIndex('project_sessions', 'learner_id');
    pgm.createIndex('project_sessions', 'status');
  },
  down(pgm) {
    pgm.dropTable('project_sessions');
    pgm.dropTable('project_mentors');
    pgm.dropTable('project_evidence');
    pgm.dropTable('project_milestones');
    pgm.dropTable('projects');
    pgm.dropTable('project_templates');
  },
};
