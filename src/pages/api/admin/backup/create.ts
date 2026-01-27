/**
 * Admin Backup API - Create Backup
 * POST /api/admin/backup/create
 *
 * SECURITY: Only ADMIN users can trigger backups
 */
import type { APIRoute } from 'astro';
import { apiHandler, requireAuth, UnauthorizedError } from '../../../../lib/api/error-handler';
import { BackupManager } from '../../../../lib/backup/backup-manager';
import { getBackupConfig } from '../../../../lib/backup/config';

export const prerender = false;

export const POST: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only ADMIN can trigger backups
  const user = context.locals.user;
  if (!user || user.role !== 'ADMIN') {
    throw new UnauthorizedError('Only Administrators can trigger backups');
  }

  console.log('[BACKUP API] Manual backup triggered by admin:', user.email);

  try {
    const config = getBackupConfig();
    const backupManager = new BackupManager(config);

    const metadata = await backupManager.createBackup();

    return {
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: metadata.id,
        filename: metadata.filename,
        size: metadata.size,
        timestamp: metadata.timestamp,
        duration: metadata.duration,
        encrypted: metadata.encrypted,
        compressed: metadata.compressed,
        checksum: metadata.checksum,
      },
    };
  } catch (error) {
    console.error('[BACKUP API] Backup failed:', error);
    throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
