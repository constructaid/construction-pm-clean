/**
 * Email Accounts Manager Component
 *
 * Manages connected email accounts (Microsoft, Gmail)
 * Shows sync status, allows connecting/disconnecting accounts
 */

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAccounts();
    checkUrlParams();
  }, []);

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
        setAccounts(data.accounts);
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
            <Mail class="h-6 w-6 text-white" />
          </div>
        );
      case 'gmail':
        return (
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
            <Mail class="h-6 w-6 text-white" />
          </div>
        );
      default:
        return (
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-600">
            <Mail class="h-6 w-6 text-white" />
          </div>
        );
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'syncing':
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            <RefreshCw class="h-3 w-3 animate-spin" />
            Syncing
          </span>
        );
      case 'error':
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
            <AlertCircle class="h-3 w-3" />
            Error
          </span>
        );
      case 'paused':
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
            <Clock class="h-3 w-3" />
            Paused
          </span>
        );
      default:
        return (
          <span class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
            <CheckCircle class="h-3 w-3" />
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
      {statusMessage && (
        <div
          class={`rounded-lg p-4 ${
            statusMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          <div class="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle class="h-5 w-5" />
            ) : (
              <AlertCircle class="h-5 w-5" />
            )}
            <p class="text-sm font-medium">{statusMessage.message}</p>
          </div>
        </div>
      )}

      {/* Connect Account Buttons */}
      <div class="rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h2 class="mb-4 text-lg font-semibold text-white">Connect Email Account</h2>
        <div class="flex flex-wrap gap-4">
          <button
            onClick={connectMicrosoft}
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Mail class="h-4 w-4" />
            Connect Microsoft / Outlook
          </button>
          <button
            onClick={connectGmail}
            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <Mail class="h-4 w-4" />
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
          {loading ? (
            <div class="flex items-center justify-center py-8">
              <RefreshCw class="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div class="flex items-center justify-center gap-2 py-8 text-red-400">
              <AlertCircle class="h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : accounts.length === 0 ? (
            <div class="py-8 text-center text-gray-400">
              <Mail class="mx-auto mb-3 h-12 w-12 text-gray-600" />
              <p>No email accounts connected yet</p>
              <p class="mt-1 text-sm">Connect an account above to get started</p>
            </div>
          ) : (
            <div class="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  class="rounded-lg border border-gray-800 bg-gray-800/50 p-4"
                >
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
                        {account.lastSyncError && (
                          <div class="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-400">
                            Error: {account.lastSyncError}
                          </div>
                        )}
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
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
