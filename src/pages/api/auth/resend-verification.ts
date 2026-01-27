/**
 * Resend Verification Email API Endpoint
 * POST /api/auth/resend-verification
 *
 * Resends email verification to user
 *
 * SECURITY: Always returns success to prevent email enumeration
 */
import type { APIRoute } from 'astro';
import { apiHandler, validateBody, checkRateLimit } from '../../../lib/api/error-handler';
import { z } from 'zod';
import { resendVerificationEmail } from '../../../lib/auth/email-verification';
import { getEmailService } from '../../../lib/services/email-service';

export const prerender = false;

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, resendVerificationSchema);

  // Rate limiting (3 requests per 15 minutes per IP)
  const rateLimitKey = `resend-verification-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000);

  const email = data.email.toLowerCase().trim();

  console.log(`[AUTH] Verification email resend requested for: ${email}`);

  try {
    // Resend verification email
    const verificationToken = await resendVerificationEmail(email);

    // If token was generated (user exists and not verified), send email
    if (verificationToken) {
      const appUrl = process.env.APP_URL || 'http://localhost:4321';

      const emailService = getEmailService();
      await emailService.sendVerificationEmail(
        verificationToken.email,
        verificationToken.token,
        appUrl
      );

      console.log(`[AUTH] Verification email resent to: ${verificationToken.email}`);
    } else {
      console.log(`[AUTH] Verification email not sent (user not found or already verified): ${email}`);
      // Don't reveal whether user exists or is already verified
    }

    // ALWAYS return success to prevent email enumeration
    return {
      success: true,
      message: 'If your account exists and is not yet verified, you will receive a verification email shortly.',
    };

  } catch (error) {
    console.error('[AUTH] Resend verification error:', error);

    // Still return success to prevent information leakage
    return {
      success: true,
      message: 'If your account exists and is not yet verified, you will receive a verification email shortly.',
    };
  }
});
