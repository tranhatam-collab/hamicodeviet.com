/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // AI agents table
  pgm.createTable('ai_agents', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    name_vi: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    description_vi: {
      type: 'text',
    },
    agent_type: {
      type: 'text',
      notNull: true,
    },
    endpoint: {
      type: 'text',
    },
    model: {
      type: 'text',
    },
    capabilities: {
      type: 'jsonb',
      notNull: true,
    },
    safety_level: {
      type: 'text',
      notNull: true,
      default: 'standard',
    },
    age_restriction: {
      type: 'integer',
      default: 13,
    },
    active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // AI conversations table
  pgm.createTable('ai_conversations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade',
    },
    agent_id: {
      type: 'text',
      notNull: true,
      references: 'ai_agents(id)',
      onDelete: 'restrict',
    },
    title: {
      type: 'text',
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'active',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('ai_conversations', 'user_id');
  pgm.createIndex('ai_conversations', 'agent_id');
  pgm.createIndex('ai_conversations', 'status');

  // AI messages table
  pgm.createTable('ai_messages', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    conversation_id: {
      type: 'uuid',
      notNull: true,
      references: 'ai_conversations(id)',
      onDelete: 'cascade',
    },
    role: {
      type: 'text',
      notNull: true,
    },
    content: {
      type: 'text',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('ai_messages', 'conversation_id');

  // Insert default AI agents
  pgm.sql`
    INSERT INTO ai_agents (id, name, name_vi, description, description_vi, agent_type, endpoint, model, capabilities, safety_level, age_restriction)
    VALUES
      ('tutor', 'AI Tutor', 'AI Gia sư', 'Personalized learning assistant', 'Trợ lý học tập cá nhân hóa', 'tutor', 'https://aiagent.iai.one/tutor', 'gpt-4', '["explanation", "problem_solving", "code_help"]'::jsonb, 'standard', 13),
      ('mentor', 'AI Mentor', 'AI Mentor', 'Career guidance and mentorship', 'Hướng dẫn nghề nghiệp và mentorship', 'mentor', 'https://aiagent.iai.one/mentor', 'gpt-4', '["career_guidance", "skill_development", "goal_setting"]'::jsonb, 'standard', 16),
      ('code_reviewer', 'Code Reviewer', 'Reviewer Code', 'Code review and suggestions', 'Review code và gợi ý cải thiện', 'code', 'https://aiagent.iai.one/code', 'gpt-4', '["code_review", "optimization", "best_practices"]'::jsonb, 'standard', 13),
      ('quiz_generator', 'Quiz Generator', 'Tạo Quiz', 'Generate quizzes and assessments', 'Tạo quiz và đánh giá', 'quiz', 'https://aiagent.iai.one/quiz', 'gpt-4', '["quiz_generation", "assessment", "feedback"]'::jsonb, 'standard', 13),
      ('content_creator', 'Content Creator', 'Tạo Nội dung', 'Generate learning content', 'Tạo nội dung học tập', 'content', 'https://aiagent.iai.one/content', 'gpt-4', '["content_generation", "explanation", "examples"]'::jsonb, 'standard', 13),
      ('translator', 'Translator', 'Dịch thuật', 'Vietnamese-English translation', 'Dịch thuật Việt-Anh', 'translation', 'https://aiagent.iai.one/translate', 'gpt-4', '["translation", "localization", "cultural_context"]'::jsonb, 'standard', 8),
      ('analyzer', 'Learning Analyzer', 'Phân tích Học tập', 'Analyze learning patterns and progress', 'Phân tích mô hình học tập và tiến độ', 'analytics', 'https://aiagent.iai.one/analytics', 'gpt-4', '["progress_analysis", "weakness_identification", "recommendations"]'::jsonb, 'standard', 13),
      ('safety_monitor', 'Safety Monitor', 'Giám sát An toàn', 'Monitor child safety and content', 'Giám sát an toàn trẻ em và nội dung', 'safety', 'https://aiagent.iai.one/safety', 'gpt-4', '["content_filtering", "behavior_monitoring", "alert_generation"]'::jsonb, 'high', 8),
      ('accessibility', 'Accessibility Helper', 'Trợ lý Khả năng truy cập', 'Help with accessibility features', 'Trợ giúp với tính năng khả năng truy cập', 'accessibility', 'https://aiagent.iai.one/accessibility', 'gpt-4', '["screen_reader", "voice_commands", "simplified_content"]'::jsonb, 'standard', 8),
      ('project_helper', 'Project Helper', 'Trợ lý Dự án', 'Assist with project development', 'Trợ giúp phát triển dự án', 'project', 'https://aiagent.iai.one/project', 'gpt-4', ['project_planning", "code_assistance", "debugging"]'::jsonb, 'standard', 13),
      ('community_moderator', 'Community Moderator', 'Moderator Cộng đồng', 'Moderate community content', 'Moderate nội dung cộng đồng', 'moderation', 'https://aiagent.iai.one/moderate', 'gpt-4', '["content_moderation", "conflict_resolution", "community_guidelines"]'::jsonb, 'high', 13)
  `;
};

/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('ai_messages');
  pgm.dropTable('ai_conversations');
  pgm.dropTable('ai_agents');
};
