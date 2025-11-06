/**
 * User Registration API Endpoint - PostgreSQL Version
 * Handles user registration with role-based account creation
 * POST /api/register - Register a new user
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Rate limiting
 * - Audit logging (tracks all changes)
 * - Migrated from MongoDB to PostgreSQL
 */
import type { APIRoute } from 'astro';
import { db, users } from '../../lib/db';
import { eq } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  checkRateLimit,
  ConflictError,
} from '../../lib/api/error-handler';
import { createUserSchema } from '../../lib/validation/schemas';
import {
  logCreate,
  createAuditContext,
  sanitizeForAudit,
} from '../../lib/api/audit-logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const prerender = false;

// ========================================
// POST - Register new user
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // Validate request body
  const data = await validateBody(context, createUserSchema);

  // Strict rate limiting for registration (10 registrations per minute per IP)
  const rateLimitKey = `register-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 10, 60000);

  console.log('POST /api/register - Registering new user:', data.email);

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Hash password with bcrypt (cost factor 12 for strong security)
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  // Create new user with validated data
  const newUser = {
    email: data.email.toLowerCase().trim(),
    password: passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    status: 'PENDING_VERIFICATION' as const,
    company: data.company || null,
    phone: data.phone || null,
    avatar: null,
    emailVerified: false,
    emailVerificationToken,
  };

  // Insert user
  const [result] = await db.insert(users).values(newUser).returning();

  console.log('User registered successfully:', result.id, result.email);

  // TODO: Send verification email
  // This would typically use a service like SendGrid, AWS SES, or Nodemailer
  console.log(`[EMAIL] Verification token for ${result.email}: ${emailVerificationToken}`);
  console.log(`[EMAIL] Verification link: ${context.url.origin}/verify-email?token=${emailVerificationToken}`);

  // Log the registration to audit log
  const auditContext = createAuditContext(context, {
    id: result.id,
    email: result.email,
    role: result.role,
  });

  // Sanitize user data before audit logging (remove sensitive fields)
  const sanitizedUser = sanitizeForAudit({
    ...result,
    password: undefined, // Never log passwords
    emailVerificationToken: undefined, // Never log tokens
  });

  // Log audit (async, non-blocking)
  logCreate(
    'users',
    result.id,
    sanitizedUser,
    auditContext,
    'User registered via API'
  ).catch(err => console.error('[AUDIT] Failed to log registration:', err));

  // Return success response (without sensitive data)
  return {
    message: 'Registration successful. Please check your email to verify your account.',
    userId: result.id,
    user: {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      role: result.role,
      status: result.status,
    },
  };
});
