# Backup & Disaster Recovery Guide

## Overview

This guide documents the backup and disaster recovery strategy for HaMi Code Việt.

## Current State

**Neon PostgreSQL:**
- Provider: Neon (serverless PostgreSQL)
- Project: blue-thunder-03199745
- Branches: main (production), staging (staging)
- Built-in: Point-in-time recovery (PITR)
- **Current:** No automated backups configured

## Backup Strategy

### 1. Neon Built-in Features

**Point-in-Time Recovery (PITR):**
- Automatic WAL archiving
- Can restore to any point in time (up to 7 days)
- No additional configuration needed
- **Limitation:** Only 7 days retention

**Branching:**
- Can create branches for backups
- Branches are independent copies
- Can restore from branch
- **Limitation:** Manual process

### 2. Automated Backup Strategy

**Recommended Configuration:**

**Daily Full Backups:**
- Schedule: Daily at 2:00 AM UTC
- Retention: 30 days
- Storage: Neon branch or external storage

**Weekly Full Backups:**
- Schedule: Every Sunday at 2:00 AM UTC
- Retention: 90 days
- Storage: External storage (S3, Backblaze, etc.)

**Hourly Incremental Backups:**
- Schedule: Every hour
- Retention: 7 days
- Storage: Neon branch

### 3. Backup Implementation

#### Option 1: Neon Branch Backups (Recommended)

**Advantages:**
- Native to Neon
- No external dependencies
- Fast restore
- Cost-effective

**Implementation:**

```bash
# Create daily backup branch
npx neonctl branches create --name backup-$(date +%Y%m%d) --source main

# Delete old backups (older than 30 days)
npx neonctl branches list --project-id blue-thunder-03199745 | \
  grep backup- | \
  awk '{print $1}' | \
  while read branch; do
    # Check if older than 30 days
    # Delete if true
  done
```

**Automation Script:**

```javascript
// scripts/backup.js
import { execSync } from 'child_process';
import { neon } from '@neondatabase/serverless';

const PROJECT_ID = 'blue-thunder-03199745';
const BACKUP_RETENTION_DAYS = 30;

async function createBackup() {
  const date = new Date().toISOString().split('T')[0];
  const branchName = `backup-${date}`;

  console.log(`Creating backup branch: ${branchName}`);

  // Create branch using Neon CLI
  execSync(`npx neonctl branches create --name ${branchName} --source main --project-id ${PROJECT_ID}`);

  console.log(`Backup created: ${branchName}`);
}

async function cleanupOldBackups() {
  console.log('Cleaning up old backups...');

  // List branches
  const branches = execSync(`npx neonctl branches list --project-id ${PROJECT_ID}`).toString();
  const backupBranches = branches.split('\n')
    .filter(line => line.includes('backup-'))
    .map(line => line.split(' ')[0]);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

  for (const branch of backupBranches) {
    const branchDate = new Date(branch.replace('backup-', ''));
    if (branchDate < cutoffDate) {
      console.log(`Deleting old backup: ${branch}`);
      execSync(`npx neonctl branches delete ${branch} --project-id ${PROJECT_ID}`);
    }
  }
}

async function main() {
  try {
    await createBackup();
    await cleanupOldBackups();
    console.log('Backup completed successfully');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

main();
```

**Schedule with Cron:**

```bash
# Add to crontab
0 2 * * * cd /path/to/hamicodeviet.com/api && node scripts/backup.js
```

#### Option 2: External Storage Backup

**Advantages:**
- Offsite storage
- Longer retention
- Multiple storage options

**Implementation:**

```javascript
// scripts/backup-to-s3.js
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function backupToS3() {
  const sql = neon(process.env.DATABASE_URL);
  const date = new Date().toISOString().split('T')[0];

  // Dump schema
  const schema = await sql`SELECT * FROM information_schema.tables`;
  
  // Dump data (simplified - use pg_dump for production)
  const data = await sql`SELECT * FROM users LIMIT 1000`;

  // Upload to S3
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `backups/${date}/schema.json`,
    Body: JSON.stringify(schema),
  }));

  console.log(`Backup uploaded to S3: backups/${date}/`);
}
```

## Recovery Strategy

### 1. Point-in-Time Recovery (Neon PITR)

**Use Case:** Restore to specific time within 7 days

**Steps:**
1. Go to Neon dashboard
2. Select project
3. Click "Time travel"
4. Select desired time
5. Click "Restore"
6. Create new branch from restored state

**RPO:** 7 days (Neon default)
**RTO:** 5-10 minutes

### 2. Branch Restore

**Use Case:** Restore from specific backup branch

**Steps:**
1. List backup branches
2. Select desired backup branch
3. Switch main branch to backup
4. Or create new branch from backup

