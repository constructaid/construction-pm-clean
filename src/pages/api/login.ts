/**
 * Login API Endpoint
 *
 * Authenticates user credentials and returns JWT tokens
 * Sets HTTP-only cookies for security
 *
 * SECURITY: Rate limited to prevent brute force attacks
 * - 5 attempts per 15 minutes per IP+email combination
 * - 30 minute block after exceeding limit
 */

import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { users } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateTokenPair } from '../../lib/auth/jwt';
import { getSessionManager } from '../../lib/auth/session-manager';
import { setCSRFCookie } from '../../lib/auth/csrf';
import {
  getRateLimitKey,
  checkRateLimit,
  rateLimitResponse,
  resetRateLimit,
  RATE_LIMIT_CONFIGS,
} from '../../lib/security/rate-limiter';

export const POST: APIRoute = async (context) => {
  const { request, clientAddress, cookies } = context;
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: 'Missing credentials',
          message: 'Email and password are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limiting (using both IP and email to prevent distributed attacks)
    const rateLimitKey = getRateLimitKey(request, email, 'login');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.login);

    if (!rateLimitResult.allowed) {
      console.log(`[AUTH] Rate limit exceeded for ${clientAddress} / ${email}`);
      return rateLimitResponse(rateLimitResult);
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      // Rate limit is already tracked by the rate limiter
      console.log(`[AUTH] Login failed - user not found: ${email}`);

      // Return generic error to prevent email enumeration
      return new Response(
        JSON.stringify({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if password hash exists
    if (!user.password) {
      console.log(`[AUTH] Login failed - no password hash for user ${user.id}`);

      return new Response(
        JSON.stringify({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`[AUTH] Login failed - invalid password for user ${user.id}`);

      return new Response(
        JSON.stringify({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is active
    if (user.deletedAt) {
      console.log(`[AUTH] Login failed - user deleted: ${user.id}`);

      return new Response(
        JSON.stringify({
          error: 'Account disabled',
          message: 'This account has been disabled',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success! Clear rate limiting for this IP+email combination
    resetRateLimit(rateLimitKey);
    console.log(`[AUTH] Login successful for user ${user.id} (${user.email})`);

    // Check email verification status
    const emailVerificationWarning = !user.emailVerified
      ? 'Please verify your email address to access all features.'
      : undefined;

    if (!user.emailVerified) {
      console.log(`[AUTH] Warning - User ${user.id} email not verified`);
    }

    // Generate JWT tokens with companyId for multi-tenancy
    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || null, // Multi-tenancy: include user's company
    });

    // Create session (now async with database storage)
    const sessionManager = getSessionManager();
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const session = await sessionManager.createSession(
      user.id,
      user.email,
      user.role,
      clientAddress || 'unknown',
      userAgent,
      refreshToken,
      user.companyId // Multi-tenancy: store companyId in session
    );

    // Update last login timestamp
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Set CSRF token cookie for browser clients
    const csrfToken = setCSRFCookie(context);

    // Return tokens
    // In development, tokens are valid for 30 days
    // In production, access tokens expire in 1 hour
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login successful',
        warning: emailVerificationWarning,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          company: user.company,
          emailVerified: user.emailVerified,
          status: user.status,
        },
        accessToken,
        refreshToken,
        sessionId: session.id,
        csrfToken, // Include CSRF token for client-side storage
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Set HTTP-only cookies for security
          'Set-Cookie': [
            `accessToken=${accessToken}; HttpOnly; Path=/; SameSite=Strict; ${
              process.env.NODE_ENV === 'production' ? 'Secure;' : ''
            } Max-Age=${30 * 24 * 60 * 60}`, // 30 days in dev
            `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; ${
              process.env.NODE_ENV === 'production' ? 'Secure;' : ''
            } Max-Age=${7 * 24 * 60 * 60}`, // 7 days
            `sessionId=${session.id}; HttpOnly; Path=/; SameSite=Strict; ${
              process.env.NODE_ENV === 'production' ? 'Secure;' : ''
            } Max-Age=${24 * 60 * 60}`, // 24 hours
          ].join(', '),
        },
      }
    );
  } catch (error) {
    console.error('[AUTH] Login error:', error);

    return new Response(
      JSON.stringify({
        error: 'Login failed',
        message: 'An error occurred during login',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
