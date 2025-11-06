/**
 * API: Upload Documents for AI Analysis
 * POST /api/ai/documents/upload
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId');

    if (!file || !projectId) {
      return new Response(JSON.stringify({ error: 'File and project ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // In production, you would:
    // 1. Upload file to storage (S3, Cloudflare R2, etc.)
    // 2. Extract text from PDF/DOCX
    // 3. Create vector embeddings
    // 4. Store in database with embeddings
    // 5. Return document metadata

    // For now, mock success response
    const mockDocument = {
      id: Date.now(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      projectId: parseInt(projectId as string),
      category: detectCategory(file.name),
      isIndexed: false,
      processingStatus: 'pending',
      uploadedAt: new Date().toISOString()
    };

    // Simulate processing delay
    setTimeout(() => {
      mockDocument.isIndexed = true;
      mockDocument.processingStatus = 'completed';
    }, 2000);

    return new Response(JSON.stringify({
      success: true,
      document: mockDocument,
      message: 'Document uploaded successfully. Processing...'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper function to detect document category from filename
function detectCategory(fileName: string): string {
  const lower = fileName.toLowerCase();

  if (lower.includes('rfi')) return 'rfi';
  if (lower.includes('change') || lower.includes('co-')) return 'change_order';
  if (lower.includes('submittal') || lower.includes('subm')) return 'submittal';
  if (lower.includes('estimate') || lower.includes('bid')) return 'estimate';
  if (lower.includes('drawing') || lower.includes('.dwg')) return 'drawing';
  if (lower.includes('photo') || lower.includes('.jpg') || lower.includes('.png')) return 'photo';
  if (lower.includes('contract') || lower.includes('agreement')) return 'contract';
  if (lower.includes('email')) return 'email';
  if (lower.includes('spec')) return 'specification';

  return 'other';
}
