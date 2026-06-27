/**
 * P2.2: Marketplace — user-created courses/products for sale
 * @type {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Marketplace listings — user-created content for sale
  pgm.createTable('marketplace_listings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    seller_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    type: { type: 'text', notNull: true, default: 'course' },
    title: { type: 'text', notNull: true },
    title_vi: { type: 'text' },
    description: { type: 'text' },
    description_vi: { type: 'text' },
    price_cents: { type: 'integer', notNull: true, default: 0 },
    currency: { type: 'text', notNull: true, default: 'USD' },
    category: { type: 'text', notNull: true, default: 'programming' },
    tags: { type: 'jsonb', default: '{}' },
    thumbnail_url: { type: 'text' },
    preview_url: { type: 'text' },
    content_metadata: { type: 'jsonb' },
    status: { type: 'text', notNull: true, default: 'draft' },
    review_status: { type: 'text', notNull: true, default: 'pending' },
    review_notes: { type: 'text' },
    reviewed_by: { type: 'uuid', references: 'users(id)' },
    reviewed_at: { type: 'timestamp' },
    age_restriction: { type: 'integer', default: 8 },
    language: { type: 'text', default: 'vi' },
    sales_count: { type: 'integer', notNull: true, default: 0 },
    rating_avg: { type: 'numeric', default: 0 },
    rating_count: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('marketplace_listings', 'seller_id');
  pgm.createIndex('marketplace_listings', ['status', 'review_status']);
  pgm.createIndex('marketplace_listings', 'category');
  pgm.createIndex('marketplace_listings', 'slug');

  // Marketplace purchases — who bought what
  pgm.createTable('marketplace_purchases', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    listing_id: { type: 'uuid', notNull: true, references: 'marketplace_listings(id)', onDelete: 'cascade' },
    buyer_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    payment_id: { type: 'uuid', references: 'payments(id)' },
    price_cents: { type: 'integer', notNull: true },
    currency: { type: 'text', notNull: true, default: 'USD' },
    status: { type: 'text', notNull: true, default: 'completed' },
    refunded_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('marketplace_purchases', 'uq_marketplace_purchase', 'UNIQUE(listing_id, buyer_id)');
  pgm.createIndex('marketplace_purchases', 'buyer_id');

  // Marketplace reviews — buyer ratings
  pgm.createTable('marketplace_reviews', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    listing_id: { type: 'uuid', notNull: true, references: 'marketplace_listings(id)', onDelete: 'cascade' },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'cascade' },
    rating: { type: 'integer', notNull: true },
    review_text: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('marketplace_reviews', 'uq_marketplace_review', 'UNIQUE(listing_id, user_id)');
};

exports.down = (pgm) => {
  pgm.dropTable('marketplace_reviews');
  pgm.dropTable('marketplace_purchases');
  pgm.dropTable('marketplace_listings');
};
