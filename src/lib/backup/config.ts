/**
 * Backup System Configuration
 *
 * Centralized configuration for database backup system
 */

import type { BackupConfig } from './backup-manager';
import * as path from 'path';

/**
 * Get backup configuration from environment variables
 */
export function getBackupConfig(): BackupConfig {
  return {
    // Database connection
    databaseUrl: process.env.DATABASE_URL || '',

    // Backup storage location
    backupDir: process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),

    // Cloud storage configuration (S3-compatible)
    cloudStorageEnabled: process.env.BACKUP_CLOUD_ENABLED === 'true',
    cloudStorageBucket: process.env.BACKUP_CLOUD_BUCKET,
    cloudStorageRegion: process.env.BACKUP_CLOUD_REGION || 'us-east-1',

    // Retention policy
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    maxBackups: parseInt(process.env.BACKUP_MAX_COUNT || '14'),

    // Encryption (HIGHLY RECOMMENDED for production)
    encryptionEnabled: process.env.BACKUP_ENCRYPTION_ENABLED !== 'false', // Enabled by default
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,

    // Monitoring and alerts
    alertEmail: process.env.BACKUP_ALERT_EMAIL,
    webhookUrl: process.env.BACKUP_WEBHOOK_URL,

    // Schedule
    scheduleEnabled: process.env.BACKUP_SCHEDULE_ENABLED === 'true',
    scheduleCron: process.env.BACKUP_SCHEDULE_CRON || '0 2 * * *', // 2 AM daily
  };
}

/**
 * Validate backup configuration
 */
export function validateBackupConfig(config: BackupConfig): string[] {
  const errors: string[] = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (!config.backupDir) {
    errors.push('BACKUP_DIR is required');
  }

  if (config.encryptionEnabled && !config.encryptionKey) {
    errors.push('BACKUP_ENCRYPTION_KEY is required when encryption is enabled');
  }

  if (config.cloudStorageEnabled && !config.cloudStorageBucket) {
    errors.push('BACKUP_CLOUD_BUCKET is required when cloud storage is enabled');
  }

  if (config.retentionDays < 1) {
    errors.push('BACKUP_RETENTION_DAYS must be at least 1');
  }

  if (config.maxBackups < 1) {
    errors.push('BACKUP_MAX_COUNT must be at least 1');
  }

  return errors;
}

/**
 * Get recommended production configuration
 */
export function getProductionRecommendations(): Record<string, string> {
  return {
    'BACKUP_ENCRYPTION_ENABLED': 'true',
    'BACKUP_ENCRYPTION_KEY': '<generate-strong-key>',
    'BACKUP_CLOUD_ENABLED': 'true',
    'BACKUP_CLOUD_BUCKET': 'your-backup-bucket',
    'BACKUP_CLOUD_REGION': 'us-east-1',
    'BACKUP_RETENTION_DAYS': '90', // 3 months
    'BACKUP_MAX_COUNT': '30', // Keep 30 backups
    'BACKUP_SCHEDULE_ENABLED': 'true',
    'BACKUP_SCHEDULE_CRON': '0 2 * * *', // Daily at 2 AM
    'BACKUP_ALERT_EMAIL': 'admin@yourcompany.com',
    'BACKUP_DIR': '/var/backups/constructaid',
  };
}
