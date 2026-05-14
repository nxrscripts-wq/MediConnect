import { exportData } from './exportEngine';
import type { ExportColumn } from '@/types/export';

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
 * Wrapper to new exportEngine for PDF
 */
export const exportToPDF = async (options: PDFExportOptions): Promise<boolean> => {
    try {
        const columns: ExportColumn[] = options.columns.map(c => ({
            key: c.key,
            header: c.header,
            width: typeof c.width === 'number' ? c.width : undefined,
            align: c.align,
            format: c.format
        }));

        const result = await exportData({
            format: 'pdf',
            filename: options.filename,
            orientation: options.orientation === 'l' ? 'landscape' : 'portrait',
            columns,
            data: options.data,
            metadata: {
                title: options.title,
                subtitle: options.subtitle,
                module: 'reports', // fallback
                healthUnitName: options.healthUnitName,
                notes: options.footerText
            }
        });

        return result.success;
    } catch (error) {
        console.error("PDF Export Error:", error);
        return false;
    }
};

/**
 * Wrapper to new exportEngine for CSV
 */
export const exportToCSV = async (options: CSVExportOptions): Promise<boolean> => {
    try {
        const columns: ExportColumn[] = options.columns.map(c => ({
            key: c.key,
            header: c.header,
            format: c.format
        }));

        const result = await exportData({
            format: 'csv',
            filename: options.filename,
            columns,
            data: options.data,
            metadata: {
                title: options.filename,
                module: 'reports' // fallback
            }
        });

        return result.success;
    } catch (error) {
        console.error("CSV Export Error:", error);
        return false;
    }
};

/**
 * Simple wrapper for Excel export using the new exportEngine
 */
export const exportToExcel = async (options: CSVExportOptions): Promise<boolean> => {
    try {
        const columns: ExportColumn[] = options.columns.map(c => ({
            key: c.key,
            header: c.header,
            format: c.format
        }));

        const result = await exportData({
            format: 'excel',
            filename: options.filename,
            columns,
            data: options.data,
            metadata: {
                title: options.filename,
                module: 'reports' // fallback
            }
        });

        return result.success;
    } catch (error) {
        console.error("Excel Export Error:", error);
        return false;
    }
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
