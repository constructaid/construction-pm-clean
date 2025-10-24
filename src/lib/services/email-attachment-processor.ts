/**
 * Email Attachment Processor
 * Automatically extracts, processes, and files email attachments into project folders
 */

interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  data: Buffer | string; // Base64 or Buffer
  contentId?: string;
}

interface ProcessedAttachment {
  originalFilename: string;
  savedFilename: string;
  contentType: string;
  size: number;
  folder: string; // Which project folder to save to
  subfolder?: string;
  category: string;
  extractedMetadata?: any;
}

/**
 * Process email attachments and determine where to file them
 */
export async function processEmailAttachments(
  attachments: EmailAttachment[],
  emailContext: {
    subject: string;
    body: string;
    category?: string;
    relatedDocumentType?: string;
    relatedDocumentNumber?: string;
  }
): Promise<ProcessedAttachment[]> {
  const processed: ProcessedAttachment[] = [];

  for (const attachment of attachments) {
    const result = await processAttachment(attachment, emailContext);
    processed.push(result);
  }

  return processed;
}

/**
 * Process a single attachment
 */
async function processAttachment(
  attachment: EmailAttachment,
  emailContext: any
): Promise<ProcessedAttachment> {
  // Determine file category
  const category = categorizeFile(attachment, emailContext);

  // Determine folder location based on category and content
  const folderLocation = determineFolderLocation(attachment, category, emailContext);

  // Extract metadata from file
  const metadata = await extractFileMetadata(attachment);

  // Generate safe filename
  const savedFilename = generateSafeFilename(attachment.filename, emailContext);

  return {
    originalFilename: attachment.filename,
    savedFilename,
    contentType: attachment.contentType,
    size: attachment.size,
    folder: folderLocation.folder,
    subfolder: folderLocation.subfolder,
    category,
    extractedMetadata: metadata,
  };
}

/**
 * Categorize file based on filename and type
 */
function categorizeFile(attachment: EmailAttachment, emailContext: any): string {
  const filename = attachment.filename.toLowerCase();
  const contentType = attachment.contentType.toLowerCase();

  // PDF documents
  if (contentType.includes('pdf')) {
    if (filename.includes('submittal') || emailContext.category === 'Submittal Review') {
      return 'submittal';
    }
    if (filename.includes('rfi') || emailContext.category === 'RFI Follow-up') {
      return 'rfi';
    }
    if (filename.includes('drawing') || filename.includes('dwg')) {
      return 'drawing';
    }
    if (filename.includes('spec') || filename.includes('specification')) {
      return 'specification';
    }
    if (filename.includes('contract') || filename.includes('agreement')) {
      return 'contract';
    }
    if (filename.includes('invoice') || filename.includes('pay app')) {
      return 'invoice';
    }
    return 'document';
  }

  // CAD files
  if (contentType.includes('dwg') || contentType.includes('dxf') ||
      filename.endsWith('.dwg') || filename.endsWith('.dxf') || filename.endsWith('.rvt')) {
    return 'drawing';
  }

  // Images (photos from field)
  if (contentType.includes('image')) {
    return 'photo';
  }

  // Spreadsheets
  if (contentType.includes('spreadsheet') || contentType.includes('excel') ||
      filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    return 'spreadsheet';
  }

  // Other documents
  return 'document';
}

/**
 * Determine which project folder to save file to
 * Based on the 19-folder standard structure
 */
