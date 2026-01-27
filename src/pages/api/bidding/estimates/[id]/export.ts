/**
 * Estimate Export API Endpoint
 * Exports estimates to Excel or PDF format
 * SECURED with RBAC middleware
 */
import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db';
import { costEstimates, costEstimateLineItems } from '../../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRBAC } from '../../../../../lib/middleware/rbac';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const GET: APIRoute = async (context) => {
  try {
    const { params, url } = context;
    const { id } = params;
    const format = url.searchParams.get('format') || 'excel';

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the estimate
    const [estimate] = await db
      .select()
      .from(costEstimates)
      .where(eq(costEstimates.id, parseInt(id)));

    if (!estimate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Estimate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // RBAC: Require authentication and project read access
    const rbacResult = await checkRBAC(context, estimate.projectId, 'canRead');
    if (rbacResult instanceof Response) {
      return rbacResult;
    }

    // Fetch line items
    const lineItems = await db
      .select()
      .from(costEstimateLineItems)
      .where(eq(costEstimateLineItems.costEstimateId, parseInt(id)))
      .orderBy(costEstimateLineItems.csiDivision, costEstimateLineItems.sortOrder);

    if (format === 'excel') {
      return exportToExcel(estimate, lineItems);
    } else if (format === 'pdf') {
      return exportToPDF(estimate, lineItems);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid export format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error exporting estimate:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to export estimate' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function exportToExcel(estimate: any, lineItems: any[]) {
  const formatCurrency = (cents: number) => (cents / 100);

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ConstructAid';
  workbook.created = new Date();

  // Add main worksheet
  const worksheet = workbook.addWorksheet('Cost Estimate');

  // Set column widths
  worksheet.columns = [
    { width: 12 }, // CSI Division
    { width: 12 }, // Section
    { width: 40 }, // Description
    { width: 10 }, // Quantity
    { width: 8 },  // Unit
    { width: 12 }, // Unit Cost
    { width: 12 }, // Labor
    { width: 12 }, // Material
    { width: 12 }, // Equipment
    { width: 15 }, // Subcontractor
    { width: 12 }, // Total
  ];

  // Add header information
  worksheet.addRow(['Cost Estimate', estimate.estimateNumber]);
  worksheet.addRow(['Title', estimate.title]);
  worksheet.addRow(['Status', estimate.status.toUpperCase()]);
  worksheet.addRow(['Version', estimate.version]);
  worksheet.addRow(['Created', new Date(estimate.createdAt).toLocaleDateString()]);
  worksheet.addRow([]);

  // Add line items headers
  const headerRow = worksheet.addRow([
    'CSI Division',
    'Section',
    'Description',
    'Quantity',
    'Unit',
    'Unit Cost',
    'Labor Cost',
    'Material Cost',
    'Equipment Cost',
    'Subcontractor Cost',
    'Total Cost',
  ]);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add line items
  lineItems.forEach(item => {
    const row = worksheet.addRow([
      item.csiDivision || '',
      item.csiSection || '',
      item.description || '',
      item.quantity || 0,
      item.unit || '',
      formatCurrency(item.unitCost || 0),
      formatCurrency(item.laborCost || 0),
      formatCurrency(item.materialCost || 0),
      formatCurrency(item.equipmentCost || 0),
      formatCurrency(item.subcontractorCost || 0),
      formatCurrency(item.totalCost || 0),
    ]);

    // Format currency columns
    [6, 7, 8, 9, 10, 11].forEach(col => {
      row.getCell(col).numFmt = '$#,##0.00';
    });
  });

  // Add summary section
  worksheet.addRow([]);
  const summaryHeaderRow = worksheet.addRow(['Cost Summary']);
  summaryHeaderRow.font = { bold: true };

  const summaryItems = [
    ['Subtotal', formatCurrency(estimate.subtotalCost || 0)],
    [`Overhead (${estimate.overheadPercentage}%)`, formatCurrency(estimate.overhead || 0)],
    [`Profit (${estimate.profitPercentage}%)`, formatCurrency(estimate.profit || 0)],
    [`Bond (${estimate.bondPercentage}%)`, formatCurrency(estimate.bondCost || 0)],
    [`Contingency (${estimate.contingencyPercentage}%)`, formatCurrency(estimate.contingency || 0)],
  ];

  summaryItems.forEach(item => {
    const row = worksheet.addRow(item);
    row.getCell(2).numFmt = '$#,##0.00';
  });

  worksheet.addRow([]);
  const totalRow = worksheet.addRow(['TOTAL ESTIMATE', formatCurrency(estimate.totalEstimatedCost || 0)]);
  totalRow.font = { bold: true };
  totalRow.getCell(2).numFmt = '$#,##0.00';
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' },
  };

  // Add Division Summary worksheet
  const divisionSheet = workbook.addWorksheet('Division Summary');
  divisionSheet.columns = [
    { width: 12 }, // Division
    { width: 35 }, // Title
    { width: 10 }, // Items
    { width: 15 }, // Total
  ];

  const divisionHeaderRow = divisionSheet.addRow(['Division Summary']);
  divisionHeaderRow.font = { bold: true };

  const divisionTableHeader = divisionSheet.addRow(['CSI Division', 'Division Title', 'Items', 'Total Cost']);
  divisionTableHeader.font = { bold: true };
  divisionTableHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  };
  divisionTableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Group line items by division
  const divisionTotals = lineItems.reduce((acc, item) => {
    const div = item.csiDivision || 'Other';
    if (!acc[div]) {
      acc[div] = { count: 0, total: 0 };
    }
    acc[div].count++;
    acc[div].total += item.totalCost || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // CSI Division reference
  const csiDivisions: Record<string, string> = {
    '00': 'Procurement and Contracting',
    '01': 'General Requirements',
    '02': 'Existing Conditions',
    '03': 'Concrete',
    '04': 'Masonry',
    '05': 'Metals',
    '06': 'Wood, Plastics, and Composites',
    '07': 'Thermal and Moisture Protection',
    '08': 'Openings',
    '09': 'Finishes',
    '10': 'Specialties',
    '11': 'Equipment',
    '12': 'Furnishings',
    '13': 'Special Construction',
    '14': 'Conveying Equipment',
    '21': 'Fire Suppression',
    '22': 'Plumbing',
    '23': 'HVAC',
    '25': 'Integrated Automation',
    '26': 'Electrical',
    '27': 'Communications',
    '28': 'Electronic Safety and Security',
    '31': 'Earthwork',
    '32': 'Exterior Improvements',
    '33': 'Utilities',
  };

  Object.keys(divisionTotals).sort().forEach(div => {
    const row = divisionSheet.addRow([
      div,
      csiDivisions[div] || 'Unknown',
      divisionTotals[div].count,
      formatCurrency(divisionTotals[div].total),
    ]);
    row.getCell(4).numFmt = '$#,##0.00';
  });

  // Generate Excel file buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="estimate-${estimate.estimateNumber}.xlsx"`,
    },
  });
}

