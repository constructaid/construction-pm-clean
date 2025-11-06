/**
 * Single Invitation API
 * Fetch invitation details by token
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { projectInvitations, projects } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch invitation by token
export const GET: APIRoute = async ({ params }) => {
  try {
    const token = params.token!;

    // Fetch invitation
    const invitations = await db
      .select()
      .from(projectInvitations)
      .where(eq(projectInvitations.invitationToken, token));

    if (invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const invitation = invitations[0];

    // Fetch project details
    const projectResults = await db
      .select()
      .from(projects)
      .where(eq(projects.id, invitation.projectId));

    const project = projectResults[0] || null;

    return new Response(
      JSON.stringify({
        invitation,
        project,
        projectName: project?.name
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch invitation'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
