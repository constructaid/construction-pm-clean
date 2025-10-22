/**
 * Project Health Card Component
 * Displays project summary with health indicators and quick stats
 */
import { createSignal, createEffect, Show } from 'solid-js';

interface ProjectHealthCardProps {
  project: any;
}

export default function ProjectHealthCard(props: ProjectHealthCardProps) {
  const [healthData, setHealthData] = createSignal<any>({
    rfis: { open: 0, priority: null },
    submittals: { pending: 0, overdue: 0 },
    changeOrders: { proposed: 0, totalImpact: 0 },
    schedule: { daysRemaining: 0, onTrack: true },
    loading: true
  });

  createEffect(async () => {
    // Fetch health indicators for this project
    try {
      const [rfisRes, submittalsRes, changeOrdersRes] = await Promise.all([
        fetch(`/api/rfis?projectId=${props.project.id}`).catch(() => ({ ok: false })),
        fetch(`/api/submittals?projectId=${props.project.id}`).catch(() => ({ ok: false })),
        fetch(`/api/change-orders?projectId=${props.project.id}`).catch(() => ({ ok: false }))
      ]);

      const rfisData = rfisRes.ok ? await rfisRes.json() : { rfis: [] };
      const submittalsData = submittalsRes.ok ? await submittalsRes.json() : { submittals: [] };
      const changeOrdersData = changeOrdersRes.ok ? await changeOrdersRes.json() : { changeOrders: [] };

      // Calculate health metrics
      const openRFIs = rfisData.rfis?.filter((r: any) => r.status === 'open' || r.status === 'pending') || [];
      const highestPriorityRFI = openRFIs.length > 0
        ? openRFIs.reduce((max: any, rfi: any) => {
            const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
            return (priorities[rfi.priority as keyof typeof priorities] || 0) > (priorities[max?.priority as keyof typeof priorities] || 0) ? rfi : max;
          }, openRFIs[0])
        : null;

      const pendingSubmittals = submittalsData.submittals?.filter((s: any) =>
        s.status === 'submitted' || s.status === 'under_review'
      ).length || 0;

      const proposedChangeOrders = changeOrdersData.changeOrders?.filter((co: any) =>
        co.status === 'proposed'
      ) || [];

      const totalCOImpact = proposedChangeOrders.reduce((sum: number, co: any) =>
        sum + (co.costImpact || 0), 0
      );

      // Calculate schedule status
      const completion = props.project.estimatedCompletion
        ? new Date(props.project.estimatedCompletion)
        : null;
      const today = new Date();
      const daysRemaining = completion
        ? Math.ceil((completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setHealthData({
        rfis: {
          open: openRFIs.length,
          priority: highestPriorityRFI?.priority || null
        },
        submittals: {
          pending: pendingSubmittals,
          overdue: 0
        },
        changeOrders: {
          proposed: proposedChangeOrders.length,
          totalImpact: totalCOImpact
        },
        schedule: {
          daysRemaining,
          onTrack: daysRemaining > 0
        },
        loading: false
      });
    } catch (error) {
      console.error('Error fetching health data:', error);
      setHealthData(prev => ({ ...prev, loading: false }));
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#3D9991';
      case 'in_progress': return '#4BAAD8';
      case 'planning': return '#FF5E15';
      case 'on_hold': return '#F1F1F1';
      case 'cancelled': return '#1F1F1F';
      default: return '#F1F1F1';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount / 100); // Convert from cents
  };

  return (
    <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Project Header */}
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 mb-1">
              {props.project.name}
            </h3>
            <p class="text-sm text-gray-600">
              {props.project.projectNumber} • {props.project.address || props.project.city || 'No location'}
            </p>
          </div>
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ml-3"
            style={`background-color: ${getStatusColor(props.project.status)};`}
          >
            {props.project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Progress Bar */}
        <div class="mt-4">
          <div class="flex justify-between text-xs text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span class="font-semibold">{props.project.progressPercentage || 0}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-500"
              style={`width: ${props.project.progressPercentage || 0}%; background-color: #3D9991;`}
            />
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div class="p-6">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">Project Health</h4>

        <Show when={!healthData().loading}>
          <div class="grid grid-cols-2 gap-3 mb-4">
            {/* RFIs */}
            <div class="bg-blue-50 rounded-lg p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-blue-900">RFIs</span>
                <Show when={healthData().rfis.priority}>
                  <span
                    class="text-xs font-bold px-2 py-0.5 rounded text-white"
                    style={`background-color: ${getPriorityColor(healthData().rfis.priority)};`}
                  >
                    {healthData().rfis.priority?.toUpperCase()}
                  </span>
                </Show>
              </div>
              <p class="text-2xl font-bold text-blue-700">
                {healthData().rfis.open}
              </p>
              <p class="text-xs text-blue-600">Open</p>
            </div>

            {/* Submittals */}
            <div class="bg-purple-50 rounded-lg p-3">
              <span class="text-xs font-medium text-purple-900">Submittals</span>
              <p class="text-2xl font-bold text-purple-700">
                {healthData().submittals.pending}
              </p>
              <p class="text-xs text-purple-600">Pending Review</p>
            </div>

            {/* Change Orders */}
            <div class="bg-orange-50 rounded-lg p-3">
              <span class="text-xs font-medium text-orange-900">Change Orders</span>
              <p class="text-2xl font-bold text-orange-700">
                {healthData().changeOrders.proposed}
              </p>
              <p class="text-xs text-orange-600">
                {healthData().changeOrders.totalImpact !== 0
                  ? formatCurrency(healthData().changeOrders.totalImpact)
                  : 'No impact'
                }
              </p>
            </div>

            {/* Schedule */}
            <div class={`rounded-lg p-3 ${healthData().schedule.onTrack ? 'bg-green-50' : 'bg-red-50'}`}>
              <span class={`text-xs font-medium ${healthData().schedule.onTrack ? 'text-green-900' : 'text-red-900'}`}>
                Schedule
              </span>
              <p class={`text-2xl font-bold ${healthData().schedule.onTrack ? 'text-green-700' : 'text-red-700'}`}>
                {healthData().schedule.daysRemaining > 0 ? healthData().schedule.daysRemaining : 'TBD'}
              </p>
              <p class={`text-xs ${healthData().schedule.onTrack ? 'text-green-600' : 'text-red-600'}`}>
                {healthData().schedule.daysRemaining > 0 ? 'Days Remaining' : 'Not Scheduled'}
              </p>
            </div>
          </div>
        </Show>

        {/* Budget Summary */}
        <div class="bg-gray-50 rounded-lg p-3 mb-4">
          <div class="flex justify-between items-center">
            <span class="text-xs font-medium text-gray-700">Budget</span>
            <span class="text-sm font-bold text-gray-900">
              {formatCurrency((props.project.totalBudget || 0) * 100)}
            </span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-xs text-gray-600">Remaining</span>
            <span class="text-sm font-semibold text-green-600">
              {formatCurrency((props.project.remainingBudget || props.project.totalBudget || 0) * 100)}
            </span>
          </div>
        </div>

        {/* Enter Project Button */}
        <a
          href={`/projects/${props.project.id}`}
          class="block w-full text-center text-white py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
          style="background-color: #FF5E15;"
        >
          Enter Project →
        </a>
      </div>
    </div>
  );
}
