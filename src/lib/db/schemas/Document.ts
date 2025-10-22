/**
 * Document Schema for MongoDB
 * Defines the structure for project documents and file management
 */

export enum FolderType {
  CONTRACTS = 'contracts',
  SUBMITTALS = 'submittals',
  SHOP_DRAWINGS = 'shop_drawings',
  RFI = 'rfi',
  CHANGE_ORDERS = 'change_orders',
  SCHEDULE = 'schedule',
  PLANS_SPECS = 'plans_specs',
  SAFETY = 'safety',
  PAYMENT_APPS = 'payment_apps',
  ESTIMATING = 'estimating',
  DAILY_REPORTS = 'daily_reports',
  PUNCH_LISTS = 'punch_lists',
  CLOSEOUT = 'closeout',
  AUDIT_TRAILS = 'audit_trails'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

export interface Document {
  _id: string; // MongoDB ObjectId
  projectId: string; // Project ObjectId

  // File Information
  fileName: string;
  fileUrl: string; // S3 URL or local path
  fileSize: number; // in bytes
  fileType: string; // MIME type (e.g., "application/pdf")

  // Categorization
  folderType: FolderType;
  csiDivision?: string; // For submittals/shop drawings (e.g., "03" for Concrete)

  // Status & Workflow
  status: DocumentStatus;
  version: number; // Document version (1, 2, 3, etc.)
  revisionHistory?: Revision[];

  // Metadata
  title?: string; // Optional title different from filename
  description?: string;
  tags: string[];

  // Approval Workflow
  submittedBy?: string; // User ObjectId
  submittedDate?: Date;
  reviewedBy?: string; // User ObjectId
  reviewedDate?: Date;
  approvedBy?: string; // User ObjectId
  approvedDate?: Date;

  // Comments & Markups
  comments?: Comment[];
  hasMarkups: boolean; // True if PDF has annotations

  // Related Documents
  relatedDocuments?: string[]; // Array of Document ObjectIds
  replacesDocument?: string; // Document ObjectId (for revisions)

  // Access Control
  uploadedBy: string; // User ObjectId
  visibleToRoles: string[]; // Array of UserRole codes

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface Revision {
  version: number;
  documentId: string; // Document ObjectId
  changes: string; // Description of changes
  revisedBy: string; // User ObjectId
  revisedAt: Date;
}

export interface Comment {
  id: string;
  text: string;
  author: string; // User ObjectId
  createdAt: Date;
  updatedAt?: Date;
  edited?: boolean;
  // For PDF annotations
  pageNumber?: number;
  coordinates?: {
    x: number;
    y: number;
  };
}

/**
 * MongoDB Schema definition
 */
export const DocumentSchema = {
  projectId: { type: String, required: true },

  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },

  folderType: { type: String, enum: Object.values(FolderType), required: true },
  csiDivision: String,

  status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.DRAFT },
  version: { type: Number, default: 1 },
  revisionHistory: [{
    version: Number,
    documentId: String,
    changes: String,
    revisedBy: String,
    revisedAt: Date
  }],

  title: String,
  description: String,
  tags: [String],

  submittedBy: String,
  submittedDate: Date,
  reviewedBy: String,
  reviewedDate: Date,
  approvedBy: String,
  approvedDate: Date,

  comments: [{
    id: String,
    text: String,
    author: String,
    createdAt: Date,
    updatedAt: Date,
    edited: { type: Boolean, default: false },
    pageNumber: Number,
    coordinates: {
      x: Number,
      y: Number
    }
  }],
  hasMarkups: { type: Boolean, default: false },

  relatedDocuments: [String],
  replacesDocument: String,

  uploadedBy: { type: String, required: true },
  visibleToRoles: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  archivedAt: Date
};

// Indexes for performance
export const DocumentIndexes = [
  { projectId: 1, folderType: 1 }, // For folder queries
  { projectId: 1, csiDivision: 1 }, // For CSI division queries
  { status: 1, projectId: 1 }, // For status filtering
  { uploadedBy: 1 }, // For user uploads
  { submittedDate: -1 }, // For sorting by submission date
  { createdAt: -1 }, // For sorting by creation date
  { tags: 1 }, // For tag-based search
];

/**
 * Helper function to get folder display name
 */
export function getFolderDisplayName(folderType: FolderType): string {
  const names: Record<FolderType, string> = {
    [FolderType.CONTRACTS]: 'Contracts',
    [FolderType.SUBMITTALS]: 'Product Submittals',
    [FolderType.SHOP_DRAWINGS]: 'Shop Drawings',
    [FolderType.RFI]: 'RFI (Requests for Information)',
    [FolderType.CHANGE_ORDERS]: 'Change Orders',
    [FolderType.SCHEDULE]: 'Schedule',
    [FolderType.PLANS_SPECS]: 'Plans & Specifications',
    [FolderType.SAFETY]: 'Safety',
    [FolderType.PAYMENT_APPS]: 'Payment Applications',
    [FolderType.ESTIMATING]: 'Estimating',
    [FolderType.DAILY_REPORTS]: 'Daily Reports/Logs',
    [FolderType.PUNCH_LISTS]: 'Punch Lists',
    [FolderType.CLOSEOUT]: 'Closeout Documents',
    [FolderType.AUDIT_TRAILS]: 'Audit Trails'
  };
  return names[folderType];
}

/**
 * Helper function to get folder icon
 */
export function getFolderIcon(folderType: FolderType): string {
  const icons: Record<FolderType, string> = {
    [FolderType.CONTRACTS]: '📄',
    [FolderType.SUBMITTALS]: '📋',
    [FolderType.SHOP_DRAWINGS]: '📐',
    [FolderType.RFI]: '❓',
    [FolderType.CHANGE_ORDERS]: '🔄',
    [FolderType.SCHEDULE]: '📅',
    [FolderType.PLANS_SPECS]: '🗂️',
    [FolderType.SAFETY]: '⚠️',
    [FolderType.PAYMENT_APPS]: '💰',
    [FolderType.ESTIMATING]: '🧮',
    [FolderType.DAILY_REPORTS]: '📝',
    [FolderType.PUNCH_LISTS]: '✅',
    [FolderType.CLOSEOUT]: '📦',
    [FolderType.AUDIT_TRAILS]: '🔍'
  };
  return icons[folderType];
}
