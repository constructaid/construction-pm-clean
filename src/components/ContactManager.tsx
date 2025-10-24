/**
 * Contact Manager Component
 * Manages subcontractor, supplier, and vendor contacts for a project
 * Organized by CSI divisions
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
}

const ContactManager: Component<ContactManagerProps> = (props) => {
  const [contacts, setContacts] = createSignal<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = createSignal<Contact[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedDivision, setSelectedDivision] = createSignal<string>('all');
  const [selectedType, setSelectedType] = createSignal<string>('all');

  // Modal states
  const [showAddContact, setShowAddContact] = createSignal(false);
  const [showExtractModal, setShowExtractModal] = createSignal(false);
  const [selectedContact, setSelectedContact] = createSignal<Contact | null>(null);

  // Extraction preview
  const [extractionPreview, setExtractionPreview] = createSignal<any>(null);
  const [extracting, setExtracting] = createSignal(false);

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

  // Load contacts on mount
  createEffect(() => {
    loadContacts();
  });

  // Apply filters when search or filters change
  createEffect(() => {
    const search = searchTerm().toLowerCase();
    const division = selectedDivision();
    const type = selectedType();

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

    setFilteredContacts(filtered);
  });

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contacts?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to load contacts');
      const data = await response.json();
      setContacts(data);
      setFilteredContacts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getExtractionPreview = async () => {
    setExtracting(true);
    try {
      const response = await fetch(`/api/contacts/extract?projectId=${props.projectId}`);
      if (!response.ok) throw new Error('Failed to get preview');
      const data = await response.json();
      setExtractionPreview(data);
    } catch (err: any) {
      alert('Failed to generate preview: ' + err.message);
    } finally {
      setExtracting(false);
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

  return (
    <div class="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Contact Management</h2>
        <div class="flex gap-2">
          <button
            onClick={() => setShowExtractModal(true)}
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Extract from Communications
          </button>
          <button
            onClick={() => setShowAddContact(true)}
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <For each={filteredContacts()}>
                {(contact) => (
                  <tr class="hover:bg-gray-50">
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
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        contact.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contact.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        class="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
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

      {/* Extract Modal */}
      <Show when={showExtractModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-4">Extract Contacts from Communications</h3>

            <p class="text-gray-600 mb-4">
              This will scan all project communications (emails, RFIs, submittals, etc.) to automatically extract contact information.
            </p>

            <Show when={!extractionPreview()}>
              <button
                onClick={getExtractionPreview}
                disabled={extracting()}
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-4"
              >
                {extracting() ? 'Scanning...' : 'Preview Extraction'}
              </button>
            </Show>

            <Show when={extractionPreview()}>
              <div class="bg-gray-50 p-4 rounded mb-4">
                <p class="font-semibold">Preview Results:</p>
                <p>Emails scanned: {extractionPreview().emailsScanned}</p>
                <p>Contacts found: {extractionPreview().contactsFound}</p>
              </div>

              <div class="flex gap-2">
                <button
                  onClick={extractAndUpdateContacts}
                  disabled={extracting()}
                  class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {extracting() ? 'Extracting...' : 'Extract & Update Contacts'}
                </button>
                <button
                  onClick={() => {
                    setShowExtractModal(false);
                    setExtractionPreview(null);
                  }}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ContactManager;
