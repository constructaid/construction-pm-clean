/**
 * Email Templates Schema
 *
 * For storing pre-made email templates for construction workflows
 */

import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  companyId: integer('company_id'),

  // Template info
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // 'rfi', 'submittal', 'change_order', 'meeting', 'general', etc.

  // Template content
  subject: text('subject').notNull(),
  body: text('body').notNull(),

  // Variables/placeholders
  variables: jsonb('variables').default('[]'), // e.g., ['projectName', 'date', 'recipientName']

  // Usage tracking
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),

  // Sharing
  isShared: boolean('is_shared').default(false), // Shared with company
  isPublic: boolean('is_public').default(false), // Public template

  // Metadata
  tags: jsonb('tags').default('[]'),
  metadata: jsonb('metadata').default('{}'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
