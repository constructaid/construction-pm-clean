/**
 * Dashboard Statistics API Endpoint - PostgreSQL Version
 * GET /api/dashboard/stats - Get dashboard statistics for a user
 *
 * UPDATED: Now using P0 fixes:
 * - Error handling wrapper (apiHandler)
 * - Input validation (Zod schemas)
 * - Rate limiting
 * - Migrated from MongoDB to PostgreSQL
 */
import type { APIRoute } from 'astro';
import { db, projects, tasks } from '../../../lib/db';
import { eq, and, inArray, gte, lt, sql, ne } from 'drizzle-orm';
import {
  apiHandler,
  validateQuery,
  checkRateLimit,
} from '../../../lib/api/error-handler';
import { excludeDeleted } from '../../../lib/db/soft-delete';
import { z } from 'zod';

export const prerender = false;

// ========================================
// GET - Fetch dashboard statistics
// ========================================

// Query schema for GET
const dashboardStatsQuerySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
});

export const GET: APIRoute = apiHandler(async (context) => {
  // Validate query parameters
  const query = validateQuery(context, dashboardStatsQuerySchema);

  // Rate limiting (200 requests per minute)
  const rateLimitKey = `dashboard-stats-${context.clientAddress}`;
  checkRateLimit(rateLimitKey, 200, 60000);

  console.log('GET /api/dashboard/stats - Fetching statistics');

  // Calculate date ranges
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Fetch active projects count
  const activeProjectsConditions = [
    excludeDeleted(),
    inArray(projects.status, ['in_progress', 'pre_construction', 'bidding'] as any[])
  ];

  const [{ count: activeProjectsCount }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(projects)
    .where(and(...activeProjectsConditions));

  // Fetch new projects this month
  const newProjectsConditions = [
    excludeDeleted(),
    gte(projects.createdAt, startOfMonth)
  ];

  const [{ count: newProjectsThisMonth }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(projects)
    .where(and(...newProjectsConditions));

  // Fetch tasks due this week (non-deleted, non-completed)
  const tasksDueConditions = [
    excludeDeleted(),
    ne(tasks.status, 'completed'),
    gte(tasks.dueDate, today),
    lt(tasks.dueDate, nextWeek)
  ];

  const [{ count: tasksDueThisWeek }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tasks)
    .where(and(...tasksDueConditions));

  // Fetch overdue tasks
  const overdueConditions = [
    excludeDeleted(),
    ne(tasks.status, 'completed'),
    lt(tasks.dueDate, today)
  ];

  const [{ count: overdueTasks }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tasks)
    .where(and(...overdueConditions));

  // Fetch total budget across all projects
  const budgetQuery = await db
    .select({
      totalBudget: sql<number>`coalesce(sum(${projects.totalBudget}), 0)`,
      totalSpent: sql<number>`coalesce(sum(${projects.spentBudget}), 0)`,
      totalRemaining: sql<number>`coalesce(sum(${projects.remainingBudget}), 0)`,
    })
    .from(projects)
    .where(excludeDeleted());

  const budgetStats = budgetQuery[0] || {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0
  };

  // Calculate budget utilization percentage
  const budgetUtilization = budgetStats.totalBudget > 0
    ? Math.round((budgetStats.totalSpent / budgetStats.totalBudget) * 100)
    : 0;

  // Get project completion statistics
  const completionStats = await db
    .select({
      avgProgress: sql<number>`coalesce(avg(${projects.progressPercentage}), 0)`,
      completedProjects: sql<number>`cast(count(*) filter (where ${projects.status} = 'completed') as integer)`,
      onHoldProjects: sql<number>`cast(count(*) filter (where ${projects.status} = 'on_hold') as integer)`,
    })
    .from(projects)
    .where(excludeDeleted());

  const completion = completionStats[0] || {
    avgProgress: 0,
    completedProjects: 0,
    onHoldProjects: 0,
  };

  // Get task priority distribution
  const tasksByPriority = await db
    .select({
      priority: tasks.priority,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(tasks)
    .where(and(excludeDeleted(), ne(tasks.status, 'completed')))
    .groupBy(tasks.priority);

  const priorityDistribution = {
    urgent: tasksByPriority.find(t => t.priority === 'urgent')?.count || 0,
    high: tasksByPriority.find(t => t.priority === 'high')?.count || 0,
    medium: tasksByPriority.find(t => t.priority === 'medium')?.count || 0,
    low: tasksByPriority.find(t => t.priority === 'low')?.count || 0,
  };

  // Get recent activity count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ count: recentActivityCount }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tasks)
    .where(and(
      excludeDeleted(),
      gte(tasks.createdAt, sevenDaysAgo)
    ));

  console.log('Dashboard statistics fetched successfully');

  return {
    stats: {
      activeProjects: {
        count: activeProjectsCount,
        newThisMonth: newProjectsThisMonth,
        completed: completion.completedProjects,
        onHold: completion.onHoldProjects,
      },
      tasks: {
        dueThisWeek: tasksDueThisWeek,
        overdue: overdueTasks,
        byPriority: priorityDistribution,
      },
      budget: {
        total: budgetStats.totalBudget,
        spent: budgetStats.totalSpent,
        remaining: budgetStats.totalRemaining,
        utilizationPercentage: budgetUtilization,
      },
      progress: {
        averageCompletion: Math.round(completion.avgProgress),
      },
      activity: {
        recentTasksCreated: recentActivityCount,
      },
    },
  };
});
