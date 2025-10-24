/**
 * Project Folder Structure Schema
 * Based on the ORG 162 MOCKINGBIRD ES filing system
 * Implements standardized construction project folder hierarchy
 */

import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

/**
 * Project Folders - Hierarchical folder structure for each project
 */
export const projectFolders = pgTable('project_folders', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  parentFolderId: integer('parent_folder_id'), // null for root folders
  folderNumber: text('folder_number'), // e.g., "01", "05", "08"
  folderName: text('folder_name').notNull(), // e.g., "Job Information", "Submittals"
  folderPath: text('folder_path').notNull(), // Full path for quick lookups
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  level: integer('level').notNull().default(0), // 0 = root, 1 = subfolder, etc.
  isSystemFolder: boolean('is_system_folder').default(true), // Standard folders vs custom
  metadata: jsonb('metadata'), // Store additional folder properties
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Folder Files - Documents stored within folders
 */
export const folderFiles = pgTable('folder_files', {
  id: serial('id').primaryKey(),
  folderId: integer('folder_id').notNull(),
  projectId: integer('project_id').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type'), // pdf, xlsx, docx, jpg, etc.
  fileSize: integer('file_size'), // in bytes
  filePath: text('file_path').notNull(), // Storage path
  fileUrl: text('file_url'), // Public URL if applicable
  description: text('description'),
  uploadedBy: integer('uploaded_by'),
  version: integer('version').default(1),
  tags: text('tags'), // Comma-separated tags
  metadata: jsonb('metadata'), // Additional file properties
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Standard Project Folder Template
 * Based on construction industry best practices
 */
export const STANDARD_PROJECT_FOLDERS = [
  {
    number: '01',
    name: 'Job Information',
    subfolders: [
      'BUYOUT & SETUP FORMS',
      'Certificate of Insurance',
      'City Permits',
      'EPA - (SWPPP)',
      'Resale Tax Cert',
      'TAS & TDLR'
    ]
  },
  {
    number: '02',
    name: 'Budgets & Proposals',
    subfolders: [
      'BIDS',
      'Budget Tracking',
      'Change Orders',
      'Cost Analysis'
    ]
  },
  {
    number: '03',
    name: 'Owner',
    subfolders: [
      'Correspondence',
      'Contracts',
      'Owner Documents'
    ]
  },
  {
    number: '04',
    name: 'Meeting Minutes',
    subfolders: []
  },
  {
    number: '05',
    name: 'Subcontractor-Suppliers',
    subfolders: [
      'DIV 2 DEMO',
      'DIV 3 CONCRETE',
      'DIV 4 MASONRY',
      'DIV 5 METALS',
      'DIV 6 CARPENTRY',
      'DIV 7 THERMAL AND MOISTURE PROTECTION',
      'DIV 8 OPENINGS',
      'DIV 9 FINISHES',
      'DIV 10 SPECIALITIES',
      'DIV 12 FURNISHINGS',
      'DIV 22 PLUMBING',
      'DIV 23 HVAC',
      'DIV 26 ELECTRICAL VBC',
      'DIV 28 FIRE ALARM',
      'DIV 31 EARTHWORK',
      'DIV 32 EXTERIOR IMPROVEMENTS',
      'PO TEMPLATE - Cost Code - Sub Name - Scope - Amount',
      'SOW Templates Word Docs',
      'SUB CONTRACT TEMPLATE - Cost Code - Sub Name - Scope - Amount',
      'Subcontractor Packet'
    ]
  },
  {
    number: '06',
    name: 'Schedule',
    subfolders: []
  },
  {
    number: '07',
    name: 'Plans and Specifications',
    subfolders: [
      'Architectural',
      'Structural',
      'Mechanical',
      'Electrical',
      'Plumbing',
      'As-Built Drawings'
    ]
  },
  {
    number: '08',
    name: 'Submittals',
    subfolders: [
      'DIV 06 MILLWORK',
      'DIV 08 OPENINGS',
      'DIV 09 FINISHES',
      'DIV 09 Painting',
      'Electrical',
      'HVAC',
      'Plumbing',
      'ROOFING',
      'RESPONSES',
      'AUDITS'
    ]
  },
  {
    number: '09',
    name: 'Photos',
    subfolders: [
      'Progress Photos',
      'Before Photos',
      'After Photos',
      'Site Conditions'
    ]
  },
  {
    number: '10',
    name: 'Weekly Status Reports & Daily Reports',
    subfolders: []
  },
  {
    number: '11',
    name: 'Closeout, Punch List, & TDH',
    subfolders: [
      'Punch List',
      'Warranties',
      'As-Builts',
      'O&M Manuals'
    ]
  },
  {
    number: '12',
    name: 'RFI - Request for Information',
    subfolders: []
  },
  {
    number: '13',
    name: "CAEA's, CAEL's",
    subfolders: []
  },
  {
    number: '14',
    name: "COI's",
    subfolders: []
  },
  {
    number: '15',
    name: 'Custodian OT Forms',
    subfolders: []
  },
  {
    number: '16',
    name: 'Payment Applications',
    subfolders: []
  },
  {
    number: '17',
    name: 'SAFETY MANUAL AND FORMS',
    subfolders: [
      'Safety Plans',
      'Incident Reports',
      'Inspections',
      'Training Records'
    ]
  },
  {
    number: '18',
    name: 'Badging',
    subfolders: []
  },
  {
    number: '19',
    name: 'Sub Waivers',
    subfolders: []
  }
];

/**
 * Helper function to initialize standard folders for a new project
 */
export function generateStandardFolders(projectId: number) {
  const folders: any[] = [];
  let sortOrder = 0;

  STANDARD_PROJECT_FOLDERS.forEach((folder) => {
    // Create parent folder
    const parentPath = `/${folder.number} ${folder.name}`;
    folders.push({
      projectId,
      parentFolderId: null,
      folderNumber: folder.number,
      folderName: folder.name,
      folderPath: parentPath,
      sortOrder: sortOrder++,
      level: 0,
      isSystemFolder: true,
    });

    // Create subfolders
    folder.subfolders.forEach((subfolder, index) => {
      folders.push({
        projectId,
        parentFolderId: null, // Will be set after parent is created
        folderNumber: `${folder.number}.${index + 1}`,
        folderName: subfolder,
        folderPath: `${parentPath}/${subfolder}`,
        sortOrder: sortOrder++,
        level: 1,
        isSystemFolder: true,
      });
    });
  });

  return folders;
}
