/**
 * AI Email Processing Service
 *
 * Uses AI to analyze construction-related emails and:
 * - Categorize emails (RFI, submittal, change order, invoice, etc.)
 * - Extract key information (project names, dates, amounts, etc.)
 * - Generate summaries
 * - Auto-link to projects, tasks, RFIs, etc.
 */

import OpenAI from 'openai';
import { db } from '../db';
import { syncedEmails, emailAttachments } from '../db/oauth-email-schema';
import { projects } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Email category types for construction
 */
export type EmailCategory =
  | 'rfi'
  | 'submittal'
  | 'change_order'
  | 'invoice'
  | 'schedule'
  | 'drawing'
  | 'specification'
  | 'meeting_notes'
  | 'daily_report'
  | 'safety'
  | 'quality'
  | 'general'
  | 'other';

/**
 * Extracted email data
 */
export interface EmailAnalysis {
  category: EmailCategory;
  confidence: number; // 0-100
  summary: string;
  extractedData: {
    projectName?: string;
    projectNumber?: string;
    rfiNumber?: string;
    submittalNumber?: string;
    changeOrderNumber?: string;
    dueDate?: string;
    amount?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    actionRequired?: boolean;
    keywords?: string[];
  };
  suggestedLinks?: {
    projectId?: number;
    taskId?: number;
    rfiId?: number;
    submittalId?: number;
  };
}

/**
 * Process a single email with AI
 */
export async function processEmailWithAI(emailId: number): Promise<EmailAnalysis | null> {
  try {
    // Fetch email from database
    const [email] = await db
      .select()
      .from(syncedEmails)
      .where(eq(syncedEmails.id, emailId))
      .limit(1);

    if (!email) {
      console.error(`[AI Processor] Email ${emailId} not found`);
      return null;
    }

    // Skip if already processed
    if (email.aiProcessed) {
      console.log(`[AI Processor] Email ${emailId} already processed`);
      return email.aiExtractedData as EmailAnalysis;
    }

    // Fetch all projects for context
    const allProjects = await db.select().from(projects).where(isNull(projects.deletedAt));

    // Prepare email content for AI
    const emailContent = `
Subject: ${email.subject || 'No subject'}
From: ${email.fromAddress} ${email.fromName ? `(${email.fromName})` : ''}
Date: ${email.receivedAt}
Has Attachments: ${email.hasAttachments ? 'Yes' : 'No'}

Body:
${email.bodyText || email.snippet || 'No content'}
    `.trim();

    // Prepare project context
    const projectContext = allProjects
      .map((p) => `- ${p.projectNumber}: ${p.projectName}`)
      .join('\n');

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a construction project management system. Analyze emails and extract key information.

Your response must be valid JSON with this exact structure:
{
  "category": "rfi|submittal|change_order|invoice|schedule|drawing|specification|meeting_notes|daily_report|safety|quality|general|other",
  "confidence": 0-100,
  "summary": "2-3 sentence summary",
  "extractedData": {
    "projectName": "project name if mentioned",
    "projectNumber": "project number if mentioned",
    "rfiNumber": "RFI number if mentioned",
    "submittalNumber": "submittal number if mentioned",
    "changeOrderNumber": "change order number if mentioned",
    "dueDate": "due date if mentioned (ISO format)",
    "amount": "dollar amount if mentioned",
    "priority": "low|medium|high|urgent",
    "actionRequired": true/false,
    "keywords": ["key", "words"]
  }
}

Available projects in the system:
${projectContext}
`,
        },
        {
          role: 'user',
          content: `Analyze this construction email:\n\n${emailContent}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const analysis: EmailAnalysis = JSON.parse(response);

    // Try to auto-link to project
    if (analysis.extractedData.projectNumber || analysis.extractedData.projectName) {
      const matchingProject = allProjects.find(
        (p) =>
          p.projectNumber === analysis.extractedData.projectNumber ||
          p.projectName.toLowerCase().includes(analysis.extractedData.projectName?.toLowerCase() || '')
      );

      if (matchingProject) {
        analysis.suggestedLinks = {
          ...analysis.suggestedLinks,
          projectId: matchingProject.id,
        };
      }
    }

    // Update email with AI analysis
    await db
      .update(syncedEmails)
      .set({
        aiProcessed: true,
        aiProcessedAt: new Date(),
        aiExtractedData: analysis as any,
        aiConfidence: analysis.confidence,
        aiSummary: analysis.summary,
        linkedProjectId: analysis.suggestedLinks?.projectId,
      })
      .where(eq(syncedEmails.id, emailId));

    console.log(`[AI Processor] Processed email ${emailId}: ${analysis.category} (${analysis.confidence}% confidence)`);

    return analysis;
  } catch (error) {
    console.error(`[AI Processor] Error processing email ${emailId}:`, error);

    // Mark as processed with error
    await db
      .update(syncedEmails)
      .set({
        aiProcessed: true,
        aiProcessedAt: new Date(),
        aiConfidence: 0,
        aiSummary: 'Error processing email',
      })
      .where(eq(syncedEmails.id, emailId));

    return null;
  }
}

/**
 * Process all unprocessed emails
 */
export async function processUnprocessedEmails(limit: number = 50): Promise<number> {
  try {
    // Find unprocessed emails
    const unprocessedEmails = await db
      .select({ id: syncedEmails.id })
      .from(syncedEmails)
      .where(eq(syncedEmails.aiProcessed, false))
      .limit(limit);

    console.log(`[AI Processor] Found ${unprocessedEmails.length} unprocessed emails`);

    let processedCount = 0;

    for (const email of unprocessedEmails) {
      const result = await processEmailWithAI(email.id);
      if (result) {
        processedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`[AI Processor] Successfully processed ${processedCount}/${unprocessedEmails.length} emails`);

    return processedCount;
  } catch (error) {
    console.error('[AI Processor] Error in batch processing:', error);
    return 0;
  }
}

/**
 * Check if AI processing is configured
 */
export function isAIProcessingConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Generate email summary without full processing
 * Useful for quick previews
 */
export async function generateQuickSummary(emailContent: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize this construction email in 1-2 sentences.',
        },
        {
          role: 'user',
          content: emailContent,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('[AI Processor] Error generating summary:', error);
    return 'Error generating summary';
  }
}
