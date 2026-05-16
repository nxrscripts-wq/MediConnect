import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PatientSearchBarProps {
    value: string
    onChange: (value: string) => void
    isFetching?: boolean
    placeholder?: string
}

export function PatientSearchBar({
    value,
    onChange,
    isFetching,
    placeholder = "Pesquisar por nome, código de paciente ou número de BI..."
}: PatientSearchBarProps) {
    return (
        <div className="relative flex-1 w-full max-w-lg">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#0A5C75]" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </div>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9 bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-neutral-400 hover:text-neutral-700"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}
