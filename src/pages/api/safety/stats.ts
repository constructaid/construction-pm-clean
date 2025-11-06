/**
 * Safety Statistics API Endpoint
 * Returns dashboard statistics for DISD safety compliance
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import {
  safetyMeetings,
  safetyInspections,
  incidentReports,
  workPermits,
  safetyTraining,
  workerCertifications,
} from '../../../lib/db/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';

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

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Last Sunday

    // Get safety meetings stats
    const meetingsThisMonth = await db
      .select({ count: count() })
      .from(safetyMeetings)
      .where(
        and(
          eq(safetyMeetings.projectId, projectId),
          gte(safetyMeetings.meetingDate, startOfMonth)
        )
      );

    const totalMeetings = await db
      .select({ count: count() })
      .from(safetyMeetings)
      .where(eq(safetyMeetings.projectId, projectId));

    // Get next scheduled meeting
    const nextMeeting = await db
      .select()
      .from(safetyMeetings)
      .where(
        and(
          eq(safetyMeetings.projectId, projectId),
          gte(safetyMeetings.meetingDate, now)
        )
      )
      .orderBy(safetyMeetings.meetingDate)
      .limit(1);

    // Get inspections stats
    const inspectionsThisWeek = await db
      .select({ count: count() })
      .from(safetyInspections)
      .where(
        and(
          eq(safetyInspections.projectId, projectId),
          gte(safetyInspections.inspectionDate, startOfWeek)
        )
      );

    const totalInspections = await db
      .select({ count: count() })
      .from(safetyInspections)
      .where(eq(safetyInspections.projectId, projectId));

    // Count open violations (inspections with requiresFollowUp = true and followUpCompleted = false)
    const openViolations = await db
      .select({ count: count() })
      .from(safetyInspections)
      .where(
        and(
          eq(safetyInspections.projectId, projectId),
          eq(safetyInspections.requiresFollowUp, true),
          eq(safetyInspections.followUpCompleted, false)
        )
      );

    // Get incidents stats
    const totalIncidents = await db
      .select({ count: count() })
      .from(incidentReports)
      .where(eq(incidentReports.projectId, projectId));

    const recordableIncidents = await db
      .select({ count: count() })
      .from(incidentReports)
      .where(
        and(
          eq(incidentReports.projectId, projectId),
          eq(incidentReports.isOSHARecordable, true)
        )
      );

    // Get last incident date to calculate days since
    const lastIncident = await db
      .select()
      .from(incidentReports)
      .where(eq(incidentReports.projectId, projectId))
      .orderBy(sql`${incidentReports.incidentDate} DESC`)
      .limit(1);

    let daysSinceLastIncident = 0;
    if (lastIncident.length > 0 && lastIncident[0].incidentDate) {
      const lastDate = new Date(lastIncident[0].incidentDate);
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      daysSinceLastIncident = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // No incidents recorded, show days since project start or a large number
      daysSinceLastIncident = 999;
    }

    // Get work permits stats
    const activePermits = await db
      .select({ count: count() })
      .from(workPermits)
      .where(
        and(
          eq(workPermits.projectId, projectId),
          eq(workPermits.isActive, true)
        )
      );

    const pendingPermits = await db
      .select({ count: count() })
      .from(workPermits)
      .where(
        and(
          eq(workPermits.projectId, projectId),
          eq(workPermits.status, 'pending')
        )
      );

    const totalPermits = await db
      .select({ count: count() })
      .from(workPermits)
      .where(eq(workPermits.projectId, projectId));

    // Get training stats
    const scheduledTraining = await db
      .select({ count: count() })
      .from(safetyTraining)
      .where(
        and(
          eq(safetyTraining.projectId, projectId),
          eq(safetyTraining.status, 'scheduled')
        )
      );

    const completedTraining = await db
      .select({ count: count() })
      .from(safetyTraining)
      .where(
        and(
          eq(safetyTraining.projectId, projectId),
          eq(safetyTraining.status, 'completed')
        )
      );

    // Training expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const expiringTraining = await db
      .select({ count: count() })
      .from(safetyTraining)
      .where(
        and(
          eq(safetyTraining.projectId, projectId),
          gte(safetyTraining.trainingDate, now),
          lte(safetyTraining.trainingDate, thirtyDaysFromNow)
        )
      );

    // Get certifications stats
    const activeCertifications = await db
      .select({ count: count() })
      .from(workerCertifications)
      .where(
        and(
          eq(workerCertifications.projectId, projectId),
          eq(workerCertifications.isActive, true)
        )
      );

    const expiredCertifications = await db
      .select({ count: count() })
      .from(workerCertifications)
      .where(
        and(
          eq(workerCertifications.projectId, projectId),
          eq(workerCertifications.status, 'expired')
        )
      );

    // Certifications expiring in next 30 days
    const expiringCertifications = await db
      .select({ count: count() })
      .from(workerCertifications)
      .where(
        and(
          eq(workerCertifications.projectId, projectId),
          eq(workerCertifications.isActive, true),
          gte(workerCertifications.badgeExpirationDate, now),
          lte(workerCertifications.badgeExpirationDate, thirtyDaysFromNow)
        )
      );

    // Format next meeting date
    let nextMeetingDate = null;
    if (nextMeeting.length > 0 && nextMeeting[0].meetingDate) {
      nextMeetingDate = new Date(nextMeeting[0].meetingDate).toLocaleDateString();
    }

    const stats = {
      meetings: {
        total: totalMeetings[0].count || 0,
        thisMonth: meetingsThisMonth[0].count || 0,
        nextDue: nextMeetingDate,
      },
      inspections: {
        total: totalInspections[0].count || 0,
        thisWeek: inspectionsThisWeek[0].count || 0,
        violations: openViolations[0].count || 0,
      },
      incidents: {
        total: totalIncidents[0].count || 0,
        recordable: recordableIncidents[0].count || 0,
        daysSinceLastIncident,
      },
      permits: {
        active: activePermits[0].count || 0,
        pending: pendingPermits[0].count || 0,
        total: totalPermits[0].count || 0,
      },
      training: {
        scheduled: scheduledTraining[0].count || 0,
        completed: completedTraining[0].count || 0,
        expiring: expiringTraining[0].count || 0,
      },
      certifications: {
        active: activeCertifications[0].count || 0,
        expiring: expiringCertifications[0].count || 0,
        expired: expiredCertifications[0].count || 0,
      },
    };

    return new Response(
      JSON.stringify({ success: true, stats }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching safety stats:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch safety statistics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
