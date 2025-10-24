/**
 * Contact Detail View Component
 * Shows complete contact information with activity timeline, documents, and communications
 */

import { createSignal, createEffect, For, Show } from 'solid-js';
import type { Component } from 'solid-js';

interface ContactDetailProps {
  contactId: number;
  onClose: () => void;
}

interface Contact {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  company: string;
  email?: string;
  phoneMain?: string;
  phoneMobile?: string;
  phoneOffice?: string;
  title?: string;
  trade?: string;
  specialty?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  csiDivisions?: string[];
  primaryDivision?: string;
  status: string;
  isVerified: boolean;
  sourceType?: string;
  notes?: string;
  lastContactDate?: string;
  createdAt?: string;
}

interface Communication {
  id: number;
  communicationType: string;
  direction: string;
  subject?: string;
  summary?: string;
  communicatedAt: string;
  requiresResponse?: boolean;
  respondedAt?: string;
}

interface Document {
  id: number;
  documentType: string;
  documentName: string;
  fileUrl: string;
  issueDate?: string;
  expirationDate?: string;
  status: string;
  isVerified: boolean;
}

const ContactDetailView: Component<ContactDetailProps> = (props) => {
  const [contact, setContact] = createSignal<Contact | null>(null);
  const [communications, setCommunications] = createSignal<Communication[]>([]);
  const [documents, setDocuments] = createSignal<Document[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [activeTab, setActiveTab] = createSignal<'info' | 'timeline' | 'documents'>('info');

  createEffect(() => {
    loadContactDetails();
    loadCommunications();
    loadDocuments();
  });

  const loadContactDetails = async () => {
    try {
      const response = await fetch(`/api/contacts/${props.contactId}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
      }
    } catch (err) {
      console.error('Failed to load contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunications = async () => {
    try {
      const response = await fetch(`/api/contacts/${props.contactId}/communications`);
      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch (err) {
      console.error('Failed to load communications:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/contacts/${props.contactId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'meeting': return '🤝';
      case 'text': return '💬';
      default: return '📝';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'insurance_cert': return '🛡️';
      case 'business_license': return '📜';
      case 'w9': return '📋';
      case 'bond': return '💼';
      case 'warranty': return '✅';
      default: return '📄';
    }
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-3xl font-bold">{contact()?.fullName || 'Loading...'}</h2>
              <p class="text-blue-100 mt-1">{contact()?.company}</p>
              <Show when={contact()?.title}>
                <p class="text-blue-200 text-sm mt-1">{contact()?.title}</p>
              </Show>
            </div>
            <button
              onClick={props.onClose}
              class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div class="flex gap-2 mt-4">
            <Show when={contact()?.email}>
              <a
                href={`mailto:${contact()?.email}`}
                class="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition"
              >
                📧 Email
              </a>
            </Show>
            <Show when={contact()?.phoneMain}>
              <a
                href={`tel:${contact()?.phoneMain}`}
                class="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition"
              >
                📞 Call
              </a>
            </Show>
            <Show when={contact()?.isVerified}>
              <span class="px-3 py-1 bg-green-500 bg-opacity-80 rounded text-sm">
                ✓ Verified
              </span>
            </Show>
          </div>
        </div>

        {/* Tabs */}
        <div class="border-b border-gray-200 bg-gray-50">
          <div class="flex">
            <button
              onClick={() => setActiveTab('info')}
              class={`px-6 py-3 font-medium text-sm ${
                activeTab() === 'info'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Contact Info
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              class={`px-6 py-3 font-medium text-sm ${
                activeTab() === 'timeline'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Activity Timeline ({communications().length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              class={`px-6 py-3 font-medium text-sm ${
                activeTab() === 'documents'
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Documents ({documents().length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-y-auto p-6">
          <Show when={loading()}>
            <div class="text-center py-12">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p class="mt-2 text-gray-600">Loading...</p>
            </div>
          </Show>

          {/* Info Tab */}
          <Show when={!loading() && activeTab() === 'info' && contact()}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label class="text-sm font-medium text-gray-500">Email</label>
                    <p class="text-gray-900">{contact()?.email || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Phone (Main)</label>
                    <p class="text-gray-900">{contact()?.phoneMain || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Phone (Mobile)</label>
                    <p class="text-gray-900">{contact()?.phoneMobile || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Phone (Office)</label>
                    <p class="text-gray-900">{contact()?.phoneOffice || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Business Information</h3>
                <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label class="text-sm font-medium text-gray-500">Trade</label>
                    <p class="text-gray-900">{contact()?.trade || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Specialty</label>
                    <p class="text-gray-900">{contact()?.specialty || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">CSI Divisions</label>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <For each={contact()?.csiDivisions || []}>
                        {(div) => (
                          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                            DIV {div}
                          </span>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Address</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <p class="text-gray-900">{contact()?.address || '-'}</p>
                  <Show when={contact()?.city || contact()?.state || contact()?.zipCode}>
                    <p class="text-gray-900 mt-1">
                      {[contact()?.city, contact()?.state, contact()?.zipCode].filter(Boolean).join(', ')}
                    </p>
                  </Show>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
                <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label class="text-sm font-medium text-gray-500">Last Contact</label>
                    <p class="text-gray-900">{formatDate(contact()?.lastContactDate)}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Added</label>
                    <p class="text-gray-900">{formatDate(contact()?.createdAt)}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Source</label>
                    <p class="text-gray-900">{contact()?.sourceType || '-'}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-500">Status</label>
                    <p class="text-gray-900 capitalize">{contact()?.status}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <Show when={contact()?.notes}>
                <div class="md:col-span-2">
                  <h3 class="text-lg font-semibold text-gray-800 mb-4">Notes</h3>
                  <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p class="text-gray-900 whitespace-pre-wrap">{contact()?.notes}</p>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Timeline Tab */}
          <Show when={activeTab() === 'timeline'}>
            <div class="max-w-3xl mx-auto">
              <h3 class="text-lg font-semibold text-gray-800 mb-6">Communication History</h3>

              <Show when={communications().length === 0}>
                <div class="text-center py-12 text-gray-500">
                  No communications recorded yet.
                </div>
              </Show>

              <div class="relative">
                {/* Timeline line */}
                <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <For each={communications()}>
                  {(comm) => (
                    <div class="relative flex gap-4 mb-6">
                      {/* Timeline dot */}
                      <div class="flex-shrink-0 w-16 flex justify-center">
                        <div class={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                          comm.direction === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {getCommunicationIcon(comm.communicationType)}
                        </div>
                      </div>

                      {/* Content */}
                      <div class="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div class="flex justify-between items-start mb-2">
                          <div>
                            <h4 class="font-semibold text-gray-900">
                              {comm.subject || comm.communicationType.charAt(0).toUpperCase() + comm.communicationType.slice(1)}
                            </h4>
                            <p class="text-sm text-gray-600 capitalize">
                              {comm.direction} {comm.communicationType}
                            </p>
                          </div>
                          <span class="text-xs text-gray-500">
                            {formatDateTime(comm.communicatedAt)}
                          </span>
                        </div>

                        <Show when={comm.summary}>
                          <p class="text-gray-700 text-sm">{comm.summary}</p>
                        </Show>

                        <Show when={comm.requiresResponse && !comm.respondedAt}>
                          <div class="mt-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded inline-block text-xs text-yellow-800">
                            ⚠️ Awaiting Response
                          </div>
                        </Show>

                        <Show when={comm.respondedAt}>
                          <div class="mt-2 px-3 py-1 bg-green-50 border border-green-200 rounded inline-block text-xs text-green-800">
                            ✓ Responded on {formatDate(comm.respondedAt)}
                          </div>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Documents Tab */}
          <Show when={activeTab() === 'documents'}>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-6">Documents</h3>

              <Show when={documents().length === 0}>
                <div class="text-center py-12 text-gray-500">
                  No documents uploaded yet.
                </div>
              </Show>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <For each={documents()}>
                  {(doc) => (
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div class="flex items-start gap-3">
                        <div class="text-3xl">
                          {getDocumentIcon(doc.documentType)}
                        </div>
                        <div class="flex-1">
                          <h4 class="font-semibold text-gray-900">{doc.documentName}</h4>
                          <p class="text-sm text-gray-600 capitalize">
                            {doc.documentType.replace('_', ' ')}
                          </p>

                          <div class="mt-2 space-y-1 text-xs text-gray-500">
                            <Show when={doc.issueDate}>
                              <p>Issued: {formatDate(doc.issueDate)}</p>
                            </Show>
                            <Show when={doc.expirationDate}>
                              <p class={new Date(doc.expirationDate) < new Date() ? 'text-red-600 font-semibold' : ''}>
                                Expires: {formatDate(doc.expirationDate)}
                                {new Date(doc.expirationDate) < new Date() && ' (EXPIRED)'}
                              </p>
                            </Show>
                          </div>

                          <div class="mt-3 flex gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </a>
                            <Show when={doc.isVerified}>
                              <span class="text-green-600 text-sm">✓ Verified</span>
                            </Show>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailView;
