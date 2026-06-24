/**
 * Automated backup script for Neon PostgreSQL
 * Creates daily backup branches and cleans up old backups
 */

import { execSync } from 'child_process';
import { neon } from '@neondatabase/serverless';

const PROJECT_ID = 'blue-thunder-03199745';
const BACKUP_RETENTION_DAYS = 30;
const SOURCE_BRANCH = 'main';

/**
 * Create a backup branch
 */
async function createBackup(): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const branchName = `backup-${date}-${timestamp}`;

  console.log(`Creating backup branch: ${branchName}`);

  try {
    // Create branch using Neon CLI
    execSync(
      `npx neonctl branches create --name ${branchName} --source ${SOURCE_BRANCH} --project-id ${PROJECT_ID}`,
      { stdio: 'inherit' }
    );

    console.log(`✓ Backup created: ${branchName}`);
    return branchName;
  } catch (error) {
    console.error(`✗ Failed to create backup: ${error}`);
    throw error;
  }
}

/**
 * List all backup branches
 */
async function listBackupBranches(): Promise<string[]> {
  try {
    const output = execSync(
      `npx neonctl branches list --project-id ${PROJECT_ID} --format json`,
      { encoding: 'utf-8' }
    ).toString();

    const branches = JSON.parse(output);
    return branches
      .filter((b: any) => b.name.startsWith('backup-'))
      .map((b: any) => b.name);
  } catch (error) {
    console.error(`✗ Failed to list branches: ${error}`);
    return [];
  }
}

/**
 * Delete old backup branches
 */
async function cleanupOldBackups(): Promise<void> {
  console.log('Cleaning up old backups...');

  const backupBranches = await listBackupBranches();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);

  let deletedCount = 0;

  for (const branch of backupBranches) {
    try {
      // Extract date from branch name (format: backup-YYYY-MM-DD-timestamp)
      const dateMatch = branch.match(/backup-(\d{4}-\d{2}-\d{2})-/);
      if (!dateMatch) continue;

      const branchDate = new Date(dateMatch[1]);

      if (branchDate < cutoffDate) {
        console.log(`  Deleting old backup: ${branch}`);
        execSync(
          `npx neonctl branches delete ${branch} --project-id ${PROJECT_ID}`,
          { stdio: 'inherit' }
        );
        deletedCount++;
      }
    } catch (error) {
      console.error(`  ✗ Failed to delete ${branch}: ${error}`);
    }
  }

  console.log(`✓ Deleted ${deletedCount} old backup(s)`);
}

/**
 * Verify backup integrity
 */
async function verifyBackup(branchName: string): Promise<boolean> {
  console.log(`Verifying backup: ${branchName}`);

  try {
    // Get branch connection string
    const output = execSync(
      `npx neonctl connection-string --project-id ${PROJECT_ID} --branch ${branchName}`,
      { encoding: 'utf-8' }
    ).toString();

    const connectionString = output.trim();
    const db = neon(connectionString);

    // Run basic health check
    const result = await db`SELECT COUNT(*) as count FROM users`;
    const userCount = result[0].count;

    console.log(`  ✓ User count: ${userCount}`);
    console.log(`✓ Backup verified: ${branchName}`);
    return true;
  } catch (error) {
    console.error(`✗ Backup verification failed: ${error}`);
    return false;
  }
}

/**
 * Main backup function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('Neon Database Backup');
  console.log('='.repeat(50));
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Source: ${SOURCE_BRANCH}`);
  console.log(`Retention: ${BACKUP_RETENTION_DAYS} days`);
  console.log('='.repeat(50));

  try {
    // Create backup
    const branchName = await createBackup();

    // Verify backup
    const verified = await verifyBackup(branchName);
    if (!verified) {
      console.error('Backup verification failed, aborting');
      process.exit(1);
    }

    // Cleanup old backups
    await cleanupOldBackups();

    console.log('='.repeat(50));
    console.log('✓ Backup completed successfully');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('='.repeat(50));
    console.error('✗ Backup failed');
    console.error('='.repeat(50));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createBackup, cleanupOldBackups, verifyBackup };
