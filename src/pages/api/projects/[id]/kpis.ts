/**
 * Project KPIs API Endpoint
 * Returns key performance indicators for a specific project
 * GET /api/projects/[id]/kpis - Get project KPIs
 */
import type { APIRoute } from 'astro';
import { db, rfis, submittals, changeOrders } from '../../../../lib/db';
import { eq, and, sql } from 'drizzle-orm';
import {
  apiHandler,
  validateParams,
} from '../../../../lib/api/error-handler';
import { z } from 'zod';
import { checkRBAC } from '../../../../lib/middleware/rbac';
import { excludeDeleted } from '../../../../lib/db/soft-delete';

export const prerender = false;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate URL parameters
  const params = validateParams(context.params, idParamSchema);

  // RBAC Check - user must have canRead permission
  const rbacResult = await checkRBAC(context, params.id, 'canRead');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  console.log(`GET /api/projects/${params.id}/kpis`);

  // Fetch RFI stats
  const rfiStats = await db
    .select({
      total: sql<number>`cast(count(*) as integer)`,
      pending: sql<number>`cast(sum(case when ${rfis.status} = 'open' or ${rfis.status} = 'pending' then 1 else 0 end) as integer)`,
    })
    .from(rfis)
    .where(eq(rfis.projectId, params.id));

  // Fetch Submittal stats
  const submittalStats = await db
    .select({
      total: sql<number>`cast(count(*) as integer)`,
      pendingReview: sql<number>`cast(sum(case when ${submittals.status} = 'submitted' or ${submittals.status} = 'under_review' then 1 else 0 end) as integer)`,
    })
    .from(submittals)
    .where(eq(submittals.projectId, params.id));

  // Fetch Change Order stats
  const changeOrderStats = await db
    .select({
      total: sql<number>`cast(count(*) as integer)`,
      approved: sql<number>`cast(sum(case when ${changeOrders.status} = 'approved' then 1 else 0 end) as integer)`,
      pending: sql<number>`cast(sum(case when ${changeOrders.status} = 'proposed' then 1 else 0 end) as integer)`,
      totalCost: sql<number>`cast(coalesce(sum(${changeOrders.costImpact}), 0) as integer)`,
    })
    .from(changeOrders)
    .where(eq(changeOrders.projectId, params.id));

  // Get the last update times
  const lastRFIUpdate = await db
    .select({ updatedAt: rfis.updatedAt })
    .from(rfis)
    .where(eq(rfis.projectId, params.id))
    .orderBy(sql`${rfis.updatedAt} DESC NULLS LAST`)
    .limit(1);

  const lastSubmittalUpdate = await db
    .select({ updatedAt: submittals.updatedAt })
    .from(submittals)
    .where(eq(submittals.projectId, params.id))
    .orderBy(sql`${submittals.updatedAt} DESC NULLS LAST`)
    .limit(1);

  const lastChangeOrderUpdate = await db
    .select({ updatedAt: changeOrders.updatedAt })
    .from(changeOrders)
    .where(eq(changeOrders.projectId, params.id))
    .orderBy(sql`${changeOrders.updatedAt} DESC NULLS LAST`)
    .limit(1);

  return {
    kpis: {
      rfis: {
        total: rfiStats[0]?.total || 0,
        pending: rfiStats[0]?.pending || 0,
        lastUpdate: lastRFIUpdate[0]?.updatedAt || null,
      },
      submittals: {
        total: submittalStats[0]?.total || 0,
        pendingReview: submittalStats[0]?.pendingReview || 0,
        lastUpdate: lastSubmittalUpdate[0]?.updatedAt || null,
      },
      changeOrders: {
        total: changeOrderStats[0]?.total || 0,
        approved: changeOrderStats[0]?.approved || 0,
        pending: changeOrderStats[0]?.pending || 0,
        totalCost: changeOrderStats[0]?.totalCost || 0,
        lastUpdate: lastChangeOrderUpdate[0]?.updatedAt || null,
      },
      schedule: {
        status: 'On Track', // TODO: Calculate based on actual schedule data
        nextMilestone: null, // TODO: Fetch from schedule
        daysUntilMilestone: null,
      },
      paymentApplications: {
        total: 0, // TODO: Fetch from payment_applications table
        inReview: 0,
        lastUpdate: null,
      },
      safety: {
        incidents: 0, // TODO: Fetch from incident_reports table
        lastUpdate: null,
      },
    },
  };
});
