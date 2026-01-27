/**
 * Forgot Password API Endpoint
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow by sending email with reset token
 *
 * SECURITY: Always returns success to prevent email enumeration
 */
import type { APIRoute } from 'astro';
import { apiHandler, validateBody, checkRateLimit } from '../../../lib/api/error-handler';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { users } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateResetToken } from '../../../lib/auth/password-reset';
import { getEmailService } from '../../../lib/services/email-service';

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, forgotPasswordSchema);

  // Rate limiting (5 requests per 15 minutes per IP)
  const rateLimitKey = `forgot-password-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

  const email = data.email.toLowerCase().trim();

  console.log(`[AUTH] Password reset requested for: ${email}`);

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If user exists, generate token and send email
    if (user) {
      const resetToken = generateResetToken(user.id, user.email);

      // Get app URL from environment
      const appUrl = process.env.APP_URL || 'http://localhost:4321';

      // Send password reset email
      const emailService = getEmailService();
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken.token,
        appUrl
      );

      console.log(`[AUTH] Password reset email sent to: ${user.email}`);
      console.log(`[AUTH] Reset token: ${resetToken.token} (expires: ${resetToken.expiresAt.toISOString()})`);
    } else {
      console.log(`[AUTH] Password reset requested for non-existent email: ${email}`);
      // Don't reveal that email doesn't exist (prevent enumeration)
    }

    // ALWAYS return success to prevent email enumeration
    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link shortly.',
      // Note: We intentionally don't confirm whether email exists
    };

  } catch (error) {
    console.error('[AUTH] Forgot password error:', error);

    // Still return success to prevent information leakage
    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link shortly.',
    };
  }
});
