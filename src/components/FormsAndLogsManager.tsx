/**
 * Forms and Logs Manager
 * Central hub for RFI, Submittals, and Change Orders with log views
 */
import { createSignal, Show } from 'solid-js';
import RFILog from './RFILog';
import SubmittalLog from './SubmittalLog';
import ChangeOrderLog from './ChangeOrderLog';
import RFIForm from './forms/RFIForm';
import SubmittalForm from './forms/SubmittalForm';
import ChangeOrderForm from './forms/ChangeOrderForm';

interface FormsAndLogsManagerProps {
  projectId: number;
  projectName?: string;
}

export default function FormsAndLogsManager(props: FormsAndLogsManagerProps) {
  const [activeTab, setActiveTab] = createSignal<'rfi' | 'submittal' | 'change-order'>('rfi');
  const [showForm, setShowForm] = createSignal(false);
  const [nextRFINumber, setNextRFINumber] = createSignal('RFI-001');
  const [nextSubmittalNumber, setNextSubmittalNumber] = createSignal('SUB-001');
  const [nextCONumber, setNextCONumber] = createSignal('CO-001');

  const handleCreateNewRFI = () => {
    // In a real app, fetch the next available number from API
    setShowForm(true);
  };

  const handleCreateNewSubmittal = () => {
    setShowForm(true);
  };

  const handleCreateNewCO = () => {
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    // Reload the current log
    window.location.reload();
  };

  return (
    <div class="space-y-6">
      {/* Tab Navigation */}
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab('rfi');
                setShowForm(false);
              }}
              class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab() === 'rfi'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">📋</span>
                <span>RFI Log</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('submittal');
                setShowForm(false);
              }}
              class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab() === 'submittal'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">📦</span>
                <span>Submittal Log</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('change-order');
                setShowForm(false);
              }}
              class={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab() === 'change-order'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div class="flex items-center gap-2">
                <span class="text-lg">📝</span>
                <span>Change Order Log</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div class="min-h-screen">
        {/* Show Form or Log based on state */}
        <Show when={!showForm()}>
          {/* RFI Log */}
          <Show when={activeTab() === 'rfi'}>
            <RFILog
              projectId={props.projectId}
              projectName={props.projectName}
              onCreateNew={handleCreateNewRFI}
            />
          </Show>

          {/* Submittal Log */}
          <Show when={activeTab() === 'submittal'}>
            <SubmittalLog
              projectId={props.projectId}
              projectName={props.projectName}
              onCreateNew={handleCreateNewSubmittal}
            />
          </Show>

          {/* Change Order Log */}
          <Show when={activeTab() === 'change-order'}>
            <ChangeOrderLog
              projectId={props.projectId}
              projectName={props.projectName}
              onCreateNew={handleCreateNewCO}
            />
          </Show>
        </Show>

        {/* Create New Form */}
        <Show when={showForm()}>
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Back to Log Button */}
            <button
              onClick={handleCancelForm}
              class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to {activeTab() === 'rfi' ? 'RFI' : activeTab() === 'submittal' ? 'Submittal' : 'Change Order'} Log
            </button>

            {/* RFI Form */}
            <Show when={activeTab() === 'rfi'}>
              <RFIForm
                client:load
                projectId={props.projectId}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            </Show>

            {/* Submittal Form */}
            <Show when={activeTab() === 'submittal'}>
              <SubmittalForm
                client:load
                projectId={props.projectId}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            </Show>

            {/* Change Order Form */}
            <Show when={activeTab() === 'change-order'}>
              <ChangeOrderForm
                client:load
                projectId={props.projectId}
                onSuccess={handleFormSuccess}
                onCancel={handleCancelForm}
              />
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
