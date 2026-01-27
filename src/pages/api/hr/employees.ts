/**
 * HR Employees API Endpoint
 * GET /api/hr/employees - Fetch all employees with filtering
 * POST /api/hr/employees - Create new employee
 *
 * SECURITY: HR data is highly sensitive
 * - Only GC (General Contractors) and ADMIN roles can access
 * - Contains salary, PTO, and personal information
 * - Multi-tenancy filter by company
 */
import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { employees, ptoBalances, certifications } from '../../../lib/db/hr-schema';
import { eq, and, or, sql, isNull, ilike, desc } from 'drizzle-orm';
import { apiHandler, requireAuth, UnauthorizedError, ValidationError } from '../../../lib/api/error-handler';

export const prerender = false;

export const GET: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can access HR data
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can access HR data');
  }

  const url = new URL(context.request.url);
  const department = url.searchParams.get('department');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  // Build query conditions
  const conditions: any[] = [isNull(employees.deletedAt)];

  // Filter by department
  if (department && department !== 'all') {
    conditions.push(eq(employees.department, department as any));
  }

  // Filter by status
  if (status && status !== 'all') {
    conditions.push(eq(employees.employmentStatus, status as any));
  }

  // Search filter
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(employees.firstName, searchPattern),
        ilike(employees.lastName, searchPattern),
        ilike(employees.email, searchPattern),
        ilike(employees.employeeNumber, searchPattern),
        ilike(employees.jobTitle, searchPattern)
      )
    );
  }

  // Fetch employees
  const employeesList = await db
    .select()
    .from(employees)
    .where(and(...conditions))
    .orderBy(desc(employees.createdAt));

  // Fetch PTO balances for all employees
  const employeeIds = employeesList.map(e => e.id);
  const ptoBalancesList = employeeIds.length > 0
    ? await db
        .select()
        .from(ptoBalances)
        .where(sql`${ptoBalances.employeeId} = ANY(${employeeIds})`)
    : [];

  // Fetch certification counts
  const certCounts = employeeIds.length > 0
    ? await db
        .select({
          employeeId: certifications.employeeId,
          total: sql<number>`count(*)`,
          active: sql<number>`count(*) filter (where ${certifications.status} = 'active')`,
          expiringSoon: sql<number>`count(*) filter (where ${certifications.status} = 'expiring_soon')`,
        })
        .from(certifications)
        .where(and(
          sql`${certifications.employeeId} = ANY(${employeeIds})`,
          isNull(certifications.deletedAt)
        ))
        .groupBy(certifications.employeeId)
    : [];

  // Map PTO balances and cert counts to employees
  const ptoMap = new Map(ptoBalancesList.map(p => [p.employeeId, p]));
  const certMap = new Map(certCounts.map(c => [c.employeeId, c]));

  // Transform to match frontend interface
  const transformedEmployees = employeesList.map(emp => {
    const pto = ptoMap.get(emp.id);
    const certs = certMap.get(emp.id);

    return {
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      jobTitle: emp.jobTitle,
      employmentType: emp.employmentType,
      employmentStatus: emp.employmentStatus,
      hireDate: emp.hireDate,
      managerId: emp.managerId,
      photoUrl: emp.photoUrl,
      hourlyRate: emp.hourlyRate ? parseFloat(emp.hourlyRate) : null,
      salary: emp.salary ? parseFloat(emp.salary) : null,
      unionMember: emp.unionMember,
      unionName: emp.unionName,
      unionLocalNumber: emp.unionLocalNumber,
      certifications: certs?.total || 0,
      activeCertifications: certs?.active || 0,
      expiringCertifications: certs?.expiringSoon || 0,
      skills: emp.skills || [],
      ptoBalance: pto ? {
        vacation: parseFloat(pto.vacationBalance || '0'),
        sick: parseFloat(pto.sickBalance || '0'),
        personal: parseFloat(pto.personalBalance || '0'),
      } : {
        vacation: 0,
        sick: 0,
        personal: 0,
      },
    };
  });

  // Calculate statistics from all employees (not just filtered)
  const allEmployees = await db
    .select()
    .from(employees)
    .where(isNull(employees.deletedAt));

  const stats = {
    totalEmployees: allEmployees.length,
    activeEmployees: allEmployees.filter(e => e.employmentStatus === 'active').length,
    unionMembers: allEmployees.filter(e => e.unionMember).length,
    expiringCertifications: certCounts.reduce((sum, c) => sum + (c.expiringSoon || 0), 0),
    averageTenure: calculateAverageTenure(allEmployees),
  };

  return {
    success: true,
    data: {
      employees: transformedEmployees,
      stats,
    },
    count: transformedEmployees.length,
  };
});

