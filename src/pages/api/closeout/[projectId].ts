import type { APIRoute } from 'astro';
import { getAllCloseoutRequirements, getCloseoutRequirementsByDivision } from '../../../lib/data/closeout-requirements';

export const GET: APIRoute = async ({ params, request }) => {
  const { projectId } = params;

  try {
    const url = new URL(request.url);
    const division = url.searchParams.get('division');

    // Get requirements (filtered by division if specified)
    const requirements = division
      ? getCloseoutRequirementsByDivision(division)
      : getAllCloseoutRequirements();

    // Calculate stats
    const totalItems = requirements.length;
    const criticalItems = requirements.filter(r => r.priority === 'critical').length;
    const divisionGroups = requirements.reduce((acc, req) => {
      if (!acc[req.division]) {
        acc[req.division] = {
          division: req.division,
          total: 0,
          pending: 0,
          completed: 0,
          critical: 0,
        };
      }
      acc[req.division].total++;
      acc[req.division].pending++;
      if (req.priority === 'critical') {
        acc[req.division].critical++;
      }
      return acc;
    }, {} as Record<string, any>);

    return new Response(
      JSON.stringify({
        success: true,
        projectId: parseInt(projectId as string),
        requirements,
        stats: {
          total: totalItems,
          pending: totalItems,
          in_progress: 0,
          completed: 0,
          critical: criticalItems,
          percentComplete: 0,
        },
        divisionGroups: Object.values(divisionGroups),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching closeout requirements:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch closeout requirements',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const { projectId } = params;

  try {
    const data = await request.json();

    // TODO: Save closeout item to database using Drizzle ORM
    // For now, return success with mock data

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Closeout item created successfully',
        item: {
          id: Date.now(),
          projectId: parseInt(projectId as string),
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating closeout item:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create closeout item',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
