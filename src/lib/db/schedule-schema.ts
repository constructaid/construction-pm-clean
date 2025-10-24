/**
 * Schedule Schema Extension for MS Project-like functionality
 * Extends the main schema with schedule-specific tables
 */
import { pgTable, serial, integer, varchar, text, timestamp, boolean, jsonb, pgEnum, decimal } from 'drizzle-orm/pg-core';

// Schedule task status
export const scheduleTaskStatusEnum = pgEnum('schedule_task_status', [
  'not_started',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled'
]);

// Task dependency types
export const dependencyTypeEnum = pgEnum('dependency_type', [
  'finish_to_start',   // Default: Task B starts when Task A finishes
  'start_to_start',    // Task B starts when Task A starts
  'finish_to_finish',  // Task B finishes when Task A finishes
  'start_to_finish'    // Task B finishes when Task A starts (rare)
]);

// Schedule Tasks Table - For Gantt chart and project scheduling
export const scheduleTasks = pgTable('schedule_tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Task identification
  wbsCode: varchar('wbs_code', { length: 50 }), // Work Breakdown Structure code (e.g., "1.2.3")
  taskName: varchar('task_name', { length: 255 }).notNull(),
  description: text('description'),

  // Hierarchy - for nested tasks
  parentTaskId: integer('parent_task_id'), // For subtasks
  sortOrder: integer('sort_order').default(0), // Display order
  level: integer('level').default(1), // Indentation level (1 = top level)

  // Dates and duration
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  duration: integer('duration').default(0), // In days
  percentComplete: decimal('percent_complete', { precision: 5, scale: 2 }).default('0'), // 0-100

  // Actual vs planned
  actualStartDate: timestamp('actual_start_date'),
  actualEndDate: timestamp('actual_end_date'),
  actualDuration: integer('actual_duration'),

  // Status
  status: scheduleTaskStatusEnum('status').default('not_started').notNull(),

  // Assignment
  assignedTo: jsonb('assigned_to').default('[]'), // Array of user IDs

  // Task properties
  isMilestone: boolean('is_milestone').default(false), // Milestones have 0 duration
  isCriticalPath: boolean('is_critical_path').default(false), // Calculated field
  isBaseline: boolean('is_baseline').default(false), // For baseline comparison

  // Work and resources
  estimatedHours: decimal('estimated_hours', { precision: 10, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 10, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 2 }), // Estimated cost
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),

  // Constraints
  constraintType: varchar('constraint_type', { length: 50 }), // 'must_start_on', 'must_finish_on', 'as_late_as_possible', etc.
  constraintDate: timestamp('constraint_date'),

  // Additional properties
  priority: integer('priority').default(5), // 1-10
  notes: text('notes'),
  tags: jsonb('tags').default('[]'),

  // Colors for Gantt display
  color: varchar('color', { length: 7 }).default('#3D9991'), // Hex color

  // Metadata
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Task Dependencies Table - For linking tasks
export const taskDependencies = pgTable('task_dependencies', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Predecessor and Successor
  predecessorTaskId: integer('predecessor_task_id').notNull(), // The task that must complete first
  successorTaskId: integer('successor_task_id').notNull(), // The task that depends on the predecessor

  // Dependency type
  dependencyType: dependencyTypeEnum('dependency_type').default('finish_to_start').notNull(),

  // Lag/Lead time
  lagDays: integer('lag_days').default(0), // Positive = delay, Negative = lead time

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Baselines Table - For saving snapshots of the schedule
export const scheduleBaselines = pgTable('schedule_baselines', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  baselineName: varchar('baseline_name', { length: 255 }).notNull(),
  description: text('description'),

  // Snapshot data
  snapshotDate: timestamp('snapshot_date').defaultNow().notNull(),
  scheduleData: jsonb('schedule_data').notNull(), // Complete snapshot of all tasks

  isActive: boolean('is_active').default(true), // For comparing current vs baseline

  // Metadata
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports
export type ScheduleTask = typeof scheduleTasks.$inferSelect;
export type NewScheduleTask = typeof scheduleTasks.$inferInsert;
export type TaskDependency = typeof taskDependencies.$inferSelect;
export type NewTaskDependency = typeof taskDependencies.$inferInsert;
export type ScheduleBaseline = typeof scheduleBaselines.$inferSelect;
export type NewScheduleBaseline = typeof scheduleBaselines.$inferInsert;
