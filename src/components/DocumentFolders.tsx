/**
 * Document Folders Component
 * Displays project folder structure with document management
 */
import { createSignal, createEffect, For, Show } from 'solid-js';
import { FolderType, getFolderDisplayName, getFolderIcon } from '../lib/db/schemas/Document';
import FileUpload from './FileUpload';

interface DocumentFoldersProps {
  projectId: string;
}

interface FolderStats {
  folderType: FolderType;
  documentCount: number;
  lastUpdated?: Date;
}

interface Document {
  _id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  folderType: FolderType;
  csiDivision?: string;
  status: string;
  uploadedBy: string;
  createdAt: Date;
}

export default function DocumentFolders(props: DocumentFoldersProps) {
  const [folders, setFolders] = createSignal<FolderStats[]>([]);
  const [selectedFolder, setSelectedFolder] = createSignal<FolderType | null>(null);
  const [documents, setDocuments] = createSignal<Document[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showUploadModal, setShowUploadModal] = createSignal(false);
  const [selectedCSI, setSelectedCSI] = createSignal('');

  // Fetch folder statistics
  createEffect(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/folders?projectId=${props.projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      // Set default folders if API fails
      setFolders(
        Object.values(FolderType).map(type => ({
          folderType: type,
          documentCount: 0
        }))
      );
    } finally {
      setLoading(false);
    }
  });

  // Fetch documents for selected folder
  createEffect(async () => {
    const folder = selectedFolder();
    if (!folder) return;

    try {
      const response = await fetch(
        `/api/documents?projectId=${props.projectId}&folderType=${folder}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  });

  // Handle folder click
  const handleFolderClick = (folderType: FolderType) => {
    setSelectedFolder(folderType);
  };

  // Handle back to folders
  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setDocuments([]);
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    setShowUploadModal(false);
    // Refresh documents
    const folder = selectedFolder();
    if (folder) {
      setSelectedFolder(null);
      setTimeout(() => setSelectedFolder(folder), 100);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Check if folder needs CSI division
  const needsCSI = (folderType: FolderType): boolean => {
    return folderType === FolderType.SUBMITTALS || folderType === FolderType.SHOP_DRAWINGS;
  };

  return (
    <div>
      {/* Folder Grid View */}
      <Show when={!selectedFolder()}>
        <Show when={loading()}>
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-orange border-t-transparent"></div>
            <p class="text-text-secondary mt-4">Loading folders...</p>
          </div>
        </Show>

        <Show when={!loading()}>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <For each={folders()}>
              {(folder) => (
                <button
                  onClick={() => handleFolderClick(folder.folderType)}
                  class="bg-white rounded-lg p-6 shadow-ca-sm hover:shadow-ca-md transition-shadow text-left border border-gray-200 hover:border-primary-orange"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="text-4xl">{getFolderIcon(folder.folderType)}</div>
                    <span class="bg-background-light text-text-primary text-sm font-semibold px-2 py-1 rounded">
                      {folder.documentCount}
                    </span>
                  </div>
                  <h3 class="font-semibold text-text-primary mb-1">
                    {getFolderDisplayName(folder.folderType)}
                  </h3>
                  <Show when={folder.lastUpdated}>
                    <p class="text-xs text-text-secondary">
                      Updated {formatDate(folder.lastUpdated!)}
                    </p>
                  </Show>
                </button>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Folder Detail View */}
      <Show when={selectedFolder()}>
        <div class="animate-slide-in">
          {/* Folder Header */}
          <div class="bg-white rounded-lg p-6 shadow-ca-sm mb-6">
            <button
              onClick={handleBackToFolders}
              class="flex items-center text-text-secondary hover:text-primary-orange mb-4 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Folders
            </button>

            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="text-5xl">{getFolderIcon(selectedFolder()!)}</div>
                <div>
                  <h2 class="text-2xl font-bold text-text-primary">
                    {getFolderDisplayName(selectedFolder()!)}
                  </h2>
                  <p class="text-text-secondary">
                    {documents().length} {documents().length === 1 ? 'document' : 'documents'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                class="px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                + Upload Document
              </button>
            </div>
          </div>

          {/* Upload Modal */}
          <Show when={showUploadModal()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-bold text-text-primary">Upload Documents</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* CSI Division Selector (for submittals/shop drawings) */}
                <Show when={needsCSI(selectedFolder()!)}>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-text-primary mb-2">
                      CSI Division (Required)
                    </label>
                    <select
                      value={selectedCSI()}
                      onChange={(e) => setSelectedCSI(e.currentTarget.value)}
                      class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                    >
                      <option value="">Select CSI Division...</option>
                      <option value="03">Division 03 - Concrete</option>
                      <option value="04">Division 04 - Masonry</option>
                      <option value="05">Division 05 - Metals</option>
                      <option value="22">Division 22 - Plumbing</option>
                      <option value="23">Division 23 - HVAC</option>
                      <option value="26">Division 26 - Electrical</option>
                    </select>
                  </div>
                </Show>

                <FileUpload
                  projectId={props.projectId}
                  folderType={selectedFolder()!}
                  csiDivision={selectedCSI()}
                  onUploadComplete={handleUploadComplete}
                  allowedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*']}
                  maxSizeMB={50}
                />

                <div class="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    class="px-4 py-2 border border-gray-300 text-text-primary rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadComplete}
                    class="px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Documents List */}
          <div class="bg-white rounded-lg shadow-ca-sm overflow-hidden">
            <Show
              when={documents().length > 0}
              fallback={
                <div class="text-center py-12 text-text-secondary">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="font-medium mb-2">No documents yet</p>
                  <p class="text-sm">Upload your first document to get started</p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    class="mt-4 px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    Upload Document
                  </button>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-background-light border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Document Name
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        CSI Division
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Size
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <For each={documents()}>
                      {(doc) => (
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-6 py-4">
                            <div class="flex items-center space-x-3">
                              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span class="text-sm font-medium text-text-primary">{doc.fileName}</span>
                            </div>
                          </td>
                          <td class="px-6 py-4">
                            <Show when={doc.csiDivision} fallback={<span class="text-text-secondary text-sm">—</span>}>
                              <span class="text-sm text-text-primary">Division {doc.csiDivision}</span>
                            </Show>
                          </td>
                          <td class="px-6 py-4">
                            <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                              {doc.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-sm text-text-secondary">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td class="px-6 py-4 text-sm text-text-secondary">
                            {formatDate(doc.createdAt)}
                          </td>
                          <td class="px-6 py-4">
                            <div class="flex items-center space-x-3">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary-orange hover:underline text-sm"
                              >
                                View
                              </a>
                              <button class="text-text-secondary hover:text-primary-orange text-sm">
                                Edit
                              </button>
                              <button class="text-text-secondary hover:text-red-600 text-sm">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
