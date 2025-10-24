/**
 * Project Team Schema
 * Manages project team members with contact information
 */

import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Project Team Members
export const projectTeamMembers = pgTable('project_team_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Team Member Role
  role: text('role').notNull(), // 'owner', 'architect', 'engineer', 'gc', 'superintendent', 'pm', 'inspector', 'consultant'
  roleTitle: text('role_title'), // Custom title like "Senior Project Manager"

  // Contact Information
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name').notNull(),
  company: text('company'),
  title: text('title'), // Job title

  // Contact Details
  email: text('email'),
  phoneMain: text('phone_main'),
  phoneMobile: text('phone_mobile'),
  phoneOffice: text('phone_office'),

  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),

  // System Links
  userId: integer('user_id'), // Link to users table if they have system access
  contactId: integer('contact_id'), // Link to contacts table

  // Status
  isPrimary: boolean('is_primary').default(false), // Primary contact for this role
  isActive: boolean('is_active').default(true),

  // Notes
  notes: text('notes'),
  responsibilities: text('responsibilities'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by'),
});

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type NewProjectTeamMember = typeof projectTeamMembers.$inferInsert;
