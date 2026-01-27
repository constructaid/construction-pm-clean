/**
 * Client/Owner Dashboard Component
 * High-level oversight dashboard for owners/clients
 * Focus: Financial control, approvals, project status, key milestones
 *
 * Uses real API data from /api/portfolio endpoint
 */

import { createSignal, onMount, Show, For } from 'solid-js';

interface ClientDashboardProps {
  projectId?: number;
}

interface ProjectOverview {
  id: number;
  name: string;
  status: string;
  completionPercentage: number;
  contractValue: number;
  spentToDate: number;
  remainingBudget: number;
  expectedCompletion: string;
}

interface PaymentSummary {
  totalApproved: number;
  totalPaid: number;
  pendingApproval: number;
  nextPaymentDue: string;
  outstandingAmount: number;
}

interface ChangeOrderSummary {
  pendingApprovalCount: number;
  pendingAmount: number;
  approvedThisMonth: number;
  totalImpact: number;
}

interface MilestoneSummary {
  upcomingMilestones: Array<{
    name: string;
    date: string;
    status: string;
  }>;
  criticalPath: boolean;
  daysAhead: number;
}

export default function ClientDashboard(props: ClientDashboardProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [projectOverview, setProjectOverview] = createSignal<ProjectOverview[]>([]);
  const [paymentSummary, setPaymentSummary] = createSignal<PaymentSummary | null>(null);
  const [changeOrders, setChangeOrders] = createSignal<ChangeOrderSummary | null>(null);
  const [milestones, setMilestones] = createSignal<MilestoneSummary | null>(null);
  const [rfiCount, setRfiCount] = createSignal(0);
  const [firstProjectId, setFirstProjectId] = createSignal<number | null>(null);

  onMount(() => {
    loadDashboardData();
  });

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio data from real API
      const portfolioRes = await fetch('/api/portfolio');
      if (!portfolioRes.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const portfolioData = await portfolioRes.json();

      // Transform projects to our interface
      const projects: ProjectOverview[] = (portfolioData.projects || []).map((p: any) => ({
        id: p.id,
        name: p.name || 'Untitled Project',
        status: p.status === 'active' ? 'In Progress' :
                p.status === 'completed' ? 'Completed' :
                p.status === 'planning' ? 'Planning' :
                p.status === 'on_hold' ? 'On Hold' : p.status,
        completionPercentage: p.progressPercentage || 0,
        contractValue: p.totalBudget || 0,
        spentToDate: p.spentBudget || 0,
        remainingBudget: p.remainingBudget || (p.totalBudget - p.spentBudget) || 0,
        expectedCompletion: p.estimatedCompletion || p.endDate || '',
      }));

      setProjectOverview(projects);

      // Set first project ID for navigation links
      if (projects.length > 0) {
        setFirstProjectId(projects[0].id);
      }

      // Calculate payment summary from KPIs
      const kpis = portfolioData.kpis || {};
      const costKpis = kpis.cost || {};
      setPaymentSummary({
        totalApproved: costKpis.totalSpent || 0,
        totalPaid: costKpis.totalSpent || 0,
        pendingApproval: (costKpis.totalBudget || 0) - (costKpis.totalSpent || 0),
        nextPaymentDue: getNextPaymentDate(),
        outstandingAmount: (costKpis.totalBudget || 0) - (costKpis.totalSpent || 0),
      });

      // Process change orders from real data
      const changeOrdersList = portfolioData.changeOrders || [];
      const pendingCOs = changeOrdersList.filter((co: any) => co.status === 'pending');
      const approvedThisMonth = changeOrdersList.filter((co: any) => {
        const approvedDate = co.approvedDate ? new Date(co.approvedDate) : null;
        const now = new Date();
        return co.status === 'approved' && approvedDate &&
               approvedDate.getMonth() === now.getMonth() &&
               approvedDate.getFullYear() === now.getFullYear();
      });

      setChangeOrders({
        pendingApprovalCount: pendingCOs.length,
        pendingAmount: pendingCOs.reduce((sum: number, co: any) => sum + (co.amount || 0), 0),
        approvedThisMonth: approvedThisMonth.length,
        totalImpact: changeOrdersList.reduce((sum: number, co: any) => sum + (co.amount || 0), 0),
      });

      // Process RFIs
      const rfisList = portfolioData.rfis || [];
      const openRfis = rfisList.filter((rfi: any) =>
        rfi.status === 'open' || rfi.status === 'pending_response'
      );
      setRfiCount(openRfis.length);

      // Build milestones from tasks data
      const tasksList = portfolioData.tasks || [];
      const upcomingTasks = tasksList
        .filter((t: any) => t.status !== 'completed' && t.dueDate)
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3)
        .map((t: any) => ({
          name: t.title || t.name || 'Untitled Task',
          date: t.dueDate,
          status: getTaskStatus(t),
        }));

      const timeKpis = kpis.time || {};
      setMilestones({
        upcomingMilestones: upcomingTasks.length > 0 ? upcomingTasks : [
          { name: 'No upcoming milestones', date: '', status: 'on-track' }
        ],
        criticalPath: (timeKpis.behindSchedule || 0) > 0,
        daysAhead: (timeKpis.aheadOfSchedule || 0) - (timeKpis.behindSchedule || 0),
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine task status based on due date
  const getTaskStatus = (task: any): string => {
    if (!task.dueDate) return 'on-track';
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'delayed';
    if (daysUntilDue <= 7) return 'at-risk';
    return 'on-track';
  };

  // Helper to get next payment date (end of current month)
  const getNextPaymentDate = (): string => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'on-track': 'bg-green-100 text-green-800',
      'at-risk': 'bg-yellow-100 text-yellow-800',
      'delayed': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Get the link target project ID (use first project or fallback to 1)
  const getProjectLink = (path: string) => {
    const projectId = firstProjectId() || 1;
    return `/projects/${projectId}/${path}`;
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Loading State */}
      <Show when={loading()}>
        <div class="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ca-teal mx-auto mb-4"></div>
            <p class="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <div class="flex items-center">
            <div class="text-red-500 text-2xl mr-3">⚠️</div>
            <div>
              <p class="text-red-700 font-medium">Error loading dashboard</p>
              <p class="text-red-600 text-sm">{error()}</p>
              <button
                onClick={loadDashboardData}
                class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Header */}
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-12 mb-8">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center gap-3 mb-4">
            <div class="text-5xl">👔</div>
            <div>
              <h1 class="text-4xl font-bold mb-2">Owner Dashboard</h1>
              <p class="text-blue-100 text-lg">
                Project oversight and financial control center
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <div class="text-blue-100 text-sm mb-1">Active Projects</div>
              <div class="text-3xl font-bold">{projectOverview().length}</div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <div class="text-blue-100 text-sm mb-1">Pending Approvals</div>
              <div class="text-3xl font-bold">{changeOrders()?.pendingApprovalCount || 0}</div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <div class="text-blue-100 text-sm mb-1">Awaiting Payment</div>
              <div class="text-3xl font-bold">{formatCurrency(paymentSummary()?.outstandingAmount || 0)}</div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
              <div class="text-blue-100 text-sm mb-1">RFIs Need Response</div>
              <div class="text-3xl font-bold">{rfiCount()}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-8 pb-12">
        {/* Empty State */}
        <Show when={!loading() && projectOverview().length === 0}>
          <div class="bg-white rounded-lg shadow-lg p-12 text-center mb-8">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">No Projects Yet</h3>
            <p class="text-gray-600 mb-6">
              You don't have any active projects. Contact your general contractor to get started.
            </p>
            <a
              href="/projects"
              class="px-6 py-3 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all font-medium"
            >
              View All Projects
            </a>
          </div>
        </Show>

        {/* Project Overview Cards */}
        <Show when={projectOverview().length > 0}>
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Project Portfolio</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <For each={projectOverview()}>
                {(project) => (
                  <div class="bg-white rounded-lg shadow-lg border-l-4 border-ca-teal overflow-hidden">
                    <div class="p-6">
                      <div class="flex items-start justify-between mb-4">
                        <div>
                          <h3 class="text-xl font-bold text-gray-900 mb-1">{project.name}</h3>
                          <span class="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                            {project.status}
                          </span>
                        </div>
                        <a
                          href={`/projects/${project.id}`}
                          class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                        >
                          View Details
                        </a>
                      </div>

                      {/* Progress Bar */}
                      <div class="mb-4">
                        <div class="flex items-center justify-between text-sm mb-2">
                          <span class="font-medium text-gray-700">Progress</span>
                          <span class="font-bold text-ca-teal">{project.completionPercentage}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                          <div
                            class="bg-gradient-to-r from-ca-teal to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={`width: ${project.completionPercentage}%`}
                          ></div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <div class="text-xs text-gray-600 mb-1">Contract Value</div>
                          <div class="font-bold text-gray-900">{formatCurrency(project.contractValue)}</div>
                        </div>
                        <div>
                          <div class="text-xs text-gray-600 mb-1">Spent to Date</div>
                          <div class="font-bold text-blue-600">{formatCurrency(project.spentToDate)}</div>
                        </div>
                        <div>
                          <div class="text-xs text-gray-600 mb-1">Remaining</div>
                          <div class="font-bold text-green-600">{formatCurrency(project.remainingBudget)}</div>
                        </div>
                      </div>

                      <Show when={project.expectedCompletion}>
                        <div class="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                          <span class="font-medium">Expected Completion:</span>{' '}
                          {formatDate(project.expectedCompletion)}
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Payment Summary */}
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Payment Summary</h2>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div class="border-l-4 border-green-500 pl-4">
                <div class="text-sm text-gray-600 mb-1">Total Approved</div>
                <div class="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentSummary()?.totalApproved || 0)}
                </div>
              </div>
              <div class="border-l-4 border-blue-500 pl-4">
                <div class="text-sm text-gray-600 mb-1">Total Paid</div>
                <div class="text-2xl font-bold text-blue-600">
                  {formatCurrency(paymentSummary()?.totalPaid || 0)}
                </div>
              </div>
              <div class="border-l-4 border-yellow-500 pl-4">
                <div class="text-sm text-gray-600 mb-1">Pending Approval</div>
                <div class="text-2xl font-bold text-yellow-600">
                  {formatCurrency(paymentSummary()?.pendingApproval || 0)}
                </div>
              </div>
              <div class="border-l-4 border-purple-500 pl-4">
                <div class="text-sm text-gray-600 mb-1">Outstanding</div>
                <div class="text-2xl font-bold text-purple-600">
                  {formatCurrency(paymentSummary()?.outstandingAmount || 0)}
                </div>
              </div>
              <div class="border-l-4 border-ca-teal pl-4">
                <div class="text-sm text-gray-600 mb-1">Next Payment Due</div>
                <div class="text-lg font-bold text-gray-900">
                  {formatDate(paymentSummary()?.nextPaymentDue || '')}
                </div>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-3xl">⚡</span>
                  <div>
                    <div class="font-semibold text-gray-900">Blockchain Payment Tracking</div>
                    <div class="text-sm text-gray-600">
                      Instant settlement via XRP Ledger - Save on wire fees
                    </div>
                  </div>
                </div>
                <a
                  href={getProjectLink('payment-applications')}
                  class="px-4 py-2 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all font-medium"
                >
                  View Payment Applications
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Change Orders Requiring Approval */}
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Change Orders</h2>
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div>
                    <div class="font-semibold text-gray-900">Pending Your Approval</div>
                    <div class="text-sm text-gray-600 mt-1">
                      {changeOrders()?.pendingApprovalCount || 0} change orders
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-yellow-700">
                      {formatCurrency(changeOrders()?.pendingAmount || 0)}
                    </div>
                    <div class="text-xs text-gray-600">Total Impact</div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Approved This Month</div>
                    <div class="text-xl font-bold text-green-600">
                      {changeOrders()?.approvedThisMonth || 0}
                    </div>
                  </div>
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Total CO Impact</div>
                    <div class="text-xl font-bold text-gray-900">
                      {formatCurrency(changeOrders()?.totalImpact || 0)}
                    </div>
                  </div>
                </div>

                <a
                  href={getProjectLink('change-orders')}
                  class="block w-full text-center px-4 py-3 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all font-medium"
                >
                  Review Change Orders
                </a>
              </div>
            </div>
          </div>

          {/* Key Milestones */}
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Key Milestones</h2>
            <div class="bg-white rounded-lg shadow-lg p-6">
              <div class="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-gray-900">Schedule Status</div>
                    <div class="text-sm text-gray-600">
                      {(milestones()?.daysAhead || 0) >= 0
                        ? `${milestones()?.daysAhead || 0} days ahead of schedule`
                        : `${Math.abs(milestones()?.daysAhead || 0)} days behind schedule`}
                    </div>
                  </div>
                  <div class="text-3xl">
                    {(milestones()?.daysAhead || 0) >= 0 ? '✅' : '⚠️'}
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="text-sm font-semibold text-gray-700 mb-2">Upcoming Milestones</div>
                <For each={milestones()?.upcomingMilestones || []}>
                  {(milestone) => (
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div class="flex-1">
                        <div class="font-medium text-gray-900">{milestone.name}</div>
                        <Show when={milestone.date}>
                          <div class="text-sm text-gray-600">{formatDate(milestone.date)}</div>
                        </Show>
                      </div>
                      <span
                        class={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          milestone.status
                        )}`}
                      >
                        {milestone.status}
                      </span>
                    </div>
                  )}
                </For>
              </div>

              <a
                href={getProjectLink('schedule')}
                class="block w-full text-center px-4 py-3 bg-ca-teal text-white rounded-lg hover:opacity-90 transition-all font-medium mt-4"
              >
                View Full Schedule
              </a>
            </div>
          </div>
        </div>

        {/* RFIs Requiring Response */}
        <div class="mt-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">RFIs Requiring Your Response</h2>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="text-5xl">📋</div>
                <div>
                  <div class="text-3xl font-bold text-gray-900">{rfiCount()}</div>
                  <div class="text-sm text-gray-600">Requests for Information awaiting your decision</div>
                </div>
              </div>
              <a
                href={getProjectLink('rfis')}
                class="px-6 py-3 bg-ca-orange text-white rounded-lg hover:opacity-90 transition-all font-medium"
              >
                Review RFIs
              </a>
            </div>
          </div>
        </div>

        {/* Quick Access Links */}
        <div class="mt-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Quick Access</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href={getProjectLink('contracts')}
              class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-gray-200 hover:border-ca-teal text-center"
            >
              <div class="text-4xl mb-2">📜</div>
              <div class="font-semibold text-gray-900">Contracts</div>
              <div class="text-xs text-gray-600 mt-1">Subcontract Agreements</div>
            </a>
            <a
              href={getProjectLink('documents')}
              class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-gray-200 hover:border-ca-teal text-center"
            >
              <div class="text-4xl mb-2">📁</div>
              <div class="font-semibold text-gray-900">Documents</div>
              <div class="text-xs text-gray-600 mt-1">Drawings & Specs</div>
            </a>
            <a
              href={getProjectLink('submittals')}
              class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-gray-200 hover:border-ca-teal text-center"
            >
              <div class="text-4xl mb-2">📝</div>
              <div class="font-semibold text-gray-900">Submittals</div>
              <div class="text-xs text-gray-600 mt-1">Material Approvals</div>
            </a>
            <a
              href={getProjectLink('xrp-payments')}
              class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-gray-200 hover:border-purple-500 text-center"
            >
              <div class="text-4xl mb-2">⚡</div>
              <div class="font-semibold text-gray-900">XRP Payments</div>
              <div class="text-xs text-gray-600 mt-1">Blockchain Ledger</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
