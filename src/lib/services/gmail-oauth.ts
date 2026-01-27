/**
 * Gmail API OAuth Integration
 *
 * Handles OAuth flow for Gmail email accounts
 * Uses Google OAuth 2.0 and Gmail API
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

// Gmail OAuth configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:4321/api/oauth/gmail/callback';

// Required Gmail API scopes
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify', // For marking as read
  // 'https://www.googleapis.com/auth/gmail.send', // Optional: for sending emails
];

/**
 * Initialize Google OAuth2 client
 */
function getOAuth2Client(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  return oauth2Client;
}

/**
 * Generate OAuth authorization URL
 * User will be redirected here to grant permissions
 */
export function getGmailAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required for refresh tokens
    scope: REQUIRED_SCOPES,
    state: state || generateState(),
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeGmailAuthCode(code: string) {
  const oauth2Client = getOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Set credentials on the client
    oauth2Client.setCredentials(tokens);

    // Get user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || null,
      expiresOn: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      account: {
        email: userInfo.data.email || '',
        name: userInfo.data.name || '',
        id: userInfo.data.id || '',
        picture: userInfo.data.picture || '',
      },
      scopes: tokens.scope?.split(' ') || [],
    };
  } catch (error) {
    console.error('[Gmail OAuth] Token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshGmailAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();

  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token || '',
      refreshToken: credentials.refresh_token || refreshToken, // May return new refresh token
      expiresOn: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    };
  } catch (error) {
    console.error('[Gmail OAuth] Token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Validate access token by making a test API call
 */
export async function validateGmailToken(accessToken: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.getProfile({ userId: 'me' });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch user profile from Gmail
 */
export async function getGmailUserProfile(accessToken: string) {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      email: userInfo.data.email || '',
      displayName: userInfo.data.name || '',
      givenName: userInfo.data.given_name || '',
      familyName: userInfo.data.family_name || '',
      id: userInfo.data.id || '',
      picture: userInfo.data.picture || '',
    };
  } catch (error) {
    console.error('[Gmail] Failed to fetch user profile:', error);
    throw error;
  }
}

/**
 * Fetch emails from Gmail API
 */
export async function fetchGmailEmails(
  accessToken: string,
  options: {
    query?: string; // Gmail search query (e.g., 'in:inbox is:unread')
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[]; // ['INBOX', 'SENT', etc.]
  } = {}
) {
  const {
    query = 'in:inbox',
    maxResults = 50,
    pageToken,
    labelIds = ['INBOX'],
  } = options;

  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      labelIds,
      q: query,
    });

    const messageIds = listResponse.data.messages || [];

    // Fetch full message details for each message
    const emails = await Promise.all(
      messageIds.map(async (msg) => {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        });

        return messageResponse.data;
      })
    );

    return {
      emails,
      nextPageToken: listResponse.data.nextPageToken || null,
      count: emails.length,
      resultSizeEstimate: listResponse.data.resultSizeEstimate || 0,
    };
  } catch (error) {
    console.error('[Gmail] Failed to fetch emails:', error);
    throw error;
  }
}

/**
 * Fetch email attachments
 */
export async function fetchGmailEmailAttachments(
  accessToken: string,
  messageId: string
) {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const attachments: any[] = [];

    // Extract attachments from message parts
    function extractAttachments(parts: any[] | undefined, parentPartId?: string) {
      if (!parts) return;

      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            partId: part.partId,
            attachmentId: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
          });
        }

        // Recursively check nested parts
        if (part.parts) {
          extractAttachments(part.parts, part.partId);
        }
      }
    }

    extractAttachments(message.data.payload?.parts);

    return attachments;
  } catch (error) {
    console.error('[Gmail] Failed to fetch attachments:', error);
    throw error;
  }
}

/**
 * Download attachment content
 */
export async function downloadGmailAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    // Gmail returns base64url-encoded content
    if (attachment.data.data) {
      // Convert base64url to base64
      const base64 = attachment.data.data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64');
    }

    throw new Error('No content in attachment response');
  } catch (error) {
    console.error('[Gmail] Failed to download attachment:', error);
    throw error;
  }
}

/**
 * Mark email as read
 */
export async function markGmailEmailAsRead(accessToken: string, messageId: string) {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    return true;
  } catch (error) {
    console.error('[Gmail] Failed to mark email as read:', error);
    return false;
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
 * Check if Gmail OAuth is properly configured
 */
export function isGmailOAuthConfigured(): boolean {
  return !!(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET);
}
