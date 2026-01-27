/**
 * Token Encryption/Decryption Utilities
 *
 * Encrypts OAuth tokens before storing in database
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment
 * In production, store this in a secure key management service (AWS KMS, Azure Key Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment variables');
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once and store the result in your environment variables
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt a token
 * Returns: base64-encoded string with format: iv:authTag:encryptedData
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt token:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a token
 * Expects: base64-encoded string with format: iv:authTag:encryptedData
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error('Encrypted token cannot be empty');
  }

  try {
    const key = getEncryptionKey();

    // Parse the encrypted token
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivBase64, authTagBase64, encryptedData] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt token:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    const key = process.env.ENCRYPTION_KEY;
    return !!(key && key.length === 64);
  } catch {
    return false;
  }
}

/**
 * Safely encrypt token with fallback
 * If encryption is not configured, returns token as-is with warning
 * Use this during development/testing
 */
export function safeEncryptToken(token: string): string {
  if (!isEncryptionConfigured()) {
    console.warn('[Encryption] ENCRYPTION_KEY not configured - storing token unencrypted (DEV ONLY)');
    return token;
  }

  return encryptToken(token);
}

/**
 * Safely decrypt token with fallback
 * If token doesn't look encrypted, returns as-is (for backwards compatibility)
 */
export function safeDecryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    return '';
  }

  // Check if token looks encrypted (format: base64:base64:base64)
  const parts = encryptedToken.split(':');
  if (parts.length !== 3) {
    // Assume it's an unencrypted token (backwards compatibility)
    console.warn('[Encryption] Token appears to be unencrypted');
    return encryptedToken;
  }

  if (!isEncryptionConfigured()) {
    throw new Error('Cannot decrypt token: ENCRYPTION_KEY not configured');
  }

  return decryptToken(encryptedToken);
}

/**
 * Rotate encryption for a token (re-encrypt with new key)
 * Useful when changing encryption keys
 */
export function rotateTokenEncryption(oldEncryptedToken: string, oldKey: string): string {
  // Temporarily set old key to decrypt
  const originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = oldKey;

  try {
    const decrypted = decryptToken(oldEncryptedToken);

    // Restore new key and re-encrypt
    process.env.ENCRYPTION_KEY = originalKey;
    return encryptToken(decrypted);
  } catch (error) {
    process.env.ENCRYPTION_KEY = originalKey;
    throw error;
  }
}
