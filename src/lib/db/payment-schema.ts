/**
 * Payment Application Schema (G702/G703) - AIA Standard Forms
 * Based on forms and templates/Project Filing System examples
 */
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, serial, pgEnum, decimal } from 'drizzle-orm/pg-core';

export const paymentApplicationStatusEnum = pgEnum('payment_application_status', [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid'
]);

// G702 - Application and Certificate for Payment (Main Form)
export const paymentApplications = pgTable('payment_applications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Application Header
  applicationNumber: integer('application_number').notNull(), // Sequential numbering
  periodTo: timestamp('period_to').notNull(), // Billing period end date

  // Project Information
  contractFor: text('contract_for'), // Type of work description
  architectProjectNumber: varchar('architect_project_number', { length: 100 }),

  // Owner, Contractor, Architect Info (denormalized for PDF generation)
  ownerName: varchar('owner_name', { length: 255 }),
  ownerAddress: text('owner_address'),

  contractorName: varchar('contractor_name', { length: 255 }),
  contractorAddress: text('contractor_address'),
  contractorDate: timestamp('contractor_date'),

  architectName: varchar('architect_name', { length: 255 }),
  architectAddress: text('architect_address'),

  // G702 Financial Summary
  // Line 1: Original Contract Sum
  originalContractSum: integer('original_contract_sum').notNull().default(0), // In cents

  // Line 2: Net Change by Change Orders
  netChangeByChangeOrders: integer('net_change_by_change_orders').default(0), // In cents

  // Line 3: Contract Sum to Date (Line 1 + Line 2) - calculated
  contractSumToDate: integer('contract_sum_to_date').default(0), // In cents

  // Line 4: Total Completed & Stored to Date (from G703 sum)
  totalCompletedAndStored: integer('total_completed_and_stored').default(0), // In cents

  // Line 5: Retainage
  retainagePercentage: decimal('retainage_percentage', { precision: 5, scale: 2 }).default('10.00'), // e.g., 10.00%
  retainageOnCompletedWork: integer('retainage_on_completed_work').default(0), // In cents
  retainageOnStoredMaterial: integer('retainage_on_stored_material').default(0), // In cents
  totalRetainage: integer('total_retainage').default(0), // In cents (Line 5a + 5b)

  // Line 6: Total Earned Less Retainage (Line 4 - Line 5)
  totalEarnedLessRetainage: integer('total_earned_less_retainage').default(0), // In cents

  // Line 7: Less Previous Certificates for Payment
  lessPreviousCertificates: integer('less_previous_certificates').default(0), // In cents

  // Line 8: Current Payment Due (Line 6 - Line 7)
  currentPaymentDue: integer('current_payment_due').default(0), // In cents

  // Line 9: Balance to Finish, Including Retainage (Line 3 - Line 6)
  balanceToFinish: integer('balance_to_finish').default(0), // In cents

  // Change Order Summary
  changeOrderAdditions: integer('change_order_additions').default(0), // In cents
  changeOrderDeductions: integer('change_order_deductions').default(0), // In cents

  // Contractor Certification
  contractorCertified: boolean('contractor_certified').default(false),
  contractorCertificationText: text('contractor_certification_text'),

  // Architect's Certificate for Payment
  architectCertified: boolean('architect_certified').default(false),
  architectCertificationDate: timestamp('architect_certification_date'),
  amountCertified: integer('amount_certified').default(0), // In cents
  architectNotes: text('architect_notes'),
  isNegotiable: boolean('is_negotiable').default(true),

  // Status and workflow
  status: paymentApplicationStatusEnum('status').default('draft').notNull(),

  // Attachments
  attachments: jsonb('attachments').default('[]'), // Supporting documents

  // Payment tracking
  paidDate: timestamp('paid_date'),
  paidAmount: integer('paid_amount'), // In cents
  checkNumber: varchar('check_number', { length: 100 }),

  // Metadata
  createdBy: integer('created_by').notNull(),
  submittedBy: integer('submitted_by'),
  submittedAt: timestamp('submitted_at'),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// G703 - Continuation Sheet (Line Items by CSI Division)
export const paymentApplicationLineItems = pgTable('payment_application_line_items', {
  id: serial('id').primaryKey(),
  paymentApplicationId: integer('payment_application_id').notNull(),
  projectId: integer('project_id').notNull(),

  // Column A: Item Number (e.g., "01.01", "03.01")
  itemNumber: varchar('item_number', { length: 20 }).notNull(),
  sortOrder: integer('sort_order').default(0), // For ordering within application

  // Column B: Description of Work
  description: text('description').notNull(),
  csiDivision: varchar('csi_division', { length: 10 }), // e.g., "01", "03", "26"
  csiDivisionName: varchar('csi_division_name', { length: 255 }), // e.g., "General Conditions", "Concrete"

  // Column C: Scheduled Value (Budget for this line item)
  scheduledValue: integer('scheduled_value').notNull().default(0), // In cents

  // Column D: Work Completed from Previous Applications
  workCompletedPrevious: integer('work_completed_previous').default(0), // In cents

  // Column E: Work Completed This Period
  workCompletedThisPeriod: integer('work_completed_this_period').default(0), // In cents

  // Column F: Materials Presently Stored (not in D or E)
  materialsStored: integer('materials_stored').default(0), // In cents

  // Column G: Total Completed and Stored to Date (D + E + F)
  totalCompletedAndStored: integer('total_completed_and_stored').default(0), // In cents

  // Column H: % Complete (G ÷ C)
  percentComplete: decimal('percent_complete', { precision: 5, scale: 2 }).default('0.00'),

  // Column I: Balance to Finish (C - G)
  balanceToFinish: integer('balance_to_finish').default(0), // In cents

  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schedule of Values (SOV) - Master cost breakdown for the project
// This is the baseline that G703 line items reference
export const scheduleOfValues = pgTable('schedule_of_values', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Item identification
  itemNumber: varchar('item_number', { length: 20 }).notNull(),
  sortOrder: integer('sort_order').default(0),

  // Description
  description: text('description').notNull(),
  csiDivision: varchar('csi_division', { length: 10 }), // e.g., "01", "03", "26"
  csiDivisionName: varchar('csi_division_name', { length: 255 }),

  // Budget
  scheduledValue: integer('scheduled_value').notNull().default(0), // In cents

  // Change tracking
  originalValue: integer('original_value').default(0), // In cents
  revisedValue: integer('revised_value').default(0), // In cents - after change orders

  // Status
  isActive: boolean('is_active').default(true),

  // Metadata
  notes: text('notes'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment Application Review Checklist
export const paymentApplicationChecklist = pgTable('payment_application_checklist', {
  id: serial('id').primaryKey(),
  paymentApplicationId: integer('payment_application_id').notNull(),

  // Checklist items based on "GC Application for Payment Review & Sign-Off"
  g702Certified: boolean('g702_certified').default(false),
  poNumberDisplayed: boolean('po_number_displayed').default(false),
  applicationNumberCorrect: boolean('application_number_correct').default(false),
  architectCertified: boolean('architect_certified').default(false),
  csiDivisionsSubtotaled: boolean('csi_divisions_subtotaled').default(false),
  g703TotalsMatch: boolean('g703_totals_match').default(false),
  previousInvoiceReconciled: boolean('previous_invoice_reconciled').default(false),
  changeOrdersDocumented: boolean('change_orders_documented').default(false),
  insuranceReportsAttached: boolean('insurance_reports_attached').default(false),
  mwbeReportsAttached: boolean('mwbe_reports_attached').default(false),
  scheduleAttached: boolean('schedule_attached').default(false),
  overtimeDocumented: boolean('overtime_documented').default(false),
  photosAttached: boolean('photos_attached').default(false),
  storedMaterialTitles: boolean('stored_material_titles').default(false),

  // Review notes
  reviewNotes: text('review_notes'),
  reviewedBy: integer('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type PaymentApplication = typeof paymentApplications.$inferSelect;
export type NewPaymentApplication = typeof paymentApplications.$inferInsert;
export type PaymentApplicationLineItem = typeof paymentApplicationLineItems.$inferSelect;
export type NewPaymentApplicationLineItem = typeof paymentApplicationLineItems.$inferInsert;
export type ScheduleOfValue = typeof scheduleOfValues.$inferSelect;
export type NewScheduleOfValue = typeof scheduleOfValues.$inferInsert;
export type PaymentApplicationChecklist = typeof paymentApplicationChecklist.$inferSelect;
export type NewPaymentApplicationChecklist = typeof paymentApplicationChecklist.$inferInsert;
