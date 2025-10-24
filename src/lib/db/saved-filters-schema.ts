/**
 * Saved Filters Schema
 * Allows users to save frequently used search filters for contacts and other entities
 */

import { pgTable, serial, text, integer, timestamp, boolean, json } from 'drizzle-orm/pg-core';

export const savedFilters = pgTable('saved_filters', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  projectId: integer('project_id'), // Optional - can be project-specific or global

  // Filter Details
  filterName: text('filter_name').notNull(),
  filterType: text('filter_type').notNull(), // 'contact', 'task', 'rfi', 'submittal', etc.
  description: text('description'),

  // Filter Criteria (stored as JSON)
  filterCriteria: json('filter_criteria').$type<{
    search?: string;
    division?: string;
    contactType?: string;
    status?: string;
    verified?: boolean;
    trade?: string;
    tags?: string[];
    dateRange?: {
      field: string; // 'createdAt', 'lastContactDate', etc.
      start?: string;
      end?: string;
    };
    customFields?: Record<string, any>;
  }>().notNull(),

  // Display Preferences
  sortBy: text('sort_by'), // Field to sort by
  sortOrder: text('sort_order'), // 'asc' or 'desc'
  columns: json('columns').$type<string[]>(), // Which columns to display

  // Metadata
  isDefault: boolean('is_default').default(false), // Default filter for this user/type
  isShared: boolean('is_shared').default(false), // Share with team
  useCount: integer('use_count').default(0), // Track usage
  lastUsedAt: timestamp('last_used_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type SavedFilter = typeof savedFilters.$inferSelect;
export type NewSavedFilter = typeof savedFilters.$inferInsert;
