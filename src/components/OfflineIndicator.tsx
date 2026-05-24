import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus()

  if (isOnline && !wasOffline) return null

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-2 px-4 py-2 rounded-full shadow-lg',
      'text-xs font-semibold transition-all duration-300',
      !isOnline
        ? 'bg-red-600 text-white'
        : 'bg-green-600 text-white'
    )}>
      {!isOnline
        ? <><WifiOff className="h-3.5 w-3.5" />Sem ligação à internet</>
        : <><CheckCircle2 className="h-3.5 w-3.5" />Ligação restaurada</>
      }
    </div>
  )
}
