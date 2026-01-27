/**
 * Email Attachment Indexing Service
 *
 * Integrates email attachments with the document indexing system
 * Processes attachments for full-text search and AI analysis
 */

import { db } from '../db';
import { emailAttachments } from '../db/oauth-email-schema';
import { indexedDocuments } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { DocumentIndexer, type IndexedDocumentData } from './document-indexer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Index a single email attachment
 */
export async function indexEmailAttachment(attachmentId: number): Promise<boolean> {
  try {
    console.log(`[Attachment Indexer] Starting indexing for attachment ${attachmentId}`);

    // Fetch attachment from database
    const [attachment] = await db
      .select()
      .from(emailAttachments)
      .where(eq(emailAttachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      console.error(`[Attachment Indexer] Attachment ${attachmentId} not found`);
      return false;
    }

    // Skip if already indexed
    if (attachment.indexed && attachment.indexedDocumentId) {
      console.log(`[Attachment Indexer] Attachment ${attachmentId} already indexed`);
      return true;
    }

    // Skip if not downloaded
    if (!attachment.downloaded || !attachment.storagePath) {
      console.log(`[Attachment Indexer] Attachment ${attachmentId} not downloaded yet`);
      return false;
    }

    // Check if file exists
    try {
      await fs.access(attachment.storagePath);
    } catch {
      console.error(`[Attachment Indexer] File not found: ${attachment.storagePath}`);
      return false;
    }

    // Only index certain file types
    const indexableTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!indexableTypes.includes(attachment.mimeType || '')) {
      console.log(`[Attachment Indexer] Skipping non-indexable file type: ${attachment.mimeType}`);
      return false;
    }

    // Create document indexer
    const indexer = new DocumentIndexer({
      extractAnnotations: true,
      generateThumbnails: false,
    });

    // Index the file
    console.log(`[Attachment Indexer] Indexing file: ${attachment.fileName}`);
    const indexedData = await indexer.indexFile(attachment.storagePath);

    if (!indexedData) {
      console.error(`[Attachment Indexer] Failed to index file: ${attachment.fileName}`);
      return false;
    }

    // Get the email and project linkage
    const [email] = await db
      .select({
        id: emailAttachments.syncedEmailId,
        projectId: emailAttachments.syncedEmailId,
      })
      .from(emailAttachments)
      .where(eq(emailAttachments.id, attachmentId))
      .limit(1);

    // Create indexed document record
    const [indexedDoc] = await db
      .insert(indexedDocuments)
      .values({
        fileName: attachment.fileName,
        filePath: attachment.storagePath,
        fileSize: attachment.fileSize || 0,
        fileType: attachment.fileType || getFileType(attachment.fileName),
        mimeType: attachment.mimeType,
        uploadedBy: null, // From email, no specific uploader
        projectId: null, // Will be set if email is linked to project
        extractedText: indexedData.extractedText.slice(0, 100000), // Limit text length
        textLength: indexedData.extractedTextLength,
        pageCount: indexedData.pageCount,
        metadata: {
          ...indexedData.documentMetadata,
          source: 'email_attachment',
          emailAttachmentId: attachmentId,
          extractedEntities: indexedData.extractedEntities,
        },
        keywords: indexedData.keywords,
        suggestedDocumentType: indexedData.suggestedDocumentType,
        processingTimeMs: indexedData.processingTimeMs,
        processedAt: indexedData.processedAt,
        fileHash: indexedData.fileHash,
      })
      .returning();

    // Update attachment with indexed document reference
    await db
      .update(emailAttachments)
      .set({
        indexed: true,
        indexedDocumentId: indexedDoc.id,
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(emailAttachments.id, attachmentId));

    console.log(`[Attachment Indexer] Successfully indexed attachment ${attachmentId} as document ${indexedDoc.id}`);

    return true;
  } catch (error) {
    console.error(`[Attachment Indexer] Error indexing attachment ${attachmentId}:`, error);
    return false;
  }
}

/**
 * Index all unindexed email attachments
 */
export async function indexAllUnindexedAttachments(limit: number = 50): Promise<{ indexed: number; failed: number }> {
  try {
    console.log(`[Attachment Indexer] Finding unindexed attachments (limit: ${limit})`);

    // Find attachments that are downloaded but not indexed
    const unindexedAttachments = await db
      .select({ id: emailAttachments.id })
      .from(emailAttachments)
      .where(
        and(
          eq(emailAttachments.downloaded, true),
          eq(emailAttachments.indexed, false),
          isNull(emailAttachments.deletedAt)
        )
      )
      .limit(limit);

    console.log(`[Attachment Indexer] Found ${unindexedAttachments.length} unindexed attachments`);

    let indexed = 0;
    let failed = 0;

    for (const attachment of unindexedAttachments) {
      const success = await indexEmailAttachment(attachment.id);
      if (success) {
        indexed++;
      } else {
        failed++;
      }

      // Small delay to avoid overloading
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`[Attachment Indexer] Completed: ${indexed} indexed, ${failed} failed`);

    return { indexed, failed };
  } catch (error) {
    console.error('[Attachment Indexer] Error in batch indexing:', error);
    return { indexed: 0, failed: 0 };
  }
}

/**
 * Re-index an attachment (useful if document indexer logic changed)
 */
export async function reindexEmailAttachment(attachmentId: number): Promise<boolean> {
  try {
    // Mark as not indexed
    await db
      .update(emailAttachments)
      .set({
        indexed: false,
        indexedDocumentId: null,
      })
      .where(eq(emailAttachments.id, attachmentId));

    // Index it
    return await indexEmailAttachment(attachmentId);
  } catch (error) {
    console.error(`[Attachment Indexer] Error re-indexing attachment ${attachmentId}:`, error);
    return false;
  }
}

/**
 * Get file type from filename
 */
function getFileType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();

  const typeMap: Record<string, string> = {
    '.pdf': 'pdf',
    '.doc': 'word',
    '.docx': 'word',
    '.xls': 'excel',
    '.xlsx': 'excel',
    '.txt': 'text',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.dwg': 'cad',
    '.dxf': 'cad',
  };

  return typeMap[ext] || 'other';
}

/**
 * Search indexed email attachments
 */
export async function searchEmailAttachments(query: string, options: {
  projectId?: number;
  fileType?: string;
  limit?: number;
} = {}): Promise<any[]> {
  const { projectId, fileType, limit = 50 } = options;

  try {
    // Build where conditions
    const conditions = [isNull(indexedDocuments.deletedAt)];

    if (projectId) {
      conditions.push(eq(indexedDocuments.projectId, projectId));
    }

    if (fileType) {
      conditions.push(eq(indexedDocuments.fileType, fileType));
    }

    // Search in extracted text and filename
    const results = await db
      .select()
      .from(indexedDocuments)
      .where(and(...conditions))
      .limit(limit);

    // Filter by search query
    const filtered = results.filter((doc) => {
      const searchableText = `${doc.fileName} ${doc.extractedText || ''} ${doc.keywords?.join(' ') || ''}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });

    return filtered;
  } catch (error) {
    console.error('[Attachment Indexer] Search error:', error);
    return [];
  }
}
