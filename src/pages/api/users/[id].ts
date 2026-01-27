/**
 * Single User API Endpoint
 * GET /api/users/[id] - Get user by ID
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Soft delete user
 * SECURED with RBAC middleware - Admin or self only
 */
import type { APIRoute } from 'astro';
import { db, users } from '../../../lib/db';
import { eq, and } from 'drizzle-orm';
import {
  apiHandler,
  NotFoundError,
  checkRateLimit,
  requireAuth,
  ForbiddenError,
} from '../../../lib/api/error-handler';
import { excludeDeleted, softDelete } from '../../../lib/db/soft-delete';
import bcrypt from 'bcryptjs';

export const prerender = false;

// ========================================
// GET - Fetch single user
// ========================================

export const GET: APIRoute = apiHandler(async (context) => {
  const { id } = context.params;

  // SECURITY: Require authentication
  requireAuth(context);
  const currentUser = context.locals.user!;

  // Users can view themselves, admins can view anyone
  const targetUserId = parseInt(id as string);
  if (currentUser.id !== targetUserId && currentUser.role !== 'ADMIN' && currentUser.role !== 'GC') {
    throw new ForbiddenError('You can only view your own profile');
  }

  // Rate limiting
  checkRateLimit(`user-detail-${context.clientAddress}`, 200, 60000);

  console.log('GET /api/users/' + id);

  // Fetch user (excluding password and soft-deleted)
  const [user] = await db
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
    .where(and(
      eq(users.id, parseInt(id as string)),
      excludeDeleted()
    ))
    .limit(1);

  if (!user) {
    throw new NotFoundError('User', id);
  }

  return { user };
});

// ========================================
// PUT - Update user
// ========================================

export const PUT: APIRoute = apiHandler(async (context) => {
  const { id } = context.params;

  // SECURITY: Require authentication
  requireAuth(context);
  const currentUser = context.locals.user!;

  // Users can update themselves, admins can update anyone
  const targetUserId = parseInt(id as string);
  const isSelfUpdate = currentUser.id === targetUserId;
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'GC';

  if (!isSelfUpdate && !isAdmin) {
    throw new ForbiddenError('You can only update your own profile');
  }

  // Rate limiting
  checkRateLimit(`user-update-${context.clientAddress}`, 20, 60000);

  const data = await context.request.json();

  // Non-admins cannot change their own role or status
  if (!isAdmin && (data.role !== undefined || data.status !== undefined)) {
    throw new ForbiddenError('Only administrators can change user roles and status');
  }

  console.log('PUT /api/users/' + id, 'Data:', data, 'by user:', currentUser.id);

  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.id, parseInt(id as string)),
      excludeDeleted()
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('User', id);
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update fields that were provided
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;

  // Handle password update separately (requires hashing)
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  // Update user
  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, parseInt(id as string)))
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
      updatedAt: users.updatedAt,
    });

  console.log('User updated successfully:', updated.id);

  return {
    message: 'User updated successfully',
    user: updated,
  };
});

// ========================================
// DELETE - Soft delete user
// ========================================

export const DELETE: APIRoute = apiHandler(async (context) => {
  const { id } = context.params;

  // SECURITY: Require authentication and admin role
  requireAuth(context);
  const currentUser = context.locals.user!;

  // Only admins can delete users
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'GC') {
    throw new ForbiddenError('Only administrators can delete users');
  }

  // Prevent self-deletion
  const targetUserId = parseInt(id as string);
  if (currentUser.id === targetUserId) {
    throw new ForbiddenError('You cannot delete your own account');
  }

  // Rate limiting
  checkRateLimit(`user-delete-${context.clientAddress}`, 10, 60000);

  console.log('DELETE /api/users/' + id, 'by admin:', currentUser.id);

  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.id, targetUserId),
      excludeDeleted()
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('User', id);
  }

  // Soft delete the user
  await softDelete(users, targetUserId, currentUser.id);

  console.log('User soft-deleted successfully:', id);

  return {
    message: 'User deleted successfully',
    userId: targetUserId,
  };
});
