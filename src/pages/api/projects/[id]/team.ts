/**
 * Project Team API
 * Manage project team members and their contact information
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { projectTeamMembers } from '../../../../lib/db/project-team-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * GET - Get all team members for a project
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const projectId = parseInt(params.id!);

    const teamMembers = await db
      .select()
      .from(projectTeamMembers)
      .where(eq(projectTeamMembers.projectId, projectId))
      .orderBy(projectTeamMembers.role);

    return new Response(JSON.stringify(teamMembers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch team members' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST - Add a team member to the project
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id!);
    const body = await request.json();

    const newMember = await db.insert(projectTeamMembers).values({
      projectId: projectId,
      role: body.role,
      roleTitle: body.roleTitle,
      firstName: body.firstName,
      lastName: body.lastName,
      fullName: body.fullName || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
      company: body.company,
      title: body.title,
      email: body.email,
      phoneMain: body.phoneMain,
      phoneMobile: body.phoneMobile,
      phoneOffice: body.phoneOffice,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      userId: body.userId,
      contactId: body.contactId,
      isPrimary: body.isPrimary || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      notes: body.notes,
      responsibilities: body.responsibilities,
      createdBy: body.createdBy,
    }).returning();

    return new Response(JSON.stringify(newMember[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return new Response(JSON.stringify({ error: 'Failed to add team member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT - Update a team member
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id!);
    const body = await request.json();
    const { memberId, ...updates } = body;

    if (!memberId) {
      return new Response(JSON.stringify({ error: 'memberId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await db
      .update(projectTeamMembers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(projectTeamMembers.id, memberId),
        eq(projectTeamMembers.projectId, projectId)
      ))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Team member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return new Response(JSON.stringify({ error: 'Failed to update team member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE - Remove a team member
 */
export const DELETE: APIRoute = async ({ params, url }) => {
  try {
    const projectId = parseInt(params.id!);
    const memberId = url.searchParams.get('memberId');

    if (!memberId) {
      return new Response(JSON.stringify({ error: 'memberId query parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deleted = await db
      .delete(projectTeamMembers)
      .where(and(
        eq(projectTeamMembers.id, parseInt(memberId)),
        eq(projectTeamMembers.projectId, projectId)
      ))
      .returning();

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Team member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Team member removed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete team member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
