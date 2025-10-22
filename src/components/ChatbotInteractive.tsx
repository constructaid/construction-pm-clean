/**
 * Interactive AI Chatbot Component (SolidJS)
 * Placeholder interface ready for AI API integration
 * Styled with ConstructAid.net color scheme
 */
import { createSignal, For, Show, createEffect, onMount } from 'solid-js';

interface ChatbotInteractiveProps {
  projectId?: string;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatbotInteractive(props: ChatbotInteractiveProps) {
  const [messages, setMessages] = createSignal<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hello! I\'m your AI construction assistant. I can help you with:\n\n• Generating RFIs and submittals\n• Cost estimation and analysis\n• Schedule optimization\n• Document interpretation\n• Project insights and recommendations\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = createSignal('');
  const [isTyping, setIsTyping] = createSignal(false);
  let messagesContainer: HTMLDivElement | undefined;

  // Quick action buttons
  const quickActions = [
    { label: 'Generate RFI', icon: '📝', prompt: 'Help me generate an RFI' },
    { label: 'Cost Analysis', icon: '💰', prompt: 'Analyze project costs' },
    { label: 'Schedule Help', icon: '📅', prompt: 'Review project schedule' },
    { label: 'Safety Tips', icon: '⚠️', prompt: 'Provide safety recommendations' }
  ];

  // Auto-scroll to bottom when new messages arrive
  createEffect(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  // Handle sending a message
  const handleSend = async () => {
    const text = inputText().trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: new Date()
    };

    setMessages([...messages(), userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call in production)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: generatePlaceholderResponse(text),
        timestamp: new Date()
      };
      setMessages([...messages(), botMessage]);
      setIsTyping(false);
    }, 1500);

    // TODO: Replace with actual AI API call
    /*
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          projectId: props.projectId,
          history: messages().slice(-10) // Send last 10 messages for context
        })
      });

      const data = await response.json();
      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        text: data.response,
        timestamp: new Date()
      };
      setMessages([...messages(), botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        text: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
        timestamp: new Date()
      };
      setMessages([...messages(), errorMessage]);
    } finally {
      setIsTyping(false);
    }
    */
  };

  // Generate contextual placeholder responses
  const generatePlaceholderResponse = (input: string): string => {
    const lower = input.toLowerCase();

    if (lower.includes('rfi') || lower.includes('request for information')) {
      return 'To generate an RFI, I\'ll need:\n\n1. Subject/Title\n2. Description of the issue or question\n3. Related drawing/specification references\n4. Impact on schedule or budget\n5. Priority level\n\nOnce connected to the AI service, I can automatically draft professional RFIs based on this information.';
    }

    if (lower.includes('cost') || lower.includes('budget') || lower.includes('estimate')) {
      return 'For cost analysis, I can help with:\n\n• Budget variance analysis\n• Cost trend projections\n• Change order impact assessment\n• Material cost optimization\n• Labor productivity analysis\n\nWith AI integration, I\'ll provide real-time insights based on your project data.';
    }

    if (lower.includes('schedule') || lower.includes('timeline') || lower.includes('delay')) {
      return 'For schedule assistance, I can:\n\n• Analyze critical path impacts\n• Identify scheduling conflicts\n• Suggest schedule optimization\n• Calculate float and buffer times\n• Forecast completion dates\n\nOnce fully integrated, I\'ll provide intelligent scheduling recommendations.';
    }

    if (lower.includes('safety') || lower.includes('osha') || lower.includes('incident')) {
      return 'Safety is paramount. I can assist with:\n\n• OSHA compliance checklists\n• Safety plan development\n• Incident report templates\n• Hazard identification\n• Safety training recommendations\n\nThe AI will provide industry best practices and regulatory guidance.';
    }

    return 'This is a placeholder response. Once integrated with OpenAI or Claude API, I\'ll provide intelligent, context-aware assistance for:\n\n• Document generation (RFIs, submittals, change orders)\n• Cost and schedule analysis\n• Code compliance checking\n• Project risk assessment\n• Best practice recommendations\n\nFor now, try clicking one of the quick action buttons below!';
  };

  // Handle quick action click
  const handleQuickAction = (prompt: string) => {
    setInputText(prompt);
    handleSend();
  };

  // Handle Enter key
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div class="flex flex-col h-full max-h-[500px] bg-white rounded-lg border border-gray-200">
      {/* Chat Header */}
      <div class="bg-primary-dark text-white px-4 py-3 rounded-t-lg flex items-center space-x-3">
        <div class="w-10 h-10 bg-primary-orange rounded-full flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold">AI Assistant</h3>
          <p class="text-xs text-gray-300">Always ready to help</p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainer}
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-background-lighter"
        style="max-height: 350px"
      >
        <For each={messages()}>
          {(message) => (
            <div class={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                class={`max-w-[85%] px-4 py-3 rounded-lg shadow-ca-sm ${
                  message.type === 'user'
                    ? 'bg-primary-orange text-white rounded-br-none'
                    : 'bg-white text-text-primary rounded-bl-none border border-gray-200'
                }`}
              >
                <p class="text-sm whitespace-pre-line">{message.text}</p>
                <p class={`text-xs mt-2 ${message.type === 'user' ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}
        </For>

        {/* Typing Indicator */}
        <Show when={isTyping()}>
          <div class="flex justify-start">
            <div class="bg-white px-4 py-3 rounded-lg shadow-ca-sm border border-gray-200">
              <div class="flex space-x-2">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Quick Actions */}
      <div class="px-4 py-2 border-t border-gray-200 bg-white">
        <div class="flex flex-wrap gap-2">
          <For each={quickActions}>
            {(action) => (
              <button
                onClick={() => handleQuickAction(action.prompt)}
                class="px-3 py-1.5 text-xs bg-background-lighter hover:bg-gray-200 rounded-full text-text-primary transition-colors border border-gray-200"
              >
                {action.icon} {action.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Input Area */}
      <div class="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div class="flex space-x-2">
          <textarea
            value={inputText()}
            onInput={(e) => setInputText(e.currentTarget.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your project..."
            rows={1}
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent text-sm resize-none"
            style="max-height: 80px"
          />
          <button
            onClick={handleSend}
            disabled={!inputText().trim()}
            class="px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-ca-sm"
            title="Send message"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div class="px-4 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800 rounded-b-lg">
        <strong>Coming Soon:</strong> Full AI integration with OpenAI/Claude for intelligent assistance
      </div>
    </div>
  );
}
