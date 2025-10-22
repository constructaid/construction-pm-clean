/**
 * AI Chatbot Widget Component
 * Placeholder for AI assistant integration
 * Future: Connect to OpenAI/Claude API for intelligent assistance
 */
import { createSignal, For, Show } from 'solid-js';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function AIChatbotWidget() {
  const [messages, setMessages] = createSignal<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hello! I\'m your AI construction assistant. I can help you with RFI generation, schedule analysis, cost estimates, and more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = createSignal('');
  const [isTyping, setIsTyping] = createSignal(false);

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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'This is a placeholder response. In production, I would be connected to an AI service like OpenAI or Claude to provide intelligent assistance with your construction projects.',
        timestamp: new Date()
      };
      setMessages([...messages(), botMessage]);
      setIsTyping(false);
    }, 1500);

    // TODO: Replace with actual API call
    // try {
    //   const response = await fetch('/api/chatbot', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ message: text })
    //   });
    //   const data = await response.json();
    //   // Add bot response
    // } catch (error) {
    //   console.error('Chatbot error:', error);
    // }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Generate RFI', icon: '📝' },
    { label: 'Cost Analysis', icon: '💰' },
    { label: 'Schedule Help', icon: '📅' },
    { label: 'Safety Tips', icon: '⚠️' }
  ];

  const handleQuickAction = (action: string) => {
    setInputText(action);
  };

  return (
    <div class="flex flex-col h-96">
      {/* Messages Area */}
      <div class="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
        <For each={messages()}>
          {(message) => (
            <div class={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                class={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary-orange text-white'
                    : 'bg-gray-100 text-text-primary'
                }`}
              >
                <p class="text-sm">{message.text}</p>
                <p class={`text-xs mt-1 ${message.type === 'user' ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}
        </For>

        {/* Typing Indicator */}
        <Show when={isTyping()}>
          <div class="flex justify-start">
            <div class="bg-gray-100 px-4 py-2 rounded-lg">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Quick Actions */}
      <div class="mb-3">
        <div class="flex flex-wrap gap-2">
          <For each={quickActions}>
            {(action) => (
              <button
                onClick={() => handleQuickAction(action.label)}
                class="px-3 py-1 text-xs bg-background-lighter hover:bg-gray-200 rounded-full text-text-primary transition-colors"
              >
                {action.icon} {action.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Input Area */}
      <div class="flex space-x-2">
        <input
          type="text"
          value={inputText()}
          onInput={(e) => setInputText(e.currentTarget.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-orange focus:border-transparent text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!inputText().trim()}
          class="px-4 py-2 bg-primary-orange text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Info Banner */}
      <div class="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <strong>Coming Soon:</strong> Full AI integration for intelligent document generation and project insights.
      </div>
    </div>
  );
}
