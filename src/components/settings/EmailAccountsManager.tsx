/**
 * Email Accounts Manager Component
 *
 * Manages connected email accounts (Microsoft, Gmail)
 * Shows sync status, allows connecting/disconnecting accounts
 */

import { createSignal, onMount, For, Show } from 'solid-js';

interface ConnectedAccount {
  id: number;
  emailAddress: string;
  displayName: string | null;
  provider: 'microsoft' | 'gmail' | 'other';
  isActive: boolean;
  autoSync: boolean;
  syncFrequencyMinutes: number;
  lastSyncAt: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'error' | 'paused';
  lastSyncError: string | null;
  totalEmailsSynced: number;
  totalAttachmentsProcessed: number;
  hasReadPermission: boolean;
  hasSendPermission: boolean;
  hasCalendarPermission: boolean;
  createdAt: string;
}

export default function EmailAccountsManager() {
  const [accounts, setAccounts] = createSignal<ConnectedAccount[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [statusMessage, setStatusMessage] = createSignal<{ type: 'success' | 'error'; message: string } | null>(null);

  onMount(() => {
    loadAccounts();
    checkUrlParams();
  });

  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const errorParam = params.get('error');

    if (status === 'connected') {
      setStatusMessage({ type: 'success', message: 'Email account connected successfully!' });
    } else if (status === 'updated') {
      setStatusMessage({ type: 'success', message: 'Email account updated successfully!' });
    } else if (errorParam) {
      setStatusMessage({ type: 'error', message: `Failed to connect account: ${errorParam}` });
    }

    // Clear URL params
    if (status || errorParam) {
      window.history.replaceState({}, '', '/settings/email-accounts');
    }
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/oauth/accounts');
      const data = await response.json();

      if (response.ok) {
        setAccounts(data.accounts || []);
      } else {
        setError(data.message || 'Failed to load accounts');
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectMicrosoft = () => {
    window.location.href = '/api/oauth/microsoft/auth';
  };

  const connectGmail = () => {
    window.location.href = '/api/oauth/gmail/auth';
  };

  const disconnectAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/oauth/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage({ type: 'success', message: 'Account disconnected successfully' });
        loadAccounts();
      } else {
        setStatusMessage({ type: 'error', message: data.message || 'Failed to disconnect account' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', message: 'Failed to disconnect account' });
      console.error('Error disconnecting account:', err);
    }
  };

  const toggleAutoSync = async (accountId: number, currentValue: boolean) => {
    try {
      const response = await fetch('/api/oauth/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId, autoSync: !currentValue }),
      });

      const data = await response.json();

      if (response.ok) {
        loadAccounts();
      } else {
        setStatusMessage({ type: 'error', message: data.message || 'Failed to update settings' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', message: 'Failed to update settings' });
      console.error('Error updating settings:', err);
    }
  };

  const getProviderLogo = (provider: string) => {
    switch (provider) {
      case 'microsoft':
        return (
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'gmail':
        return (
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-600">
            <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        );
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'syncing':
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            <svg class="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Syncing
          </span>
        );
      case 'error':
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Error
          </span>
        );
      case 'paused':
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Paused
          </span>
        );
      default:
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Idle
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div class="space-y-6">
      <Show when={statusMessage()}>
        {(msg) => (
          <div
            class={`rounded-lg p-4 ${
              msg().type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}
          >
            <div class="flex items-center gap-2">
              <Show when={msg().type === 'success'} fallback={
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Show>
              <p class="text-sm font-medium">{msg().message}</p>
            </div>
          </div>
        )}
      </Show>

      {/* Connect Account Buttons */}
      <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h2 class="mb-4 text-lg font-semibold text-white">Connect Email Account</h2>
        <div class="flex flex-wrap gap-4">
          <button
            onClick={connectMicrosoft}
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Connect Microsoft / Outlook
          </button>
          <button
            onClick={connectGmail}
            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Connect Gmail
          </button>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div class="rounded-lg border border-gray-800 bg-gray-900">
        <div class="border-b border-gray-800 p-6">
          <h2 class="text-lg font-semibold text-white">Connected Accounts</h2>
        </div>
        <div class="p-6">
          <Show when={loading()}>
            <div class="flex items-center justify-center py-8">
              <svg class="h-6 w-6 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </Show>
          <Show when={!loading() && error()}>
            <div class="flex items-center justify-center gap-2 py-8 text-red-400">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error()}</p>
            </div>
          </Show>
          <Show when={!loading() && !error() && accounts().length === 0}>
            <div class="py-8 text-center text-gray-400">
              <svg class="mx-auto mb-3 h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>No email accounts connected yet</p>
              <p class="mt-1 text-sm">Connect an account above to get started</p>
            </div>
          </Show>
          <Show when={!loading() && !error() && accounts().length > 0}>
            <div class="space-y-4">
              <For each={accounts()}>
                {(account) => (
                  <div class="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex items-start gap-4">
                        {getProviderLogo(account.provider)}
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <h3 class="font-medium text-white">
                              {account.displayName || account.emailAddress}
                            </h3>
                            {getSyncStatusBadge(account.lastSyncStatus)}
                          </div>
                          <p class="mt-1 text-sm text-gray-400">{account.emailAddress}</p>
                          <div class="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>Provider: {account.provider}</span>
                            <span>Last sync: {formatDate(account.lastSyncAt)}</span>
                            <span>Emails synced: {account.totalEmailsSynced}</span>
                            <span>Attachments: {account.totalAttachmentsProcessed}</span>
                          </div>
                          <Show when={account.lastSyncError}>
                            <div class="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-400">
                              Error: {account.lastSyncError}
                            </div>
                          </Show>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <label class="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={account.autoSync}
                            onChange={() => toggleAutoSync(account.id, account.autoSync)}
                            class="peer sr-only"
                          />
                          <div class="peer h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500"></div>
                          <span class="ml-2 text-sm text-gray-400">Auto-sync</span>
                        </label>
                        <button
                          onClick={() => disconnectAccount(account.id)}
                          class="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                          title="Disconnect account"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
