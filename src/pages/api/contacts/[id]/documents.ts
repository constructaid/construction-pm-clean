/**
 * Contact Documents API
 * Upload and manage documents for contacts (insurance, W-9, licenses, etc.)
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { contactDocuments } from '../../../../lib/db/contacts-schema';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

/**
 * GET - List documents for a contact
 */
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const contactId = parseInt(params.id!);
    const documentType = url.searchParams.get('type');

    let query = db.select().from(contactDocuments).where(eq(contactDocuments.contactId, contactId));

    if (documentType) {
      query = query.where(and(
        eq(contactDocuments.contactId, contactId),
        eq(contactDocuments.documentType, documentType)
      )) as any;
    }

    const documents = await query;

    return new Response(JSON.stringify(documents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching contact documents:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch documents' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST - Upload/Add a document to a contact
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const contactId = parseInt(params.id!);
    const body = await request.json();

    const {
      projectId,
      documentType,
      documentName,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      documentNumber,
      issueDate,
      expirationDate,
      notes,
      daysBeforeExpiration = 30,
      createdBy,
    } = body;

    if (!documentType || !documentName || !fileUrl || !fileName) {
      return new Response(JSON.stringify({
        error: 'Required fields: documentType, documentName, fileUrl, fileName'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newDocument = await db.insert(contactDocuments).values({
      contactId: contactId,
      projectId: projectId,
      documentType: documentType,
      documentName: documentName,
      fileUrl: fileUrl,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      documentNumber: documentNumber,
      issueDate: issueDate ? new Date(issueDate) : undefined,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      status: 'active',
      isVerified: false,
      notes: notes,
      daysBeforeExpiration: daysBeforeExpiration,
      expirationNotificationSent: false,
      createdBy: createdBy,
    }).returning();

    return new Response(JSON.stringify(newDocument[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT - Update a document
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const contactId = parseInt(params.id!);
    const body = await request.json();

    const { documentId, ...updates } = body;

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updated = await db
      .update(contactDocuments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contactDocuments.id, documentId),
        eq(contactDocuments.contactId, contactId)
      ))
      .returning();

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return new Response(JSON.stringify({ error: 'Failed to update document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE - Delete a document
 */
export const DELETE: APIRoute = async ({ params, url }) => {
  try {
    const contactId = parseInt(params.id!);
    const documentId = url.searchParams.get('documentId');

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId query parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deleted = await db
      .delete(contactDocuments)
      .where(and(
        eq(contactDocuments.id, parseInt(documentId)),
        eq(contactDocuments.contactId, contactId)
      ))
      .returning();

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Document deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete document' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
