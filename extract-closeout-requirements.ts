import { LargePdfParser } from './src/parsers/large-pdf-parser.js';
import * as fs from 'fs';
import * as path from 'path';

async function extractCloseoutRequirements() {
  console.log('🔍 Extracting closeout requirements from Thomas C Marsh Project Manual...\n');

  const projectManualParts = [
    'forms and templates/11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations/07 Plans and Specifications/Specifications/Project Manual CompressedPart-1 2 b.pdf',
    'forms and templates/11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations/07 Plans and Specifications/Specifications/Project Manual CompressedPart-2 2 b.pdf',
    'forms and templates/11 DISD-Thomas C. Marsh Preparatory Academy-Additions and Renovations/07 Plans and Specifications/Specifications/Project Manual CompressedPart-3 2 b.pdf',
  ];

  const parser = new LargePdfParser({
    batchSize: 25,
    generateThumbnails: false,
    extractAnnotations: true,
    onProgress: (progress) => {
      console.log(`  ${progress.stage}: ${progress.percent}% - ${progress.message}`);
    },
  });

  let allText = '';

  for (const pdfPath of projectManualParts) {
    const fullPath = path.resolve(pdfPath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${pdfPath}`);
      continue;
    }

    console.log(`\n📄 Processing: ${path.basename(pdfPath)}`);
    console.log(`   Size: ${(fs.statSync(fullPath).size / 1024 / 1024).toFixed(2)} MB`);

    try {
      const result = await parser.parseBlueprint(fullPath);
      console.log(`✅ Extracted ${result.totalPages} pages in ${(result.parseTimeMs / 1000).toFixed(1)}s`);

      allText += `\n\n========== ${path.basename(pdfPath)} ==========\n\n`;
      allText += result.text;

    } catch (error) {
      console.error(`❌ Error parsing ${pdfPath}:`, error);
    }
  }

  // Search for closeout-related sections
  console.log('\n\n🔎 Searching for closeout requirements...\n');

  const closeoutKeywords = [
    'closeout',
    'close out',
    'project closeout',
    'substantial completion',
    'final completion',
    'punch list',
    'as-built',
    'operation and maintenance',
    'o&m manual',
    'warranties',
    'certificate of occupancy',
    'final payment',
    'project record documents',
    'close-out procedures',
  ];

  const closeoutSections: Array<{ keyword: string; context: string }> = [];

  for (const keyword of closeoutKeywords) {
    const regex = new RegExp(`.{0,500}${keyword}.{0,500}`, 'gi');
    const matches = allText.match(regex);

    if (matches) {
      console.log(`✓ Found "${keyword}": ${matches.length} occurrences`);
      matches.forEach((match, idx) => {
        if (idx < 3) { // Limit to first 3 matches per keyword
          closeoutSections.push({ keyword, context: match.trim() });
        }
      });
    }
  }

  // Save full extracted text
  const outputDir = 'extracted-closeout-data';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fullTextPath = path.join(outputDir, 'marsh-project-manual-full-text.txt');
  fs.writeFileSync(fullTextPath, allText);
  console.log(`\n💾 Full text saved to: ${fullTextPath}`);

  // Save closeout sections
  const closeoutPath = path.join(outputDir, 'closeout-requirements.json');
  fs.writeFileSync(closeoutPath, JSON.stringify(closeoutSections, null, 2));
  console.log(`💾 Closeout sections saved to: ${closeoutPath}`);

  // Generate summary
  const summaryPath = path.join(outputDir, 'closeout-summary.txt');
  let summary = '=== PROJECT CLOSEOUT REQUIREMENTS SUMMARY ===\n\n';
  summary += `Total closeout-related sections found: ${closeoutSections.length}\n\n`;

  closeoutSections.slice(0, 10).forEach((section, idx) => {
    summary += `\n[${idx + 1}] Keyword: "${section.keyword}"\n`;
    summary += `Context:\n${section.context}\n`;
    summary += '-'.repeat(80) + '\n';
  });

  fs.writeFileSync(summaryPath, summary);
  console.log(`💾 Summary saved to: ${summaryPath}`);

  console.log('\n✅ Extraction complete!');
  console.log(`\nNext steps:`);
  console.log(`1. Review: ${summaryPath}`);
  console.log(`2. Check: ${closeoutPath}`);
  console.log(`3. Full text: ${fullTextPath}`);
}

extractCloseoutRequirements().catch(console.error);
