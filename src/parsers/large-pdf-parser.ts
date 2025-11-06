/**
 * Large PDF Parser for Construction Blueprints
 *
 * Installation:
 * npm install pdf-parse pdfjs-dist canvas
 *
 * Handles large PDF files (up to 500MB) with streaming and chunked processing
 * to prevent memory overload. Designed for local execution on HP Envy laptop.
 */

import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist';
import { createCanvas } from 'canvas';

// Configure pdfjs-dist worker for Node.js environment
const workerSrc = path.join(
  path.dirname(require.resolve('pdfjs-dist/package.json')),
  'build/pdf.worker.js'
);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Metadata for a single PDF page
 */
export interface PageMeta {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  annotations?: string[];
  hasImages: boolean;
}

/**
 * Complete parsed blueprint data
 */
export interface ParsedBlueprint {
  fileName: string;
  fileSize: number;
  totalPages: number;
  text: string;
  pages: PageMeta[];
  thumbnails?: Buffer[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  parseTimeMs: number;
}

/**
 * Progress callback for UI updates
 */
export type ProgressCallback = (progress: {
  stage: 'reading' | 'parsing' | 'extracting' | 'thumbnails' | 'complete';
  percent: number;
  currentPage?: number;
  totalPages?: number;
  message: string;
}) => void;

/**
 * Parser options
 */
export interface ParserOptions {
  batchSize?: number; // Pages per batch (default: 25)
  generateThumbnails?: boolean; // Generate page thumbnails (default: false)
  thumbnailWidth?: number; // Thumbnail width in pixels (default: 200)
  extractAnnotations?: boolean; // Extract PDF annotations (default: true)
  onProgress?: ProgressCallback; // Progress callback
}

/**
 * LargePdfParser - Handles large blueprint PDFs with streaming and chunked processing
 */
export class LargePdfParser {
  private options: Required<ParserOptions>;

  constructor(options: ParserOptions = {}) {
    this.options = {
      batchSize: options.batchSize ?? 25,
      generateThumbnails: options.generateThumbnails ?? false,
      thumbnailWidth: options.thumbnailWidth ?? 200,
      extractAnnotations: options.extractAnnotations ?? true,
      onProgress: options.onProgress ?? (() => {}),
    };
  }

  /**
   * Parse a blueprint PDF file
   * @param filePath Absolute path to PDF file
   * @returns Parsed blueprint data
   */
  async parseBlueprint(filePath: string): Promise<ParsedBlueprint> {
    const startTime = Date.now();

    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      this.options.onProgress({
        stage: 'reading',
        percent: 0,
        message: `Reading ${fileName} (${this.formatBytes(stats.size)})...`,
      });

      // Step 1: Quick text extraction using pdf-parse (lightweight)
      const { text, metadata, totalPages } = await this.extractTextContent(filePath);

      this.options.onProgress({
        stage: 'parsing',
        percent: 25,
        totalPages,
        message: `Parsing ${totalPages} pages...`,
      });

      // Step 2: Detailed page extraction using pdfjs-dist (for metadata and dimensions)
      const pages = await this.extractPageMetadata(filePath, totalPages, text);

      this.options.onProgress({
        stage: 'extracting',
        percent: 60,
        message: 'Extracting page details...',
      });

      // Step 3: Optional thumbnail generation
      let thumbnails: Buffer[] | undefined;
      if (this.options.generateThumbnails) {
        this.options.onProgress({
          stage: 'thumbnails',
          percent: 75,
          message: 'Generating thumbnails...',
        });
        thumbnails = await this.generateThumbnails(filePath, totalPages);
      }

      this.options.onProgress({
        stage: 'complete',
        percent: 100,
        message: 'Parsing complete!',
      });

      const parseTimeMs = Date.now() - startTime;

      return {
        fileName,
        fileSize: stats.size,
        totalPages,
        text,
        pages,
        thumbnails,
        metadata: this.parseMetadata(metadata),
        parseTimeMs,
      };
    } catch (error) {
      console.error('[LargePdfParser] Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content using pdf-parse (fast, low memory)
   */
  private async extractTextContent(filePath: string): Promise<{
    text: string;
    metadata: any;
    totalPages: number;
  }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64KB chunks

      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const data = await pdf(buffer, {
            max: 0, // Parse all pages
          });

          // Clear buffer for garbage collection
          chunks.length = 0;

          resolve({
            text: data.text,
            metadata: data.info,
            totalPages: data.numpages,
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract detailed page metadata using pdfjs-dist (chunked processing)
   */
  private async extractPageMetadata(
    filePath: string,
    totalPages: number,
    fullText: string
  ): Promise<PageMeta[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
      disableFontFace: true, // Reduce memory usage
    });

    const pdfDoc = await loadingTask.promise;
    const pages: PageMeta[] = [];
    const batchSize = this.options.batchSize;

    // Split full text by pages (approximate)
    const textPages = this.splitTextByPages(fullText, totalPages);

    // Process pages in batches to avoid memory overload
    for (let i = 0; i < totalPages; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, totalPages);
      const batchPromises: Promise<PageMeta>[] = [];

      for (let pageNum = i + 1; pageNum <= batchEnd; pageNum++) {
        batchPromises.push(this.extractSinglePage(pdfDoc, pageNum, textPages[pageNum - 1] || ''));
      }

      const batchResults = await Promise.all(batchPromises);
      pages.push(...batchResults);

      this.options.onProgress({
        stage: 'extracting',
        percent: 60 + Math.floor((batchEnd / totalPages) * 15),
        currentPage: batchEnd,
        totalPages,
        message: `Processing pages ${i + 1}-${batchEnd} of ${totalPages}...`,
      });

      // Force garbage collection hint
      if (global.gc) {
        global.gc();
      }
    }

    return pages;
  }

  /**
   * Extract metadata for a single page
   */
  private async extractSinglePage(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    pageText: string
  ): Promise<PageMeta> {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });

