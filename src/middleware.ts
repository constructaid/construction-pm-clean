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
import { logger } from './lib/logger';
import { validateCSRFMiddleware, setCSRFCookie, CSRF_COOKIE_NAME } from './lib/auth/csrf';

export const onRequest = defineMiddleware(async (context, next) => {
  const endpoint = context.url.pathname;

  // Development Mode Bypass
  // SECURITY: Multiple layers of protection to prevent bypass in production:
  // 1. Check import.meta.env.DEV (build-time flag)
  // 2. Check NODE_ENV !== 'production' (runtime flag)
  // 3. Check import.meta.env.PROD is not true (build-time production flag)
  // 4. Require explicit opt-in via DEV_BYPASS_AUTH env var
  const isProduction = import.meta.env.PROD === true || process.env.NODE_ENV === 'production';
  const isDevelopment = !isProduction && (import.meta.env.DEV === true || process.env.NODE_ENV === 'development');
  const bypassRequested = process.env.DEV_BYPASS_AUTH === 'true';

  // CRITICAL: Never allow bypass in production, even if bypass is requested
  const bypassAuth = isDevelopment && bypassRequested && !isProduction;

  if (isProduction && bypassRequested) {
    // Log security warning - someone tried to enable bypass in production
    logger.error('SECURITY: DEV_BYPASS_AUTH attempted in production - BLOCKED', {
      module: 'middleware',
      endpoint,
      nodeEnv: process.env.NODE_ENV,
      isProd: import.meta.env.PROD,
    });
  }

  if (bypassAuth) {
    context.locals.user = {
      id: 1, // Main demo user with access to all test projects
      email: 'demo.pm@constructaid.com',
      role: 'GC',
      companyId: 1,
      firstName: 'Demo',
      lastName: 'PM',
    };
    logger.debug('DEV MODE BYPASS - Using demo user', {
      module: 'middleware',
      userId: 1,
      userEmail: 'demo.pm@constructaid.com',
      userRole: 'GC',
      endpoint,
    });
    return next();
  } else if (bypassRequested && !isDevelopment) {
    logger.warn('DEV_BYPASS_AUTH ignored - not in development mode', {
      module: 'middleware',
      endpoint,
    });
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

      logger.debug('User authenticated', {
        module: 'middleware',
        userId: payload.userId,
        userEmail: payload.email,
        userRole: payload.role,
        endpoint,
      });
    } catch (error) {
      // Token is invalid or expired
      logger.debug('Invalid or expired access token', {
        module: 'middleware',
        endpoint,
      });
      context.locals.user = undefined;
    }
  } else {
    // No token found - only log for API routes to reduce noise
    if (endpoint.startsWith('/api/')) {
      logger.debug('No access token in cookies', {
        module: 'middleware',
        endpoint,
      });
    }
    context.locals.user = undefined;
  }

  // CSRF Protection for state-changing API requests
  // Only applies to authenticated users making browser requests (not API token auth)
  if (endpoint.startsWith('/api/') && context.locals.user) {
    const csrfError = validateCSRFMiddleware(context);
    if (csrfError) {
      return csrfError;
    }
  }

  // Ensure CSRF cookie is set for authenticated users
  // This allows the client to include the token in subsequent requests
  if (context.locals.user && !context.cookies.get(CSRF_COOKIE_NAME)?.value) {
    setCSRFCookie(context);
  }

  // Continue to the route handler
  return next();
});
