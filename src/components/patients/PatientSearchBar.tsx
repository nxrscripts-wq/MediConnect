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
    placeholder = "Pesquisar por nome, código ou BI..."
}: PatientSearchBarProps) {
    return (
        <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </div>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9 bg-card border-border/50"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}
