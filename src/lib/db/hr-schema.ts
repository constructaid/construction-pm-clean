/**
 * HR Module Database Schema
 * Employees, PTO, Certifications, Performance Reviews
 */
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, serial, pgEnum, date, decimal } from 'drizzle-orm/pg-core';

// Enums
export const employmentTypeEnum = pgEnum('employment_type', ['full_time', 'part_time', 'contract', 'temporary', 'intern']);
export const employmentStatusEnum = pgEnum('employment_status', ['active', 'on_leave', 'terminated', 'retired']);
export const departmentEnum = pgEnum('department', ['executive', 'project_management', 'field_operations', 'estimating', 'safety', 'quality', 'accounting', 'hr', 'it']);
export const ptoTypeEnum = pgEnum('pto_type', ['vacation', 'sick', 'personal', 'bereavement', 'jury_duty', 'unpaid']);
export const ptoStatusEnum = pgEnum('pto_status', ['pending', 'approved', 'denied', 'cancelled']);
export const certificationStatusEnum = pgEnum('certification_status', ['active', 'expiring_soon', 'expired', 'pending_renewal']);

// ========================================
// EMPLOYEES TABLE
// ========================================
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),

  // Personal Information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  preferredName: varchar('preferred_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  personalEmail: varchar('personal_email', { length: 255 }),
  dateOfBirth: date('date_of_birth'),

  // Employment Details
  employeeNumber: varchar('employee_number', { length: 50 }).notNull().unique(),
  department: departmentEnum('department').notNull(),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  employmentType: employmentTypeEnum('employment_type').notNull().default('full_time'),
  employmentStatus: employmentStatusEnum('employment_status').notNull().default('active'),

  // Dates
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  lastDayWorked: date('last_day_worked'),

  // Compensation
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  payFrequency: varchar('pay_frequency', { length: 50 }), // weekly, biweekly, monthly

  // Manager/Reporting
  managerId: integer('manager_id'),

  // Address
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),

  // Emergency Contact
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 50 }),
  emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 100 }),

  // Union Information (Construction Industry Specific)
  unionMember: boolean('union_member').default(false),
  unionName: varchar('union_name', { length: 255 }),
  unionLocalNumber: varchar('union_local_number', { length: 100 }),

  // Additional Details
  notes: text('notes'),
  skills: jsonb('skills').default('[]'), // Array of skill names
  languages: jsonb('languages').default('[]'), // Array of languages spoken

  // Photo
  photoUrl: text('photo_url'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// ========================================
// PTO (PAID TIME OFF) TABLE
// ========================================
export const ptoRequests = pgTable('pto_requests', {
  id: serial('id').primaryKey(),

  employeeId: integer('employee_id').notNull(),

  // Request Details
  type: ptoTypeEnum('type').notNull(),
  status: ptoStatusEnum('status').notNull().default('pending'),

  // Dates
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  totalDays: decimal('total_days', { precision: 5, scale: 2 }).notNull(), // Allows half days

  // Details
  reason: text('reason'),
  notes: text('notes'),

  // Approval Chain
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy: integer('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// ========================================
// PTO BALANCES TABLE
// ========================================
export const ptoBalances = pgTable('pto_balances', {
  id: serial('id').primaryKey(),

  employeeId: integer('employee_id').notNull().unique(),

  // Vacation
  vacationAccrued: decimal('vacation_accrued', { precision: 6, scale: 2 }).default('0').notNull(),
  vacationUsed: decimal('vacation_used', { precision: 6, scale: 2 }).default('0').notNull(),
  vacationBalance: decimal('vacation_balance', { precision: 6, scale: 2 }).default('0').notNull(),
  vacationAccrualRate: decimal('vacation_accrual_rate', { precision: 6, scale: 2 }).default('0').notNull(), // Days per year

  // Sick Leave
  sickAccrued: decimal('sick_accrued', { precision: 6, scale: 2 }).default('0').notNull(),
  sickUsed: decimal('sick_used', { precision: 6, scale: 2 }).default('0').notNull(),
  sickBalance: decimal('sick_balance', { precision: 6, scale: 2 }).default('0').notNull(),
  sickAccrualRate: decimal('sick_accrual_rate', { precision: 6, scale: 2 }).default('0').notNull(), // Days per year

  // Personal Days
  personalAccrued: decimal('personal_accrued', { precision: 6, scale: 2 }).default('0').notNull(),
  personalUsed: decimal('personal_used', { precision: 6, scale: 2 }).default('0').notNull(),
  personalBalance: decimal('personal_balance', { precision: 6, scale: 2 }).default('0').notNull(),
  personalAccrualRate: decimal('personal_accrual_rate', { precision: 6, scale: 2 }).default('0').notNull(), // Days per year

  // Tracking
  lastAccrualDate: date('last_accrual_date'),
  yearToDateUsed: decimal('year_to_date_used', { precision: 6, scale: 2 }).default('0').notNull(),

  // Timestamps
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ========================================
// CERTIFICATIONS & LICENSES TABLE
// ========================================
export const certifications = pgTable('certifications', {
  id: serial('id').primaryKey(),

  employeeId: integer('employee_id').notNull(),

  // Certification Details
  certificationName: varchar('certification_name', { length: 255 }).notNull(),
  certificationNumber: varchar('certification_number', { length: 255 }),
  issuingOrganization: varchar('issuing_organization', { length: 255 }),
  category: varchar('category', { length: 100 }), // e.g., OSHA, Trade License, Safety, Management

  // Dates
  issueDate: date('issue_date'),
  expirationDate: date('expiration_date'),
  renewalDate: date('renewal_date'),

  // Status
  status: certificationStatusEnum('status').notNull().default('active'),
  isRequired: boolean('is_required').default(false), // Required for job role

  // Documents
  documentUrl: text('document_url'),

  // Reminders
  reminderSent: boolean('reminder_sent').default(false),
  reminderSentAt: timestamp('reminder_sent_at'),

  // Notes
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// ========================================
// PERFORMANCE REVIEWS TABLE
// ========================================
export const performanceReviews = pgTable('performance_reviews', {
  id: serial('id').primaryKey(),

  employeeId: integer('employee_id').notNull(),
  reviewerId: integer('reviewer_id').notNull(),

  // Review Period
  reviewPeriodStart: date('review_period_start').notNull(),
  reviewPeriodEnd: date('review_period_end').notNull(),
  reviewType: varchar('review_type', { length: 100 }).notNull(), // annual, quarterly, probationary, project_based

  // Status
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, completed, acknowledged

  // Ratings (1-5 scale)
  overallRating: integer('overall_rating'), // 1-5
  qualityOfWork: integer('quality_of_work'), // 1-5
  productivity: integer('productivity'), // 1-5
  teamwork: integer('teamwork'), // 1-5
  communication: integer('communication'), // 1-5
  safetyCompliance: integer('safety_compliance'), // 1-5
  leadership: integer('leadership'), // 1-5
  punctuality: integer('punctuality'), // 1-5

  // Detailed Feedback
  strengths: text('strengths'),
  areasForImprovement: text('areas_for_improvement'),
  accomplishments: text('accomplishments'),
  goals: text('goals'), // Goals for next period
  reviewerComments: text('reviewer_comments'),
  employeeComments: text('employee_comments'),

  // Outcomes
  recommendedForPromotion: boolean('recommended_for_promotion').default(false),
  recommendedForRaise: boolean('recommended_for_raise').default(false),
  raiseAmount: decimal('raise_amount', { precision: 10, scale: 2 }),
  raisePercentage: decimal('raise_percentage', { precision: 5, scale: 2 }),

  // Performance Improvement Plan
  performanceImprovementPlan: boolean('performance_improvement_plan').default(false),
  pipDetails: text('pip_details'),
  pipStartDate: date('pip_start_date'),
  pipEndDate: date('pip_end_date'),

  // Signatures
  reviewerSignedAt: timestamp('reviewer_signed_at'),
  employeeAcknowledgedAt: timestamp('employee_acknowledged_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// ========================================
// TRAINING RECORDS TABLE
// ========================================
export const trainingRecords = pgTable('training_records', {
  id: serial('id').primaryKey(),

  employeeId: integer('employee_id').notNull(),

  // Training Details
  trainingName: varchar('training_name', { length: 255 }).notNull(),
  trainingProvider: varchar('training_provider', { length: 255 }),
  trainingType: varchar('training_type', { length: 100 }), // safety, technical, management, compliance
  category: varchar('category', { length: 100 }), // OSHA, First Aid, Equipment Operation, etc.

  // Status
  status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
  isRequired: boolean('is_required').default(false),
  isMandatory: boolean('is_mandatory').default(false),

  // Dates
  scheduledDate: date('scheduled_date'),
  completedDate: date('completed_date'),
  expirationDate: date('expiration_date'),

  // Results
  passed: boolean('passed'),
  score: decimal('score', { precision: 5, scale: 2 }),
  certificateNumber: varchar('certificate_number', { length: 255 }),
  certificateUrl: text('certificate_url'),

  // Details
  duration: integer('duration'), // Hours
  cost: decimal('cost', { precision: 10, scale: 2 }),
  location: varchar('location', { length: 255 }),
  instructor: varchar('instructor', { length: 255 }),
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});
