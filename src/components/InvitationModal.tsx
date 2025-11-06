/**
 * Project Invitation Modal
 * Allows team members to invite others to join the project
 */
import { createSignal, Show, For } from 'solid-js';
import { csiDivisions, getCommonDivisions } from '../lib/data/csi-divisions';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  inviterRole: 'owner' | 'architect' | 'engineer' | 'general_contractor' | 'subcontractor' | 'supplier';
  onSuccess?: () => void;
}

export default function InvitationModal(props: InvitationModalProps) {
  const [email, setEmail] = createSignal('');
  const [companyName, setCompanyName] = createSignal('');
  const [teamRole, setTeamRole] = createSignal(props.inviterRole);
  const [csiDivision, setCsiDivision] = createSignal('');
  const [scopeOfWork, setScopeOfWork] = createSignal('');
  const [message, setMessage] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');
  const [showAllDivisions, setShowAllDivisions] = createSignal(false);

  // Map inviter roles to what roles they can invite
  const getRoleOptions = () => {
    switch (props.inviterRole) {
      case 'owner':
        return [
          { value: 'owner', label: 'Owner Representative' },
          { value: 'consultant', label: 'Owner Consultant' }
        ];
      case 'architect':
        return [
          { value: 'architect', label: 'Architect' },
          { value: 'engineer', label: 'Engineer/Consultant' }
        ];
      case 'engineer':
        return [
          { value: 'engineer', label: 'Engineer/Consultant' }
        ];
      case 'general_contractor':
        return [
          { value: 'general_contractor', label: 'GC Team Member' },
          { value: 'subcontractor', label: 'Subcontractor' },
          { value: 'supplier', label: 'Supplier' }
        ];
      case 'subcontractor':
        return [
          { value: 'subcontractor', label: 'Subcontractor Team Member' }
        ];
      case 'supplier':
        return [
          { value: 'supplier', label: 'Supplier Team Member' }
        ];
      default:
        return [];
    }
  };

  const roleOptions = getRoleOptions();

  // Show CSI division dropdown for subcontractors and suppliers
  const shouldShowDivision = () => {
    const role = teamRole();
    return role === 'subcontractor' || role === 'supplier';
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!email()) {
        throw new Error('Email is required');
      }

      if (!companyName()) {
        throw new Error('Company name is required');
      }

      if (shouldShowDivision() && !csiDivision()) {
        throw new Error('Please select a CSI division');
      }

      // Send invitation
      const response = await fetch(`/api/projects/${props.projectId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email(),
          companyName: companyName(),
          teamRole: teamRole(),
          csiDivision: shouldShowDivision() ? csiDivision() : null,
          scopeOfWork: scopeOfWork() || null,
          message: message() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Success!
      alert(`Invitation sent successfully to ${email()}`);
      props.onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setEmail('');
    setCompanyName('');
    setTeamRole(props.inviterRole);
    setCsiDivision('');
    setScopeOfWork('');
    setMessage('');
    setError('');
    props.onClose();
  };

  const divisionsToShow = () => showAllDivisions() ? csiDivisions : getCommonDivisions();

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
          {/* Header */}
          <div class="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-white">Invite Team Member</h2>
              <p class="text-sm text-gray-400 mt-1">{props.projectName}</p>
            </div>
            <button
              onClick={handleClose}
              class="text-gray-400 hover:text-white text-3xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} class="p-6 space-y-5">
            {/* Error Message */}
            <Show when={error()}>
              <div class="bg-red-500/10 border border-red-500 rounded-lg p-4">
                <p class="text-red-400 text-sm">{error()}</p>
              </div>
            </Show>

            {/* Email */}
            <div>
              <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder="contractor@example.com"
                required
                class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6600] transition-colors"
              />
            </div>

            {/* Company Name */}
            <div>
              <label for="company" class="block text-sm font-medium text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="company"
                value={companyName()}
                onInput={(e) => setCompanyName(e.currentTarget.value)}
                placeholder="ABC Construction Co."
                required
                class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6600] transition-colors"
              />
            </div>

            {/* Team Role */}
            <Show when={roleOptions.length > 1}>
              <div>
                <label for="role" class="block text-sm font-medium text-gray-300 mb-2">
                  Team Role *
                </label>
                <select
                  id="role"
                  value={teamRole()}
                  onChange={(e) => setTeamRole(e.currentTarget.value as any)}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF6600] transition-colors"
                >
                  <For each={roleOptions}>
                    {(option) => <option value={option.value}>{option.label}</option>}
                  </For>
                </select>
              </div>
            </Show>

            {/* CSI Division (for subcontractors/suppliers) */}
            <Show when={shouldShowDivision()}>
              <div>
                <label for="division" class="block text-sm font-medium text-gray-300 mb-2">
                  CSI Division / Trade *
                </label>
                <select
                  id="division"
                  value={csiDivision()}
                  onChange={(e) => setCsiDivision(e.currentTarget.value)}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF6600] transition-colors"
                >
                  <option value="">Select a division...</option>
                  <For each={divisionsToShow()}>
                    {(division) => (
                      <option value={division.code}>
                        {division.code} - {division.name}
                      </option>
                    )}
                  </For>
                </select>
                <button
                  type="button"
                  onClick={() => setShowAllDivisions(!showAllDivisions())}
                  class="text-sm text-[#FF6600] hover:text-[#ff8033] mt-2 transition-colors"
                >
                  {showAllDivisions() ? 'Show common divisions only' : 'Show all divisions'}
                </button>
              </div>
            </Show>

            {/* Scope of Work */}
            <div>
              <label for="scope" class="block text-sm font-medium text-gray-300 mb-2">
                Scope of Work
              </label>
              <textarea
                id="scope"
                value={scopeOfWork()}
                onInput={(e) => setScopeOfWork(e.currentTarget.value)}
                placeholder="Brief description of their responsibilities on this project..."
                rows="3"
                class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6600] transition-colors resize-none"
              />
            </div>

            {/* Personal Message */}
            <div>
              <label for="message" class="block text-sm font-medium text-gray-300 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={message()}
                onInput={(e) => setMessage(e.currentTarget.value)}
                placeholder="Add a personal message to your invitation..."
                rows="3"
                class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6600] transition-colors resize-none"
              />
            </div>

            {/* Info Box */}
            <div class="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <p class="text-blue-300 text-sm">
                <strong>How it works:</strong> The invited person will receive an email with a link to join the project.
                They can sign up or log in, and then request access. You or the Project Manager will need to approve their access request.
              </p>
            </div>

            {/* Action Buttons */}
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                class="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors border border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting()}
                class="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-all"
                style={{
                  'background-color': isSubmitting() ? '#9CA3AF' : '#FF6600',
                  cursor: isSubmitting() ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting() ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
