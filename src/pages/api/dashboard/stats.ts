/**
 * Dashboard Statistics API
 * GET /api/dashboard/stats - Get dashboard statistics for a user
 */
import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../../lib/db/mongodb';
import { TaskStatus, TaskPriority } from '../../../lib/db/schemas/Task';
import { ProjectStatus } from '../../../lib/db/schemas/Project';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const projectsCollection = db.collection('projects');
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Fetch active projects count
    const activeProjectsCount = await projectsCollection.countDocuments({
      $or: [
        { 'team.generalContractor': userId },
        { 'team.owner': userId },
        { 'team.architects': userId },
        { 'team.subcontractors.userId': userId }
      ],
      status: {
        $in: [
          ProjectStatus.IN_PROGRESS,
          ProjectStatus.PRE_CONSTRUCTION,
          ProjectStatus.BIDDING
        ]
      }
    });

    // Fetch tasks due this week
    const tasksDueThisWeek = await tasksCollection.countDocuments({
      assignedTo: userId,
      status: { $ne: TaskStatus.COMPLETED },
      dueDate: {
        $gte: today,
        $lt: nextWeek
      }
    });

    // Fetch overdue tasks
    const overdueTasks = await tasksCollection.countDocuments({
      assignedTo: userId,
      status: { $ne: TaskStatus.COMPLETED },
      dueDate: { $lt: today }
    });

    // Fetch total budget across all projects
    const projectsWithBudgets = await projectsCollection.aggregate([
      {
        $match: {
          $or: [
            { 'team.generalContractor': userId },
            { 'team.owner': userId },
            { 'team.architects': userId },
            { 'team.subcontractors.userId': userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget.total' },
          totalSpent: { $sum: '$budget.spent' },
          totalRemaining: { $sum: '$budget.remaining' }
        }
      }
    ]).toArray();

    const budgetStats = projectsWithBudgets[0] || {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0
    };

    // Calculate budget utilization percentage
    const budgetUtilization = budgetStats.totalBudget > 0
      ? Math.round((budgetStats.totalSpent / budgetStats.totalBudget) * 100)
      : 0;

    // Fetch team member count
    const teamMembers = await projectsCollection.aggregate([
      {
        $match: {
          $or: [
            { 'team.generalContractor': userId },
            { 'team.owner': userId }
          ]
        }
      },
      {
        $project: {
          members: {
            $concatArrays: [
              { $ifNull: ['$team.architects', []] },
              { $ifNull: ['$team.subcontractors', []] },
              { $ifNull: ['$team.consultants', []] }
            ]
          }
        }
      },
      {
        $unwind: {
          path: '$members',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $group: {
          _id: '$members.userId'
        }
      },
      {
        $count: 'totalMembers'
      }
    ]).toArray();

    const teamMemberCount = teamMembers[0]?.totalMembers || 0;

    // Get new projects this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newProjectsThisMonth = await projectsCollection.countDocuments({
      $or: [
        { 'team.generalContractor': userId },
        { 'team.owner': userId }
      ],
      createdAt: { $gte: startOfMonth }
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          activeProjects: {
            count: activeProjectsCount,
            newThisMonth: newProjectsThisMonth
          },
          tasksDueThisWeek: {
            count: tasksDueThisWeek,
            overdue: overdueTasks
          },
          budget: {
            total: budgetStats.totalBudget,
            spent: budgetStats.totalSpent,
            remaining: budgetStats.totalRemaining,
            utilizationPercentage: budgetUtilization
          },
          teamMembers: {
            count: teamMemberCount
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
