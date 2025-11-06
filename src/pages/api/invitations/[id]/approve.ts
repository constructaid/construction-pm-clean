/**
 * Approve/Reject Access Request API
 * Project Managers can approve or reject access requests
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { projectInvitations, projectTeamMembers } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// POST - Approve or reject access request
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const invitationId = parseInt(params.id!);
    const body = await request.json();
    const action = body.action; // 'approve' or 'reject'

    // Fetch invitation
    const invitations = await db
      .select()
      .from(projectInvitations)
      .where(eq(projectInvitations.id, invitationId));

    if (invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const invitation = invitations[0];

    // Check if invitation is in correct state
    if (invitation.status !== 'accepted') {
      return new Response(
        JSON.stringify({ error: 'Invitation must be accepted before approval' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!invitation.accessRequested) {
      return new Response(
        JSON.stringify({ error: 'No access request has been made yet' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      // Approve access
      await db
        .update(projectInvitations)
        .set({
          accessApproved: true,
          approvedBy: 1, // TODO: Get from session/auth
          approvedAt: new Date()
        })
        .where(eq(projectInvitations.id, invitationId));

      // Create team member record
      // Note: acceptedBy (userId) should be set when user actually signs up
      // For now, we'll create a placeholder that will be updated when user logs in
      if (invitation.acceptedBy) {
        await db.insert(projectTeamMembers).values({
          projectId: invitation.projectId,
          userId: invitation.acceptedBy,
          teamRole: invitation.teamRole,
          csiDivision: invitation.csiDivision || null,
          divisionName: invitation.divisionName || null,
          scopeOfWork: invitation.scopeOfWork || null,
          canInviteOthers: true,
          accessLevel: 'standard',
          permissions: {},
          isActive: true,
          contactEmail: invitation.email,
          companyName: invitation.companyName || null,
          invitationId: invitation.id,
          invitedBy: invitation.invitedBy
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Access request approved'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'reject') {
      // Reject access
      await db
        .update(projectInvitations)
        .set({
          status: 'rejected',
          approvedBy: 1, // TODO: Get from session/auth
          approvedAt: new Date(),
          rejectionReason: body.rejectionReason || 'Access request rejected'
        })
        .where(eq(projectInvitations.id, invitationId));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Access request rejected'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "approve" or "reject"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing access request:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process access request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
