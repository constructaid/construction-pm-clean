/**
 * Email Inbox Viewer Component
 *
 * Displays synced emails with filtering, search, and AI insights
 */

import { createSignal, createEffect, For, Show } from 'solid-js';
import { Mail, Paperclip, Search, Filter, RefreshCw, Brain, Calendar, User } from 'lucide-solid';

interface Email {
  id: number;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  snippet: string | null;
  receivedAt: string;
  isRead: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  aiProcessed: boolean;
  aiSummary: string | null;
  aiConfidence: number | null;
  aiExtractedData: any;
  linkedProjectId: number | null;
  provider: string;
}

export default function EmailInboxViewer() {
  const [emails, setEmails] = createSignal<Email[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filterUnread, setFilterUnread] = createSignal(false);
  const [filterWithAttachments, setFilterWithAttachments] = createSignal(false);
  const [selectedEmail, setSelectedEmail] = createSignal<Email | null>(null);

  createEffect(() => {
    loadEmails();
  });

  const loadEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emails/list');
      const data = await response.json();

      if (response.ok) {
        setEmails(data.emails);
      } else {
        setError(data.message || 'Failed to load emails');
      }
    } catch (err) {
      setError('Failed to load emails');
      console.error('Error loading emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = () => {
    let filtered = emails();

    // Apply search filter
    const query = searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (email) =>
          email.subject?.toLowerCase().includes(query) ||
          email.fromAddress?.toLowerCase().includes(query) ||
          email.snippet?.toLowerCase().includes(query)
      );
    }

    // Apply unread filter
    if (filterUnread()) {
      filtered = filtered.filter((email) => !email.isRead);
    }

    // Apply attachments filter
    if (filterWithAttachments()) {
      filtered = filtered.filter((email) => email.hasAttachments);
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryBadge = (email: Email) => {
    if (!email.aiProcessed || !email.aiExtractedData) return null;

    const category = email.aiExtractedData.category;
    const colors: Record<string, string> = {
      rfi: 'bg-blue-500/10 text-blue-400',
      submittal: 'bg-purple-500/10 text-purple-400',
      change_order: 'bg-orange-500/10 text-orange-400',
      invoice: 'bg-green-500/10 text-green-400',
      schedule: 'bg-yellow-500/10 text-yellow-400',
      drawing: 'bg-cyan-500/10 text-cyan-400',
      safety: 'bg-red-500/10 text-red-400',
      general: 'bg-gray-500/10 text-gray-400',
    };

    const colorClass = colors[category] || colors.general;

    return (
      <span class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
        {category.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Email List */}
      <div class="lg:col-span-2">
        <div class="rounded-lg border border-gray-800 bg-gray-900">
          {/* Header with Search and Filters */}
          <div class="border-b border-gray-800 p-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="relative flex-1">
                <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  class="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-ca-orange focus:outline-none focus:ring-1 focus:ring-ca-orange"
                />
              </div>
              <div class="flex items-center gap-2">
                <button
                  onClick={() => setFilterUnread(!filterUnread())}
                  class={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filterUnread()
                      ? 'bg-ca-orange text-white'
                      : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilterWithAttachments(!filterWithAttachments())}
                  class={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filterWithAttachments()
                      ? 'bg-ca-orange text-white'
                      : 'border border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Paperclip class="h-4 w-4" />
                </button>
                <button
                  onClick={loadEmails}
                  class="rounded-lg border border-gray-700 p-2 text-gray-300 transition hover:bg-gray-800"
                  title="Refresh"
                >
                  <RefreshCw class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Email List */}
          <div class="divide-y divide-gray-800">
            <Show
              when={!loading()}
              fallback={
                <div class="flex items-center justify-center py-12">
                  <RefreshCw class="h-6 w-6 animate-spin text-gray-400" />
                </div>
              }
            >
              <Show
                when={filteredEmails().length > 0}
                fallback={
                  <div class="py-12 text-center text-gray-400">
                    <Mail class="mx-auto mb-3 h-12 w-12 text-gray-600" />
                    <p>No emails found</p>
                  </div>
                }
              >
                <For each={filteredEmails()}>
                  {(email) => (
                    <button
                      onClick={() => setSelectedEmail(email)}
                      class={`w-full p-4 text-left transition hover:bg-gray-800/50 ${
                        selectedEmail()?.id === email.id ? 'bg-gray-800/50' : ''
                      }`}
                    >
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <Show when={!email.isRead}>
                              <div class="h-2 w-2 rounded-full bg-ca-orange" />
                            </Show>
                            <p class={`text-sm font-medium truncate ${email.isRead ? 'text-gray-300' : 'text-white'}`}>
                              {email.fromName || email.fromAddress}
                            </p>
                            {getCategoryBadge(email)}
                            <Show when={email.hasAttachments}>
                              <Paperclip class="h-3 w-3 text-gray-500" />
                            </Show>
                          </div>
                          <h3 class={`text-sm truncate ${email.isRead ? 'font-normal text-gray-400' : 'font-semibold text-white'}`}>
                            {email.subject || '(No subject)'}
                          </h3>
                          <Show when={email.aiSummary}>
                            <p class="mt-1 flex items-start gap-1 text-xs text-gray-500">
                              <Brain class="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span class="line-clamp-1">{email.aiSummary}</span>
                            </p>
                          </Show>
                          <Show when={!email.aiSummary && email.snippet}>
                            <p class="mt-1 text-xs text-gray-500 line-clamp-1">{email.snippet}</p>
                          </Show>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                          <span class="text-xs text-gray-500">{formatDate(email.receivedAt)}</span>
                          <Show when={email.aiProcessed && email.aiConfidence}>
                            <span class="text-xs text-gray-600">AI: {email.aiConfidence}%</span>
                          </Show>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      </div>

      {/* Email Detail Panel */}
      <div class="lg:col-span-1">
        <div class="rounded-lg border border-gray-800 bg-gray-900 p-6 sticky top-4">
          <Show
            when={selectedEmail()}
            fallback={
              <div class="text-center text-gray-500">
                <Mail class="mx-auto mb-3 h-12 w-12" />
                <p>Select an email to view details</p>
              </div>
            }
          >
            {(email) => (
              <div class="space-y-4">
                <div>
                  <h2 class="text-lg font-bold text-white">{email().subject || '(No subject)'}</h2>
                  {getCategoryBadge(email())}
                </div>

                <div class="space-y-2 text-sm">
                  <div class="flex items-start gap-2">
                    <User class="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p class="font-medium text-white">{email().fromName || 'Unknown'}</p>
                      <p class="text-gray-400">{email().fromAddress}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <Calendar class="h-4 w-4 text-gray-500" />
                    <p class="text-gray-400">{new Date(email().receivedAt).toLocaleString()}</p>
                  </div>

                  <Show when={email().hasAttachments}>
                    <div class="flex items-center gap-2">
                      <Paperclip class="h-4 w-4 text-gray-500" />
                      <p class="text-gray-400">{email().attachmentCount} attachment(s)</p>
                    </div>
                  </Show>
                </div>

                <Show when={email().aiProcessed && email().aiExtractedData}>
                  <div class="border-t border-gray-800 pt-4">
                    <div class="flex items-center gap-2 mb-3">
                      <Brain class="h-4 w-4 text-ca-orange" />
                      <h3 class="font-semibold text-white">AI Analysis</h3>
                      <span class="text-xs text-gray-500">({email().aiConfidence}% confident)</span>
                    </div>

                    <Show when={email().aiSummary}>
                      <p class="mb-3 text-sm text-gray-300">{email().aiSummary}</p>
                    </Show>

                    <div class="space-y-2 text-xs">
                      <Show when={email().aiExtractedData.projectName}>
                        <div>
                          <span class="text-gray-500">Project:</span>{' '}
                          <span class="text-white">{email().aiExtractedData.projectName}</span>
                        </div>
                      </Show>
                      <Show when={email().aiExtractedData.priority}>
                        <div>
                          <span class="text-gray-500">Priority:</span>{' '}
                          <span class="text-white">{email().aiExtractedData.priority}</span>
                        </div>
                      </Show>
                      <Show when={email().aiExtractedData.actionRequired !== undefined}>
                        <div>
                          <span class="text-gray-500">Action Required:</span>{' '}
                          <span class="text-white">{email().aiExtractedData.actionRequired ? 'Yes' : 'No'}</span>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                <div class="border-t border-gray-800 pt-4">
                  <p class="text-sm text-gray-300 whitespace-pre-wrap">{email().snippet}</p>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}
