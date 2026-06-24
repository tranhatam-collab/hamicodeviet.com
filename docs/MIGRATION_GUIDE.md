# Database Migration Guide

## Overview

This guide documents the database migration framework for HaMi Code Việt using `node-pg-migrate`.

## Setup

### Installation

```bash
cd api
npm install node-pg-migrate pg dotenv
```

### Configuration

Migration database URL is configured in `.env.migrations`:

```
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.aws.neon.tech/neondb?sslmode=require
```

### Scripts

```bash
# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create -- <migration-name>
```

## Migration Files

Migrations are stored in `api/migrations/` with timestamp prefix:

```
20240624000001_initial_schema.js
20240624000002_add_permissions_table.js
```

## Current Schema

### Existing Tables (19)

- users
- profiles
- roles
- user_roles
- sessions
- email_verifications
- password_resets
- guardians
- guardian_links
- policy_versions
- consents
- consent_types
- country_policies
- courses
- lessons_db
- enrollments
- lesson_progress
- subscriptions
- payments
- certificates

### Missing Tables (46)

See `docs/audit/HAMICODEVIET_DATABASE_MIGRATIONS_AUDIT.md` for complete list.

## Migration Strategy

### For Production Database

**IMPORTANT:** The production database already has tables. Do NOT run the initial schema migration directly.

**Safe approach:**

1. **Extract current schema:**
   ```bash
   pg_dump $DATABASE_URL --schema-only > current_schema.sql
   ```

2. **Create baseline migration:**
   - The initial migration should be marked as already applied
   - Use `node-pg-migrate` with `--create-migrations-table` to create the migrations table
   - Manually insert the initial migration as already applied

3. **Create incremental migrations:**
   - Only create migrations for NEW tables/changes
   - Each migration should be idempotent where possible

### For New Development Database

```bash
# Run all migrations
npm run migrate
```

## Migration Best Practices

1. **Always test on staging first**
2. **Backup before migration**
3. **Use transactions** (node-pg-migrate does this by default)
4. **Write rollback functions** for all migrations
5. **Make migrations idempotent** where possible
6. **Never drop columns with data** without migration plan
7. **Document breaking changes**

## Adding New Tables

```bash
# Create migration
npm run migrate:create -- add_products_table

# Edit the migration file
# Implement up() and down() functions

# Run migration
npm run migrate
```

## Adding New Columns

```bash
# Create migration
npm run migrate:create -- add_email_to_products

# Edit the migration file
exports.up = (pgm) => {
  pgm.addColumn('products', 'email', {
    type: 'text',
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('products', 'email');
};

# Run migration
npm run migrate
```

## CI/CD Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run migrations (staging)
  if: github.ref == 'develop'
  run: |
    cd api
    DATABASE_URL=$STAGING_DATABASE_URL npm run migrate

- name: Run migrations (production)
  if: github.ref == 'main'
  run: |
    cd api
    DATABASE_URL=$PRODUCTION_DATABASE_URL npm run migrate
```

## Rollback Procedure

```bash
# Rollback last migration
npm run migrate:down

# Rollback specific migration
node-pg-migrate down 20240624000001_add_products_table --migrations-dir ./migrations
```

## Troubleshooting

### Migration fails

1. Check error message
2. Identify which migration failed
3. Fix the migration file
4. If migration was partially applied, manually fix database state
5. Re-run migration

### Lock issues

If migrations table is locked:

```sql
-- Manually unlock
DELETE FROM node_pgm_migrations;
```

### Schema drift

If schema doesn't match migrations:

1. Extract current schema
2. Compare with expected schema
3. Create corrective migration
4. Document the drift

## Monitoring

Track migration status:

```sql
SELECT * FROM node_pgm_migrations ORDER BY name;
```

## References

- [node-pg-migrate documentation](https://salsita.github.io/node-pg-migrate/)
- [Neon documentation](https://neon.tech/docs)
- [PostgreSQL migration best practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
