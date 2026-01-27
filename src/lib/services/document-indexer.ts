/**
 * Document Indexer Service
 *
 * Processes documents (PDFs, TXT) and indexes them for search and AI analysis
 * Handles file change detection, caching, and batch processing
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { LargePdfParser } from '../../parsers/large-pdf-parser';
import type { ParsedBlueprint } from '../../parsers/large-pdf-parser';

export interface DocumentIndexerOptions {
  batchSize?: number; // Number of files to process in parallel
  skipExisting?: boolean; // Skip files that haven't changed (based on hash)
  extractAnnotations?: boolean;
  generateThumbnails?: boolean;
  onProgress?: (progress: IndexingProgress) => void;
}

export interface IndexingProgress {
  stage: 'scanning' | 'processing' | 'analyzing' | 'saving' | 'complete';
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  percent: number;
  errors: string[];
}

export interface IndexedDocumentData {
  // File info
  filePath: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;

  // Extracted content
  extractedText: string;
  extractedTextLength: number;
  pageCount: number;

  // Document metadata
  documentMetadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };

  // Processing info
  processingTimeMs: number;
  processedAt: Date;

  // Auto-extracted entities
  extractedEntities: {
    rfiNumbers: string[];
    submittalNumbers: string[];
    changeOrderNumbers: string[];
    drawingNumbers: string[];
    dates: Array<{ date: string; context: string; type: string }>;
    parties: string[];
  };

  // Auto-detected classification
  suggestedDocumentType?: string;
  suggestedFolderType?: string;
  suggestedCsiDivision?: string;
  keywords: string[];
}

/**
 * Document Indexer - Batch processes documents for search and AI analysis
 */
export class DocumentIndexer {
  private options: Required<DocumentIndexerOptions>;
  private pdfParser: LargePdfParser;

  constructor(options: DocumentIndexerOptions = {}) {
    this.options = {
      batchSize: options.batchSize ?? 5,
      skipExisting: options.skipExisting ?? true,
      extractAnnotations: options.extractAnnotations ?? true,
      generateThumbnails: options.generateThumbnails ?? false,
      onProgress: options.onProgress ?? (() => {}),
    };

    this.pdfParser = new LargePdfParser({
      batchSize: 50,
      extractAnnotations: this.options.extractAnnotations,
      generateThumbnails: this.options.generateThumbnails,
    });
  }

