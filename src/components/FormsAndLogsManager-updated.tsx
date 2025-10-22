/**
 * Forms and Logs Manager
 * Central hub for RFI, Submittals, and Change Orders with log views
 * Pre-populates forms with project information
 */
import { createSignal, Show, onMount } from 'solid-js';
import RFILog from './RFILog';
import SubmittalLog from './SubmittalLog';
import ChangeOrderLog from './ChangeOrderLog';
import RFIForm from './forms/RFIForm';
import SubmittalForm from './forms/SubmittalForm';
import ChangeOrderForm from './forms/ChangeOrderForm';

interface Project {
  id: number;
  name: string;
  projectNumber: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ownerId?: number;
  generalContractorId?: number;
}

interface FormsAndLogsManagerProps {
  projectId: number;
}

export default function FormsAndLogsManager(props: FormsAndLogsManagerProps) {
  const [activeTab, setActiveTab] = createSignal<'rfi' | 'submittal' | 'change-order'>('rfi');
  const [showForm, setShowForm] = createSignal(false);
  const [project, setProject] = createSignal<Project | null>(null);
  const [nextRFINumber, setNextRFINumber] = createSignal('RFI-001');
  const [nextSubmittalNumber, setNextSubmittalNumber] = createSignal('SUB-001');
  const [nextCONumber, setNextCONumber] = createSignal('CO-001');
  const [isLoadingProject, setIsLoadingProject] = createSignal(true);

  onMount(async () => {
    await loadProjectData();
    await loadNextNumbers();
  });

  const loadProjectData = async () => {
    setIsLoadingProject(true);
    try {
      const response = await fetch(`/api/projects/${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProject(data.project);
        }
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
    } finally {
      setIsLoadingProject(false);
    }
  };

  const loadNextNumbers = async () => {
    try {
      // Fetch existing RFIs to calculate next number
      const rfiResponse = await fetch(`/api/rfis?projectId=${props.projectId}`);
      if (rfiResponse.ok) {
        const rfiData = await rfiResponse.json();
        const rfis = rfiData.rfis || [];
        const nextNum = rfis.length + 1;
        setNextRFINumber(`RFI-${String(nextNum).padStart(3, '0')}`);
      }

      // Fetch existing Submittals
      const subResponse = await fetch(`/api/submittals?projectId=${props.projectId}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        const subs = subData.submittals || [];
        const nextNum = subs.length + 1;
        setNextSubmittalNumber(`SUB-${String(nextNum).padStart(3, '0')}`);
      }

      // Fetch existing Change Orders
      const coResponse = await fetch(`/api/change-orders?projectId=${props.projectId}`);
      if (coResponse.ok) {
        const coData = await coResponse.json();
        const cos = coData.changeOrders || [];
        const nextNum = cos.length + 1;
        setNextCONumber(`CO-${String(nextNum).padStart(3, '0')}`);
      }
    } catch (err) {
      console.error('Failed to load next numbers:', err);
    }
  };

  const handleCreateNewRFI = () => {
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

  const handleFormSuccess = async () => {
    setShowForm(false);
    // Reload next numbers
    await loadNextNumbers();
    // Reload the current log by refreshing
    window.location.reload();
  };

  const projectInfo = () => {
    const proj = project();
    if (!proj) return null;

    return {
      projectId: proj.id,
      projectName: proj.name,
      projectNumber: proj.projectNumber,
      projectAddress: [proj.address, proj.city, proj.state, proj.zipCode]
        .filter(Boolean)
        .join(', '),
    };
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

      {/* Loading Project Data */}
      <Show when={isLoadingProject()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-gray-600 mt-2">Loading project information...</p>
        </div>
      </Show>

      {/* Content Area */}
      <Show when={!isLoadingProject()}>
        <div class="min-h-screen">
          {/* Show Form or Log based on state */}
          <Show when={!showForm()}>
            {/* RFI Log */}
            <Show when={activeTab() === 'rfi'}>
              <RFILog
                projectId={props.projectId}
                projectName={project()?.name}
                onCreateNew={handleCreateNewRFI}
              />
            </Show>

            {/* Submittal Log */}
            <Show when={activeTab() === 'submittal'}>
              <SubmittalLog
                projectId={props.projectId}
                projectName={project()?.name}
                onCreateNew={handleCreateNewSubmittal}
              />
            </Show>

            {/* Change Order Log */}
            <Show when={activeTab() === 'change-order'}>
              <ChangeOrderLog
                projectId={props.projectId}
                projectName={project()?.name}
                onCreateNew={handleCreateNewCO}
              />
            </Show>
          </Show>

          {/* Create New Form */}
          <Show when={showForm() && project()}>
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

              {/* Project Info Header */}
              <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 class="text-sm font-semibold text-blue-900 mb-2">Project Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>
                    <span class="font-medium">Project:</span> {project()?.name}
                  </div>
                  <div>
                    <span class="font-medium">Project #:</span> {project()?.projectNumber}
                  </div>
                  <Show when={projectInfo()?.projectAddress}>
                    <div class="md:col-span-2">
                      <span class="font-medium">Location:</span> {projectInfo()?.projectAddress}
                    </div>
                  </Show>
                </div>
              </div>

              {/* RFI Form */}
              <Show when={activeTab() === 'rfi'}>
                <RFIForm
                  client:load
                  projectId={props.projectId}
                  projectInfo={projectInfo()!}
                  rfiNumber={nextRFINumber()}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelForm}
                />
              </Show>

              {/* Submittal Form */}
              <Show when={activeTab() === 'submittal'}>
                <SubmittalForm
                  client:load
                  projectId={props.projectId}
                  projectInfo={projectInfo()!}
                  submittalNumber={nextSubmittalNumber()}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelForm}
                />
              </Show>

              {/* Change Order Form */}
              <Show when={activeTab() === 'change-order'}>
                <ChangeOrderForm
                  client:load
                  projectId={props.projectId}
                  projectInfo={projectInfo()!}
                  changeOrderNumber={nextCONumber()}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelForm}
                />
              </Show>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
