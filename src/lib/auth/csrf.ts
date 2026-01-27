/**
 * CSRF Protection Module
 *
 * Provides Cross-Site Request Forgery protection for state-changing requests.
 * Uses the Double Submit Cookie pattern with cryptographic tokens.
 *
 * USAGE:
 * 1. Generate a CSRF token on login/session creation
 * 2. Send token to client in a cookie (csrf-token)
 * 3. Client includes token in X-CSRF-Token header for POST/PUT/PATCH/DELETE
 * 4. Server validates header matches cookie
 */

import crypto from 'crypto';
import type { APIContext } from 'astro';
import { logger } from '../logger';

// CSRF token cookie name
export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

// Token validity in milliseconds (24 hours, matches session lifetime)
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36);
  return `${token}.${timestamp}`;
}

/**
 * Validate a CSRF token format and age
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [tokenPart, timestampPart] = parts;

  // Token should be 64 hex characters
  if (!/^[a-f0-9]{64}$/.test(tokenPart)) {
    return false;
  }

  // Check token age
  try {
    const timestamp = parseInt(timestampPart, 36);
    const age = Date.now() - timestamp;
    if (age > TOKEN_VALIDITY_MS || age < 0) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Validate CSRF token using Double Submit Cookie pattern
 * Compares token from header with token from cookie
 */
export function validateCSRFToken(
  headerToken: string | null,
  cookieToken: string | null
): { valid: boolean; reason?: string } {
  if (!headerToken) {
    return { valid: false, reason: 'Missing CSRF token in header' };
  }

  if (!cookieToken) {
    return { valid: false, reason: 'Missing CSRF token in cookie' };
  }

  if (!isValidTokenFormat(headerToken)) {
    return { valid: false, reason: 'Invalid CSRF token format in header' };
  }

  if (!isValidTokenFormat(cookieToken)) {
    return { valid: false, reason: 'Invalid CSRF token format in cookie' };
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }

  return { valid: true };
}

/**
 * Set CSRF token cookie in response
 */
export function setCSRFCookie(
  context: APIContext,
  token?: string
): string {
  const csrfToken = token || generateCSRFToken();

  // Set cookie with security attributes
  context.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    path: '/',
    httpOnly: false, // Must be accessible to JavaScript for header inclusion
    secure: import.meta.env.PROD, // HTTPS only in production
    sameSite: 'strict', // Strict same-site policy
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return csrfToken;
}

/**
 * Get CSRF token from request
 */
export function getCSRFTokenFromRequest(context: APIContext): {
  headerToken: string | null;
  cookieToken: string | null;
} {
  const headerToken = context.request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = context.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;

  return { headerToken, cookieToken };
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Middleware function to validate CSRF token
 * Returns null if valid, Response if invalid
 */
export function validateCSRFMiddleware(context: APIContext): Response | null {
  const method = context.request.method;

  // Only check state-changing methods
  if (!requiresCSRFProtection(method)) {
    return null;
  }

  // Skip CSRF check for API routes that use Bearer token auth
  // These are typically called from external clients, not browsers
  const authHeader = context.request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return null;
  }

  // Get tokens
  const { headerToken, cookieToken } = getCSRFTokenFromRequest(context);

  // Validate
  const result = validateCSRFToken(headerToken, cookieToken);

  if (!result.valid) {
    logger.warn('CSRF validation failed', {
      module: 'csrf',
      reason: result.reason,
      method,
      endpoint: context.url.pathname,
    });

    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'CSRF token validation failed',
        code: 'CSRF_INVALID',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

/**
 * Helper to include CSRF token in API response
 * Call this on successful login to provide token to client
 */
export function getCSRFTokenResponse(context: APIContext): { csrfToken: string } {
  // Check if cookie already exists
  let token = context.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Generate new token if not exists or invalid
  if (!token || !isValidTokenFormat(token)) {
    token = setCSRFCookie(context);
  }

  return { csrfToken: token };
}
