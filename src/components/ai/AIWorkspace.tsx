/**
 * AI Workspace Component
 * Main interface for project-specific AI assistant
 */

import { createSignal, createEffect, Show, For, onMount } from 'solid-js';

interface Project {
  id: number;
  name: string;
  status: string;
}

interface Document {
  id: number;
  fileName: string;
  fileType: string;
  category: string;
  uploadedAt: string;
  isIndexed: boolean;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: Array<{ reference: string; excerpt?: string }>;
  actions?: Array<{ type: string; data: any }>;
  attachments?: Array<{ fileName: string; fileType: string; fileSize: number; fileUrl?: string }>;
}

interface AIWorkspaceProps {
  projectId: number | null;
}

export default function AIWorkspace(props: AIWorkspaceProps) {
  // State
  const [selectedProjectId, setSelectedProjectId] = createSignal<number | null>(props.projectId);
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [documents, setDocuments] = createSignal<Document[]>([]);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [aiStatus, setAiStatus] = createSignal<'online' | 'offline'>('offline');
  const [activeTab, setActiveTab] = createSignal<'chat' | 'documents' | 'settings'>('chat');
  const [uploadProgress, setUploadProgress] = createSignal<number>(0);
  const [isUploading, setIsUploading] = createSignal(false);
  const [attachedFiles, setAttachedFiles] = createSignal<File[]>([]);
  const [isDragging, setIsDragging] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;
  let chatFileInputRef: HTMLInputElement | undefined;
  let messagesEndRef: HTMLDivElement | undefined;

  // Load projects on mount
  onMount(async () => {
    await loadProjects();
    await checkAIStatus();

    // If projectId provided, load it
    if (selectedProjectId()) {
      await loadProjectDocuments();
      await loadConversationHistory();
    }
  });

  // Watch for project changes
  createEffect(async () => {
    const projectId = selectedProjectId();
    if (projectId) {
      await loadProjectDocuments();
      await loadConversationHistory();
    }
  });

  // Auto-scroll messages
  createEffect(() => {
    if (messages().length > 0 && messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Load projects
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects?userId=1');
      const data = await response.json();
      setProjects(data.projects || []);

      // If no project selected, select first one
      if (!selectedProjectId() && data.projects && data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  // Check AI status
  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/chat');
      const data = await response.json();
      setAiStatus(data.status === 'online' ? 'online' : 'offline');
    } catch (error) {
      setAiStatus('offline');
    }
  };

  // Load project documents
  const loadProjectDocuments = async () => {
    const projectId = selectedProjectId();
    if (!projectId) return;

    try {
      const response = await fetch(`/api/ai/documents?projectId=${projectId}`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  };

  // Load conversation history
  const loadConversationHistory = async () => {
    const projectId = selectedProjectId();
    if (!projectId) return;

    try {
      const response = await fetch(`/api/ai/conversations?projectId=${projectId}`);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } else {
        // Welcome message
        setMessages([{
          id: 0,
          role: 'assistant',
          content: `Welcome to the AI Workspace for ${projects().find(p => p.id === projectId)?.name || 'this project'}! I can help you with:\n\n• Analyzing RFIs, change orders, and estimates\n• Reviewing documents and drawings\n• Creating tasks and tracking action items\n• Answering questions about specs and codes\n\nWhat would you like to work on?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    const message = input().trim();
    const files = attachedFiles();
    if ((!message && files.length === 0) || loading() || !selectedProjectId()) return;

    // Prepare attachments metadata
    const attachmentsMetadata = files.map(f => ({
      fileName: f.name,
      fileType: f.type,
      fileSize: f.size
    }));

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: message || '📎 Attached files for analysis',
      timestamp: new Date(),
      attachments: attachmentsMetadata
    };
    setMessages([...messages(), userMessage]);
    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    try {
      // If files attached, upload them first
      let uploadedFileUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectId', selectedProjectId()!.toString());

          const uploadResponse = await fetch('/api/ai/documents/upload', {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadResponse.json();
          if (uploadData.success && uploadData.document) {
            uploadedFileUrls.push(uploadData.document.fileName);
          }
        }
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          projectId: selectedProjectId(),
          conversationHistory: messages().slice(-10), // Last 10 messages for context
          attachedFiles: uploadedFileUrls // Send file names for AI to reference
        })
      });

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.content || data.message || 'Sorry, I encountered an error.',
        timestamp: new Date(),
        sources: data.sources,
        actions: data.actions
      };
      setMessages([...messages(), aiMessage]);

      // Save to database
      await saveConversation();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages([...messages(), errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Save conversation to database
  const saveConversation = async () => {
    const projectId = selectedProjectId();
    if (!projectId) return;

    try {
      await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          messages: messages()
        })
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0 || !selectedProjectId()) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', selectedProjectId()!.toString());

      try {
        const response = await fetch('/api/ai/documents/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        setUploadProgress(((i + 1) / files.length) * 100);

        if (data.success) {
          // Reload documents
          await loadProjectDocuments();
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef) fileInputRef.value = '';
  };

  // Handle chat file attachment
  const handleChatFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setAttachedFiles([...attachedFiles(), ...newFiles]);

    // Clear input
    if (chatFileInputRef) chatFileInputRef.value = '';
  };

  // Remove attached file
  const removeAttachedFile = (index: number) => {
    setAttachedFiles(attachedFiles().filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles([...attachedFiles(), ...newFiles]);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Quick actions
  const quickActions = [
    { label: 'Analyze Latest RFI', icon: '❓', action: () => setInput('Analyze the most recent RFI and draft a response') },
    { label: 'Review Change Orders', icon: '💰', action: () => setInput('Review all pending change orders and calculate budget impact') },
    { label: 'Check Schedule', icon: '📅', action: () => setInput('Review the project schedule and identify any potential delays') },
    { label: 'Summarize Documents', icon: '📄', action: () => setInput('Summarize all documents uploaded today') },
  ];

  return (
    <div class="h-screen flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div class="bg-gray-900 border-b border-gray-800 p-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold text-white">AI Workspace</h1>
            <div class="flex items-center gap-2">
              <div class={`w-2 h-2 rounded-full ${aiStatus() === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span class="text-sm text-gray-400">
                {aiStatus() === 'online' ? 'AI Online' : 'AI Offline'}
              </span>
            </div>
          </div>

          {/* Project Selector */}
          <div class="flex items-center gap-4">
            <label class="text-sm text-gray-400">Project:</label>
            <select
              class="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              value={selectedProjectId() || ''}
              onChange={(e) => setSelectedProjectId(parseInt(e.currentTarget.value))}
            >
              <option value="">Select Project...</option>
              <For each={projects()}>
                {(project) => (
                  <option value={project.id}>{project.name}</option>
                )}
              </For>
            </select>
          </div>
        </div>
      </div>

      <Show when={!selectedProjectId()}>
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-6xl mb-4">🤖</div>
            <h2 class="text-2xl font-semibold mb-2">Welcome to AI Workspace</h2>
            <p class="text-gray-400">Select a project to get started</p>
          </div>
        </div>
      </Show>

      <Show when={selectedProjectId()}>
        <div class="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div class="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Tabs */}
            <div class="flex border-b border-gray-800">
              <button
                class={`flex-1 px-4 py-3 text-sm font-medium ${activeTab() === 'chat' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('chat')}
              >
                💬 Chat
              </button>
              <button
                class={`flex-1 px-4 py-3 text-sm font-medium ${activeTab() === 'documents' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('documents')}
              >
                📄 Docs ({documents().length})
              </button>
              <button
                class={`flex-1 px-4 py-3 text-sm font-medium ${activeTab() === 'settings' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Tab Content */}
            <div class="flex-1 overflow-y-auto p-4">
              <Show when={activeTab() === 'chat'}>
                <div class="space-y-2">
                  <h3 class="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
                  <For each={quickActions}>
                    {(action) => (
                      <button
                        class="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                        onClick={() => action.action()}
                      >
                        <span class="mr-2">{action.icon}</span>
                        {action.label}
                      </button>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={activeTab() === 'documents'}>
                <div class="space-y-3">
                  <button
                    class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors flex items-center justify-center gap-2"
                    onClick={() => fileInputRef?.click()}
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Documents
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.dwg,.jpg,.png"
                    class="hidden"
                    onChange={handleFileUpload}
                  />

                  <Show when={isUploading()}>
                    <div class="bg-gray-800 rounded p-3">
                      <div class="flex justify-between text-sm mb-1">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress())}%</span>
                      </div>
                      <div class="w-full bg-gray-700 rounded-full h-2">
                        <div
                          class="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress()}%` }}
                        />
                      </div>
                    </div>
                  </Show>

                  <div class="space-y-2">
                    <For each={documents()}>
                      {(doc) => (
                        <div class="bg-gray-800 rounded p-3 hover:bg-gray-700 transition-colors">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex-1 min-w-0">
                              <div class="text-sm font-medium truncate">{doc.fileName}</div>
                              <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs px-2 py-0.5 bg-gray-700 rounded">{doc.category}</span>
                                <Show when={doc.isIndexed}>
                                  <span class="text-xs text-green-400">✓ Indexed</span>
                                </Show>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>

                    <Show when={documents().length === 0}>
                      <div class="text-center py-8 text-gray-500 text-sm">
                        No documents uploaded yet
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>

              <Show when={activeTab() === 'settings'}>
                <div class="space-y-4 text-sm">
                  <div>
                    <label class="block text-gray-400 mb-2">AI Model</label>
                    <select class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2">
                      <option>llama3.1:70b (Recommended)</option>
                      <option>llama3.1:8b (Faster)</option>
                      <option>gpt-oss:20b</option>
                    </select>
                  </div>

                  <div>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" checked class="rounded" />
                      <span>Auto-index uploaded documents</span>
                    </label>
                  </div>

                  <div>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" checked class="rounded" />
                      <span>Include project context</span>
                    </label>
                  </div>

                  <div>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" class="rounded" />
                      <span>Auto-respond to RFIs (draft only)</span>
                    </label>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          {/* Main Chat Area */}
          <div class="flex-1 flex flex-col">
            {/* Messages */}
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <For each={messages()}>
                {(message) => (
                  <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div class={`max-w-3xl ${message.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'} rounded-lg p-4`}>
                      <div class="text-sm whitespace-pre-wrap">{message.content}</div>

                      <Show when={message.attachments && message.attachments.length > 0}>
                        <div class="mt-3 pt-3 border-t border-gray-700">
                          <div class="text-xs text-gray-400 mb-2">Attachments:</div>
                          <div class="space-y-2">
                            <For each={message.attachments}>
                              {(attachment) => (
                                <div class="flex items-center gap-2 text-xs bg-gray-700/50 rounded px-3 py-2">
                                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  <span class="flex-1 text-gray-300">{attachment.fileName}</span>
                                  <span class="text-gray-500">{formatFileSize(attachment.fileSize)}</span>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </Show>

                      <Show when={message.sources && message.sources.length > 0}>
                        <div class="mt-3 pt-3 border-t border-gray-700">
                          <div class="text-xs text-gray-400 mb-2">Sources:</div>
                          <For each={message.sources}>
                            {(source) => (
                              <div class="text-xs text-gray-400">
                                📚 {source.reference}
                                <Show when={source.excerpt}>
                                  <div class="ml-4 text-gray-500 italic">"{source.excerpt}"</div>
                                </Show>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>

                      <Show when={message.actions && message.actions.length > 0}>
                        <div class="mt-3 pt-3 border-t border-gray-700">
                          <div class="text-xs text-gray-400 mb-2">Actions:</div>
                          <For each={message.actions}>
                            {(action) => (
                              <div class="text-xs bg-green-900/30 border border-green-700 rounded px-2 py-1 inline-block mr-2">
                                ✓ {action.type}
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>

                      <div class="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </For>

              <Show when={loading()}>
                <div class="flex justify-start">
                  <div class="bg-gray-800 rounded-lg p-4">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s" />
                      <span class="text-sm text-gray-400 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </Show>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              class={`border-t border-gray-800 p-4 ${isDragging() ? 'bg-blue-900/20' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div class="max-w-4xl mx-auto">
                {/* Attached Files Preview */}
                <Show when={attachedFiles().length > 0}>
                  <div class="mb-3 flex flex-wrap gap-2">
                    <For each={attachedFiles()}>
                      {(file, index) => (
                        <div class="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span class="text-gray-300 max-w-xs truncate">{file.name}</span>
                          <span class="text-gray-500 text-xs">{formatFileSize(file.size)}</span>
                          <button
                            onClick={() => removeAttachedFile(index())}
                            class="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Drag & Drop Overlay */}
                <Show when={isDragging()}>
                  <div class="absolute inset-0 flex items-center justify-center bg-blue-900/30 border-2 border-dashed border-blue-500 rounded-lg z-10">
                    <div class="text-center">
                      <svg class="w-16 h-16 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p class="text-white font-medium">Drop files here to attach</p>
                      <p class="text-gray-400 text-sm">PDF, DOCX, XLSX, Images</p>
                    </div>
                  </div>
                </Show>

                <div class="flex gap-3">
                  {/* File Attach Button */}
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.dwg,.jpg,.png,.jpeg"
                    class="hidden"
                    onChange={handleChatFileSelect}
                  />
                  <button
                    onClick={() => chatFileInputRef?.click()}
                    class="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                    disabled={loading()}
                    title="Attach files"
                  >
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Ask anything about this project..."
                    value={input()}
                    onInput={(e) => setInput(e.currentTarget.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading() || aiStatus() === 'offline'}
                  />
                  <button
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    onClick={sendMessage}
                    disabled={loading() || (!input().trim() && attachedFiles().length === 0) || aiStatus() === 'offline'}
                  >
                    Send
                  </button>
                </div>
                <div class="text-xs text-gray-500 mt-2 flex items-center justify-between">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span class="text-gray-600">or drag & drop files to attach</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
