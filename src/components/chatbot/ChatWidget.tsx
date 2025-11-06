/**
 * AI Chat Widget
 * Floating chat interface for ConstructAid Assistant
 */

import { createSignal, For, Show, onMount, createEffect } from 'solid-js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    reference: string;
    csi_code?: string;
    category?: string;
  }>;
  taskCreated?: {
    id: number;
    title: string;
    status: string;
  };
  timestamp?: Date;
  attachment?: {
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

interface ChatWidgetProps {
  projectId?: number;
  position?: 'bottom-right' | 'bottom-left';
}

export default function ChatWidget(props: ChatWidgetProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isMinimized, setIsMinimized] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [aiStatus, setAiStatus] = createSignal<'online' | 'offline' | 'checking'>('checking');
  const [uploadedFile, setUploadedFile] = createSignal<File | null>(null);
  const [uploadProgress, setUploadProgress] = createSignal<number>(0);

  let messagesEndRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;
  let fileInputRef: HTMLInputElement | undefined;

  // Check AI status on mount
  onMount(async () => {
    await checkAIStatus();
  });

  // Auto-scroll to bottom when new messages arrive
  createEffect(() => {
    if (messages().length > 0 && messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Check if Ollama is running
  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/chat');
      const data = await response.json();
      setAiStatus(data.status === 'online' ? 'online' : 'offline');
    } catch (error) {
      setAiStatus('offline');
    }
  };

  // Handle file selection
  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Check file type (PDF or common document types)
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, DOCX, or TXT file');
        return;
      }

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        return;
      }

      setUploadedFile(file);
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    if (fileInputRef) fileInputRef.value = '';
  };

  // Send message to AI
  const sendMessage = async () => {
    if ((!input().trim() && !uploadedFile()) || loading()) return;

    const userMessage: Message = {
      role: 'user',
      content: input().trim() || 'Please review this document',
      timestamp: new Date(),
      attachment: uploadedFile() ? {
        fileName: uploadedFile()!.name,
        fileType: uploadedFile()!.type,
        fileSize: uploadedFile()!.size,
      } : undefined,
    };

    setMessages([...messages(), userMessage]);
    const messageText = input().trim();
    setInput('');
    setLoading(true);

    try {
      let body: any = {
        message: userMessage.content,
        projectId: props.projectId,
      };

      // If file is uploaded, create FormData
      if (uploadedFile()) {
        const formData = new FormData();
        formData.append('file', uploadedFile()!);
        formData.append('message', messageText || 'Please review this document');
        if (props.projectId) {
          formData.append('projectId', props.projectId.toString());
        }

        const response = await fetch('/api/ai/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to upload document');
        }

        const data = await response.json();
        removeFile();

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          sources: data.sources,
          timestamp: new Date(),
        };

        setMessages([...messages(), assistantMessage]);
        setLoading(false);
        return;
      }

      // Regular text-only message
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        sources: data.sources,
        taskCreated: data.taskCreated,
        timestamp: new Date(),
      };

      setMessages([...messages(), assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}\n\n${
          aiStatus() === 'offline'
            ? 'Please make sure Ollama is running. Open PowerShell and run: `ollama serve`'
            : 'Please try again or rephrase your question.'
        }`,
        timestamp: new Date(),
      };

      setMessages([...messages(), errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen());
    if (!isOpen()) {
      setIsMinimized(false);
      setTimeout(() => inputRef?.focus(), 100);
    }
  };

  // Position classes
  const positionClass = props.position === 'bottom-left' ? 'left-4' : 'right-4';

  return (
    <>
      {/* Chat Button */}
      <Show when={!isOpen()}>
        <button
          onClick={toggleChat}
          class={`fixed bottom-4 ${positionClass} z-[9999] w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group`}
          aria-label="Open AI Assistant"
          style="pointer-events: auto;"
        >
          <div class="relative">
            <svg
              class="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <Show when={aiStatus() === 'online'}>
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </Show>
          </div>
          <span class="absolute -top-12 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask ConstructAid AI
          </span>
        </button>
      </Show>

      {/* Chat Window */}
      <Show when={isOpen()}>
        <div
          class={`fixed bottom-4 ${positionClass} z-[9999] w-96 bg-gray-900 rounded-lg shadow-2xl flex flex-col transition-all duration-300 ${
            isMinimized() ? 'h-16' : 'h-[600px]'
          }`}
        >
          {/* Header */}
          <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <h3 class="font-semibold">ConstructAid AI</h3>
                <p class="text-xs text-blue-100">
                  {aiStatus() === 'online' ? 'Online' : 'Offline'} • llama3.1:8b
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized())}
                class="hover:bg-blue-800 p-1 rounded transition-colors"
                aria-label="Minimize"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <button
                onClick={toggleChat}
                class="hover:bg-blue-800 p-1 rounded transition-colors"
                aria-label="Close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <Show when={!isMinimized()}>
            {/* Messages */}
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
              <Show
                when={messages().length > 0}
                fallback={
                  <div class="text-center text-gray-400 mt-20">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p class="text-sm">Ask me about construction codes,</p>
                    <p class="text-sm">create tasks, or get project help!</p>
                  </div>
                }
              >
                <For each={messages()}>
                  {(msg) => (
                    <div class={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        class={`max-w-[85%] px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        {/* Attachment Badge */}
                        <Show when={msg.attachment}>
                          <div class="mb-2 flex items-center gap-2 text-xs opacity-80">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span class="truncate max-w-[200px]">{msg.attachment!.fileName}</span>
                          </div>
                        </Show>

                        <p class="whitespace-pre-wrap text-sm">{msg.content}</p>

                        {/* Task Created Badge */}
                        <Show when={msg.taskCreated}>
                          <div class="mt-2 p-2 bg-green-500/20 border border-green-500/50 rounded text-xs">
                            ✓ Task #{msg.taskCreated!.id} created
                          </div>
                        </Show>

                        {/* Sources */}
                        <Show when={msg.sources && msg.sources.length > 0}>
                          <div class="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                            <p class="font-semibold mb-1">Sources:</p>
                            <For each={msg.sources}>
                              {(source) => (
                                <div class="flex items-center gap-2">
                                  <span>📚 {source.reference}</span>
                                  <Show when={source.csi_code}>
                                    <span class="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
                                      {source.csi_code}
                                    </span>
                                  </Show>
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>

                        <Show when={msg.timestamp}>
                          <p class="text-[10px] text-gray-500 mt-1">
                            {new Date(msg.timestamp!).toLocaleTimeString()}
                          </p>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>

                <Show when={loading()}>
                  <div class="flex justify-start">
                    <div class="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                        <span class="ml-2 text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </Show>
              </Show>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div class="p-4 border-t border-gray-800 bg-gray-900">
              {/* File Preview */}
              <Show when={uploadedFile()}>
                <div class="mb-2 p-2 bg-gray-800 rounded-lg flex items-center justify-between">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-white truncate">{uploadedFile()?.name}</p>
                      <p class="text-xs text-gray-400">{(uploadedFile()?.size! / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    class="ml-2 p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </Show>

              <div class="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input()}
                  onInput={(e) => setInput(e.currentTarget.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about codes, create tasks, or upload plans..."
                  class="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  disabled={loading() || aiStatus() === 'offline'}
                />

                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  class="hidden"
                />
                <button
                  onClick={() => fileInputRef?.click()}
                  disabled={loading() || aiStatus() === 'offline'}
                  class="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Upload document"
                  title="Upload PDF, DOCX, or TXT"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                <button
                  onClick={sendMessage}
                  disabled={loading() || (!input().trim() && !uploadedFile()) || aiStatus() === 'offline'}
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>

              {/* Quick Actions */}
              <div class="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => setInput('What is the rebar spacing for a 6-inch slab?')}
                  class="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Rebar spacing
                </button>
                <button
                  onClick={() => setInput('OSHA fall protection requirements')}
                  class="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  OSHA safety
                </button>
                <button
                  onClick={() => setInput('Create a task for final inspection on Friday')}
                  class="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Create task
                </button>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
}
