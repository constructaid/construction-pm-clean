/**
 * Database Indexes for ConstructAid
 *
 * These indexes are designed to improve query performance for common operations.
 * Run `npm run db:generate` after adding indexes to generate migrations.
 *
 * Index naming convention: idx_{table}_{column(s)}
 */
import { index } from 'drizzle-orm/pg-core';
import {
  projects,
  tasks,
  rfis,
  changeOrders,
  submittals,
  dailyReports,
  fileAttachments,
  activityLog,
  comments,
  projectInvitations,
  projectTeamMembers,
  safetyMeetings,
  safetyInspections,
  incidentReports,
  jobHazardAnalyses,
  workPermits,
  craneInspections,
  safetyTraining,
  workerCertifications,
  fieldInspections,
  materialDeliveries,
  subcontractorCoordination,
  superintendentNotes,
  auditLog,
  bidPackages,
  costEstimates,
  costEstimateLineItems,
} from './schema';

/**
 * Project-related indexes
 * These support the most common queries: listing projects, filtering by status,
 * finding by user, and date-based sorting
 */
export const projectIndexes = {
  // Filter by status (very common for dashboard views)
  statusIdx: index('idx_projects_status').on(projects.status),

  // Filter by owner/GC (for user-specific project lists)
  ownerIdx: index('idx_projects_owner_id').on(projects.ownerId),
  gcIdx: index('idx_projects_gc_id').on(projects.generalContractorId),
  createdByIdx: index('idx_projects_created_by').on(projects.createdBy),

  // Date-based sorting (for recent projects)
  createdAtIdx: index('idx_projects_created_at').on(projects.createdAt),
  updatedAtIdx: index('idx_projects_updated_at').on(projects.updatedAt),

  // Soft delete filtering (almost every query excludes deleted)
  deletedAtIdx: index('idx_projects_deleted_at').on(projects.deletedAt),

  // Archive status
  archivedIdx: index('idx_projects_is_archived').on(projects.isArchived),

  // Composite: active projects by status (most common query pattern)
  activeStatusIdx: index('idx_projects_active_status').on(projects.deletedAt, projects.status),
};

/**
 * Task indexes
 * Support task lists, filtering by project/user/status
 */
export const taskIndexes = {
  projectIdx: index('idx_tasks_project_id').on(tasks.projectId),
  statusIdx: index('idx_tasks_status').on(tasks.status),
  priorityIdx: index('idx_tasks_priority').on(tasks.priority),
  dueDateIdx: index('idx_tasks_due_date').on(tasks.dueDate),
  assignedByIdx: index('idx_tasks_assigned_by').on(tasks.assignedBy),
  deletedAtIdx: index('idx_tasks_deleted_at').on(tasks.deletedAt),
  createdAtIdx: index('idx_tasks_created_at').on(tasks.createdAt),

  // Composite: tasks by project and status (most common query)
  projectStatusIdx: index('idx_tasks_project_status').on(tasks.projectId, tasks.status),
};

/**
 * RFI indexes
 */
export const rfiIndexes = {
  projectIdx: index('idx_rfis_project_id').on(rfis.projectId),
  statusIdx: index('idx_rfis_status').on(rfis.status),
  submittedByIdx: index('idx_rfis_submitted_by').on(rfis.submittedBy),
  assignedToIdx: index('idx_rfis_assigned_to').on(rfis.assignedTo),
  dueDateIdx: index('idx_rfis_due_date').on(rfis.dueDate),
  deletedAtIdx: index('idx_rfis_deleted_at').on(rfis.deletedAt),
  createdAtIdx: index('idx_rfis_created_at').on(rfis.createdAt),

  // Composite: RFIs by project and status
  projectStatusIdx: index('idx_rfis_project_status').on(rfis.projectId, rfis.status),
};

/**
 * Change Order indexes
 */
