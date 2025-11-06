/**
 * Ollama AI Client
 * Connects to local Ollama instance at http://localhost:11434
 * Optimized for construction project management queries
 */

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface ChatContext {
  projectId?: number;
  projectName?: string;
  userRole?: string;
  recentTasks?: any[];
  knowledgeBase?: any[];
}

/**
 * Ollama Client for local AI inference
 */
export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;
  private timeout: number;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    defaultModel: string = 'llama3.1:8b',
    timeout: number = 180000 // 180 seconds (3 minutes) - CPU inference is slow
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
    this.timeout = timeout;
  }

  /**
   * Check if Ollama is running and accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  /**
   * Generate a response from Ollama (non-streaming)
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    model?: string
  ): Promise<string> {
    const requestBody: OllamaGenerateRequest = {
      model: model || this.defaultModel,
      prompt,
      stream: false,
      system: systemPrompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 2000,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        throw new Error('Ollama request timed out. Try a shorter prompt or increase timeout.');
      }
      throw error;
    }
  }

  /**
   * Chat with context-aware construction assistant
   */
  async chat(
    message: string,
    context: ChatContext = {},
    knowledgeResults: any[] = []
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const enhancedPrompt = this.buildEnhancedPrompt(message, context, knowledgeResults);

    return await this.generate(enhancedPrompt, systemPrompt);
  }

  /**
   * Build system prompt for construction assistant
   */
  private buildSystemPrompt(context: ChatContext): string {
    return `You are ConstructAid Assistant, an expert AI helper for construction project management.

Your expertise includes:
- Construction codes and regulations (IBC, IRC, NEC, UPC, IMC, OSHA)
- CSI MasterFormat codes and specifications
- Project scheduling and task management
- Material quantities and cost estimation
- Safety compliance and best practices
- Construction mathematics and calculations

When answering:
1. Be specific and actionable
2. Cite relevant codes or standards (e.g., "Per OSHA 1926.451...")
3. Show calculations when relevant
4. Provide CSI codes when discussing materials or work
5. If uncertain, acknowledge limitations

${context.projectId ? `Current Project: ${context.projectName || `Project #${context.projectId}`}` : ''}
${context.userRole ? `User Role: ${context.userRole}` : ''}

Format responses clearly with bullet points or numbered lists when appropriate.`;
  }

  /**
   * Build enhanced prompt with context and knowledge base results
   */
  private buildEnhancedPrompt(
    message: string,
    context: ChatContext,
    knowledgeResults: any[]
  ): string {
    let prompt = '';

    // Add knowledge base context if available
    if (knowledgeResults.length > 0) {
      prompt += 'RELEVANT KNOWLEDGE FROM DATABASE:\n';
      knowledgeResults.forEach((result, idx) => {
        prompt += `\n[${idx + 1}] ${result.content}`;
        if (result.reference) {
          prompt += ` (Reference: ${result.reference})`;
        }
        if (result.csi_code) {
          prompt += ` (CSI: ${result.csi_code})`;
        }
      });
      prompt += '\n\n';
    }

    // Add project context if available
    if (context.recentTasks && context.recentTasks.length > 0) {
      prompt += 'RECENT PROJECT TASKS:\n';
      context.recentTasks.slice(0, 5).forEach(task => {
        prompt += `- ${task.title} (${task.status})`;
        if (task.dueDate) {
          prompt += ` - Due: ${new Date(task.dueDate).toLocaleDateString()}`;
        }
        prompt += '\n';
      });
      prompt += '\n';
    }

    // Add user question
    prompt += `USER QUESTION:\n${message}\n\n`;
    prompt += 'RESPONSE:';

    return prompt;
  }

  /**
   * Parse natural language to create task
   */
  async parseTaskCreation(message: string): Promise<any | null> {
    const systemPrompt = `You are a task parser for construction projects.
Extract task information from natural language and return ONLY valid JSON.

Example input: "Add a task for drywall inspection on Friday, assign to Mike"
Example output:
{
  "title": "Drywall Inspection",
  "description": "Scheduled drywall inspection",
  "dueDate": "2025-11-01",
  "assignedTo": "Mike",
  "type": "inspection",
  "priority": "medium"
}

If the input is not a task creation request, return: {"isTask": false}`;

    const prompt = `Parse this message into a task:\n${message}`;

    try {
      const response = await this.generate(prompt, systemPrompt);

      // Extract JSON from response (handle cases where model adds explanation)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.isTask === false ? null : parsed;
      }
      return null;
    } catch (error) {
      console.error('Failed to parse task:', error);
      return null;
    }
  }

  /**
   * Stream response for real-time UI updates
   */
  async *streamGenerate(
    prompt: string,
    systemPrompt?: string,
    model?: string
  ): AsyncGenerator<string> {
    const requestBody: OllamaGenerateRequest = {
      model: model || this.defaultModel,
      prompt,
      stream: true,
      system: systemPrompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                yield data.response;
              }
            } catch (e) {
              console.warn('Failed to parse streaming chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Singleton instance
 */
export const ollamaClient = new OllamaClient();

/**
 * Quick check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  return await ollamaClient.healthCheck();
}
