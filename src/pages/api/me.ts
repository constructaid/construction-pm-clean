/**
 * User Profile API Endpoint
 *
 * Returns current authenticated user's information
 * Example of using authentication middleware
 */

import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth/middleware';
import { db } from '../../lib/db';
import { users, companies } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  // Require authentication
  const authUser = await requireAuth(context);
  if (authUser instanceof Response) return authUser; // 401 error

  try {
    // Fetch full user details from database
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        companyId: users.companyId,
        phoneNumber: users.phoneNumber,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, authUser.userId))
      .limit(1);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'User not found',
          message: 'User account no longer exists',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch company info if user has one
    let companyInfo = null;
    if (user.companyId && companies) {
      try {
        const [company] = await db
          .select({
            id: companies.id,
            name: companies.name,
            type: companies.type,
          })
          .from(companies)
          .where(eq(companies.id, user.companyId))
          .limit(1);

        companyInfo = company || null;
      } catch (err) {
        // Company table might not exist or have schema issues
        console.warn('Failed to fetch company info:', err);
      }
    }

    return new Response(
      JSON.stringify({
        user: {
          ...user,
          company: companyInfo,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
