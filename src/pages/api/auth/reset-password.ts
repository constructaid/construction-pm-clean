/**
 * Reset Password API Endpoint
 * POST /api/auth/reset-password
 *
 * Validates reset token and updates user password
 *
 * SECURITY:
 * - Token validation
 * - Password strength requirements
 * - Single-use tokens
 * - Rate limiting
 */
import type { APIRoute } from 'astro';
import { apiHandler, validateBody, checkRateLimit, UnauthorizedError } from '../../../lib/api/error-handler';
import { z } from 'zod';
import {
  validateResetToken,
  invalidateResetToken,
  updateUserPassword,
  validatePasswordStrength,
} from '../../../lib/auth/password-reset';

export const prerender = false;

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, resetPasswordSchema);

  // Rate limiting (10 requests per 15 minutes per IP)
  const rateLimitKey = `reset-password-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);

  console.log('[AUTH] Password reset attempt with token');

  // Validate the reset token
  const resetToken = validateResetToken(data.token);

  if (!resetToken) {
    console.log('[AUTH] Invalid or expired reset token');
    throw new UnauthorizedError('Invalid or expired reset token. Please request a new password reset.');
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(data.newPassword);

  if (!passwordValidation.valid) {
    throw new UnauthorizedError(
      `Password does not meet security requirements: ${passwordValidation.errors.join(', ')}`
    );
  }

  try {
    // Update user password
    await updateUserPassword(resetToken.userId, data.newPassword);

    // Invalidate the token (single-use)
    invalidateResetToken(data.token);

    console.log(`[AUTH] Password successfully reset for user ${resetToken.userId} (${resetToken.email})`);

    return {
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.',
    };

  } catch (error) {
    console.error('[AUTH] Password reset error:', error);
    throw new Error('Failed to reset password. Please try again or contact support.');
  }
});
