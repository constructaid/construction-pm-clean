/**
 * AI Workspace Database Schema
 * Stores AI conversations, document embeddings, and project-specific AI context
 */

import { pgTable, text, integer, timestamp, jsonb, boolean, real, serial, varchar, index } from 'drizzle-orm/pg-core';

/**
 * AI Conversations - Project-specific chat history
 */
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(), // Auto-generated from first message
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isArchived: boolean('is_archived').default(false),
  metadata: jsonb('metadata'), // { tags: [], category: 'rfi' | 'budget' | 'schedule', etc. }
}, (table) => ({
  projectIdx: index('ai_conversations_project_idx').on(table.projectId),
  userIdx: index('ai_conversations_user_idx').on(table.userId),
}));

/**
 * AI Messages - Individual messages in conversations
 */
export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // AI-specific fields
  model: text('model'), // 'llama3.1:70b', etc.
  tokensUsed: integer('tokens_used'),
  processingTimeMs: integer('processing_time_ms'),

  // Document references
  documentReferences: jsonb('document_references'), // [{ docId: 1, page: 3, excerpt: '...' }]

  // Actions taken
  actionsTaken: jsonb('actions_taken'), // [{ type: 'create_task', taskId: 123 }]

  // Sources cited
  sources: jsonb('sources'), // [{ reference: 'ACI 318', csiCode: '03 20 00' }]
}, (table) => ({
  conversationIdx: index('ai_messages_conversation_idx').on(table.conversationId),
}));

/**
 * Project Documents - Uploaded files for AI analysis
 */
export const projectDocuments = pgTable('project_documents', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  uploadedBy: integer('uploaded_by').notNull(),

  // File info
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // 'pdf', 'docx', 'xlsx', 'dwg', 'jpg', etc.
  fileSize: integer('file_size').notNull(), // bytes
  fileUrl: text('file_url').notNull(),

  // Categorization
  category: text('category').notNull(), // 'rfi', 'submittal', 'change_order', 'estimate', 'drawing', 'photo', 'contract', 'email'
  subcategory: text('subcategory'), // 'architectural', 'structural', 'DIV 03', etc.

  // Metadata extracted by AI
  extractedText: text('extracted_text'), // Full text content (for search)
  metadata: jsonb('metadata'), // { pages: 10, author: 'John Doe', date: '2024-01-01', etc. }
  aiSummary: text('ai_summary'), // AI-generated summary

  // Status
  isIndexed: boolean('is_indexed').default(false), // Has vector embeddings been created?
  processingStatus: text('processing_status').default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  processingError: text('processing_error'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  projectIdx: index('project_documents_project_idx').on(table.projectId),
  categoryIdx: index('project_documents_category_idx').on(table.category),
}));

/**
 * Document Embeddings - Vector embeddings for semantic search
 */
export const documentEmbeddings = pgTable('document_embeddings', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').notNull().references(() => projectDocuments.id, { onDelete: 'cascade' }),

  // Chunk info (large documents are split into chunks)
  chunkIndex: integer('chunk_index').notNull(),
  chunkText: text('chunk_text').notNull(),

  // Vector embedding (384 dimensions for sentence-transformers/all-MiniLM-L6-v2)
  embedding: text('embedding').notNull(), // Stored as JSON array string

  // Metadata
  pageNumber: integer('page_number'),
  sectionTitle: text('section_title'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  documentIdx: index('document_embeddings_document_idx').on(table.documentId),
}));

/**
 * AI Workspace Settings - Project-specific AI configuration
 */
export const aiWorkspaceSettings = pgTable('ai_workspace_settings', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().unique(),

  // AI Model preferences
  preferredModel: text('preferred_model').default('llama3.1:70b'),
  temperature: real('temperature').default(0.7),
  maxTokens: integer('max_tokens').default(2048),

  // Context settings
  includeProjectInfo: boolean('include_project_info').default(true),
  includeRecentTasks: boolean('include_recent_tasks').default(true),
  includeTeamMembers: boolean('include_team_members').default(true),
  includeBudgetInfo: boolean('include_budget_info').default(true),
  includeSchedule: boolean('include_schedule').default(true),

  // Document settings
  autoIndexDocuments: boolean('auto_index_documents').default(true),
  maxDocumentsInContext: integer('max_documents_in_context').default(5),

  // Workflow automation
  autoCreateTasksFromEmail: boolean('auto_create_tasks_from_email').default(true),
  autoRespondToRFIs: boolean('auto_respond_to_rfis').default(false),
  autoAnalyzeChangeOrders: boolean('auto_analyze_change_orders').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * AI Actions - Track actions taken by AI
 */
export const aiActions = pgTable('ai_actions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  conversationId: integer('conversation_id').references(() => aiConversations.id),
  messageId: integer('message_id').references(() => aiMessages.id),

  // Action details
  actionType: text('action_type').notNull(), // 'create_task', 'draft_rfi_response', 'analyze_change_order', 'send_email', etc.
  actionData: jsonb('action_data').notNull(), // Full action payload

  // Result
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'failed'
  result: jsonb('result'), // Result data
  error: text('error'),

  // Approval workflow
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  executedAt: timestamp('executed_at'),
}, (table) => ({
  projectIdx: index('ai_actions_project_idx').on(table.projectId),
  statusIdx: index('ai_actions_status_idx').on(table.status),
}));

/**
 * AI Training Data - Store successful interactions for fine-tuning
 */
export const aiTrainingData = pgTable('ai_training_data', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id'),

  // Training example
  prompt: text('prompt').notNull(),
  completion: text('completion').notNull(),

  // Metadata
  category: text('category'), // 'rfi', 'change_order', 'estimate', etc.
  quality: integer('quality'), // 1-5 rating

  // Feedback
  userRating: integer('user_rating'), // 1-5, from user feedback
  wasHelpful: boolean('was_helpful'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Document Relationships - Link documents to RFIs, Change Orders, etc.
 */
export const documentRelationships = pgTable('document_relationships', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id').notNull().references(() => projectDocuments.id, { onDelete: 'cascade' }),

  // Related entity
  entityType: text('entity_type').notNull(), // 'rfi', 'change_order', 'submittal', 'task', etc.
  entityId: integer('entity_id').notNull(),

  // Relationship type
  relationshipType: text('relationship_type').notNull(), // 'attachment', 'reference', 'source', 'response'

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  documentIdx: index('document_relationships_document_idx').on(table.documentId),
  entityIdx: index('document_relationships_entity_idx').on(table.entityType, table.entityId),
}));
