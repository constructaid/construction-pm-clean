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
import { generateTokenPair } from '../../lib/auth/jwt';
import { generateVerificationToken, storeVerificationTokenInDB } from '../../lib/auth/email-verification';
import { getEmailService } from '../../lib/services/email-service';

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
    emailVerificationToken: null, // Will be set below
  };

  // Insert user
  const [result] = await db.insert(users).values(newUser).returning();

  console.log('User registered successfully:', result.id, result.email);

  // Generate email verification token
  const verificationToken = generateVerificationToken(result.id, result.email);

  // Store token in database for persistence
  await storeVerificationTokenInDB(result.id, verificationToken.token);

  // Send verification email
  try {
    const appUrl = process.env.APP_URL || context.url.origin;
    const emailService = getEmailService();
    await emailService.sendVerificationEmail(
      result.email,
      verificationToken.token,
      appUrl
    );
    console.log(`[EMAIL] Verification email sent to ${result.email}`);
  } catch (error) {
    console.error('[EMAIL] Failed to send verification email:', error);
    // Don't fail registration if email fails - user can resend later
  }

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

  // Generate JWT tokens for immediate login
  const { accessToken, refreshToken } = generateTokenPair({
    id: result.id,
    email: result.email,
    role: result.role,
    companyId: null,
  });

  // Return success response with tokens (without sensitive data)
  return {
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    userId: result.id,
    user: {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      role: result.role,
      status: result.status,
      company: result.company,
    },
    accessToken,
    refreshToken,
  };
});
