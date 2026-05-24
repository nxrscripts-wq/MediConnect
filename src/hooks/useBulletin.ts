import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import * as service from '@/services/bulletinService';
import type { AgeGroup, Gender, BulletinDisease, SubmitBulletinInput } from '@/types/bulletin';
import { makeCellKey } from '@/types/bulletin';

export function useBulletin() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const healthUnitId = profile?.health_unit_id ?? '';

  // 1. Period state: default to current month and year
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  // 2. Active Bulletin Query
  const bulletinQuery = useQuery({
    queryKey: ['active-bulletin', healthUnitId, month, year],
    queryFn: () => service.getOrCreateBulletin(month, year),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const bulletin = bulletinQuery.data;
  const bulletinId = bulletin?.id ?? '';

  // 3. Active Bulletin Disease Data (Cells) Query
  const diseaseDataQuery = useQuery({
    queryKey: ['bulletin-disease-data', bulletinId],
    queryFn: () => service.getBulletinData(bulletinId),
    enabled: !!bulletinId,
    staleTime: 1000 * 60 * 2, // 2 min
  });

  const diseaseData = diseaseDataQuery.data ?? [];

  // 4. Local Grid State for immediate rendering & typing
  const [cellValues, setCellValues] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Synced state initialization when query data loads
  useEffect(() => {
    if (diseaseData.length > 0) {
      const values: Record<string, number> = {};
      diseaseData.forEach((cell) => {
        values[makeCellKey(cell.disease_name, cell.sub_type, cell.age_group, 'cases')] = cell.cases_count;
        values[makeCellKey(cell.disease_name, cell.sub_type, cell.age_group, 'deaths')] = cell.deaths_count;
      });
      setCellValues(values);
    } else {
      setCellValues({});
    }
  }, [diseaseData]);

  // Is editing disabled?
  const isReadOnly =
    bulletin?.status === 'submetido' ||
    bulletin?.status === 'validado' ||
    bulletin?.status === 'aceite';

  // 5. Debounced auto-save queue
  const saveQueueRef = useRef<
    Record<
      string,
      {
        bulletinId: string;
        diseaseName: string;
        subType: string;
        ageGroup: AgeGroup;
        casesCount: number;
        deathsCount: number;
        gender: Gender;
      }
    >
  >({});
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core save executor
  const flushSaveQueue = useCallback(async () => {
    const queue = saveQueueRef.current;
    if (Object.keys(queue).length === 0) return;

    setIsSaving(true);
    saveQueueRef.current = {}; // Clear queue

    try {
      await Promise.all(
        Object.values(queue).map((cell) =>
          service.saveBulletinCell({
            bulletinId: cell.bulletinId,
            diseaseName: cell.diseaseName,
            subType: cell.subType,
            ageGroup: cell.ageGroup,
            casesCount: cell.casesCount,
            deathsCount: cell.deathsCount,
            gender: cell.gender,
          })
        )
      );

      // Invalidate active queries
      queryClient.invalidateQueries({ queryKey: ['bulletin-disease-data', bulletinId] });
      queryClient.invalidateQueries({ queryKey: ['bulletin-summary', bulletinId] });
    } catch (e: any) {
      toast.error(`Erro ao guardar automaticamente: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [bulletinId, queryClient]);

  // Update cell handler
  const updateCell = useCallback(
    (
      diseaseName: string,
      subType: string,
      ageGroup: AgeGroup,
      field: 'cases' | 'deaths',
      value: number
    ) => {
      if (isReadOnly || !bulletinId) return;

      const cellKey = makeCellKey(diseaseName, subType, ageGroup, field);
      
      // Update local state immediately for high responsiveness
      setCellValues((prev) => ({ ...prev, [cellKey]: value }));

      // Fetch opposite field value to preserve full cell
      const oppositeField = field === 'cases' ? 'deaths' : 'cases';
      const oppositeKey = makeCellKey(diseaseName, subType, ageGroup, oppositeField);
      const oppositeValue = cellValues[oppositeKey] ?? 0;

      const casesCount = field === 'cases' ? value : oppositeValue;
      const deathsCount = field === 'deaths' ? value : oppositeValue;

      // Queue for debounced save
      const queueKey = `${diseaseName}::${subType}::${ageGroup}`;
      saveQueueRef.current[queueKey] = {
        bulletinId,
        diseaseName,
        subType,
        ageGroup,
        casesCount,
        deathsCount,
        gender: 'ambos',
      };

      // Reset timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        flushSaveQueue();
      }, 800); // 800ms debounce
    },
    [bulletinId, isReadOnly, cellValues, flushSaveQueue]
  );

  // Flush remaining queued items when page changes or before actions
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        flushSaveQueue();
      }
    };
  }, [flushSaveQueue]);

  // 6. Metadata Mutation
  const updateMetaMutation = useMutation({
    mutationFn: (meta: Parameters<typeof service.updateBulletinMeta>[1]) =>
      service.updateBulletinMeta(bulletinId, meta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-bulletin', healthUnitId, month, year] });
    },
    onError: (e: Error) => {
      toast.error(`Erro ao atualizar dados: ${e.message}`);
    },
  });

  const updateMetaDebounced = useRef<NodeJS.Timeout | null>(null);
  const updateMeta = useCallback(
    (meta: Parameters<typeof service.updateBulletinMeta>[1]) => {
      if (isReadOnly || !bulletinId) return;

      // Optimistic update of local cache
      queryClient.setQueryData(
        ['active-bulletin', healthUnitId, month, year],
        (old: any) => (old ? { ...old, ...meta } : old)
      );

      if (updateMetaDebounced.current) {
        clearTimeout(updateMetaDebounced.current);
      }

      updateMetaDebounced.current = setTimeout(() => {
        updateMetaMutation.mutate(meta);
      }, 800); // 800ms debounce for metadata text inputs
    },
    [bulletinId, isReadOnly, queryClient, healthUnitId, month, year, updateMetaMutation]
  );

  // 7. Submission Mutation
  const submitMutation = useMutation({
    mutationFn: (input: Omit<SubmitBulletinInput, 'bulletin_id'>) =>
      service.submitBulletin({ bulletin_id: bulletinId, ...input }),
    onSuccess: (res) => {
      toast.success(`Boletim submetido ao SIGIS com sucesso! Código: ${res.submission_code}`);
      queryClient.invalidateQueries({ queryKey: ['active-bulletin'] });
      queryClient.invalidateQueries({ queryKey: ['bulletin-history'] });
      queryClient.invalidateQueries({ queryKey: ['bulletin-summary'] });
    },
    onError: (e: Error) => {
      toast.error(`Erro ao submeter: ${e.message}`);
    },
  });

  // 8. History Query
  const historyQuery = useQuery({
    queryKey: ['bulletin-history', healthUnitId],
    queryFn: () => service.getBulletinHistory(24),
    enabled: !!healthUnitId,
    staleTime: 1000 * 30, // 30 sec
  });

  // 9. Summary Query
  const summaryQuery = useQuery({
    queryKey: ['bulletin-summary', bulletinId],
    queryFn: () => service.getBulletinSummary(bulletinId),
    enabled: !!bulletinId,
    staleTime: 1000 * 60, // 1 min
  });

  // 10. Comparison Query (separate trigger or dynamic fetch)
  const [compPeriod1, setCompPeriod1] = useState<{ month: number; year: number }>({
    month: month === 1 ? 12 : month - 1,
    year: month === 1 ? year - 1 : year,
  });
  const [compPeriod2, setCompPeriod2] = useState<{ month: number; year: number }>({
    month,
    year,
  });

  const comparisonQuery = useQuery({
    queryKey: [
      'bulletin-comparison',
      healthUnitId,
      compPeriod1.month,
      compPeriod1.year,
      compPeriod2.month,
      compPeriod2.year,
    ],
    queryFn: () =>
      service.getEpiComparison(
        compPeriod1.month,
        compPeriod1.year,
        compPeriod2.month,
        compPeriod2.year
      ),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60,
  });

  return {
    // Period selector states
    month,
    setMonth,
    year,
    setYear,

    // Active bulletin states & actions
    bulletin,
    diseaseData,
    cellValues,
    isSaving,
    isReadOnly,
    isLoading: bulletinQuery.isLoading || diseaseDataQuery.isLoading,
    refetchBulletin: () => {
      bulletinQuery.refetch();
      diseaseDataQuery.refetch();
    },

    updateCell,
    updateMeta,
    submitBulletin: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,

    // Summary data
    summary: summaryQuery.data ?? null,
    isLoadingSummary: summaryQuery.isLoading,
    refetchSummary: summaryQuery.refetch,

    // Submission history
    history: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,
    refetchHistory: historyQuery.refetch,

    // Period Comparison
    comparison: comparisonQuery.data ?? [],
    compPeriod1,
    setCompPeriod1,
    compPeriod2,
    setCompPeriod2,
    isLoadingComparison: comparisonQuery.isLoading,
    refetchComparison: comparisonQuery.refetch,
  };
}
