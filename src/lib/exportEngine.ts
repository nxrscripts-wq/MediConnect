// html2canvas removido — não utilizado (era 198KB no bundle)
import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import type { ExportOptions, ExportResult, ExportMetadata, ExportColumn, ExportSheet } from '@/types/export';

export async function exportData(options: ExportOptions): Promise<ExportResult> {
  try {
    let result: Omit<ExportResult, 'recordCount'>;

    switch (options.format) {
      case 'pdf':
        result = await exportToPDFEngine(options);
        break;
      case 'excel':
        result = await exportToExcelEngine(options);
        break;
      case 'csv':
        result = await exportToCSVEngine(options);
        break;
      case 'word':
        result = await exportToWordEngine(options);
        break;
      case 'print':
        result = await openPrintView(options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return {
      ...result,
      recordCount: options.data?.length ?? 0
    };
  } catch (error: any) {
    console.error('Export Error:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao exportar',
      format: options.format,
      recordCount: 0
    };
  }
}

function buildPDFHeader(doc: jsPDF, metadata: ExportMetadata, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [14, 116, 144] as [number, number, number];
  let currentY = startY + 10;

  // LINHA 1 — Identificação do Estado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text("REPÚBLICA DE ANGOLA", pageWidth / 2, currentY, { align: "center" });

  // LINHA 2 — Ministério
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("MINISTÉRIO DA SAÚDE", pageWidth / 2, currentY, { align: "center" });

  // LINHA 3 — Sistema
  currentY += 5;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("MEDICONNECT — Sistema Nacional de Gestão de Saúde", pageWidth / 2, currentY, { align: "center" });

  // LINHA DIVISÓRIA
  currentY += 4;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // LINHA 4 — Título do documento
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(metadata.title.toUpperCase(), pageWidth / 2, currentY, { align: "center" });

  // LINHA 5 — Subtítulo
  if (metadata.subtitle) {
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(metadata.subtitle, pageWidth / 2, currentY, { align: "center" });
  }

  // BLOCO INFO
  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-AO");
  const timeStr = now.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });

  // Esquerda
  let leftInfo = '';
  if (metadata.healthUnitName) leftInfo += `Unidade: ${metadata.healthUnitName}\n`;
  if (metadata.province) leftInfo += `Província: ${metadata.province}`;
  if (leftInfo) {
    doc.text(leftInfo.trim(), 14, currentY, { align: "left" });
  }

  // Direita
  let rightInfo = '';
  if (metadata.period) rightInfo += `Período: ${metadata.period}\n`;
  rightInfo += `Gerado em: ${dateStr} ${timeStr}\n`;
  if (metadata.generatedBy) rightInfo += `Por: ${metadata.generatedBy}`;
  doc.text(rightInfo.trim(), pageWidth - 14, currentY, { align: "right" });

  // Ajustar Y baseado na altura do texto do bloco info (aprox. 3 linhas max)
  currentY += (Math.max(leftInfo.split('\n').length, rightInfo.split('\n').length) * 4);

  // Filtros
  if (metadata.filters) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(`Filtros: ${metadata.filters}`, 14, currentY, { align: "left" });
    currentY += 4;
  }

  // Total Records
  if (metadata.totalRecords !== undefined) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Total de registos: ${metadata.totalRecords}`, 14, currentY, { align: "left" });
    currentY += 4;
  }

  // LINHA DIVISÓRIA FINAL
  currentY += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, currentY, pageWidth - 14, currentY);

  return currentY + 5;
}

function buildPDFFooter(doc: jsPDF, pageNumber: number, totalPages: number, metadata: ExportMetadata) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - 15;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);

  doc.text("MediConnect © 2025 — MINSA Angola", 14, y + 4, { align: "left" });

  const shortTitle = metadata.title.length > 50 ? metadata.title.substring(0, 47) + '...' : metadata.title;
  doc.text(shortTitle, pageWidth / 2, y + 4, { align: "center" });

  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 14, y + 4, { align: "right" });

  if (metadata.notes) {
    doc.setFont("helvetica", "italic");
    doc.text(metadata.notes, pageWidth / 2, y + 8, { align: "center" });
  }
}

async function exportToPDFEngine(options: ExportOptions): Promise<Omit<ExportResult, 'recordCount'>> {
  const orientation = options.orientation ?? (options.columns.length > 7 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const margin = 14;
  const tableStartY = buildPDFHeader(doc, options.metadata, margin);

  const colStyles: { [key: number]: any } = {};
  options.columns.forEach((col, idx) => {
    colStyles[idx] = {
      halign: col.align || 'left',
      cellWidth: col.width ? col.width : 'auto'
    };
  });

  const tableBody: RowInput[] = options.data.map(row => 
    options.columns.map(c => {
      const val = row[c.key];
      return c.format ? c.format(val) : String(val ?? '—');
    })
  );

  autoTable(doc, {
    startY: tableStartY,
    head: [options.columns.map(c => c.header)],
    body: tableBody,
    margin: { left: margin, right: margin, bottom: 20 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [245, 250, 252]
    },
    columnStyles: colStyles
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    buildPDFFooter(doc, i, totalPages, options.metadata);
  }

  doc.save(`${options.filename}.pdf`);
  return { success: true, format: 'pdf', filename: `${options.filename}.pdf` };
}

function buildExcelSheet(wb: XLSX.WorkBook, sheetName: string, columns: ExportColumn[], data: Record<string, unknown>[], metadata: ExportMetadata) {
  const headerData = [
    ["REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE — MEDICONNECT"],
    [metadata.title],
    [`Unidade: ${metadata.healthUnitName ?? '—'} | Gerado em: ${new Date().toLocaleString('pt-AO')}`],
    [], // empty row separator
    columns.map(c => c.header)
  ];

  const rowData = data.map(row => columns.map(c => {
    const val = row[c.key];
    return c.format ? c.format(val) : (val ?? '');
  }));

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rowData]);

  ws['!cols'] = columns.map(c => ({ wch: c.excelWidth ?? 20 }));
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel max sheet name length is 31
}

async function exportToExcelEngine(options: ExportOptions): Promise<Omit<ExportResult, 'recordCount'>> {
  const wb = XLSX.utils.book_new();

  if (options.sheets && options.sheets.length > 0) {
    options.sheets.forEach(sheet => {
      buildExcelSheet(wb, sheet.name, sheet.columns, sheet.data, options.metadata);
    });
  } else {
    buildExcelSheet(wb, 'Dados', options.columns, options.data, options.metadata);
  }

  // Info sheet
  const infoData = [
    ["Sistema", "MediConnect — MINSA Angola"],
    ["Documento", options.metadata.title],
    ["Unidade", options.metadata.healthUnitName ?? "—"],
    ["Gerado em", new Date().toLocaleString('pt-AO')],
    ["Gerado por", options.metadata.generatedBy ?? "—"],
    ["Total de registos", options.data.length]
  ];
  const infoWs = XLSX.utils.aoa_to_sheet(infoData);
  infoWs['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${options.filename}.xlsx`);

  return { success: true, format: 'excel', filename: `${options.filename}.xlsx` };
}

