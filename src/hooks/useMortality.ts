import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import * as service from '@/services/mortalityService';
import type {
  CreateDeathCertInput,
  CreateMorbidityInput,
  MinsaReportType,
  ICD10Code
} from '@/types/mortality';

export function useMortality() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const healthUnitId = profile?.health_unit_id ?? '';

  // 1. Period Selector States
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const period = { month, year };

  // 2. ICD-10 Search State and Debounced Search
  const [icdSearchTerm, setIcdSearchTerm] = useState('');
  const [icdSearchResults, setIcdSearchResults] = useState<ICD10Code[]>([]);
  const [isSearchingIcd, setIsSearchingIcd] = useState(false);

  useEffect(() => {
    if (!icdSearchTerm || icdSearchTerm.trim().length < 2) {
      setIcdSearchResults([]);
      return;
    }

    setIsSearchingIcd(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await service.searchIcd10(icdSearchTerm);
        setIcdSearchResults(results || []);
      } catch (err: any) {
        console.error('Error searching ICD-10:', err);
        toast.error('Erro ao procurar códigos CID-10');
      } finally {
        setIsSearchingIcd(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [icdSearchTerm]);

  // 3. Queries

  // A. Monthly Statistics Summary
  const statsQuery = useQuery({
    queryKey: ['mortality-stats', healthUnitId, month, year],
    queryFn: () => service.getMortalityStats(period),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // B. 12-Month Trends
  const trendQuery = useQuery({
    queryKey: ['mortality-trend', healthUnitId],
    queryFn: () => service.getMortalityTrend(12),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 10 // 10 minutes
  });

  // C. Death Certificates list
  const certificatesQuery = useQuery({
    queryKey: ['death-certificates', healthUnitId, month, year],
    queryFn: () => service.getDeathCertificates(period),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // D. Morbidity Records list
  const morbidityQuery = useQuery({
    queryKey: ['morbidity-records', healthUnitId, month, year],
    queryFn: () => service.getMorbidityRecords(period),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // E. MINSA Official Reports list
  const reportsQuery = useQuery({
    queryKey: ['minsa-reports', healthUnitId, year],
    queryFn: () => service.getMinsaReports(year),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  // 4. Mutations

  // A. Create Death Certificate
  const createCertMutation = useMutation({
    mutationFn: (input: CreateDeathCertInput) => service.createDeathCertificate(input),
    onSuccess: () => {
      toast.success('Atestado de óbito gravado como rascunho com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['death-certificates', healthUnitId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['mortality-stats', healthUnitId, month, year] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar atestado: ${error.message}`);
    }
  });

  // B. Emit Death Certificate
  const emitCertMutation = useMutation({
    mutationFn: (id: string) => service.emitDeathCertificate(id),
    onSuccess: (data) => {
      toast.success(`Atestado emitido com sucesso! N/Oef: ${data.certificate_number}`);
      queryClient.invalidateQueries({ queryKey: ['death-certificates', healthUnitId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['mortality-stats', healthUnitId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['mortality-trend', healthUnitId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao emitir atestado: ${error.message}`);
    }
  });

  // C. Create Morbidity Record
  const createMorbidityMutation = useMutation({
    mutationFn: (input: CreateMorbidityInput) => service.createMorbidityRecord(input),
    onSuccess: () => {
      toast.success('Registo de morbilidade gravado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['morbidity-records', healthUnitId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['mortality-stats', healthUnitId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['mortality-trend', healthUnitId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao gravar morbilidade: ${error.message}`);
    }
  });

  // D. Create MINSA Official Report
  const createReportMutation = useMutation({
    mutationFn: (params: {
      report_type: MinsaReportType;
      reference_month?: number | null;
      reference_year: number;
      reference_quarter?: number | null;
      summary_data: any;
      notes?: string;
    }) => service.createMinsaReport(params),
    onSuccess: () => {
      toast.success('Relatório oficial gerado e guardado no sistema.');
      queryClient.invalidateQueries({ queryKey: ['minsa-reports', healthUnitId, year] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
    }
  });

  // E. Submit MINSA Report
  const submitReportMutation = useMutation({
    mutationFn: (id: string) => service.submitMinsaReport(id),
    onSuccess: (data) => {
      toast.success(`Relatório submetido ao SIGIS com sucesso! Código: ${data.submission_code}`);
      queryClient.invalidateQueries({ queryKey: ['minsa-reports', healthUnitId, year] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao submeter relatório ao MINSA: ${error.message}`);
    }
  });

  return {
    // Current period
    month,
    setMonth,
    year,
    setYear,
    period,

    // ICD-10 search states
    icdSearchTerm,
    setIcdSearchTerm,
    icdSearchResults,
    isSearchingIcd,

    // Query result data & loading states
    stats: statsQuery.data ?? null,
    isLoadingStats: statsQuery.isLoading,
    isRefetchingStats: statsQuery.isRefetching,
    refetchStats: statsQuery.refetch,

    trends: trendQuery.data ?? [],
    isLoadingTrends: trendQuery.isLoading,
    refetchTrends: trendQuery.refetch,

    certificates: certificatesQuery.data ?? [],
    isLoadingCertificates: certificatesQuery.isLoading,
    refetchCertificates: certificatesQuery.refetch,

    morbidity: morbidityQuery.data ?? [],
    isLoadingMorbidity: morbidityQuery.isLoading,
    refetchMorbidity: morbidityQuery.refetch,

    reports: reportsQuery.data ?? [],
    isLoadingReports: reportsQuery.isLoading,
    refetchReports: reportsQuery.refetch,

    // Mutation triggers
    createCertificate: createCertMutation.mutateAsync,
    isCreatingCertificate: createCertMutation.isPending,

    emitCertificate: emitCertMutation.mutateAsync,
    isEmittingCertificate: emitCertMutation.isPending,

    createMorbidity: createMorbidityMutation.mutateAsync,
    isCreatingMorbidity: createMorbidityMutation.isPending,

    createReport: createReportMutation.mutateAsync,
    isCreatingReport: createReportMutation.isPending,

    submitReport: submitReportMutation.mutateAsync,
    isSubmittingReport: submitReportMutation.isPending
  };
}
