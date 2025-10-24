/**
 * Project Tasks API
 * GET: Retrieve tasks/action items for a project
 * POST: Create new task
 * PUT: Update task
 */

import type { APIRoute } from 'astro';

// In-memory task storage (persists during dev server session)
let taskStorage: any[] = [];

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const assignedTo = url.searchParams.get('assignedTo');

    // Mock task data with comprehensive tracking
    const mockTasks = taskStorage.length > 0 ? taskStorage : [
      {
        id: 1,
        projectId: parseInt(projectId!),
        taskNumber: 'TASK-001',
        title: 'Review electrical submittal package',
        description: 'Review and approve submittal #045 for electrical panels and distribution equipment',
        category: 'Submittal Review',
        type: 'Action Item',
        status: 'in_progress',
        priority: 'high',
        ballInCourt: 'Design Team',
        assignedTo: 2,
        assignedToName: 'Jane Smith',
        assignedToCompany: 'Design Team',
        assignedBy: 1,
        assignedByName: 'John Doe',
        createdAt: '2025-10-20T09:00:00Z',
        updatedAt: '2025-10-22T14:30:00Z',
        dueDate: '2025-10-25',
        startDate: '2025-10-20',
        completedDate: null,
        estimatedHours: 4,
        actualHours: 2,
        location: 'Building A - Basement',
        costCode: 'DIV 26',
        relatedDocumentId: 45,
        relatedDocumentType: 'submittal',
        percentComplete: 60,
        blockers: null,
        dependencies: null,
        notes: 'Waiting for manufacturer spec sheets',
        internalNotes: 'May need to coordinate with MEP engineer',
        lastCommentAt: '2025-10-22T14:30:00Z',
        lastCommentBy: 'Jane Smith',
        tags: 'electrical,submittal,urgent',
        commentCount: 3,
      },
      {
        id: 2,
        projectId: parseInt(projectId!),
        taskNumber: 'TASK-002',
        title: 'Respond to RFI-023 regarding foundation detail',
        description: 'Architect needs clarification on foundation wall waterproofing detail at south elevation',
        category: 'RFI Follow-up',
        type: 'Follow-up',
        status: 'pending',
        priority: 'urgent',
        ballInCourt: 'Design Team',
        assignedTo: 3,
        assignedToName: 'Mike Johnson',
        assignedToCompany: 'StructuralCorp',
        assignedBy: 1,
        assignedByName: 'John Doe',
        createdAt: '2025-10-22T11:15:00Z',
        updatedAt: '2025-10-22T11:15:00Z',
        dueDate: '2025-10-23',
        startDate: null,
        completedDate: null,
        estimatedHours: 2,
        actualHours: 0,
        location: 'South Elevation - Grid Line A',
        costCode: 'DIV 3',
        relatedDocumentId: 23,
        relatedDocumentType: 'rfi',
        percentComplete: 0,
        blockers: 'Waiting for structural engineer availability',
        dependencies: null,
        notes: 'Critical path item - delays concrete pour',
        internalNotes: 'This may require change order',
        lastCommentAt: null,
        lastCommentBy: null,
        tags: 'rfi,structural,critical',
        commentCount: 0,
      },
      {
        id: 3,
        projectId: parseInt(projectId!),
        taskNumber: 'TASK-003',
        title: 'Schedule fire marshal inspection',
        description: 'Coordinate with fire marshal for fire alarm system rough-in inspection',
        category: 'Inspection Required',
        type: 'Action Item',
        status: 'pending',
        priority: 'high',
        ballInCourt: 'Fire Marshal',
        assignedTo: 1,
        assignedToName: 'John Doe',
        assignedToCompany: 'General Contractor',
        assignedBy: 1,
        assignedByName: 'John Doe',
        createdAt: '2025-10-21T08:00:00Z',
        updatedAt: '2025-10-21T08:00:00Z',
        dueDate: '2025-10-26',
        startDate: '2025-10-21',
        completedDate: null,
        estimatedHours: 1,
        actualHours: 0,
        location: 'All Floors',
        costCode: 'DIV 28',
        relatedDocumentId: null,
        relatedDocumentType: null,
        percentComplete: 0,
        blockers: null,
        dependencies: null,
        notes: 'Need 48 hours notice for inspector',
        internalNotes: 'Inspector prefers Tuesday/Thursday mornings',
        lastCommentAt: null,
        lastCommentBy: null,
        tags: 'inspection,fire-safety,scheduling',
        commentCount: 1,
      },
      {
        id: 4,
        projectId: parseInt(projectId!),
        taskNumber: 'TASK-004',
        title: 'Fix HVAC ductwork interference',
        description: 'HVAC ductwork conflicts with structural beam at grid B-3. Requires coordination',
        category: 'Quality Control',
        type: 'Issue',
        status: 'in_progress',
        priority: 'high',
        ballInCourt: 'Sub Contractor',
        assignedTo: 4,
        assignedToName: 'Sarah Williams',
        assignedToCompany: 'Cool Air HVAC',
        assignedBy: 1,
        assignedByName: 'John Doe',
        createdAt: '2025-10-19T13:45:00Z',
        updatedAt: '2025-10-22T10:20:00Z',
        dueDate: '2025-10-24',
        startDate: '2025-10-20',
        completedDate: null,
        estimatedHours: 8,
        actualHours: 4,
        location: '2nd Floor - Grid B-3',
        costCode: 'DIV 23',
        relatedDocumentId: null,
        relatedDocumentType: null,
        percentComplete: 40,
        blockers: 'Waiting for revised shop drawings',
        dependencies: '1',
        notes: 'Rerouting ductwork 18" south',
        internalNotes: 'May need additional hangers - check budget',
        lastCommentAt: '2025-10-22T10:20:00Z',
        lastCommentBy: 'Sarah Williams',
        tags: 'hvac,coordination,field-issue',
        commentCount: 5,
      },
      {
        id: 5,
        projectId: parseInt(projectId!),
        taskNumber: 'TASK-005',
        title: 'Repair damaged drywall in Unit 201',
        description: 'Water damage from plumbing leak - replace drywall and repaint',
        category: 'Punch List Item',
        type: 'Punch Item',
        status: 'completed',
        priority: 'medium',
        ballInCourt: 'Owner',
        assignedTo: 5,
        assignedToName: 'Tom Martinez',
        assignedToCompany: 'Finish Pro Drywall',
        assignedBy: 1,
        assignedByName: 'John Doe',
        createdAt: '2025-10-15T09:00:00Z',
        updatedAt: '2025-10-21T16:00:00Z',
        dueDate: '2025-10-22',
        startDate: '2025-10-18',
        completedDate: '2025-10-21T16:00:00Z',
        estimatedHours: 6,
        actualHours: 5,
        location: 'Unit 201 - Bedroom',
        costCode: 'DIV 9',
        relatedDocumentId: null,
        relatedDocumentType: null,
        percentComplete: 100,
        blockers: null,
        dependencies: null,
        notes: 'Completed and inspected by owner rep',
        internalNotes: 'Owner satisfied with repair',
        lastCommentAt: '2025-10-21T16:00:00Z',
        lastCommentBy: 'Tom Martinez',
        tags: 'punch-list,drywall,completed',
        commentCount: 2,
      },
      {
        id: 6,
        projectId: parseInt(projectId!),
        taskNumber: 'TASK-006',
        title: 'Order windows for Phase 2',
        description: 'Submit purchase order for remaining window units (32 total)',
        category: 'Material Delivery',
        type: 'Action Item',
        status: 'pending',
        priority: 'medium',
        ballInCourt: 'Vendor/Supplier',
        assignedTo: 1,
        assignedToName: 'John Doe',
        assignedToCompany: 'General Contractor',
        assignedBy: 1,
        assignedByName: 'John Doe',
        createdAt: '2025-10-18T10:00:00Z',
        updatedAt: '2025-10-18T10:00:00Z',
        dueDate: '2025-10-27',
        startDate: null,
        completedDate: null,
        estimatedHours: 2,
        actualHours: 0,
        location: 'Phase 2 - All Units',
        costCode: 'DIV 8',
        relatedDocumentId: null,
        relatedDocumentType: null,
        percentComplete: 0,
        blockers: null,
        dependencies: null,
        notes: 'Lead time is 6 weeks',
        internalNotes: 'Budget approved, proceed with order',
        lastCommentAt: null,
        lastCommentBy: null,
        tags: 'procurement,windows,phase-2',
        commentCount: 0,
      },
    ];

    // Initialize storage with mock data on first request
    if (taskStorage.length === 0) {
      taskStorage = [...mockTasks];
    }

    // Filter tasks based on query params
    let filteredTasks = taskStorage;
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    if (assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === parseInt(assignedTo));
    }

    // Calculate statistics
    const stats = {
      total: taskStorage.length,
      pending: taskStorage.filter(t => t.status === 'pending').length,
      in_progress: taskStorage.filter(t => t.status === 'in_progress').length,
      completed: taskStorage.filter(t => t.status === 'completed').length,
      overdue: taskStorage.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date();
      }).length,
      urgent: taskStorage.filter(t => t.priority === 'urgent').length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        tasks: filteredTasks,
        stats,
        count: filteredTasks.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch tasks',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;
    const body = await request.json();

    // Generate unique ID
    const newId = taskStorage.length > 0
      ? Math.max(...taskStorage.map(t => t.id)) + 1
      : 7;

    const newTask = {
      id: newId,
      projectId: parseInt(projectId!),
      taskNumber: `TASK-${String(newId).padStart(3, '0')}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      percentComplete: body.percentComplete || 0,
      commentCount: 0,
    };

    // Add to storage
    taskStorage.push(newTask);

    return new Response(
      JSON.stringify({
        success: true,
        task: newTask,
        message: 'Task created successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create task',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { taskId, ...updates } = body;

    const updatedTask = {
      ...updates,
      id: taskId,
      updatedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        task: updatedTask,
        message: 'Task updated successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating task:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update task',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
