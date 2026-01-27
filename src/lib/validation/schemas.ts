/**
 * Zod Validation Schemas
 * Comprehensive input validation for all API endpoints
 * Priority: P0 - Critical for security and data integrity
 *
 * SECURITY: Uses sanitization functions to prevent:
 * - XSS attacks
 * - SQL injection
 * - Path traversal
 * - Command injection
 */

import { z } from 'zod';
import {
  escapeHtml,
  sanitizeFilename,
  sanitizePath,
  hasSuspiciousContent,
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
} from '../security/input-sanitizer';

// ========================================
// COMMON VALIDATION PATTERNS
// ========================================

// Email validation
export const emailSchema = z.string().email('Invalid email address').trim().toLowerCase();

// Phone number validation (flexible to support various formats)
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number is too long');

// Password validation (strong password requirements)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// URL validation
export const urlSchema = z.string().url('Invalid URL');

// Positive integer validation
export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

// Non-negative integer validation
export const nonNegativeIntSchema = z.number().int().nonnegative('Cannot be negative');

// Money amount (in cents) validation
export const moneySchema = z.number().int().nonnegative('Amount cannot be negative');

// Date validation
export const dateSchema = z.coerce.date();

// Sanitized text (removes dangerous HTML/script tags)
export const sanitizedTextSchema = z
  .string()
  .trim()
  .refine((val) => !hasSuspiciousContent(val), {
    message: 'Input contains potentially malicious content',
  })
  .transform((val) => sanitizeText(val, { maxLength: 10000 }));

// Helper to create sanitized text with length constraints
export const sanitizedText = (options?: { min?: number; max?: number }) => {
  let base = z.string().trim();

  if (options?.min) {
    base = base.min(options.min) as any;
  }
  if (options?.max) {
    base = base.max(options.max) as any;
  }

  return base
    .refine((val) => !hasSuspiciousContent(val), {
      message: 'Input contains potentially malicious content',
    })
    .transform((val) => sanitizeText(val, { maxLength: options?.max || 10000 }));
};

// File path validation (prevent directory traversal)
export const safePathSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_\-\.\/]+$/, 'Invalid file path')
  .refine((path) => !path.includes('..'), 'Directory traversal not allowed')
  .transform((path) => sanitizePath(path));

// Safe filename validation
export const safeFilenameSchema = z
  .string()
  .min(1, 'Filename is required')
  .max(255, 'Filename too long')
  .refine((name) => !name.includes('..') && !name.includes('/') && !name.includes('\\'), {
    message: 'Invalid characters in filename',
  })
  .transform((name) => sanitizeFilename(name));

// ========================================
// USER VALIDATION SCHEMAS
// ========================================

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  role: z.enum(['OWNER', 'ARCHITECT', 'GC', 'SUB', 'ADMIN']),
  company: z.string().max(255).trim().optional(),
  phone: phoneSchema.optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  company: z.string().max(255).trim().optional(),
  phone: phoneSchema.optional(),
  avatar: urlSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ========================================
// PROJECT VALIDATION SCHEMAS
// ========================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255).trim(),
  description: sanitizedTextSchema.optional(),
  status: z.enum(['planning', 'bidding', 'pre_construction', 'in_progress', 'closeout', 'completed', 'on_hold']).default('planning'),
  projectNumber: z.string().min(1, 'Project number is required').max(100).trim(),

  // Location
  address: sanitizedText({ max: 500 }).optional(),
  city: z.string().max(100).trim().optional(),
  state: z.string().length(2, 'State must be 2 characters').toUpperCase().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),

  // Budget (in cents)
  totalBudget: moneySchema.optional(),

  // Dates
  startDate: dateSchema.optional(),
  estimatedCompletion: dateSchema.optional(),

  // Team
  ownerId: positiveIntSchema.optional(),
  generalContractorId: positiveIntSchema.optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ========================================
// TASK VALIDATION SCHEMAS
// ========================================

