/**
 * Setup Default Project Team API
 * Creates default team structure for a project
 */

import type { APIRoute} from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { projectTeamMembers } from '../../../../../lib/db/project-team-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * POST - Setup default team members for Thomas Marsh project or any new project
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id!);
    const body = await request.json();
    const { projectName = '' } = body;

    // Default team structure with placeholders
    const defaultTeam = [
      {
        role: 'owner',
        roleTitle: 'Owner Representative',
        fullName: 'To Be Assigned',
        company: 'Dallas ISD',
        isPrimary: true,
        isActive: true,
      },
      {
        role: 'architect',
        roleTitle: 'Project Architect',
        fullName: 'To Be Assigned',
        company: '',
        isPrimary: true,
        isActive: true,
      },
      {
        role: 'engineer',
        roleTitle: 'Structural Engineer',
        fullName: 'To Be Assigned',
        company: '',
        isPrimary: true,
        isActive: true,
      },
      {
        role: 'gc',
        roleTitle: 'General Contractor',
        fullName: 'To Be Assigned',
        company: '',
        isPrimary: true,
        isActive: true,
      },
      {
        role: 'superintendent',
        roleTitle: 'Project Superintendent',
        fullName: 'To Be Assigned',
        company: '',
        isPrimary: true,
        isActive: true,
      },
      {
        role: 'pm',
        roleTitle: 'Project Manager',
        fullName: 'To Be Assigned',
        company: '',
        isPrimary: true,
        isActive: true,
      },
    ];

    const created = [];

    for (const member of defaultTeam) {
      const newMember = await db.insert(projectTeamMembers).values({
        projectId: projectId,
        ...member,
      }).returning();

      created.push(newMember[0]);
    }

    return new Response(JSON.stringify({
      success: true,
      created: created.length,
      members: created,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting up default team:', error);
    return new Response(JSON.stringify({
      error: 'Failed to setup default team',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
