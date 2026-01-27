/**
 * HR PTO API Endpoint
 * GET /api/hr/pto - Fetch PTO requests with filtering
 * POST /api/hr/pto - Create new PTO request
 * PUT /api/hr/pto - Update PTO request (approve/deny)
 *
 * SECURITY: PTO data is sensitive
 * - Only GC and ADMIN can access all PTO requests
 * - Employees can only view their own PTO requests (future enhancement)
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { ptoRequests, employees, ptoBalances } from '../../../lib/db/hr-schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { apiHandler, requireAuth, UnauthorizedError, ValidationError, NotFoundError } from '../../../lib/api/error-handler';

export const prerender = false;

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can access HR data
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can access PTO data');
  }

  const url = new URL(context.request.url);
  const employeeId = url.searchParams.get('employeeId');
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');

  // Build query conditions
  const conditions: any[] = [isNull(ptoRequests.deletedAt)];

  // Filter by employee
  if (employeeId) {
    conditions.push(eq(ptoRequests.employeeId, parseInt(employeeId)));
  }

  // Filter by status
  if (status && status !== 'all') {
    conditions.push(eq(ptoRequests.status, status as any));
  }

  // Filter by type
  if (type && type !== 'all') {
    conditions.push(eq(ptoRequests.type, type as any));
  }

  // Fetch PTO requests with employee info
  const requestsList = await db
    .select({
      id: ptoRequests.id,
      employeeId: ptoRequests.employeeId,
      type: ptoRequests.type,
      status: ptoRequests.status,
      startDate: ptoRequests.startDate,
      endDate: ptoRequests.endDate,
      totalDays: ptoRequests.totalDays,
      reason: ptoRequests.reason,
      requestedAt: ptoRequests.requestedAt,
      reviewedBy: ptoRequests.reviewedBy,
      reviewedAt: ptoRequests.reviewedAt,
      reviewNotes: ptoRequests.reviewNotes,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(ptoRequests)
    .leftJoin(employees, eq(ptoRequests.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(desc(ptoRequests.requestedAt));

  // Transform to match frontend interface
  const transformed = requestsList.map(req => ({
    id: req.id,
    employeeId: req.employeeId,
    employeeName: `${req.employeeFirstName || ''} ${req.employeeLastName || ''}`.trim() || 'Unknown',
    type: req.type,
    status: req.status,
    startDate: req.startDate,
    endDate: req.endDate,
    totalDays: req.totalDays ? parseFloat(req.totalDays) : 0,
    reason: req.reason,
    requestedAt: req.requestedAt?.toISOString() || null,
    reviewedBy: req.reviewedBy,
    reviewedAt: req.reviewedAt?.toISOString() || null,
    reviewNotes: req.reviewNotes,
  }));

  // Calculate statistics from all requests (not just filtered)
  const allRequests = await db
    .select()
    .from(ptoRequests)
    .where(isNull(ptoRequests.deletedAt));

  const now = new Date();
  const stats = {
    totalRequests: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    denied: allRequests.filter(r => r.status === 'denied').length,
    upcomingPTO: allRequests.filter(r =>
      r.status === 'approved' && r.startDate && new Date(r.startDate) > now
    ).length,
  };

  return {
    success: true,
    data: {
      requests: transformed,
      stats,
    },
    count: transformed.length,
  };
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  const user = context.locals.user;
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  const body = await context.request.json();

  // Validate required fields
  if (!body.employeeId || !body.type || !body.startDate || !body.endDate) {
    throw new ValidationError('Missing required fields: employeeId, type, startDate, endDate');
  }

  // Calculate total days
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Create new PTO request
  const [newRequest] = await db
    .insert(ptoRequests)
    .values({
      employeeId: body.employeeId,
      type: body.type,
      status: 'pending',
      startDate: body.startDate,
      endDate: body.endDate,
      totalDays: diffDays.toString(),
      reason: body.reason || null,
      notes: body.notes || null,
    })
    .returning();

  // Get employee name for response
  const [employee] = await db
    .select({ firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(eq(employees.id, body.employeeId))
    .limit(1);

  return {
    success: true,
    data: {
      request: {
        ...newRequest,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        totalDays: diffDays,
        requestedAt: newRequest.requestedAt?.toISOString(),
      }
    },
    message: 'PTO request submitted successfully',
  };
});

export const PUT: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can approve/deny PTO
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can approve/deny PTO requests');
  }

  const body = await context.request.json();

  if (!body.id || !body.status) {
    throw new ValidationError('Missing required fields: id, status');
  }

  // Find the request
  const [existing] = await db
    .select()
    .from(ptoRequests)
    .where(and(
      eq(ptoRequests.id, body.id),
      isNull(ptoRequests.deletedAt)
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('PTO request', body.id);
  }

  // Update the request
  const [updated] = await db
    .update(ptoRequests)
    .set({
      status: body.status,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNotes: body.reviewNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(ptoRequests.id, body.id))
    .returning();

  // If approved, update PTO balance
  if (body.status === 'approved' && existing.status === 'pending') {
    const totalDays = parseFloat(existing.totalDays || '0');
    const ptoType = existing.type;

    // Update balance based on PTO type
    if (ptoType === 'vacation') {
      await db
        .update(ptoBalances)
        .set({
          vacationUsed: sql`${ptoBalances.vacationUsed} + ${totalDays}`,
          vacationBalance: sql`${ptoBalances.vacationBalance} - ${totalDays}`,
          updatedAt: new Date(),
        })
        .where(eq(ptoBalances.employeeId, existing.employeeId));
    } else if (ptoType === 'sick') {
      await db
        .update(ptoBalances)
        .set({
          sickUsed: sql`${ptoBalances.sickUsed} + ${totalDays}`,
          sickBalance: sql`${ptoBalances.sickBalance} - ${totalDays}`,
          updatedAt: new Date(),
        })
        .where(eq(ptoBalances.employeeId, existing.employeeId));
    } else if (ptoType === 'personal') {
      await db
        .update(ptoBalances)
        .set({
          personalUsed: sql`${ptoBalances.personalUsed} + ${totalDays}`,
          personalBalance: sql`${ptoBalances.personalBalance} - ${totalDays}`,
          updatedAt: new Date(),
        })
        .where(eq(ptoBalances.employeeId, existing.employeeId));
    }
  }

  // Get employee name
  const [employee] = await db
    .select({ firstName: employees.firstName, lastName: employees.lastName })
    .from(employees)
    .where(eq(employees.id, existing.employeeId))
    .limit(1);

  return {
    success: true,
    data: {
      request: {
        ...updated,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        totalDays: parseFloat(updated.totalDays || '0'),
        requestedAt: updated.requestedAt?.toISOString(),
        reviewedAt: updated.reviewedAt?.toISOString(),
      }
    },
    message: `PTO request ${body.status}`,
  };
});
