import { useState, useRef, useEffect } from 'react'
import {
  Bell, BellOff, PackageX, AlertTriangle, FlaskConical,
  CalendarDays, FileText, X, CheckCheck, Settings2, Megaphone, User,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { SEVERITY_CONFIG } from '@/types/notifications'
import type { NotificationType } from '@/types/notifications'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'

// ── Icon mapper ──────────────────────────────────────────

function NotificationIcon({ type }: { type: NotificationType }) {
  const cls = 'h-3.5 w-3.5'
  switch (type) {
    case 'stock_critico':
    case 'stock_baixo':     return <PackageX className={cls} />
    case 'epi_alert':       return <AlertTriangle className={cls} />
    case 'exam_result':     return <FlaskConical className={cls} />
    case 'appointment':     return <CalendarDays className={cls} />
    case 'bulletin_pending': return <FileText className={cls} />
    case 'broadcast':       return <Megaphone className={cls} />
    case 'user_action':     return <User className={cls} />
    default:                return <Bell className={cls} />
  }
}

// ── Main Component ───────────────────────────────────────

export function NotificationCenter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const {
    notifications,
    allNotifications,
    unreadCount,
    criticalCount,
    isLoading,
    isOpen,
    setIsOpen,
    showAll,
    setShowAll,
    toggleOpen,
    close,
    markAsRead,
    markAllAsRead,
    dismiss,
    formatRelativeTime,
  } = useNotifications()

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  const handleAction = (id: string, url?: string | null) => {
    markAsRead(id)
    if (url) {
      navigate(url)
      close()
    }
  }

  const displayItems = showAll ? allNotifications : notifications

  return (
    <div className="relative" ref={containerRef}>
      {/* TRIGGER */}
      <button
        onClick={toggleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C75]"
        aria-label={`Notificações — ${unreadCount} não lidas`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-1 ring-white shadow-sm',
            criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-[#0A5C75]'
          )}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 rounded-lg border border-neutral-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* HEADER */}
          <div className="bg-[#0A5C75] px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Notificações</h3>
              <p className="text-[10px] text-white/60">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[10px] text-white/80 hover:text-white transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* TABS */}
          <div className="flex border-b border-neutral-200 bg-neutral-50">
            <button
              onClick={() => setShowAll(false)}
              className={cn(
                'flex-1 px-4 py-2 text-[10px] uppercase tracking-wide font-medium transition-colors',
                !showAll
                  ? 'text-[#0A5C75] border-b-2 border-[#0A5C75]'
                  : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              Não lidas {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={cn(
                'flex-1 px-4 py-2 text-[10px] uppercase tracking-wide font-medium transition-colors',
                showAll
                  ? 'text-[#0A5C75] border-b-2 border-[#0A5C75]'
                  : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              Todas ({allNotifications.length})
            </button>
          </div>

          {/* LIST */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                <BellOff className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Sem notificações</p>
                {!showAll && (
                  <p className="text-[10px] mt-1">Está tudo em dia!</p>
                )}
              </div>
            ) : (
              displayItems.map((n) => {
                const sev = SEVERITY_CONFIG[n.severity]
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'group relative border-l-4 mx-3 my-1 rounded-r-md p-3 cursor-pointer transition-colors',
                      sev?.borderClass ?? 'border-l-neutral-300',
                      !n.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-neutral-50'
                    )}
                    onClick={() => handleAction(n.id, n.action_url)}
                  >
                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="absolute left-1 top-3 h-1.5 w-1.5 rounded-full bg-[#0A5C75]" />
                    )}

                    {/* Row 1: icon + title + time */}
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'p-1.5 rounded shrink-0',
                        n.severity === 'critical' ? 'text-red-600 bg-red-50' :
                        n.severity === 'warning' ? 'text-amber-600 bg-amber-50' :
                        n.severity === 'success' ? 'text-green-600 bg-green-50' :
                        'text-neutral-500 bg-neutral-100'
                      )}>
                        <NotificationIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0 pr-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            'text-xs leading-tight',
                            !n.is_read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-600'
                          )}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 whitespace-nowrap shrink-0">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        {n.action_url && (
                          <span className="text-[10px] text-[#0A5C75] font-medium hover:underline mt-1 inline-block">
                            {n.action_label || 'Ver detalhes'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dismiss */}
                    <button
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismiss(n.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t px-4 py-2.5 bg-neutral-50 flex items-center justify-between">
            <button
              onClick={() => { navigate('/perfil?tab=actividade'); close() }}
              className="text-[10px] text-neutral-500 hover:text-[#0A5C75] font-medium transition-colors"
            >
              Ver histórico completo
            </button>
            <button
              onClick={() => { navigate('/perfil?tab=notificacoes'); close() }}
              className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-[#0A5C75] font-medium transition-colors"
            >
              <Settings2 className="h-3 w-3" />
              Preferências
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
