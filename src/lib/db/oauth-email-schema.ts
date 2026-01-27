/**
 * OAuth Email Integration Schema
 * Stores OAuth tokens and sync state for connected email accounts
 */
import { pgTable, serial, integer, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Email provider enum
export const emailProviderEnum = pgEnum('email_provider', ['microsoft', 'gmail', 'other']);

// Sync status enum
export const syncStatusEnum = pgEnum('sync_status', ['idle', 'syncing', 'error', 'paused']);

/**
 * Connected email accounts with OAuth credentials
 */
export const connectedEmailAccounts = pgTable('connected_email_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(), // references users.id
  companyId: integer('company_id'), // references companies.id (optional)

  // Email account info
  emailAddress: text('email_address').notNull(),
  displayName: text('display_name'),
  provider: emailProviderEnum('provider').notNull(),

  // OAuth tokens (encrypted)
  accessToken: text('access_token').notNull(), // Encrypted OAuth access token
  refreshToken: text('refresh_token'), // Encrypted OAuth refresh token
  tokenExpiry: timestamp('token_expiry'), // When access token expires

  // Provider-specific IDs
  providerAccountId: text('provider_account_id'), // User ID from provider
  providerTenantId: text('provider_tenant_id'), // Tenant ID (for Microsoft)

  // Sync configuration
  isActive: boolean('is_active').default(true),
  autoSync: boolean('auto_sync').default(true),
  syncFrequencyMinutes: integer('sync_frequency_minutes').default(15), // How often to sync

  // Sync state
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: syncStatusEnum('last_sync_status').default('idle'),
  lastSyncError: text('last_sync_error'),
  lastSyncedEmailId: text('last_synced_email_id'), // Last processed email ID
  lastSyncedEmailDate: timestamp('last_synced_email_date'), // Last email date synced

  // Sync statistics
  totalEmailsSynced: integer('total_emails_synced').default(0),
  totalAttachmentsProcessed: integer('total_attachments_processed').default(0),

  // Filters
  syncFolders: jsonb('sync_folders').default('["INBOX"]'), // Which folders to sync
  syncFromDate: timestamp('sync_from_date'), // Only sync emails after this date
  excludePatterns: jsonb('exclude_patterns').default('[]'), // Patterns to exclude (regex)

  // Permissions granted
  hasReadPermission: boolean('has_read_permission').default(true),
  hasSendPermission: boolean('has_send_permission').default(false),
  hasCalendarPermission: boolean('has_calendar_permission').default(false),

  // Metadata
  metadata: jsonb('metadata').default('{}'), // Additional provider-specific data

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

/**
 * Synced emails from connected accounts
 */
export const syncedEmails = pgTable('synced_emails', {
  id: serial('id').primaryKey(),
  connectedAccountId: integer('connected_account_id').notNull(), // references connected_email_accounts.id

  // Email identifiers
  providerEmailId: text('provider_email_id').notNull(), // Unique ID from provider
  providerThreadId: text('provider_thread_id'), // Thread/conversation ID
  messageId: text('message_id'), // RFC 822 Message-ID header

  // Email metadata
  subject: text('subject'),
  fromAddress: text('from_address').notNull(),
  fromName: text('from_name'),
  toAddresses: jsonb('to_addresses').default('[]'), // Array of {email, name}
  ccAddresses: jsonb('cc_addresses').default('[]'),
  bccAddresses: jsonb('bcc_addresses').default('[]'),
  replyToAddress: text('reply_to_address'),

  // Email content
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  snippet: text('snippet'), // Short preview (first 150 chars)

  // Email properties
  sentAt: timestamp('sent_at'),
  receivedAt: timestamp('received_at').notNull(),
  isRead: boolean('is_read').default(false),
  isImportant: boolean('is_important').default(false),
  hasAttachments: boolean('has_attachments').default(false),
  attachmentCount: integer('attachment_count').default(0),

  // Categorization
  folderName: text('folder_name'), // INBOX, Sent, Drafts, etc.
  categories: jsonb('categories').default('[]'), // Provider categories/labels

  // AI Processing
  aiProcessed: boolean('ai_processed').default(false),
  aiProcessedAt: timestamp('ai_processed_at'),
  aiExtractedData: jsonb('ai_extracted_data'), // AI-extracted structured data
  aiConfidence: integer('ai_confidence'), // 0-100
  aiSummary: text('ai_summary'), // AI-generated summary

  // Project linking
  linkedProjectId: integer('linked_project_id'), // references projects.id
  linkedTaskId: integer('linked_task_id'), // references project_tasks.id
  linkedRfiId: integer('linked_rfi_id'), // references rfis.id
  linkedSubmittalId: integer('linked_submittal_id'), // references submittals.id

  // Processing status
  needsReview: boolean('needs_review').default(false),
  reviewedBy: integer('reviewed_by'), // user_id who reviewed
  reviewedAt: timestamp('reviewed_at'),

  // Full email data (for reference)
  rawEmailData: jsonb('raw_email_data'), // Full email object from provider

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Email attachments from synced emails
 */
export const emailAttachments = pgTable('email_attachments', {
  id: serial('id').primaryKey(),
  syncedEmailId: integer('synced_email_id').notNull(), // references synced_emails.id
  connectedAccountId: integer('connected_account_id').notNull(),

  // Attachment identifiers
  providerAttachmentId: text('provider_attachment_id').notNull(),

  // Attachment metadata
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // bytes
  mimeType: text('mime_type'),
  contentId: text('content_id'), // For inline images

  // Storage
  storagePath: text('storage_path'), // Path in S3 or local storage
  storageUrl: text('storage_url'), // Public URL (if applicable)
  isInline: boolean('is_inline').default(false),

  // Processing status
  downloaded: boolean('downloaded').default(false),
  downloadedAt: timestamp('downloaded_at'),
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),

  // Document indexing
  indexed: boolean('indexed').default(false),
  indexedDocumentId: integer('indexed_document_id'), // references indexed_documents.id

  // File type detection
  fileType: text('file_type'), // 'pdf', 'image', 'doc', 'spreadsheet', 'drawing', etc.
  isPotentialDrawing: boolean('is_potential_drawing').default(false),
  isPotentialSpec: boolean('is_potential_spec').default(false),
  isPotentialPhoto: boolean('is_potential_photo').default(false),

  // Metadata
  metadata: jsonb('metadata').default('{}'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * OAuth sync jobs/tasks
 */
export const emailSyncJobs = pgTable('email_sync_jobs', {
  id: serial('id').primaryKey(),
  connectedAccountId: integer('connected_account_id').notNull(),

  // Job info
  jobType: text('job_type').notNull(), // 'full_sync', 'incremental', 'manual', 'attachment_download'
  status: syncStatusEnum('status').default('idle'),

  // Progress tracking
  totalItems: integer('total_items').default(0),
  processedItems: integer('processed_items').default(0),
  failedItems: integer('failed_items').default(0),

  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),

  // Error handling
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),

  // Results
  results: jsonb('results').default('{}'), // Summary of sync results

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type ConnectedEmailAccount = typeof connectedEmailAccounts.$inferSelect;
export type NewConnectedEmailAccount = typeof connectedEmailAccounts.$inferInsert;
export type SyncedEmail = typeof syncedEmails.$inferSelect;
export type NewSyncedEmail = typeof syncedEmails.$inferInsert;
export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type NewEmailAttachment = typeof emailAttachments.$inferInsert;
export type EmailSyncJob = typeof emailSyncJobs.$inferSelect;
export type NewEmailSyncJob = typeof emailSyncJobs.$inferInsert;
