/**
 * Task/Action Log Schema
 * Comprehensive task tracking system for construction projects
 */

import { pgTable, serial, text, integer, timestamp, boolean, date } from 'drizzle-orm/pg-core';

/**
 * Project Tasks - Main task/action log table
 */
export const projectTasks = pgTable('project_tasks', {
  // Core Identity
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  taskNumber: text('task_number'), // e.g., "TASK-001", auto-generated

  // Task Details
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'), // RFI, Submittal, Safety, Inspection, Change Order, etc.
  type: text('type'), // Action Item, Follow-up, Punch Item, Issue, etc.

  // Status & Priority
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, on_hold, cancelled
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent

  // Assignment & Responsibility
  assignedTo: integer('assigned_to'), // User ID
  assignedToName: text('assigned_to_name'), // Cached for performance
  assignedToCompany: text('assigned_to_company'), // Company/subcontractor name
  assignedBy: integer('assigned_by'), // Who assigned the task
  assignedByName: text('assigned_by_name'),
  ballInCourt: text('ball_in_court'), // Who is responsible for next action: Owner, Design Team, GC, Sub, Inspector, etc.

  // Dates & Timeline
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  dueDate: date('due_date'),
  startDate: date('start_date'),
  completedDate: timestamp('completed_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),

  // Location & Context
  location: text('location'), // Building, Floor, Room, Area
  costCode: text('cost_code'), // CSI division or internal cost code
  relatedDocumentId: integer('related_document_id'), // Link to RFI, Submittal, etc.
  relatedDocumentType: text('related_document_type'), // 'rfi', 'submittal', 'change_order', etc.

  // Progress Tracking
  percentComplete: integer('percent_complete').default(0),
  blockers: text('blockers'), // What's preventing completion
  dependencies: text('dependencies'), // Comma-separated task IDs this depends on

  // Documentation
  notes: text('notes'),
  internalNotes: text('internal_notes'), // Private notes not shared with subs
  attachments: text('attachments'), // JSON array of file URLs
  photos: text('photos'), // JSON array of photo URLs

  // Communication
  lastCommentAt: timestamp('last_comment_at'),
  lastCommentBy: text('last_comment_by'),
  notifyOnUpdate: boolean('notify_on_update').default(true),
  watchers: text('watchers'), // Comma-separated user IDs to notify

  // Audit Trail
  createdBy: integer('created_by'),
  createdByName: text('created_by_name'),
  modifiedBy: integer('modified_by'),
  modifiedAt: timestamp('modified_at'),

  // Tags & Custom Fields
  tags: text('tags'), // Comma-separated tags
  customFields: text('custom_fields'), // JSON for additional data
});

/**
 * Task Comments/Activity Log
 */
export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  userId: integer('user_id'),
  userName: text('user_name'),
  userCompany: text('user_company'),
  comment: text('comment').notNull(),
  commentType: text('comment_type').default('comment'), // comment, status_change, assignment, update
  isInternal: boolean('is_internal').default(false), // Internal vs external visible
  attachments: text('attachments'), // JSON array
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Task Templates - Common recurring tasks
 */
export const taskTemplates = pgTable('task_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  defaultPriority: text('default_priority'),
  defaultAssignee: text('default_assignee'), // Role or user
  estimatedHours: integer('estimated_hours'),
  checklistItems: text('checklist_items'), // JSON array
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Task Categories for Construction Projects
 */
export const TASK_CATEGORIES = [
  'RFI Follow-up',
  'Submittal Review',
  'Inspection Required',
  'Safety Issue',
  'Quality Control',
  'Change Order',
  'Punch List Item',
  'Material Delivery',
  'Equipment Rental',
  'Subcontractor Coordination',
  'Owner Review',
  'Permit Required',
  'Site Cleanup',
  'Documentation',
  'Meeting Action Item',
  'Other'
] as const;

/**
 * Task Status Options
 */
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'on_hold', label: 'On Hold', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

/**
 * Priority Levels
 */
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray', icon: '⬇️' },
  { value: 'medium', label: 'Medium', color: 'blue', icon: '➡️' },
  { value: 'high', label: 'High', color: 'orange', icon: '⬆️' },
  { value: 'urgent', label: 'Urgent', color: 'red', icon: '🔥' },
] as const;
