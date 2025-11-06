/**
 * Contacts Schema
 * Comprehensive contact management for subcontractors, suppliers, vendors, and stakeholders
 * Tracks contact information extracted from communications across all CSI divisions
 */

import { pgTable, serial, text, integer, timestamp, boolean, json, decimal } from 'drizzle-orm/pg-core';

// Main Contacts Table - Central repository for all project contacts
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Contact Type
  contactType: text('contact_type').notNull(), // subcontractor, supplier, vendor, consultant, inspector, owner_rep, architect, engineer

  // Basic Information
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name').notNull(), // Used when first/last not separated
  title: text('title'), // Project Manager, Superintendent, etc.
  company: text('company').notNull(),

  // Contact Details
  email: text('email'),
  phoneMain: text('phone_main'),
  phoneMobile: text('phone_mobile'),
  phoneOffice: text('phone_office'),
  fax: text('fax'),

  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),

  // CSI Division Association
  csiDivisions: json('csi_divisions').$type<string[]>(), // Array of CSI codes ["03", "04", "31"]
  primaryDivision: text('primary_division'), // Primary CSI division

  // Trade/Specialty
  trade: text('trade'), // Concrete, Electrical, Plumbing, HVAC, etc.
  specialty: text('specialty'), // More specific: "Commercial Roofing", "Low Voltage", etc.

  // Business Information
  businessLicense: text('business_license'),
  taxId: text('tax_id'), // Should be encrypted
  websiteUrl: text('website_url'),

  // Communication Preferences
  preferredContact: text('preferred_contact').default('email'), // email, phone, mobile, text
  languages: json('languages').$type<string[]>(), // ["English", "Spanish"]

  // Status & Verification
  status: text('status').default('active'), // active, inactive, blacklisted, prospect
  isVerified: boolean('is_verified').default(false),
  isPrimary: boolean('is_primary').default(false), // Primary contact for this division/trade

  // Source Tracking
  sourceType: text('source_type'), // email, submittal, rfi, change_order, payment_app, manual
  sourceDocumentId: integer('source_document_id'), // ID of source document
  extractedBy: text('extracted_by'), // ai, manual, import

  // Relationships
  userId: integer('user_id'), // Link to users table if they have system access
  subcontractId: integer('subcontract_id'), // Link to subcontracts table if applicable

  // Notes & Tags
  notes: text('notes'),
  tags: json('tags').$type<string[]>(), // ["preferred", "responsive", "quality_issues"]

  // Metadata
  lastContactDate: timestamp('last_contact_date'),
  firstSeenDate: timestamp('first_seen_date').defaultNow(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by'),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// Contact Communication Log - Track all communications with contacts
export const contactCommunications = pgTable('contact_communications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  contactId: integer('contact_id').notNull(),

  // Communication Details
  communicationType: text('communication_type').notNull(), // email, phone, meeting, text, fax
  direction: text('direction').notNull(), // inbound, outbound
  subject: text('subject'),
  summary: text('summary'),

  // Content
  content: text('content'),
  attachments: json('attachments').$type<Array<{ filename: string; url: string }>>(),

  // Related Documents
  relatedDocumentType: text('related_document_type'), // rfi, submittal, change_order, payment_app
  relatedDocumentId: integer('related_document_id'),

  // Email Specific
  emailId: text('email_id'),
  emailThreadId: text('email_thread_id'),
  fromAddress: text('from_address'),
  toAddresses: json('to_addresses').$type<string[]>(),
  ccAddresses: json('cc_addresses').$type<string[]>(),

  // Phone Specific
  phoneNumber: text('phone_number'),
  callDuration: integer('call_duration'), // seconds

  // Response Tracking
  requiresResponse: boolean('requires_response').default(false),
  responseDeadline: timestamp('response_deadline'),
  respondedAt: timestamp('responded_at'),

  // Communication Date/Time
  communicatedAt: timestamp('communicated_at').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by'),
});

