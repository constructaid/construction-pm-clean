/**
 * Validate Reset Token API Endpoint
 * GET /api/auth/validate-reset-token?token=xxx
 *
 * Validates if a reset token is still valid (not expired)
 * Used by frontend to show appropriate UI
 */
import type { APIRoute } from 'astro';
import { apiHandler, validateQuery } from '../../../lib/api/error-handler';
import { z } from 'zod';
import { validateResetToken } from '../../../lib/auth/password-reset';

export const prerender = false;

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, validateTokenSchema);

  console.log('[AUTH] Validating reset token');

  // Validate the token
  const resetToken = validateResetToken(query.token);

  if (!resetToken) {
    return {
      valid: false,
      message: 'Invalid or expired token',
    };
  }

  // Calculate time remaining
  const now = new Date();
  const timeRemainingMs = resetToken.expiresAt.getTime() - now.getTime();
  const timeRemainingMinutes = Math.floor(timeRemainingMs / (60 * 1000));

  return {
    valid: true,
    message: 'Token is valid',
    expiresIn: timeRemainingMinutes,
    email: resetToken.email, // Return email so user knows which account
  };
});
