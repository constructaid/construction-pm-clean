/**
 * Company & Tenant Management Schema
 * Multi-tenant architecture for construction companies
 * Each company is a separate tenant with its own subscription
 */
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, serial, pgEnum, decimal } from 'drizzle-orm/pg-core';

// Enums
export const companyTypeEnum = pgEnum('company_type', ['general_contractor', 'subcontractor', 'owner', 'architect', 'engineer', 'consultant']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'basic', 'professional', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trial', 'active', 'past_due', 'cancelled', 'suspended']);

// ========================================
// COMPANIES TABLE (Tenants)
// ========================================
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),

  // Company Information
  companyName: varchar('company_name', { length: 255 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }),
  companyType: companyTypeEnum('company_type').notNull(),

  // Tax & Legal
  taxId: varchar('tax_id', { length: 100 }), // EIN
  licenseNumber: varchar('license_number', { length: 255 }),
  licenseState: varchar('license_state', { length: 2 }),

  // Contact Information
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),

  // Address
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  country: varchar('country', { length: 2 }).default('US'),

  // Branding
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3D9991'), // Hex color

  // Settings
  timezone: varchar('timezone', { length: 100 }).default('America/Chicago'),
  dateFormat: varchar('date_format', { length: 50 }).default('MM/DD/YYYY'),
  currency: varchar('currency', { length: 3 }).default('USD'),

  // Owner/Admin
  primaryContactId: integer('primary_contact_id'), // Links to users table

  // Status
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// ========================================
// SUBSCRIPTIONS TABLE
// ========================================
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),

  companyId: integer('company_id').notNull().unique(), // One subscription per company

  // Subscription Details
  tier: subscriptionTierEnum('tier').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('trial'),

  // Billing
  billingEmail: varchar('billing_email', { length: 255 }),
  billingCycle: varchar('billing_cycle', { length: 50 }).default('monthly'), // monthly, annual
  pricePerMonth: decimal('price_per_month', { precision: 10, scale: 2 }),

  // Dates
  trialStartDate: timestamp('trial_start_date'),
  trialEndDate: timestamp('trial_end_date'),
  subscriptionStartDate: timestamp('subscription_start_date'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelledAt: timestamp('cancelled_at'),

  // Limits (based on tier)
  maxUsers: integer('max_users').default(5),
  maxProjects: integer('max_projects').default(10),
  maxStorage: integer('max_storage').default(10000), // MB

  // Usage tracking
  currentUsers: integer('current_users').default(0),
  currentProjects: integer('current_projects').default(0),
  currentStorage: integer('current_storage').default(0), // MB

  // Payment
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  lastPaymentDate: timestamp('last_payment_date'),
  lastPaymentAmount: decimal('last_payment_amount', { precision: 10, scale: 2 }),
  nextPaymentDate: timestamp('next_payment_date'),

  // Notes
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ========================================
// MODULE SUBSCRIPTIONS (Add-on Modules)
// ========================================
export const moduleSubscriptions = pgTable('module_subscriptions', {
  id: serial('id').primaryKey(),

  companyId: integer('company_id').notNull(),

  // Module Information
  moduleName: varchar('module_name', { length: 100 }).notNull(), // 'hr', 'ai_assistant', 'advanced_reporting', etc.
  moduleDisplayName: varchar('module_display_name', { length: 255 }).notNull(),

  // Status
  isEnabled: boolean('is_enabled').default(true),
  isTrialing: boolean('is_trialing').default(false),

  // Pricing
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).default('0'),
  annualPrice: decimal('annual_price', { precision: 10, scale: 2 }).default('0'),

  // Dates
  enabledAt: timestamp('enabled_at').defaultNow().notNull(),
  trialEndDate: timestamp('trial_end_date'),
  disabledAt: timestamp('disabled_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ========================================
// AVAILABLE MODULES (Catalog)
// ========================================
export const availableModules = pgTable('available_modules', {
  id: serial('id').primaryKey(),

  // Module Details
  moduleName: varchar('module_name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'core', 'add_on', 'premium'

  // Pricing
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).default('0'),
  annualPrice: decimal('annual_price', { precision: 10, scale: 2 }).default('0'),
  trialDays: integer('trial_days').default(14),

  // Features
  features: jsonb('features').default('[]'), // Array of feature descriptions

  // Requirements
  requiredTier: subscriptionTierEnum('required_tier'), // Minimum tier needed
  dependsOn: jsonb('depends_on').default('[]'), // Array of module names this depends on

  // Availability
  isActive: boolean('is_active').default(true),
  isBeta: boolean('is_beta').default(false),
  sortOrder: integer('sort_order').default(0),

  // Marketing
  icon: varchar('icon', { length: 100 }), // Icon name or emoji
  color: varchar('color', { length: 7 }), // Hex color
  marketingUrl: varchar('marketing_url', { length: 255 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ========================================
// USER ROLES (Enhanced with company context)
// ========================================
export const companyUserRoles = pgTable('company_user_roles', {
  id: serial('id').primaryKey(),

  userId: integer('user_id').notNull(),
  companyId: integer('company_id').notNull(),

  // Role within company
  role: varchar('role', { length: 100 }).notNull(), // 'owner', 'admin', 'manager', 'employee', 'readonly'

  // Permissions (for granular control)
  permissions: jsonb('permissions').default('{}'), // Object with permission flags

  // Module Access
  moduleAccess: jsonb('module_access').default('{}'), // Which modules user can access

  // Status
  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false), // Is this user's primary company?

  // Invitation
  invitedBy: integer('invited_by'),
  invitedAt: timestamp('invited_at'),
  acceptedAt: timestamp('accepted_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
});

// ========================================
// AUDIT LOG (Company-level)
// ========================================
export const companyAuditLog = pgTable('company_audit_log', {
  id: serial('id').primaryKey(),

  companyId: integer('company_id').notNull(),
  userId: integer('user_id'),

  // Action Details
  action: varchar('action', { length: 100 }).notNull(), // 'module_enabled', 'user_invited', 'subscription_upgraded', etc.
  entityType: varchar('entity_type', { length: 100 }), // 'module', 'user', 'subscription', etc.
  entityId: integer('entity_id'),

  // Data
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),

  // Context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  notes: text('notes'),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
