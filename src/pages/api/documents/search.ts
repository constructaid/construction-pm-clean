/**
 * Document Search API
 * SECURED with RBAC middleware
 *
 * Searches indexed documents by keyword, entity, or document type
 * Supports filtering by project, document type, CSI division, etc.
 */

import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { indexedDocuments, documentSearchHistory } from '../../../lib/db/schema';
import { and, or, eq, like, sql, desc, isNull } from 'drizzle-orm';
import { checkRBAC } from '../../../lib/middleware/rbac';
import { requireAuth } from '../../../lib/api/error-handler';

export const GET: APIRoute = async (context) => {
  try {
    const { url } = context;
    const searchParams = url.searchParams;

    // Query parameters
    const query = searchParams.get('q') || '';
    const projectId = searchParams.get('projectId');
    const documentType = searchParams.get('documentType');
    const folderType = searchParams.get('folderType');
    const csiDivision = searchParams.get('csiDivision');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // RBAC: Require project-scoped access or general authentication
    if (projectId) {
      const rbacResult = await checkRBAC(context, parseInt(projectId, 10), 'canRead');
      if (rbacResult instanceof Response) {
        return rbacResult;
      }
    } else {
      // General document search requires authentication
      requireAuth(context);
    }

    const user = context.locals.user!;
    const startTime = Date.now();

    // Build query conditions
    const conditions = [];

    // Only show non-deleted documents
    conditions.push(isNull(indexedDocuments.deletedAt));

    // Filter by project
    if (projectId) {
      conditions.push(eq(indexedDocuments.projectId, parseInt(projectId, 10)));
    }

    // Filter by document type
    if (documentType) {
      conditions.push(eq(indexedDocuments.documentType, documentType as any));
    }

    // Filter by folder type
    if (folderType) {
      conditions.push(eq(indexedDocuments.folderType, folderType as any));
    }

    // Filter by CSI division
    if (csiDivision) {
      conditions.push(eq(indexedDocuments.csiDivision, csiDivision));
    }

    // Search query
    if (query) {
      // Search in multiple fields
      const searchConditions = [
        like(indexedDocuments.fileName, `%${query}%`),
        like(indexedDocuments.extractedText, `%${query}%`),
        sql`${indexedDocuments.keywords}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedRFINumbers}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedSubmittalNumbers}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedChangeOrderNumbers}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedDrawingNumbers}::text LIKE ${`%${query}%`}`,
      ];

      conditions.push(or(...searchConditions));
    }

    // Execute search query
    const results = await db
      .select({
        id: indexedDocuments.id,
        projectId: indexedDocuments.projectId,
        filePath: indexedDocuments.filePath,
        fileName: indexedDocuments.fileName,
        fileSize: indexedDocuments.fileSize,
        mimeType: indexedDocuments.mimeType,
        documentType: indexedDocuments.documentType,
        folderType: indexedDocuments.folderType,
        csiDivision: indexedDocuments.csiDivision,
        pageCount: indexedDocuments.pageCount,
        extractedTextLength: indexedDocuments.extractedTextLength,
        extractedRFINumbers: indexedDocuments.extractedRFINumbers,
        extractedSubmittalNumbers: indexedDocuments.extractedSubmittalNumbers,
        extractedChangeOrderNumbers: indexedDocuments.extractedChangeOrderNumbers,
        extractedDrawingNumbers: indexedDocuments.extractedDrawingNumbers,
        keywords: indexedDocuments.keywords,
        lastProcessed: indexedDocuments.lastProcessed,
        createdAt: indexedDocuments.createdAt,
      })
      .from(indexedDocuments)
      .where(and(...conditions))
      .orderBy(desc(indexedDocuments.lastProcessed))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(indexedDocuments)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);
    const searchTimeMs = Date.now() - startTime;

    // Track search in history (optional, for analytics)
    if (query) {
      try {
        await db.insert(documentSearchHistory).values({
          userId: user.id,
          projectId: projectId ? parseInt(projectId, 10) : null,
          searchQuery: query,
          searchType: 'keyword',
          resultCount: results.length,
          topResultIds: results.slice(0, 10).map(r => r.id),
          searchTimeMs,
        });
      } catch (error) {
        // Ignore search history errors
        console.warn('Failed to save search history:', error);
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + results.length < total,
        },
        searchTimeMs,
        query: {
          q: query,
          projectId,
          documentType,
          folderType,
          csiDivision,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Document search error:', error);

    return new Response(
      JSON.stringify({
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const { request } = context;
    const body = await request.json();
    const { query, filters, limit = 20, offset = 0 } = body;

    // RBAC: Require project-scoped access or general authentication
    if (filters?.projectId) {
      const rbacResult = await checkRBAC(context, filters.projectId, 'canRead');
      if (rbacResult instanceof Response) {
        return rbacResult;
      }
    } else {
      // General document search requires authentication
      requireAuth(context);
    }

    const user = context.locals.user!;
    const startTime = Date.now();

    // Build query conditions
    const conditions = [];
    conditions.push(isNull(indexedDocuments.deletedAt));

    // Apply filters
    if (filters) {
      if (filters.projectId) {
        conditions.push(eq(indexedDocuments.projectId, filters.projectId));
      }
      if (filters.documentType) {
        conditions.push(eq(indexedDocuments.documentType, filters.documentType));
      }
      if (filters.folderType) {
        conditions.push(eq(indexedDocuments.folderType, filters.folderType));
      }
      if (filters.csiDivision) {
        conditions.push(eq(indexedDocuments.csiDivision, filters.csiDivision));
      }
    }

    // Search query
    if (query) {
      const searchConditions = [
        like(indexedDocuments.fileName, `%${query}%`),
        like(indexedDocuments.extractedText, `%${query}%`),
        sql`${indexedDocuments.keywords}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedRFINumbers}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedSubmittalNumbers}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedChangeOrderNumbers}::text LIKE ${`%${query}%`}`,
        sql`${indexedDocuments.extractedDrawingNumbers}::text LIKE ${`%${query}%`}`,
      ];

      conditions.push(or(...searchConditions));
    }

    // Execute search
    const results = await db
      .select()
      .from(indexedDocuments)
      .where(and(...conditions))
      .orderBy(desc(indexedDocuments.lastProcessed))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(indexedDocuments)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count || 0);
    const searchTimeMs = Date.now() - startTime;

    // Track search
    if (query) {
      try {
        await db.insert(documentSearchHistory).values({
          userId: user.id,
          projectId: filters?.projectId || null,
          searchQuery: query,
          searchType: 'keyword',
          resultCount: results.length,
          topResultIds: results.slice(0, 10).map(r => r.id),
          searchTimeMs,
        });
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
    }

    return new Response(
      JSON.stringify({
        results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + results.length < total,
        },
        searchTimeMs,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Document search error:', error);

    return new Response(
      JSON.stringify({
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
