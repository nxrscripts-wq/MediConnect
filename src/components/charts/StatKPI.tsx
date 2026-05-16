import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatKPIProps {
  label: string
  value: number
  previousValue?: number
  icon: React.ComponentType<{ className?: string }>
  borderColor: string
  format?: 'number' | 'percent'
  suffix?: string
  description?: string
}

export function StatKPI({
  label, value, previousValue, icon: Icon,
  borderColor, format = 'number', suffix = '', description,
}: StatKPIProps) {
  const trend = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : null

  const formatValue = (v: number) =>
    format === 'percent'
      ? `${v}%`
      : v.toLocaleString('pt-AO') + suffix

  return (
    <div
      className="gov-card p-4 border-l-4 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="gov-data-label text-[10px]">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 tracking-tight">
            {formatValue(value)}
          </p>
          {description && (
            <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{description}</p>
          )}
          {trend !== null && (
            <div className={`flex items-center gap-1 mt-2 text-[10px] font-medium ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-neutral-400'
            }`}>
              {trend > 0
                ? <TrendingUp className="h-3 w-3" />
                : trend < 0
                ? <TrendingDown className="h-3 w-3" />
                : <Minus className="h-3 w-3" />
              }
              {trend !== 0
                ? `${Math.abs(trend).toFixed(1)}% vs mês anterior`
                : 'Igual ao mês anterior'
              }
            </div>
          )}
        </div>
        <div
          className="p-2.5 rounded-lg shrink-0 ml-3"
          style={{ backgroundColor: borderColor + '15' }}
        >
          <Icon className="h-5 w-5" style={{ color: borderColor }} />
        </div>
      </div>
    </div>
  )
}