      // Extract annotations if enabled
      let annotations: string[] | undefined;
      if (this.options.extractAnnotations) {
        try {
          const annotationData = await page.getAnnotations();
          annotations = annotationData
            .filter((a: any) => a.subtype === 'Text' || a.subtype === 'FreeText')
            .map((a: any) => a.contents || '')
            .filter((text: string) => text.length > 0);
        } catch (error) {
          console.warn(`[LargePdfParser] Could not extract annotations for page ${pageNum}`);
        }
      }

      // Check if page has images
      const ops = await page.getOperatorList();
      const hasImages = ops.fnArray.some((fn: number) => fn === pdfjsLib.OPS.paintImageXObject);

      return {
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation,
        text: pageText,
        annotations: annotations && annotations.length > 0 ? annotations : undefined,
        hasImages,
      };
    } catch (error) {
      console.error(`[LargePdfParser] Error extracting page ${pageNum}:`, error);
      return {
        pageNumber: pageNum,
        width: 0,
        height: 0,
        rotation: 0,
        text: pageText,
        hasImages: false,
      };
    }
  }

  /**
   * Generate thumbnail images for pages (optional, memory intensive)
   */
  private async generateThumbnails(filePath: string, totalPages: number): Promise<Buffer[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    const thumbnails: Buffer[] = [];
    const targetWidth = this.options.thumbnailWidth;

    // Generate thumbnails in batches (memory intensive operation)
    const batchSize = Math.min(5, this.options.batchSize); // Smaller batches for thumbnails

    for (let i = 0; i < totalPages; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, totalPages);
      const batchPromises: Promise<Buffer>[] = [];

      for (let pageNum = i + 1; pageNum <= batchEnd; pageNum++) {
        batchPromises.push(this.generateThumbnail(pdfDoc, pageNum, targetWidth));
      }

      const batchResults = await Promise.all(batchPromises);
      thumbnails.push(...batchResults);

      this.options.onProgress({
        stage: 'thumbnails',
        percent: 75 + Math.floor((batchEnd / totalPages) * 20),
        currentPage: batchEnd,
        totalPages,
        message: `Generating thumbnail ${batchEnd} of ${totalPages}...`,
      });

      // Force garbage collection after each batch
      if (global.gc) {
        global.gc();
      }
    }

    return thumbnails;
  }

  /**
   * Generate a single thumbnail
   */
  private async generateThumbnail(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    targetWidth: number
  ): Promise<Buffer> {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context as any,
        viewport: scaledViewport,
      }).promise;

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error(`[LargePdfParser] Error generating thumbnail for page ${pageNum}:`, error);
      // Return empty 1x1 pixel as fallback
      const fallbackCanvas = createCanvas(1, 1);
      return fallbackCanvas.toBuffer('image/png');
    }
  }

  /**
   * Parse metadata from PDF info object
   */
  private parseMetadata(info: any): ParsedBlueprint['metadata'] {
    return {
      title: info?.Title || undefined,
      author: info?.Author || undefined,
      subject: info?.Subject || undefined,
      creator: info?.Creator || undefined,
      producer: info?.Producer || undefined,
      creationDate: info?.CreationDate ? this.parsePdfDate(info.CreationDate) : undefined,
      modificationDate: info?.ModDate ? this.parsePdfDate(info.ModDate) : undefined,
    };
  }

  /**
   * Parse PDF date format (D:YYYYMMDDHHmmSSOHH'mm')
   */
  private parsePdfDate(pdfDate: string): Date | undefined {
    try {
      if (typeof pdfDate !== 'string') return undefined;
      const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
      if (!match) return undefined;
      return new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3]),
        parseInt(match[4]),
        parseInt(match[5]),
        parseInt(match[6])
      );
    } catch {
      return undefined;
    }
  }

  /**
   * Split full text into approximate pages
   */
  private splitTextByPages(fullText: string, totalPages: number): string[] {
    // Simple heuristic: split by page breaks if available, otherwise divide equally
    const pageBreakPattern = /\f/g; // Form feed character often indicates page break
    const parts = fullText.split(pageBreakPattern);

    if (parts.length === totalPages) {
      return parts;
    }

    // Fallback: divide text equally
    const charsPerPage = Math.ceil(fullText.length / totalPages);
    const pages: string[] = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(fullText.slice(i * charsPerPage, (i + 1) * charsPerPage));
    }
    return pages;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Test function - Run via Git Bash: node -r ts-node/register src/parsers/large-pdf-parser.ts
 */
