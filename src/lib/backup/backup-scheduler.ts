/**
 * Automated Backup Scheduler
 *
 * Handles scheduled backups using cron patterns
 * Provides backup monitoring and health checks
 */

import { BackupManager, BackupConfig } from './backup-manager';
import { CronJob } from 'cron';

export interface SchedulerConfig extends BackupConfig {
  scheduleCron: string; // e.g., '0 2 * * *' for daily at 2 AM
  healthCheckCron?: string; // e.g., '0 */6 * * *' for every 6 hours
  enableHealthChecks?: boolean;
}

export class BackupScheduler {
  private backupManager: BackupManager;
  private config: SchedulerConfig;
  private backupJob?: CronJob;
  private healthCheckJob?: CronJob;
  private lastBackupTime?: Date;
  private lastBackupStatus?: 'success' | 'failed';
  private consecutiveFailures = 0;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.backupManager = new BackupManager(config);
  }

  /**
   * Start the backup scheduler
   */
  start(): void {
    console.log('[SCHEDULER] Starting backup scheduler...');
    console.log(`[SCHEDULER] Schedule: ${this.config.scheduleCron}`);

    // Start backup job
    this.backupJob = new CronJob(
      this.config.scheduleCron,
      async () => {
        await this.executeScheduledBackup();
      },
      null,
      true,
      'America/New_York' // Adjust timezone as needed
    );

    // Start health check job (if enabled)
    if (this.config.enableHealthChecks && this.config.healthCheckCron) {
      this.healthCheckJob = new CronJob(
        this.config.healthCheckCron,
        async () => {
          await this.performHealthCheck();
        },
        null,
        true,
        'America/New_York'
      );
      console.log(`[SCHEDULER] Health checks enabled: ${this.config.healthCheckCron}`);
    }

    console.log('[SCHEDULER] Scheduler started successfully');
  }

  /**
   * Stop the backup scheduler
   */
  stop(): void {
    console.log('[SCHEDULER] Stopping backup scheduler...');

    if (this.backupJob) {
      this.backupJob.stop();
    }

    if (this.healthCheckJob) {
      this.healthCheckJob.stop();
    }

    console.log('[SCHEDULER] Scheduler stopped');
  }

  /**
   * Execute a scheduled backup
   */
  private async executeScheduledBackup(): Promise<void> {
    console.log('[SCHEDULER] Executing scheduled backup...');

    try {
      const metadata = await this.backupManager.createBackup();

      this.lastBackupTime = new Date();
      this.lastBackupStatus = 'success';
      this.consecutiveFailures = 0;

      console.log(`[SCHEDULER] Scheduled backup completed: ${metadata.filename}`);

    } catch (error) {
      this.lastBackupTime = new Date();
      this.lastBackupStatus = 'failed';
      this.consecutiveFailures++;

      console.error('[SCHEDULER] Scheduled backup failed:', error);

      // Alert if multiple consecutive failures
      if (this.consecutiveFailures >= 3) {
        await this.alertCriticalFailure();
      }
    }
  }

  /**
   * Perform health check on backup system
   */
  private async performHealthCheck(): Promise<void> {
    console.log('[SCHEDULER] Performing backup health check...');

    const issues: string[] = [];

    // Check 1: Last backup recency
    if (this.lastBackupTime) {
      const hoursSinceLastBackup = (Date.now() - this.lastBackupTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastBackup > 48) {
        issues.push(`No successful backup in ${Math.floor(hoursSinceLastBackup)} hours`);
      }
    } else {
      issues.push('No backup history found');
    }

    // Check 2: Recent backup status
    if (this.lastBackupStatus === 'failed') {
      issues.push('Last backup failed');
    }

    // Check 3: Consecutive failures
    if (this.consecutiveFailures > 0) {
      issues.push(`${this.consecutiveFailures} consecutive backup failures`);
    }

    // Check 4: Backup storage space
    const backups = await this.backupManager.listBackups();
    if (backups.length === 0) {
      issues.push('No backups found in storage');
    }

    // Check 5: Verify latest backup integrity
    if (backups.length > 0) {
      const latestBackup = backups[0];
      const isValid = await this.backupManager.verifyBackup(latestBackup.id);
      if (!isValid) {
        issues.push('Latest backup failed integrity check');
      }
    }

    // Report health status
    if (issues.length === 0) {
      console.log('[SCHEDULER] Health check passed - All systems nominal');
    } else {
      console.warn('[SCHEDULER] Health check found issues:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
      await this.alertHealthIssues(issues);
    }
  }

  /**
   * Alert on critical backup failures
   */
  private async alertCriticalFailure(): Promise<void> {
    console.error(`[SCHEDULER] CRITICAL: ${this.consecutiveFailures} consecutive backup failures`);

    // Send critical alert (email, SMS, webhook, etc.)
    if (this.config.alertEmail) {
      console.log(`[SCHEDULER] Would send CRITICAL alert to ${this.config.alertEmail}`);
    }

    if (this.config.webhookUrl) {
      console.log(`[SCHEDULER] Would send CRITICAL webhook to ${this.config.webhookUrl}`);
    }
  }

  /**
   * Alert on health check issues
   */
  private async alertHealthIssues(issues: string[]): Promise<void> {
    console.warn('[SCHEDULER] Health check issues detected');

    if (this.config.alertEmail) {
      console.log(`[SCHEDULER] Would send health alert to ${this.config.alertEmail}`);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    running: boolean;
    lastBackupTime?: Date;
    lastBackupStatus?: string;
    consecutiveFailures: number;
    nextScheduledRun?: Date;
  } {
    return {
      running: this.backupJob?.running || false,
      lastBackupTime: this.lastBackupTime,
      lastBackupStatus: this.lastBackupStatus,
      consecutiveFailures: this.consecutiveFailures,
      nextScheduledRun: this.backupJob?.nextDate()?.toJSDate(),
    };
  }

  /**
   * Trigger immediate backup (manual override)
   */
  async triggerManualBackup(): Promise<void> {
    console.log('[SCHEDULER] Manual backup triggered');
    await this.executeScheduledBackup();
  }
}
