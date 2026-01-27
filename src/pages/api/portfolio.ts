/**
 * Portfolio API Endpoint
 * GET /api/portfolio - Get portfolio overview with role-specific KPIs
 */
import type { APIRoute } from 'astro';
import { db, projects, tasks, changeOrders, rfis, submittals } from '../../lib/db';
import { eq, and, sql, or, inArray } from 'drizzle-orm';
import { apiHandler, requireAuth } from '../../lib/api/error-handler';
import { excludeDeleted } from '../../lib/db/soft-delete';

export const prerender = false;

export const GET: APIRoute = apiHandler(async (context) => {
  requireAuth(context);

  const user = context.locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log(`GET /api/portfolio - User: ${user.id}, Role: ${user.role}`);

  // Build query based on user role
  // Using same logic as /api/projects - filter by ownerId OR generalContractorId OR team members
  let projectsQuery;

  const baseConditions: any[] = [
    excludeDeleted(),
    eq(projects.isArchived, false) // Exclude archived projects by default
  ];

  switch (user.role) {
    case 'OWNER':
      // Owners see projects where they are the owner OR GC (since demo owner might be set up this way)
      projectsQuery = db
        .select()
        .from(projects)
        .where(and(
          or(
            eq(projects.ownerId, user.id),
            eq(projects.generalContractorId, user.id),
            sql`${projects.teamMembers}::jsonb @> ${JSON.stringify([user.id])}`
          ),
          ...baseConditions
        ));
      break;

    case 'ARCHITECT':
      // Architects see projects where they are team members or project lead
      projectsQuery = db
        .select()
        .from(projects)
        .where(and(
          or(
            sql`${projects.teamMembers}::jsonb @> ${JSON.stringify([user.id])}`,
            eq(projects.ownerId, user.id),
            eq(projects.generalContractorId, user.id)
          ),
          ...baseConditions
        ));
      break;

    case 'GC':
      // GCs see projects where they are the GC or owner or creator
      projectsQuery = db
        .select()
        .from(projects)
        .where(and(
          or(
            eq(projects.generalContractorId, user.id),
            eq(projects.createdBy, user.id),
            eq(projects.ownerId, user.id),
            sql`${projects.teamMembers}::jsonb @> ${JSON.stringify([user.id])}`
          ),
          ...baseConditions
        ));
      break;

    case 'SUBCONTRACTOR':
    case 'SUB':
      // Subcontractors see projects where they are team members
      projectsQuery = db
        .select()
        .from(projects)
        .where(and(
          or(
            sql`${projects.teamMembers}::jsonb @> ${JSON.stringify([user.id])}`,
            eq(projects.generalContractorId, user.id),
            eq(projects.ownerId, user.id)
          ),
          ...baseConditions
        ));
      break;

    case 'ADMIN':
      // Admins see all projects
      projectsQuery = db
        .select()
        .from(projects)
        .where(and(...baseConditions));
      break;

    default:
      // For any other role, show projects where user is owner, GC, or team member
      projectsQuery = db
        .select()
        .from(projects)
        .where(and(
          or(
            eq(projects.ownerId, user.id),
            eq(projects.generalContractorId, user.id),
            sql`${projects.teamMembers}::jsonb @> ${JSON.stringify([user.id])}`
          ),
          ...baseConditions
        ));
      break;
  }

  const userProjects = await projectsQuery;
  const projectIds = userProjects.map(p => p.id);

  // If no projects, return empty portfolio
  if (projectIds.length === 0) {
    return {
      projects: [],
      kpis: {
        health: { healthy: 0, atRisk: 0, critical: 0 },
        tasks: { total: 0, completed: 0, overdue: 0, dueThisWeek: 0 },
        progress: { onTrack: 0, delayed: 0, averageProgress: 0 },
        time: { onSchedule: 0, behindSchedule: 0, aheadOfSchedule: 0 },
        cost: { totalBudget: 0, totalSpent: 0, overBudget: 0, underBudget: 0 },
        workload: { activeProjects: 0, totalTasks: 0, resourceUtilization: 0 }
      },
      summary: {
        totalProjects: 0,
        totalValue: 0,
        activeProjects: 0,
        completedProjects: 0
      }
    };
  }

  // Fetch tasks for these projects
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(and(
      inArray(tasks.projectId, projectIds),
      excludeDeleted()
    ));

  // Fetch change orders
  const projectChangeOrders = await db
    .select()
    .from(changeOrders)
    .where(and(
      inArray(changeOrders.projectId, projectIds),
      excludeDeleted()
    ));

  // Fetch RFIs
  const projectRfis = await db
    .select()
    .from(rfis)
    .where(and(
      inArray(rfis.projectId, projectIds),
      excludeDeleted()
    ));

  // Fetch Submittals
  const projectSubmittals = await db
    .select()
    .from(submittals)
    .where(and(
      inArray(submittals.projectId, projectIds),
      excludeDeleted()
    ));

  // Calculate KPIs
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Health KPI
  const healthyProjects = userProjects.filter(p =>
    p.progressPercentage >= 90 ||
    (p.status === 'active' && p.progressPercentage >= 80)
  ).length;
  const atRiskProjects = userProjects.filter(p =>
    (p.status === 'active' && p.progressPercentage < 80 && p.progressPercentage >= 50) ||
    (p.estimatedCompletion && new Date(p.estimatedCompletion) < now)
  ).length;
  const criticalProjects = userProjects.filter(p =>
    (p.status === 'active' && p.progressPercentage < 50) ||
    p.status === 'on_hold'
  ).length;

  // Tasks KPI
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = projectTasks.filter(t =>
    t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
  ).length;
  const dueThisWeek = projectTasks.filter(t =>
    t.status !== 'completed' && t.dueDate &&
    new Date(t.dueDate) <= oneWeekFromNow && new Date(t.dueDate) >= now
  ).length;

  // Progress KPI
  const onTrack = userProjects.filter(p =>
    p.status === 'active' && p.progressPercentage >= 80
  ).length;
  const delayed = userProjects.filter(p =>
    p.estimatedCompletion && new Date(p.estimatedCompletion) < now && p.status !== 'completed'
  ).length;
  const averageProgress = userProjects.length > 0
    ? userProjects.reduce((sum, p) => sum + p.progressPercentage, 0) / userProjects.length
    : 0;

  // Time KPI
  const onSchedule = userProjects.filter(p =>
    p.estimatedCompletion && new Date(p.estimatedCompletion) >= now
  ).length;
  const behindSchedule = userProjects.filter(p =>
    p.estimatedCompletion && new Date(p.estimatedCompletion) < now && p.status !== 'completed'
  ).length;
  const aheadOfSchedule = userProjects.filter(p =>
    p.status === 'completed' && p.actualCompletion && p.estimatedCompletion &&
    new Date(p.actualCompletion) < new Date(p.estimatedCompletion)
  ).length;

  // Cost KPI
  const totalBudget = userProjects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
  const totalSpent = userProjects.reduce((sum, p) => sum + (p.spentBudget || 0), 0);
  const overBudget = userProjects.filter(p =>
    (p.spentBudget || 0) > (p.totalBudget || 0)
  ).length;
  const underBudget = userProjects.filter(p =>
    (p.spentBudget || 0) <= (p.totalBudget || 0)
  ).length;

  // Workload KPI
  const activeProjects = userProjects.filter(p => p.status === 'active').length;
  const activeTasks = projectTasks.filter(t =>
    t.status !== 'completed' && t.status !== 'cancelled'
  ).length;
  const resourceUtilization = totalTasks > 0
    ? (completedTasks / totalTasks) * 100
    : 0;

  // Calculate summary stats
  const totalValue = userProjects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
  const completedProjects = userProjects.filter(p => p.status === 'completed').length;

  // Role-specific additional data
  let roleSpecificData: any = {};

  switch (user.role) {
    case 'OWNER':
      roleSpecificData = {
        totalInvestment: totalBudget,
        roi: totalBudget > 0 ? ((totalValue - totalSpent) / totalBudget) * 100 : 0,
        projectsByStatus: {
          planning: userProjects.filter(p => p.status === 'planning').length,
          active: activeProjects,
          completed: completedProjects,
          onHold: userProjects.filter(p => p.status === 'on_hold').length
        }
      };
      break;

    case 'ARCHITECT':
      roleSpecificData = {
        submittalsQueue: projectSubmittals.filter(s => s.status === 'submitted').length,
        rfiResponseTime: projectRfis.length > 0
          ? projectRfis.filter(r => r.status === 'closed').length / projectRfis.length * 100
          : 0,
        projectsByPhase: {
          design: userProjects.filter(p => p.status === 'planning').length,
          construction: userProjects.filter(p => p.status === 'active').length,
          closeout: userProjects.filter(p => p.status === 'completed').length
        }
      };
      break;

    case 'GC':
      roleSpecificData = {
        changeOrderImpact: projectChangeOrders.reduce((sum, co) => sum + (co.amount || 0), 0),
        scheduleVariance: behindSchedule - aheadOfSchedule,
        budgetVariance: totalBudget - totalSpent,
        activeChangeOrders: projectChangeOrders.filter(co => co.status === 'pending').length
      };
      break;

    case 'SUBCONTRACTOR':
      roleSpecificData = {
        activeCommitments: activeTasks,
        capacityUtilization: resourceUtilization,
        paymentStatus: {
          paid: projectChangeOrders.filter(co => co.status === 'approved').length,
          pending: projectChangeOrders.filter(co => co.status === 'pending').length
        }
      };
      break;
  }

  return {
    projects: userProjects,
    kpis: {
      health: {
        healthy: healthyProjects,
        atRisk: atRiskProjects,
        critical: criticalProjects
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        dueThisWeek
      },
      progress: {
        onTrack,
        delayed,
        averageProgress: Math.round(averageProgress * 10) / 10
      },
      time: {
        onSchedule,
        behindSchedule,
        aheadOfSchedule
      },
      cost: {
        totalBudget,
        totalSpent,
        overBudget,
        underBudget
      },
      workload: {
        activeProjects,
        totalTasks: activeTasks,
        resourceUtilization: Math.round(resourceUtilization * 10) / 10
      }
    },
    summary: {
      totalProjects: userProjects.length,
      totalValue,
      activeProjects,
      completedProjects
    },
    roleSpecificData,
    tasks: projectTasks,
    changeOrders: projectChangeOrders,
    rfis: projectRfis,
    submittals: projectSubmittals
  };
});
