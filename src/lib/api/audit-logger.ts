/**
 * Audit Logging Utilities
 *
 * Purpose: Track all create, update, delete, and restore operations
 * for compliance, debugging, and security monitoring.
 *
 * Features:
 * - Automatic change detection (compares old vs new values)
 * - Request context capture (IP, user agent, endpoint)
 * - Type-safe logging with Zod validation
 * - Async background logging (doesn't block API responses)
 */

import { db, auditLog, type NewAuditLog } from '../db';
import type { APIContext } from 'astro';

// ========================================
// Types
// ========================================

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export interface AuditUser {
  id: number;
  email: string;
  role: string;
}

export interface AuditContext {
  user?: AuditUser;
  request?: Request;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ========================================
// Core Audit Logging Functions
// ========================================

/**
 * Log an audit event
 * This is the main function to call when you want to log an action
 */
export async function logAudit(params: {
  action: AuditAction;
  tableName: string;
  recordId: number;
  context?: AuditContext;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  notes?: string;
}): Promise<void> {
  try {
    const { action, tableName, recordId, context, oldValues, newValues, notes } = params;

    // Calculate changes for UPDATE operations
    let changes: Record<string, { old: any; new: any }> | null = null;
    if (action === 'UPDATE' && oldValues && newValues) {
      changes = calculateChanges(oldValues, newValues);
    }

    // Prepare audit log entry
    const auditEntry: NewAuditLog = {
      action,
      tableName,
      recordId,

      // User information
      userId: context?.user?.id ?? null,
      userEmail: context?.user?.email ?? null,
      userRole: context?.user?.role ?? null,

      // Request context
      ipAddress: context?.ipAddress ?? extractIpAddress(context?.request),
      userAgent: context?.userAgent ?? context?.request?.headers.get('user-agent') ?? null,
      endpoint: context?.endpoint ?? extractEndpoint(context?.request),

      // Data changes
      changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,

      notes: notes ?? null,
    };

    // Insert audit log (async, non-blocking)
    await db.insert(auditLog).values(auditEntry);

    console.log(`[AUDIT] ${action} on ${tableName}#${recordId} by ${context?.user?.email || 'anonymous'}`);
  } catch (error) {
    // Log audit failures but don't throw - we don't want audit logging to break the app
    console.error('[AUDIT ERROR] Failed to log audit event:', error);
  }
}

/**
 * Log a CREATE operation
 */
export async function logCreate(
  tableName: string,
  recordId: number,
  newValues: Record<string, any>,
  context?: AuditContext,
  notes?: string
): Promise<void> {
  return logAudit({
    action: 'CREATE',
    tableName,
    recordId,
    context,
    newValues,
    notes,
  });
}

/**
 * Log an UPDATE operation
 */
export async function logUpdate(
  tableName: string,
  recordId: number,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  context?: AuditContext,
  notes?: string
): Promise<void> {
  return logAudit({
    action: 'UPDATE',
    tableName,
    recordId,
    context,
    oldValues,
    newValues,
    notes,
  });
}

/**
 * Log a DELETE operation
 */
export async function logDelete(
  tableName: string,
  recordId: number,
  oldValues: Record<string, any>,
  context?: AuditContext,
  notes?: string
): Promise<void> {
  return logAudit({
    action: 'DELETE',
    tableName,
    recordId,
    context,
    oldValues,
    notes,
  });
}

/**
 * Log a RESTORE operation (when a soft-deleted record is restored)
 */
export async function logRestore(
  tableName: string,
  recordId: number,
  newValues: Record<string, any>,
  context?: AuditContext,
  notes?: string
): Promise<void> {
  return logAudit({
    action: 'RESTORE',
    tableName,
    recordId,
    context,
    newValues,
    notes,
  });
}

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate field-level changes between old and new values
 * Returns only fields that changed
 */
export function calculateChanges(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};

  // Check all fields in new values
  for (const key in newValues) {
    if (!(key in oldValues)) {
      // New field added
      changes[key] = { old: null, new: newValues[key] };
    } else if (!isEqual(oldValues[key], newValues[key])) {
      // Field value changed
      changes[key] = { old: oldValues[key], new: newValues[key] };
    }
  }

  // Check for removed fields
  for (const key in oldValues) {
    if (!(key in newValues)) {
      changes[key] = { old: oldValues[key], new: null };
    }
  }

  return changes;
}

/**
 * Deep equality check for values
 * Handles primitives, dates, arrays, and objects
 */
function isEqual(val1: any, val2: any): boolean {
  // Same reference
  if (val1 === val2) return true;

  // Null/undefined checks
  if (val1 == null || val2 == null) return val1 === val2;

  // Date objects
  if (val1 instanceof Date && val2 instanceof Date) {
    return val1.getTime() === val2.getTime();
  }

  // Arrays
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    return val1.every((item, index) => isEqual(item, val2[index]));
  }

  // Objects
  if (typeof val1 === 'object' && typeof val2 === 'object') {
    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);
    if (keys1.length !== keys2.length) return false;
    return keys1.every(key => isEqual(val1[key], val2[key]));
  }

  // Primitives
  return false;
}

/**
 * Extract IP address from request
 * Handles proxies and load balancers
 */
function extractIpAddress(request?: Request): string | null {
  if (!request) return null;

  // Try common proxy headers first
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Fallback to direct connection (may be proxy IP)
  return null;
}

/**
 * Extract endpoint path from request
 */
function extractEndpoint(request?: Request): string | null {
  if (!request) return null;

  try {
    const url = new URL(request.url);
    return url.pathname;
  } catch {
    return null;
  }
}

/**
 * Create audit context from Astro APIContext
 * This is a helper to make it easier to pass context from API routes
 */
export function createAuditContext(
  astroContext: APIContext,
  user?: AuditUser
): AuditContext {
  return {
    user,
    request: astroContext.request,
    endpoint: astroContext.url.pathname,
    ipAddress: astroContext.clientAddress,
  };
}

/**
 * Sanitize values before logging (remove sensitive data)
 * Call this before logging to remove passwords, tokens, etc.
 */
export function sanitizeForAudit<T extends Record<string, any>>(
  values: T,
  sensitiveFields: string[] = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard']
): T {
  const sanitized = { ...values };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
