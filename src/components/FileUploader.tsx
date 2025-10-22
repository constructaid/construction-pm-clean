/**
 * File Uploader Component
 * Upload files with folder organization and metadata
 */
import { createSignal, For, Show } from 'solid-js';

interface FileUploaderProps {
  projectId: string;
  folderType?: string;
  relatedEntity?: string;
  relatedEntityId?: number;
  onUploadComplete?: (files: any[]) => void;
  multiple?: boolean;
}

export default function FileUploader(props: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);
  const [uploading, setUploading] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const [folderType, setFolderType] = createSignal(props.folderType || 'general');
  const [description, setDescription] = createSignal('');
  const [error, setError] = createSignal('');

  const folderTypes = [
    { value: 'photos', label: 'Photos', icon: '📷' },
    { value: 'daily_reports', label: 'Daily Reports', icon: '📋' },
    { value: 'certificates_insurance', label: 'Certificates of Insurance', icon: '📄' },
    { value: 'contracts', label: 'Contracts', icon: '📝' },
    { value: 'submittals', label: 'Submittals', icon: '📦' },
    { value: 'shop_drawings', label: 'Shop Drawings', icon: '📐' },
    { value: 'rfis', label: 'RFIs', icon: '❓' },
    { value: 'change_orders', label: 'Change Orders', icon: '🔄' },
    { value: 'plans_specs', label: 'Plans & Specifications', icon: '🗺️' },
    { value: 'safety', label: 'Safety Documents', icon: '🦺' },
    { value: 'meeting_minutes', label: 'Meeting Minutes', icon: '📝' },
    { value: 'warranties', label: 'Warranties', icon: '✅' },
    { value: 'closeout', label: 'Closeout Documents', icon: '🏁' },
    { value: 'general', label: 'General', icon: '📁' }
  ];

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      setSelectedFiles(filesArray);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (selectedFiles().length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const uploadedFiles = [];

      for (let i = 0; i < selectedFiles().length; i++) {
        const file = selectedFiles()[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', props.projectId);
        formData.append('folderType', folderType());
        formData.append('description', description());

        if (props.relatedEntity) {
          formData.append('relatedEntity', props.relatedEntity);
        }
        if (props.relatedEntityId) {
          formData.append('relatedEntityId', props.relatedEntityId.toString());
        }

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        uploadedFiles.push(result.file);

        // Update progress
        setUploadProgress(Math.round(((i + 1) / selectedFiles().length) * 100));
      }

      // Success
      props.onUploadComplete?.(uploadedFiles);

      // Reset
      setSelectedFiles([]);
      setDescription('');
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>

      {/* Folder Selection */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Folder
        </label>
        <select
          value={folderType()}
          onChange={(e) => setFolderType(e.currentTarget.value)}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={!!props.folderType}
        >
          <For each={folderTypes}>
            {(folder) => (
              <option value={folder.value}>
                {folder.icon} {folder.label}
              </option>
            )}
          </For>
        </select>
      </div>

      {/* File Input */}
      <div class="mb-4">
        <label
          for="file-input"
          class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="mb-2 text-sm text-gray-500">
              <span class="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">
              PDF, DOC, XLS, JPG, PNG, DWG (MAX. 50MB)
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            class="hidden"
            onChange={handleFileSelect}
            multiple={props.multiple !== false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg,.dxf"
          />
        </label>
      </div>

      {/* Description */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description()}
          onInput={(e) => setDescription(e.currentTarget.value)}
          rows={2}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Add a description for the uploaded files..."
        />
      </div>

      {/* Selected Files List */}
      <Show when={selectedFiles().length > 0}>
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Selected Files ({selectedFiles().length})
          </h4>
          <div class="space-y-2">
            <For each={selectedFiles()}>
              {(file, index) => (
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center flex-1 min-w-0">
                    <svg class="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index())}
                    class="ml-3 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Upload Progress */}
      <Show when={uploading()}>
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress()}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={`width: ${uploadProgress()}%`}
            />
          </div>
        </div>
      </Show>

      {/* Error Message */}
      <Show when={error()}>
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-800">{error()}</p>
        </div>
      </Show>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={selectedFiles().length === 0 || uploading()}
        class="w-full py-2 px-4 rounded-lg font-medium text-white transition-colors"
        style={{
          'background-color': selectedFiles().length === 0 || uploading() ? '#9CA3AF' : '#3B82F6',
          cursor: selectedFiles().length === 0 || uploading() ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading() ? 'Uploading...' : `Upload ${selectedFiles().length} File${selectedFiles().length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
