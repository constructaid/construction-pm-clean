/**
 * Soft Delete Utility Functions
 * Provides reusable functions for soft delete operations across all tables
 */

import { sql, SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/**
 * Soft delete a record by setting deleted_at timestamp
 * @param table - The Drizzle table
 * @param recordId - The ID of the record to soft delete
 * @param deletedBy - The ID of the user performing the deletion
 * @returns SQL update statement
 */
export function softDelete<T extends PgTable>(
  table: T,
  recordId: number,
  deletedBy: number
): SQL {
  return sql`
    UPDATE ${table}
    SET deleted_at = NOW(), deleted_by = ${deletedBy}
    WHERE id = ${recordId} AND deleted_at IS NULL
  `;
}

/**
 * Restore a soft-deleted record
 * @param table - The Drizzle table
 * @param recordId - The ID of the record to restore
 * @returns SQL update statement
 */
export function restoreSoftDeleted<T extends PgTable>(
  table: T,
  recordId: number
): SQL {
  return sql`
    UPDATE ${table}
    SET deleted_at = NULL, deleted_by = NULL
    WHERE id = ${recordId} AND deleted_at IS NOT NULL
  `;
}

/**
 * Get SQL condition to filter out soft-deleted records
 * Use this in WHERE clauses to exclude deleted records
 */
export function excludeDeleted(): SQL {
  return sql`deleted_at IS NULL`;
}

/**
 * Get SQL condition to filter only soft-deleted records
 * Use this to query deleted records
 */
export function onlyDeleted(): SQL {
  return sql`deleted_at IS NOT NULL`;
}

/**
 * Permanently delete records that have been soft-deleted for a specified period
 * WARNING: This is irreversible!
 * @param table - The Drizzle table
 * @param daysOld - Number of days since soft deletion (default: 2555 days = ~7 years for compliance)
 * @returns SQL delete statement
 */
export function permanentlyDeleteOld<T extends PgTable>(
  table: T,
  daysOld: number = 2555 // 7 years for construction document retention
): SQL {
  // SECURITY: Validate that daysOld is a positive integer to prevent injection
  const safeDays = Math.max(1, Math.floor(Number(daysOld) || 2555));
  if (!Number.isFinite(safeDays) || safeDays < 1) {
    throw new Error('Invalid daysOld parameter: must be a positive number');
  }

  return sql`
    DELETE FROM ${table}
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '${sql.raw(safeDays.toString())} days'
  `;
}

/**
 * Bulk soft delete multiple records
 * @param table - The Drizzle table
 * @param recordIds - Array of record IDs to soft delete
 * @param deletedBy - The ID of the user performing the deletion
 * @returns SQL update statement
 */
export function bulkSoftDelete<T extends PgTable>(
  table: T,
  recordIds: number[],
  deletedBy: number
): SQL {
  return sql`
    UPDATE ${table}
    SET deleted_at = NOW(), deleted_by = ${deletedBy}
    WHERE id = ANY(${recordIds}) AND deleted_at IS NULL
  `;
}

/**
 * Count soft-deleted records for a table
 * @param table - The Drizzle table
 * @returns SQL select statement
 */
export function countDeleted<T extends PgTable>(table: T): SQL {
  return sql`
    SELECT COUNT(*) as count
    FROM ${table}
    WHERE deleted_at IS NOT NULL
  `;
}

/**
 * Get soft-deleted records with deletion metadata
 * @param table - The Drizzle table
 * @param limit - Maximum number of records to return (default: 100)
 * @returns SQL select statement
 */
export function getDeletedRecords<T extends PgTable>(
  table: T,
  limit: number = 100
): SQL {
  return sql`
    SELECT *, deleted_at, deleted_by
    FROM ${table}
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
    LIMIT ${limit}
  `;
}

/**
 * Helper type for tables with soft delete columns
 */
export interface SoftDeletable {
  deletedAt: Date | null;
  deletedBy: number | null;
}

/**
 * Check if a record is soft deleted
 */
export function isDeleted(record: SoftDeletable): boolean {
  return record.deletedAt !== null;
}

/**
 * Filter array of records to exclude soft-deleted ones
 */
export function filterDeleted<T extends SoftDeletable>(records: T[]): T[] {
  return records.filter((record) => !isDeleted(record));
}

/**
 * Filter array of records to only include soft-deleted ones
 */
export function filterOnlyDeleted<T extends SoftDeletable>(records: T[]): T[] {
  return records.filter((record) => isDeleted(record));
}

/**
 * Soft Delete Error Classes
 */
export class SoftDeleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SoftDeleteError';
  }
}

export class RecordAlreadyDeletedException extends SoftDeleteError {
  constructor(table: string, id: number) {
    super(`Record ${id} in ${table} is already deleted`);
    this.name = 'RecordAlreadyDeletedException';
  }
}

export class RecordNotDeletedException extends SoftDeleteError {
  constructor(table: string, id: number) {
    super(`Record ${id} in ${table} is not deleted and cannot be restored`);
    this.name = 'RecordNotDeletedException';
  }
}

/**
 * Type guard to check if a record has soft delete fields
 */
export function hasSoftDeleteFields(
  record: unknown
): record is SoftDeletable {
  return (
    typeof record === 'object' &&
    record !== null &&
    'deletedAt' in record &&
    'deletedBy' in record
  );
}

/**
 * Example usage in API endpoints:
 *
 * // Soft delete a project
 * import { db } from './db';
 * import { projects } from './schema';
 * import { softDelete } from './soft-delete';
 *
 * await db.execute(softDelete(projects, projectId, userId));
 *
 * // Query only active projects (not deleted)
 * import { excludeDeleted } from './soft-delete';
 * const activeProjects = await db
 *   .select()
 *   .from(projects)
 *   .where(excludeDeleted());
 *
 * // Restore a deleted project
 * import { restoreSoftDeleted } from './soft-delete';
 * await db.execute(restoreSoftDeleted(projects, projectId));
 *
 * // Permanently delete old records (run as maintenance job)
 * import { permanentlyDeleteOld } from './soft-delete';
 * await db.execute(permanentlyDeleteOld(projects, 2555)); // 7 years
 */
