/**
 * DISD Compliance Checklists API
 * Handle compliance checklist creation and retrieval
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock data - will be replaced with actual database query
    const checklists = [];

    return new Response(
      JSON.stringify({ success: true, checklists }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching compliance checklists:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch checklists' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.checklistDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Checklist date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.completedBy) {
      return new Response(
        JSON.stringify({ success: false, error: 'Completed by is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock save - will be replaced with actual database insert
    const checklist = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Compliance checklist saved:', checklist);

    return new Response(
      JSON.stringify({ success: true, checklist }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error saving compliance checklist:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to save checklist' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
