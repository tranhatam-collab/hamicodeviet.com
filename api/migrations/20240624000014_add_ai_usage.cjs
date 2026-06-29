module.exports = {
  up(pgm) {
    pgm.createTable('ai_usage', {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('gen_random_uuid()'),
      },
      user_id: {
        type: 'uuid',
        references: 'users(id)',
        onDelete: 'cascade',
      },
      agent_id: {
        type: 'uuid',
        references: 'ai_agents(id)',
        onDelete: 'set null',
      },
      conversation_id: {
        type: 'uuid',
        references: 'ai_conversations(id)',
        onDelete: 'set null',
      },
      tokens_used: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
      model: {
        type: 'text',
        notNull: true,
      },
      provider: {
        type: 'text',
        notNull: true,
        default: 'cloudflare',
      },
      cost_cents: {
        type: 'integer',
        default: 0,
      },
      created_at: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('now()'),
      },
    });

    pgm.createIndex('ai_usage', 'user_id');
    pgm.createIndex('ai_usage', 'agent_id');
    pgm.createIndex('ai_usage', 'created_at');
  },
  down(pgm) {
    pgm.dropTable('ai_usage');
  },
};
