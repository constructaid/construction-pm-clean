/**
 * JWT Authentication Utilities
 *
 * Provides token generation and verification with development-friendly long sessions
 * Production: 1 hour access tokens, 7 day refresh tokens
 * Development: 30 day access tokens for convenience
 */

import jwt from 'jsonwebtoken';
import type { User } from '../db/schema';

const IS_PRODUCTION = import.meta.env.PROD === true || process.env.NODE_ENV === 'production';
const IS_DEV = !IS_PRODUCTION && (import.meta.env.MODE === 'development' || process.env.NODE_ENV === 'development');

// Minimum JWT secret length for security (256 bits = 32 characters minimum)
const MIN_SECRET_LENGTH = 32;
const WEAK_SECRETS = [
  'dev-secret-key-change-in-production',
  'your-secret-key-here-change-in-production',
  'secret',
  'jwt-secret',
  'change-me',
  'password',
];

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  // In production, enforce strong secret requirements
  if (IS_PRODUCTION) {
    if (!secret) {
      throw new Error('SECURITY ERROR: JWT_SECRET environment variable is required in production');
    }
    if (secret.length < MIN_SECRET_LENGTH) {
      throw new Error(`SECURITY ERROR: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production (got ${secret.length})`);
    }
    if (WEAK_SECRETS.some(weak => secret.toLowerCase().includes(weak))) {
      throw new Error('SECURITY ERROR: JWT_SECRET appears to be a weak/default value. Use a cryptographically random string.');
    }
  }

  // In development, allow weak secret but warn
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    if (!IS_DEV) {
      console.warn('WARNING: Using weak JWT secret. Set JWT_SECRET environment variable with at least 32 characters.');
    }
    return secret || 'dev-secret-key-change-in-production';
  }

  return secret;
}

const JWT_SECRET = getJWTSecret();

// Token expiration times
const ACCESS_TOKEN_EXPIRY = IS_DEV ? '30d' : '1h'; // 30 days in dev, 1 hour in prod
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days for refresh tokens

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  companyId: number | null;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token for authenticated user
 */
export function generateAccessToken(user: {
  id: number;
  email: string;
  role: string;
  companyId: number | null;
}): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate JWT refresh token for token renewal
 */
export function generateRefreshToken(user: {
  id: number;
  email: string;
  role: string;
  companyId: number | null;
}): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(user: {
  id: number;
  email: string;
  role: string;
  companyId: number | null;
}) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

/**
 * Verify and decode JWT token
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify access token specifically (checks token type)
 */
export function verifyAccessToken(token: string): TokenPayload {
  const payload = verifyToken(token);

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return payload;
}

/**
 * Verify refresh token specifically (checks token type)
 */
export function verifyRefreshToken(token: string): TokenPayload {
  const payload = verifyToken(token);

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return payload;
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Get token expiration info in human-readable format
 */
export function getTokenInfo(token: string): {
  expiresAt: Date | null;
  expiresIn: string | null;
  isExpired: boolean;
  payload: TokenPayload | null;
} {
  const payload = decodeToken(token);

  if (!payload || !payload.exp) {
    return {
      expiresAt: null,
      expiresIn: null,
      isExpired: true,
      payload,
    };
  }

  const expiresAt = new Date(payload.exp * 1000);
  const now = new Date();
  const isExpired = expiresAt < now;

  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let expiresIn = '';
  if (diffDays > 0) expiresIn += `${diffDays}d `;
  if (diffHours > 0) expiresIn += `${diffHours}h `;
  if (diffMinutes > 0) expiresIn += `${diffMinutes}m`;

  return {
    expiresAt,
    expiresIn: expiresIn.trim() || 'expired',
    isExpired,
    payload,
  };
}
