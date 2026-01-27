/**
 * Default Email Templates
 *
 * Pre-made templates for common construction scenarios
 */

import { db } from '../db';
import { emailTemplates } from '../db/email-templates-schema';

export const defaultTemplates = [
  {
    name: 'RFI Response',
    description: 'Standard response to Request for Information',
    category: 'rfi',
    subject: 'Re: RFI #{{rfiNumber}} - {{subject}}',
    body: `Dear {{recipientName}},

Thank you for your RFI #{{rfiNumber}} regarding {{subject}}.

{{response}}

Please let me know if you need any additional information.

Best regards,
{{senderName}}
{{companyName}}`,
    variables: ['rfiNumber', 'subject', 'recipientName', 'response', 'senderName', 'companyName'],
    isPublic: true,
    tags: ['rfi', 'response'],
  },
  {
    name: 'Submittal Approval',
    description: 'Approve a submittal package',
    category: 'submittal',
    subject: 'Submittal #{{submittalNumber}} - Approved',
    body: `Dear {{recipientName}},

We have reviewed Submittal #{{submittalNumber}} for {{description}}.

Status: APPROVED

Comments:
{{comments}}

You may proceed with fabrication/installation as per the approved submittal.

Best regards,
{{senderName}}
{{companyName}}`,
    variables: ['submittalNumber', 'description', 'recipientName', 'comments', 'senderName', 'companyName'],
    isPublic: true,
    tags: ['submittal', 'approval'],
  },
  {
    name: 'Change Order Request',
    description: 'Request a change order',
    category: 'change_order',
    subject: 'Change Order Request - {{projectName}}',
    body: `Dear {{recipientName}},

We are requesting a change order for the following scope change:

Project: {{projectName}}
Description: {{description}}

Estimated Cost Impact: ${{amount}}
Estimated Schedule Impact: {{scheduleImpact}} days

Justification:
{{justification}}

Please review and let us know if you need any additional information.

Best regards,
{{senderName}}
{{companyName}}`,
    variables: ['projectName', 'recipientName', 'description', 'amount', 'scheduleImpact', 'justification', 'senderName', 'companyName'],
    isPublic: true,
    tags: ['change_order', 'request'],
  },
  {
    name: 'Meeting Minutes',
    description: 'Send meeting minutes to participants',
    category: 'meeting',
    subject: '{{projectName}} - Meeting Minutes - {{date}}',
    body: `Hello Team,

Please find below the meeting minutes from {{date}}.

Project: {{projectName}}
Date: {{date}}
Attendees: {{attendees}}

DISCUSSION POINTS:
{{discussionPoints}}

ACTION ITEMS:
{{actionItems}}

NEXT MEETING:
{{nextMeeting}}

Please let me know if you have any corrections or additions.

Best regards,
{{senderName}}`,
    variables: ['projectName', 'date', 'attendees', 'discussionPoints', 'actionItems', 'nextMeeting', 'senderName'],
    isPublic: true,
    tags: ['meeting', 'minutes'],
  },
  {
    name: 'Schedule Update',
    description: 'Notify team of schedule changes',
    category: 'schedule',
    subject: '{{projectName}} - Schedule Update',
    body: `Dear Team,

This is to notify you of updates to the {{projectName}} schedule.

CHANGES:
{{changes}}

IMPACTS:
{{impacts}}

NEW MILESTONES:
{{milestones}}

Please review the updated schedule and confirm your availability.

Best regards,
{{senderName}}
{{companyName}}`,
    variables: ['projectName', 'changes', 'impacts', 'milestones', 'senderName', 'companyName'],
    isPublic: true,
    tags: ['schedule', 'update'],
  },
  {
    name: 'Daily Report',
    description: 'Daily construction progress report',
    category: 'daily_report',
    subject: '{{projectName}} - Daily Report - {{date}}',
    body: `Daily Construction Report

Project: {{projectName}}
Date: {{date}}
Weather: {{weather}}

WORK PERFORMED:
{{workPerformed}}

EQUIPMENT ON SITE:
{{equipment}}

MANPOWER:
{{manpower}}

SAFETY INCIDENTS:
{{safetyIncidents}}

ISSUES/CONCERNS:
{{issues}}

TOMORROW'S PLAN:
{{tomorrowPlan}}

Report by: {{senderName}}`,
    variables: ['projectName', 'date', 'weather', 'workPerformed', 'equipment', 'manpower', 'safetyIncidents', 'issues', 'tomorrowPlan', 'senderName'],
    isPublic: true,
    tags: ['daily_report', 'progress'],
  },
  {
    name: 'Safety Concern',
    description: 'Report a safety concern',
    category: 'safety',
    subject: 'SAFETY CONCERN - {{projectName}}',
    body: `ATTENTION: SAFETY CONCERN

Project: {{projectName}}
Date: {{date}}
Location: {{location}}

CONCERN:
{{concern}}

IMMEDIATE ACTION TAKEN:
{{actionTaken}}

RECOMMENDATION:
{{recommendation}}

Please address this concern immediately.

Reported by: {{senderName}}
{{companyName}}`,
    variables: ['projectName', 'date', 'location', 'concern', 'actionTaken', 'recommendation', 'senderName', 'companyName'],
    isPublic: true,
    tags: ['safety', 'urgent'],
  },
  {
    name: 'Invoice Submission',
    description: 'Submit an invoice for payment',
    category: 'invoice',
    subject: 'Invoice #{{invoiceNumber}} - {{projectName}}',
    body: `Dear {{recipientName}},

Please find attached Invoice #{{invoiceNumber}} for work performed on {{projectName}}.

Invoice Date: {{invoiceDate}}
Payment Terms: {{paymentTerms}}
Amount Due: ${{amount}}

Work Period: {{workPeriod}}
Description: {{description}}

Please remit payment to:
{{paymentDetails}}

Thank you for your prompt attention to this invoice.

Best regards,
{{senderName}}
{{companyName}}`,
    variables: ['invoiceNumber', 'projectName', 'recipientName', 'invoiceDate', 'paymentTerms', 'amount', 'workPeriod', 'description', 'paymentDetails', 'senderName', 'companyName'],
    isPublic: true,
    tags: ['invoice', 'payment'],
  },
];

/**
 * Seed default templates for a user
 */
export async function seedDefaultTemplates(userId: number): Promise<number> {
  try {
    console.log(`[Email Templates] Seeding default templates for user ${userId}`);

    const templates = defaultTemplates.map((template) => ({
      ...template,
      userId,
      variables: template.variables as any,
      tags: template.tags as any,
    }));

    await db.insert(emailTemplates).values(templates);

    console.log(`[Email Templates] Seeded ${templates.length} default templates`);

    return templates.length;
  } catch (error) {
    console.error('[Email Templates] Error seeding templates:', error);
    return 0;
  }
}

/**
 * Replace template variables with actual values
 */
export function fillTemplate(template: string, variables: Record<string, string>): string {
  let filled = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    filled = filled.replace(regex, value);
  }

  return filled;
}
