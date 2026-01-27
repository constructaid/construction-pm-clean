/**
 * Rate Limiter for Authentication Endpoints
 *
 * Provides in-memory rate limiting to prevent brute force attacks.
 * In production, consider using Redis for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDurationMs: number; // How long to block after exceeding limit
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Strict rate limiting for login attempts
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
  },
  // Moderate rate limiting for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
  },
  // Moderate rate limiting for registration
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 attempts per hour
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
  },
  // Light rate limiting for email verification resend
  emailVerification: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 attempts per 5 minutes
    blockDurationMs: 15 * 60 * 1000, // Block for 15 minutes
  },
  // General API rate limiting
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    blockDurationMs: 60 * 1000, // Block for 1 minute
  },
} as const;

// In-memory store for rate limiting
// Note: This is per-instance. For distributed systems, use Redis.
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Cleanup interval to remove expired entries (every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries older than 2 hours
      if (now - entry.firstRequest > 2 * 60 * 60 * 1000) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Don't prevent Node.js from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Get a unique identifier for the request
 * Uses IP address and optionally the email/username for targeted limiting
 */
export function getRateLimitKey(
  request: Request,
  identifier?: string,
  endpoint?: string
): string {
  // Get IP from various headers (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  let ip = 'unknown';
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  }

  // Combine IP with identifier for more granular limiting
  const parts = [endpoint || 'default', ip];
  if (identifier) {
    // Normalize email to lowercase
    parts.push(identifier.toLowerCase());
  }

  return parts.join(':');
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until retry is allowed (only if blocked)
}

/**
 * Check if a request is rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.ceil(entry.blockedUntil / 1000),
      retryAfter,
    };
  }

  // No entry or window expired - create new entry
  if (!entry || now - entry.firstRequest > config.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: Math.ceil((now + config.windowMs) / 1000),
    };
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    entry.blockedUntil = now + config.blockDurationMs;
    const retryAfter = Math.ceil(config.blockDurationMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.ceil(entry.blockedUntil / 1000),
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: Math.ceil((entry.firstRequest + config.windowMs) / 1000),
  };
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetTime),
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.resetTime));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Helper middleware function for rate limiting
 */
export function withRateLimit(
  request: Request,
  configType: keyof typeof RATE_LIMIT_CONFIGS,
  identifier?: string
): RateLimitResult | null {
  const config = RATE_LIMIT_CONFIGS[configType];
  const key = getRateLimitKey(request, identifier, configType);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return result;
  }

  return null;
}
