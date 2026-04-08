import { cn } from '@/lib/utils'

interface PatientStatusBadgeProps {
    isActive: boolean
    className?: string
}

export function PatientStatusBadge({ isActive, className }: PatientStatusBadgeProps) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-orange-100 text-orange-700",
            className
        )}>
            {isActive ? 'Ativo' : 'Inativo'}
        </span>
    )
}
