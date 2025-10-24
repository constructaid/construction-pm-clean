/**
 * AI-Powered Email Parser Service
 * Extracts task information from construction project emails
 */
import { EMAIL_PARSING_PROMPT, COMMON_EMAIL_PATTERNS, type EmailParsingResult } from '../db/email-schema';

interface EmailContent {
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

interface ParsedEmail extends EmailParsingResult {
  matchedPatterns: string[];
  suggestedProject?: number;
}

/**
 * Parse email using AI and pattern matching
 */
export async function parseEmailForTask(email: EmailContent): Promise<ParsedEmail> {
  // Step 1: Apply pattern matching rules
  const patterns = applyPatternMatching(email);

  // Step 2: Use AI to extract detailed information
  const aiResult = await parseWithAI(email);

  // Step 3: Merge pattern matching with AI results
  const merged = mergeResults(patterns, aiResult);

  return merged;
}

/**
 * Apply regex pattern matching to quickly categorize emails
 */
function applyPatternMatching(email: EmailContent): {
  category?: string;
  priority?: string;
  matchedPatterns: string[];
  relatedDocumentType?: string;
  relatedDocumentNumber?: string;
} {
  const result: any = {
    matchedPatterns: [],
  };

  // Check each pattern
  for (const [type, config] of Object.entries(COMMON_EMAIL_PATTERNS)) {
    for (const pattern of config.subjectPatterns) {
      const match = email.subject.match(pattern);
      if (match) {
        result.matchedPatterns.push(type);

        // Set category if defined
        if ('category' in config && !result.category) {
          result.category = config.category;
        }

        // Set priority (higher priority wins)
        if ('priority' in config) {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const currentPriority = result.priority || 'low';
          if (priorityOrder[config.priority] > priorityOrder[currentPriority]) {
            result.priority = config.priority;
          }
        }

        // Extract document numbers
        if (match[1]) {
          result.relatedDocumentNumber = match[1];
          result.relatedDocumentType = type.replace('_', ' ');
        }
      }
    }
  }

  return result;
}

/**
 * Use AI to parse email content
 * In production, this would call OpenAI/Anthropic API
 * For now, we'll simulate with intelligent parsing
 */
async function parseWithAI(email: EmailContent): Promise<EmailParsingResult> {
  // In production, you would call:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [{
  //     role: "system",
  //     content: EMAIL_PARSING_PROMPT
  //       .replace('{from}', email.from)
  //       .replace('{subject}', email.subject)
  //       .replace('{body}', email.body)
  //   }],
  //   response_format: { type: "json_object" }
  // });

  // For now, simulate intelligent parsing
  return simulateAIParsing(email);
}

/**
 * Simulate AI parsing (replace with actual AI API call in production)
 */
function simulateAIParsing(email: EmailContent): EmailParsingResult {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();

  // Determine if requires action
  const actionKeywords = ['need', 'require', 'must', 'urgent', 'asap', 'please', 'request', 'review', 'approve', 'respond'];
  const requiresAction = actionKeywords.some(keyword => subject.includes(keyword) || body.includes(keyword));

  // Extract due date
  let dueDate: string | null = null;
  const datePatterns = [
    /by ([a-z]+ \d{1,2})/i, // "by Friday", "by March 15"
    /due ([a-z]+ \d{1,2})/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/i, // 3/15/2025
    /(next [a-z]+)/i, // "next Tuesday"
    /(tomorrow|today)/i,
  ];

  for (const pattern of datePatterns) {
    const match = body.match(pattern);
    if (match) {
      dueDate = parseDateString(match[1]);
      break;
    }
  }

  // Extract location
  let location: string | null = null;
  const locationPatterns = [
    /building ([a-z0-9]+)/i,
    /floor (\d+)/i,
    /room (\d+)/i,
    /(basement|ground floor|roof)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = body.match(pattern);
    if (match) {
      location = match[0];
      break;
    }
  }

  // Extract assignee from signature or mentions
  let assignedToName: string | null = null;
  const signatureMatch = body.match(/(?:regards|thanks|best),?\s*\n?\s*([a-z ]+)/i);
  if (signatureMatch) {
    assignedToName = signatureMatch[1].trim();
  }

  // Extract cost code
  let costCode: string | null = null;
  const costCodeMatch = body.match(/div(?:ision)?\s*(\d{1,2})/i);
  if (costCodeMatch) {
    costCode = `DIV ${costCodeMatch[1]}`;
  }

  // Detect blockers
  let blockers: string | null = null;
  if (body.includes('block') || body.includes('hold') || body.includes('waiting')) {
    const blockerMatch = body.match(/(?:block|waiting|hold)[^.]*\./i);
    if (blockerMatch) {
      blockers = blockerMatch[0];
    }
  }

  // Extract tags
  const tags: string[] = [];
  if (subject.includes('urgent') || body.includes('urgent')) tags.push('urgent');
  if (subject.includes('electrical') || body.includes('electrical')) tags.push('electrical');
  if (subject.includes('hvac') || body.includes('hvac')) tags.push('hvac');
  if (subject.includes('plumbing') || body.includes('plumbing')) tags.push('plumbing');

  // Generate title from subject
  const title = email.subject.replace(/^(re:|fwd:)\s*/gi, '').trim();

  // Calculate confidence
  let confidence = 50; // Base confidence
  if (requiresAction) confidence += 20;
  if (dueDate) confidence += 10;
  if (location) confidence += 5;
  if (assignedToName) confidence += 10;
  if (costCode) confidence += 5;

  return {
    requiresAction,
    confidence: Math.min(confidence, 95), // Cap at 95%
    task: {
      title,
      description: extractDescription(email.body),
      assignedToName: assignedToName || email.fromName || undefined,
      location: location || undefined,
      costCode: costCode || undefined,
      blockers: blockers || undefined,
      dueDate: dueDate || undefined,
      tags: tags.length > 0 ? tags : undefined,
    },
    reasoning: `Detected ${requiresAction ? 'actionable' : 'informational'} email. ` +
      `Extracted ${[dueDate && 'due date', location && 'location', assignedToName && 'assignee'].filter(Boolean).join(', ')}.`,
  };
}

/**
 * Extract clean description from email body
 */
function extractDescription(body: string): string {
  // Remove email signatures
  const signaturePatterns = [
    /\n\s*--+\s*\n/,
    /\n\s*best regards/i,
    /\n\s*thanks/i,
    /\n\s*sincerely/i,
  ];

  let cleaned = body;
  for (const pattern of signaturePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      cleaned = cleaned.substring(0, match.index);
      break;
    }
  }

