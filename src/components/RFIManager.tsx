/**
 * RFI Manager Component
 * Manages RFI Log display and form creation
 */
import { createSignal, onMount, Show } from 'solid-js';
import RFILog from './RFILog';
import RFIForm from './forms/RFIForm';

interface RFIManagerProps {
  projectId: number;
}

export default function RFIManager(props: RFIManagerProps) {
  const [showForm, setShowForm] = createSignal(false);
  const [project, setProject] = createSignal<any>(null);
  const [nextRFINumber, setNextRFINumber] = createSignal('RFI-001');
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    await loadProjectData();
    await loadNextNumber();
  });

  const loadProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.project) {
          setProject(data.project);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextNumber = async () => {
    try {
      const response = await fetch(`/api/rfis?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        const rfis = data.rfis || [];
        const nextNum = rfis.length + 1;
        setNextRFINumber(`RFI-${String(nextNum).padStart(3, '0')}`);
      }
    } catch (err) {
      console.error('Failed to load next RFI number:', err);
    }
  };

  const handleCreateNew = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const handleSuccess = async () => {
    setShowForm(false);
    await loadNextNumber();
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
    <div>
      <Show when={isLoading()}>
        <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p class="text-gray-300 mt-2">Loading...</p>
        </div>
      </Show>

      <Show when={!isLoading() && !showForm()}>
        <RFILog
          projectId={props.projectId}
          projectName={project()?.name}
          onCreateNew={handleCreateNew}
        />
      </Show>

      <Show when={!isLoading() && showForm() && project()}>
        <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <button
            onClick={handleCancel}
            class="mb-6 flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to RFI Log
          </button>

          <div class="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h3 class="text-sm font-semibold text-blue-400 mb-2">Project Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
              <div>
                <span class="font-medium text-gray-400">Project:</span> {project()?.name}
              </div>
              <div>
                <span class="font-medium text-gray-400">Project #:</span> {project()?.projectNumber}
              </div>
              <Show when={projectInfo()?.projectAddress}>
                <div class="md:col-span-2">
                  <span class="font-medium text-gray-400">Location:</span> {projectInfo()?.projectAddress}
                </div>
              </Show>
              <div>
                <span class="font-medium text-gray-400">Next RFI #:</span> {nextRFINumber()}
              </div>
            </div>
          </div>

          <RFIForm
            projectId={props.projectId}
            projectInfo={projectInfo()}
            rfiNumber={nextRFINumber()}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Show>
    </div>
  );
}
