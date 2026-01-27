/**
 * Team Management Component
 * Manage project team members - view, add, edit, remove
 * Uses RBAC-secured API endpoints
 */
import { createSignal, createResource, Show, For, onMount } from 'solid-js';
import { authService } from '../lib/client/authService';

interface TeamMember {
  id: number;
  userId: number;
  teamRole: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  accessLevel: string;
  canInviteOthers: boolean;
  csiDivision?: string;
  divisionName?: string;
  scopeOfWork?: string;
  isActive: boolean;
  joinedAt: string;
  // User details
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userRole?: string;
}

interface TeamManagementProps {
  projectId: number;
  canManageTeam: boolean;
}

const teamRoles = [
  { value: 'owner', label: 'Owner' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'architect', label: 'Architect' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'consultant', label: 'Consultant' },
];

const accessLevels = [
  { value: 'admin', label: 'Admin - Full access' },
  { value: 'standard', label: 'Standard - Normal access' },
  { value: 'read_only', label: 'Read Only - View only' },
];

export default function TeamManagement(props: TeamManagementProps) {
  const [members, { refetch }] = createResource<TeamMember[]>(
    async () => {
      const response = await authService.authenticatedFetch(
        `/api/projects/${props.projectId}/team`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      return data.members || [];
    }
  );

  const [isAddingMember, setIsAddingMember] = createSignal(false);
  const [editingMember, setEditingMember] = createSignal<TeamMember | null>(null);
  const [formData, setFormData] = createSignal({
    userId: '',
    teamRole: '',
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    accessLevel: 'standard',
    canInviteOthers: false,
    csiDivision: '',
    divisionName: '',
    scopeOfWork: '',
  });
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');

  const handleAddMember = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = formData();

    try {
      const response = await authService.authenticatedFetch(
        `/api/projects/${props.projectId}/team`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add team member');
      }

      setSuccess('Team member added successfully');
      setIsAddingMember(false);
      resetForm();
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateMember = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const member = editingMember();
    if (!member) return;

    try {
      const response = await authService.authenticatedFetch(
        `/api/projects/${props.projectId}/team`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: member.id,
            ...formData(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update team member');
      }

      setSuccess('Team member updated successfully');
      setEditingMember(null);
      resetForm();
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await authService.authenticatedFetch(
        `/api/projects/${props.projectId}/team?memberId=${memberId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove team member');
      }

      setSuccess('Team member removed successfully');
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const startEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      userId: member.userId.toString(),
      teamRole: member.teamRole,
      companyName: member.companyName,
      contactName: member.contactName,
      contactEmail: member.contactEmail,
      contactPhone: member.contactPhone || '',
      accessLevel: member.accessLevel,
      canInviteOthers: member.canInviteOthers,
      csiDivision: member.csiDivision || '',
      divisionName: member.divisionName || '',
      scopeOfWork: member.scopeOfWork || '',
    });
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      teamRole: '',
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      accessLevel: 'standard',
      canInviteOthers: false,
      csiDivision: '',
      divisionName: '',
      scopeOfWork: '',
    });
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setIsAddingMember(false);
    resetForm();
    setError('');
  };

  return (
    <div class="team-management">
      <div class="team-header">
        <h2>Project Team</h2>
        <Show when={props.canManageTeam && !isAddingMember() && !editingMember()}>
          <button
            class="btn btn-primary"
            onClick={() => setIsAddingMember(true)}
          >
            + Add Team Member
          </button>
        </Show>
      </div>

      {/* Success/Error Messages */}
      <Show when={success()}>
        <div class="alert alert-success">{success()}</div>
      </Show>
      <Show when={error()}>
        <div class="alert alert-error">{error()}</div>
      </Show>

      {/* Add/Edit Form */}
      <Show when={isAddingMember() || editingMember()}>
        <div class="team-form-container">
          <h3>{editingMember() ? 'Edit Team Member' : 'Add Team Member'}</h3>
          <form onSubmit={editingMember() ? handleUpdateMember : handleAddMember}>
            <div class="form-grid">
              <div class="form-group">
                <label for="userId">User ID *</label>
                <input
                  type="number"
                  id="userId"
                  value={formData().userId}
                  onInput={(e) => setFormData({ ...formData(), userId: e.currentTarget.value })}
                  required
                  disabled={!!editingMember()}
                />
                <small>Enter the ID of the user to add to this project</small>
              </div>

              <div class="form-group">
                <label for="teamRole">Team Role *</label>
                <select
                  id="teamRole"
                  value={formData().teamRole}
                  onChange={(e) => setFormData({ ...formData(), teamRole: e.currentTarget.value })}
                  required
                >
                  <option value="">Select role...</option>
                  <For each={teamRoles}>
                    {(role) => <option value={role.value}>{role.label}</option>}
                  </For>
                </select>
              </div>

              <div class="form-group">
                <label for="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  value={formData().companyName}
                  onInput={(e) => setFormData({ ...formData(), companyName: e.currentTarget.value })}
                  required
                />
              </div>

              <div class="form-group">
                <label for="contactName">Contact Name *</label>
                <input
                  type="text"
                  id="contactName"
                  value={formData().contactName}
                  onInput={(e) => setFormData({ ...formData(), contactName: e.currentTarget.value })}
                  required
                />
              </div>

              <div class="form-group">
                <label for="contactEmail">Contact Email *</label>
                <input
                  type="email"
                  id="contactEmail"
                  value={formData().contactEmail}
                  onInput={(e) => setFormData({ ...formData(), contactEmail: e.currentTarget.value })}
                  required
                />
              </div>

              <div class="form-group">
                <label for="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  value={formData().contactPhone}
                  onInput={(e) => setFormData({ ...formData(), contactPhone: e.currentTarget.value })}
                />
              </div>

              <div class="form-group">
                <label for="accessLevel">Access Level</label>
                <select
                  id="accessLevel"
                  value={formData().accessLevel}
                  onChange={(e) => setFormData({ ...formData(), accessLevel: e.currentTarget.value })}
                >
                  <For each={accessLevels}>
                    {(level) => <option value={level.value}>{level.label}</option>}
                  </For>
                </select>
              </div>

              <div class="form-group">
                <label for="csiDivision">CSI Division (for subcontractors)</label>
                <input
                  type="text"
                  id="csiDivision"
                  value={formData().csiDivision}
                  onInput={(e) => setFormData({ ...formData(), csiDivision: e.currentTarget.value })}
                  placeholder="e.g., 03, 16, 23"
                />
              </div>

              <div class="form-group">
                <label for="divisionName">Division Name</label>
                <input
                  type="text"
                  id="divisionName"
                  value={formData().divisionName}
                  onInput={(e) => setFormData({ ...formData(), divisionName: e.currentTarget.value })}
                  placeholder="e.g., Concrete, Electrical"
                />
              </div>

              <div class="form-group full-width">
                <label for="scopeOfWork">Scope of Work</label>
                <textarea
                  id="scopeOfWork"
                  value={formData().scopeOfWork}
                  onInput={(e) => setFormData({ ...formData(), scopeOfWork: e.currentTarget.value })}
                  rows={3}
                />
              </div>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData().canInviteOthers}
                    onChange={(e) => setFormData({ ...formData(), canInviteOthers: e.currentTarget.checked })}
                  />
                  Can invite other team members
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                {editingMember() ? 'Update Member' : 'Add Member'}
              </button>
              <button type="button" class="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Show>

      {/* Team Members List */}
      <div class="team-list">
        <Show when={members.loading}>
          <p>Loading team members...</p>
        </Show>

        <Show when={members.error}>
          <div class="alert alert-error">
            Failed to load team members: {members.error.message}
          </div>
        </Show>

        <Show when={members() && members()!.length === 0}>
          <p class="no-members">No team members yet. Add your first team member to get started.</p>
        </Show>

        <Show when={members() && members()!.length > 0}>
          <div class="members-grid">
            <For each={members()}>
              {(member) => (
                <div class="member-card">
                  <div class="member-header">
                    <h3>{member.contactName}</h3>
                    <span class={`role-badge role-${member.teamRole}`}>
                      {teamRoles.find(r => r.value === member.teamRole)?.label || member.teamRole}
                    </span>
                  </div>

                  <div class="member-details">
                    <p><strong>Company:</strong> {member.companyName}</p>
                    <p><strong>Email:</strong> {member.contactEmail}</p>
                    <Show when={member.contactPhone}>
                      <p><strong>Phone:</strong> {member.contactPhone}</p>
                    </Show>
                    <p><strong>Access Level:</strong> {member.accessLevel}</p>
                    <Show when={member.csiDivision}>
                      <p><strong>CSI Division:</strong> {member.csiDivision} - {member.divisionName}</p>
                    </Show>
                    <Show when={member.scopeOfWork}>
                      <p><strong>Scope:</strong> {member.scopeOfWork}</p>
                    </Show>
                    <p class="joined-date">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Show when={props.canManageTeam && !isAddingMember() && !editingMember()}>
                    <div class="member-actions">
                      <button
                        class="btn btn-small btn-secondary"
                        onClick={() => startEdit(member)}
                      >
                        Edit
                      </button>
                      <button
                        class="btn btn-small btn-danger"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      <style>{`
        .team-management {
          padding: 2rem;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .team-header h2 {
          margin: 0;
          color: #1a202c;
        }

        .alert {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .alert-success {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .alert-error {
          background-color: #fed7d7;
          color: #742a2a;
          border: 1px solid #fc8181;
        }

        .team-form-container {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }

        .team-form-container h3 {
          margin-top: 0;
          color: #2d3748;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .form-group small {
          margin-top: 0.25rem;
          color: #718096;
          font-size: 0.875rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #3182ce;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2c5282;
        }

        .btn-secondary {
          background-color: #e2e8f0;
          color: #2d3748;
        }

        .btn-secondary:hover {
          background-color: #cbd5e0;
        }

        .btn-danger {
          background-color: #fc8181;
          color: white;
        }

        .btn-danger:hover {
          background-color: #f56565;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .member-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: box-shadow 0.2s;
        }

        .member-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .member-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .member-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .role-owner { background: #bee3f8; color: #2c5282; }
        .role-general_contractor { background: #c6f6d5; color: #22543d; }
        .role-architect { background: #fbb6ce; color: #742a2a; }
        .role-engineer { background: #d6bcfa; color: #44337a; }
        .role-subcontractor { background: #fbd38d; color: #744210; }
        .role-supplier { background: #e9d8fd; color: #44337a; }
        .role-inspector { background: #fed7d7; color: #742a2a; }
        .role-consultant { background: #b2f5ea; color: #234e52; }

        .member-details p {
          margin: 0.5rem 0;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .member-details strong {
          color: #2d3748;
        }

        .joined-date {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-size: 0.875rem;
        }

        .member-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .no-members {
          text-align: center;
          color: #718096;
          padding: 2rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
