/**
 * Project Templates Schema
 * Allows users to create reusable project templates
 */
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, serial, pgEnum } from 'drizzle-orm/pg-core';

// Template category enum
export const templateCategoryEnum = pgEnum('template_category', [
  'commercial',
  'residential',
  'industrial',
  'infrastructure',
  'renovation',
  'custom'
]);

// Project Templates Table
export const projectTemplates = pgTable('project_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: templateCategoryEnum('category').default('custom').notNull(),

  // Visibility and ownership
  isPublic: boolean('is_public').default(false).notNull(), // Public templates visible to all
  createdBy: integer('created_by').notNull(), // User who created the template
  organizationId: integer('organization_id'), // Organization if it's an org template

  // Template configuration
  defaultStatus: varchar('default_status', { length: 50 }).default('planning'),
  defaultSettings: jsonb('default_settings').default('{}'),

  // Predefined structure
  milestones: jsonb('milestones').default('[]'), // Array of milestone templates
  taskTemplates: jsonb('task_templates').default('[]'), // Array of task templates
  teamRoles: jsonb('team_roles').default('[]'), // Array of role definitions
  defaultBudgetCategories: jsonb('default_budget_categories').default('[]'),

  // Metadata
  useCount: integer('use_count').default(0), // How many times this template was used
  tags: jsonb('tags').default('[]'),
  thumbnailUrl: text('thumbnail_url'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
});

// Template Usage Tracking
export const templateUsageLog = pgTable('template_usage_log', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').notNull(),
  projectId: integer('project_id').notNull(),
  usedBy: integer('used_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