export const changeOrderIndexes = {
  projectIdx: index('idx_change_orders_project_id').on(changeOrders.projectId),
  statusIdx: index('idx_change_orders_status').on(changeOrders.status),
  initiatedByIdx: index('idx_change_orders_initiated_by').on(changeOrders.initiatedBy),
  approvedByIdx: index('idx_change_orders_approved_by').on(changeOrders.approvedBy),
  deletedAtIdx: index('idx_change_orders_deleted_at').on(changeOrders.deletedAt),
  createdAtIdx: index('idx_change_orders_created_at').on(changeOrders.createdAt),

  // Composite: change orders by project and status
  projectStatusIdx: index('idx_change_orders_project_status').on(changeOrders.projectId, changeOrders.status),
};

/**
 * Submittal indexes
 */
export const submittalIndexes = {
  projectIdx: index('idx_submittals_project_id').on(submittals.projectId),
  statusIdx: index('idx_submittals_status').on(submittals.status),
  submittedByIdx: index('idx_submittals_submitted_by').on(submittals.submittedBy),
  csiDivisionIdx: index('idx_submittals_csi_division').on(submittals.csiDivision),
  dueDateIdx: index('idx_submittals_due_date').on(submittals.dueDate),
  deletedAtIdx: index('idx_submittals_deleted_at').on(submittals.deletedAt),
  createdAtIdx: index('idx_submittals_created_at').on(submittals.createdAt),

  // Composite: submittals by project and status
  projectStatusIdx: index('idx_submittals_project_status').on(submittals.projectId, submittals.status),
};

/**
 * Daily Report indexes
 */
export const dailyReportIndexes = {
  projectIdx: index('idx_daily_reports_project_id').on(dailyReports.projectId),
  reportDateIdx: index('idx_daily_reports_report_date').on(dailyReports.reportDate),
  submittedByIdx: index('idx_daily_reports_submitted_by').on(dailyReports.submittedBy),
  deletedAtIdx: index('idx_daily_reports_deleted_at').on(dailyReports.deletedAt),

  // Composite: reports by project and date (for browsing history)
  projectDateIdx: index('idx_daily_reports_project_date').on(dailyReports.projectId, dailyReports.reportDate),
};

/**
 * File Attachment indexes
 */
export const fileAttachmentIndexes = {
  projectIdx: index('idx_file_attachments_project_id').on(fileAttachments.projectId),
  folderTypeIdx: index('idx_file_attachments_folder_type').on(fileAttachments.folderType),
  uploadedByIdx: index('idx_file_attachments_uploaded_by').on(fileAttachments.uploadedBy),
  relatedEntityIdx: index('idx_file_attachments_related_entity').on(fileAttachments.relatedEntity, fileAttachments.relatedEntityId),
  createdAtIdx: index('idx_file_attachments_created_at').on(fileAttachments.createdAt),

  // Composite: files by project and folder type
  projectFolderIdx: index('idx_file_attachments_project_folder').on(fileAttachments.projectId, fileAttachments.folderType),
};

/**
 * Activity Log indexes (for audit trail queries)
 */
export const activityLogIndexes = {
  projectIdx: index('idx_activity_log_project_id').on(activityLog.projectId),
  entityTypeIdx: index('idx_activity_log_entity_type').on(activityLog.entityType),
  userIdx: index('idx_activity_log_user_id').on(activityLog.userId),
  createdAtIdx: index('idx_activity_log_created_at').on(activityLog.createdAt),

  // Composite: activity by project and entity
  projectEntityIdx: index('idx_activity_log_project_entity').on(activityLog.projectId, activityLog.entityType),
};

/**
 * Comment indexes
 */
export const commentIndexes = {
  projectIdx: index('idx_comments_project_id').on(comments.projectId),
  entityIdx: index('idx_comments_entity').on(comments.entityType, comments.entityId),
  authorIdx: index('idx_comments_author_id').on(comments.authorId),
  parentIdx: index('idx_comments_parent_comment_id').on(comments.parentCommentId),
  createdAtIdx: index('idx_comments_created_at').on(comments.createdAt),
};

/**
 * Project Invitation indexes
 */
