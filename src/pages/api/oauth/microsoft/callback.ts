/**
 * Microsoft OAuth Callback Endpoint
 *
 * Handles the callback from Microsoft after user authorization
 * Exchanges the authorization code for access/refresh tokens
 * Stores the tokens in the database
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { connectedEmailAccounts } from '../../../../lib/db/oauth-email-schema';
import { eq, and } from 'drizzle-orm';
import {
  exchangeMicrosoftAuthCode,
  getMicrosoftUserProfile,
} from '../../../../lib/services/microsoft-oauth';
import { verifyAccessToken } from '../../../../lib/auth/jwt';
import { safeEncryptToken } from '../../../../lib/auth/encryption';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Check for OAuth errors
    if (error) {
      console.error('[Microsoft OAuth] Authorization error:', error, errorDescription);
      return redirect(`/settings/email-accounts?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      console.error('[Microsoft OAuth] Missing code or state parameter');
      return redirect('/settings/email-accounts?error=missing_parameters');
    }

    // Verify state parameter to prevent CSRF
    let stateData: { userId: number; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      console.error('[Microsoft OAuth] Invalid state parameter');
      return redirect('/settings/email-accounts?error=invalid_state');
    }

    // Check if state is not too old (5 minutes)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 5 * 60 * 1000) {
      console.error('[Microsoft OAuth] State parameter expired');
      return redirect('/settings/email-accounts?error=state_expired');
    }

    // Verify the user's access token
    const accessToken = cookies.get('accessToken')?.value;
    if (!accessToken) {
      console.error('[Microsoft OAuth] No access token found');
      return redirect('/login?redirect=/settings/email-accounts');
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload || payload.id !== stateData.userId) {
      console.error('[Microsoft OAuth] Token verification failed or user mismatch');
      return redirect('/login?redirect=/settings/email-accounts');
    }

    // Exchange authorization code for tokens
    console.log('[Microsoft OAuth] Exchanging authorization code for tokens');
    const tokenResponse = await exchangeMicrosoftAuthCode(code);

    // Get user profile from Microsoft
    console.log('[Microsoft OAuth] Fetching user profile');
    const profile = await getMicrosoftUserProfile(tokenResponse.accessToken);

    // Check if this email account is already connected
    const existingAccount = await db
      .select()
      .from(connectedEmailAccounts)
      .where(
        and(
          eq(connectedEmailAccounts.userId, stateData.userId),
          eq(connectedEmailAccounts.emailAddress, profile.email),
          eq(connectedEmailAccounts.provider, 'microsoft')
        )
      )
      .limit(1);

    if (existingAccount.length > 0) {
      // Update existing account
      console.log('[Microsoft OAuth] Updating existing account');
      await db
        .update(connectedEmailAccounts)
        .set({
          accessToken: safeEncryptToken(tokenResponse.accessToken),
          refreshToken: tokenResponse.refreshToken ? safeEncryptToken(tokenResponse.refreshToken) : null,
          tokenExpiry: tokenResponse.expiresOn,
          displayName: profile.displayName,
          providerAccountId: profile.id,
          providerTenantId: tokenResponse.account.tenantId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(connectedEmailAccounts.id, existingAccount[0].id));

      return redirect('/settings/email-accounts?status=updated');
    }

    // Create new connected account
    console.log('[Microsoft OAuth] Creating new connected account');
    await db.insert(connectedEmailAccounts).values({
      userId: stateData.userId,
      emailAddress: profile.email,
      displayName: profile.displayName,
      provider: 'microsoft',
      accessToken: safeEncryptToken(tokenResponse.accessToken),
      refreshToken: tokenResponse.refreshToken ? safeEncryptToken(tokenResponse.refreshToken) : null,
      tokenExpiry: tokenResponse.expiresOn,
      providerAccountId: profile.id,
      providerTenantId: tokenResponse.account.tenantId,
      isActive: true,
      autoSync: true,
      syncFrequencyMinutes: 15,
      hasReadPermission: true,
      hasSendPermission: tokenResponse.scopes.includes('Mail.Send'),
      hasCalendarPermission: false,
      metadata: {
        scopes: tokenResponse.scopes,
        givenName: profile.givenName,
        surname: profile.surname,
      },
    });

    console.log('[Microsoft OAuth] Account connected successfully');
    return redirect('/settings/email-accounts?status=connected');
  } catch (error) {
    console.error('[Microsoft OAuth] Callback error:', error);
    return redirect('/settings/email-accounts?error=callback_failed');
  }
};