// Division Contacts - Link contacts to specific CSI divisions and folders
export const divisionContacts = pgTable('division_contacts', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  contactId: integer('contact_id').notNull(),

  // Division Information
  csiDivision: text('csi_division').notNull(), // "03", "04", "22", etc.
  divisionName: text('division_name').notNull(), // "Concrete", "Masonry", "Plumbing"

  // Folder Association
  folderId: text('folder_id'), // Link to project folder structure
  folderPath: text('folder_path'), // e.g., "05 Subcontractor-Suppliers/DIV 3 CONCRETE"

  // Role in Division
  role: text('role'), // primary, backup, supplier, consultant
  scopeOfWork: text('scope_of_work'),

  // Status
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Supplier Catalogs - Track material suppliers and their product offerings
export const supplierCatalogs = pgTable('supplier_catalogs', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').notNull(), // Link to contacts table

  // Product Information
  productCategory: text('product_category').notNull(), // Concrete, Rebar, Lumber, etc.
  productLine: text('product_line'),
  manufacturerName: text('manufacturer_name'),

  // Catalog Details
  catalogNumber: text('catalog_number'),
  description: text('description'),
  specifications: text('specifications'),

  // Pricing
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  unitOfMeasure: text('unit_of_measure'), // each, cubic_yard, linear_foot, etc.
  minimumOrder: integer('minimum_order'),

  // Lead Times
  standardLeadTime: integer('standard_lead_time'), // days
  expeditedLeadTime: integer('expedited_lead_time'),

  // Availability
  isAvailable: boolean('is_available').default(true),
  stockStatus: text('stock_status'), // in_stock, made_to_order, discontinued

  // Documents
  catalogPdfUrl: text('catalog_pdf_url'),
  productSheetUrl: text('product_sheet_url'),
  msdsUrl: text('msds_url'), // Material Safety Data Sheet

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Contact Documents - Store documents related to contacts (insurance, licenses, etc.)
export const contactDocuments = pgTable('contact_documents', {
  id: serial('id').primaryKey(),
  contactId: integer('contact_id').notNull(),
  projectId: integer('project_id'),

  // Document Type
  documentType: text('document_type').notNull(), // insurance_cert, business_license, w9, bond, warranty
  documentName: text('document_name').notNull(),

  // File Information
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // bytes
  mimeType: text('mime_type'),

  // Document Details
  documentNumber: text('document_number'),
  issueDate: timestamp('issue_date'),
  expirationDate: timestamp('expiration_date'),

  // Status
  status: text('status').default('active'), // active, expired, superseded
  isVerified: boolean('is_verified').default(false),
  verifiedBy: integer('verified_by'),
  verifiedAt: timestamp('verified_at'),

  // Notifications
  expirationNotificationSent: boolean('expiration_notification_sent').default(false),
  daysBeforeExpiration: integer('days_before_expiration').default(30),

  // Notes
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: integer('created_by'),
});

// Contact Relationships - Track relationships between contacts (e.g., employee of, subcontractor of)
export const contactRelationships = pgTable('contact_relationships', {
  id: serial('id').primaryKey(),
  primaryContactId: integer('primary_contact_id').notNull(),
  relatedContactId: integer('related_contact_id').notNull(),

  // Relationship Type
  relationshipType: text('relationship_type').notNull(), // employee_of, partner_of, subcontractor_of, represents

  // Details
  position: text('position'),
  department: text('department'),

  // Status
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export Types
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type ContactCommunication = typeof contactCommunications.$inferSelect;
export type NewContactCommunication = typeof contactCommunications.$inferInsert;

export type DivisionContact = typeof divisionContacts.$inferSelect;
export type NewDivisionContact = typeof divisionContacts.$inferInsert;

export type SupplierCatalog = typeof supplierCatalogs.$inferSelect;
export type NewSupplierCatalog = typeof supplierCatalogs.$inferInsert;

export type ContactDocument = typeof contactDocuments.$inferSelect;
export type NewContactDocument = typeof contactDocuments.$inferInsert;

export type ContactRelationship = typeof contactRelationships.$inferSelect;
export type NewContactRelationship = typeof contactRelationships.$inferInsert;
