/**
 * Activity Logger Utility
 * Helper functions to log all project activities and communications
 */
import { db, activityLog } from './db';

interface LogActivityParams {
  projectId: number;
  action: string;
  entityType: string;
  entityId?: number;
  description: string;
  userId: number;
  userName?: string;
  userRole?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await db.insert(activityLog).values({
      projectId: params.projectId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      description: params.description,
      userId: params.userId,
      userName: params.userName || null,
      userRole: params.userRole || null,
      changes: params.changes ? JSON.stringify(params.changes) : null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : JSON.stringify({}),
      ipAddress: params.ipAddress || null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging failures shouldn't break the app
  }
}

// Convenience functions for common activities

export async function logFileUpload(params: {
  projectId: number;
  fileId: number;
  fileName: string;
  folderType: string;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'uploaded',
    entityType: 'file',
    entityId: params.fileId,
    description: `Uploaded file "${params.fileName}" to ${params.folderType}`,
    userId: params.userId,
    userName: params.userName,
    metadata: { folderType: params.folderType }
  });
}

export async function logFileDelete(params: {
  projectId: number;
  fileId: number;
  fileName: string;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'deleted',
    entityType: 'file',
    entityId: params.fileId,
    description: `Deleted file "${params.fileName}"`,
    userId: params.userId,
    userName: params.userName
  });
}

export async function logRFICreated(params: {
  projectId: number;
  rfiId: number;
  rfiNumber: string;
  subject: string;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'created',
    entityType: 'rfi',
    entityId: params.rfiId,
    description: `Created RFI ${params.rfiNumber}: ${params.subject}`,
    userId: params.userId,
    userName: params.userName
  });
}

export async function logChangeOrderCreated(params: {
  projectId: number;
  changeOrderId: number;
  changeOrderNumber: string;
  title: string;
  costImpact: number;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'created',
    entityType: 'change_order',
    entityId: params.changeOrderId,
    description: `Created Change Order ${params.changeOrderNumber}: ${params.title}`,
    userId: params.userId,
    userName: params.userName,
    metadata: { costImpact: params.costImpact }
  });
}

export async function logSubmittalCreated(params: {
  projectId: number;
  submittalId: number;
  submittalNumber: string;
  title: string;
  csiDivision: string;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'created',
    entityType: 'submittal',
    entityId: params.submittalId,
    description: `Created Submittal ${params.submittalNumber}: ${params.title} (CSI ${params.csiDivision})`,
    userId: params.userId,
    userName: params.userName
  });
}

export async function logDailyReportCreated(params: {
  projectId: number;
  reportId: number;
  reportDate: string;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'created',
    entityType: 'daily_report',
    entityId: params.reportId,
    description: `Submitted Daily Report for ${new Date(params.reportDate).toLocaleDateString()}`,
    userId: params.userId,
    userName: params.userName
  });
}

export async function logComment(params: {
  projectId: number;
  commentId: number;
  entityType: string;
  entityId: number;
  userId: number;
  userName?: string;
}) {
  await logActivity({
    projectId: params.projectId,
    action: 'commented',
    entityType: params.entityType,
    entityId: params.entityId,
    description: `Added a comment on ${params.entityType}`,
    userId: params.userId,
    userName: params.userName,
    metadata: { commentId: params.commentId }
  });
}
