/**
 * Admin Backup API - Restore Backup
 * POST /api/admin/backup/restore
 *
 * SECURITY: Only ADMIN users can restore backups
 * WARNING: This is a destructive operation
 */
import type { APIRoute } from 'astro';
import { apiHandler, requireAuth, UnauthorizedError, validateBody } from '../../../../lib/api/error-handler';
import { BackupManager } from '../../../../lib/backup/backup-manager';
import { getBackupConfig } from '../../../../lib/backup/config';
import { z } from 'zod';

export const prerender = false;

const restoreSchema = z.object({
  backupId: z.string().min(1),
  confirmRestore: z.boolean().refine(val => val === true, {
    message: 'You must confirm restoration by setting confirmRestore to true',
  }),
  targetDatabase: z.string().optional(),
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only ADMIN can restore backups
  const user = context.locals.user;
  if (!user || user.role !== 'ADMIN') {
    throw new UnauthorizedError('Only Administrators can restore backups');
  }

  // Validate request body
  const data = await validateBody(context, restoreSchema);

  console.log('[BACKUP API] Restore triggered by admin:', user.email);
  console.log('[BACKUP API] Backup ID:', data.backupId);

  try {
    const config = getBackupConfig();
    const backupManager = new BackupManager(config);

    // Verify backup exists and is valid
    const isValid = await backupManager.verifyBackup(data.backupId);
    if (!isValid) {
      throw new Error('Backup validation failed - backup may be corrupted');
    }

    await backupManager.restoreBackup(data.backupId, data.targetDatabase);

    return {
      success: true,
      message: 'Database restored successfully',
      backupId: data.backupId,
      restoredBy: user.email,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[BACKUP API] Restore failed:', error);
    throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
