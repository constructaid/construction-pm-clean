/**
 * Admin Backup API - List Backups
 * GET /api/admin/backup/list
 *
 * SECURITY: Only ADMIN users can view backups
 */
import type { APIRoute } from 'astro';
import { apiHandler, requireAuth, UnauthorizedError } from '../../../../lib/api/error-handler';
import { BackupManager } from '../../../../lib/backup/backup-manager';
import { getBackupConfig } from '../../../../lib/backup/config';

export const prerender = false;

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only ADMIN can view backups
  const user = context.locals.user;
  if (!user || user.role !== 'ADMIN') {
    throw new UnauthorizedError('Only Administrators can view backups');
  }

  try {
    const config = getBackupConfig();
    const backupManager = new BackupManager(config);

    const backups = await backupManager.listBackups();

    return {
      success: true,
      backups: backups.map(b => ({
        id: b.id,
        timestamp: b.timestamp,
        filename: b.filename,
        size: b.size,
        status: b.status,
        encrypted: b.encrypted,
        compressed: b.compressed,
        tablesCount: b.tablesCount,
        recordsCount: b.recordsCount,
        duration: b.duration,
      })),
      count: backups.length,
    };
  } catch (error) {
    console.error('[BACKUP API] Failed to list backups:', error);
    throw new Error('Failed to retrieve backup list');
  }
});