function exportToPDF(estimate: any, lineItems: any[]): Promise<Response> {
  return new Promise((resolve) => {
    const formatCurrency = (cents: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(cents / 100);
    };

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Cost Estimate ${estimate.estimateNumber}`,
        Author: 'ConstructAid',
        Subject: estimate.title,
      },
    });

    // Collect PDF chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(
        new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="estimate-${estimate.estimateNumber}.pdf"`,
          },
        })
      );
    });

    // --- HEADER SECTION ---
    doc.fontSize(20).fillColor('#10b981').text('COST ESTIMATE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#000').text(estimate.estimateNumber, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(estimate.title, { align: 'center' });
    doc.moveDown(1);

    // Estimate details box
    const detailsY = doc.y;
    doc.fontSize(10).fillColor('#666');
    doc.text(`Status: ${estimate.status.toUpperCase()}`, 50, detailsY);
    doc.text(`Version: ${estimate.version}`, 250, detailsY);
    doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 400, detailsY);
    doc.moveDown(1.5);

    if (estimate.description) {
      doc.fontSize(10).fillColor('#333').text(estimate.description, {
        align: 'left',
        width: 500,
      });
      doc.moveDown(1);
    }

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#ddd');
    doc.moveDown(1);

    // --- LINE ITEMS TABLE ---
    const tableTop = doc.y;
    const colWidths = {
      div: 40,
      section: 60,
      description: 180,
      qty: 45,
      unit: 35,
      unitCost: 60,
      total: 70,
    };

    let xPos = 50;

    // Table header
    doc.fontSize(9).fillColor('#10b981').font('Helvetica-Bold');
    doc.text('Div', xPos, tableTop, { width: colWidths.div });
    xPos += colWidths.div;
    doc.text('Section', xPos, tableTop, { width: colWidths.section });
    xPos += colWidths.section;
    doc.text('Description', xPos, tableTop, { width: colWidths.description });
    xPos += colWidths.description;
    doc.text('Qty', xPos, tableTop, { width: colWidths.qty, align: 'right' });
    xPos += colWidths.qty;
    doc.text('Unit', xPos, tableTop, { width: colWidths.unit });
    xPos += colWidths.unit;
    doc.text('Unit Cost', xPos, tableTop, { width: colWidths.unitCost, align: 'right' });
    xPos += colWidths.unitCost;
    doc.text('Total', xPos, tableTop, { width: colWidths.total, align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#10b981');
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(8).fillColor('#000');

    let currentDivision = '';
    lineItems.forEach((item, index) => {
      // Add division separator
      if (item.csiDivision && item.csiDivision !== currentDivision) {
        currentDivision = item.csiDivision;
        if (index > 0) {
          doc.moveDown(0.5);
        }
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#10b981');
        doc.text(`Division ${currentDivision}`, 50);
        doc.font('Helvetica').fontSize(8).fillColor('#000');
        doc.moveDown(0.3);
      }

      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      const rowY = doc.y;
      xPos = 50;

      doc.text(item.csiDivision || '', xPos, rowY, { width: colWidths.div });
      xPos += colWidths.div;
      doc.text(item.csiSection || '', xPos, rowY, { width: colWidths.section });
      xPos += colWidths.section;
      doc.text(item.description || '', xPos, rowY, { width: colWidths.description });
      xPos += colWidths.description;
      doc.text((item.quantity || 0).toString(), xPos, rowY, { width: colWidths.qty, align: 'right' });
      xPos += colWidths.qty;
      doc.text(item.unit || '', xPos, rowY, { width: colWidths.unit });
      xPos += colWidths.unit;
      doc.text(formatCurrency(item.unitCost || 0), xPos, rowY, { width: colWidths.unitCost, align: 'right' });
      xPos += colWidths.unitCost;
      doc.text(formatCurrency(item.totalCost || 0), xPos, rowY, { width: colWidths.total, align: 'right' });

      doc.moveDown(0.8);
    });

    // --- COST SUMMARY SECTION ---
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke('#ddd');
    doc.moveDown(1);

    // Check if we need a new page for summary
    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('COST SUMMARY', { align: 'center' });
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(10).fillColor('#000');

    const summaryX = 350;
    const labelX = 50;

    doc.text('Subtotal:', labelX, doc.y);
    doc.text(formatCurrency(estimate.subtotalCost || 0), summaryX, doc.y, { align: 'right', width: 212 });
    doc.moveDown(0.7);

    doc.text(`Overhead (${estimate.overheadPercentage}%):`, labelX, doc.y);
    doc.text(formatCurrency(estimate.overhead || 0), summaryX, doc.y, { align: 'right', width: 212 });
    doc.moveDown(0.7);

    doc.text(`Profit (${estimate.profitPercentage}%):`, labelX, doc.y);
    doc.text(formatCurrency(estimate.profit || 0), summaryX, doc.y, { align: 'right', width: 212 });
    doc.moveDown(0.7);

    doc.text(`Bond (${estimate.bondPercentage}%):`, labelX, doc.y);
    doc.text(formatCurrency(estimate.bondCost || 0), summaryX, doc.y, { align: 'right', width: 212 });
    doc.moveDown(0.7);

    doc.text(`Contingency (${estimate.contingencyPercentage}%):`, labelX, doc.y);
    doc.text(formatCurrency(estimate.contingency || 0), summaryX, doc.y, { align: 'right', width: 212 });
    doc.moveDown(1);

    // Total with background
    const totalY = doc.y;
    doc.rect(50, totalY - 5, 512, 25).fill('#f3f4f6');

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981');
    doc.text('TOTAL ESTIMATE:', labelX, totalY + 2);
    doc.text(formatCurrency(estimate.totalEstimatedCost || 0), summaryX, totalY + 2, { align: 'right', width: 212 });

    // --- FOOTER ---
    doc.fontSize(8).fillColor('#999').text(
      `Generated by ConstructAid on ${new Date().toLocaleDateString()}`,
      50,
      750,
      { align: 'center', width: 512 }
    );

    // Finalize PDF
    doc.end();
  });
}
