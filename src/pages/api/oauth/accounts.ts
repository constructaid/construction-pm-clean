/**
 * Connected Email Accounts API
 *
 * Endpoints for managing connected email accounts
 * - GET: List all connected accounts for the user
 * - DELETE: Disconnect an email account
 * - PATCH: Update account settings
 */

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { connectedEmailAccounts } from '../../../lib/db/oauth-email-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { verifyAccessToken } from '../../../lib/auth/jwt';

/**
 * GET /api/oauth/accounts
 * List all connected email accounts for the authenticated user
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Get access token from cookie
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the access token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid access token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch connected accounts for the user
    const accounts = await db
      .select({
        id: connectedEmailAccounts.id,
        emailAddress: connectedEmailAccounts.emailAddress,
        displayName: connectedEmailAccounts.displayName,
        provider: connectedEmailAccounts.provider,
        isActive: connectedEmailAccounts.isActive,
        autoSync: connectedEmailAccounts.autoSync,
        syncFrequencyMinutes: connectedEmailAccounts.syncFrequencyMinutes,
        lastSyncAt: connectedEmailAccounts.lastSyncAt,
        lastSyncStatus: connectedEmailAccounts.lastSyncStatus,
        lastSyncError: connectedEmailAccounts.lastSyncError,
        totalEmailsSynced: connectedEmailAccounts.totalEmailsSynced,
        totalAttachmentsProcessed: connectedEmailAccounts.totalAttachmentsProcessed,
        hasReadPermission: connectedEmailAccounts.hasReadPermission,
        hasSendPermission: connectedEmailAccounts.hasSendPermission,
        hasCalendarPermission: connectedEmailAccounts.hasCalendarPermission,
        createdAt: connectedEmailAccounts.createdAt,
      })
      .from(connectedEmailAccounts)
      .where(
        and(
          eq(connectedEmailAccounts.userId, payload.id),
          isNull(connectedEmailAccounts.deletedAt)
        )
      );

    return new Response(
      JSON.stringify({
        success: true,
        accounts,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[OAuth Accounts] GET error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch accounts',
        message: 'An error occurred while fetching connected accounts',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE /api/oauth/accounts?id=123
 * Disconnect an email account (soft delete)
 */
export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Get access token from cookie
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the access token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid access token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get account ID from query params
    const url = new URL(request.url);
    const accountId = url.searchParams.get('id');

    if (!accountId) {
      return new Response(
        JSON.stringify({
          error: 'Missing parameter',
          message: 'Account ID is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify account belongs to the user
    const [account] = await db
      .select()
      .from(connectedEmailAccounts)
      .where(
        and(
          eq(connectedEmailAccounts.id, parseInt(accountId)),
          eq(connectedEmailAccounts.userId, payload.id)
        )
      )
      .limit(1);

    if (!account) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Account not found or does not belong to you',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft delete the account
    await db
      .update(connectedEmailAccounts)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(connectedEmailAccounts.id, parseInt(accountId)));

    console.log(`[OAuth Accounts] Account ${accountId} disconnected by user ${payload.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account disconnected successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[OAuth Accounts] DELETE error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to disconnect account',
        message: 'An error occurred while disconnecting the account',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * PATCH /api/oauth/accounts
 * Update account settings (auto-sync, sync frequency, etc.)
 */
export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    // Get access token from cookie
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'You must be logged in',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the access token
    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid access token',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, autoSync, syncFrequencyMinutes, isActive } = body;

    if (!id) {
      return new Response(
        JSON.stringify({
          error: 'Missing parameter',
          message: 'Account ID is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify account belongs to the user
    const [account] = await db
      .select()
      .from(connectedEmailAccounts)
      .where(
        and(
          eq(connectedEmailAccounts.id, id),
          eq(connectedEmailAccounts.userId, payload.id)
        )
      )
      .limit(1);

    if (!account) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Account not found or does not belong to you',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build update object
    const updates: any = { updatedAt: new Date() };
    if (typeof autoSync === 'boolean') updates.autoSync = autoSync;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (syncFrequencyMinutes) updates.syncFrequencyMinutes = syncFrequencyMinutes;

    // Update the account
    await db
      .update(connectedEmailAccounts)
      .set(updates)
      .where(eq(connectedEmailAccounts.id, id));

    console.log(`[OAuth Accounts] Account ${id} updated by user ${payload.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account settings updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[OAuth Accounts] PATCH error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update account',
        message: 'An error occurred while updating account settings',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
