// Fix AI schema (add ai_agents, fix ai_conversations) + seed country policies
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // === 1. Fix AI schema ===
  console.log('--- Fixing AI schema ---');

  // Create ai_agents table
  await client.query(`
    CREATE TABLE IF NOT EXISTS ai_agents (
      id text PRIMARY KEY,
      name text NOT NULL,
      name_vi text NOT NULL,
      description text,
      description_vi text,
      agent_type text NOT NULL,
      endpoint text,
      model text,
      capabilities jsonb NOT NULL,
      safety_level text NOT NULL DEFAULT 'standard',
      age_restriction integer DEFAULT 13,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log('OK: ai_agents table');

  // Add missing columns to ai_conversations
  try { await client.query(`ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS agent_id text REFERENCES ai_agents(id) ON DELETE RESTRICT`); } catch(e) {}
  try { await client.query(`ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`); } catch(e) {}
  try { await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_conversations_agent ON ai_conversations(agent_id)`); } catch(e) {}
  try { await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status)`); } catch(e) {}
  console.log('OK: ai_conversations columns added');

  // Add metadata to ai_messages
  try { await client.query(`ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS metadata jsonb`); } catch(e) {}
  console.log('OK: ai_messages metadata column');

  // Insert default AI agents
  const agents = [
    ['tutor', 'AI Tutor', 'AI Gia su', 'Personalized learning assistant', 'Tro ly hoc tap ca nhan hoa', 'tutor', 'https://aiagent.iai.one/tutor', 'gpt-4', '["explanation","problem_solving","code_help"]', 'standard', 13],
    ['mentor', 'AI Mentor', 'AI Mentor', 'Career guidance and mentorship', 'Huong dan nghe nghiep va mentorship', 'mentor', 'https://aiagent.iai.one/mentor', 'gpt-4', '["career_guidance","skill_development","goal_setting"]', 'standard', 16],
    ['code_reviewer', 'Code Reviewer', 'Reviewer Code', 'Code review and suggestions', 'Review code va goi y cai thien', 'code', 'https://aiagent.iai.one/code', 'gpt-4', '["code_review","optimization","best_practices"]', 'standard', 13],
    ['quiz_generator', 'Quiz Generator', 'Tao Quiz', 'Generate quizzes and assessments', 'Tao quiz va danh gia', 'quiz', 'https://aiagent.iai.one/quiz', 'gpt-4', '["quiz_generation","assessment","feedback"]', 'standard', 13],
    ['content_creator', 'Content Creator', 'Tao Noi dung', 'Generate learning content', 'Tao noi dung hoc tap', 'content', 'https://aiagent.iai.one/content', 'gpt-4', '["content_generation","explanation","examples"]', 'standard', 13],
    ['translator', 'Translator', 'Dich thuat', 'Vietnamese-English translation', 'Dich thuat Viet-Anh', 'translation', 'https://aiagent.iai.one/translate', 'gpt-4', '["translation","localization","cultural_context"]', 'standard', 8],
    ['analyzer', 'Learning Analyzer', 'Phan tich Hoc tap', 'Analyze learning patterns and progress', 'Phan tich mo hinh hoc tap va tien do', 'analytics', 'https://aiagent.iai.one/analytics', 'gpt-4', '["progress_analysis","weakness_identification","recommendations"]', 'standard', 13],
    ['safety_monitor', 'Safety Monitor', 'Giam sat An toan', 'Monitor child safety and content', 'Giam sat an toan tre em va noi dung', 'safety', 'https://aiagent.iai.one/safety', 'gpt-4', '["content_filtering","behavior_monitoring","alert_generation"]', 'high', 8],
    ['accessibility', 'Accessibility Helper', 'Tro ly Kha nang truy cap', 'Help with accessibility features', 'Tro giup voi tinh nang kha nang truy cap', 'accessibility', 'https://aiagent.iai.one/accessibility', 'gpt-4', '["screen_reader","voice_commands","simplified_content"]', 'standard', 8],
    ['project_helper', 'Project Helper', 'Tro ly Du an', 'Assist with project development', 'Tro giup phat trien du an', 'project', 'https://aiagent.iai.one/project', 'gpt-4', '["project_planning","code_assistance","debugging"]', 'standard', 13],
    ['community_moderator', 'Community Moderator', 'Moderator Cong dong', 'Moderate community content', 'Moderate noi dung cong dong', 'moderation', 'https://aiagent.iai.one/moderate', 'gpt-4', '["content_moderation","conflict_resolution","community_guidelines"]', 'high', 13],
  ];

  for (const a of agents) {
    await client.query(
      `INSERT INTO ai_agents (id, name, name_vi, description, description_vi, agent_type, endpoint, model, capabilities, safety_level, age_restriction)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       ON CONFLICT (id) DO NOTHING`,
      a
    );
  }
  console.log('OK: ' + agents.length + ' AI agents seeded');

  // === 2. Fix country policies ===
  console.log('\n--- Fixing country policies ---');

  // Check current columns
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='country_policies' ORDER BY ordinal_position");
  console.log('country_policies columns: ' + cols.rows.map(r => r.column_name).join(', '));

  // Seed country policies
  const countries = [
    // VN
    ['VN', 'Vietnam', 'ACTIVE', 18, 16, false, true, 8, 'VND', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // US
    ['US', 'United States', 'ACTIVE', 18, 13, true, true, 13, 'USD', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // GB
    ['GB', 'United Kingdom', 'ACTIVE', 18, 13, true, true, 13, 'GBP', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // SG
    ['SG', 'Singapore', 'ACTIVE', 18, 13, true, true, 13, 'SGD', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // AU
    ['AU', 'Australia', 'ACTIVE', 18, 13, true, true, 13, 'AUD', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // CA
    ['CA', 'Canada', 'ACTIVE', 18, 13, true, true, 13, 'CAD', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // KR
    ['KR', 'South Korea', 'ACTIVE', 19, 14, true, true, 14, 'KRW', '["paypal"]', '1.0', '1.0', true, true, true, true],
    // JP
    ['JP', 'Japan', 'ACTIVE', 18, 13, true, true, 13, 'JPY', '["paypal"]', '1.0', '1.0', true, true, true, true],
  ];

  // Get actual column names to build insert
  const colNames = cols.rows.map(r => r.column_name);
  console.log('Inserting countries...');

  for (const ctry of countries) {
    // Map to actual columns - use upsert
    // Check if row exists
    const existing = await client.query('SELECT 1 FROM country_policies WHERE country_code = $1', [ctry[0]]);
    if (existing.rows.length === 0) {
      // Insert with whatever columns exist
      if (colNames.includes('marketplace_allowed')) {
        await client.query(
          `INSERT INTO country_policies (country_code, country_name, service_status, age_of_majority, age_of_digital_consent, guardian_required_for_free_account, guardian_required_for_paid_account, child_assent_age, currency, payment_methods, terms_version, privacy_version, marketplace_allowed, public_portfolio_allowed, ai_features_allowed, creator_program_allowed)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16)
           ON CONFLICT (country_code) DO NOTHING`,
          ctry
        );
      } else {
        await client.query(
          `INSERT INTO country_policies (country_code, country_name, service_status, age_of_majority, age_of_digital_consent, guardian_required_for_free_account, guardian_required_for_paid_account, child_assent_age, currency, payment_methods, terms_version, privacy_version)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
           ON CONFLICT (country_code) DO NOTHING`,
          ctry.slice(0, 12)
        );
      }
      console.log('INSERTED: ' + ctry[0]);
    } else {
      console.log('EXISTS: ' + ctry[0]);
    }
  }

  // Verify
  const count = await client.query('SELECT count(*) as cnt FROM country_policies');
  console.log('Total country policies: ' + count.rows[0].cnt);

  // Verify AI agents
  const agentCount = await client.query('SELECT count(*) as cnt FROM ai_agents');
  console.log('Total AI agents: ' + agentCount.rows[0].cnt);

  await client.end();
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