  /**
   * Index all documents in a directory recursively
   */
  async indexDirectory(dirPath: string): Promise<IndexedDocumentData[]> {
    const startTime = Date.now();
    const results: IndexedDocumentData[] = [];
    const errors: string[] = [];

    try {
      // Scan directory for PDF files
      this.options.onProgress({
        stage: 'scanning',
        totalFiles: 0,
        processedFiles: 0,
        percent: 0,
        errors,
      });

      const files = await this.scanDirectory(dirPath);
      const totalFiles = files.length;

      this.options.onProgress({
        stage: 'processing',
        totalFiles,
        processedFiles: 0,
        percent: 0,
        errors,
      });

      // Process files in batches
      for (let i = 0; i < files.length; i += this.options.batchSize) {
        const batch = files.slice(i, i + this.options.batchSize);
        const batchPromises = batch.map(async (filePath) => {
          try {
            const result = await this.indexDocument(filePath);
            return result;
          } catch (error) {
            const errorMsg = `Error processing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((r): r is IndexedDocumentData => r !== null));

        this.options.onProgress({
          stage: 'processing',
          totalFiles,
          processedFiles: Math.min(i + this.options.batchSize, totalFiles),
          currentFile: batch[batch.length - 1],
          percent: Math.floor((Math.min(i + this.options.batchSize, totalFiles) / totalFiles) * 100),
          errors,
        });
      }

      this.options.onProgress({
        stage: 'complete',
        totalFiles,
        processedFiles: totalFiles,
        percent: 100,
        errors,
      });

      const totalTime = Date.now() - startTime;
      console.log(`\nIndexing complete: ${results.length} documents processed in ${totalTime}ms`);
      if (errors.length > 0) {
        console.log(`Errors: ${errors.length}`);
      }

      return results;
    } catch (error) {
      console.error('Error indexing directory:', error);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(filePath: string): Promise<IndexedDocumentData> {
    const startTime = Date.now();

    try {
      // Get file info
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const fileHash = await this.calculateFileHash(filePath);
      const mimeType = this.getMimeType(fileName);

      // Extract text based on file type
      let extractedText: string;
      let pageCount: number;
      let documentMetadata: any = {};

      if (mimeType === 'application/pdf') {
        const parsed = await this.pdfParser.parseBlueprint(filePath);
        extractedText = parsed.text;
        pageCount = parsed.totalPages;
        documentMetadata = parsed.metadata;
      } else if (mimeType === 'text/plain') {
        extractedText = fs.readFileSync(filePath, 'utf-8');
        pageCount = 1;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Extract entities from text
      const extractedEntities = this.extractEntities(extractedText, fileName);

      // Auto-classify document
      const classification = this.classifyDocument(extractedText, fileName, extractedEntities);

      // Extract keywords
      const keywords = this.extractKeywords(extractedText);

      const processingTimeMs = Date.now() - startTime;

      return {
        filePath,
        fileName,
        fileSize: stats.size,
        fileHash,
        mimeType,
        extractedText,
        extractedTextLength: extractedText.length,
        pageCount,
        documentMetadata,
        processingTimeMs,
        processedAt: new Date(),
        extractedEntities,
        suggestedDocumentType: classification.documentType,
        suggestedFolderType: classification.folderType,
        suggestedCsiDivision: classification.csiDivision,
        keywords,
      };
    } catch (error) {
      console.error(`Error indexing document ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Scan directory recursively for supported documents
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const supportedExtensions = ['.pdf', '.txt'];
    const files: string[] = [];

    const scanRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanRecursive(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    scanRecursive(dirPath);
    return files;
  }

  /**
   * Calculate MD5 hash of file for change detection
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Extract construction-specific entities from text
   */
  private extractEntities(text: string, fileName: string): IndexedDocumentData['extractedEntities'] {
    const entities = {
      rfiNumbers: [] as string[],
      submittalNumbers: [] as string[],
      changeOrderNumbers: [] as string[],
      drawingNumbers: [] as string[],
      dates: [] as Array<{ date: string; context: string; type: string }>,
      parties: [] as string[],
    };

    // Extract RFI numbers
    const rfiPattern = /RFI[-\s]?#?(\d{3,4})|Request for Information[-\s]?#?(\d{3,4})/gi;
    let match;
    while ((match = rfiPattern.exec(text)) !== null) {
      const num = match[1] || match[2];
      const formatted = `RFI-${num.padStart(3, '0')}`;
      if (!entities.rfiNumbers.includes(formatted)) {
        entities.rfiNumbers.push(formatted);
      }
    }

    // Extract Submittal numbers
    const submittalPattern = /SUB(?:MITTAL)?[-\s]?#?(\d{3,4})|SUBM[-\s]?(\d{3,4})/gi;
    while ((match = submittalPattern.exec(text)) !== null) {
      const num = match[1] || match[2];
      const formatted = `SUB-${num.padStart(3, '0')}`;
      if (!entities.submittalNumbers.includes(formatted)) {
        entities.submittalNumbers.push(formatted);
      }
    }

    // Extract Change Order numbers
    const coPattern = /(?:PCO|CO)[-\s]?#?(\d{3,4})|Change Order[-\s]?#?(\d{3,4})/gi;
    while ((match = coPattern.exec(text)) !== null) {
      const num = match[1] || match[2];
      const formatted = `CO-${num.padStart(3, '0')}`;
      if (!entities.changeOrderNumbers.includes(formatted)) {
        entities.changeOrderNumbers.push(formatted);
      }
    }

    // Extract Drawing numbers
    const drawingPattern = /([ASMEPC])-?(\d{3})|([ASMEPC])(\d{2,3})/g;
    while ((match = drawingPattern.exec(text)) !== null) {
      const prefix = match[1] || match[3];
      const num = match[2] || match[4];
      const formatted = `${prefix}-${num.padStart(3, '0')}`;
      if (!entities.drawingNumbers.includes(formatted)) {
        entities.drawingNumbers.push(formatted);
      }
    }

    // Extract dates
    const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
    while ((match = datePattern.exec(text)) !== null) {
      const context = text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 50));
      entities.dates.push({
        date: match[1],
        context: context.replace(/\s+/g, ' ').trim(),
        type: 'unknown',
      });
    }

    // Extract common construction parties
    const parties = ['General Contractor', 'Architect', 'Engineer', 'Subcontractor', 'Owner', 'Inspector', 'Consultant'];
    parties.forEach((party) => {
      if (text.includes(party)) {
        entities.parties.push(party);
      }
    });

    return entities;
  }

  /**
   * Auto-classify document based on content and filename
   */
  private classifyDocument(
    text: string,
    fileName: string,
    entities: IndexedDocumentData['extractedEntities']
  ): { documentType?: string; folderType?: string; csiDivision?: string } {
    const lowerText = text.toLowerCase();
    const lowerName = fileName.toLowerCase();

    let documentType: string | undefined;
    let folderType: string | undefined;
    let csiDivision: string | undefined;

    // Classify by RFI
    if (entities.rfiNumbers.length > 0 || lowerText.includes('request for information') || lowerName.includes('rfi')) {
      documentType = 'rfi';
      folderType = 'rfis';
    }

    // Classify by Submittal
    if (entities.submittalNumbers.length > 0 || lowerText.includes('submittal') || lowerName.includes('submittal')) {
      documentType = 'submittal';
      folderType = 'submittals';
    }

    // Classify by Change Order
    if (entities.changeOrderNumbers.length > 0 || lowerText.includes('change order') || lowerName.includes('change order')) {
      documentType = 'change_order';
      folderType = 'change_orders';
    }

    // Classify by Drawing
    if (entities.drawingNumbers.length > 0 || lowerName.includes('plan') || lowerName.includes('drawing')) {
      documentType = 'blueprint';
      folderType = 'plans_specs';
    }

    // Classify by Safety
    if (lowerText.includes('safety') || lowerText.includes('osha') || lowerName.includes('safety')) {
      documentType = 'safety';
      folderType = 'safety';
    }

    // Detect CSI Division
    const csiPattern = /(?:CSI )?(?:DIV(?:ISION)? )?(\d{2})/i;
    const csiMatch = text.match(csiPattern);
    if (csiMatch) {
      csiDivision = csiMatch[1].padStart(2, '0');
    }

    // CSI Division keyword mapping
    const csiKeywords: Record<string, string> = {
      'concrete': '03',
      'masonry': '04',
      'metals': '05',
      'wood': '06',
      'roofing': '07',
      'electrical': '26',
      'hvac': '23',
      'mechanical': '23',
      'plumbing': '22',
      'fire protection': '21',
      'sprinkler': '21',
    };

    for (const [keyword, division] of Object.entries(csiKeywords)) {
      if (lowerText.includes(keyword)) {
        csiDivision = division;
        break;
      }
    }

    return { documentType, folderType, csiDivision };
  }

  /**
   * Extract important keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - counts word frequency
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
      'this', 'that', 'these', 'those', 'it', 'its', 'will', 'shall',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top 20 most frequent words
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }
}
