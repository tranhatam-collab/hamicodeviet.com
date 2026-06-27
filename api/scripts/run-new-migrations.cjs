// Run only the new migrations (002-009) that add tables not yet in DB
// Migration 001 (initial schema) is already marked as run
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Check which tables are missing
  const existing = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
  const existingTables = new Set(existing.rows.map(r => r.tablename));

  const migrations = [
    {
      name: '20240624000002_add_audit_tables',
      tables: ['audit_logs'],
      sql: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          actor_id uuid,
          actor_type text NOT NULL DEFAULT 'user',
          action text NOT NULL,
          resource_type text,
          resource_id text,
          changes jsonb,
          ip text,
          user_agent text,
          request_id text,
          created_at timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
      `
    },
    {
      name: '20240624000003_add_permissions_system',
      tables: ['permissions', 'role_permissions'],
      sql: `
        CREATE TABLE IF NOT EXISTS permissions (
          id text PRIMARY KEY,
          resource_type text NOT NULL,
          action text NOT NULL,
          description text,
          created_at timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id text NOT NULL,
          permission_id text NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY (role_id, permission_id)
        );
        INSERT INTO permissions (id, resource_type, action, description) VALUES
          ('products.read', 'products', 'read', 'View products'),
          ('products.write', 'products', 'write', 'Create/edit products'),
          ('products.delete', 'products', 'delete', 'Delete products'),
          ('users.read', 'users', 'read', 'View users'),
          ('users.write', 'users', 'write', 'Edit users'),
          ('users.delete', 'users', 'delete', 'Delete users'),
          ('refunds.approve', 'refunds', 'approve', 'Approve refunds'),
          ('refunds.reject', 'refunds', 'reject', 'Reject refunds'),
          ('entitlements.grant', 'entitlements', 'grant', 'Grant entitlements'),
          ('entitlements.revoke', 'entitlements', 'revoke', 'Revoke entitlements'),
          ('admin.access', 'admin', 'access', 'Access admin panel')
        ON CONFLICT DO NOTHING;
      `
    },
    {
      name: '20240624000004_add_mfa_tables',
      tables: ['mfa_secrets', 'mfa_attempts'],
      sql: `
        CREATE TABLE IF NOT EXISTS mfa_secrets (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          secret text NOT NULL,
          enabled boolean NOT NULL DEFAULT false,
          verified boolean NOT NULL DEFAULT false,
          backup_codes text[] NOT NULL DEFAULT '{}',
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS mfa_attempts (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code text,
          success boolean NOT NULL,
          ip text,
          user_agent text,
          created_at timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user ON mfa_attempts(user_id);
      `
    },
    {
      name: '20240624000005_add_child_safety',
      tables: ['child_safety_settings'],
      sql: `
        CREATE TABLE IF NOT EXISTS child_safety_settings (
          user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          min_age_for_self_signup integer DEFAULT 18,
          guardian_required_for_under integer DEFAULT 13,
          guardian_consent_required_for_under integer DEFAULT 16,
          ai_restrictions_for_under jsonb,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
      `
    },
    {
      name: '20240624000006_add_product_system',
      tables: ['products', 'prices', 'plans'],
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text,
          type text NOT NULL DEFAULT 'subscription',
          active boolean NOT NULL DEFAULT true,
          metadata jsonb,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS prices (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          amount_cents integer NOT NULL,
          currency text NOT NULL DEFAULT 'USD',
          interval text,
          active boolean NOT NULL DEFAULT true,
          metadata jsonb,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS plans (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          description text,
          price_cents integer NOT NULL,
          currency text NOT NULL DEFAULT 'USD',
          interval text NOT NULL DEFAULT 'month',
          active boolean NOT NULL DEFAULT true,
          features jsonb,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
      `
    },
    {
      name: '20240624000007_add_entitlement_system',
      tables: ['entitlements'],
      sql: `
        CREATE TABLE IF NOT EXISTS entitlements (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          entitlement_type text NOT NULL,
          resource_type text NOT NULL,
          resource_id text,
          source text NOT NULL DEFAULT 'subscription',
          source_id text,
          active boolean NOT NULL DEFAULT true,
          expires_at timestamp,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
        CREATE INDEX IF NOT EXISTS idx_entitlements_type ON entitlements(entitlement_type, resource_type, resource_id);
      `
    },
    {
      name: '20240624000008_add_refund_system',
      tables: ['refunds'],
      sql: `
        CREATE TABLE IF NOT EXISTS refunds (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount_cents integer NOT NULL,
          currency text NOT NULL DEFAULT 'USD',
          reason text,
          status text NOT NULL DEFAULT 'pending',
          paypal_refund_id text,
          processed_by uuid,
          processed_at timestamp,
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id);
        CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
      `
    },
    {
      name: '20240624000009_add_ai_system',
      tables: ['ai_conversations', 'ai_messages', 'ai_usage'],
      sql: `
        CREATE TABLE IF NOT EXISTS ai_conversations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title text,
          model text NOT NULL DEFAULT 'gpt-4o-mini',
          created_at timestamp NOT NULL DEFAULT now(),
          updated_at timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS ai_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
          role text NOT NULL,
          content text NOT NULL,
          tokens integer,
          created_at timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS ai_usage (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tokens_used integer NOT NULL,
          model text,
          created_at timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
      `
    },
  ];

  for (const m of migrations) {
    const missing = m.tables.filter(t => !existingTables.has(t));
    if (missing.length === 0) {
      console.log('SKIP (all tables exist): ' + m.name);
      continue;
    }
    console.log('RUNNING: ' + m.name + ' (missing: ' + missing.join(', ') + ')');
    try {
      await client.query(m.sql);
      console.log('  OK: ' + m.name);
    } catch (e) {
      console.log('  ERR: ' + m.name + ' - ' + e.message);
    }
  }

  await client.end();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
