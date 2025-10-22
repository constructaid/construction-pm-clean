/**
 * Submittal Manager Component
 * Manages Submittal Log display and form creation
 */
import { createSignal, onMount, Show } from 'solid-js';
import SubmittalLog from './SubmittalLog';
import SubmittalForm from './forms/SubmittalForm';

interface SubmittalManagerProps {
  projectId: number;
}

export default function SubmittalManager(props: SubmittalManagerProps) {
  const [showForm, setShowForm] = createSignal(false);
  const [project, setProject] = createSignal<any>(null);
  const [nextSubmittalNumber, setNextSubmittalNumber] = createSignal('SUB-001');
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
      const response = await fetch(`/api/submittals?projectId=${props.projectId}`);
      if (response.ok) {
        const data = await response.json();
        const submittals = data.submittals || [];
        const nextNum = submittals.length + 1;
        setNextSubmittalNumber(`SUB-${String(nextNum).padStart(3, '0')}`);
      }
    } catch (err) {
      console.error('Failed to load next submittal number:', err);
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
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p class="text-gray-600 mt-2">Loading...</p>
        </div>
      </Show>

      <Show when={!isLoading() && !showForm()}>
        <SubmittalLog
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
            Back to Submittal Log
          </button>

          <div class="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 class="text-sm font-semibold text-purple-900 mb-2">Project Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-800">
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
                <span class="font-medium">Next Submittal #:</span> {nextSubmittalNumber()}
              </div>
            </div>
          </div>

          <SubmittalForm
            projectId={props.projectId}
            projectInfo={projectInfo()}
            submittalNumber={nextSubmittalNumber()}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Show>
    </div>
  );
}
