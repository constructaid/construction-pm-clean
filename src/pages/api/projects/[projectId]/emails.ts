/**
 * Project Emails API
 * Manage emails linked to tasks in a project
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Mock email data (replace with database queries in production)
const mockEmails = [
  {
    id: 1,
    taskId: 1,
    projectId: 1,
    emailId: 'msg_abc123',
    threadId: 'thread_xyz789',
    subject: 'RE: Electrical submittal package #045',
    fromAddress: 'jane.smith@designteam.com',
    fromName: 'Jane Smith',
    toAddresses: 'project@constructaid.com',
    bodyText: 'We need the Type 3R panels instead of Type 1 for the basement electrical room. This blocks the rough-in scheduled for next Tuesday. Please review the updated submittal by Friday.',
    snippet: 'We need the Type 3R panels instead of Type 1...',
    sentAt: '2025-10-22T10:30:00Z',
    receivedAt: '2025-10-22T10:30:15Z',
    hasAttachments: true,
    attachmentCount: 2,
    parsedAt: '2025-10-22T10:30:20Z',
    parsedBy: 'ai',
    confidence: 85,
    linkType: 'created_from',
    aiExtractedData: {
      category: 'Submittal Review',
      priority: 'high',
      blockers: 'Type mismatch blocks rough-in',
      dueDate: '2025-10-29',
    },
  },
  {
    id: 2,
    taskId: 2,
    projectId: 1,
    emailId: 'msg_def456',
    threadId: 'thread_abc123',
    subject: 'RFI #012 - Foundation waterproofing clarification',
    fromAddress: 'mike.jones@gc.com',
    fromName: 'Mike Jones',
    toAddresses: 'architect@designfirm.com',
    bodyText: 'Can you clarify the waterproofing detail at foundation wall per sheet S-102? The specification calls for 60mil membrane but detail shows 40mil.',
    snippet: 'Can you clarify the waterproofing detail...',
    sentAt: '2025-10-21T14:20:00Z',
    receivedAt: '2025-10-21T14:20:10Z',
    hasAttachments: false,
    attachmentCount: 0,
    parsedAt: '2025-10-21T14:20:15Z',
    parsedBy: 'ai',
    confidence: 92,
    linkType: 'created_from',
    aiExtractedData: {
      category: 'RFI Follow-up',
      priority: 'high',
      relatedDocumentType: 'RFI',
      relatedDocumentNumber: '012',
    },
  },
];

/**
 * GET /api/projects/:projectId/emails
 * List all emails for a project or specific task
 */
export const GET: APIRoute = async ({ params, request }) => {
  const { projectId } = params;
  const url = new URL(request.url);
  const taskId = url.searchParams.get('taskId');

  try {
    let emails = mockEmails.filter(e => e.projectId === parseInt(projectId!));

    // Filter by task if specified
    if (taskId) {
      emails = emails.filter(e => e.taskId === parseInt(taskId));
    }

    // Sort by received date (newest first)
    emails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    return new Response(JSON.stringify({
      success: true,
      emails,
      count: emails.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch emails',
    }), { status: 500 });
  }
};

/**
 * POST /api/projects/:projectId/emails
 * Link an email to a task
 */
export const POST: APIRoute = async ({ params, request }) => {
  const { projectId } = params;

  try {
    const data = await request.json();
    const { emailId, taskId, linkType } = data;

    // In production, save to database
    const linkedEmail = {
      id: mockEmails.length + 1,
      emailId,
      taskId: parseInt(taskId),
      projectId: parseInt(projectId!),
      linkType: linkType || 'related',
      linkedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Email linked to task',
      linkedEmail,
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to link email',
    }), { status: 500 });
  }
};

/**
 * DELETE /api/projects/:projectId/emails/:emailId
 * Unlink an email from a task
 */
export const DELETE: APIRoute = async ({ params }) => {
  const { projectId, emailId } = params;

  try {
    // In production, remove from database

    return new Response(JSON.stringify({
      success: true,
      message: 'Email unlinked from task',
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to unlink email',
    }), { status: 500 });
  }
};
