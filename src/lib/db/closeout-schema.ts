/**
 * Project Closeout Database Schema
 * Tracks all closeout requirements by division and ensures complete project closure
 */

import { pgTable, serial, integer, text, timestamp, boolean, json, varchar, decimal } from 'drizzle-orm/pg-core';

// Main Closeout Tracker
export const closeoutItems = pgTable('closeout_items', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Item Classification
  division: varchar('division', { length: 10 }).notNull(), // e.g., "DIV 01", "DIV 23"
  category: varchar('category', { length: 100 }).notNull(), // e.g., "Submittals", "Training", "Warranties"
  itemType: varchar('item_type', { length: 50 }).notNull(), // "Document", "Inspection", "Training", "Testing"

  // Item Details
  title: text('title').notNull(),
  description: text('description'),
  requirement: text('requirement'), // Spec reference or requirement description
  specSection: varchar('spec_section', { length: 20 }), // e.g., "01 78 00"

  // Status Tracking
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, in_progress, submitted, approved, rejected, completed
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low, medium, high, critical

  // Responsibility
  responsibleParty: varchar('responsible_party', { length: 100 }), // Subcontractor name
  responsibleContact: integer('responsible_contact_id'), // Link to contacts table
  assignedTo: integer('assigned_to'), // User ID

  // Dates
  dueDate: timestamp('due_date'),
  submittedDate: timestamp('submitted_date'),
  approvedDate: timestamp('approved_date'),
  completedDate: timestamp('completed_date'),

  // Document Tracking
  documentRequired: boolean('document_required').default(true),
  documentReceived: boolean('document_received').default(false),
  documentPath: text('document_path'),
  documentCount: integer('document_count').default(0),

  // Compliance & Quality
  inspectionRequired: boolean('inspection_required').default(false),
  inspectionCompleted: boolean('inspection_completed').default(false),
  inspectionDate: timestamp('inspection_date'),
  inspectionNotes: text('inspection_notes'),

  trainingRequired: boolean('training_required').default(false),
  trainingCompleted: boolean('training_completed').default(false),
  trainingDate: timestamp('training_date'),

  testingRequired: boolean('testing_required').default(false),
  testingCompleted: boolean('testing_completed').default(false),
  testingDate: timestamp('testing_date'),

  // Additional Data
  notes: text('notes'),
  reviewComments: text('review_comments'),
  metadata: json('metadata'),

  // Audit
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// O&M Manuals
export const omManuals = pgTable('om_manuals', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  division: varchar('division', { length: 10 }).notNull(),
  equipmentType: varchar('equipment_type', { length: 100 }).notNull(),
  manufacturer: varchar('manufacturer', { length: 200 }),
  modelNumber: varchar('model_number', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),

  // Manual Details
  title: text('title').notNull(),
  location: text('location'), // Physical location of equipment
  quantity: integer('quantity').default(1),

  // Document Status
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  documentPath: text('document_path'),
  pageCount: integer('page_count'),

  // Contents Checklist
  hasOperatingInstructions: boolean('has_operating_instructions').default(false),
  hasMaintenanceSchedule: boolean('has_maintenance_schedule').default(false),
  hasPartsList: boolean('has_parts_list').default(false),
  hasWarrantyInfo: boolean('has_warranty_info').default(false),
  hasWiringDiagrams: boolean('has_wiring_diagrams').default(false),
  hasServiceContacts: boolean('has_service_contacts').default(false),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Warranties
export const warranties = pgTable('warranties', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  division: varchar('division', { length: 10 }).notNull(),
  itemDescription: text('item_description').notNull(),
  manufacturer: varchar('manufacturer', { length: 200 }),
  contractor: varchar('contractor', { length: 200 }),

  // Warranty Details
  warrantyType: varchar('warranty_type', { length: 50 }), // Material, Labor, System, Extended
  warrantyLength: integer('warranty_length_months').notNull(), // in months
  warrantyStartDate: timestamp('warranty_start_date').notNull(),
  warrantyEndDate: timestamp('warranty_end_date').notNull(),

  // Coverage
  coverageSummary: text('coverage_summary'),
  exclusions: text('exclusions'),

  // Documentation
  warrantyDocumentPath: text('warranty_document_path'),
  certificateNumber: varchar('certificate_number', { length: 100 }),

  // Contact Information
  contactName: varchar('contact_name', { length: 200 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 200 }),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, expired, claimed, void
  reminderSent: boolean('reminder_sent').default(false),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// As-Built / Record Drawings
export const recordDrawings = pgTable('record_drawings', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  division: varchar('division', { length: 10 }).notNull(),
  drawingNumber: varchar('drawing_number', { length: 50 }).notNull(),
  drawingTitle: text('drawing_title').notNull(),
  discipline: varchar('discipline', { length: 50 }), // Architectural, Structural, MEP, etc.

  // Status
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  originalDrawingPath: text('original_drawing_path'),
  recordDrawingPath: text('record_drawing_path'),

  // Revision Tracking
  revisionNumber: varchar('revision_number', { length: 20 }),
  revisionDate: timestamp('revision_date'),
  revisionDescription: text('revision_description'),

  // Changes Documented
  hasFieldChanges: boolean('has_field_changes').default(false),
  changesSummary: text('changes_summary'),

  // Approval
  submittedBy: integer('submitted_by'),
  submittedDate: timestamp('submitted_date'),
  reviewedBy: integer('reviewed_by'),
  reviewedDate: timestamp('reviewed_date'),
  approvedBy: integer('approved_by'),
  approvedDate: timestamp('approved_date'),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Training Records
export const trainingRecords = pgTable('training_records', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  division: varchar('division', { length: 10 }).notNull(),
  systemDescription: text('system_description').notNull(),

  // Training Details
  trainingType: varchar('training_type', { length: 50 }), // Operations, Maintenance, Safety, Emergency
  trainingDate: timestamp('training_date').notNull(),
  duration: integer('duration_hours'), // in hours
  location: varchar('location', { length: 200 }),

  // Trainer Information
  trainerName: varchar('trainer_name', { length: 200 }),
  trainerCompany: varchar('trainer_company', { length: 200 }),
  trainerQualifications: text('trainer_qualifications'),

  // Attendees
  attendees: json('attendees'), // Array of {name, title, company, signature}
  attendeeCount: integer('attendee_count'),

  // Content
  topicsCovered: text('topics_covered'),
  materialsProvided: text('materials_provided'),

  // Documentation
  trainingMaterialsPath: text('training_materials_path'),
  signInSheetPath: text('sign_in_sheet_path'),
  certificatesPath: text('certificates_path'),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  completed: boolean('completed').default(false),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Inspections & Testing
export const closeoutInspections = pgTable('closeout_inspections', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  division: varchar('division', { length: 10 }).notNull(),
  inspectionType: varchar('inspection_type', { length: 100 }).notNull(), // Final, TAB, Commissioning, Fire, etc.
  description: text('description').notNull(),

  // Scheduling
  inspectionDate: timestamp('inspection_date'),
  inspector: varchar('inspector', { length: 200 }),
  inspectorCompany: varchar('inspector_company', { length: 200 }),

  // Results
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  result: varchar('result', { length: 20 }), // passed, failed, conditional
  score: decimal('score', { precision: 5, scale: 2 }),

  // Findings
  deficiencies: json('deficiencies'), // Array of deficiency items
  deficiencyCount: integer('deficiency_count').default(0),
  correctiveActions: text('corrective_actions'),

  // Documentation
  reportPath: text('report_path'),
  certificatePath: text('certificate_path'),
  photosPaths: json('photos_paths'),

  // Re-inspection
  reinspectionRequired: boolean('reinspection_required').default(false),
  reinspectionDate: timestamp('reinspection_date'),
  reinspectionResult: varchar('reinspection_result', { length: 20 }),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Certificates & Permits
export const closeoutCertificates = pgTable('closeout_certificates', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  certificateType: varchar('certificate_type', { length: 100 }).notNull(), // CO, TCO, Fire Marshal, Health Dept, etc.
  certificateNumber: varchar('certificate_number', { length: 100 }),
  issuingAuthority: varchar('issuing_authority', { length: 200 }),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  applicationDate: timestamp('application_date'),
  inspectionDate: timestamp('inspection_date'),
  issueDate: timestamp('issue_date'),
  expirationDate: timestamp('expiration_date'),

  // Documentation
  documentPath: text('document_path'),

  // Requirements Met
  requirementsMet: json('requirements_met'),
  conditionsOfApproval: text('conditions_of_approval'),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Punch List Items (related to closeout)
export const closeoutPunchList = pgTable('closeout_punch_list', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  closeoutItemId: integer('closeout_item_id'),

  division: varchar('division', { length: 10 }),
  location: text('location').notNull(),
  description: text('description').notNull(),

  // Classification
  category: varchar('category', { length: 50 }), // Finish, Safety, Operational, Aesthetic
  severity: varchar('severity', { length: 20 }), // Minor, Major, Critical

  // Responsibility
  responsibleParty: varchar('responsible_party', { length: 200 }),
  assignedTo: integer('assigned_to'),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('open'),
  dueDate: timestamp('due_date'),
  completedDate: timestamp('completed_date'),
  verifiedDate: timestamp('verified_date'),

  // Documentation
  photoBefore: text('photo_before'),
  photoAfter: text('photo_after'),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type CloseoutItem = typeof closeoutItems.$inferSelect;
export type NewCloseoutItem = typeof closeoutItems.$inferInsert;
export type OMManual = typeof omManuals.$inferSelect;
export type Warranty = typeof warranties.$inferSelect;
export type RecordDrawing = typeof recordDrawings.$inferSelect;
export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type CloseoutInspection = typeof closeoutInspections.$inferSelect;
export type CloseoutCertificate = typeof closeoutCertificates.$inferSelect;
export type CloseoutPunchListItem = typeof closeoutPunchList.$inferSelect;
