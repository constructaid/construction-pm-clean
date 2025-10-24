/**
 * Contact Communications API
 * View and manage communication history for a contact
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc } from 'drizzle-orm';
import { contactCommunications } from '../../../../lib/db/contacts-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * GET - Get communication history for a contact
 */
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const contactId = parseInt(params.id!);
    const communicationType = url.searchParams.get('type');
    const limit = url.searchParams.get('limit');

    let query = db
      .select()
      .from(contactCommunications)
      .where(eq(contactCommunications.contactId, contactId))
      .orderBy(desc(contactCommunications.communicatedAt));

    if (communicationType) {
      query = query.where(and(
        eq(contactCommunications.contactId, contactId),
        eq(contactCommunications.communicationType, communicationType)
      )) as any;
    }

    if (limit) {
      query = query.limit(parseInt(limit)) as any;
    }

    const communications = await query;

    return new Response(JSON.stringify(communications), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch communications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST - Log a new communication with a contact
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const contactId = parseInt(params.id!);
    const body = await request.json();

    const {
      projectId,
      communicationType,
      direction,
      subject,
      summary,
      content,
      attachments,
      relatedDocumentType,
      relatedDocumentId,
      emailId,
      emailThreadId,
      fromAddress,
      toAddresses,
      ccAddresses,
      phoneNumber,
      callDuration,
      requiresResponse,
      responseDeadline,
      communicatedAt,
      createdBy,
    } = body;

    if (!projectId || !communicationType || !direction) {
      return new Response(JSON.stringify({
        error: 'Required fields: projectId, communicationType, direction'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newCommunication = await db.insert(contactCommunications).values({
      projectId: projectId,
      contactId: contactId,
      communicationType: communicationType,
      direction: direction,
      subject: subject,
      summary: summary,
      content: content,
      attachments: attachments,
      relatedDocumentType: relatedDocumentType,
      relatedDocumentId: relatedDocumentId,
      emailId: emailId,
      emailThreadId: emailThreadId,
      fromAddress: fromAddress,
      toAddresses: toAddresses,
      ccAddresses: ccAddresses,
      phoneNumber: phoneNumber,
      callDuration: callDuration,
      requiresResponse: requiresResponse || false,
      responseDeadline: responseDeadline ? new Date(responseDeadline) : undefined,
      communicatedAt: communicatedAt ? new Date(communicatedAt) : new Date(),
      createdBy: createdBy,
    }).returning();

    return new Response(JSON.stringify(newCommunication[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error logging communication:', error);
    return new Response(JSON.stringify({ error: 'Failed to log communication' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT - Update a communication record
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const contactId = parseInt(params.id!);
    const body = await request.json();

    const { communicationId, ...updates } = body;

    if (!communicationId) {
      return new Response(JSON.stringify({ error: 'communicationId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Special handling for marking as responded
    if (updates.responded === true && !updates.respondedAt) {
      updates.respondedAt = new Date();
    }

    const updated = await db
      .update(contactCommunications)
      .set(updates)
      .where(and(
        eq(contactCommunications.id, communicationId),
        eq(contactCommunications.contactId, contactId)
      ))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Communication not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating communication:', error);
    return new Response(JSON.stringify({ error: 'Failed to update communication' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE - Delete a communication record
 */
export const DELETE: APIRoute = async ({ params, url }) => {
  try {
    const contactId = parseInt(params.id!);
    const communicationId = url.searchParams.get('communicationId');

    if (!communicationId) {
      return new Response(JSON.stringify({ error: 'communicationId query parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deleted = await db
      .delete(contactCommunications)
      .where(and(
        eq(contactCommunications.id, parseInt(communicationId)),
        eq(contactCommunications.contactId, contactId)
      ))
      .returning();

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Communication not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Communication deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting communication:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete communication' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
