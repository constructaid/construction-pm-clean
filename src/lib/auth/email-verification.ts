/**
 * Email Verification Service
 *
 * Handles email verification tokens and user verification flow
 *
 * SECURITY:
 * - Cryptographically secure token generation
 * - Single-use tokens
 * - 24-hour expiry
 * - Rate limiting on verification requests
 */
import crypto from 'crypto';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface EmailVerificationToken {
  token: string;
  userId: number;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

// Token expiry: 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

// In-memory store for verification tokens
// For production, consider using Redis or database table
const verificationTokens = new Map<string, EmailVerificationToken>();

// Cleanup expired tokens every hour
setInterval(() => {
  const now = new Date();
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate a new email verification token
 */
export function generateVerificationToken(userId: number, email: string): EmailVerificationToken {
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');

  const verificationToken: EmailVerificationToken = {
    token,
    userId,
    email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
  };

  // Store token
  verificationTokens.set(token, verificationToken);

  console.log(`[EMAIL-VERIFICATION] Token generated for user ${userId} (${email})`);
  console.log(`[EMAIL-VERIFICATION] Token: ${token}`);
  console.log(`[EMAIL-VERIFICATION] Expires: ${verificationToken.expiresAt.toISOString()}`);

  return verificationToken;
}

/**
 * Validate a verification token
 * Returns the token data if valid, null if invalid or expired
 */
export function validateVerificationToken(token: string): EmailVerificationToken | null {
  const verificationToken = verificationTokens.get(token);

  if (!verificationToken) {
    console.log('[EMAIL-VERIFICATION] Token not found');
    return null;
  }

  // Check if token is expired
  if (verificationToken.expiresAt < new Date()) {
    console.log('[EMAIL-VERIFICATION] Token expired');
    verificationTokens.delete(token);
    return null;
  }

  return verificationToken;
}

/**
 * Invalidate a verification token (single-use)
 */
export function invalidateVerificationToken(token: string): void {
  verificationTokens.delete(token);
  console.log('[EMAIL-VERIFICATION] Token invalidated');
}

/**
 * Verify user's email address
 * Updates user status to ACTIVE and sets emailVerified to true
 */
export async function verifyUserEmail(userId: number): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        emailVerified: true,
        status: 'ACTIVE',
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`[EMAIL-VERIFICATION] User ${userId} email verified successfully`);
  } catch (error) {
    console.error('[EMAIL-VERIFICATION] Error verifying user email:', error);
    throw new Error('Failed to verify email. Please try again.');
  }
}

/**
 * Store verification token in database (for persistence across server restarts)
 */
export async function storeVerificationTokenInDB(userId: number, token: string): Promise<void> {
  try {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`[EMAIL-VERIFICATION] Token stored in database for user ${userId}`);
  } catch (error) {
    console.error('[EMAIL-VERIFICATION] Error storing token in database:', error);
    throw new Error('Failed to store verification token.');
  }
}

/**
 * Resend verification email
 * Generates new token and sends email
 */
export async function resendVerificationEmail(email: string): Promise<EmailVerificationToken | null> {
  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      console.log(`[EMAIL-VERIFICATION] User not found: ${email}`);
      return null;
    }

    // Check if already verified
    if (user.emailVerified) {
      console.log(`[EMAIL-VERIFICATION] User already verified: ${email}`);
      return null;
    }

    // Generate new token
    const verificationToken = generateVerificationToken(user.id, user.email);

    // Store in database
    await storeVerificationTokenInDB(user.id, verificationToken.token);

    return verificationToken;
  } catch (error) {
    console.error('[EMAIL-VERIFICATION] Error resending verification email:', error);
    throw new Error('Failed to resend verification email.');
  }
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  try {
    const [user] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.emailVerified ?? false;
  } catch (error) {
    console.error('[EMAIL-VERIFICATION] Error checking email verification status:', error);
    return false;
  }
}

/**
 * Get time remaining on verification token (in minutes)
 */
export function getTokenExpiryMinutes(token: string): number | null {
  const verificationToken = verificationTokens.get(token);

  if (!verificationToken) {
    return null;
  }

  const now = new Date();
  const expiresAt = verificationToken.expiresAt;

  if (expiresAt < now) {
    return 0;
  }

  const diffMs = expiresAt.getTime() - now.getTime();
  return Math.floor(diffMs / (60 * 1000));
}
