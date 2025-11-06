/**
 * API: AI Documents
 * GET /api/ai/documents?projectId=1 - List documents for project
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mock data for now - will connect to database later
  const mockDocuments = [
    {
      id: 1,
      fileName: 'RFI-001-Foundation-Waterproofing.pdf',
      fileType: 'pdf',
      category: 'rfi',
      subcategory: 'DIV 03',
      fileSize: 245000,
      isIndexed: true,
      uploadedAt: '2025-10-30T10:00:00Z',
      aiSummary: 'RFI regarding waterproofing detail at north wall foundation'
    },
    {
      id: 2,
      fileName: 'Change-Order-005-Electrical-Outlets.pdf',
      fileType: 'pdf',
      category: 'change_order',
      subcategory: 'DIV 26',
      fileSize: 180000,
      isIndexed: true,
      uploadedAt: '2025-10-29T14:30:00Z',
      aiSummary: 'Additional electrical outlets in conference room - $1,250'
    },
    {
      id: 3,
      fileName: 'Submittal-023-HVAC-Units.pdf',
      fileType: 'pdf',
      category: 'submittal',
      subcategory: 'DIV 23',
      fileSize: 520000,
      isIndexed: true,
      uploadedAt: '2025-10-28T09:15:00Z',
      aiSummary: 'HVAC rooftop unit submittal for approval'
    },
    {
      id: 4,
      fileName: 'Project-Estimate-v2.xlsx',
      fileType: 'xlsx',
      category: 'estimate',
      subcategory: null,
      fileSize: 95000,
      isIndexed: false,
      uploadedAt: '2025-10-27T16:00:00Z',
      aiSummary: 'Updated project estimate with recent change orders'
    },
    {
      id: 5,
      fileName: 'Site-Photo-Progress-Week12.jpg',
      fileType: 'jpg',
      category: 'photo',
      subcategory: 'Progress',
      fileSize: 425000,
      isIndexed: false,
      uploadedAt: '2025-10-26T12:00:00Z',
      aiSummary: null
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    documents: mockDocuments,
    total: mockDocuments.length
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
