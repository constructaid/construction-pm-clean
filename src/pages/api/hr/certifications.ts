/**
 * HR Certifications API Endpoint
 * GET /api/hr/certifications - Fetch employee certifications
 * POST /api/hr/certifications - Add new certification
 * PUT /api/hr/certifications - Update a certification
 * DELETE /api/hr/certifications - Soft delete a certification
 *
 * SECURITY: Certification data is sensitive
 * - Only GC and ADMIN can access all certifications
 * - Contains employee safety certifications and compliance data
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { certifications, employees } from '../../../lib/db/hr-schema';
import { eq, and, isNull, desc, lte } from 'drizzle-orm';
import { apiHandler, requireAuth, UnauthorizedError, ValidationError, NotFoundError } from '../../../lib/api/error-handler';

export const prerender = false;

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can access HR data
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can access certification data');
  }

  const url = new URL(context.request.url);
  const employeeId = url.searchParams.get('employeeId');
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const expiringSoon = url.searchParams.get('expiringSoon'); // days threshold

  // Build query conditions
  const conditions: any[] = [isNull(certifications.deletedAt)];

  // Filter by employee
  if (employeeId) {
    conditions.push(eq(certifications.employeeId, parseInt(employeeId)));
  }

  // Filter by status
  if (status && status !== 'all') {
    conditions.push(eq(certifications.status, status as any));
  }

  // Filter by category
  if (category && category !== 'all') {
    conditions.push(eq(certifications.category, category));
  }

  // Filter by expiring soon
  if (expiringSoon) {
    const threshold = parseInt(expiringSoon);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + threshold);
    const thresholdDateStr = thresholdDate.toISOString().split('T')[0];
    conditions.push(lte(certifications.expirationDate, thresholdDateStr));
  }

  // Fetch certifications with employee info
  const certList = await db
    .select({
      id: certifications.id,
      employeeId: certifications.employeeId,
      certificationName: certifications.certificationName,
      certificationNumber: certifications.certificationNumber,
      issuingOrganization: certifications.issuingOrganization,
      category: certifications.category,
      issueDate: certifications.issueDate,
      expirationDate: certifications.expirationDate,
      status: certifications.status,
      isRequired: certifications.isRequired,
      documentUrl: certifications.documentUrl,
      notes: certifications.notes,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(certifications)
    .leftJoin(employees, eq(certifications.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(desc(certifications.createdAt));

  // Transform and calculate days until expiration
  const now = new Date();
  const transformed = certList.map(cert => {
    let daysUntilExpiration: number | null = null;
    if (cert.expirationDate) {
      const expDate = new Date(cert.expirationDate);
      const diffTime = expDate.getTime() - now.getTime();
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      id: cert.id,
      employeeId: cert.employeeId,
      employeeName: `${cert.employeeFirstName || ''} ${cert.employeeLastName || ''}`.trim() || 'Unknown',
      certificationName: cert.certificationName,
      certificationNumber: cert.certificationNumber,
      issuingOrganization: cert.issuingOrganization,
      category: cert.category,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate,
      status: cert.status,
      isRequired: cert.isRequired,
      daysUntilExpiration,
      documentUrl: cert.documentUrl,
      notes: cert.notes,
    };
  });

  // Calculate statistics from all certifications (not just filtered)
  const allCerts = await db
    .select()
    .from(certifications)
    .where(isNull(certifications.deletedAt));

  const stats = {
    totalCertifications: allCerts.length,
    active: allCerts.filter(c => c.status === 'active').length,
    expiringSoon: allCerts.filter(c => c.status === 'expiring_soon').length,
    expired: allCerts.filter(c => c.status === 'expired').length,
    expiringIn30Days: allCerts.filter(c => {
      if (!c.expirationDate) return false;
      const expDate = new Date(c.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    }).length,
    expiringIn90Days: allCerts.filter(c => {
      if (!c.expirationDate) return false;
      const expDate = new Date(c.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }).length,
  };

  return {
    success: true,
    data: {
      certifications: transformed,
      stats,
    },
    count: transformed.length,
  };
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can create certifications
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can create certifications');
  }

  const body = await context.request.json();

  // Validate required fields
  if (!body.employeeId || !body.certificationName || !body.issuingOrganization) {
    throw new ValidationError('Missing required fields: employeeId, certificationName, issuingOrganization');
  }

  // Calculate days until expiration and determine status
  let daysUntilExpiration: number | null = null;
  let status = 'active';

  if (body.expirationDate) {
    const expDate = new Date(body.expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      status = 'expired';
    } else if (daysUntilExpiration <= 90) {
      status = 'expiring_soon';
    }
  }

  // Create new certification
  const [newCert] = await db
    .insert(certifications)
    .values({
      employeeId: body.employeeId,
      certificationName: body.certificationName,
      certificationNumber: body.certificationNumber || null,
      issuingOrganization: body.issuingOrganization,
      category: body.category || 'Professional',
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      expirationDate: body.expirationDate || null,
      renewalDate: body.renewalDate || null,
      status: status as any,
      isRequired: body.isRequired || false,
      documentUrl: body.documentUrl || null,
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
      certification: {
        ...newCert,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
        daysUntilExpiration,
      }
    },
    message: 'Certification added successfully',
  };
});

export const PUT: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can update certifications
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can update certifications');
  }

  const body = await context.request.json();

  if (!body.id) {
    throw new ValidationError('Missing required field: id');
  }

  // Check if certification exists
  const [existing] = await db
    .select()
    .from(certifications)
    .where(and(
      eq(certifications.id, body.id),
      isNull(certifications.deletedAt)
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Certification', body.id);
  }

  // Build update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (body.certificationName !== undefined) updateData.certificationName = body.certificationName;
  if (body.certificationNumber !== undefined) updateData.certificationNumber = body.certificationNumber;
  if (body.issuingOrganization !== undefined) updateData.issuingOrganization = body.issuingOrganization;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.issueDate !== undefined) updateData.issueDate = body.issueDate || null;
  if (body.expirationDate !== undefined) updateData.expirationDate = body.expirationDate || null;
  if (body.renewalDate !== undefined) updateData.renewalDate = body.renewalDate || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.isRequired !== undefined) updateData.isRequired = body.isRequired;
  if (body.documentUrl !== undefined) updateData.documentUrl = body.documentUrl;
  if (body.notes !== undefined) updateData.notes = body.notes;

  // Update certification
  const [updated] = await db
    .update(certifications)
    .set(updateData)
    .where(eq(certifications.id, body.id))
    .returning();

  return {
    success: true,
    data: { certification: updated },
    message: 'Certification updated successfully',
  };
});

export const DELETE: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can delete certifications
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can delete certifications');
  }

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    throw new ValidationError('Missing required parameter: id');
  }

  // Check if certification exists
  const [existing] = await db
    .select()
    .from(certifications)
    .where(and(
      eq(certifications.id, parseInt(id)),
      isNull(certifications.deletedAt)
    ))
    .limit(1);

  if (!existing) {
    throw new NotFoundError('Certification', id);
  }

  // Soft delete
  await db
    .update(certifications)
    .set({
      deletedAt: new Date(),
      deletedBy: user.id,
    })
    .where(eq(certifications.id, parseInt(id)));

  return {
    success: true,
    message: 'Certification deleted successfully',
  };
});
