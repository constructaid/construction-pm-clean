/**
 * Project Folder Browser Component
 * Displays hierarchical folder structure based on ORG 162 MOCKINGBIRD ES template
 * Allows navigation, file upload, and document management
 */

import { createSignal, For, Show } from 'solid-js';

interface Folder {
  id: number;
  folderNumber: string;
  folderName: string;
  fileCount: number;
  subfolderCount: number;
  level: number;
}

interface ProjectFolderBrowserProps {
  projectId: number;
}

export default function ProjectFolderBrowser(props: ProjectFolderBrowserProps) {
  const [folders, setFolders] = createSignal<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = createSignal<Folder | null>(null);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<number>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [view, setView] = createSignal<'grid' | 'list'>('grid');

  // Fetch folders on mount
  fetchFolders();

  async function fetchFolders(parentId?: number) {
    try {
      setLoading(true);
      const url = parentId
        ? `/api/projects/${props.projectId}/folders?parentId=${parentId}`
        : `/api/projects/${props.projectId}/folders`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleFolder(folderId: number) {
    const expanded = new Set(expandedFolders());
    if (expanded.has(folderId)) {
      expanded.delete(folderId);
    } else {
      expanded.add(folderId);
    }
    setExpandedFolders(expanded);
  }

  function selectFolder(folder: Folder) {
    setSelectedFolder(folder);
  }

  function getFolderIcon(folder: Folder) {
    const icons: Record<string, string> = {
      '01': '📋',
      '02': '💰',
      '03': '🏢',
      '04': '📝',
      '05': '👷',
      '06': '📅',
      '07': '📐',
      '08': '📦',
      '09': '📸',
      '10': '📊',
      '11': '✅',
      '12': '❓',
      '13': '📄',
      '14': '🛡️',
      '15': '⏰',
      '16': '💵',
      '17': '🦺',
      '18': '🎫',
      '19': '📋',
    };
    return icons[folder.folderNumber] || '📁';
  }

  return (
    <div class="flex h-full">
      {/* Left Sidebar - Folder Tree */}
      <div class="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div class="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 class="text-lg font-heading font-light text-text-primary">Project Folders</h2>
          <p class="text-sm text-text-secondary mt-1">Standard Filing Structure</p>
        </div>

        <div class="p-4">
          <Show when={!loading()} fallback={<div class="text-center py-8 text-text-secondary">Loading folders...</div>}>
            <For each={folders()}>
              {(folder) => (
                <div class="mb-1">
                  <button
                    onClick={() => selectFolder(folder)}
                    class={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-between ${
                      selectedFolder()?.id === folder.id ? 'bg-ca-orange/10 border border-ca-orange' : ''
                    }`}
                  >
                    <div class="flex items-center space-x-3">
                      <span class="text-xl">{getFolderIcon(folder)}</span>
                      <div>
                        <p class="text-sm font-medium text-text-primary">
                          {folder.folderNumber} {folder.folderName}
                        </p>
                        <p class="text-xs text-text-secondary">
                          {folder.fileCount} files • {folder.subfolderCount} folders
                        </p>
                      </div>
                    </div>
                    <Show when={folder.subfolderCount > 0}>
                      <svg
                        class={`w-4 h-4 text-text-secondary transition-transform ${
                          expandedFolders().has(folder.id) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Show>
                  </button>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>

      {/* Right Content Area - Files */}
      <div class="flex-1 bg-background-light">
        <Show when={selectedFolder()} fallback={
          <div class="flex items-center justify-center h-full">
            <div class="text-center">
              <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p class="mt-4 text-lg font-medium text-text-primary">Select a folder to view documents</p>
              <p class="text-sm text-text-secondary mt-1">Choose a folder from the left sidebar</p>
            </div>
          </div>
        }>
          {/* Folder Header */}
          <div class="bg-white border-b border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-3">
                  <span class="text-3xl">{getFolderIcon(selectedFolder()!)}</span>
                  <div>
                    <h2 class="text-2xl font-heading font-light text-text-primary">
                      {selectedFolder()!.folderNumber} {selectedFolder()!.folderName}
                    </h2>
                    <p class="text-sm text-text-secondary mt-1">
                      {selectedFolder()!.fileCount} documents
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                {/* View Toggle */}
                <div class="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setView('grid')}
                    class={`px-3 py-1 rounded text-sm ${view() === 'grid' ? 'bg-white shadow' : 'text-text-secondary'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setView('list')}
                    class={`px-3 py-1 rounded text-sm ${view() === 'list' ? 'bg-white shadow' : 'text-text-secondary'}`}
                  >
                    List
                  </button>
                </div>

                <button class="px-4 py-2 border border-gray-300 text-text-primary rounded hover:bg-gray-50 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
                <button class="px-4 py-2 bg-ca-orange text-white rounded hover:bg-ca-orange-dark transition-all">
                  Upload Files
                </button>
              </div>
            </div>
          </div>

          {/* Files Content */}
          <div class="p-6">
            <Show
              when={view() === 'grid'}
              fallback={
                <div class="bg-white rounded-lg border border-gray-200">
                  <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Size</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Modified</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm text-text-primary">Sample Document.pdf</td>
                        <td class="px-6 py-4 text-sm text-text-secondary">PDF</td>
                        <td class="px-6 py-4 text-sm text-text-secondary">2.4 MB</td>
                        <td class="px-6 py-4 text-sm text-text-secondary">Oct 22, 2025</td>
                        <td class="px-6 py-4 text-right text-sm">
                          <button class="text-ca-orange hover:text-ca-orange-dark">Download</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            >
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Example file card */}
                <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-ca-md transition-all cursor-pointer">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <svg class="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-text-primary truncate">Sample Document.pdf</p>
                      <p class="text-xs text-text-secondary">2.4 MB • Oct 22, 2025</p>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
