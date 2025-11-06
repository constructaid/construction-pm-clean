/**
 * Material Deliveries API
 * Handle material delivery coordination
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
    const deliveries = [];

    return new Response(
      JSON.stringify({ success: true, deliveries }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to fetch deliveries' }),
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

    if (!data.materialDescription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Material description is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mock save - will be replaced with actual database insert
    const delivery = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Material delivery saved:', delivery);

    return new Response(
      JSON.stringify({ success: true, delivery }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error saving delivery:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to save delivery' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
