import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { getPatients } from '@/services/patientService'
import { PatientFilters } from '@/types/patient'

export function usePatients() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<PatientFilters>({
        page: 1,
        page_size: 20,
        is_active: true
    })

    const debouncedSearch = useDebounce(searchTerm, 400)

    // Reset page when search changes
    useEffect(() => {
        setFilters(prev => ({ ...prev, page: 1 }))
    }, [debouncedSearch])

    const queryKey = ['patients', { ...filters, search: debouncedSearch }]

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey,
        queryFn: () => getPatients({ ...filters, search: debouncedSearch }),
        staleTime: 1000 * 60 * 2, // 2 minutes
        placeholderData: keepPreviousData
    })

    const setSearch = useCallback((term: string) => {
        setSearchTerm(term)
    }, [])

    const setFilter = useCallback((key: keyof PatientFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
    }, [])

    const clearFilters = useCallback(() => {
        setSearchTerm('')
        setFilters({ page: 1, page_size: 20, is_active: true })
    }, [])

    const goToPage = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }))
    }, [])

    const nextPage = useCallback(() => {
        if (data && filters.page! < data.total_pages) {
            goToPage(filters.page! + 1)
        }
    }, [data, filters.page, goToPage])

    const previousPage = useCallback(() => {
        if (filters.page! > 1) {
            goToPage(filters.page! - 1)
        }
    }, [filters.page, goToPage])

    return {
        patients: data?.data ?? [],
        total: data?.total ?? 0,
        totalPages: data?.total_pages ?? 1,
        currentPage: filters.page ?? 1,
        isLoading,
        isFetching,
        error,
        refetch,
        searchTerm,
        setSearch,
        setFilter,
        clearFilters,
        goToPage,
        nextPage,
        previousPage,
        hasNextPage: (filters.page ?? 1) < (data?.total_pages ?? 1),
        hasPreviousPage: (filters.page ?? 1) > 1
    }
}
