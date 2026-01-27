/**
 * Email Verification API Endpoint
 * POST /api/auth/verify-email
 *
 * Verifies user's email address using verification token
 *
 * SECURITY:
 * - Token validation
 * - Single-use tokens
 * - 24-hour expiry
 * - Rate limiting
 */
import type { APIRoute } from 'astro';
import { apiHandler, validateBody, checkRateLimit, UnauthorizedError } from '../../../lib/api/error-handler';
import { z } from 'zod';
import {
  validateVerificationToken,
  invalidateVerificationToken,
  verifyUserEmail,
} from '../../../lib/auth/email-verification';

export const prerender = false;

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, verifyEmailSchema);

  // Rate limiting (10 requests per 15 minutes per IP)
  const rateLimitKey = `verify-email-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);

  console.log('[AUTH] Email verification attempt with token');

  // Validate the verification token
  const verificationToken = validateVerificationToken(data.token);

  if (!verificationToken) {
    console.log('[AUTH] Invalid or expired verification token');
    throw new UnauthorizedError('Invalid or expired verification token. Please request a new verification email.');
  }

  try {
    // Verify user's email
    await verifyUserEmail(verificationToken.userId);

    // Invalidate the token (single-use)
    invalidateVerificationToken(data.token);

    console.log(`[AUTH] Email verified successfully for user ${verificationToken.userId} (${verificationToken.email})`);

    return {
      success: true,
      message: 'Your email has been successfully verified! You can now log in.',
      email: verificationToken.email,
    };

  } catch (error) {
    console.error('[AUTH] Email verification error:', error);
    throw new Error('Failed to verify email. Please try again or contact support.');
  }
});
