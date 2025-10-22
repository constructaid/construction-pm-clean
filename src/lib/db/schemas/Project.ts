/**
 * Project Schema for MongoDB
 * Defines the structure for construction projects
 */

export enum ProjectStatus {
  PLANNING = 'planning',
  BIDDING = 'bidding',
  PRE_CONSTRUCTION = 'pre_construction',
  IN_PROGRESS = 'in_progress',
  CLOSEOUT = 'closeout',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export interface Project {
  _id: string; // MongoDB ObjectId
  name: string;
  description: string;
  status: ProjectStatus;

  // Project Identification
  projectNumber: string; // e.g., "2025-001"

  // Location
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Financials
  budget: {
    total: number;
    allocated: number;
    spent: number;
    committed: number;
    remaining: number;
  };

  // Timeline
  dates: {
    startDate: Date;
    estimatedCompletion: Date;
    actualCompletion?: Date;
    milestones: Milestone[];
  };

  // Stakeholders/Team
  team: {
    owner: string; // User ObjectId
    generalContractor: string; // User ObjectId
    architects: string[]; // User ObjectIds
    subcontractors: SubcontractorAssignment[];
    consultants: string[]; // User ObjectIds
  };

  // Progress Tracking
  progress: {
    percentage: number; // 0-100
    lastUpdated: Date;
    completedMilestones: number;
    totalMilestones: number;
  };

  // Settings
  settings: {
    timezone: string;
    workingDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    notificationPreferences?: {
      dailyReports: boolean;
      milestoneAlerts: boolean;
      budgetAlerts: boolean;
    };
  };

  // Metadata
  createdBy: string; // User ObjectId
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  completedDate?: Date;
  dependencies?: string[]; // Array of milestone IDs
}

export interface SubcontractorAssignment {
  userId: string; // User ObjectId
  trade: string; // e.g., "Electrical", "Plumbing", "HVAC"
  company: string;
  contractAmount?: number;
  assignedFolders: string[]; // Array of folder IDs
  startDate?: Date;
  endDate?: Date;
}

/**
 * MongoDB Schema definition
 */
export const ProjectSchema = {
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.PLANNING },

  projectNumber: { type: String, required: true, unique: true },

  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  budget: {
    total: { type: Number, default: 0 },
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    committed: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  },

  dates: {
    startDate: { type: Date, required: true },
    estimatedCompletion: { type: Date, required: true },
    actualCompletion: Date,
    milestones: [{
      id: String,
      name: String,
      description: String,
      dueDate: Date,
      completed: { type: Boolean, default: false },
      completedDate: Date,
      dependencies: [String]
    }]
  },

  team: {
    owner: { type: String, required: true },
    generalContractor: { type: String, required: true },
    architects: [String],
    subcontractors: [{
      userId: String,
      trade: String,
      company: String,
      contractAmount: Number,
      assignedFolders: [String],
      startDate: Date,
      endDate: Date
    }],
    consultants: [String]
  },

  progress: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
    completedMilestones: { type: Number, default: 0 },
    totalMilestones: { type: Number, default: 0 }
  },

  settings: {
    timezone: { type: String, default: 'America/New_York' },
    workingDays: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],
    notificationPreferences: {
      dailyReports: { type: Boolean, default: true },
      milestoneAlerts: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true }
    }
  },

  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  tags: [String]
};

// Indexes for performance
export const ProjectIndexes = [
  { projectNumber: 1 }, // Unique index
  { status: 1 },
  { 'team.generalContractor': 1 },
  { 'team.owner': 1 },
  { 'team.subcontractors.userId': 1 },
  { createdAt: -1 }, // For sorting by date
  { 'budget.total': 1 }, // For budget queries
];