  // Trim and limit length
  cleaned = cleaned.trim();
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...';
  }

  return cleaned;
}

/**
 * Parse natural language date strings
 */
function parseDateString(dateStr: string): string {
  const today = new Date();
  const lower = dateStr.toLowerCase();

  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }

  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  if (lower.startsWith('next ')) {
    const day = lower.replace('next ', '');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(day);
    if (targetDay !== -1) {
      const currentDay = today.getDay();
      const daysUntil = (targetDay + 7 - currentDay) % 7 || 7;
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysUntil);
      return nextDate.toISOString().split('T')[0];
    }
  }

  // Try to parse MM/DD/YYYY format
  const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Fallback: 7 days from now
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  return weekFromNow.toISOString().split('T')[0];
}

/**
 * Merge pattern matching results with AI results
 */
function mergeResults(
  patterns: any,
  aiResult: EmailParsingResult
): ParsedEmail {
  return {
    ...aiResult,
    matchedPatterns: patterns.matchedPatterns,
    task: {
      ...aiResult.task,
      category: patterns.category || aiResult.task.category,
      priority: patterns.priority || aiResult.task.priority || 'medium',
      relatedDocumentType: patterns.relatedDocumentType || aiResult.task.relatedDocumentType,
      relatedDocumentNumber: patterns.relatedDocumentNumber || aiResult.task.relatedDocumentNumber,
    },
  };
}

/**
 * Attempt to identify which project this email belongs to
 */
export function identifyProject(email: EmailContent): number | null {
  // Look for project numbers in subject or body
  const projectPatterns = [
    /project[#\s-]*(\d+)/i,
    /proj[#\s-]*(\d+)/i,
    /job[#\s-]*(\d+)/i,
    /ORG[#\s-]*(\d+)/i, // ConstructAid specific
  ];

  const text = `${email.subject} ${email.body}`;

  for (const pattern of projectPatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

/**
 * Main function to process an incoming email
 */
export async function processIncomingEmail(emailData: {
  emailId: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: Date;
  projectId?: number;
}) {
  // Parse email
  const parsed = await parseEmailForTask({
    from: emailData.from,
    fromName: emailData.fromName,
    subject: emailData.subject,
    body: emailData.body,
    receivedAt: emailData.receivedAt,
  });

  // Identify project if not provided
  const projectId = emailData.projectId || identifyProject({
    from: emailData.from,
    fromName: emailData.fromName,
    subject: emailData.subject,
    body: emailData.body,
    receivedAt: emailData.receivedAt,
  });

  return {
    emailId: emailData.emailId,
    projectId,
    parsed,
    shouldCreateTask: parsed.requiresAction && parsed.confidence >= 70,
  };
}
