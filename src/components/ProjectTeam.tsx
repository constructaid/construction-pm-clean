/**
 * Project Team Component
 * Display and manage project team members with contact information
 */

import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Component } from 'solid-js';

interface TeamMember {
  id: number;
  role: string;
  roleTitle?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  email?: string;
  phoneMain?: string;
  phoneMobile?: string;
  phoneOffice?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  responsibilities?: string;
}

interface ProjectTeamProps {
  projectId: number;
}

const ProjectTeam: Component<ProjectTeamProps> = (props) => {
  const [teamMembers, setTeamMembers] = createSignal<TeamMember[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [editingMember, setEditingMember] = createSignal<TeamMember | null>(null);

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    architect: 'Architect',
    engineer: 'Engineer',
    gc: 'General Contractor',
    superintendent: 'Superintendent',
    pm: 'Project Manager',
    inspector: 'Inspector',
    consultant: 'Consultant',
  };

  const roleIcons: Record<string, string> = {
    owner: '👤',
    architect: '📐',
    engineer: '⚙️',
    gc: '🏗️',
    superintendent: '👷',
    pm: '📋',
    inspector: '🔍',
    consultant: '💼',
  };

  createEffect(() => {
    loadTeamMembers();
  });

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${props.projectId}/team`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (memberData: Partial<TeamMember>) => {
    try {
      const response = await fetch(`/api/projects/${props.projectId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });

      if (response.ok) {
        loadTeamMembers();
        setShowAddForm(false);
      } else {
        alert('Failed to add team member');
      }
    } catch (err) {
      alert('Error adding team member: ' + err);
    }
  };

  const updateTeamMember = async (memberId: number, updates: Partial<TeamMember>) => {
    try {
      const response = await fetch(`/api/projects/${props.projectId}/team`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, ...updates }),
      });

      if (response.ok) {
        loadTeamMembers();
        setEditingMember(null);
      } else {
        alert('Failed to update team member');
      }
    } catch (err) {
      alert('Error updating team member: ' + err);
    }
  };

  const deleteTeamMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/projects/${props.projectId}/team?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadTeamMembers();
      } else {
        alert('Failed to remove team member');
      }
    } catch (err) {
      alert('Error removing team member: ' + err);
    }
  };

  return (
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-900">Project Team</h3>
        <button
          onClick={() => setShowAddForm(true)}
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          + Add Team Member
        </button>
      </div>

      <Show when={loading()}>
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p class="mt-2 text-gray-600">Loading team...</p>
        </div>
      </Show>

      <Show when={!loading() && teamMembers().length === 0}>
        <div class="text-center py-12 text-gray-500">
          <p class="text-lg mb-2">No team members added yet</p>
          <p class="text-sm">Click "Add Team Member" to get started</p>
        </div>
      </Show>

      <Show when={!loading() && teamMembers().length > 0}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <For each={teamMembers()}>
            {(member) => (
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    {roleIcons[member.role] || '👤'}
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-semibold text-gray-900">{member.fullName}</h4>
                      <Show when={member.isPrimary}>
                        <span class="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Primary
                        </span>
                      </Show>
                    </div>

                    <p class="text-sm text-gray-600 mb-1">
                      {member.roleTitle || roleLabels[member.role] || member.role}
                    </p>

                    <Show when={member.company}>
                      <p class="text-sm text-gray-500 mb-2">{member.company}</p>
                    </Show>

                    <div class="space-y-1 text-sm">
                      <Show when={member.email}>
                        <div class="flex items-center gap-2 text-gray-700">
                          <span>📧</span>
                          <a href={`mailto:${member.email}`} class="text-blue-600 hover:underline truncate">
                            {member.email}
                          </a>
                        </div>
                      </Show>

                      <Show when={member.phoneMain}>
                        <div class="flex items-center gap-2 text-gray-700">
                          <span>📞</span>
                          <a href={`tel:${member.phoneMain}`} class="text-blue-600 hover:underline">
                            {member.phoneMain}
                          </a>
                        </div>
                      </Show>

                      <Show when={member.phoneMobile}>
                        <div class="flex items-center gap-2 text-gray-700">
                          <span>📱</span>
                          <a href={`tel:${member.phoneMobile}`} class="text-blue-600 hover:underline">
                            {member.phoneMobile}
                          </a>
                        </div>
                      </Show>
                    </div>

                    <div class="flex gap-2 mt-3">
                      <button
                        onClick={() => setEditingMember(member)}
                        class="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTeamMember(member.id)}
                        class="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Add/Edit Form Modal */}
      <Show when={showAddForm() || editingMember()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 class="text-xl font-bold mb-4">
              {editingMember() ? 'Edit Team Member' : 'Add Team Member'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: any = {};
                formData.forEach((value, key) => {
                  if (value) data[key] = value;
                });

                if (editingMember()) {
                  updateTeamMember(editingMember()!.id, data);
                } else {
                  addTeamMember(data);
                }
              }}
              class="space-y-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    required
                    value={editingMember()?.role || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    <For each={Object.entries(roleLabels)}>
                      {([value, label]) => <option value={value}>{label}</option>}
                    </For>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Custom Title
                  </label>
                  <input
                    type="text"
                    name="roleTitle"
                    value={editingMember()?.roleTitle || ''}
                    placeholder="e.g., Senior Project Manager"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={editingMember()?.firstName || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={editingMember()?.lastName || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={editingMember()?.company || ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editingMember()?.email || ''}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Main Phone
                  </label>
                  <input
                    type="tel"
                    name="phoneMain"
                    value={editingMember()?.phoneMain || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="phoneMobile"
                    value={editingMember()?.phoneMobile || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Office
                  </label>
                  <input
                    type="tel"
                    name="phoneOffice"
                    value={editingMember()?.phoneOffice || ''}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isPrimary"
                    checked={editingMember()?.isPrimary || false}
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700">Primary Contact</span>
                </label>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="submit"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingMember() ? 'Update' : 'Add'} Team Member
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMember(null);
                  }}
                  class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ProjectTeam;
