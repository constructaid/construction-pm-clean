/**
 * UserManager Component
 * Comprehensive admin interface for managing users
 */
import { createSignal, createEffect, For, Show } from 'solid-js';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  company: string | null;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserManagerProps {
  companyId?: number;
}

export default function UserManager(props: UserManagerProps) {
  const [users, setUsers] = createSignal<User[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');

  // Filters
  const [searchTerm, setSearchTerm] = createSignal('');
  const [roleFilter, setRoleFilter] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal('');

  // Pagination
  const [currentPage, setCurrentPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [totalUsers, setTotalUsers] = createSignal(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [selectedUser, setSelectedUser] = createSignal<User | null>(null);

  // Form state
  const [formData, setFormData] = createSignal({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'GC',
    status: 'ACTIVE',
    company: '',
    phone: '',
  });

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage().toString(),
        limit: '20',
        ...(searchTerm() && { search: searchTerm() }),
        ...(roleFilter() && { role: roleFilter() }),
        ...(statusFilter() && { status: statusFilter() }),
        ...(props.companyId && { companyId: props.companyId.toString() }),
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
        setTotalUsers(data.data.pagination.total);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  createEffect(() => {
    loadUsers();
  });

  // Handle search/filter changes
  createEffect(() => {
    // Reset to page 1 when filters change
    searchTerm();
    roleFilter();
    statusFilter();
    setCurrentPage(1);
    loadUsers();
  });

  // Create user
  const handleCreateUser = async (e: Event) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData()),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'GC',
          status: 'ACTIVE',
          company: '',
          phone: '',
        });
        loadUsers();
        alert('User created successfully!');
      } else {
        alert('Error: ' + (data.error || 'Failed to create user'));
      }
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e: Event) => {
    e.preventDefault();
    const user = selectedUser();
    if (!user) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData()),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
        alert('User updated successfully!');
      } else {
        alert('Error: ' + (data.error || 'Failed to update user'));
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadUsers();
        alert('User deleted successfully!');
      } else {
        alert('Error: ' + (data.error || 'Failed to delete user'));
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      company: user.company || '',
      phone: user.phone || '',
    });
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: '#FF6600',
      GC: '#4BAAD8',
      OWNER: '#3D9991',
      ARCHITECT: '#6B46C1',
      SUB: '#F59E0B',
    };
    return colors[role] || '#9CA3AF';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: '#10B981',
      INACTIVE: '#6B7280',
      SUSPENDED: '#EF4444',
      PENDING_VERIFICATION: '#F59E0B',
    };
    return colors[status] || '#6B7280';
  };

  return (
    <div class="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">User Management</h2>
          <p class="text-gray-400 text-sm mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          class="px-4 py-2 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: '#FF6600' }}
        >
          ➕ Add User
        </button>
      </div>

      {/* Filters */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Role</label>
          <select
            value={roleFilter()}
            onChange={(e) => setRoleFilter(e.currentTarget.value)}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="GC">General Contractor</option>
            <option value="OWNER">Owner</option>
            <option value="ARCHITECT">Architect</option>
            <option value="SUB">Subcontractor</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={statusFilter()}
            onChange={(e) => setStatusFilter(e.currentTarget.value)}
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div class="text-gray-400 text-sm mb-4">
        Showing {users().length} of {totalUsers()} users
      </div>

      {/* Error Message */}
      <Show when={error()}>
        <div class="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
          <p class="text-red-400">{error()}</p>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={loading() && users().length === 0}>
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p class="mt-4 text-gray-400">Loading users...</p>
        </div>
      </Show>

      {/* Users Table */}
      <Show when={!loading() || users().length > 0}>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Contact</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Role</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Company</th>
                <th class="text-left py-3 px-4 text-gray-300 font-medium">Created</th>
                <th class="text-right py-3 px-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={users()}>
                {(user) => (
                  <tr class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <div class="text-white font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div class="text-gray-400 text-sm flex items-center gap-1">
                            {user.emailVerified ? (
                              <span class="text-green-400" title="Verified">✓</span>
                            ) : (
                              <span class="text-gray-500" title="Not verified">○</span>
                            )}
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-gray-300 text-sm">
                        {user.phone || <span class="text-gray-500">No phone</span>}
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <span
                        class="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getRoleBadgeColor(user.role) + '20',
                          color: getRoleBadgeColor(user.role),
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <span
                        class="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getStatusBadgeColor(user.status) + '20',
                          color: getStatusBadgeColor(user.status),
                        }}
                      >
                        {user.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-gray-300 text-sm">
                      {user.company || <span class="text-gray-500">No company</span>}
                    </td>
                    <td class="py-3 px-4 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          class="px-3 py-1 text-sm text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Edit user"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          class="px-3 py-1 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete user"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Show when={totalPages() > 1}>
          <div class="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage() - 1))}
              disabled={currentPage() === 1}
              class="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              ← Previous
            </button>
            <span class="text-gray-400">
              Page {currentPage()} of {totalPages()}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages(), currentPage() + 1))}
              disabled={currentPage() === totalPages()}
              class="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </Show>
      </Show>

      {/* Create User Modal */}
      <Show when={showCreateModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div class="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                class="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser} class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData().firstName}
                    onInput={(e) => setFormData({ ...formData(), firstName: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData().lastName}
                    onInput={(e) => setFormData({ ...formData(), lastName: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData().email}
                  onInput={(e) => setFormData({ ...formData(), email: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData().password}
                  onInput={(e) => setFormData({ ...formData(), password: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                  <select
                    required
                    value={formData().role}
                    onChange={(e) => setFormData({ ...formData(), role: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="GC">General Contractor</option>
                    <option value="OWNER">Owner</option>
                    <option value="ARCHITECT">Architect</option>
                    <option value="SUB">Subcontractor</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData().status}
                    onChange={(e) => setFormData({ ...formData(), status: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  value={formData().company}
                  onInput={(e) => setFormData({ ...formData(), company: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData().phone}
                  onInput={(e) => setFormData({ ...formData(), phone: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  class="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors border border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: '#FF6600' }}
                  disabled={loading()}
                >
                  {loading() ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      {/* Edit User Modal */}
      <Show when={showEditModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div class="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                class="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateUser} class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData().firstName}
                    onInput={(e) => setFormData({ ...formData(), firstName: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData().lastName}
                    onInput={(e) => setFormData({ ...formData(), lastName: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData().email}
                  onInput={(e) => setFormData({ ...formData(), email: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Password <span class="text-gray-500 text-xs">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={formData().password}
                  onInput={(e) => setFormData({ ...formData(), password: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                  <select
                    required
                    value={formData().role}
                    onChange={(e) => setFormData({ ...formData(), role: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="GC">General Contractor</option>
                    <option value="OWNER">Owner</option>
                    <option value="ARCHITECT">Architect</option>
                    <option value="SUB">Subcontractor</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData().status}
                    onChange={(e) => setFormData({ ...formData(), status: e.currentTarget.value })}
                    class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Company</label>
                <input
                  type="text"
                  value={formData().company}
                  onInput={(e) => setFormData({ ...formData(), company: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData().phone}
                  onInput={(e) => setFormData({ ...formData(), phone: e.currentTarget.value })}
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  class="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors border border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: '#4BAAD8' }}
                  disabled={loading()}
                >
                  {loading() ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
}
