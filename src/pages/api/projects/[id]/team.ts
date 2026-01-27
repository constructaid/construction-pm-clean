/**
 * Project Team Management API Endpoint
 * GET /api/projects/[id]/team - List all team members for a project
 * POST /api/projects/[id]/team - Add a new team member
 * PUT /api/projects/[id]/team - Update team member
 * DELETE /api/projects/[id]/team - Remove team member (soft delete)
 *
 * RBAC: All endpoints use checkRBAC middleware
 * - GET requires canRead permission
 * - POST/PUT/DELETE require canManageTeam permission
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db/index';
import { projectTeamMembers, users } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkRBAC } from '../../../../lib/middleware/rbac';

export const prerender = false;

// ========================================
// GET - List all team members
// ========================================

export const GET: APIRoute = async (context) => {
  const { id } = context.params;
  const projectId = parseInt(id!);

  // Check RBAC - requires canRead permission
  const rbacResult = await checkRBAC(context, projectId, 'canRead');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  console.log('[GET /api/projects/:id/team] Fetching team for project:', projectId);

  // Fetch all active team members with user details
  const members = await db
    .select({
      id: projectTeamMembers.id,
      userId: projectTeamMembers.userId,
      teamRole: projectTeamMembers.teamRole,
      companyName: projectTeamMembers.companyName,
      contactName: projectTeamMembers.contactName,
      contactEmail: projectTeamMembers.contactEmail,
      contactPhone: projectTeamMembers.contactPhone,
      accessLevel: projectTeamMembers.accessLevel,
      canInviteOthers: projectTeamMembers.canInviteOthers,
      csiDivision: projectTeamMembers.csiDivision,
      divisionName: projectTeamMembers.divisionName,
      scopeOfWork: projectTeamMembers.scopeOfWork,
      isActive: projectTeamMembers.isActive,
      joinedAt: projectTeamMembers.joinedAt,
      // User details
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userRole: users.role,
    })
    .from(projectTeamMembers)
    .leftJoin(users, eq(projectTeamMembers.userId, users.id))
    .where(
      and(
        eq(projectTeamMembers.projectId, projectId),
        eq(projectTeamMembers.isActive, true)
      )
    )
    .orderBy(projectTeamMembers.joinedAt);

  return new Response(
    JSON.stringify({
      members,
      total: members.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

// ========================================
// POST - Add new team member
// ========================================

export const POST: APIRoute = async (context) => {
  const { id } = context.params;
  const projectId = parseInt(id!);

  // Check RBAC - requires canManageTeam permission
  const rbacResult = await checkRBAC(context, projectId, 'canManageTeam');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  const body = await context.request.json();

  console.log('[POST /api/projects/:id/team] Adding team member:', body);

  // Validate required fields
  const requiredFields = ['userId', 'teamRole', 'companyName', 'contactName', 'contactEmail'];
  for (const field of requiredFields) {
    if (!body[field]) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: `Missing required field: ${field}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Check if user is already a team member
  const existing = await db
    .select()
    .from(projectTeamMembers)
    .where(
      and(
        eq(projectTeamMembers.projectId, projectId),
        eq(projectTeamMembers.userId, body.userId),
        eq(projectTeamMembers.isActive, true)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'Conflict',
        message: 'User is already a member of this project team',
      }),
      {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Insert new team member
  const [newMember] = await db
    .insert(projectTeamMembers)
    .values({
      projectId,
      userId: body.userId,
      teamRole: body.teamRole,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || null,
      accessLevel: body.accessLevel || 'standard',
      canInviteOthers: body.canInviteOthers || false,
      csiDivision: body.csiDivision || null,
      divisionName: body.divisionName || null,
      scopeOfWork: body.scopeOfWork || null,
      isActive: true,
    })
    .returning();

  return new Response(
    JSON.stringify({
      message: 'Team member added successfully',
      member: newMember,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

// ========================================
// PUT - Update team member
// ========================================

export const PUT: APIRoute = async (context) => {
  const { id } = context.params;
  const projectId = parseInt(id!);

  // Check RBAC - requires canManageTeam permission
  const rbacResult = await checkRBAC(context, projectId, 'canManageTeam');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  const body = await context.request.json();
  const { memberId, ...updateData } = body;

  if (!memberId) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        message: 'Missing required field: memberId',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log('[PUT /api/projects/:id/team] Updating member:', memberId);

  // Check if member exists
  const [existing] = await db
    .select()
    .from(projectTeamMembers)
    .where(
      and(
        eq(projectTeamMembers.id, memberId),
        eq(projectTeamMembers.projectId, projectId),
        eq(projectTeamMembers.isActive, true)
      )
    )
    .limit(1);

  if (!existing) {
    return new Response(
      JSON.stringify({
        error: 'Not found',
        message: 'Team member not found',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Update team member
  const [updated] = await db
    .update(projectTeamMembers)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(projectTeamMembers.id, memberId))
    .returning();

  return new Response(
    JSON.stringify({
      message: 'Team member updated successfully',
      member: updated,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

// ========================================
// DELETE - Remove team member (soft delete)
// ========================================

export const DELETE: APIRoute = async (context) => {
  const { id } = context.params;
  const projectId = parseInt(id!);

  // Check RBAC - requires canManageTeam permission
  const rbacResult = await checkRBAC(context, projectId, 'canManageTeam');
  if (rbacResult instanceof Response) {
    return rbacResult;
  }

  const url = new URL(context.request.url);
  const memberId = url.searchParams.get('memberId');

  if (!memberId) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        message: 'Missing required parameter: memberId',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log('[DELETE /api/projects/:id/team] Removing member:', memberId);

  // Check if member exists
  const [existing] = await db
    .select()
    .from(projectTeamMembers)
    .where(
      and(
        eq(projectTeamMembers.id, parseInt(memberId)),
        eq(projectTeamMembers.projectId, projectId),
        eq(projectTeamMembers.isActive, true)
      )
    )
    .limit(1);

  if (!existing) {
    return new Response(
      JSON.stringify({
        error: 'Not found',
        message: 'Team member not found',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Soft delete - set isActive to false
  await db
    .update(projectTeamMembers)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(projectTeamMembers.id, parseInt(memberId)));

  return new Response(
    JSON.stringify({
      message: 'Team member removed successfully',
      note: 'Member can be restored if needed',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
