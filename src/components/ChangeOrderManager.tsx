/**
 * Change Order Manager Component
 * Manages Change Order Log display and form creation
 */
import { createSignal, onMount, Show } from 'solid-js';
import ChangeOrderLog from './ChangeOrderLog';
import ChangeOrderForm from './forms/ChangeOrderForm';

interface ChangeOrderManagerProps {
  projectId: number;
}

export default function ChangeOrderManager(props: ChangeOrderManagerProps) {
  const [showForm, setShowForm] = createSignal(false);
  const [project, setProject] = createSignal<any>(null);
  const [nextCONumber, setNextCONumber] = createSignal('CO-001');
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
      const response = await fetch(`/api/change-orders?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        const changeOrders = data.changeOrders || [];
        const nextNum = changeOrders.length + 1;
        setNextCONumber(`CO-${String(nextNum).padStart(3, '0')}`);
      }
    } catch (err) {
      console.error('Failed to load next change order number:', err);
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
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p class="text-gray-600 mt-2">Loading...</p>
        </div>
      </Show>

      <Show when={!isLoading() && !showForm()}>
        <ChangeOrderLog
          projectId={props.projectId}
          projectName={project()?.name}
          onCreateNew={handleCreateNew}
        />
      </Show>

      <Show when={!isLoading() && showForm() && project()}>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={handleCancel}
            class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Change Order Log
          </button>

          <div class="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 class="text-sm font-semibold text-orange-900 mb-2">Project Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-orange-800">
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
              <div>
                <span class="font-medium">Next CO #:</span> {nextCONumber()}
              </div>
            </div>
          </div>

          <ChangeOrderForm
            projectId={props.projectId}
            projectInfo={projectInfo()}
            changeOrderNumber={nextCONumber()}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Show>
    </div>
  );
}
