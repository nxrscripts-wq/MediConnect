import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { exportData } from '@/lib/exportEngine';
import { useAuth } from '@/contexts/AuthContext';
import type { ExportOptions, ExportFormat, ExportResult } from '@/types/export';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const { profile } = useAuth();
  const healthUnitName = profile?.health_unit_name;

  const exportWithFeedback = useCallback(async (
    options: Omit<ExportOptions, 'metadata'> & {
      metadata: Omit<ExportOptions['metadata'], 'healthUnitName' | 'generatedBy'>
        & Partial<Pick<ExportOptions['metadata'], 'healthUnitName' | 'generatedBy'>>
    }
  ): Promise<void> => {
    // We allow export even if data is empty for cases where only structure is needed,
    // but the spec said: "Se options.data.length === 0: toast.warning('Sem dados para exportar')"
    if (!options.data || options.data.length === 0) {
      toast.warning('Sem dados para exportar');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(
      `A gerar ${getFormatLabel(options.format)}...`
    );

    try {
      const result = await exportData({
        ...options,
        metadata: {
          ...options.metadata,
          healthUnitName: options.metadata.healthUnitName ?? healthUnitName,
          generatedBy: options.metadata.generatedBy ?? profile?.full_name,
        },
      });

      setLastResult(result);

      if (result.success) {
        toast.success(
          `${getFormatLabel(options.format)} exportado com sucesso — ${result.recordCount} registos`,
          { id: toastId }
        );
      } else {
        toast.error(
          `Erro ao exportar: ${result.error}`,
          { id: toastId }
        );
      }
    } catch (err) {
      toast.error('Erro inesperado ao exportar', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [healthUnitName, profile]);

  return {
    exportWithFeedback,
    isExporting,
    lastResult,
  };
}

function getFormatLabel(format: ExportFormat): string {
  const labels: Record<ExportFormat, string> = {
    pdf:   'PDF',
    excel: 'Excel',
    csv:   'CSV',
    word:  'Word',
    print: 'Impressão',
  };
  return labels[format];
}
