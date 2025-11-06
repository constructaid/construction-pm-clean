/**
 * Pending Access Requests Component
 * Displays pending invitations/access requests for Project Managers to approve
 */
import { createSignal, createEffect, Show, For } from 'solid-js';

interface PendingAccessRequestsProps {
  projectId: number;
}

interface Invitation {
  id: number;
  email: string;
  companyName: string;
  teamRole: string;
  csiDivision?: string;
  divisionName?: string;
  scopeOfWork?: string;
  message?: string;
  invitedAt: string;
  status: string;
  accessRequested: boolean;
}

export default function PendingAccessRequests(props: PendingAccessRequestsProps) {
  const [requests, setRequests] = createSignal<Invitation[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [processingId, setProcessingId] = createSignal<number | null>(null);

  createEffect(async () => {
    await loadRequests();
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${props.projectId}/invitations?status=accepted`);
      if (response.ok) {
        const data = await response.json();
        // Filter for those who have requested access but not yet approved
        const pendingRequests = data.invitations.filter(
          (inv: Invitation) => inv.accessRequested && !inv.accessApproved
        );
        setRequests(pendingRequests);
      }
    } catch (error) {
      console.error('Error loading access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invitationId: number) => {
    if (!confirm('Approve this access request?')) return;

    try {
      setProcessingId(invitationId);
      const response = await fetch(`/api/invitations/${invitationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (response.ok) {
        alert('Access request approved successfully!');
        await loadRequests(); // Refresh list
      } else {
        const data = await response.json();
        alert(`Failed to approve: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve access request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: number) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(invitationId);
      const response = await fetch(`/api/invitations/${invitationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: reason || 'Access request rejected'
        })
      });

      if (response.ok) {
        alert('Access request rejected');
        await loadRequests(); // Refresh list
      } else {
        const data = await response.json();
        alert(`Failed to reject: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject access request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      owner: 'Owner / Client',
      architect: 'Architect',
      engineer: 'Engineer',
      general_contractor: 'General Contractor',
      subcontractor: 'Subcontractor',
      supplier: 'Supplier',
      inspector: 'Inspector',
      consultant: 'Consultant'
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Show when={!loading() && requests().length > 0}>
      <div class="bg-yellow-500/10 border-2 border-yellow-500 rounded-lg p-6 mb-6">
        <div class="flex items-start gap-3 mb-4">
          <span class="text-2xl">⚠️</span>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-yellow-300 mb-1">
              Pending Access Requests ({requests().length})
            </h3>
            <p class="text-sm text-yellow-200">
              The following people have accepted invitations and are waiting for approval to access the project
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <For each={requests()}>
            {(request) => (
              <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h4 class="text-lg font-semibold text-white mb-1">{request.companyName}</h4>
                    <p class="text-sm text-gray-400">{request.email}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                    {formatRole(request.teamRole)}
                  </span>
                </div>

                <Show when={request.csiDivision}>
                  <div class="mb-2">
                    <span class="text-xs text-gray-400">Division: </span>
                    <span class="text-sm text-gray-300">
                      {request.csiDivision} - {request.divisionName}
                    </span>
                  </div>
                </Show>

                <Show when={request.scopeOfWork}>
                  <div class="mb-3">
                    <span class="text-xs text-gray-400">Scope: </span>
                    <span class="text-sm text-gray-300">{request.scopeOfWork}</span>
                  </div>
                </Show>

                <div class="flex items-center justify-between pt-3 border-t border-gray-700">
                  <span class="text-xs text-gray-500">
                    Requested {formatDate(request.invitedAt)}
                  </span>
                  <div class="flex gap-2">
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId() === request.id}
                      class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId() === request.id ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId() === request.id}
                      class="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style="background-color: #3D9991;"
                    >
                      {processingId() === request.id ? 'Processing...' : 'Approve Access'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
