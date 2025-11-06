/**
 * Field Inspections API
 * Handle field inspection creation and retrieval
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
    const inspections = [];

    return new Response(
      JSON.stringify({ success: true, inspections }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching inspections:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch inspections' }),
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

    if (!data.inspectionDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Inspection date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock save - will be replaced with actual database insert
    const inspection = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Field inspection saved:', inspection);

    return new Response(
      JSON.stringify({ success: true, inspection }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error saving inspection:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to save inspection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
