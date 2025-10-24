/**
 * Email Webhook
 * Automatically creates contacts when new emails are received
 * Can be triggered by email services like SendGrid, Mailgun, etc.
 */

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { contacts, divisionContacts, contactCommunications } from '../../../lib/db/contacts-schema';
import { taskEmails } from '../../../lib/db/email-schema';
import { extractContactFromEmail } from '../../../lib/services/contact-extraction';

const databaseUrl = import.meta.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sqlClient = neon(databaseUrl);
const db = drizzle(sqlClient);

const divisionMappings: Record<string, string> = {
  '02': 'DEMO',
  '03': 'CONCRETE',
  '04': 'MASONRY',
  '05': 'METALS',
  '06': 'CARPENTRY',
  '07': 'THERMAL AND MOISTURE PROTECTION',
  '08': 'OPENINGS',
  '09': 'FINISHES',
  '10': 'SPECIALITIES',
  '12': 'FURNISHINGS',
  '22': 'PLUMBING',
  '23': 'HVAC',
  '26': 'ELECTRICAL VBC',
  '28': 'FIRE ALARM',
  '31': 'EARTHWORK',
  '32': 'EXTERIOR IMPROVEMENTS',
};

/**
 * POST - Receive email webhook and auto-create/update contact
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      projectId,
      from,
      to,
      cc,
      subject,
      body: emailBody,
      emailId,
      threadId,
      signature,
    } = body;

    if (!projectId || !from) {
      return new Response(JSON.stringify({ error: 'projectId and from are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract contact information from email
    const extractedContact = extractContactFromEmail({
      from,
      subject: subject || '',
      body: emailBody || '',
      signature: signature || '',
    });

    if (!extractedContact || !extractedContact.email) {
      // No valid contact found, but still log the email
      return new Response(JSON.stringify({
        success: true,
        message: 'Email received but no contact information found',
        contactCreated: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if contact already exists
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.projectId, projectId),
        eq(contacts.email, extractedContact.email)
      ))
      .limit(1);

    let contactId: number;
    let contactCreated = false;
    let contactUpdated = false;

    if (existingContacts.length > 0) {
      // Update existing contact
      const existing = existingContacts[0];
      contactId = existing.id;

      await db
        .update(contacts)
        .set({
          phoneMain: extractedContact.phoneMain || existing.phoneMain,
          phoneMobile: extractedContact.phoneMobile || existing.phoneMobile,
          title: extractedContact.title || existing.title,
          company: extractedContact.company || existing.company,
          address: extractedContact.address || existing.address,
          city: extractedContact.city || existing.city,
          state: extractedContact.state || existing.state,
          zipCode: extractedContact.zipCode || existing.zipCode,
          trade: extractedContact.trade || existing.trade,
          lastContactDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contactId));

      contactUpdated = true;
    } else {
      // Create new contact
      const newContact = await db.insert(contacts).values({
        projectId: projectId,
        contactType: 'subcontractor', // Default
        firstName: extractedContact.firstName,
        lastName: extractedContact.lastName,
        fullName: extractedContact.fullName || extractedContact.email,
        company: extractedContact.company || 'Unknown',
        email: extractedContact.email,
        phoneMain: extractedContact.phoneMain,
        phoneMobile: extractedContact.phoneMobile,
        title: extractedContact.title,
        trade: extractedContact.trade,
        address: extractedContact.address,
        city: extractedContact.city,
        state: extractedContact.state,
        zipCode: extractedContact.zipCode,
        primaryDivision: extractedContact.csiDivision,
        csiDivisions: extractedContact.csiDivision ? [extractedContact.csiDivision] : [],
        status: 'active',
        isVerified: false,
        sourceType: 'email',
        extractedBy: 'ai',
        lastContactDate: new Date(),
      }).returning();

      contactId = newContact[0].id;
      contactCreated = true;

      // Create division association if we identified a division
      if (extractedContact.csiDivision) {
        const divisionName = divisionMappings[extractedContact.csiDivision] || extractedContact.csiDivision;

        await db.insert(divisionContacts).values({
          projectId: projectId,
          contactId: contactId,
          csiDivision: extractedContact.csiDivision,
          divisionName: divisionName,
          folderPath: `05 Subcontractor-Suppliers/DIV ${extractedContact.csiDivision} ${divisionName}`,
          role: 'primary',
          isActive: true,
        });
      }
    }

    // Log the communication
    await db.insert(contactCommunications).values({
      projectId: projectId,
      contactId: contactId,
      communicationType: 'email',
      direction: 'inbound',
      subject: subject || '',
      content: emailBody || '',
      emailId: emailId,
      emailThreadId: threadId,
      fromAddress: from,
      toAddresses: Array.isArray(to) ? to : [to],
      ccAddresses: Array.isArray(cc) ? cc : (cc ? [cc] : []),
      communicatedAt: new Date(),
    });

    // Also store in taskEmails if provided with task context
    if (emailId) {
      try {
        await db.insert(taskEmails).values({
          emailId: emailId,
          projectId: projectId,
          fromAddress: from,
          subject: subject || '',
          parsedBy: 'ai',
          confidence: extractedContact.confidence,
          aiExtractedData: extractedContact as any,
        });
      } catch (err) {
        // Email might already exist, ignore
        console.log('Email already logged in taskEmails:', err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      contactCreated,
      contactUpdated,
      contactId,
      extractedData: extractedContact,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process email',
      details: String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
