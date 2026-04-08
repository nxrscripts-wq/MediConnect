import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export interface PDFColumn {
    header: string;
    key: string;
    width?: number;
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
}

export interface CSVExportOptions {
    filename: string;
    columns: { header: string; key: string }[];
    data: any[];
    delimiter?: string;
}

/**
 * Formats a value as Angolan Kwanza (Kz)
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        currencyDisplay: 'symbol',
    }).format(value).replace('AOA', 'Kz');
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

/**
 * Exports data to a PDF file using jsPDF and jspdf-autotable
 * with official MediConnect / Republic of Angola formatting.
 */
export const exportToPDF = (options: PDFExportOptions) => {
    try {
        const {
            filename,
            title,
            subtitle,
            healthUnitName,
            includeHealthUnit = true,
            includeTimestamp = true,
            orientation = "p",
            columns,
            data,
            footerText,
        } = options;

        const doc = new jsPDF({
            orientation,
            unit: "mm",
            format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const primaryColor = [14, 116, 144]; // #0e7490
        let currentY = 15;

        // 1. REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE", pageWidth / 2, currentY, { align: "center" });
        currentY += 6;

        // 2. Title
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 51, 51); // #333333
        doc.text(title, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;

        // 3. Subtitle
        if (subtitle) {
            doc.setFontSize(9);
            doc.setTextColor(102, 102, 102); // #666666
            doc.text(subtitle, pageWidth / 2, currentY, { align: "center" });
            currentY += 5;
        }

        // 4. Health Unit
        if (includeHealthUnit && healthUnitName) {
            doc.setFontSize(8);
            doc.setTextColor(33, 33, 33);
            doc.text(`Unidade Sanitária: ${healthUnitName}`, pageWidth / 2, currentY, { align: "center" });
            currentY += 5;
        }

        // 5. Timestamp
        if (includeTimestamp) {
            doc.setFontSize(7);
            doc.setTextColor(153, 153, 153); // #999999
            const now = new Date();
            const dateStr = now.toLocaleDateString("pt-AO");
            const timeStr = now.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
            doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - 14, currentY, { align: "right" });
            currentY += 2;
        }

        // Build Rows
        const tableBody = data.map((row) =>
            columns.map((col) => {
                const val = row[col.key];
                return col.format ? col.format(val) : String(val ?? "—");
            })
        );

        // Column Styles mapping
        const colStyles: { [key: number]: any } = {};
        columns.forEach((col, index) => {
            if (col.width || col.align) {
                colStyles[index] = {
                    cellWidth: col.width || "auto",
                    halign: col.align || "left",
                };
            }
        });

        // Main Table
        autoTable(doc, {
            startY: currentY + 4,
            head: [columns.map((c) => c.header)],
            body: tableBody,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: {
                fillColor: primaryColor as [number, number, number],
                textColor: 255,
                fontSize: 8,
                fontStyle: "bold",
            },
            alternateRowStyles: { fillColor: [245, 250, 252] as [number, number, number] },
            columnStyles: colStyles,
            margin: { left: 14, right: 14, bottom: 20 },
            didDrawPage: (dataArg) => {
                // Footer: Page Number
                const str = `Página ${dataArg.pageNumber} de ${(doc.internal as any).getNumberOfPages()}`;
                doc.setFontSize(7);
                doc.setTextColor(153, 153, 153);

                const footerY = doc.internal.pageSize.getHeight() - 10;

                // Separator line
                doc.setDrawColor(220, 220, 220);
                doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

                if (footerText) {
                    doc.text(footerText, 14, footerY);
                }

                doc.text(str, pageWidth - 14, footerY, { align: "right" });
            },
            didDrawCell: (dataArg) => {
                // Custom highlighting for critical stock if needed (caller can pass hint)
                if (dataArg.section === 'body' && dataArg.cell.raw === 'Crítico') {
                    doc.setTextColor(220, 38, 38); // red-600
                }
            }
        });

        // Save
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

        // Add headers
        csvRows.push(columns.map(c => {
            const header = c.header;
            return header.includes(delimiter) || header.includes('"') || header.includes('\n')
                ? `"${header.replace(/"/g, '""')}"`
                : header;
        }).join(delimiter));

        // Add rows
        data.forEach(row => {
            const formattedRow = columns.map(col => {
                const val = String(row[col.key] ?? '');
                return val.includes(delimiter) || val.includes('"') || val.includes('\n')
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
            });
            csvRows.push(formattedRow.join(delimiter));
        });

        const csvContent = csvRows.join("\n");
        // BOM UTF-8 for Excel compatibility
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();

        // Cleanup
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
 * Wrapper for Excel export (using CSV with .xlsx extension hint)
 */
export const exportToExcel = (options: CSVExportOptions) => {
    return exportToCSV({
        ...options,
        filename: options.filename,
        delimiter: ';'
    });
};
