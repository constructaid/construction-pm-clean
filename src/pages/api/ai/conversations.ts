/**
 * API: AI Conversations
 * GET /api/ai/conversations?projectId=1 - Get conversation history
 * POST /api/ai/conversations - Save conversation
 */

import type { APIRoute } from 'astro';

// Mock conversation storage (in-memory for now)
const conversationStore = new Map<number, any[]>();

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const projectId = parseInt(url.searchParams.get('projectId') || '0');

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const messages = conversationStore.get(projectId) || [];

  return new Response(JSON.stringify({
    success: true,
    messages,
    conversationId: projectId
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { projectId, messages } = body;

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store messages (in production, save to database)
    conversationStore.set(projectId, messages);

    return new Response(JSON.stringify({
      success: true,
      conversationId: projectId,
      messageCount: messages.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