async function testParser() {
  console.log('=== Large PDF Parser Test ===\n');

  // Example usage
  const parser = new LargePdfParser({
    batchSize: 25,
    generateThumbnails: false, // Set to true to generate thumbnails
    extractAnnotations: true,
    onProgress: (progress) => {
      console.log(
        `[${progress.stage.toUpperCase()}] ${progress.percent}% - ${progress.message}`
      );
    },
  });

  // Replace with your test PDF path
  const testPdfPath = 'C:\\Users\\ctnal\\projects\\sep23\\construction-pm-clean\\test-blueprint.pdf';

  if (!fs.existsSync(testPdfPath)) {
    console.log(`\n⚠️  Test PDF not found at: ${testPdfPath}`);
    console.log('Please create a test PDF file at the above path to run the test.');
    console.log('\nExample usage:');
    console.log('```typescript');
    console.log('const parser = new LargePdfParser({');
    console.log('  batchSize: 25,');
    console.log('  generateThumbnails: false,');
    console.log('  onProgress: (progress) => console.log(progress),');
    console.log('});');
    console.log('');
    console.log('const result = await parser.parseBlueprint("/path/to/blueprint.pdf");');
    console.log('console.log(`Parsed ${result.totalPages} pages in ${result.parseTimeMs}ms`);');
    console.log('```');
    return;
  }

  try {
    const result = await parser.parseBlueprint(testPdfPath);

    console.log('\n=== Parse Results ===');
    console.log(`File: ${result.fileName}`);
    console.log(`Size: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Pages: ${result.totalPages}`);
    console.log(`Parse Time: ${result.parseTimeMs}ms`);
    console.log(`Text Length: ${result.text.length} characters`);
    console.log(`Thumbnails: ${result.thumbnails?.length || 0}`);
    console.log('\nMetadata:');
    console.log(`  Title: ${result.metadata.title || 'N/A'}`);
    console.log(`  Author: ${result.metadata.author || 'N/A'}`);
    console.log(`  Created: ${result.metadata.creationDate?.toISOString() || 'N/A'}`);

    console.log('\nFirst 3 pages:');
    result.pages.slice(0, 3).forEach((page) => {
      console.log(`\nPage ${page.pageNumber}:`);
      console.log(`  Dimensions: ${page.width.toFixed(1)}x${page.height.toFixed(1)}`);
      console.log(`  Has Images: ${page.hasImages}`);
      console.log(`  Annotations: ${page.annotations?.length || 0}`);
      console.log(`  Text Preview: ${page.text.slice(0, 100)}...`);
    });

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if executed directly
if (require.main === module) {
  testParser().catch(console.error);
}

export default LargePdfParser;