**RPO:** 1 day (daily backup)
**RTO:** 5-10 minutes

### 3. Full Database Restore

**Use Case:** Complete database recovery

**Steps:**
1. Stop application
2. Drop current database
3. Restore from backup
4. Verify data integrity
5. Restart application

**RPO:** 1 day (daily backup)
**RTO:** 30-60 minutes

## Recovery Testing

### Monthly Restore Test

**Procedure:**
1. Create test branch from latest backup
2. Verify data integrity
3. Run smoke tests
4. Document results
5. Delete test branch

**Automation:**

```javascript
// scripts/test-restore.js
async function testRestore() {
  const date = new Date().toISOString().split('T')[0];
  const testBranch = `restore-test-${date}`;

  console.log(`Creating test restore branch: ${testBranch}`);

  // Create branch from latest backup
  execSync(`npx neonctl branches create --name ${testBranch} --source backup-${date} --project-id ${PROJECT_ID}`);

  // Connect to test branch
  const testDbUrl = getTestBranchUrl(testBranch);
  const testDb = neon(testDbUrl);

  // Verify data integrity
  const userCount = await testDb`SELECT COUNT(*) FROM users`;
  console.log(`User count: ${userCount}`);

  // Run smoke tests
  await runSmokeTests(testDb);

  // Delete test branch
  execSync(`npx neonctl branches delete ${testBranch} --project-id ${PROJECT_ID}`);

  console.log('Restore test completed successfully');
}
```

## RPO/RTO Definition

**RPO (Recovery Point Objective):** 1 day
- Maximum acceptable data loss
- Based on daily backup schedule

**RTO (Recovery Time Objective):** 1 hour
- Maximum acceptable downtime
- Based on branch restore time

## Incident Owner

**Primary:** Database Administrator
**Secondary:** DevOps Engineer
**Escalation:** CTO

## Rollback Procedure

### Application Rollback

**Scenario:** Deployment caused database corruption

**Steps:**
1. Stop application
2. Identify last known good backup
3. Restore database from backup
4. Verify data integrity
5. Restart application
6. Monitor for issues

### Database Rollback

**Scenario:** Migration failed

**Steps:**
1. Stop application
2. Run migration rollback
3. Verify schema integrity
4. Restart application
5. Monitor for issues

## Disaster Recovery Plan

### Scenario 1: Database Corruption

**Detection:**
- Application errors
- Database connection failures
- Data inconsistency

**Response:**
1. Stop application
2. Identify corruption scope
3. Restore from last known good backup
4. Verify data integrity
5. Restart application
6. Monitor for issues

**RTO:** 1 hour
**RPO:** 1 day

### Scenario 2: Data Center Outage

**Detection:**
- Neon service down
- Connection failures
- Status page alerts

**Response:**
1. Switch to read-only mode
2. Use cached data where possible
3. Wait for Neon recovery
4. Monitor status page
5. Once recovered, verify data integrity

**RTO:** Dependent on Neon
**RPO:** Dependent on Neon

### Scenario 3: Accidental Data Deletion

**Detection:**
- User reports missing data
- Audit logs show deletion
- Data inconsistency

**Response:**
1. Stop application
2. Identify deletion time
3. Restore from backup before deletion
4. Verify data integrity
5. Restart application
6. Investigate root cause
7. Implement preventive measures

**RTO:** 1 hour
**RPO:** 1 day

## Backup Verification

### Daily Checks

- Verify backup job ran successfully
- Check backup file size
- Verify backup file integrity

### Weekly Checks

- Test restore from weekly backup
- Verify data integrity
- Document results

### Monthly Checks

- Full disaster recovery drill
- Test all recovery scenarios
- Update documentation

## Monitoring

### Backup Job Monitoring

**Metrics:**
- Backup job success rate
- Backup job duration
- Backup file size
- Backup retention compliance

**Alerts:**
- Backup job failed
- Backup job took too long
- Backup file too small
- Backup retention violation

### Database Health Monitoring

**Metrics:**
- Connection pool usage
- Query performance
- Storage usage
- Replication lag

**Alerts:**
- Connection pool > 80%
- Query time > 5s
- Storage > 80%
- Replication lag > 1s

## Next Steps

1. **Implement automated backup script** (Neon branch approach)
2. **Schedule backup job** (cron or GitHub Actions)
3. **Implement restore test script**
4. **Schedule monthly restore tests**
5. **Set up monitoring and alerting**
6. **Document incident response procedures**
7. **Train team on recovery procedures**

## References

- [Neon documentation](https://neon.tech/docs)
- [Neon branching](https://neon.tech/docs/manage/branches)
- [Neon point-in-time recovery](https://neon.tech/docs/manage/pitr)
- [AWS S3 documentation](https://docs.aws.amazon.com/s3/)
