import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Notification, NotificationType, NotificationSeverity } from '@/types/notifications';

export const useNotifications = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const healthUnitId = profile?.health_unit_id;

  // Fetch notifications from Supabase
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', healthUnitId],
    queryFn: async () => {
      const query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter by health unit if available
      if (healthUnitId) {
        query.or(`health_unit_id.eq.${healthUnitId},health_unit_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        // Table doesn't exist yet — return empty
        if ((error as any).code === '42P01') return [];
        console.warn('Error fetching notifications:', error.message);
        return [];
      }

      return (data ?? []) as Notification[];
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 3,
    enabled: true,
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error && (error as any).code !== '42P01') {
        console.warn('Error marking notification as read:', error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!healthUnitId) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`health_unit_id.eq.${healthUnitId},health_unit_id.is.null`)
        .eq('is_read', false);
      if (error && (error as any).code !== '42P01') {
        console.warn('Error marking all as read:', error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Dismiss (delete) a notification
  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error && (error as any).code !== '42P01') {
        console.warn('Error dismissing notification:', error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const dismiss = useCallback((id: string) => {
    dismissMutation.mutate(id);
  }, [dismissMutation]);

  const unread_count = useMemo(() =>
    notifications.filter(n => !n.is_read).length,
  [notifications]);

  const critical_count = useMemo(() =>
    notifications.filter(n => n.severity === 'critical' && !n.is_read).length,
  [notifications]);

  // Formatação de tempo relativo
  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('pt-AO');
  };

  return {
    notifications,
    unread_count,
    critical_count,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    formatRelativeTime
  };
};
