/**
 * Global Astro Middleware
 * Runs on every request to populate authentication context
 *
 * DEVELOPMENT MODE BYPASS:
 * Set DEV_BYPASS_AUTH=true in .env to skip authentication and use a default test user
 * This allows feature development without login blocking progress
 */
import { defineMiddleware } from 'astro:middleware';
import { verifyAccessToken } from './lib/auth/jwt';

export const onRequest = defineMiddleware(async (context, next) => {
  // Development Mode Bypass
  // SECURITY: Only allow bypass in development mode AND when explicitly enabled
  // This prevents accidental bypass in production even if env var is misconfigured
  const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  const bypassRequested = import.meta.env.PUBLIC_DEV_BYPASS_AUTH === 'true' || process.env.DEV_BYPASS_AUTH === 'true';
  const bypassAuth = isDevelopment && bypassRequested;

  if (bypassAuth) {
    context.locals.user = {
      id: 1, // Main demo user with access to all test projects
      email: 'demo.pm@constructaid.com',
      role: 'GC',
      companyId: 1,
      firstName: 'Demo',
      lastName: 'PM',
    };
    console.log('[MIDDLEWARE] 🔓 DEV MODE BYPASS - Authenticated as demo.pm@constructaid.com (GC)');
    return next();
  } else if (bypassRequested && !isDevelopment) {
    console.warn('[MIDDLEWARE] ⚠️ DEV_BYPASS_AUTH ignored - not in development mode');
  }

  // Normal authentication flow
  // Try to get access token from cookie
  const accessToken = context.cookies.get('accessToken')?.value;

  if (accessToken) {
    try {
      // Verify and decode the token
      const payload = verifyAccessToken(accessToken);

      // Populate context.locals.user with the authenticated user
      context.locals.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        companyId: payload.companyId,
      };

      console.log(`[MIDDLEWARE] ✓ Authenticated user: ${payload.email} (${payload.role})`);
    } catch (error) {
      // Token is invalid or expired
      console.log('[MIDDLEWARE] ✗ Invalid or expired access token');
      context.locals.user = undefined;
    }
  } else {
    // No token found
    console.log('[MIDDLEWARE] No access token in cookies');
    context.locals.user = undefined;
  }

  // Continue to the route handler
  return next();
});
