/**
 * Email Integration Schema
 * Tracks emails linked to tasks and email parsing configuration
 */
import { pgTable, serial, integer, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';

/**
 * Email messages linked to tasks
 */
export const taskEmails = pgTable('task_emails', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(), // References project_tasks.id
  projectId: integer('project_id').notNull(), // References projects.id

  // Email metadata
  emailId: text('email_id').notNull(), // Unique ID from email provider (Message-ID)
  threadId: text('thread_id'), // Email thread ID for grouping related emails
  subject: text('subject').notNull(),
  fromAddress: text('from_address').notNull(),
  fromName: text('from_name'),
  toAddresses: text('to_addresses').notNull(), // Comma-separated
  ccAddresses: text('cc_addresses'),

  // Email content
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  snippet: text('snippet'), // Short preview

  // Email metadata
  sentAt: timestamp('sent_at').notNull(),
  receivedAt: timestamp('received_at').notNull(),
  hasAttachments: boolean('has_attachments').default(false),
  attachmentCount: integer('attachment_count').default(0),

  // Processing metadata
  parsedAt: timestamp('parsed_at'),
  parsedBy: text('parsed_by').default('ai'), // 'ai' or 'manual'
  aiExtractedData: json('ai_extracted_data'), // JSON of what AI extracted
  confidence: integer('confidence'), // 0-100 confidence score of AI extraction

  // Link type
  linkType: text('link_type').default('related'), // 'created_from', 'related', 'mentioned', 'update'

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Email forwarding addresses for projects
 */
export const projectEmailAddresses = pgTable('project_email_addresses', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),

  // Email address
  emailAddress: text('email_address').notNull().unique(), // e.g., "project-162-mockingbird@tasks.constructaid.com"
  displayName: text('display_name'), // e.g., "ORG 162 Mockingbird ES Tasks"

  // Configuration
  isActive: boolean('is_active').default(true),
  autoCreateTasks: boolean('auto_create_tasks').default(true), // Automatically create tasks from emails
  requireApproval: boolean('require_approval').default(false), // Tasks need approval before creation

  // Parsing rules
  defaultCategory: text('default_category'),
  defaultPriority: text('default_priority').default('medium'),
  defaultAssignedTo: integer('default_assigned_to'),

  // AI settings
  aiEnabled: boolean('ai_enabled').default(true),
  aiModel: text('ai_model').default('gpt-4'), // 'gpt-4', 'claude-3', etc.

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Email parsing rules and patterns
 */
export const emailParsingRules = pgTable('email_parsing_rules', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id'), // Null = global rule

  name: text('name').notNull(),
  description: text('description'),

  // Pattern matching
  subjectPattern: text('subject_pattern'), // Regex pattern for subject
  bodyPattern: text('body_pattern'), // Regex pattern for body
  fromPattern: text('from_pattern'), // Regex pattern for sender

  // Actions when matched
  setCategory: text('set_category'),
  setPriority: text('set_priority'),
  setAssignedTo: integer('set_assigned_to'),
  addTags: text('add_tags'), // Comma-separated tags

  // Rule metadata
  isActive: boolean('is_active').default(true),
  priority: integer('priority').default(0), // Higher priority rules applied first

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Email integration settings per user
 */
export const userEmailIntegrations = pgTable('user_email_integrations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),

  // Provider
  provider: text('provider').notNull(), // 'outlook', 'gmail', 'exchange'

  // OAuth tokens (encrypted in production)
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),

  // Account info
  email: text('email').notNull(),
  displayName: text('display_name'),

  // Sync settings
  syncEnabled: boolean('sync_enabled').default(true),
  syncFolders: text('sync_folders'), // JSON array of folder IDs to monitor
  lastSyncAt: timestamp('last_sync_at'),
  syncInterval: integer('sync_interval').default(15), // Minutes

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Predefined email patterns for common construction communications
export const COMMON_EMAIL_PATTERNS = {
  RFI: {
    subjectPatterns: [
      /RFI[#\s-]*(\d+)/i,
      /Request for Information/i,
      /Information Request/i,
    ],
    category: 'RFI Follow-up',
    priority: 'high',
  },
  SUBMITTAL: {
    subjectPatterns: [
      /Submittal[#\s-]*(\d+)/i,
      /SUBM[#\s-]*(\d+)/i,
      /Product Data/i,
      /Shop Drawing/i,
    ],
    category: 'Submittal Review',
    priority: 'medium',
  },
  CHANGE_ORDER: {
    subjectPatterns: [
      /Change Order[#\s-]*(\d+)/i,
      /CO[#\s-]*(\d+)/i,
      /PCO[#\s-]*(\d+)/i,
    ],
    category: 'Change Order',
    priority: 'high',
  },
  INSPECTION: {
    subjectPatterns: [
      /Inspection/i,
      /Building Inspector/i,
      /Fire Marshal/i,
      /Code Compliance/i,
    ],
    category: 'Inspection Required',
    priority: 'high',
  },
  SAFETY: {
    subjectPatterns: [
      /Safety/i,
      /Incident/i,
      /Near Miss/i,
      /OSHA/i,
    ],
    category: 'Safety Issue',
    priority: 'urgent',
  },
  URGENT: {
    subjectPatterns: [
      /URGENT/i,
      /ASAP/i,
      /IMMEDIATE/i,
      /CRITICAL/i,
    ],
    priority: 'urgent',
  },
} as const;

// AI Prompt template for email parsing
export const EMAIL_PARSING_PROMPT = `You are an AI assistant helping to extract task information from construction project emails.

Analyze the following email and extract structured task information:

EMAIL DETAILS:
From: {from}
Subject: {subject}
Body: {body}

INSTRUCTIONS:
1. Identify if this email requires action or is just informational
2. Extract the following if present:
   - Task title (concise, actionable)
   - Description (key details)
   - Due date (parse natural language dates)
   - Priority (urgent/high/medium/low)
   - Category (RFI Follow-up, Submittal Review, Inspection Required, Safety Issue, etc.)
   - Assigned person/company (from signature or mentions)
   - Location (building, floor, room mentioned)
   - Blockers or dependencies
   - Cost code or CSI division if mentioned
   - Any referenced document numbers (RFI #, Submittal #, etc.)

3. Determine confidence level (0-100) for your extraction

Return JSON in this exact format:
{
  "requiresAction": true/false,
  "confidence": 0-100,
  "task": {
    "title": "...",
    "description": "...",
    "category": "...",
    "priority": "...",
    "dueDate": "YYYY-MM-DD" or null,
    "assignedToName": "...",
    "assignedToCompany": "...",
    "location": "...",
    "costCode": "...",
    "blockers": "...",
    "relatedDocumentType": "RFI/Submittal/etc" or null,
    "relatedDocumentNumber": "..." or null,
    "tags": ["tag1", "tag2"]
  },
  "reasoning": "Brief explanation of extraction"
}`;

export type EmailParsingResult = {
  requiresAction: boolean;
  confidence: number;
  task: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    dueDate?: string;
    assignedToName?: string;
    assignedToCompany?: string;
    location?: string;
    costCode?: string;
    blockers?: string;
    relatedDocumentType?: string;
    relatedDocumentNumber?: string;
    tags?: string[];
  };
  reasoning: string;
};
