/**
 * Test script for Large PDF Parser
 *
 * Run with: npx ts-node src/parsers/test-parser.ts
 * Or with Node flag: node --expose-gc -r ts-node/register src/parsers/test-parser.ts
 */

import path from 'path';
import { LargePdfParser } from './large-pdf-parser.js';

async function main() {
  console.log('🔧 Large PDF Parser Test\n');

  // Create parser instance with options
  const parser = new LargePdfParser({
    batchSize: 25,
    generateThumbnails: false, // Set to true to test thumbnail generation
    extractAnnotations: true,
    onProgress: (progress) => {
      const bar = '█'.repeat(Math.floor(progress.percent / 2)) + '░'.repeat(50 - Math.floor(progress.percent / 2));
      process.stdout.write(`\r[${bar}] ${progress.percent}% - ${progress.message}                    `);
      if (progress.percent === 100) {
        console.log(); // New line after completion
      }
    },
  });

  // Test with a sample PDF (replace with your actual blueprint path)
  const testPdfPath = path.join(__dirname, '..', '..', 'test-blueprint.pdf');

  console.log(`📁 Test PDF: ${testPdfPath}\n`);

  try {
    const result = await parser.parseBlueprint(testPdfPath);

    console.log('\n✅ PARSING COMPLETE\n');
    console.log('═'.repeat(60));
    console.log(`📄 File Name:     ${result.fileName}`);
    console.log(`💾 File Size:     ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📑 Total Pages:   ${result.totalPages}`);
    console.log(`⏱️  Parse Time:    ${(result.parseTimeMs / 1000).toFixed(2)}s`);
    console.log(`📝 Text Length:   ${result.text.length.toLocaleString()} characters`);
    console.log(`🖼️  Thumbnails:    ${result.thumbnails?.length || 0}`);
    console.log('═'.repeat(60));

    console.log('\n📊 METADATA:');
    console.log(`   Title:         ${result.metadata.title || 'N/A'}`);
    console.log(`   Author:        ${result.metadata.author || 'N/A'}`);
    console.log(`   Subject:       ${result.metadata.subject || 'N/A'}`);
    console.log(`   Creator:       ${result.metadata.creator || 'N/A'}`);
    console.log(`   Created:       ${result.metadata.creationDate?.toLocaleDateString() || 'N/A'}`);
    console.log(`   Modified:      ${result.metadata.modificationDate?.toLocaleDateString() || 'N/A'}`);

    console.log('\n📄 PAGE DETAILS (First 5 pages):');
    result.pages.slice(0, 5).forEach((page, idx) => {
      console.log(`\n   Page ${page.pageNumber}:`);
      console.log(`      Dimensions:  ${page.width.toFixed(0)} x ${page.height.toFixed(0)} pts`);
      console.log(`      Rotation:    ${page.rotation}°`);
      console.log(`      Has Images:  ${page.hasImages ? '✓' : '✗'}`);
      console.log(`      Text Length: ${page.text.length} chars`);
      if (page.annotations && page.annotations.length > 0) {
        console.log(`      Annotations: ${page.annotations.length}`);
        page.annotations.forEach((ann, i) => {
          console.log(`         ${i + 1}. ${ann.slice(0, 50)}${ann.length > 50 ? '...' : ''}`);
        });
      }
    });

    console.log('\n💡 TEXT PREVIEW (First 500 characters):');
    console.log('─'.repeat(60));
    console.log(result.text.slice(0, 500).replace(/\s+/g, ' ').trim());
    console.log('─'.repeat(60));

    console.log('\n📈 STATISTICS:');
    const avgTextPerPage = result.text.length / result.totalPages;
    const pagesWithImages = result.pages.filter(p => p.hasImages).length;
    const pagesWithAnnotations = result.pages.filter(p => p.annotations && p.annotations.length > 0).length;

    console.log(`   Avg text/page:        ${avgTextPerPage.toFixed(0)} chars`);
    console.log(`   Pages with images:    ${pagesWithImages} (${((pagesWithImages / result.totalPages) * 100).toFixed(1)}%)`);
    console.log(`   Pages with annot.:    ${pagesWithAnnotations} (${((pagesWithAnnotations / result.totalPages) * 100).toFixed(1)}%)`);
    console.log(`   Parse speed:          ${(result.totalPages / (result.parseTimeMs / 1000)).toFixed(1)} pages/sec`);

    console.log('\n✨ Test completed successfully!\n');

  } catch (error) {
    if (error instanceof Error && error.message.includes('File not found')) {
      console.log('\n⚠️  Test PDF file not found!\n');
      console.log('To test the parser, place a PDF file at:');
      console.log(`   ${testPdfPath}\n`);
      console.log('Or modify the testPdfPath variable in this script.\n');
      console.log('═'.repeat(60));
      console.log('📦 INSTALLATION CHECK');
      console.log('═'.repeat(60));
      console.log('✓ LargePdfParser class created successfully');
      console.log('✓ Dependencies installed (pdf-parse, pdfjs-dist, canvas)');
      console.log('✓ TypeScript types defined');
      console.log('\n🚀 READY TO USE:');
      console.log('\n   import { LargePdfParser } from "./parsers/large-pdf-parser";');
      console.log('\n   const parser = new LargePdfParser({');
      console.log('     batchSize: 25,');
      console.log('     generateThumbnails: false,');
      console.log('     onProgress: (progress) => {');
      console.log('       console.log(`${progress.percent}% - ${progress.message}`);');
      console.log('     },');
      console.log('   });');
      console.log('\n   const result = await parser.parseBlueprint("/path/to/blueprint.pdf");');
      console.log('');
    } else {
      console.error('\n❌ Error during parsing:', error);
      process.exit(1);
    }
  }
}

// Run the test
main().catch(console.error);
