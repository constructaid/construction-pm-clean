/**
 * Safety Meetings API Endpoint
 * CRUD operations for safety meetings (toolbox, committee, etc.)
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { safetyMeetings } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const projectId = parseInt(url.searchParams.get('projectId') || '0');

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const meetings = await db
      .select()
      .from(safetyMeetings)
      .where(eq(safetyMeetings.projectId, projectId))
      .orderBy(desc(safetyMeetings.meetingDate));

    return new Response(
      JSON.stringify({ success: true, meetings }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching safety meetings:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch safety meetings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.projectId || !data.meetingType || !data.meetingDate || !data.topic || !data.discussion) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate toolbox meeting duration (minimum 15 minutes per DISD)
    if (data.meetingType === 'toolbox' && data.duration < 15) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Toolbox meetings must be at least 15 minutes (DISD requirement)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert the meeting
    const [meeting] = await db
      .insert(safetyMeetings)
      .values({
        projectId: data.projectId,
        meetingNumber: data.meetingNumber,
        meetingType: data.meetingType,
        meetingDate: new Date(data.meetingDate),
        duration: data.duration || 15,
        topic: data.topic,
        location: data.location || null,
        agenda: data.agenda || null,
        discussion: data.discussion,
        attendees: JSON.stringify(data.attendees || []),
        actionItems: JSON.stringify(data.actionItems || []),
        conductorName: data.conductorName || null,
        attendanceCount: data.attendanceCount || 0,
        isMandatory: data.isMandatory !== false,
        attachments: JSON.stringify(data.attachments || []),
        signInSheet: data.signInSheet || null,
        createdBy: data.createdBy || 1, // TODO: Get from session
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, meeting }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating safety meeting:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create safety meeting' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meeting ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [meeting] = await db
      .update(safetyMeetings)
      .set({
        ...updates,
        meetingDate: updates.meetingDate ? new Date(updates.meetingDate) : undefined,
        attendees: updates.attendees ? JSON.stringify(updates.attendees) : undefined,
        actionItems: updates.actionItems ? JSON.stringify(updates.actionItems) : undefined,
        attachments: updates.attachments ? JSON.stringify(updates.attachments) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(safetyMeetings.id, id))
      .returning();

    if (!meeting) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meeting not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, meeting }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating safety meeting:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update safety meeting' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0');

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meeting ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db
      .delete(safetyMeetings)
      .where(eq(safetyMeetings.id, id));

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting safety meeting:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to delete safety meeting' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
