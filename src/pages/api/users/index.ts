/**
 * Users API Endpoint
 * GET /api/users - List all users (with filtering, pagination)
 * POST /api/users - Create a new user
 * SECURED with RBAC middleware - Admin only
 */
import type { APIRoute } from 'astro';
import { db, users } from '../../../lib/db';
import { eq, like, or, and, desc, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateBody,
  checkRateLimit,
  requireAuth,
  ForbiddenError,
} from '../../../lib/api/error-handler';
import { excludeDeleted } from '../../../lib/db/soft-delete';
import bcrypt from 'bcryptjs';

export const prerender = false;

// ========================================
// GET - List users with filtering
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  // SECURITY: Require authentication and admin role
  requireAuth(context);
  const user = context.locals.user!;

  // Only admins can list users
  if (user.role !== 'ADMIN' && user.role !== 'GC') {
    throw new ForbiddenError('Only administrators can list users');
  }

  // Rate limiting
  checkRateLimit(`users-list-${context.clientAddress}`, 100, 60000);

  // Parse query parameters
  const url = new URL(context.request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || '';
  const status = url.searchParams.get('status') || '';
  const companyId = url.searchParams.get('companyId') || '';

  console.log('GET /api/users', { page, limit, search, role, status, companyId });

  // Build where clause
  const conditions = [excludeDeleted()];

  if (search) {
    conditions.push(
      or(
        like(users.firstName, `%${search}%`),
        like(users.lastName, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.company, `%${search}%`)
      )!
    );
  }

  if (role) {
    conditions.push(eq(users.role, role as any));
  }

  if (status) {
    conditions.push(eq(users.status, status as any));
  }

  if (companyId) {
    conditions.push(eq(users.company, companyId));
  }

  // Calculate offset
  const offset = (page - 1) * limit;

  // Fetch users (excluding passwords)
  const usersList = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      status: users.status,
      company: users.company,
      phone: users.phone,
      avatar: users.avatar,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(...conditions));

  const totalPages = Math.ceil(Number(count) / limit);

  return {
    users: usersList,
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages,
      hasMore: page < totalPages,
    },
  };
});

// ========================================
// POST - Create new user
// ========================================

export const POST: APIRoute = apiHandler(async (context) => {
  // SECURITY: Require authentication and admin role
  requireAuth(context);
  const currentUser = context.locals.user!;

  // Only admins can create users
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'GC') {
    throw new ForbiddenError('Only administrators can create users');
  }

  // Rate limiting
  checkRateLimit(`users-create-${context.clientAddress}`, 10, 60000);

  const data = await context.request.json();

  console.log('POST /api/users', 'Creating new user:', data.email, 'by admin:', currentUser.id);

  // Validate required fields
  if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName, role',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'User with this email already exists',
      }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      status: data.status || 'ACTIVE',
      company: data.company || null,
      phone: data.phone || null,
      avatar: data.avatar || null,
      emailVerified: data.emailVerified || false,
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      status: users.status,
      company: users.company,
      phone: users.phone,
      avatar: users.avatar,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    });

  console.log('User created successfully:', newUser.id);

  return {
    message: 'User created successfully',
    user: newUser,
  };
});
