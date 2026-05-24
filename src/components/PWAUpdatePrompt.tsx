import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4
      sm:w-80 z-50 gov-card border shadow-xl p-4">
      <div className="flex items-start gap-3">
        <RefreshCw className="h-5 w-5 text-[#0A5C75] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Nova versão disponível</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actualize para ter as últimas funcionalidades do MediConnect.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" className="flex-1 bg-[#0A5C75] text-white text-xs"
          onClick={() => updateServiceWorker(true)}>
          Actualizar agora
        </Button>
        <Button size="sm" variant="outline" className="text-xs"
          onClick={() => updateServiceWorker(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
