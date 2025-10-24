/**
 * Enhanced Contact Manager Component
 * Full-featured contact management with import/export, documents, communications, and saved filters
 */

import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Component } from 'solid-js';

interface Contact {
  id: number;
  fullName: string;
  company: string;
  email?: string;
  phoneMain?: string;
  phoneMobile?: string;
  title?: string;
  trade?: string;
  primaryDivision?: string;
  csiDivisions?: string[];
  status: string;
  isVerified: boolean;
  sourceType?: string;
  lastContactDate?: string;
  divisions?: DivisionContact[];
}

interface DivisionContact {
  id: number;
  csiDivision: string;
  divisionName: string;
  role: string;
  folderPath: string;
}

interface ContactManagerProps {
  projectId: number;
  userId?: number;
}

const ContactManagerEnhanced: Component<ContactManagerProps> = (props) => {
  const [contacts, setContacts] = createSignal<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = createSignal<Contact[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedDivision, setSelectedDivision] = createSignal<string>('all');
  const [selectedType, setSelectedType] = createSignal<string>('all');
  const [selectedStatus, setSelectedStatus] = createSignal<string>('all');
  const [verifiedOnly, setVerifiedOnly] = createSignal(false);

  // Modal states
  const [showAddContact, setShowAddContact] = createSignal(false);
  const [showExtractModal, setShowExtractModal] = createSignal(false);
  const [showImportModal, setShowImportModal] = createSignal(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = createSignal(false);
  const [selectedContact, setSelectedContact] = createSignal<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = createSignal(false);

  // Feature states
  const [extractionPreview, setExtractionPreview] = createSignal<any>(null);
  const [extracting, setExtracting] = createSignal(false);
  const [importData, setImportData] = createSignal<any[]>([]);
  const [importing, setImporting] = createSignal(false);
  const [savedFilters, setSavedFilters] = createSignal<any[]>([]);
  const [activeFilter, setActiveFilter] = createSignal<any>(null);

  // Sort state
  const [sortBy, setSortBy] = createSignal<string>('fullName');
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');

  const csiDivisions = [
    { code: '02', name: 'DEMO' },
    { code: '03', name: 'CONCRETE' },
    { code: '04', name: 'MASONRY' },
    { code: '05', name: 'METALS' },
    { code: '06', name: 'CARPENTRY' },
    { code: '07', name: 'THERMAL AND MOISTURE PROTECTION' },
    { code: '08', name: 'OPENINGS' },
    { code: '09', name: 'FINISHES' },
    { code: '10', name: 'SPECIALITIES' },
    { code: '12', name: 'FURNISHINGS' },
    { code: '22', name: 'PLUMBING' },
    { code: '23', name: 'HVAC' },
    { code: '26', name: 'ELECTRICAL VBC' },
    { code: '28', name: 'FIRE ALARM' },
    { code: '31', name: 'EARTHWORK' },
    { code: '32', name: 'EXTERIOR IMPROVEMENTS' },
  ];

  const contactTypes = [
    { value: 'subcontractor', label: 'Subcontractor' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'inspector', label: 'Inspector' },
  ];

  // Load contacts and saved filters on mount
  createEffect(() => {
    loadContacts();
    if (props.userId) {
      loadSavedFilters();
    }
  });

  // Apply filters when search or filters change
  createEffect(() => {
    applyFilters();
  });

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contacts?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to load contacts');
      const data = await response.json();
      setContacts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilters = async () => {
    try {
      const response = await fetch(`/api/saved-filters?userId=${props.userId}&type=contact&projectId=${props.projectId}`);
      if (response.ok) {
        const filters = await response.json();
        setSavedFilters(filters);
      }
    } catch (err) {
      console.error('Failed to load saved filters:', err);
    }
  };

  const applyFilters = () => {
    const search = searchTerm().toLowerCase();
    const division = selectedDivision();
    const type = selectedType();
    const status = selectedStatus();
    const verified = verifiedOnly();

    let filtered = contacts();

    // Text search
    if (search) {
      filtered = filtered.filter(c =>
        c.fullName.toLowerCase().includes(search) ||
        c.company.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.trade?.toLowerCase().includes(search)
      );
    }

    // Division filter
    if (division !== 'all') {
      filtered = filtered.filter(c =>
        c.csiDivisions?.includes(division) || c.primaryDivision === division
      );
    }

    // Type filter
    if (type !== 'all') {
      filtered = filtered.filter(c => c.status === type);
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    // Verified filter
    if (verified) {
      filtered = filtered.filter(c => c.isVerified);
    }

    // Sort
    const sortField = sortBy();
    const order = sortOrder();
    filtered.sort((a: any, b: any) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredContacts(filtered);
  };

  const exportContacts = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const params = new URLSearchParams({
        projectId: props.projectId.toString(),
        format,
      });

      if (selectedDivision() !== 'all') {
        params.append('division', selectedDivision());
      }
      if (selectedType() !== 'all') {
        params.append('type', selectedType());
      }

      const response = await fetch(`/api/contacts/export?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleFileImport = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      }).filter(obj => obj['Full Name'] && obj['Company']);

      setImportData(data);
    };
    reader.readAsText(file);
  };

  const performImport = async () => {
    setImporting(true);
    try {
      const contactsToImport = importData().map(row => ({
        fullName: row['Full Name'],
        firstName: row['First Name'],
        lastName: row['Last Name'],
        company: row['Company'],
        email: row['Email'],
        phoneMain: row['Phone (Main)'],
        phoneMobile: row['Phone (Mobile)'],
        title: row['Title'],
        trade: row['Trade'],
        csiDivisions: row['CSI Divisions']?.split(',').map((d: string) => d.trim()),
        primaryDivision: row['Primary Division'],
        address: row['Address'],
        city: row['City'],
        state: row['State'],
        zipCode: row['ZIP Code'],
        contactType: row['Contact Type'] || 'subcontractor',
      }));

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          contacts: contactsToImport,
          updateExisting: true,
        }),
      });

      if (!response.ok) throw new Error('Import failed');
      const result = await response.json();

      alert(`Import complete!\nCreated: ${result.results.created}\nUpdated: ${result.results.updated}\nSkipped: ${result.results.skipped}\nErrors: ${result.results.errors.length}`);

      setShowImportModal(false);
      setImportData([]);
      loadContacts();
    } catch (err: any) {
      alert('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const extractAndUpdateContacts = async () => {
    setExtracting(true);
    try {
      const response = await fetch(`/api/contacts/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          sources: ['all'],
          autoUpdate: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to extract contacts');
      const result = await response.json();

      alert(`Extraction complete!\n\nContacts created: ${result.results.contactsCreated}\nContacts updated: ${result.results.contactsUpdated}\nTotal extracted: ${result.results.contactsExtracted}`);

      setShowExtractModal(false);
      loadContacts();
    } catch (err: any) {
      alert('Failed to extract contacts: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const saveCurrentFilter = async (filterName: string) => {
    if (!props.userId) {
      alert('Must be logged in to save filters');
      return;
    }

    try {
      const response = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: props.userId,
          projectId: props.projectId,
          filterName,
          filterType: 'contact',
          filterCriteria: {
            search: searchTerm(),
            division: selectedDivision(),
            contactType: selectedType(),
            status: selectedStatus(),
            verified: verifiedOnly(),
          },
          sortBy: sortBy(),
          sortOrder: sortOrder(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save filter');

      alert('Filter saved successfully!');
      setShowSaveFilterModal(false);
      loadSavedFilters();
    } catch (err: any) {
      alert('Failed to save filter: ' + err.message);
    }
  };

  const applySavedFilter = async (filter: any) => {
    setActiveFilter(filter);
    const criteria = filter.filterCriteria;

    setSearchTerm(criteria.search || '');
    setSelectedDivision(criteria.division || 'all');
    setSelectedType(criteria.contactType || 'all');
    setSelectedStatus(criteria.status || 'all');
    setVerifiedOnly(criteria.verified || false);
    setSortBy(filter.sortBy || 'fullName');
    setSortOrder(filter.sortOrder || 'asc');

    // Track usage
    await fetch('/api/saved-filters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filterId: filter.id }),
    });
  };

  const deleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete contact');

      loadContacts();
    } catch (err: any) {
      alert('Failed to delete contact: ' + err.message);
    }
  };

  const viewContactDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };

  return (
    <div class="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Contact Management</h2>
        <div class="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            📥 Import
          </button>
          <button
            onClick={() => exportContacts('csv')}
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            📤 Export
          </button>
          <button
            onClick={() => setShowExtractModal(true)}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            🔍 Extract from Communications
          </button>
          <button
            onClick={() => setShowAddContact(true)}
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {/* Saved Filters */}
      <Show when={savedFilters().length > 0}>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Saved Filters:</label>
          <div class="flex gap-2 flex-wrap">
            <For each={savedFilters()}>
              {(filter) => (
                <button
                  onClick={() => applySavedFilter(filter)}
                  class={`px-3 py-1 rounded text-sm ${
                    activeFilter()?.id === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.filterName}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Advanced Filters */}
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <select
          value={selectedDivision()}
          onChange={(e) => setSelectedDivision(e.currentTarget.value)}
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Divisions</option>
          <For each={csiDivisions}>
            {(div) => <option value={div.code}>DIV {div.code} - {div.name}</option>}
          </For>
        </select>

        <select
          value={selectedType()}
          onChange={(e) => setSelectedType(e.currentTarget.value)}
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <For each={contactTypes}>
            {(type) => <option value={type.value}>{type.label}</option>}
          </For>
        </select>

        <select
          value={selectedStatus()}
          onChange={(e) => setSelectedStatus(e.currentTarget.value)}
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <label class="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <input
            type="checkbox"
            checked={verifiedOnly()}
            onChange={(e) => setVerifiedOnly(e.currentTarget.checked)}
            class="mr-2"
          />
          <span class="text-sm">Verified Only</span>
        </label>
      </div>

      {/* Filter Actions */}
      <div class="flex justify-between items-center mb-4">
        <div class="text-sm text-gray-600">
          Showing {filteredContacts().length} of {contacts().length} contacts
        </div>
        <div class="flex gap-2">
          <Show when={props.userId}>
            <button
              onClick={() => setShowSaveFilterModal(true)}
              class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              💾 Save Current Filter
            </button>
          </Show>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDivision('all');
              setSelectedType('all');
              setSelectedStatus('all');
              setVerifiedOnly(false);
              setActiveFilter(null);
            }}
            class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Contact List */}
      <Show when={loading()}>
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p class="mt-2 text-gray-600">Loading contacts...</p>
        </div>
      </Show>

      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error()}
        </div>
      </Show>

      <Show when={!loading() && !error()}>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => {
                      setSortBy('fullName');
                      setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc');
                    }}>
                  Name {sortBy() === 'fullName' && (sortOrder() === 'asc' ? '↑' : '↓')}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => {
                      setSortBy('company');
                      setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc');
                    }}>
                  Company {sortBy() === 'company' && (sortOrder() === 'asc' ? '↑' : '↓')}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <For each={filteredContacts()}>
                {(contact) => (
                  <tr class="hover:bg-gray-50 cursor-pointer" onClick={() => viewContactDetails(contact)}>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div>
                          <div class="text-sm font-medium text-gray-900">{contact.fullName}</div>
                          <div class="text-sm text-gray-500">{contact.title || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{contact.company}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{contact.trade || '-'}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-wrap gap-1">
                        <For each={contact.csiDivisions || []}>
                          {(div) => (
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                              {div}
                            </span>
                          )}
                        </For>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{contact.email || '-'}</div>
                      <div class="text-sm text-gray-500">{contact.phoneMain || '-'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        contact.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contact.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContact(contact);
                          setShowAddContact(true);
                        }}
                        class="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteContact(contact.id);
                        }}
                        class="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <Show when={filteredContacts().length === 0}>
            <div class="text-center py-8 text-gray-500">
              No contacts found. Try adjusting your filters or add a new contact.
            </div>
          </Show>
        </div>
      </Show>

      {/* Import Modal */}
      <Show when={showImportModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Import Contacts from CSV</h3>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select CSV file
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                class="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <Show when={importData().length > 0}>
              <div class="mb-4">
                <p class="text-sm text-gray-600 mb-2">
                  Found {importData().length} contacts to import
                </p>
                <div class="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                  <For each={importData().slice(0, 5)}>
                    {(row) => (
                      <div class="mb-1">
                        {row['Full Name']} - {row['Company']}
                      </div>
                    )}
                  </For>
                  <Show when={importData().length > 5}>
                    <div class="text-gray-500">...and {importData().length - 5} more</div>
                  </Show>
                </div>
              </div>
            </Show>

            <div class="flex gap-2">
              <Show when={importData().length > 0}>
                <button
                  onClick={performImport}
                  disabled={importing()}
                  class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {importing() ? 'Importing...' : 'Import Contacts'}
                </button>
              </Show>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData([]);
                }}
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Extract Modal */}
      <Show when={showExtractModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 class="text-xl font-bold mb-4">Extract Contacts from Communications</h3>

            <p class="text-gray-600 mb-4">
              This will scan all project communications (emails, RFIs, submittals, etc.) to automatically extract contact information.
            </p>

            <div class="flex gap-2">
              <button
                onClick={extractAndUpdateContacts}
                disabled={extracting()}
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {extracting() ? 'Extracting...' : 'Extract & Update Contacts'}
              </button>
              <button
                onClick={() => setShowExtractModal(false)}
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Save Filter Modal */}
      <Show when={showSaveFilterModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold mb-4">Save Current Filter</h3>

            <input
              type="text"
              placeholder="Filter name..."
              id="filter-name-input"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />

            <div class="flex gap-2">
              <button
                onClick={() => {
                  const input = document.getElementById('filter-name-input') as HTMLInputElement;
                  if (input.value) {
                    saveCurrentFilter(input.value);
                  }
                }}
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Filter
              </button>
              <button
                onClick={() => setShowSaveFilterModal(false)}
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ContactManagerEnhanced;
