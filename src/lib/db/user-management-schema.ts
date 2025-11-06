/**
 * User Management Schema Extension
 * Enhanced schema for comprehensive user administration
 */
import { pgTable, varchar, integer, timestamp, boolean, jsonb, serial, pgEnum, text } from 'drizzle-orm/pg-core';

// Extended User Status
export const userAccountStatusEnum = pgEnum('user_account_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_ACTIVATION',
  'LOCKED',
  'ARCHIVED'
]);

// User Sessions Table - Track login sessions
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 50 }), // mobile, desktop, tablet
  browser: varchar('browser', { length: 100 }),
  location: varchar('location', { length: 255 }), // City, State/Country
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Activity Log - Audit trail
export const userActivityLog = pgTable('user_activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // login, logout, profile_update, password_change, etc.
  resourceType: varchar('resource_type', { length: 50 }), // project, task, user, etc.
  resourceId: integer('resource_id'),
  details: jsonb('details'), // Additional context about the action
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Preferences - Personal settings
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),

  // Notification Settings
  emailNotifications: boolean('email_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(false),
  pushNotifications: boolean('push_notifications').default(true),
  notificationFrequency: varchar('notification_frequency', { length: 20 }).default('immediate'), // immediate, daily, weekly

  // UI Preferences
  theme: varchar('theme', { length: 20 }).default('dark'), // light, dark, auto
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  dateFormat: varchar('date_format', { length: 20 }).default('MM/DD/YYYY'),

  // Dashboard Preferences
  defaultView: varchar('default_view', { length: 50 }).default('projects'), // projects, tasks, calendar
  dashboardLayout: jsonb('dashboard_layout').default('{}'),

  // Other Settings
  twoFactorEnabled: boolean('two_factor_enabled').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Company Assignment - Support for users in multiple companies
export const userCompanies = pgTable('user_companies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  companyId: integer('company_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // admin, member, viewer
  isDefault: boolean('is_default').default(false), // Primary company for this user
  invitedBy: integer('invited_by'),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  joinedAt: timestamp('joined_at'),
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, pending

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Teams - Group users into teams within a company
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  teamType: varchar('team_type', { length: 50 }), // project_team, department, etc.
  leaderId: integer('leader_id'), // Team lead user ID
  memberCount: integer('member_count').default(0),

  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// User Team Membership
export const userTeams = pgTable('user_teams', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  teamId: integer('team_id').notNull(),
  role: varchar('role', { length: 50 }).default('member'), // leader, member, viewer

  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  addedBy: integer('added_by'),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Notes - Admin notes about users
export const userNotes = pgTable('user_notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(), // User the note is about
  authorId: integer('author_id').notNull(), // Admin who wrote the note
  note: text('note').notNull(),
  isPrivate: boolean('is_private').default(true), // Only visible to admins

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
