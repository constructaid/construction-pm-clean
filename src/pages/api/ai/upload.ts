/**
 * AI Document Upload API
 * Handles PDF/DOCX uploads, extracts text, and sends to AI for review
 */

import type { APIRoute } from 'astro';
import { LargePdfParser } from '../../../parsers/large-pdf-parser';
import { OllamaClient } from '../../../lib/ai/ollama-client';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

// Initialize Ollama client
const ollamaClient = new OllamaClient();

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'temp');

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Extract text from PDF
 */
async function extractPdfText(filePath: string): Promise<string> {
  const parser = new LargePdfParser({
    batchSize: 50,
    generateThumbnails: false,
    extractAnnotations: true,
  });

  const result = await parser.parseBlueprint(filePath);

  // Combine page text with metadata
  let extractedText = `Document: ${result.fileName}\n`;
  extractedText += `Total Pages: ${result.totalPages}\n`;
  extractedText += `\n--- DOCUMENT CONTENT ---\n\n`;

  // Add text from each page
  result.pages.forEach((page) => {
    if (page.text.trim()) {
      extractedText += `\n[Page ${page.pageNumber}]\n${page.text}\n`;
    }
  });

  return extractedText;
}

/**
 * Extract text from TXT file
 */
async function extractTxtText(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, 'utf-8');
}

/**
 * Process uploaded document and generate AI response
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureUploadDir();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const message = formData.get('message') as string || 'Please review this document';
    const projectId = formData.get('projectId');

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Only PDF and TXT files are supported' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save file temporarily
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    try {
      // Extract text based on file type
      let extractedText: string;
      if (file.type === 'application/pdf') {
        extractedText = await extractPdfText(filePath);
      } else if (file.type === 'text/plain') {
        extractedText = await extractTxtText(filePath);
      } else {
        throw new Error('Unsupported file type');
      }

      // Limit text length to prevent token overflow (max ~50k characters)
      const maxLength = 50000;
      if (extractedText.length > maxLength) {
        extractedText = extractedText.substring(0, maxLength) + '\n\n[... document truncated due to length ...]';
      }

      // Create AI prompt with document context
      const systemPrompt = `You are ConstructAid Assistant, an expert in construction project management, codes, and specifications.

The user has uploaded a document and asked: "${message}"

Below is the extracted text from the document. Please analyze it and provide a helpful, detailed response.

Your response should:
1. Summarize the key points of the document
2. Answer the user's specific question about the document
3. Identify any relevant codes, standards, or specifications mentioned
4. Highlight important requirements, dimensions, or specifications
5. Note any potential issues or areas that need attention

Be specific and cite page numbers when referencing information from the document.`;

      const prompt = `Document Contents:\n\n${extractedText}\n\n---\n\nUser Question: ${message}\n\nPlease provide a comprehensive analysis and answer.`;

      // Generate AI response
      const aiResponse = await ollamaClient.generate(prompt, systemPrompt);

      // Clean up temp file
      await unlink(filePath);

      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: aiResponse,
          documentInfo: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            extractedLength: extractedText.length,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      // Clean up temp file on error
      try {
        await unlink(filePath);
      } catch (unlinkError) {
        // Ignore unlink errors
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Document upload error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process document',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
