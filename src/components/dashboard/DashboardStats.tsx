/**
 * Dashboard Statistics Component
 * Displays real-time statistics for the dashboard
 */
import { createSignal, createEffect, Show } from 'solid-js';

interface DashboardStatsProps {
  userId: string;
}

interface Stats {
  activeProjects: {
    count: number;
    newThisMonth: number;
  };
  tasksDueThisWeek: {
    count: number;
    overdue: number;
  };
  budget: {
    total: number;
    spent: number;
    remaining: number;
    utilizationPercentage: number;
  };
  teamMembers: {
    count: number;
  };
}

export default function DashboardStats(props: DashboardStatsProps) {
  const [stats, setStats] = createSignal<Stats | null>(null);
  const [loading, setLoading] = createSignal(true);

  // Fetch stats on component mount
  createEffect(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?userId=${props.userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      // Fallback to default stats
      setStats({
        activeProjects: { count: 0, newThisMonth: 0 },
        tasksDueThisWeek: { count: 0, overdue: 0 },
        budget: { total: 0, spent: 0, remaining: 0, utilizationPercentage: 0 },
        teamMembers: { count: 0 }
      });
    } finally {
      setLoading(false);
    }
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Active Projects */}
      <div class="bg-white rounded-lg p-6 shadow-ca-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-text-secondary">Active Projects</h3>
          <svg class="w-5 h-5 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <Show when={!loading()} fallback={
          <div class="animate-pulse">
            <div class="h-10 bg-gray-200 rounded w-16 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        }>
          <p class="text-3xl font-bold text-text-primary">{stats()?.activeProjects.count || 0}</p>
          <Show
            when={(stats()?.activeProjects.newThisMonth || 0) > 0}
            fallback={<p class="text-xs text-text-secondary mt-1">No new projects</p>}
          >
            <p class="text-xs text-green-600 mt-1">
              ↑ {stats()?.activeProjects.newThisMonth} new this month
            </p>
          </Show>
        </Show>
      </div>

      {/* Tasks Due This Week */}
      <div class="bg-white rounded-lg p-6 shadow-ca-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-text-secondary">Tasks Due This Week</h3>
          <svg class="w-5 h-5 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <Show when={!loading()} fallback={
          <div class="animate-pulse">
            <div class="h-10 bg-gray-200 rounded w-16 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        }>
          <p class="text-3xl font-bold text-text-primary">{stats()?.tasksDueThisWeek.count || 0}</p>
          <Show
            when={(stats()?.tasksDueThisWeek.overdue || 0) > 0}
            fallback={<p class="text-xs text-green-600 mt-1">✓ All on track</p>}
          >
            <p class="text-xs text-yellow-600 mt-1">
              {stats()?.tasksDueThisWeek.overdue} overdue
            </p>
          </Show>
        </Show>
      </div>

      {/* Total Budget */}
      <div class="bg-white rounded-lg p-6 shadow-ca-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-text-secondary">Total Budget</h3>
          <svg class="w-5 h-5 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <Show when={!loading()} fallback={
          <div class="animate-pulse">
            <div class="h-10 bg-gray-200 rounded w-20 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        }>
          <p class="text-3xl font-bold text-text-primary">
            {formatCurrency(stats()?.budget.total || 0)}
          </p>
          <p class="text-xs text-green-600 mt-1">
            {stats()?.budget.utilizationPercentage || 0}% utilized
          </p>
        </Show>
      </div>

      {/* Team Members */}
      <div class="bg-white rounded-lg p-6 shadow-ca-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-text-secondary">Team Members</h3>
          <svg class="w-5 h-5 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <Show when={!loading()} fallback={
          <div class="animate-pulse">
            <div class="h-10 bg-gray-200 rounded w-16 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-28"></div>
          </div>
        }>
          <p class="text-3xl font-bold text-text-primary">{stats()?.teamMembers.count || 0}</p>
          <p class="text-xs text-text-secondary mt-1">Across all projects</p>
        </Show>
      </div>
    </div>
  );
}