export const createTaskSchema = z.object({
  projectId: positiveIntSchema,
  title: z.string().min(1, 'Task title is required').max(255).trim(),
  description: sanitizedTextSchema.optional(),
  type: z.enum(['general', 'submittal', 'rfi', 'inspection', 'safety', 'milestone']).default('general'),
  status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.array(positiveIntSchema).default([]),
  dueDate: dateSchema.optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

// ========================================
// RFI VALIDATION SCHEMAS
// ========================================

export const createRFISchema = z.object({
  projectId: positiveIntSchema,
  rfiNumber: z.string().min(1, 'RFI number is required').max(50).trim(),
  subject: z.string().min(1, 'Subject is required').max(255).trim(),
  description: sanitizedText({ min: 1 }),
  question: sanitizedText({ min: 1 }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: positiveIntSchema.optional(),
  dueDate: dateSchema.optional(),
});

export const respondToRFISchema = z.object({
  response: sanitizedText({ min: 1 }),
  status: z.enum(['answered', 'closed']),
});

// ========================================
// CHANGE ORDER VALIDATION SCHEMAS
// ========================================

export const createChangeOrderSchema = z.object({
  projectId: positiveIntSchema,
  changeOrderNumber: z.string().min(1, 'Change order number is required').max(50).trim(),
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: sanitizedText({ min: 1 }),
  reason: sanitizedText({ min: 1 }),

  // Financial tracking
  baseContractAmount: moneySchema.optional(),
  clientContingency: moneySchema.optional(),
  proposedAmount: moneySchema.min(1, 'Proposed amount must be greater than 0'),

  // Schedule impact
  scheduleImpactDays: z.number().int().default(0),
  originalCompletion: dateSchema.optional(),
  revisedCompletion: dateSchema.optional(),
});

export const approveChangeOrderSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  approvedAmount: moneySchema.optional(),
});

// ========================================
// SUBMITTAL VALIDATION SCHEMAS
// ========================================

export const createSubmittalSchema = z.object({
  projectId: positiveIntSchema,
  submittalNumber: z.string().min(1, 'Submittal number is required').max(50).trim(),
  csiDivision: z.string().regex(/^\d{2}$/, 'CSI Division must be 2 digits (e.g., "03")'),
  specSection: z.string().max(50).trim().optional(),
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: sanitizedTextSchema.optional(),
  dueDate: dateSchema.optional(),
});

export const reviewSubmittalSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  comments: sanitizedTextSchema.optional(),
  finalStatus: z.string().max(50).optional(),
});

// ========================================
// DAILY REPORT VALIDATION SCHEMAS
// ========================================

export const createDailyReportSchema = z.object({
  projectId: positiveIntSchema,
  reportDate: dateSchema,
  weatherCondition: z.string().max(100).optional(),
  temperature: z.string().max(50).optional(),
  totalWorkers: nonNegativeIntSchema.default(0),
  workPerformed: sanitizedText({ min: 1 }),
  issues: sanitizedTextSchema.optional(),
  safetyNotes: sanitizedTextSchema.optional(),
});

// ========================================
// SAFETY VALIDATION SCHEMAS
// ========================================

export const createSafetyMeetingSchema = z.object({
  projectId: positiveIntSchema,
  meetingNumber: z.string().min(1, 'Meeting number is required').max(50).trim(),
  meetingType: z.enum(['toolbox', 'committee', 'orientation', 'emergency']),
  meetingDate: dateSchema,
  duration: z.number().int().min(15, 'Toolbox meetings must be at least 15 minutes').default(15),
  topic: z.string().min(1, 'Topic is required').max(255).trim(),
  discussion: sanitizedText({ min: 1 }),
  location: z.string().max(255).optional(),
});

export const createIncidentReportSchema = z.object({
  projectId: positiveIntSchema,
  incidentNumber: z.string().min(1, 'Incident number is required').max(50).trim(),
  incidentType: z.enum(['injury', 'illness', 'property_damage', 'environmental', 'near_miss']),
  severity: z.enum(['first_aid', 'recordable', 'lost_time', 'fatality', 'near_miss']),
  incidentDate: dateSchema,
  incidentTime: z.string().max(20).optional(),
  location: sanitizedText({ min: 1 }),
  description: sanitizedText({ min: 1 }),
  whatHappened: sanitizedText({ min: 1 }),
  injuredPartyName: z.string().max(255).optional(),
  injuredPartyCompany: z.string().max(255).optional(),
});

// ========================================
// FILE UPLOAD VALIDATION SCHEMAS
// ========================================

export const fileUploadSchema = z.object({
  projectId: positiveIntSchema,
  fileName: safeFilenameSchema,
  fileSize: z.number().int().positive().max(100 * 1024 * 1024, 'File size cannot exceed 100MB'),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
  folderType: z.enum([
    'photos',
    'daily_reports',
    'certificates_insurance',
    'contracts',
    'submittals',
    'shop_drawings',
    'rfis',
    'change_orders',
    'plans_specs',
    'safety',
    'meeting_minutes',
    'warranties',
    'closeout',
    'estimates',
    'general'
  ]),
  description: sanitizedTextSchema.optional(),
});

// Allowed MIME types for file uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export const validateMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
};

// ========================================
// PAGINATION VALIDATION SCHEMA
// ========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ========================================
// ID PARAMETER VALIDATION
// ========================================

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid ID'),
});

export const projectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive('Invalid project ID'),
});

