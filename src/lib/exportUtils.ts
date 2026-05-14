import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFColumn {
    header: string;
    key: string;
    width?: number | "auto";
    align?: "left" | "center" | "right";
    format?: (value: any) => string;
}

export interface PDFExportOptions {
    filename: string;
    title: string;
    subtitle?: string;
    healthUnitName?: string;
    includeHealthUnit?: boolean;
    includeTimestamp?: boolean;
    orientation?: "p" | "l";
    columns: PDFColumn[];
    data: any[];
    footerText?: string;
    didDrawCell?: (data: any) => void;
}

export interface CSVExportOptions {
    filename: string;
    columns: { header: string; key: string; format?: (value: any) => string }[];
    data: any[];
    delimiter?: string;
}

/**
 * Helper to draw the official report header on any page
 */
const drawReportHeader = (doc: jsPDF, options: PDFExportOptions): number => {
    const {
        title,
        subtitle,
        healthUnitName,
        includeHealthUnit = true,
        includeTimestamp = true,
    } = options;

    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [14, 116, 144]; // #0e7490
    let currentY = 15;

    // Linha 1: REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE", pageWidth / 2, currentY, { align: "center" });
    currentY += 6;

    // Linha 2: Title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51); // #333333
    doc.text(title, pageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    // Linha 3: Subtitle
    if (subtitle) {
        doc.setFontSize(9);
        doc.setTextColor(102, 102, 102); // #666666
        doc.text(subtitle, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
    }

    // Linha 4: Health Unit
    if (includeHealthUnit && healthUnitName) {
        doc.setFontSize(8);
        doc.setTextColor(51, 51, 51);
        doc.text(`Unidade Sanitária: ${healthUnitName}`, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
    }

    // Linha 5: Timestamp
    if (includeTimestamp) {
        doc.setFontSize(7);
        doc.setTextColor(153, 153, 153); // #999999
        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-AO");
        const timeStr = now.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
        doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - 14, currentY, { align: "right" });
        currentY += 2;
    }

    return currentY;
};

/**
 * Exports data to a PDF file using jsPDF and jspdf-autotable
 * with official MediConnect / Republic of Angola formatting.
 */
export const exportToPDF = (options: PDFExportOptions) => {
    try {
        const {
            filename,
            orientation,
            columns,
            data,
            footerText,
        } = options;

        // Auto-select orientation if not specified: landscape if 7+ columns
        const finalOrientation = orientation || (columns.length > 7 ? "l" : "p");

        const doc = new jsPDF({
            orientation: finalOrientation,
            unit: "mm",
            format: "a4",
        });

        // Calculate initial Y to determine table start
        const startY = drawReportHeader(doc, options) + 5;

        // Build Table Data
        const tableBody = data.map((row) =>
            columns.map((col) => {
                const val = row[col.key];
                return col.format ? col.format(val) : String(val ?? "—");
            })
        );

        // Map column styles
        const colStyles: { [key: number]: any } = {};
        columns.forEach((col, index) => {
            if (col.width || col.align) {
                colStyles[index] = {
                    cellWidth: col.width || "auto",
                    halign: col.align || "left",
                };
            }
        });

        autoTable(doc, {
            startY: startY,
            head: [columns.map((c) => c.header)],
            body: tableBody,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: {
                fillColor: [14, 116, 144], // #0e7490
                textColor: 255,
                fontSize: 8,
                fontStyle: "bold",
            },
            alternateRowStyles: { fillColor: [245, 250, 252] },
            columnStyles: colStyles,
            margin: { top: startY, left: 14, right: 14, bottom: 20 },
            didDrawPage: (dataArg) => {
                // Skip drawing header on first page as it's already there (or re-draw it for consistency)
                if (dataArg.pageNumber > 1) {
                    drawReportHeader(doc, options);
                }

                // Footer
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const totalPages = (doc.internal as any).getNumberOfPages();
                const str = `Página ${dataArg.pageNumber} de ${totalPages}`;
                
                doc.setFontSize(7);
                doc.setTextColor(153, 153, 153);

                const footerY = pageHeight - 10;

                // Separator line
                doc.setDrawColor(220, 220, 220);
                doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

                if (footerText) {
                    doc.text(footerText, 14, footerY, { align: "left" });
                }

                doc.text(str, pageWidth - 14, footerY, { align: "right" });
            },
            didDrawCell: options.didDrawCell
        });

        doc.save(`${filename}.pdf`);
        return true;
    } catch (error) {
        console.error("PDF Export Error:", error);
        return false;
    }
};

/**
 * Exports data to a CSV file with Excel compatibility
 */
export const exportToCSV = (options: CSVExportOptions) => {
    try {
        const { filename, columns, data, delimiter = ';' } = options;

        const csvRows = [];

        // Header Row
        csvRows.push(columns.map(c => {
            const header = c.header;
            return header.includes(delimiter) || header.includes('"') || header.includes('\n')
                ? `"${header.replace(/"/g, '""')}"`
                : header;
        }).join(delimiter));

        // Data Rows
        data.forEach(row => {
            const formattedRow = columns.map(col => {
                const rawVal = row[col.key];
                const val = col.format ? col.format(rawVal) : String(rawVal ?? "");
                
                return val.includes(delimiter) || val.includes('"') || val.includes('\n')
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
            });
            csvRows.push(formattedRow.join(delimiter));
        });

        const csvContent = csvRows.join("\n");
        // BOM UTF-8 for Excel
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        return true;
    } catch (error) {
        console.error("CSV Export Error:", error);
        return false;
    }
};

/**
 * Simple wrapper for Excel export
 * Redirige para exportToCSV com extensão .xlsx
 * Nota: Excel abre CSVs correctamente se BOM e delimiter estiverem correctos.
 */
export const exportToExcel = (options: CSVExportOptions) => {
    return exportToCSV({
        ...options,
        filename: options.filename
    });
};

/**
 * Formats a value as Angolan Kwanza (Kz)
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-AO', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value) + ' Kz';
};

/**
 * Formats a date string to DD/MM/YYYY
 */
export const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('pt-AO');
    } catch {
        return '—';
    }
};

