/**
 * API Error Handler
 * Centralized error handling for all API endpoints
 * Priority: P0 - Critical for security, debugging, and user experience
 */

import type { APIContext } from 'astro';
import { z, ZodError } from 'zod';
import { formatZodErrors } from '../validation/schemas';
import { logger } from '../logger';

// ========================================
// CUSTOM ERROR CLASSES
// ========================================

export class APIError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
  }

  private getDefaultCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, originalError?: Error) {
    super('Database operation failed', 500, 'DATABASE_ERROR', {
      message,
      error: originalError?.message,
    });
    this.name = 'DatabaseError';
  }
}

// ========================================
// ERROR RESPONSE INTERFACE
// ========================================

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

// ========================================
// ERROR HANDLER FUNCTION
// ========================================

/**
 * Handle errors and return appropriate JSON response
 */
export function handleError(error: unknown, context?: APIContext): Response {
  const timestamp = new Date().toISOString();
  const path = context?.url?.pathname;
  const user = context?.locals?.user;

  // Log error with structured logger
  logger.error('API Error', {
    module: 'api',
    endpoint: path,
    method: context?.request?.method,
    userId: user?.id,
    userEmail: user?.email,
    errorCode: error instanceof APIError ? error.code : 'UNKNOWN',
  }, error instanceof Error ? error : new Error(String(error)));

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 422,
        details: formatZodErrors(error),
        timestamp,
        path,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle custom API errors
  if (error instanceof APIError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        timestamp,
        path,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle database errors (PostgreSQL errors)
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any;
    let message = 'Database operation failed';
    let statusCode = 500;

    // PostgreSQL error codes
    switch (dbError.code) {
      case '23505': // unique_violation
        message = 'A record with this value already exists';
        statusCode = 409;
        break;
      case '23503': // foreign_key_violation
        message = 'Referenced record does not exist';
        statusCode = 400;
        break;
      case '23502': // not_null_violation
        message = 'Required field is missing';
        statusCode = 400;
        break;
      case '22P02': // invalid_text_representation
        message = 'Invalid data format';
        statusCode = 400;
        break;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message,
        code: 'DATABASE_ERROR',
        statusCode,
        details: process.env.NODE_ENV === 'development' ? { dbCode: dbError.code, dbMessage: dbError.message } : undefined,
        timestamp,
        path,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle generic errors
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? { stack: error instanceof Error ? error.stack : undefined } : undefined,
      timestamp,
      path,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ========================================
// SUCCESS RESPONSE HELPER
// ========================================

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T, statusCode: number = 200): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ========================================
// API HANDLER WRAPPER
// ========================================

/**
 * Wrap API route handlers with error handling
 * This ensures all errors are caught and properly formatted
 */
export function apiHandler<T = any>(
  handler: (context: APIContext) => Promise<T | Response>
): (context: APIContext) => Promise<Response> {
  return async (context: APIContext): Promise<Response> => {
    try {
      const result = await handler(context);

      // If handler returns a Response directly, return it
      if (result instanceof Response) {
        return result;
      }

      // Otherwise, wrap in success response
      return successResponse(result);
    } catch (error) {
      return handleError(error, context);
    }
  };
}

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

/**
 * Validate request body against a Zod schema
 * Throws ValidationError if validation fails
 */
export async function validateBody<T>(
  context: APIContext,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await context.request.json();
    return await schema.parseAsync(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be caught by error handler
    }
    throw new ValidationError('Invalid request body');
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  context: APIContext,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(context.url.searchParams);
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be caught by error handler
    }
    throw new ValidationError('Invalid query parameters');
  }
}

/**
 * Validate URL parameters against a Zod schema
 */
export function validateParams<T>(
  params: Record<string, string | undefined>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error; // Will be caught by error handler
    }
    throw new ValidationError('Invalid URL parameters');
  }
}

// ========================================
// AUTHENTICATION/AUTHORIZATION HELPERS
// ========================================

/**
 * Require authentication - throws UnauthorizedError if not authenticated
 */
export function requireAuth(context: APIContext): void {
  const user = context.locals.user;
  if (!user) {
    throw new UnauthorizedError();
  }
}

/**
 * Require specific role - throws ForbiddenError if user doesn't have role
 */
export function requireRole(context: APIContext, roles: string[]): void {
  requireAuth(context);
  const user = context.locals.user;
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`This action requires one of the following roles: ${roles.join(', ')}`);
  }
}

/**
 * Require specific permission - throws ForbiddenError if user doesn't have permission
 */
export function requirePermission(context: APIContext, permission: string): void {
  requireAuth(context);
  const user = context.locals.user;
  // TODO: Implement actual permission checking logic
  // This is a placeholder that should integrate with your permission system
  // if (!user.permissions?.includes(permission)) {
  //   throw new ForbiddenError(`Missing required permission: ${permission}`);
  // }
}

// ========================================
// RATE LIMITING HELPER
// ========================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiting
 * For production, use Redis or similar
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): void {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (record.count >= maxRequests) {
    throw new APIError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', {
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    });
  }

  record.count++;
}

// ========================================
// EXAMPLE USAGE
// ========================================

/**
 * Example of using the API handler wrapper:
 *
 * export const POST = apiHandler(async (context) => {
 *   // Validate authentication
 *   requireAuth(context);
 *
 *   // Validate request body
 *   const data = await validateBody(context, createProjectSchema);
 *
 *   // Check rate limit
 *   checkRateLimit(context.locals.user.id.toString(), 10, 60000);
 *
 *   // Perform database operation
 *   const project = await db.insert(projects).values(data).returning();
 *
 *   // Return success response (will be wrapped automatically)
 *   return project;
 * });
 *
 * If any error is thrown, it will be caught and formatted properly.
 * No need for try-catch blocks in your handlers!
 */
