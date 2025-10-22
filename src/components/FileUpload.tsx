/**
 * File Upload Component with Drag & Drop
 * Supports multiple file uploads with progress tracking
 * Validates file types and sizes
 */
import { createSignal, For, Show } from 'solid-js';

interface FileUploadProps {
  projectId: string;
  folderType: string;
  csiDivision?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  allowedTypes?: string[]; // e.g., ['application/pdf', 'image/*']
  maxSizeMB?: number;
}

interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export default function FileUpload(props: FileUploadProps) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [uploadingFiles, setUploadingFiles] = createSignal<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = createSignal<UploadedFile[]>([]);

  const maxSizeBytes = (props.maxSizeMB || 50) * 1024 * 1024; // Default 50MB

  // Handle drag events
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    handleFiles(files);
  };

  // Handle file input change
  const handleFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    handleFiles(files);
    input.value = ''; // Reset input
  };

  // Validate and process files
  const handleFiles = (files: File[]) => {
    const validFiles: UploadingFile[] = [];

    files.forEach(file => {
      // Validate file size
      if (file.size > maxSizeBytes) {
        validFiles.push({
          file,
          progress: 0,
          error: `File size exceeds ${props.maxSizeMB || 50}MB limit`
        });
        return;
      }

      // Validate file type
      if (props.allowedTypes && props.allowedTypes.length > 0) {
        const isAllowed = props.allowedTypes.some(type => {
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType);
          }
          return file.type === type;
        });

        if (!isAllowed) {
          validFiles.push({
            file,
            progress: 0,
            error: 'File type not allowed'
          });
          return;
        }
      }

      validFiles.push({ file, progress: 0 });
    });

    setUploadingFiles([...uploadingFiles(), ...validFiles]);

    // Upload valid files
    validFiles.forEach((uploadingFile, index) => {
      if (!uploadingFile.error) {
        uploadFile(uploadingFile, uploadingFiles().length + index);
      }
    });
  };

  // Upload file to server
  const uploadFile = async (uploadingFile: UploadingFile, index: number) => {
    const formData = new FormData();
    formData.append('file', uploadingFile.file);
    formData.append('projectId', props.projectId);
    formData.append('folderType', props.folderType);
    if (props.csiDivision) {
      formData.append('csiDivision', props.csiDivision);
    }

    try {
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          updateFileProgress(index, progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const uploaded: UploadedFile = {
            id: response.documentId,
            fileName: response.fileName,
            fileUrl: response.fileUrl,
            fileSize: response.fileSize,
            fileType: response.fileType
          };

          setUploadedFiles([...uploadedFiles(), uploaded]);
          removeUploadingFile(index);

          if (props.onUploadComplete) {
            props.onUploadComplete([uploaded]);
          }
        } else {
          updateFileError(index, 'Upload failed. Please try again.');
        }
      });

      xhr.addEventListener('error', () => {
        updateFileError(index, 'Network error. Please check your connection.');
      });

      xhr.open('POST', '/api/documents/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      updateFileError(index, 'Upload failed. Please try again.');
    }
  };

  // Update file progress
  const updateFileProgress = (index: number, progress: number) => {
    setUploadingFiles(uploadingFiles().map((f, i) =>
      i === index ? { ...f, progress } : f
    ));
  };

  // Update file error
  const updateFileError = (index: number, error: string) => {
    setUploadingFiles(uploadingFiles().map((f, i) =>
      i === index ? { ...f, error, progress: 0 } : f
    ));
  };

  // Remove uploading file from list
  const removeUploadingFile = (index: number) => {
    setUploadingFiles(uploadingFiles().filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div class="space-y-4">
      {/* Drop Zone */}
      <div
        class={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging()
            ? 'border-primary-orange bg-orange-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div class="flex flex-col items-center space-y-3">
          <svg
            class={`w-12 h-12 ${isDragging() ? 'text-primary-orange' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p class="text-text-primary font-medium">
              Drag and drop files here, or{' '}
              <label class="text-primary-orange hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  class="hidden"
                  onChange={handleFileInput}
                  accept={props.allowedTypes?.join(',')}
                />
              </label>
            </p>
            <p class="text-sm text-text-secondary mt-1">
              Maximum file size: {props.maxSizeMB || 50}MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      <Show when={uploadingFiles().length > 0}>
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-text-primary">Uploading...</h4>
          <For each={uploadingFiles()}>
            {(uploadingFile, index) => (
              <div class="bg-background-lighter rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-text-primary truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p class="text-xs text-text-secondary">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeUploadingFile(index())}
                    class="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <Show when={!uploadingFile.error} fallback={
                  <p class="text-xs text-red-600">{uploadingFile.error}</p>
                }>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-primary-orange h-2 rounded-full transition-all"
                      style={`width: ${uploadingFile.progress}%`}
                    ></div>
                  </div>
                  <p class="text-xs text-text-secondary mt-1">{uploadingFile.progress}%</p>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Uploaded Files */}
      <Show when={uploadedFiles().length > 0}>
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-text-primary">Uploaded Successfully</h4>
          <For each={uploadedFiles()}>
            {(file) => (
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-text-primary">{file.fileName}</p>
                    <p class="text-xs text-text-secondary">{formatFileSize(file.fileSize)}</p>
                  </div>
                </div>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-orange hover:underline text-sm"
                >
                  View
                </a>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
