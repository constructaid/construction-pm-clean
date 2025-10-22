/**
 * File Browser Component
 * Browse, search, and download files organized by folders
 */
import { createSignal, createEffect, For, Show } from 'solid-js';

interface FileBrowserProps {
  projectId: string;
  folderType?: string;
  showUploader?: boolean;
}

export default function FileBrowser(props: FileBrowserProps) {
  const [files, setFiles] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [selectedFolder, setSelectedFolder] = createSignal(props.folderType || 'all');
  const [searchTerm, setSearchTerm] = createSignal('');
  const [sortBy, setSortBy] = createSignal<'name' | 'date' | 'size'>('date');

  const folderTypes = [
    { value: 'all', label: 'All Files', icon: '📁', count: 0 },
    { value: 'photos', label: 'Photos', icon: '📷', count: 0 },
    { value: 'daily_reports', label: 'Daily Reports', icon: '📋', count: 0 },
    { value: 'certificates_insurance', label: 'Insurance Certificates', icon: '📄', count: 0 },
    { value: 'contracts', label: 'Contracts', icon: '📝', count: 0 },
    { value: 'submittals', label: 'Submittals', icon: '📦', count: 0 },
    { value: 'shop_drawings', label: 'Shop Drawings', icon: '📐', count: 0 },
    { value: 'rfis', label: 'RFIs', icon: '❓', count: 0 },
    { value: 'change_orders', label: 'Change Orders', icon: '🔄', count: 0 },
    { value: 'plans_specs', label: 'Plans & Specs', icon: '🗺️', count: 0 },
    { value: 'safety', label: 'Safety', icon: '🦺', count: 0 },
    { value: 'meeting_minutes', label: 'Meeting Minutes', icon: '📝', count: 0 },
    { value: 'warranties', label: 'Warranties', icon: '✅', count: 0 },
    { value: 'closeout', label: 'Closeout', icon: '🏁', count: 0 },
    { value: 'general', label: 'General', icon: '📁', count: 0 }
  ];

  // Fetch files
  createEffect(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        projectId: props.projectId
      });

      if (selectedFolder() !== 'all') {
        params.append('folderType', selectedFolder());
      }

      const response = await fetch(`/api/files?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  });

  const filteredAndSortedFiles = () => {
    let result = files();

    // Search filter
    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      result = result.filter(file =>
        file.originalName.toLowerCase().includes(term) ||
        (file.description && file.description.toLowerCase().includes(term))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy()) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          return b.fileSize - a.fileSize;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('dwg') || mimeType.includes('dxf')) return '📐';
    return '📎';
  };

  const handleDownload = async (file: any) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Project Files</h2>

        {/* Search and Sort */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex">
        {/* Folder Sidebar */}
        <div class="w-64 border-r border-gray-200 p-4 max-h-96 overflow-y-auto">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Folders</h3>
          <div class="space-y-1">
            <For each={folderTypes}>
              {(folder) => (
                <button
                  onClick={() => setSelectedFolder(folder.value)}
                  class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFolder() === folder.value
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span class="mr-2">{folder.icon}</span>
                  {folder.label}
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Files List */}
        <div class="flex-1 p-6">
          <Show
            when={!loading()}
            fallback={
              <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-4 text-gray-600">Loading files...</p>
              </div>
            }
          >
            <Show
              when={filteredAndSortedFiles().length > 0}
              fallback={
                <div class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  <h3 class="mt-4 text-lg font-medium text-gray-900">No files found</h3>
                  <p class="mt-2 text-gray-500">Upload files to get started</p>
                </div>
              }
            >
              <div class="space-y-2">
                <For each={filteredAndSortedFiles()}>
                  {(file) => (
                    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div class="flex items-center flex-1 min-w-0">
                        <span class="text-2xl mr-3 flex-shrink-0">{getFileIcon(file.mimeType)}</span>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                          <div class="flex items-center space-x-4 mt-1">
                            <span class="text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
                            <span class="text-xs text-gray-500">{formatDate(file.createdAt)}</span>
                            <Show when={file.description}>
                              <span class="text-xs text-gray-600 truncate max-w-xs">{file.description}</span>
                            </Show>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleDownload(file)}
                          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>

              <div class="mt-4 text-sm text-gray-500 text-center">
                Showing {filteredAndSortedFiles().length} of {files().length} files
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}
