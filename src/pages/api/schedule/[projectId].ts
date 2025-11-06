/**
 * Schedule API Endpoint
 * Handles CRUD operations for project schedule tasks
 * GET /api/schedule/[projectId] - Fetch all schedule tasks for a project
 * POST /api/schedule/[projectId] - Create a new schedule task
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Mock data structure for schedule tasks until DB is set up
interface ScheduleTask {
  id: number;
  projectId: number;
  wbsCode: string;
  taskName: string;
  description: string;
  parentTaskId: number | null;
  sortOrder: number;
  level: number;

  // Planned/Scheduled dates
  startDate: string;
  endDate: string;
  duration: number;

  // Baseline dates
  baselineStartDate: string | null;
  baselineEndDate: string | null;
  baselineDuration: number | null;

  // Actual dates
  actualStartDate: string | null;
  actualEndDate: string | null;
  actualDuration: number | null;

  percentComplete: number;
  status: string;
  assignedTo: number[];
  isMilestone: boolean;
  isCriticalPath: boolean;

  // Critical Path / Float calculations
  earlyStart: string | null;
  earlyFinish: string | null;
  lateStart: string | null;
  lateFinish: string | null;
  totalFloat: number; // Days of slack/float
  freeFloat: number;

  estimatedHours: number;
  cost: number;
  color: string;
  dependencies: Array<{
    id: number;
    predecessorTaskId: number;
    dependencyType: string;
    lagDays: number;
  }>;
}

// Mock schedule data for demonstration
const mockScheduleTasks: ScheduleTask[] = [
  {
    id: 1,
    projectId: 1,
    wbsCode: '1',
    taskName: 'Pre-Construction Phase',
    description: 'Planning and preparation activities',
    parentTaskId: null,
    sortOrder: 1,
    level: 1,
    startDate: '2024-01-01',
    endDate: '2024-02-15',
    duration: 45,
    baselineStartDate: '2024-01-01',
    baselineEndDate: '2024-02-15',
    baselineDuration: 45,
    actualStartDate: '2024-01-01',
    actualEndDate: '2024-02-15',
    actualDuration: 45,
    percentComplete: 100,
    status: 'completed',
    assignedTo: [1],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-01-01',
    earlyFinish: '2024-02-15',
    lateStart: '2024-01-01',
    lateFinish: '2024-02-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 200,
    cost: 25000,
    color: '#3D9991',
    dependencies: []
  },
  {
    id: 2,
    projectId: 1,
    wbsCode: '1.1',
    taskName: 'Site Survey',
    description: 'Complete site survey and analysis',
    parentTaskId: 1,
    sortOrder: 2,
    level: 2,
    startDate: '2024-01-01',
    endDate: '2024-01-15',
    duration: 14,
    baselineStartDate: '2024-01-01',
    baselineEndDate: '2024-01-15',
    baselineDuration: 14,
    actualStartDate: '2024-01-01',
    actualEndDate: '2024-01-14',
    actualDuration: 13,
    percentComplete: 100,
    status: 'completed',
    assignedTo: [1],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-01-01',
    earlyFinish: '2024-01-15',
    lateStart: '2024-01-01',
    lateFinish: '2024-01-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 80,
    cost: 10000,
    color: '#3D9991',
    dependencies: []
  },
  {
    id: 3,
    projectId: 1,
    wbsCode: '1.2',
    taskName: 'Permits and Approvals',
    description: 'Obtain all necessary permits',
    parentTaskId: 1,
    sortOrder: 3,
    level: 2,
    startDate: '2024-01-16',
    endDate: '2024-02-15',
    duration: 30,
    baselineStartDate: '2024-01-16',
    baselineEndDate: '2024-02-10',
    baselineDuration: 25,
    actualStartDate: '2024-01-16',
    actualEndDate: '2024-02-15',
    actualDuration: 30,
    percentComplete: 100,
    status: 'completed',
    assignedTo: [1],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-01-16',
    earlyFinish: '2024-02-15',
    lateStart: '2024-01-16',
    lateFinish: '2024-02-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 120,
    cost: 15000,
    color: '#3D9991',
    dependencies: [{ id: 1, predecessorTaskId: 2, dependencyType: 'finish_to_start', lagDays: 0 }]
  },
  {
    id: 4,
    projectId: 1,
    wbsCode: '2',
    taskName: 'Foundation Work',
    description: 'Excavation and foundation construction',
    parentTaskId: null,
    sortOrder: 4,
    level: 1,
    startDate: '2024-02-16',
    endDate: '2024-04-15',
    duration: 60,
    baselineStartDate: '2024-02-16',
    baselineEndDate: '2024-04-10',
    baselineDuration: 55,
    actualStartDate: '2024-02-16',
    actualEndDate: null,
    actualDuration: null,
    percentComplete: 75,
    status: 'in_progress',
    assignedTo: [1, 2],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-02-16',
    earlyFinish: '2024-04-15',
    lateStart: '2024-02-16',
    lateFinish: '2024-04-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 400,
    cost: 150000,
    color: '#FF6600',
    dependencies: [{ id: 2, predecessorTaskId: 3, dependencyType: 'finish_to_start', lagDays: 0 }]
  },
  {
    id: 5,
    projectId: 1,
    wbsCode: '2.1',
    taskName: 'Excavation',
    description: 'Site excavation and grading',
    parentTaskId: 4,
    sortOrder: 5,
    level: 2,
    startDate: '2024-02-16',
    endDate: '2024-03-01',
    duration: 14,
    baselineStartDate: '2024-02-16',
    baselineEndDate: '2024-03-01',
    baselineDuration: 14,
    actualStartDate: '2024-02-16',
    actualEndDate: '2024-03-02',
    actualDuration: 15,
    percentComplete: 100,
    status: 'completed',
    assignedTo: [2],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-02-16',
    earlyFinish: '2024-03-01',
    lateStart: '2024-02-16',
    lateFinish: '2024-03-01',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 160,
    cost: 50000,
    color: '#FF6600',
    dependencies: [{ id: 3, predecessorTaskId: 3, dependencyType: 'finish_to_start', lagDays: 0 }]
  },
  {
    id: 6,
    projectId: 1,
    wbsCode: '2.2',
    taskName: 'Foundation Pour',
    description: 'Pour concrete foundation',
    parentTaskId: 4,
    sortOrder: 6,
    level: 2,
    startDate: '2024-03-02',
    endDate: '2024-04-15',
    duration: 45,
    baselineStartDate: '2024-03-02',
    baselineEndDate: '2024-04-10',
    baselineDuration: 40,
    actualStartDate: '2024-03-02',
    actualEndDate: null,
    actualDuration: null,
    percentComplete: 60,
    status: 'in_progress',
    assignedTo: [1, 2],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-03-02',
    earlyFinish: '2024-04-15',
    lateStart: '2024-03-02',
    lateFinish: '2024-04-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 240,
    cost: 100000,
    color: '#FF6600',
    dependencies: [{ id: 4, predecessorTaskId: 5, dependencyType: 'finish_to_start', lagDays: 0 }]
  },
  {
    id: 7,
    projectId: 1,
    wbsCode: '3',
    taskName: 'Structural Framing',
    description: 'Steel and concrete structural work',
    parentTaskId: null,
    sortOrder: 7,
    level: 1,
    startDate: '2024-04-16',
    endDate: '2024-07-15',
    duration: 90,
    baselineStartDate: '2024-04-11',
    baselineEndDate: '2024-07-10',
    baselineDuration: 90,
    actualStartDate: null,
    actualEndDate: null,
    actualDuration: null,
    percentComplete: 0,
    status: 'not_started',
    assignedTo: [2],
    isMilestone: false,
    isCriticalPath: true,
    earlyStart: '2024-04-16',
    earlyFinish: '2024-07-15',
    lateStart: '2024-04-16',
    lateFinish: '2024-07-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 800,
    cost: 350000,
    color: '#4A5568',
    dependencies: [{ id: 5, predecessorTaskId: 6, dependencyType: 'finish_to_start', lagDays: 0 }]
  },
  {
    id: 8,
    projectId: 1,
    wbsCode: '4',
    taskName: 'MEP Rough-In',
    description: 'Mechanical, Electrical, and Plumbing rough installation',
    parentTaskId: null,
    sortOrder: 8,
    level: 1,
    startDate: '2024-07-16',
    endDate: '2024-09-30',
    duration: 75,
    baselineStartDate: '2024-07-11',
    baselineEndDate: '2024-09-25',
    baselineDuration: 75,
    actualStartDate: null,
    actualEndDate: null,
    actualDuration: null,
    percentComplete: 0,
    status: 'not_started',
    assignedTo: [],
    isMilestone: false,
    isCriticalPath: false,
    earlyStart: '2024-07-16',
    earlyFinish: '2024-09-30',
    lateStart: '2024-10-01',
    lateFinish: '2024-12-15',
    totalFloat: 76,
    freeFloat: 76,
    estimatedHours: 600,
    cost: 200000,
    color: '#2D3748',
    dependencies: [{ id: 6, predecessorTaskId: 7, dependencyType: 'finish_to_start', lagDays: 0 }]
  },
  {
    id: 9,
    projectId: 1,
    wbsCode: '5',
    taskName: 'Substantial Completion',
    description: 'Project substantial completion milestone',
    parentTaskId: null,
    sortOrder: 9,
    level: 1,
    startDate: '2024-12-15',
    endDate: '2024-12-15',
    duration: 0,
    baselineStartDate: '2024-12-10',
    baselineEndDate: '2024-12-10',
    baselineDuration: 0,
    actualStartDate: null,
    actualEndDate: null,
    actualDuration: null,
    percentComplete: 0,
    status: 'not_started',
    assignedTo: [],
    isMilestone: true,
    isCriticalPath: true,
    earlyStart: '2024-12-15',
    earlyFinish: '2024-12-15',
    lateStart: '2024-12-15',
    lateFinish: '2024-12-15',
    totalFloat: 0,
    freeFloat: 0,
    estimatedHours: 0,
    cost: 0,
    color: '#1A365D',
    dependencies: [{ id: 7, predecessorTaskId: 8, dependencyType: 'finish_to_start', lagDays: 0 }]
  }
];

export const GET: APIRoute = async ({ params }) => {
  try {
    const { projectId } = params;

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectIdNum = parseInt(projectId);

    // Filter tasks for this project
    const projectTasks = mockScheduleTasks.filter(task => task.projectId === projectIdNum);

    return new Response(
      JSON.stringify({
        success: true,
        tasks: projectTasks,
        count: projectTasks.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching schedule tasks:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch schedule tasks',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { projectId } = params;

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Project ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.taskName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Task name is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new task (mock implementation)
    const newTask: ScheduleTask = {
      id: mockScheduleTasks.length + 1,
      projectId: parseInt(projectId),
      wbsCode: body.wbsCode || `${mockScheduleTasks.length + 1}`,
      taskName: body.taskName,
      description: body.description || '',
      parentTaskId: body.parentTaskId || null,
      sortOrder: body.sortOrder || mockScheduleTasks.length + 1,
      level: body.level || 1,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      endDate: body.endDate || new Date().toISOString().split('T')[0],
      duration: body.duration || 1,
      baselineStartDate: null,
      baselineEndDate: null,
      baselineDuration: null,
      actualStartDate: null,
      actualEndDate: null,
      actualDuration: null,
      percentComplete: 0,
      status: 'not_started',
      assignedTo: body.assignedTo || [],
      isMilestone: body.isMilestone || false,
      isCriticalPath: false,
      earlyStart: null,
      earlyFinish: null,
      lateStart: null,
      lateFinish: null,
      totalFloat: 0,
      freeFloat: 0,
      estimatedHours: body.estimatedHours || 0,
      cost: body.cost || 0,
      color: body.color || '#3D9991',
      dependencies: []
    };

    mockScheduleTasks.push(newTask);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Task created successfully',
        task: newTask
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating schedule task:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to create schedule task',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