// ========================================
// CLOSEOUT VALIDATION SCHEMAS
// ========================================

export const createCloseoutItemSchema = z.object({
  projectId: positiveIntSchema,
  division: z.string().regex(/^DIV\s?\d{2}$/, 'Division must be in format "DIV 01" or "DIV01"'),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  itemType: z.enum(['document', 'inspection', 'testing', 'training', 'certification']),
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: sanitizedTextSchema.optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: dateSchema.optional(),
  assignedTo: positiveIntSchema.optional(),
});

// ========================================
// ENTITY VALIDATION SCHEMAS
// ========================================

export const createEntitySchema = z.object({
  entityType: z.enum(['gc', 'owner', 'architect', 'engineer', 'subcontractor', 'supplier']),
  companyName: z.string().min(1, 'Company name is required').max(200).trim(),
  legalName: z.string().max(200).trim().optional(),
  dbaName: z.string().max(200).trim().optional(),
  tagline: sanitizedText({ max: 500 }).optional(),
  description: sanitizedTextSchema.optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  website: urlSchema.optional(),
  address: sanitizedTextSchema.optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).toUpperCase().optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
});

// ========================================
// CONTACT VALIDATION SCHEMAS
// ========================================

export const createContactSchema = z.object({
  projectId: positiveIntSchema,
  contactType: z.enum(['subcontractor', 'supplier', 'vendor', 'consultant', 'inspector', 'owner_rep', 'architect', 'engineer']),

  // Basic Information
  firstName: z.string().max(100).trim().optional(),
  lastName: z.string().max(100).trim().optional(),
  fullName: z.string().min(1, 'Full name or first/last name is required').max(200).trim(),
  title: z.string().max(100).trim().optional(),
  company: z.string().min(1, 'Company is required').max(200).trim(),

  // Contact Details
  email: emailSchema.optional(),
  phoneMain: phoneSchema.optional(),
  phoneMobile: phoneSchema.optional(),
  phoneOffice: phoneSchema.optional(),
  fax: z.string().max(50).optional(),

  // Address
  address: sanitizedText({ max: 255 }).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).toUpperCase().optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),

  // CSI Division Association
  csiDivisions: z.array(z.string()).optional(),
  primaryDivision: z.string().max(10).optional(),

  // Trade/Specialty
  trade: z.string().max(100).optional(),
  specialty: z.string().max(200).optional(),

  // Business Information
  businessLicense: z.string().max(100).optional(),
  taxId: z.string().max(50).optional(),
  websiteUrl: urlSchema.optional(),

  // Communication Preferences
  preferredContact: z.enum(['email', 'phone', 'mobile', 'text']).default('email'),
  languages: z.array(z.string()).optional(),

  // Status & Verification
  status: z.enum(['active', 'inactive', 'blacklisted', 'prospect']).default('active'),
  isVerified: z.boolean().default(false),
  isPrimary: z.boolean().default(false),

  // Source Tracking
  sourceType: z.enum(['email', 'submittal', 'rfi', 'change_order', 'payment_app', 'manual']).optional(),
  sourceDocumentId: z.number().int().optional(),
  extractedBy: z.enum(['ai', 'manual', 'import']).optional(),

  // Relationships
  userId: positiveIntSchema.optional(),
  subcontractId: positiveIntSchema.optional(),

  // Notes & Tags
  notes: sanitizedTextSchema.optional(),
  tags: z.array(z.string()).optional(),

  // Additional fields for division associations
  scopeOfWork: sanitizedTextSchema.optional(),

  // Metadata
  lastContactDate: dateSchema.optional(),
  createdBy: positiveIntSchema.optional(),
});

export const updateContactSchema = createContactSchema.partial().omit({ projectId: true });

// ========================================
// BIDDING VALIDATION SCHEMAS
// ========================================

export const createBidPackageSchema = z.object({
  projectId: positiveIntSchema,
  bidNumber: z.string().min(1, 'Bid number is required').max(100).trim(),
  title: z.string().min(1, 'Title is required').max(255).trim(),
  description: sanitizedTextSchema.optional(),
  bidType: z.enum(['public_competitive', 'public_design_build', 'private_negotiated', 'private_competitive', 'cm_at_risk']),
  bidDueDate: dateSchema,
  estimatedContractValue: moneySchema.optional(),
  requiresMWBE: z.boolean().default(false),
  mwbeGoalPercentage: z.number().int().min(0).max(100).optional(),
});

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Generic validation function that can be used in API endpoints
 */
export async function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Middleware-style validator for Astro API routes
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return async (data: unknown): Promise<T> => {
    return schema.parseAsync(data);
  };
}
