export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'word' | 'print';

export type ExportModule =
  | 'patients'
  | 'appointments'
  | 'medications'
  | 'records'
  | 'reports'
  | 'bulletin'
  | 'maternity'
  | 'monthly_stats'
  | 'government_panel';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
  excelWidth?: number;        // width in characters for Excel
  wordWidth?: number;         // width in % for Word
  hideInPrint?: boolean;      // hide on print
}

export interface ExportMetadata {
  title: string;
  subtitle?: string;
  module: ExportModule;
  healthUnitName?: string;
  healthUnitCode?: string;
  province?: string;
  generatedBy?: string;
  period?: string;
  filters?: string;
  totalRecords?: number;
  notes?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  metadata: ExportMetadata;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  orientation?: 'portrait' | 'landscape';
  sheets?: ExportSheet[];     // for multi-sheet Excel
  includeSummary?: boolean;   // include total row
  includeFilters?: boolean;   // include active filters in header
}

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  summary?: Record<string, unknown>;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  format: ExportFormat;
  recordCount: number;
}

export interface ExportButtonConfig {
  formats: ExportFormat[];
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
  tooltip?: string;
}
