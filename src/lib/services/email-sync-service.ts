/**
 * Email Sync Service
 *
 * Background service that syncs emails from connected accounts
 * Handles Microsoft and Gmail accounts
 * Processes attachments and links emails to projects
 */

import { db } from '../db';
import {
  connectedEmailAccounts,
  syncedEmails,
  emailAttachments,
  emailSyncJobs,
  type ConnectedEmailAccount,
  type NewSyncedEmail,
  type NewEmailAttachment,
  type NewEmailSyncJob,
} from '../db/oauth-email-schema';
import { eq, and, isNull, lt } from 'drizzle-orm';
import {
  fetchMicrosoftEmails,
  refreshMicrosoftAccessToken,
  fetchMicrosoftEmailAttachments,
} from './microsoft-oauth';
import {
  fetchGmailEmails,
  refreshGmailAccessToken,
  fetchGmailEmailAttachments,
} from './gmail-oauth';
import { safeDecryptToken, safeEncryptToken } from '../auth/encryption';
import {
  downloadAndSaveMicrosoftAttachment,
  downloadAndSaveGmailAttachment,
  categorizeAttachment,
  shouldDownloadAttachment,
} from './attachment-storage';

/**
 * Main sync function - syncs all active accounts
 */
export async function syncAllAccounts() {
  console.log('[Email Sync] Starting sync for all accounts');

  // Find all accounts that need syncing
  const accountsToSync = await db
    .select()
    .from(connectedEmailAccounts)
    .where(
      and(
        eq(connectedEmailAccounts.isActive, true),
        eq(connectedEmailAccounts.autoSync, true),
        isNull(connectedEmailAccounts.deletedAt)
      )
    );

  console.log(`[Email Sync] Found ${accountsToSync.length} accounts to sync`);

  // Sync each account
  for (const account of accountsToSync) {
    try {
      await syncAccount(account);
    } catch (error) {
      console.error(`[Email Sync] Error syncing account ${account.id}:`, error);
    }
  }

  console.log('[Email Sync] Sync completed for all accounts');
}

/**
 * Sync a single account
 */
