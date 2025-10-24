/**
 * Contract Schema
 * Manages subcontract agreements, waivers, and contract documents
 */

import { pgTable, serial, text, integer, timestamp, boolean, json, decimal } from 'drizzle-orm/pg-core';

// Subcontract Agreements
export const subcontracts = pgTable('subcontracts', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Contract Details
  contractNumber: text('contract_number').notNull(),
  subcontractorName: text('subcontractor_name').notNull(),
  subcontractorCompany: text('subcontractor_company').notNull(),
  subcontractorAddress: text('subcontractor_address'),
  subcontractorEmail: text('subcontractor_email'),
  subcontractorPhone: text('subcontractor_phone'),

  // Scope of Work
  workDescription: text('work_description').notNull(),
  csiDivisions: text('csi_divisions'), // Comma-separated CSI codes
  scopeOfWork: text('scope_of_work'), // Detailed scope

  // Contract Amounts
  contractAmount: decimal('contract_amount', { precision: 12, scale: 2 }).notNull(),
  retainagePercentage: decimal('retainage_percentage', { precision: 5, scale: 2 }).default('10.00'),

  // Schedule
  startDate: timestamp('start_date'),
  completionDate: timestamp('completion_date'),
  workingDays: integer('working_days'),

  // Insurance Requirements
  generalLiabilityRequired: boolean('general_liability_required').default(true),
  workersCompRequired: boolean('workers_comp_required').default(true),
  insuranceAmount: decimal('insurance_amount', { precision: 12, scale: 2 }),

  // Payment Terms
  paymentTerms: text('payment_terms').default('Net 30'),
  billingSchedule: text('billing_schedule'), // Monthly, milestone-based, etc.

  // Status
  status: text('status').default('draft'), // draft, active, completed, terminated
  signedDate: timestamp('signed_date'),
  signedBy: text('signed_by'),

  // Documents
  contractPdfUrl: text('contract_pdf_url'),
  signedContractUrl: text('signed_contract_url'),

  // XRPL Integration
  xrpWalletAddress: text('xrp_wallet_address'),
  xrpEscrowEnabled: boolean('xrp_escrow_enabled').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lien Waivers
export const lienWaivers = pgTable('lien_waivers', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  subcontractId: integer('subcontract_id'),
  paymentApplicationId: integer('payment_application_id'),

  // Waiver Details
  waiverType: text('waiver_type').notNull(), // conditional_progress, unconditional_progress, conditional_final, unconditional_final
  waiverNumber: text('waiver_number').notNull(),

  // Parties
  claimantName: text('claimant_name').notNull(),
  claimantCompany: text('claimant_company').notNull(),
  customerName: text('customer_name'),

  // Property Info
  propertyName: text('property_name'),
  propertyAddress: text('property_address'),
  propertyCounty: text('property_county'),

  // Financial Details
  throughDate: timestamp('through_date'),
  waiverAmount: decimal('waiver_amount', { precision: 12, scale: 2 }).notNull(),
  checkNumber: text('check_number'),
  checkDate: timestamp('check_date'),

  // Exceptions/Exclusions
  exceptions: text('exceptions'),
  unconditionalExceptions: text('unconditional_exceptions'),

  // Status
  status: text('status').default('draft'), // draft, signed, submitted, accepted
  signedDate: timestamp('signed_date'),
  signedBy: text('signed_by'),
  notarized: boolean('notarized').default(false),

  // Documents
  waiverPdfUrl: text('waiver_pdf_url'),
  signedWaiverUrl: text('signed_waiver_url'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Contract Templates
export const contractTemplates = pgTable('contract_templates', {
  id: serial('id').primaryKey(),

  // Template Info
  templateName: text('template_name').notNull(),
  templateType: text('template_type').notNull(), // subcontract, waiver_conditional_progress, waiver_unconditional_progress, etc.
  description: text('description'),

  // Template Content
  templateContent: text('template_content').notNull(), // HTML/Markdown template with variables
  variables: json('variables'), // List of template variables like {{subcontractor_name}}

  // Metadata
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  category: text('category'), // construction, service, materials, etc.

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// W-9 Forms
export const w9Forms = pgTable('w9_forms', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id'),
  subcontractId: integer('subcontract_id'),

  // Taxpayer Info
  businessName: text('business_name').notNull(),
  businessEntityType: text('business_entity_type'), // individual, corporation, partnership, llc, etc.
  exemptPayeeCode: text('exempt_payee_code'),
  exemptFatcaCode: text('exempt_fatca_code'),

  // Address
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),

  // Tax ID
  taxIdType: text('tax_id_type').notNull(), // ssn, ein
  taxId: text('tax_id').notNull(), // Encrypted in production

  // Status
  status: text('status').default('draft'), // draft, submitted, verified
  submittedDate: timestamp('submitted_date'),

  // Documents
  w9PdfUrl: text('w9_pdf_url'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Insurance Certificates
export const insuranceCertificates = pgTable('insurance_certificates', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  subcontractId: integer('subcontract_id'),

  // Certificate Details
  certificateNumber: text('certificate_number').notNull(),
  insuranceCompany: text('insurance_company').notNull(),
  policyNumber: text('policy_number').notNull(),

  // Coverage Type
  coverageType: text('coverage_type').notNull(), // general_liability, workers_comp, auto, umbrella, etc.
  coverageAmount: decimal('coverage_amount', { precision: 12, scale: 2 }).notNull(),

  // Dates
  effectiveDate: timestamp('effective_date').notNull(),
  expirationDate: timestamp('expiration_date').notNull(),

  // Certificate Holder
  certificateHolder: text('certificate_holder').notNull(),
  holderAddress: text('holder_address'),

  // Additional Insured
  additionalInsured: text('additional_insured'),

  // Status
  status: text('status').default('active'), // active, expired, cancelled
  isVerified: boolean('is_verified').default(false),

  // Documents
  certificatePdfUrl: text('certificate_pdf_url'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Subcontract = typeof subcontracts.$inferSelect;
export type NewSubcontract = typeof subcontracts.$inferInsert;

export type LienWaiver = typeof lienWaivers.$inferSelect;
export type NewLienWaiver = typeof lienWaivers.$inferInsert;

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type NewContractTemplate = typeof contractTemplates.$inferInsert;

export type W9Form = typeof w9Forms.$inferSelect;
export type NewW9Form = typeof w9Forms.$inferInsert;

export type InsuranceCertificate = typeof insuranceCertificates.$inferSelect;
export type NewInsuranceCertificate = typeof insuranceCertificates.$inferInsert;
