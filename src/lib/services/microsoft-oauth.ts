/**
 * Microsoft Graph API OAuth Integration
 *
 * Handles OAuth flow for Microsoft 365 / Outlook email accounts
 * Uses Microsoft Graph API for email access
 */

import { ConfidentialClientApplication, type Configuration } from '@azure/msal-node';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common'; // 'common' for multi-tenant
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:4321/api/oauth/microsoft/callback';

// Required Microsoft Graph API scopes
const REQUIRED_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access', // For refresh tokens
  'Mail.Read',
  'Mail.ReadWrite', // If we want to mark emails as read
  'Mail.Send', // If we want to send emails
  'User.Read',
];

/**
 * Initialize MSAL (Microsoft Authentication Library) client
 */
function getMSALClient(): ConfidentialClientApplication {
  const config: Configuration = {
    auth: {
      clientId: MICROSOFT_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
      clientSecret: MICROSOFT_CLIENT_SECRET,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message, containsPii) {
          if (containsPii) return;
          console.log('[MSAL]', message);
        },
        piiLoggingEnabled: false,
        logLevel: 3, // Info
      },
    },
  };

  return new ConfidentialClientApplication(config);
}

/**
 * Generate OAuth authorization URL
 * User will be redirected here to grant permissions
 */
export function getMicrosoftAuthUrl(state?: string): string {
  const authClient = getMSALClient();

  const authCodeUrlParameters = {
    scopes: REQUIRED_SCOPES,
    redirectUri: REDIRECT_URI,
    responseMode: 'query' as const,
    state: state || generateState(),
  };

  return authClient.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeMicrosoftAuthCode(code: string) {
  const authClient = getMSALClient();

  try {
    const tokenRequest = {
      code,
      scopes: REQUIRED_SCOPES,
      redirectUri: REDIRECT_URI,
    };

    const response = await authClient.acquireTokenByCode(tokenRequest);

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || null,
      expiresOn: response.expiresOn || null,
      account: {
        email: response.account?.username || '',
        name: response.account?.name || '',
        tenantId: response.account?.tenantId || '',
        accountId: response.account?.homeAccountId || '',
      },
      scopes: response.scopes || [],
    };
  } catch (error) {
    console.error('[Microsoft OAuth] Token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshMicrosoftAccessToken(refreshToken: string, accountEmail: string) {
  const authClient = getMSALClient();

  try {
    const tokenRequest = {
      refreshToken,
      scopes: REQUIRED_SCOPES,
      account: {
        homeAccountId: '',
        environment: 'login.windows.net',
        tenantId: MICROSOFT_TENANT_ID,
        username: accountEmail,
        localAccountId: '',
      },
    };

    const response = await authClient.acquireTokenByRefreshToken(tokenRequest);

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || refreshToken, // May return new refresh token
      expiresOn: response.expiresOn || null,
    };
  } catch (error) {
    console.error('[Microsoft OAuth] Token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Validate access token by making a test API call
 */
export async function validateMicrosoftToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch user profile from Microsoft Graph
 */
export async function getMicrosoftUserProfile(accessToken: string) {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await response.json();

    return {
      email: profile.userPrincipalName || profile.mail,
      displayName: profile.displayName,
      givenName: profile.givenName,
      surname: profile.surname,
      id: profile.id,
    };
  } catch (error) {
    console.error('[Microsoft Graph] Failed to fetch user profile:', error);
    throw error;
  }
}

/**
 * Fetch emails from Microsoft Graph API
 */
export async function fetchMicrosoftEmails(
  accessToken: string,
  options: {
    folder?: string; // 'inbox', 'sentitems', 'drafts', etc.
    top?: number; // Number of emails to fetch
    skip?: number; // Pagination offset
    filter?: string; // OData filter
    orderBy?: string; // OData orderBy
  } = {}
) {
  const {
    folder = 'inbox',
    top = 50,
    skip = 0,
    filter,
    orderBy = 'receivedDateTime desc',
  } = options;

  try {
    let url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages`;
    const params = new URLSearchParams({
      $top: top.toString(),
      $skip: skip.toString(),
      $orderby: orderBy,
      $select: 'id,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,hasAttachments,body,bodyPreview,isRead,importance,conversationId',
    });

    if (filter) {
      params.append('$filter', filter);
    }

    url += '?' + params.toString();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      emails: data.value || [],
      nextLink: data['@odata.nextLink'] || null,
      count: data.value?.length || 0,
    };
  } catch (error) {
    console.error('[Microsoft Graph] Failed to fetch emails:', error);
    throw error;
  }
}

/**
 * Fetch email attachments
 */
export async function fetchMicrosoftEmailAttachments(
  accessToken: string,
  emailId: string
) {
  try {
    const url = `https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attachments: ${response.status}`);
    }

    const data = await response.json();

    return data.value || [];
  } catch (error) {
    console.error('[Microsoft Graph] Failed to fetch attachments:', error);
    throw error;
  }
}

/**
 * Download attachment content
 */
export async function downloadMicrosoftAttachment(
  accessToken: string,
  emailId: string,
  attachmentId: string
): Promise<Buffer> {
  try {
    const url = `https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments/${attachmentId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status}`);
    }

    const data = await response.json();

    // Microsoft returns base64-encoded content
    if (data.contentBytes) {
      return Buffer.from(data.contentBytes, 'base64');
    }

    throw new Error('No content in attachment response');
  } catch (error) {
    console.error('[Microsoft Graph] Failed to download attachment:', error);
    throw error;
  }
}

/**
 * Generate a random state parameter for OAuth
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Check if Microsoft OAuth is properly configured
 */
export function isMicrosoftOAuthConfigured(): boolean {
  return !!(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET);
}
