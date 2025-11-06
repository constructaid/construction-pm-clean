import { createSignal, onMount, For, Show } from 'solid-js';

interface Module {
  id: number;
  moduleName: string;
  displayName: string;
  description: string;
  category: 'add_on' | 'premium';
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;
  features: string[];
  requiredTier: string;
  isActive: boolean;
  isBeta: boolean;
  icon: string;
  color: string;
  isEnabled: boolean;
  isTrialing: boolean;
  enabledAt: string | null;
  trialEndDate: string | null;
  daysRemainingInTrial: number | null;
}

interface Stats {
  enabledCount: number;
  trialingCount: number;
  monthlyTotal: number;
}

export default function ModuleManager() {
  const [modules, setModules] = createSignal<Module[]>([]);
  const [stats, setStats] = createSignal<Stats>({ enabledCount: 0, trialingCount: 0, monthlyTotal: 0 });
  const [loading, setLoading] = createSignal(true);
  const [actionLoading, setActionLoading] = createSignal<string | null>(null);
  const [message, setMessage] = createSignal<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = createSignal<'all' | 'add_on' | 'premium'>('all');

  const companyId = 1; // Mock company ID

  onMount(async () => {
    await loadModules();
  });

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/company/modules?companyId=${companyId}`);
      const data = await response.json();

      if (data.success) {
        setModules(data.data.modules);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      showMessage('error', 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableModule = async (moduleName: string) => {
    setActionLoading(moduleName);
    try {
      const response = await fetch('/api/company/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          moduleName,
          companyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        await loadModules();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      console.error('Error enabling module:', error);
      showMessage('error', 'Failed to enable module');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisableModule = async (moduleName: string) => {
    if (!confirm('Are you sure you want to disable this module? Your data will be preserved but the features will no longer be accessible.')) {
      return;
    }

    setActionLoading(moduleName);
    try {
      const response = await fetch('/api/company/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          moduleName,
          companyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        await loadModules();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      console.error('Error disabling module:', error);
      showMessage('error', 'Failed to disable module');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubscribe = async (moduleName: string) => {
    setActionLoading(moduleName);
    try {
      const response = await fetch('/api/company/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          moduleName,
          companyId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        await loadModules();
      } else {
        showMessage('error', data.error);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      showMessage('error', 'Failed to subscribe');
    } finally {
      setActionLoading(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const filteredModules = () => {
    const category = selectedCategory();
    if (category === 'all') return modules();
    return modules().filter(m => m.category === category);
  };

  return (
    <div class="space-y-6">
      {/* Alert Message */}
      <Show when={message()}>
        <div class={`p-4 rounded-lg ${
          message()?.type === 'success'
            ? 'bg-green-900/50 border border-green-700 text-green-300'
            : 'bg-red-900/50 border border-red-700 text-red-300'
        }`}>
          {message()?.text}
        </div>
      </Show>

      {/* Stats Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm mb-1">Active Modules</p>
              <p class="text-3xl font-bold text-white">{stats().enabledCount}</p>
            </div>
            <div class="text-4xl">📦</div>
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm mb-1">In Trial</p>
              <p class="text-3xl font-bold text-purple-400">{stats().trialingCount}</p>
            </div>
            <div class="text-4xl">🎁</div>
          </div>
        </div>

        <div class="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm mb-1">Monthly Total</p>
              <p class="text-3xl font-bold text-green-400">${stats().monthlyTotal.toFixed(2)}</p>
            </div>
            <div class="text-4xl">💳</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div class="flex gap-2 border-b border-gray-800">
        <button
          onClick={() => setSelectedCategory('all')}
          class={`px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory() === 'all'
              ? 'text-ca-orange border-b-2 border-ca-orange'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          All Modules
        </button>
        <button
          onClick={() => setSelectedCategory('add_on')}
          class={`px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory() === 'add_on'
              ? 'text-ca-orange border-b-2 border-ca-orange'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Add-On Modules
        </button>
        <button
          onClick={() => setSelectedCategory('premium')}
          class={`px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory() === 'premium'
              ? 'text-ca-orange border-b-2 border-ca-orange'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Premium Features
        </button>
      </div>

      {/* Module Cards */}
      <Show when={!loading()} fallback={
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ca-orange"></div>
          <p class="text-gray-400 mt-4">Loading modules...</p>
        </div>
      }>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredModules()}>
            {(module) => (
              <div
                class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-all"
                style={{ 'border-top': `3px solid ${module.color}` }}
              >
                {/* Module Header */}
                <div class="p-6 space-y-4">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="text-4xl">{module.icon}</div>
                      <div>
                        <h3 class="text-xl font-bold text-white flex items-center gap-2">
                          {module.displayName}
                          {module.isBeta && (
                            <span class="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">
                              BETA
                            </span>
                          )}
                        </h3>
                        <p class="text-sm text-gray-400 mt-1">{module.category.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p class="text-gray-400 text-sm leading-relaxed">
                    {module.description}
                  </p>

                  {/* Features */}
                  <div class="space-y-2">
                    <p class="text-xs font-semibold text-gray-500 uppercase">Features</p>
                    <ul class="space-y-1">
                      <For each={module.features.slice(0, 4)}>
                        {(feature) => (
                          <li class="text-sm text-gray-400 flex items-center gap-2">
                            <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {feature}
                          </li>
                        )}
                      </For>
                      {module.features.length > 4 && (
                        <li class="text-xs text-gray-500 ml-6">
                          +{module.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Pricing */}
                  <div class="pt-4 border-t border-gray-800">
                    <div class="flex items-baseline gap-2">
                      <span class="text-3xl font-bold text-white">${module.monthlyPrice}</span>
                      <span class="text-gray-400 text-sm">/month</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      or ${module.annualPrice}/year (save ${(module.monthlyPrice * 12 - module.annualPrice).toFixed(0)})
                    </p>
                  </div>

                  {/* Trial Info */}
                  {module.isEnabled && module.isTrialing && module.daysRemainingInTrial !== null && (
                    <div class="p-3 bg-purple-900/30 border border-purple-700 rounded">
                      <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div>
                          <p class="text-sm font-semibold text-purple-300">Trial Active</p>
                          <p class="text-xs text-purple-400">
                            {module.daysRemainingInTrial} days remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div class="pt-4">
                    {!module.isEnabled ? (
                      <button
                        onClick={() => handleEnableModule(module.moduleName)}
                        disabled={actionLoading() === module.moduleName}
                        class="w-full px-4 py-2 bg-ca-orange hover:bg-ca-orange-dark text-white rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading() === module.moduleName ? (
                          <span class="flex items-center justify-center gap-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Enabling...
                          </span>
                        ) : (
                          `Start ${module.trialDays}-Day Trial`
                        )}
                      </button>
                    ) : module.isTrialing ? (
                      <div class="flex gap-2">
                        <button
                          onClick={() => handleSubscribe(module.moduleName)}
                          disabled={actionLoading() === module.moduleName}
                          class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-all disabled:opacity-50"
                        >
                          Subscribe Now
                        </button>
                        <button
                          onClick={() => handleDisableModule(module.moduleName)}
                          disabled={actionLoading() === module.moduleName}
                          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 text-green-400">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="font-medium text-sm">Active</span>
                        </div>
                        <button
                          onClick={() => handleDisableModule(module.moduleName)}
                          disabled={actionLoading() === module.moduleName}
                          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-all disabled:opacity-50"
                        >
                          Disable
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Billing Notice */}
      <div class="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <div class="text-3xl">ℹ️</div>
          <div>
            <h3 class="text-white font-semibold mb-2">About Module Subscriptions</h3>
            <ul class="text-sm text-blue-300 space-y-1">
              <li>• All modules come with a free trial period (7-14 days depending on the module)</li>
              <li>• You can cancel anytime during the trial without being charged</li>
              <li>• After the trial, you'll be billed monthly unless you subscribe annually</li>
              <li>• Annual subscriptions save approximately 20% compared to monthly billing</li>
              <li>• Your data is preserved even if you disable a module</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
