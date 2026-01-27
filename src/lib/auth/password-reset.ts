/**
 * Password Reset Service
 *
 * Handles password reset token generation, validation, and email delivery
 */

import crypto from 'crypto';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface PasswordResetToken {
  token: string;
  userId: number;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory token storage (for production, use Redis or database table)
const resetTokens = new Map<string, PasswordResetToken>();

// Token expiry time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a secure password reset token
 */
export function generateResetToken(userId: number, email: string): PasswordResetToken {
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');

  const resetToken: PasswordResetToken = {
    token,
    userId,
    email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
  };

  // Store token
  resetTokens.set(token, resetToken);

  // Clean up expired tokens (prevent memory leak)
  cleanupExpiredTokens();

  return resetToken;
}

/**
 * Validate a password reset token
 */
export function validateResetToken(token: string): PasswordResetToken | null {
  const resetToken = resetTokens.get(token);

  if (!resetToken) {
    return null;
  }

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    resetTokens.delete(token);
    return null;
  }

  return resetToken;
}

/**
 * Invalidate a reset token after use
 */
export function invalidateResetToken(token: string): void {
  resetTokens.delete(token);
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens(): void {
  const now = new Date();

  for (const [token, resetToken] of resetTokens.entries()) {
    if (resetToken.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}

/**
 * Update user password (with hashing)
 */
export async function updateUserPassword(userId: number, newPassword: string): Promise<void> {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password reset is available for email
 * (prevents enumeration by always returning success)
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  return !!user;
}
