/**
 * Accept Invitation API
 * Marks invitation as accepted and prepares for user signup/access request
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { projectInvitations } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// POST - Accept invitation
export const POST: APIRoute = async ({ params }) => {
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

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Invitation has already been processed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const expiresAt = new Date(invitation.expiresAt!);
    if (expiresAt < new Date()) {
      // Update status to expired
      await db
        .update(projectInvitations)
        .set({ status: 'expired' })
        .where(eq(projectInvitations.id, invitation.id));

      return new Response(
        JSON.stringify({ error: 'Invitation has expired' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark as accepted
    const updated = await db
      .update(projectInvitations)
      .set({
        status: 'accepted',
        respondedAt: new Date()
      })
      .where(eq(projectInvitations.id, invitation.id))
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        invitation: updated[0]
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to accept invitation'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