export async function syncAccount(account: ConnectedEmailAccount) {
  console.log(`[Email Sync] Starting sync for account ${account.id} (${account.emailAddress})`);

  // Create sync job
  const [job] = await db
    .insert(emailSyncJobs)
    .values({
      connectedAccountId: account.id,
      jobType: account.lastSyncAt ? 'incremental' : 'full_sync',
      status: 'syncing',
      startedAt: new Date(),
    })
    .returning();

  try {
    // Check if token needs refresh
    const accessToken = await ensureValidToken(account);

    // Sync based on provider
    let syncResult;
    if (account.provider === 'microsoft') {
      syncResult = await syncMicrosoftAccount(account, accessToken);
    } else if (account.provider === 'gmail') {
      syncResult = await syncGmailAccount(account, accessToken);
    } else {
      throw new Error(`Unsupported provider: ${account.provider}`);
    }

    // Update job status
    await db
      .update(emailSyncJobs)
      .set({
        status: 'idle',
        completedAt: new Date(),
        durationMs: Date.now() - new Date(job.startedAt!).getTime(),
        processedItems: syncResult.processedCount,
        totalItems: syncResult.totalCount,
        results: syncResult,
      })
      .where(eq(emailSyncJobs.id, job.id));

    // Update account sync status
    await db
      .update(connectedEmailAccounts)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'idle',
        lastSyncError: null,
        totalEmailsSynced: account.totalEmailsSynced + syncResult.newEmailsCount,
        totalAttachmentsProcessed:
          account.totalAttachmentsProcessed + syncResult.newAttachmentsCount,
        updatedAt: new Date(),
      })
      .where(eq(connectedEmailAccounts.id, account.id));

    console.log(
      `[Email Sync] Completed sync for account ${account.id}: ${syncResult.newEmailsCount} new emails, ${syncResult.newAttachmentsCount} new attachments`
    );

    return syncResult;
  } catch (error) {
    console.error(`[Email Sync] Error in sync job ${job.id}:`, error);

    // Update job with error
    await db
      .update(emailSyncJobs)
      .set({
        status: 'error',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      .where(eq(emailSyncJobs.id, job.id));

    // Update account status
    await db
      .update(connectedEmailAccounts)
      .set({
        lastSyncStatus: 'error',
        lastSyncError: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(connectedEmailAccounts.id, account.id));

    throw error;
  }
}

/**
 * Ensure access token is valid, refresh if needed
 */
async function ensureValidToken(account: ConnectedEmailAccount): Promise<string> {
  // Decrypt the access token
  const decryptedAccessToken = safeDecryptToken(account.accessToken);

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000);

  if (account.tokenExpiry && new Date(account.tokenExpiry) < expiryThreshold) {
    console.log(`[Email Sync] Token expired for account ${account.id}, refreshing...`);

    if (!account.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Decrypt refresh token
    const decryptedRefreshToken = safeDecryptToken(account.refreshToken);

    // Refresh token based on provider
    let newTokens;
    if (account.provider === 'microsoft') {
      newTokens = await refreshMicrosoftAccessToken(
        decryptedRefreshToken,
        account.emailAddress
      );
    } else if (account.provider === 'gmail') {
      newTokens = await refreshGmailAccessToken(decryptedRefreshToken);
    } else {
      throw new Error(`Unsupported provider: ${account.provider}`);
    }

    // Update account with new encrypted tokens
    await db
      .update(connectedEmailAccounts)
      .set({
        accessToken: safeEncryptToken(newTokens.accessToken),
        refreshToken: newTokens.refreshToken ? safeEncryptToken(newTokens.refreshToken) : account.refreshToken,
        tokenExpiry: newTokens.expiresOn,
        updatedAt: new Date(),
      })
      .where(eq(connectedEmailAccounts.id, account.id));

    return newTokens.accessToken;
  }

  return decryptedAccessToken;
}

/**
 * Sync Microsoft account
 */
async function syncMicrosoftAccount(account: ConnectedEmailAccount, accessToken: string) {
  console.log(`[Email Sync] Syncing Microsoft account ${account.id}`);

  // Determine which folders to sync
  const folders = (account.syncFolders as string[]) || ['inbox'];

  let totalCount = 0;
  let processedCount = 0;
  let newEmailsCount = 0;
  let newAttachmentsCount = 0;

  for (const folder of folders) {
    try {
      // Build filter for incremental sync
      let filter: string | undefined;
      if (account.lastSyncedEmailDate) {
        const dateStr = new Date(account.lastSyncedEmailDate).toISOString();
        filter = `receivedDateTime gt ${dateStr}`;
      }

      // Fetch emails
      const response = await fetchMicrosoftEmails(accessToken, {
        folder,
        top: 50,
        filter,
        orderBy: 'receivedDateTime desc',
      });

      totalCount += response.count;

      for (const email of response.emails) {
        try {
          // Check if email already exists
          const existing = await db
            .select()
            .from(syncedEmails)
            .where(
              and(
                eq(syncedEmails.connectedAccountId, account.id),
                eq(syncedEmails.providerEmailId, email.id)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            processedCount++;
            continue;
          }

          // Parse email data
          const emailData: NewSyncedEmail = {
            connectedAccountId: account.id,
            providerEmailId: email.id,
            providerThreadId: email.conversationId,
            messageId: email.internetMessageId,
            subject: email.subject,
            fromAddress: email.from?.emailAddress?.address || '',
            fromName: email.from?.emailAddress?.name,
            toAddresses: email.toRecipients?.map((r: any) => ({
              email: r.emailAddress?.address,
              name: r.emailAddress?.name,
            })) || [],
            ccAddresses: email.ccRecipients?.map((r: any) => ({
              email: r.emailAddress?.address,
              name: r.emailAddress?.name,
            })) || [],
            bodyText: email.body?.contentType === 'text' ? email.body.content : null,
            bodyHtml: email.body?.contentType === 'html' ? email.body.content : null,
            snippet: email.bodyPreview,
            sentAt: email.sentDateTime ? new Date(email.sentDateTime) : null,
            receivedAt: new Date(email.receivedDateTime),
            isRead: email.isRead || false,
            isImportant: email.importance === 'high',
            hasAttachments: email.hasAttachments || false,
            attachmentCount: email.hasAttachments ? 1 : 0, // TODO: Get actual count
            folderName: folder,
            rawEmailData: email,
          };

          // Insert email
          const [insertedEmail] = await db
            .insert(syncedEmails)
            .values(emailData)
            .returning();

          newEmailsCount++;

          // Process attachments if present
          if (email.hasAttachments) {
            const attachments = await fetchMicrosoftEmailAttachments(accessToken, email.id);

            for (const attachment of attachments) {
              try {
                // Categorize attachment
                const category = categorizeAttachment(attachment.name, attachment.contentType);

                // Check if we should download this attachment
                const shouldDownload = shouldDownloadAttachment(
                  attachment.name,
                  attachment.size,
                  attachment.contentType
                );

                let storagePath: string | null = null;
                let storageUrl: string | null = null;
                let downloaded = false;

                // Download if appropriate
                if (shouldDownload) {
                  try {
                    const result = await downloadAndSaveMicrosoftAttachment(
                      accessToken,
                      email.id,
                      attachment.id,
                      attachment.name
                    );
                    storagePath = result.path;
                    storageUrl = result.url;
                    downloaded = true;
                  } catch (downloadError) {
                    console.error(`[Email Sync] Failed to download attachment ${attachment.name}:`, downloadError);
                  }
                }

                const attachmentData: NewEmailAttachment = {
                  syncedEmailId: insertedEmail.id,
                  connectedAccountId: account.id,
                  providerAttachmentId: attachment.id,
                  fileName: attachment.name,
                  fileSize: attachment.size,
                  mimeType: attachment.contentType,
                  contentId: attachment.contentId,
                  isInline: attachment.isInline || false,
                  storagePath,
                  storageUrl,
                  downloaded,
                  downloadedAt: downloaded ? new Date() : null,
                  fileType: category.fileType,
                  isPotentialDrawing: category.isPotentialDrawing,
                  isPotentialSpec: category.isPotentialSpec,
                  isPotentialPhoto: category.isPotentialPhoto,
                  metadata: attachment,
                };

                await db.insert(emailAttachments).values(attachmentData);
                newAttachmentsCount++;
              } catch (error) {
                console.error(`[Email Sync] Error processing attachment ${attachment.name}:`, error);
              }
            }
          }

          processedCount++;
        } catch (error) {
          console.error(`[Email Sync] Error processing email ${email.id}:`, error);
        }
      }
    } catch (error) {
      console.error(`[Email Sync] Error syncing folder ${folder}:`, error);
    }
  }

  return {
    totalCount,
    processedCount,
    newEmailsCount,
    newAttachmentsCount,
  };
}

/**
 * Sync Gmail account
 */
async function syncGmailAccount(account: ConnectedEmailAccount, accessToken: string) {
  console.log(`[Email Sync] Syncing Gmail account ${account.id}`);

  // Build query for incremental sync
  let query = 'in:inbox';
  if (account.lastSyncedEmailDate) {
    const dateStr = new Date(account.lastSyncedEmailDate).toISOString().split('T')[0];
    query += ` after:${dateStr}`;
  }

  let totalCount = 0;
  let processedCount = 0;
  let newEmailsCount = 0;
  let newAttachmentsCount = 0;

  try {
    // Fetch emails
    const response = await fetchGmailEmails(accessToken, {
      query,
      maxResults: 50,
      labelIds: ['INBOX'],
    });

    totalCount = response.count;

    for (const email of response.emails) {
      try {
        // Check if email already exists
        const existing = await db
          .select()
          .from(syncedEmails)
          .where(
            and(
              eq(syncedEmails.connectedAccountId, account.id),
              eq(syncedEmails.providerEmailId, email.id!)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          processedCount++;
          continue;
        }

        // Parse Gmail email data
        const headers = email.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const emailData: NewSyncedEmail = {
          connectedAccountId: account.id,
          providerEmailId: email.id!,
          providerThreadId: email.threadId,
          messageId: getHeader('Message-ID'),
          subject: getHeader('Subject'),
          fromAddress: getHeader('From'),
          fromName: null,
          toAddresses: getHeader('To') ? [{ email: getHeader('To'), name: null }] : [],
          snippet: email.snippet,
          sentAt: email.internalDate ? new Date(parseInt(email.internalDate)) : null,
          receivedAt: email.internalDate ? new Date(parseInt(email.internalDate)) : new Date(),
          isRead: !email.labelIds?.includes('UNREAD'),
          isImportant: email.labelIds?.includes('IMPORTANT') || false,
          hasAttachments: false, // TODO: Check for attachments
          folderName: 'INBOX',
          rawEmailData: email,
        };

        // Insert email
        const [insertedEmail] = await db
          .insert(syncedEmails)
          .values(emailData)
          .returning();

        newEmailsCount++;

        // Process attachments
        const attachments = await fetchGmailEmailAttachments(accessToken, email.id!);

        if (attachments.length > 0) {
          // Update email to mark it has attachments
          await db
            .update(syncedEmails)
            .set({ hasAttachments: true, attachmentCount: attachments.length })
            .where(eq(syncedEmails.id, insertedEmail.id));
        }

        for (const attachment of attachments) {
          try {
            // Categorize attachment
            const category = categorizeAttachment(attachment.filename, attachment.mimeType);

            // Check if we should download this attachment
            const shouldDownload = shouldDownloadAttachment(
              attachment.filename,
              attachment.size,
              attachment.mimeType
            );

            let storagePath: string | null = null;
            let storageUrl: string | null = null;
            let downloaded = false;

            // Download if appropriate
            if (shouldDownload) {
              try {
                const result = await downloadAndSaveGmailAttachment(
                  accessToken,
                  email.id!,
                  attachment.attachmentId,
                  attachment.filename
                );
                storagePath = result.path;
                storageUrl = result.url;
                downloaded = true;
              } catch (downloadError) {
                console.error(`[Email Sync] Failed to download Gmail attachment ${attachment.filename}:`, downloadError);
              }
            }

            const attachmentData: NewEmailAttachment = {
              syncedEmailId: insertedEmail.id,
              connectedAccountId: account.id,
              providerAttachmentId: attachment.attachmentId,
              fileName: attachment.filename,
              fileSize: attachment.size,
              mimeType: attachment.mimeType,
              storagePath,
              storageUrl,
              downloaded,
              downloadedAt: downloaded ? new Date() : null,
              fileType: category.fileType,
              isPotentialDrawing: category.isPotentialDrawing,
              isPotentialSpec: category.isPotentialSpec,
              isPotentialPhoto: category.isPotentialPhoto,
              metadata: attachment,
            };

            await db.insert(emailAttachments).values(attachmentData);
            newAttachmentsCount++;
          } catch (error) {
            console.error(`[Email Sync] Error processing Gmail attachment ${attachment.filename}:`, error);
          }
        }

        processedCount++;
      } catch (error) {
        console.error(`[Email Sync] Error processing Gmail email ${email.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Email Sync] Error syncing Gmail:', error);
    throw error;
  }

  return {
    totalCount,
    processedCount,
    newEmailsCount,
    newAttachmentsCount,
  };
}

/**
 * Manual sync trigger
 */
export async function triggerManualSync(accountId: number, userId: number) {
  // Verify account belongs to user
  const [account] = await db
    .select()
    .from(connectedEmailAccounts)
    .where(
      and(
        eq(connectedEmailAccounts.id, accountId),
        eq(connectedEmailAccounts.userId, userId)
      )
    )
    .limit(1);

  if (!account) {
    throw new Error('Account not found');
  }

  return await syncAccount(account);
}
