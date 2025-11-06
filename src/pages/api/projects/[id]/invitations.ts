/**
 * Project Invitations API
 * Handles creating and managing project invitations
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { projectInvitations } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Generate a secure invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Calculate expiration date (7 days from now)
function getExpirationDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

// POST - Create new invitation
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const projectId = parseInt(params.id!);
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.companyName) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.teamRole) {
      return new Response(
        JSON.stringify({ error: 'Team role is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation already exists for this email and project
    const existingInvitations = await db
      .select()
      .from(projectInvitations)
      .where(
        and(
          eq(projectInvitations.projectId, projectId),
          eq(projectInvitations.email, body.email),
          eq(projectInvitations.status, 'pending')
        )
      );

    if (existingInvitations.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'An invitation has already been sent to this email address for this project'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate invitation token
    const token = generateInvitationToken();

    // Get division name from division code if provided
    let divisionName = null;
    if (body.csiDivision) {
      const { getDivisionByCode } = await import('../../../../lib/data/csi-divisions');
      const division = getDivisionByCode(body.csiDivision);
      divisionName = division?.name || null;
    }

    // Create invitation
    const invitation = await db
      .insert(projectInvitations)
      .values({
        projectId,
        invitationToken: token,
        email: body.email,
        teamRole: body.teamRole,
        companyName: body.companyName,
        csiDivision: body.csiDivision || null,
        divisionName: divisionName,
        scopeOfWork: body.scopeOfWork || null,
        message: body.message || null,
        invitedBy: 1, // TODO: Get from session/auth
        expiresAt: getExpirationDate(),
        status: 'pending'
      })
      .returning();

    // TODO: Send email with invitation link
    // For now, we'll just log the invitation URL
    const invitationUrl = `${new URL(request.url).origin}/invitations/${token}`;
    console.log('Invitation URL:', invitationUrl);
    console.log('Send email to:', body.email);

    return new Response(
      JSON.stringify({
        success: true,
        invitation: invitation[0],
        invitationUrl
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create invitation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// GET - List all invitations for a project
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const projectId = parseInt(params.id!);
    const status = url.searchParams.get('status');

    let query = db
      .select()
      .from(projectInvitations)
      .where(eq(projectInvitations.projectId, projectId));

    if (status) {
      query = query.where(eq(projectInvitations.status, status as any)) as any;
    }

    const invitations = await query;

    return new Response(
      JSON.stringify({ invitations }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch invitations'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