async function exportToCSVEngine(options: ExportOptions): Promise<Omit<ExportResult, 'recordCount'>> {
  const BOM = '\uFEFF';
  const delimiter = ';';

  const escapeCSV = (val: string): string => {
    if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines = [
    `# ${options.metadata.title}`,
    `# Gerado em: ${new Date().toLocaleString('pt-AO')}`,
    `# Unidade: ${options.metadata.healthUnitName ?? '—'}`,
    '',
    options.columns.map(c => escapeCSV(c.header)).join(delimiter)
  ];

  options.data.forEach(row => {
    const rowStr = options.columns.map(c => {
      const val = row[c.key];
      const formatted = c.format ? String(c.format(val)) : String(val ?? '');
      return escapeCSV(formatted);
    }).join(delimiter);
    lines.push(rowStr);
  });

  const content = BOM + lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${options.filename}.csv`);

  return { success: true, format: 'csv', filename: `${options.filename}.csv` };
}

async function exportToWordEngine(options: ExportOptions): Promise<Omit<ExportResult, 'recordCount'>> {
  const tableRows = [
    new TableRow({
      children: options.columns.map(c => 
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: c.header, color: "FFFFFF", bold: true, size: 24 })] })], // Size in half-points (24 = 12pt)
          shading: { fill: "0E7490" },
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
        })
      )
    })
  ];

  options.data.forEach((row, rowIndex) => {
    const isEven = rowIndex % 2 === 0;
    const fillColor = isEven ? "FFFFFF" : "F5FAFB";
    
    tableRows.push(new TableRow({
      children: options.columns.map(c => {
        const val = row[c.key];
        const formatted = c.format ? String(c.format(val)) : String(val ?? '—');
        return new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: formatted, size: 20 })] })], // 10pt
          shading: { fill: fillColor },
          margins: { top: 80, bottom: 80, left: 100, right: 100 }
        });
      })
    }));
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE", bold: true, size: 28, color: "0E7490" })] // 14pt
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "MEDICONNECT — Sistema Nacional de Gestão de Saúde", size: 24, color: "666666" })] // 12pt
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: options.metadata.title.toUpperCase(), bold: true, size: 32, color: "1A1A2E" })] // 16pt
        }),
        ...(options.metadata.subtitle ? [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: options.metadata.subtitle, size: 24, color: "666666" })]
        })] : []),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { color: "DDDDDD", size: 1, space: 1, style: BorderStyle.SINGLE } },
          children: [new TextRun({ text: `Unidade: ${options.metadata.healthUnitName ?? '—'} | Gerado em: ${new Date().toLocaleString('pt-AO')} | Por: ${options.metadata.generatedBy ?? '—'}`, size: 20, color: "888888" })] // 10pt
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }
          }
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "MediConnect © 2025 — MINSA Angola", size: 18, color: "AAAAAA" })] // 9pt
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${options.filename}.docx`);

  return { success: true, format: 'word', filename: `${options.filename}.docx` };
}