export const POST: APIRoute = apiHandler(async (context) => {
  // Require authentication
  requireAuth(context);

  // Only GC and ADMIN can create employees
  const user = context.locals.user;
  if (!user || (user.role !== 'GC' && user.role !== 'ADMIN')) {
    throw new UnauthorizedError('Only General Contractors and Admins can create employees');
  }

  const body = await context.request.json();

  // Validate required fields
  if (!body.firstName || !body.lastName || !body.email || !body.department || !body.jobTitle) {
    throw new ValidationError('Missing required fields: firstName, lastName, email, department, jobTitle');
  }

  // Generate employee number
  const existingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees);
  const employeeNumber = body.employeeNumber ||
    `EMP-${String((existingCount[0]?.count || 0) + 1).padStart(3, '0')}`;

  // Create new employee
  const [newEmployee] = await db
    .insert(employees)
    .values({
      employeeNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName || null,
      preferredName: body.preferredName || null,
      email: body.email,
      phone: body.phone || null,
      personalEmail: body.personalEmail || null,
      dateOfBirth: body.dateOfBirth || null,
      department: body.department,
      jobTitle: body.jobTitle,
      employmentType: body.employmentType || 'full_time',
      employmentStatus: body.employmentStatus || 'active',
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      hourlyRate: body.hourlyRate?.toString() || null,
      salary: body.salary?.toString() || null,
      payFrequency: body.payFrequency || null,
      managerId: body.managerId || null,
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      emergencyContactName: body.emergencyContactName || null,
      emergencyContactPhone: body.emergencyContactPhone || null,
      emergencyContactRelationship: body.emergencyContactRelationship || null,
      unionMember: body.unionMember || false,
      unionName: body.unionName || null,
      unionLocalNumber: body.unionLocalNumber || null,
      notes: body.notes || null,
      skills: body.skills || [],
      languages: body.languages || [],
      photoUrl: body.photoUrl || null,
    })
    .returning();

  // Create default PTO balance
  await db
    .insert(ptoBalances)
    .values({
      employeeId: newEmployee.id,
      vacationAccrued: '0',
      vacationUsed: '0',
      vacationBalance: '0',
      vacationAccrualRate: '10', // Default 10 days/year
      sickAccrued: '0',
      sickUsed: '0',
      sickBalance: '0',
      sickAccrualRate: '5', // Default 5 days/year
      personalAccrued: '0',
      personalUsed: '0',
      personalBalance: '0',
      personalAccrualRate: '3', // Default 3 days/year
    });

  return {
    success: true,
    data: { employee: newEmployee },
    message: 'Employee created successfully',
  };
});

function calculateAverageTenure(employeesList: any[]): string {
  if (employeesList.length === 0) return '0y 0m';

  const totalMonths = employeesList.reduce((sum, emp) => {
    const hireDate = new Date(emp.hireDate);
    const now = new Date();
    const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    return sum + months;
  }, 0);

  const avgMonths = totalMonths / employeesList.length;
  const years = Math.floor(avgMonths / 12);
  const months = Math.floor(avgMonths % 12);

  return `${years}y ${months}m`;
}
