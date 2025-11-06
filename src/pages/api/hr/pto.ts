/**
 * HR PTO API Endpoint
 * GET /api/hr/pto - Fetch PTO requests with filtering
 * POST /api/hr/pto - Create new PTO request
 * PUT /api/hr/pto - Update PTO request (approve/deny)
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Mock PTO data
const mockPTORequests = [
  {
    id: 1,
    employeeId: 1,
    employeeName: 'John Doe',
    type: 'vacation',
    status: 'approved',
    startDate: '2025-12-20',
    endDate: '2025-12-27',
    totalDays: 6,
    reason: 'Family holiday vacation',
    requestedAt: '2025-10-15T10:30:00Z',
    reviewedBy: 1,
    reviewedAt: '2025-10-16T14:22:00Z',
    reviewNotes: 'Approved',
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: 'Sarah Johnson',
    type: 'sick',
    status: 'pending',
    startDate: '2025-11-08',
    endDate: '2025-11-08',
    totalDays: 1,
    reason: 'Medical appointment',
    requestedAt: '2025-11-01T08:15:00Z',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
  },
  {
    id: 3,
    employeeId: 3,
    employeeName: 'Michael Chen',
    type: 'personal',
    status: 'approved',
    startDate: '2025-11-15',
    endDate: '2025-11-15',
    totalDays: 1,
    reason: 'Personal matters',
    requestedAt: '2025-11-02T13:45:00Z',
    reviewedBy: 1,
    reviewedAt: '2025-11-03T09:10:00Z',
    reviewNotes: 'Approved',
  },
  {
    id: 4,
    employeeId: 4,
    employeeName: 'Emily Rodriguez',
    type: 'vacation',
    status: 'pending',
    startDate: '2025-12-01',
    endDate: '2025-12-05',
    totalDays: 5,
    reason: 'Thanksgiving extended weekend',
    requestedAt: '2025-11-04T11:20:00Z',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
  },
  {
    id: 5,
    employeeId: 5,
    employeeName: 'David Williams',
    type: 'vacation',
    status: 'denied',
    startDate: '2025-11-10',
    endDate: '2025-11-12',
    totalDays: 3,
    reason: 'Weekend trip',
    requestedAt: '2025-11-01T16:00:00Z',
    reviewedBy: 2,
    reviewedAt: '2025-11-02T10:30:00Z',
    reviewNotes: 'Critical project milestone during this period',
  },
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    let filtered = [...mockPTORequests];

    // Filter by employee
    if (employeeId) {
      filtered = filtered.filter(req => req.employeeId === parseInt(employeeId));
    }

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(req => req.status === status);
    }

    // Filter by type
    if (type && type !== 'all') {
      filtered = filtered.filter(req => req.type === type);
    }

    // Sort by request date (newest first)
    filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    // Calculate statistics
    const stats = {
      totalRequests: mockPTORequests.length,
      pending: mockPTORequests.filter(r => r.status === 'pending').length,
      approved: mockPTORequests.filter(r => r.status === 'approved').length,
      denied: mockPTORequests.filter(r => r.status === 'denied').length,
      upcomingPTO: mockPTORequests.filter(r =>
        r.status === 'approved' && new Date(r.startDate) > new Date()
      ).length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          requests: filtered,
          stats,
        },
        count: filtered.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching PTO requests:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch PTO requests',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.employeeId || !body.type || !body.startDate || !body.endDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate total days
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Create new PTO request
    const newRequest = {
      id: mockPTORequests.length + 1,
      employeeId: body.employeeId,
      employeeName: body.employeeName || 'Unknown Employee',
      type: body.type,
      status: 'pending',
      startDate: body.startDate,
      endDate: body.endDate,
      totalDays: diffDays,
      reason: body.reason || '',
      requestedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    };

    mockPTORequests.push(newRequest);

    return new Response(
      JSON.stringify({
        success: true,
        data: { request: newRequest },
        message: 'PTO request submitted successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating PTO request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create PTO request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (!body.id || !body.status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Find and update the request
    const requestIndex = mockPTORequests.findIndex(r => r.id === body.id);

    if (requestIndex === -1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PTO request not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    mockPTORequests[requestIndex] = {
      ...mockPTORequests[requestIndex],
      status: body.status,
      reviewedBy: body.reviewedBy || 1,
      reviewedAt: new Date().toISOString(),
      reviewNotes: body.reviewNotes || '',
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: { request: mockPTORequests[requestIndex] },
        message: `PTO request ${body.status}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating PTO request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update PTO request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
