/**
 * AI Chat API Endpoint
 * Handles chat requests with knowledge base retrieval and Ollama inference
 */

import type { APIRoute } from 'astro';
import { ollamaClient, isOllamaAvailable } from '../../../lib/ai/ollama-client';
import { spawn } from 'child_process';
import { db } from '../../../lib/db';
import { tasks, projects } from '../../../lib/db/schema';
import { eq, desc } from 'drizzle-orm';

interface ChatRequest {
  message: string;
  projectId?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Search knowledge base using Python script
 */
async function searchKnowledgeBase(query: string, topK: number = 3): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const python = spawn('C:\\Users\\ctnal\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe', [
      'scripts/search-kb.py',
      query,
      '--top-k',
      topK.toString(),
    ]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          if (result.error) {
            console.warn('KB search warning:', result.error);
            resolve([]);
          } else {
            resolve(result.results || []);
          }
        } catch (error) {
          console.error('Failed to parse KB results:', error);
          resolve([]);
        }
      } else {
        console.error('KB search failed:', errorOutput);
        resolve([]);
      }
    });
  });
}

/**
 * Get recent tasks for project context
 */
async function getProjectContext(projectId: number) {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const recentTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    return {
      projectId,
      projectName: project?.name,
      recentTasks: recentTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
    };
  } catch (error) {
    console.error('Failed to get project context:', error);
    return { projectId };
  }
}

/**
 * POST /api/ai/chat
 * Main chat endpoint
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body: ChatRequest = await request.json();
    const { message, projectId } = body;

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Ollama is running
    const isAvailable = await isOllamaAvailable();
    if (!isAvailable) {
      return new Response(
        JSON.stringify({
          error: 'AI assistant is not available. Please ensure Ollama is running.',
          hint: 'Run "ollama serve" in your terminal',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Search knowledge base in parallel with getting project context
    const [knowledgeResults, projectContext] = await Promise.all([
      searchKnowledgeBase(message, 3),
      projectId ? getProjectContext(projectId) : Promise.resolve({}),
    ]);

    console.log(`Found ${knowledgeResults.length} relevant knowledge items`);

    // Check if this is a task creation request
    const taskData = await ollamaClient.parseTaskCreation(message);
    if (taskData && projectId) {
      // User wants to create a task
      try {
        const [newTask] = await db
          .insert(tasks)
          .values({
            projectId,
            title: taskData.title,
            description: taskData.description || '',
            type: taskData.type || 'general',
            status: 'pending',
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            assignedTo: taskData.assignedTo ? [taskData.assignedTo] : [],
          })
          .returning();

        return new Response(
          JSON.stringify({
            role: 'assistant',
            content: `✓ Task created successfully!\n\n**${newTask.title}**\nStatus: ${newTask.status}\nPriority: ${newTask.priority}${
              newTask.dueDate ? `\nDue: ${new Date(newTask.dueDate).toLocaleDateString()}` : ''
            }`,
            taskCreated: {
              id: newTask.id,
              title: newTask.title,
              status: newTask.status,
            },
            sources: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Failed to create task:', error);
        // Fall through to regular chat response
      }
    }

    // Generate AI response
    const response = await ollamaClient.chat(
      message,
      projectContext,
      knowledgeResults
    );

    // Extract sources from knowledge results
    const sources = knowledgeResults
      .filter(r => r.reference)
      .map(r => ({
        reference: r.reference,
        csi_code: r.csi_code,
        category: r.category,
      }));

    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: response,
        sources,
        modelUsed: 'llama3.1:70b',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Chat API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/ai/chat
 * Health check endpoint
 */
export const GET: APIRoute = async () => {
  const isAvailable = await isOllamaAvailable();
  const models = isAvailable ? await ollamaClient.listModels() : [];

  return new Response(
    JSON.stringify({
      status: isAvailable ? 'online' : 'offline',
      models,
      endpoint: 'http://localhost:11434',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
