/**
 * Attachment Storage Service
 *
 * Handles downloading and storing email attachments
 * Saves files to local disk or cloud storage (S3, Azure Blob, etc.)
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { downloadMicrosoftAttachment } from './microsoft-oauth';
import { downloadGmailAttachment } from './gmail-oauth';

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const EMAIL_ATTACHMENTS_DIR = path.join(UPLOAD_DIR, 'email-attachments');

/**
 * Ensure upload directories exist
 */
async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(EMAIL_ATTACHMENTS_DIR, { recursive: true });
  } catch (error) {
    console.error('[Attachment Storage] Failed to create directories:', error);
    throw error;
  }
}

/**
 * Generate a unique filename for an attachment
 */
function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const nameWithoutExt = path.basename(originalFilename, ext);
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();

  // Sanitize filename (remove special characters)
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `${timestamp}_${hash}_${sanitized}${ext}`;
}

/**
 * Download and save a Microsoft attachment
 */
export async function downloadAndSaveMicrosoftAttachment(
  accessToken: string,
  emailId: string,
  attachmentId: string,
  originalFilename: string
): Promise<{ path: string; url: string; size: number }> {
  try {
    await ensureDirectoriesExist();

    // Download attachment from Microsoft Graph
    console.log(`[Attachment Storage] Downloading Microsoft attachment: ${originalFilename}`);
    const buffer = await downloadMicrosoftAttachment(accessToken, emailId, attachmentId);

    // Generate unique filename
    const filename = generateUniqueFilename(originalFilename);
    const filePath = path.join(EMAIL_ATTACHMENTS_DIR, filename);

    // Save to disk
    await fs.writeFile(filePath, buffer);

    // Generate public URL
    const url = `/uploads/email-attachments/${filename}`;

    console.log(`[Attachment Storage] Saved attachment: ${filename} (${buffer.length} bytes)`);

    return {
      path: filePath,
      url,
      size: buffer.length,
    };
  } catch (error) {
    console.error('[Attachment Storage] Failed to download Microsoft attachment:', error);
    throw error;
  }
}

/**
 * Download and save a Gmail attachment
 */
export async function downloadAndSaveGmailAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string,
  originalFilename: string
): Promise<{ path: string; url: string; size: number }> {
  try {
    await ensureDirectoriesExist();

    // Download attachment from Gmail API
    console.log(`[Attachment Storage] Downloading Gmail attachment: ${originalFilename}`);
    const buffer = await downloadGmailAttachment(accessToken, messageId, attachmentId);

    // Generate unique filename
    const filename = generateUniqueFilename(originalFilename);
    const filePath = path.join(EMAIL_ATTACHMENTS_DIR, filename);

    // Save to disk
    await fs.writeFile(filePath, buffer);

    // Generate public URL
    const url = `/uploads/email-attachments/${filename}`;

    console.log(`[Attachment Storage] Saved attachment: ${filename} (${buffer.length} bytes)`);

    return {
      path: filePath,
      url,
      size: buffer.length,
    };
  } catch (error) {
    console.error('[Attachment Storage] Failed to download Gmail attachment:', error);
    throw error;
  }
}

/**
 * Delete an attachment file
 */
export async function deleteAttachment(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    console.log(`[Attachment Storage] Deleted attachment: ${filePath}`);
    return true;
  } catch (error) {
    console.error('[Attachment Storage] Failed to delete attachment:', error);
    return false;
  }
}

/**
 * Get attachment file type category
 * Used for determining if it's a drawing, spec, photo, etc.
 */
export function categorizeAttachment(filename: string, mimeType: string): {
  fileType: string;
  isPotentialDrawing: boolean;
  isPotentialSpec: boolean;
  isPotentialPhoto: boolean;
} {
  const ext = path.extname(filename).toLowerCase();
  const mime = mimeType.toLowerCase();

  // Drawing files
  const drawingExtensions = ['.dwg', '.dxf', '.pdf', '.rvt', '.skp', '.3ds'];
  const isPotentialDrawing = drawingExtensions.includes(ext) || mime.includes('pdf');

  // Spec/document files
  const specExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
  const isPotentialSpec = specExtensions.includes(ext) || mime.includes('document') || mime.includes('spreadsheet');

  // Photo/image files
  const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp', '.bmp'];
  const isPotentialPhoto = photoExtensions.includes(ext) || mime.includes('image');

  // Determine primary file type
  let fileType = 'other';
  if (isPotentialPhoto) fileType = 'image';
  else if (ext === '.pdf') fileType = 'pdf';
  else if (['.doc', '.docx'].includes(ext)) fileType = 'document';
  else if (['.xls', '.xlsx'].includes(ext)) fileType = 'spreadsheet';
  else if (['.dwg', '.dxf', '.rvt'].includes(ext)) fileType = 'cad';

  return {
    fileType,
    isPotentialDrawing,
    isPotentialSpec,
    isPotentialPhoto,
  };
}

/**
 * Check if file should be downloaded based on size and type
 */
export function shouldDownloadAttachment(
  filename: string,
  fileSize: number,
  mimeType: string
): boolean {
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

  // Skip if too large
  if (fileSize > MAX_SIZE) {
    console.log(`[Attachment Storage] Skipping large attachment: ${filename} (${fileSize} bytes)`);
    return false;
  }

  // Skip certain file types
  const ext = path.extname(filename).toLowerCase();
  const skipExtensions = ['.exe', '.dll', '.bat', '.sh', '.cmd'];

  if (skipExtensions.includes(ext)) {
    console.log(`[Attachment Storage] Skipping potentially dangerous file: ${filename}`);
    return false;
  }

  return true;
}
