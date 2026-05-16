interface ChartTooltipProps {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  unit?: string
}

export function ChartTooltip({ active, payload, label, unit = '' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="gov-card p-3 shadow-lg min-w-[140px] !border-neutral-200">
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2 border-b pb-1.5">
        {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-neutral-600">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-neutral-900">
            {entry.value.toLocaleString('pt-AO')}{unit}
          </span>
        </div>
      ))}
    </div>
  )
}