function determineFolderLocation(
  attachment: EmailAttachment,
  category: string,
  emailContext: any
): { folder: string; subfolder?: string } {
  const filename = attachment.filename.toLowerCase();
  const subject = emailContext.subject?.toLowerCase() || '';
  const body = emailContext.body?.toLowerCase() || '';

  // Map categories to project folders (01-19)
  switch (category) {
    case 'rfi':
      return { folder: '08', subfolder: 'RFI' }; // 08 - RFIs & Submittals

    case 'submittal':
      return { folder: '08', subfolder: detectSubmittalDivision(attachment, emailContext) };

    case 'drawing':
      return { folder: '07', subfolder: detectDrawingType(filename) }; // 07 - Plans & Drawings

    case 'specification':
      return { folder: '03', subfolder: 'Specifications' }; // 03 - Contract Documents

    case 'contract':
      return { folder: '03' }; // 03 - Contract Documents

    case 'invoice':
    case 'pay-app':
      return { folder: '02', subfolder: 'Invoices' }; // 02 - Accounting

    case 'photo':
      return { folder: '18', subfolder: autoDetectPhotoCategory(filename, subject, body) }; // 18 - Photos

    case 'spreadsheet':
      // Check if budget/accounting related
      if (filename.includes('budget') || filename.includes('cost') || subject.includes('budget')) {
        return { folder: '02', subfolder: 'Budget' }; // 02 - Accounting
      }
      // Check if schedule related
      if (filename.includes('schedule') || subject.includes('schedule')) {
        return { folder: '06', subfolder: 'Schedules' }; // 06 - Schedule
      }
      return { folder: '10', subfolder: 'Spreadsheets' }; // 10 - Forms & Templates

    default:
      // Try to detect from email context
      if (emailContext.costCode) {
        const divMatch = emailContext.costCode.match(/DIV\s*(\d+)/i);
        if (divMatch) {
          return { folder: '05', subfolder: `DIV ${divMatch[1]}` }; // 05 - Subcontractors
        }
      }

      // Default to general documents
      return { folder: '09' }; // 09 - Project Correspondence
  }
}

/**
 * Detect CSI division for submittal
 */
function detectSubmittalDivision(attachment: EmailAttachment, emailContext: any): string {
  const text = `${attachment.filename} ${emailContext.subject} ${emailContext.body}`.toLowerCase();

  // Common CSI divisions
  const divisions = [
    { num: 2, keywords: ['site', 'demo', 'demolition', 'earthwork'] },
    { num: 3, keywords: ['concrete', 'foundation'] },
    { num: 4, keywords: ['masonry', 'brick', 'block', 'stone'] },
    { num: 5, keywords: ['metal', 'steel', 'structural'] },
    { num: 6, keywords: ['wood', 'lumber', 'framing', 'carpentry'] },
    { num: 7, keywords: ['thermal', 'insulation', 'roofing', 'waterproof'] },
    { num: 8, keywords: ['door', 'window', 'glass', 'glazing'] },
    { num: 9, keywords: ['finish', 'drywall', 'paint', 'flooring', 'ceiling'] },
    { num: 21, keywords: ['fire', 'sprinkler', 'suppression'] },
    { num: 22, keywords: ['plumbing', 'water', 'sewer', 'drainage'] },
    { num: 23, keywords: ['hvac', 'mechanical', 'air', 'duct'] },
    { num: 26, keywords: ['electrical', 'power', 'lighting', 'panel'] },
    { num: 27, keywords: ['communications', 'data', 'telecom'] },
    { num: 28, keywords: ['security', 'alarm', 'access control'] },
  ];

  for (const div of divisions) {
    if (div.keywords.some(keyword => text.includes(keyword))) {
      return `DIV ${div.num.toString().padStart(2, '0')}`;
    }
  }

  return 'Submittals'; // Default
}

/**
 * Detect drawing type
 */
function detectDrawingType(filename: string): string {
  if (filename.includes('arch')) return 'Architectural';
  if (filename.includes('struct') || filename.includes('s-')) return 'Structural';
  if (filename.includes('mech') || filename.includes('m-')) return 'Mechanical';
  if (filename.includes('elec') || filename.includes('e-')) return 'Electrical';
  if (filename.includes('plumb') || filename.includes('p-')) return 'Plumbing';
  if (filename.includes('civil') || filename.includes('c-')) return 'Civil';
  return 'Drawings';
}

