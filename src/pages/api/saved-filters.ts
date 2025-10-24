/**
 * Saved Filters API
 * Manage saved search filters
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, or } from 'drizzle-orm';
import { savedFilters } from '../../lib/db/saved-filters-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * GET - List saved filters for a user
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const userId = url.searchParams.get('userId');
    const filterType = url.searchParams.get('type');
    const projectId = url.searchParams.get('projectId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filters: any[] = [
      or(
        eq(savedFilters.userId, parseInt(userId)),
        eq(savedFilters.isShared, true)
      )
    ];

    if (filterType) {
      filters.push(eq(savedFilters.filterType, filterType));
    }

    if (projectId) {
      filters.push(
        or(
          eq(savedFilters.projectId, parseInt(projectId)),
          eq(savedFilters.projectId, null as any)
        )
      );
    }

    const results = await db
      .select()
      .from(savedFilters)
      .where(and(...filters));

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching saved filters:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch saved filters' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST - Create a new saved filter
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      userId,
      projectId,
      filterName,
      filterType,
      description,
      filterCriteria,
      sortBy,
      sortOrder,
      columns,
      isDefault = false,
      isShared = false,
    } = body;

    if (!userId || !filterName || !filterType || !filterCriteria) {
      return new Response(JSON.stringify({
        error: 'Required fields: userId, filterName, filterType, filterCriteria'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If setting as default, unset any existing default for this user/type
    if (isDefault) {
      await db
        .update(savedFilters)
        .set({ isDefault: false })
        .where(and(
          eq(savedFilters.userId, userId),
          eq(savedFilters.filterType, filterType),
          eq(savedFilters.isDefault, true)
        ));
    }

    const newFilter = await db.insert(savedFilters).values({
      userId: userId,
      projectId: projectId,
      filterName: filterName,
      filterType: filterType,
      description: description,
      filterCriteria: filterCriteria,
      sortBy: sortBy,
      sortOrder: sortOrder,
      columns: columns,
      isDefault: isDefault,
      isShared: isShared,
      useCount: 0,
    }).returning();

    return new Response(JSON.stringify(newFilter[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating saved filter:', error);
    return new Response(JSON.stringify({ error: 'Failed to create saved filter' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT - Update a saved filter
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { filterId, userId, ...updates } = body;

    if (!filterId || !userId) {
      return new Response(JSON.stringify({ error: 'filterId and userId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If setting as default, unset other defaults
    if (updates.isDefault === true) {
      const filter = await db
        .select()
        .from(savedFilters)
        .where(eq(savedFilters.id, filterId))
        .limit(1);

      if (filter.length > 0) {
        await db
          .update(savedFilters)
          .set({ isDefault: false })
          .where(and(
            eq(savedFilters.userId, userId),
            eq(savedFilters.filterType, filter[0].filterType),
            eq(savedFilters.isDefault, true)
          ));
      }
    }

    const updated = await db
      .update(savedFilters)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(savedFilters.id, filterId),
        eq(savedFilters.userId, userId)
      ))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Filter not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating saved filter:', error);
    return new Response(JSON.stringify({ error: 'Failed to update saved filter' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE - Delete a saved filter
 */
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const filterId = url.searchParams.get('filterId');
    const userId = url.searchParams.get('userId');

    if (!filterId || !userId) {
      return new Response(JSON.stringify({ error: 'filterId and userId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deleted = await db
      .delete(savedFilters)
      .where(and(
        eq(savedFilters.id, parseInt(filterId)),
        eq(savedFilters.userId, parseInt(userId))
      ))
      .returning();

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Filter not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Filter deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting saved filter:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete saved filter' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PATCH - Track filter usage
 */
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { filterId } = body;

    if (!filterId) {
      return new Response(JSON.stringify({ error: 'filterId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db
      .update(savedFilters)
      .set({
        useCount: (savedFilters.useCount as any) + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(savedFilters.id, filterId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error tracking filter usage:', error);
    return new Response(JSON.stringify({ error: 'Failed to track usage' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