async function openPrintView(options: ExportOptions): Promise<Omit<ExportResult, 'recordCount'>> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Não foi possível abrir a janela de impressão. Verifique se os popups estão bloqueados.');
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
      <meta charset="UTF-8">
      <title>${options.metadata.title}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 15mm; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #0e7490; padding-bottom: 10px; }
        .header h1 { font-size: 14px; color: #0e7490; margin: 0 0 5px 0; }
        .header h2 { font-size: 16px; color: #1a1a2e; margin: 5px 0; }
        .header h3 { font-size: 12px; color: #666; margin: 0; font-weight: normal; }
        .header p { font-size: 10px; color: #888; margin: 5px 0 0 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background-color: #0e7490; color: white; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        tr:nth-child(even) td { background-color: #f5fafb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
        @media print {
          body { margin: 0; }
          @page { size: A4 ${options.orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 15mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE</h1>
        <h3>MEDICONNECT — Sistema Nacional de Gestão de Saúde</h3>
        <h2>${options.metadata.title}</h2>
        <p>Unidade: ${options.metadata.healthUnitName ?? '—'} | Gerado em: ${new Date().toLocaleString('pt-AO')} | Por: ${options.metadata.generatedBy ?? '—'}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${options.columns.map(c => `<th>${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${options.data.map(row => `
            <tr>
              ${options.columns.map(c => {
                const val = row[c.key];
                const formatted = c.format ? String(c.format(val)) : String(val ?? '—');
                return `<td>${formatted}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        MediConnect © 2025 — MINSA Angola
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  return { success: true, format: 'print' };
}