export const projectInvitationIndexes = {
  projectIdx: index('idx_project_invitations_project_id').on(projectInvitations.projectId),
  emailIdx: index('idx_project_invitations_email').on(projectInvitations.email),
  statusIdx: index('idx_project_invitations_status').on(projectInvitations.status),
  tokenIdx: index('idx_project_invitations_token').on(projectInvitations.invitationToken),
  invitedByIdx: index('idx_project_invitations_invited_by').on(projectInvitations.invitedBy),
};

/**
 * Project Team Member indexes (critical for RBAC queries)
 */
export const projectTeamMemberIndexes = {
  projectIdx: index('idx_project_team_members_project_id').on(projectTeamMembers.projectId),
  userIdx: index('idx_project_team_members_user_id').on(projectTeamMembers.userId),
  teamRoleIdx: index('idx_project_team_members_team_role').on(projectTeamMembers.teamRole),
  isActiveIdx: index('idx_project_team_members_is_active').on(projectTeamMembers.isActive),

  // Critical composite: check if user is member of project (used in every RBAC check)
  projectUserIdx: index('idx_project_team_members_project_user').on(projectTeamMembers.projectId, projectTeamMembers.userId),

  // Composite: active members of a project
  projectActiveIdx: index('idx_project_team_members_project_active').on(projectTeamMembers.projectId, projectTeamMembers.isActive),
};

/**
 * Safety Meeting indexes
 */
export const safetyMeetingIndexes = {
  projectIdx: index('idx_safety_meetings_project_id').on(safetyMeetings.projectId),
  meetingDateIdx: index('idx_safety_meetings_meeting_date').on(safetyMeetings.meetingDate),
  meetingTypeIdx: index('idx_safety_meetings_meeting_type').on(safetyMeetings.meetingType),
  conductedByIdx: index('idx_safety_meetings_conducted_by').on(safetyMeetings.conductedBy),
};

/**
 * Safety Inspection indexes
 */
export const safetyInspectionIndexes = {
  projectIdx: index('idx_safety_inspections_project_id').on(safetyInspections.projectId),
  inspectionDateIdx: index('idx_safety_inspections_inspection_date').on(safetyInspections.inspectionDate),
  inspectionTypeIdx: index('idx_safety_inspections_inspection_type').on(safetyInspections.inspectionType),
  inspectedByIdx: index('idx_safety_inspections_inspected_by').on(safetyInspections.inspectedBy),
};

/**
 * Incident Report indexes
 */
export const incidentReportIndexes = {
  projectIdx: index('idx_incident_reports_project_id').on(incidentReports.projectId),
  incidentDateIdx: index('idx_incident_reports_incident_date').on(incidentReports.incidentDate),
  severityIdx: index('idx_incident_reports_severity').on(incidentReports.severity),
  incidentTypeIdx: index('idx_incident_reports_incident_type').on(incidentReports.incidentType),
  statusIdx: index('idx_incident_reports_status').on(incidentReports.status),
  reportedByIdx: index('idx_incident_reports_reported_by').on(incidentReports.reportedBy),
};

/**
 * Audit Log indexes (critical for compliance queries)
 */
export const auditLogIndexes = {
  tableNameIdx: index('idx_audit_log_table_name').on(auditLog.tableName),
  recordIdIdx: index('idx_audit_log_record_id').on(auditLog.recordId),
  userIdIdx: index('idx_audit_log_user_id').on(auditLog.userId),
  actionIdx: index('idx_audit_log_action').on(auditLog.action),
  timestampIdx: index('idx_audit_log_timestamp').on(auditLog.timestamp),

  // Composite: find all changes to a specific record
  tableRecordIdx: index('idx_audit_log_table_record').on(auditLog.tableName, auditLog.recordId),

  // Composite: find all changes by a user (for audit purposes)
  userTimestampIdx: index('idx_audit_log_user_timestamp').on(auditLog.userId, auditLog.timestamp),
};

/**
 * Bid Package indexes
 */
export const bidPackageIndexes = {
  projectIdx: index('idx_bid_packages_project_id').on(bidPackages.projectId),
  statusIdx: index('idx_bid_packages_status').on(bidPackages.status),
  bidDueDateIdx: index('idx_bid_packages_bid_due_date').on(bidPackages.bidDueDate),
  createdByIdx: index('idx_bid_packages_created_by').on(bidPackages.createdBy),
};

