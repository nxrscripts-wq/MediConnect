import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  getNotifications,
  markAsRead,
  dismissNotification,
  subscribeToNotifications,
} from '@/services/notificationService'
import type { Notification } from '@/types/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await getNotifications(true) // load all (read + unread)
      setNotifications(data)
    } catch {
      console.warn('[Notifications] Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return

    loadNotifications()

    const cleanup = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => {
        const exists = prev.find(n => n.id === newNotification.id)
        if (exists) {
          // UPDATE: replace existing
          return prev.map(n => n.id === newNotification.id ? newNotification : n)
        }
        // INSERT: add to top + show toast
        if (!newNotification.is_read) {
          showNotificationToast(newNotification)
        }
        return [newNotification, ...prev]
      })
    })

    cleanupRef.current = cleanup

    return () => {
      if (cleanupRef.current) cleanupRef.current()
    }
  }, [user?.id, loadNotifications])

  function showNotificationToast(notification: Notification) {
    const config: Record<string, () => void> = {
      critical: () => toast.error(notification.title, {
        description: notification.message,
        duration: 6000,
      }),
      warning: () => toast.warning(notification.title, {
        description: notification.message,
        duration: 5000,
      }),
      info: () => toast.info(notification.title, {
        description: notification.message,
        duration: 4000,
      }),
      success: () => toast.success(notification.title, {
        description: notification.message,
        duration: 3000,
      }),
    }
    config[notification.severity]?.()
  }

  const handleMarkAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    try {
      await markAsRead([id])
    } catch {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: false } : n)
      )
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await markAsRead()
      toast.success('Todas as notificações marcadas como lidas')
    } catch {
      await loadNotifications()
    }
  }, [notifications, loadNotifications])

  const handleDismiss = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await dismissNotification(id)
    } catch {
      await loadNotifications()
    }
  }, [loadNotifications])

  function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 30)  return 'Agora mesmo'
    if (diffSec < 60)  return `Há ${diffSec} seg`
    if (diffMin < 60)  return `Há ${diffMin} min`
    if (diffHour < 24) return `Há ${diffHour}h`
    if (diffDay < 7)   return `Há ${diffDay} dia${diffDay > 1 ? 's' : ''}`
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
  }

  const visibleNotifications = notifications.filter(n => !n.is_dismissed)
  const unreadCount = visibleNotifications.filter(n => !n.is_read).length
  const criticalCount = visibleNotifications.filter(n => !n.is_read && n.severity === 'critical').length
  const displayNotifications = showAll ? visibleNotifications : visibleNotifications.filter(n => !n.is_read)

  return {
    notifications: displayNotifications,
    allNotifications: visibleNotifications,
    unreadCount,
    criticalCount,
    isLoading,
    isOpen,
    setIsOpen,
    showAll,
    setShowAll,
    toggleOpen: () => setIsOpen(v => !v),
    close: () => setIsOpen(false),
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    dismiss: handleDismiss,
    refresh: loadNotifications,
    formatRelativeTime,
  }
}
