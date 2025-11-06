/**
 * Entity/Organization Management Schema
 * Multi-tenant system for company branding and customization
 */

import { pgTable, serial, integer, text, timestamp, boolean, json, varchar } from 'drizzle-orm/pg-core';

// Main Entity/Organization Table
export const entities = pgTable('entities', {
  id: serial('id').primaryKey(),

  // Basic Information
  entityType: varchar('entity_type', { length: 50 }).notNull(), // gc, owner, architect, engineer, subcontractor, supplier
  companyName: varchar('company_name', { length: 200 }).notNull(),
  legalName: varchar('legal_name', { length: 200 }),
  dbaName: varchar('dba_name', { length: 200 }), // Doing Business As

  // Branding
  tagline: text('tagline'),
  description: text('description'),
  logoUrl: text('logo_url'),
  logoLight: text('logo_light'), // For dark backgrounds
  logoDark: text('logo_dark'), // For light backgrounds
  favicon: text('favicon'),

  // Brand Colors
  primaryColor: varchar('primary_color', { length: 7 }).default('#FF6600'), // Hex color
  secondaryColor: varchar('secondary_color', { length: 7 }),
  accentColor: varchar('accent_color', { length: 7 }),

  // Contact Information
  email: varchar('email', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  fax: varchar('fax', { length: 20 }),
  website: varchar('website', { length: 200 }),

  // Address
  address: text('address'),
  address2: text('address2'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 2 }).default('US'),

  // Business Information
  taxId: varchar('tax_id', { length: 50 }), // EIN
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpiration: timestamp('license_expiration'),

  // Insurance
  generalLiabilityInsurer: varchar('general_liability_insurer', { length: 200 }),
  glPolicyNumber: varchar('gl_policy_number', { length: 100 }),
  glCoverage: integer('gl_coverage'), // Amount in dollars
  glExpiration: timestamp('gl_expiration'),

  workersCompInsurer: varchar('workers_comp_insurer', { length: 200 }),
  wcPolicyNumber: varchar('wc_policy_number', { length: 100 }),
  wcExpiration: timestamp('wc_expiration'),

  // Certifications
  mwbeCertified: boolean('mwbe_certified').default(false),
  mwbeType: varchar('mwbe_type', { length: 50 }), // MBE, WBE, DBE, etc.
  mwbeCertNumber: varchar('mwbe_cert_number', { length: 100 }),
  mwbeExpiration: timestamp('mwbe_expiration'),

  isOshaCompliant: boolean('is_osha_compliant').default(false),
  osha300Log: boolean('osha_300_log').default(false),

  // System Settings
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, suspended, inactive
  isVerified: boolean('is_verified').default(false),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('free'), // free, basic, pro, enterprise

  // Customization Preferences
  preferences: json('preferences'), // Dashboard layout, notifications, etc.
  features: json('features'), // Enabled features/modules

  // Metadata
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Entity Relationships (for parent companies, JVs, etc.)
export const entityRelationships = pgTable('entity_relationships', {
  id: serial('id').primaryKey(),

  entityId: integer('entity_id').notNull(), // The entity
  relatedEntityId: integer('related_entity_id').notNull(), // Related entity

  relationshipType: varchar('relationship_type', { length: 50 }).notNull(), // parent, subsidiary, joint_venture, partner, vendor

  description: text('description'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Entity Documents (insurance certs, licenses, W9s, etc.)
export const entityDocuments = pgTable('entity_documents', {
  id: serial('id').primaryKey(),

  entityId: integer('entity_id').notNull(),

  documentType: varchar('document_type', { length: 50 }).notNull(), // insurance_cert, license, w9, bond, contract
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),

  filePath: text('file_path').notNull(),
  fileName: varchar('file_name', { length: 200 }),
  fileSize: integer('file_size'), // bytes
  mimeType: varchar('mime_type', { length: 100 }),

  issueDate: timestamp('issue_date'),
  expirationDate: timestamp('expiration_date'),

  isVerified: boolean('is_verified').default(false),
  verifiedBy: integer('verified_by'),
  verifiedAt: timestamp('verified_at'),

  uploadedBy: integer('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Entity Social Media & Marketing
export const entitySocialMedia = pgTable('entity_social_media', {
  id: serial('id').primaryKey(),

  entityId: integer('entity_id').notNull(),

  platform: varchar('platform', { length: 50 }).notNull(), // linkedin, facebook, twitter, instagram, youtube
  profileUrl: text('profile_url').notNull(),
  handle: varchar('handle', { length: 100 }),

  isPublic: boolean('is_public').default(true),
  displayOnProfile: boolean('display_on_profile').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Entity Specialties/Capabilities
export const entityCapabilities = pgTable('entity_capabilities', {
  id: serial('id').primaryKey(),

  entityId: integer('entity_id').notNull(),

  csiDivision: varchar('csi_division', { length: 10 }), // e.g., "DIV 23" for HVAC
  specialty: varchar('specialty', { length: 200 }).notNull(), // e.g., "Commercial HVAC", "K-12 Education"
  description: text('description'),

  yearsExperience: integer('years_experience'),
  certifications: json('certifications'), // Array of certification names

  isCore: boolean('is_core').default(false), // Is this a core competency?
  displayOrder: integer('display_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Entity Team Members (link users to entities)
export const entityUsers = pgTable('entity_users', {
  id: serial('id').primaryKey(),

  entityId: integer('entity_id').notNull(),
  userId: integer('user_id').notNull(),

  role: varchar('role', { length: 50 }).notNull(), // admin, member, viewer
  title: varchar('title', { length: 100 }), // Job title within the entity
  department: varchar('department', { length: 100 }),

  isPrimary: boolean('is_primary').default(false), // Primary contact for entity
  canManageEntity: boolean('can_manage_entity').default(false),
  canManageUsers: boolean('can_manage_users').default(false),

  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type EntityRelationship = typeof entityRelationships.$inferSelect;
export type EntityDocument = typeof entityDocuments.$inferSelect;
export type EntitySocialMedia = typeof entitySocialMedia.$inferSelect;
export type EntityCapability = typeof entityCapabilities.$inferSelect;
export type EntityUser = typeof entityUsers.$inferSelect;