/**
 * Cost Estimate indexes
 */
export const costEstimateIndexes = {
  projectIdx: index('idx_cost_estimates_project_id').on(costEstimates.projectId),
  bidPackageIdx: index('idx_cost_estimates_bid_package_id').on(costEstimates.bidPackageId),
  statusIdx: index('idx_cost_estimates_status').on(costEstimates.status),
};

/**
 * Cost Estimate Line Item indexes
 */
export const costEstimateLineItemIndexes = {
  costEstimateIdx: index('idx_cost_estimate_line_items_cost_estimate_id').on(costEstimateLineItems.costEstimateId),
  csiDivisionIdx: index('idx_cost_estimate_line_items_csi_division').on(costEstimateLineItems.csiDivision),
  sortOrderIdx: index('idx_cost_estimate_line_items_sort_order').on(costEstimateLineItems.sortOrder),
};

/**
 * Worker Certification indexes
 */
export const workerCertificationIndexes = {
  projectIdx: index('idx_worker_certifications_project_id').on(workerCertifications.projectId),
  badgeNumberIdx: index('idx_worker_certifications_badge_number').on(workerCertifications.badgeNumber),
  statusIdx: index('idx_worker_certifications_status').on(workerCertifications.status),
  companyIdx: index('idx_worker_certifications_company').on(workerCertifications.company),
};

/**
 * Field Inspection indexes
 */
export const fieldInspectionIndexes = {
  projectIdx: index('idx_field_inspections_project_id').on(fieldInspections.projectId),
  inspectionDateIdx: index('idx_field_inspections_inspection_date').on(fieldInspections.inspectionDate),
  inspectionTypeIdx: index('idx_field_inspections_inspection_type').on(fieldInspections.inspectionType),
};

/**
 * Material Delivery indexes
 */
export const materialDeliveryIndexes = {
  projectIdx: index('idx_material_deliveries_project_id').on(materialDeliveries.projectId),
  scheduledDateIdx: index('idx_material_deliveries_scheduled_date').on(materialDeliveries.scheduledDate),
  statusIdx: index('idx_material_deliveries_status').on(materialDeliveries.status),
};

/**
 * Subcontractor Coordination indexes
 */
export const subcontractorCoordinationIndexes = {
  projectIdx: index('idx_subcontractor_coordination_project_id').on(subcontractorCoordination.projectId),
  logDateIdx: index('idx_subcontractor_coordination_log_date').on(subcontractorCoordination.logDate),
  tradeIdx: index('idx_subcontractor_coordination_trade').on(subcontractorCoordination.trade),
};

/**
 * Superintendent Notes indexes
 */
export const superintendentNoteIndexes = {
  projectIdx: index('idx_superintendent_notes_project_id').on(superintendentNotes.projectId),
  noteDateIdx: index('idx_superintendent_notes_note_date').on(superintendentNotes.noteDate),
  categoryIdx: index('idx_superintendent_notes_category').on(superintendentNotes.category),
  priorityIdx: index('idx_superintendent_notes_priority').on(superintendentNotes.priority),
  statusIdx: index('idx_superintendent_notes_status').on(superintendentNotes.status),
};

// Export all indexes as a single object for easy reference
export const allIndexes = {
  ...projectIndexes,
  ...taskIndexes,
  ...rfiIndexes,
  ...changeOrderIndexes,
  ...submittalIndexes,
  ...dailyReportIndexes,
  ...fileAttachmentIndexes,
  ...activityLogIndexes,
  ...commentIndexes,
  ...projectInvitationIndexes,
  ...projectTeamMemberIndexes,
  ...safetyMeetingIndexes,
  ...safetyInspectionIndexes,
  ...incidentReportIndexes,
  ...auditLogIndexes,
  ...bidPackageIndexes,
  ...costEstimateIndexes,
  ...costEstimateLineItemIndexes,
  ...workerCertificationIndexes,
  ...fieldInspectionIndexes,
  ...materialDeliveryIndexes,
  ...subcontractorCoordinationIndexes,
  ...superintendentNoteIndexes,
};
