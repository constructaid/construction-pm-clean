/**
 * Email Inbound Webhook Handler
 * Receives emails forwarded to project email addresses
 * Supports multiple formats: SendGrid, Mailgun, raw forwarding
 */
import type { APIRoute } from 'astro';
import { processIncomingEmail } from '../../../lib/services/email-parser';
import {
  processEmailAttachments,
  saveAttachmentToFolder,
  createFileRecord
} from '../../../lib/services/email-attachment-processor';

export const prerender = false;

/**
 * POST /api/email/inbound
 * Webhook endpoint for incoming emails
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';

    let emailData;

    // Handle different email service formats
    if (contentType.includes('application/json')) {
      // Standard JSON format (custom forwarding, Mailgun JSON)
      emailData = await parseJsonEmail(await request.json());
    } else if (contentType.includes('multipart/form-data')) {
      // SendGrid format
      emailData = await parseFormDataEmail(await request.formData());
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unsupported content type'
      }), { status: 400 });
    }

    // Process the email with AI
    const result = await processIncomingEmail(emailData);

    // Process attachments if present
    let processedAttachments: any[] = [];
    let savedFiles: any[] = [];

    if (emailData.attachments && emailData.attachments.length > 0) {
      processedAttachments = await processEmailAttachments(
        emailData.attachments,
        {
          subject: emailData.subject,
          body: emailData.body,
          category: result.parsed.task.category,
          relatedDocumentType: result.parsed.task.relatedDocumentType,
          relatedDocumentNumber: result.parsed.task.relatedDocumentNumber,
        }
      );

      // Save attachments to appropriate folders
      if (result.projectId) {
        for (let i = 0; i < processedAttachments.length; i++) {
          const processed = processedAttachments[i];
          const attachment = emailData.attachments[i];

          // Save to storage
          const saved = await saveAttachmentToFolder(
            result.projectId,
            processed,
            attachment.data
          );

          // Create file record
          if (saved.success) {
            const fileRecord = await createFileRecord(
              result.projectId,
              getFolderIdFromNumber(processed.folder),
              processed,
              saved.path
            );
            savedFiles.push(fileRecord);
          }
        }
      }
    }

    // Store email record (in production, save to database)
    const emailRecord = {
      id: generateEmailRecordId(),
      emailId: result.emailId,
      projectId: result.projectId,
      parsed: result.parsed,
      shouldCreateTask: result.shouldCreateTask,
      receivedAt: new Date().toISOString(),
      attachmentCount: emailData.attachments?.length || 0,
      processedAttachments,
      savedFiles,
    };

    // Auto-create task if confidence is high enough
    if (result.shouldCreateTask && result.projectId) {
      const taskId = await createTaskFromEmail(result.projectId, emailData, result.parsed, savedFiles);

      return new Response(JSON.stringify({
        success: true,
        message: 'Email processed and task created',
        emailRecord,
        taskId,
        confidence: result.parsed.confidence,
        attachmentsProcessed: processedAttachments.length,
        filesSaved: savedFiles.length,
      }), { status: 200 });
    }

    // Otherwise, store for manual review
    return new Response(JSON.stringify({
      success: true,
      message: 'Email processed, awaiting manual review',
      emailRecord,
      reason: result.parsed.confidence < 70
        ? 'Low confidence - requires manual review'
        : 'No action required - informational email',
    }), { status: 200 });

  } catch (error) {
    console.error('Email processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process email',
      details: error.message,
    }), { status: 500 });
  }
};

/**
 * Parse JSON email format
 */
async function parseJsonEmail(data: any) {
  return {
    emailId: data.messageId || data.email_id || generateEmailId(),
    from: data.from || data.sender,
    fromName: data.fromName || data.sender_name,
    to: data.to || data.recipient,
    subject: data.subject,
    body: data.text || data.body || data.plainText,
    bodyHtml: data.html || data.htmlBody,
    receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
    projectId: data.projectId ? parseInt(data.projectId) : undefined,
    attachments: data.attachments || [],
  };
}

/**
 * Parse SendGrid/form-data email format
 */
async function parseFormDataEmail(formData: FormData) {
  return {
    emailId: formData.get('headers')?.toString() || generateEmailId(),
    from: formData.get('from')?.toString() || '',
    fromName: formData.get('from_name')?.toString(),
    to: formData.get('to')?.toString() || '',
    subject: formData.get('subject')?.toString() || '',
    body: formData.get('text')?.toString() || '',
    bodyHtml: formData.get('html')?.toString(),
    receivedAt: new Date(),
  };
}

/**
 * Create task from parsed email data
 */
async function createTaskFromEmail(projectId: number, emailData: any, parsed: any, savedFiles: any[] = []) {
  // Build description with attachment info
  let description = parsed.task.description || `From email: ${emailData.subject}\n\nSent by: ${emailData.fromName || emailData.from}\n\n${emailData.body}`;

  if (savedFiles.length > 0) {
    description += `\n\n📎 Attachments (${savedFiles.length}):\n`;
    savedFiles.forEach(file => {
      description += `- ${file.originalName} (saved to ${file.path})\n`;
    });
  }

  // Call the tasks API to create the task
  const taskData = {
    projectId,
    title: parsed.task.title,
    description,
    category: parsed.task.category,
    priority: parsed.task.priority || 'medium',
    status: 'pending',
    assignedToName: parsed.task.assignedToName,
    assignedToCompany: parsed.task.assignedToCompany,
    dueDate: parsed.task.dueDate,
    location: parsed.task.location,
    costCode: parsed.task.costCode,
    blockers: parsed.task.blockers,
    relatedDocumentType: parsed.task.relatedDocumentType,
    relatedDocumentNumber: parsed.task.relatedDocumentNumber,
    tags: parsed.task.tags?.join(','),
    notes: `Auto-generated from email. Confidence: ${parsed.confidence}%`,
    createdByName: 'Email Integration',
    attachments: savedFiles.map(f => f.path).join(','),
  };

  // In production, save to database
  // For now, return mock ID
  const taskId = Math.floor(Math.random() * 10000);

  console.log('Created task from email:', taskData);

  return taskId;
}

/**
 * Map folder number to folder ID
 */
function getFolderIdFromNumber(folderNumber: string): number {
  // In production, look up folder ID from database
  // For now, use folder number as ID
  return parseInt(folderNumber) || 1;
}

/**
 * Generate unique email ID
 */
function generateEmailId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate email record ID
 */
function generateEmailRecordId(): number {
  return Math.floor(Math.random() * 1000000);
}