/**
 * Auto-detect photo category based on content
 */
function autoDetectPhotoCategory(filename: string, subject: string, body: string): string {
  const text = `${filename} ${subject} ${body}`.toLowerCase();

  if (text.includes('progress')) return 'Progress Photos';
  if (text.includes('safety') || text.includes('incident')) return 'Safety';
  if (text.includes('issue') || text.includes('problem') || text.includes('defect')) return 'Issues';
  if (text.includes('before')) return 'Before';
  if (text.includes('after')) return 'After';
  if (text.includes('inspection')) return 'Inspections';

  return 'General';
}

/**
 * Extract metadata from file
 */
async function extractFileMetadata(attachment: EmailAttachment): Promise<any> {
  const metadata: any = {
    filename: attachment.filename,
    size: attachment.size,
    contentType: attachment.contentType,
    uploadedAt: new Date().toISOString(),
  };

  // Extract from filename patterns
  const filenamePatterns = {
    // Drawing numbers: A-101, S-201, M-301, etc.
    drawingNumber: /([A-Z]-\d{3})/,
    // Submittal numbers: SUBM-045, 045, etc.
    submittalNumber: /(?:SUBM|SUB)?[#-]?(\d{3})/i,
    // RFI numbers
    rfiNumber: /RFI[#-]?(\d{3})/i,
    // Revision numbers
    revision: /REV[#-]?(\d+)/i,
    // Date in filename
    date: /(\d{4}[-_]\d{2}[-_]\d{2})/,
  };

  for (const [key, pattern] of Object.entries(filenamePatterns)) {
    const match = attachment.filename.match(pattern);
    if (match) {
      metadata[key] = match[1];
    }
  }

  // For PDFs, could extract more metadata using pdf-parse library
  // For images, could extract EXIF data
  // For now, return basic metadata

  return metadata;
}

/**
 * Generate safe filename with timestamp and metadata
 */
function generateSafeFilename(originalFilename: string, emailContext: any): string {
  const ext = originalFilename.split('.').pop();
  const nameWithoutExt = originalFilename.replace(`.${ext}`, '');

  // Clean filename (remove special chars)
  let safeName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');

  // Add timestamp to prevent duplicates
  const timestamp = new Date().toISOString().split('T')[0];

  // Add document number if available
  if (emailContext.relatedDocumentNumber) {
    const docType = emailContext.relatedDocumentType?.replace(' ', '') || 'DOC';
    safeName = `${docType}-${emailContext.relatedDocumentNumber}_${safeName}`;
  }

  return `${safeName}_${timestamp}.${ext}`;
}

/**
 * Save attachment to project folder structure
 */
export async function saveAttachmentToFolder(
  projectId: number,
  processed: ProcessedAttachment,
  fileData: Buffer | string
): Promise<{ success: boolean; path: string }> {
  // In production, this would:
  // 1. Upload to cloud storage (S3, Azure Blob, etc.)
  // 2. Save to local filesystem
  // 3. Update database with file record

  const path = `projects/${projectId}/${processed.folder}${processed.subfolder ? '/' + processed.subfolder : ''}/${processed.savedFilename}`;

  // For now, simulate save
  console.log(`Saving attachment to: ${path}`);

  return {
    success: true,
    path,
  };
}

/**
 * Create file record in database
 */
export async function createFileRecord(
  projectId: number,
  folderId: number,
  processed: ProcessedAttachment,
  filePath: string
) {
  // In production, insert into database
  const fileRecord = {
    id: Math.floor(Math.random() * 10000),
    projectId,
    folderId,
    name: processed.savedFilename,
    originalName: processed.originalFilename,
    path: filePath,
    size: processed.size,
    mimeType: processed.contentType,
    category: processed.category,
    metadata: processed.extractedMetadata,
    uploadedBy: 'Email Integration',
    uploadedAt: new Date().toISOString(),
  };

  console.log('Created file record:', fileRecord);

  return fileRecord;
}
