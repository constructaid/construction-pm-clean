/**
 * Admin Backup API - Backup System Status
 * GET /api/admin/backup/status
 *
 * SECURITY: Only ADMIN users can view backup status
 */
import type { APIRoute } from 'astro';
import { apiHandler, requireAuth, UnauthorizedError } from '../../../../lib/api/error-handler';
import { BackupManager } from '../../../../lib/backup/backup-manager';
import { getBackupConfig } from '../../../../lib/backup/config';

export const prerender = false;

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only ADMIN can view backup status
  const user = context.locals.user;
  if (!user || user.role !== 'ADMIN') {
    throw new UnauthorizedError('Only Administrators can view backup status');
  }

  try {
    const config = getBackupConfig();
    const backupManager = new BackupManager(config);

    const backups = await backupManager.listBackups();
    const latestBackup = backups.length > 0 ? backups[0] : null;

    // Calculate storage usage
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

    // Check if latest backup is recent (within 48 hours)
    const isBackupRecent = latestBackup
      ? (Date.now() - new Date(latestBackup.timestamp).getTime()) < (48 * 60 * 60 * 1000)
      : false;

    // Determine overall health
    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];

    if (!latestBackup) {
      health = 'critical';
      issues.push('No backups found');
    } else {
      if (!isBackupRecent) {
        health = 'warning';
        issues.push('Latest backup is more than 48 hours old');
      }
      if (latestBackup.status === 'failed') {
        health = 'critical';
        issues.push('Latest backup failed');
      }
    }

    if (backups.length < 3) {
      health = health === 'healthy' ? 'warning' : health;
      issues.push('Less than 3 backups available');
    }

    return {
      success: true,
      status: {
        health,
        issues,
        backupCount: backups.length,
        totalStorageUsed: totalSize,
        latestBackup: latestBackup ? {
          id: latestBackup.id,
          timestamp: latestBackup.timestamp,
          size: latestBackup.size,
          status: latestBackup.status,
          age: Math.floor((Date.now() - new Date(latestBackup.timestamp).getTime()) / (1000 * 60 * 60)), // hours
        } : null,
        config: {
          retentionDays: config.retentionDays,
          maxBackups: config.maxBackups,
          encryptionEnabled: config.encryptionEnabled,
          cloudStorageEnabled: config.cloudStorageEnabled,
        },
      },
    };
  } catch (error) {
    console.error('[BACKUP API] Failed to get status:', error);
    throw new Error('Failed to retrieve backup status');
  }
});
