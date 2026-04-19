import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
    id: string;
    type: 'stock_alert' | 'epi_alert' | 'system';
    severity: 'critical' | 'warning' | 'info' | 'danger';
    title: string;
    message: string;
    timestamp: string;
    is_read: boolean;
    link?: string;
}

export const useNotifications = () => {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!profile?.health_unit_id) return;

        // Fetch stock alerts as the primary source of real-time notifications
        const { data, error } = await supabase
            .from('stock_alerts')
            .select(`
                id,
                alert_type,
                severity,
                alert_message,
                created_at,
                is_resolved
            `)
            .eq('health_unit_id', profile.health_unit_id)
            .eq('is_resolved', false)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Erro ao buscar notificações:', error);
            return;
        }

        const mapped: Notification[] = data.map(item => ({
            id: item.id,
            type: 'stock_alert', // Derived from table name
            severity: mapSeverity(item.severity),
            title: mapTitle(item.alert_type),
            message: item.alert_message,
            timestamp: item.created_at,
            is_read: item.is_resolved,
            link: '/medications'
        }));

        setNotifications(mapped);
        setLoading(false);
    }, [profile?.health_unit_id]);

    useEffect(() => {
        fetchNotifications();
        
        // Subscription for new alerts
        const channel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stock_alerts' },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications]);

    const unreadCount = notifications.length;
    const criticalCount = notifications.filter(n => n.severity === 'critical' || n.severity === 'danger').length;

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('stock_alerts')
            .update({ is_resolved: true })
            .eq('id', id);

        if (!error) fetchNotifications();
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from('stock_alerts')
            .update({ is_resolved: true })
            .eq('health_unit_id', profile?.health_unit_id)
            .eq('is_resolved', false);

        if (!error) fetchNotifications();
    };

    const dismiss = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const formatRelativeTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;

        return date.toLocaleDateString('pt-AO');
    };

    return {
        notifications,
        unreadCount,
        criticalCount,
        markAsRead,
        markAllAsRead,
        dismiss,
        formatRelativeTime,
        loading
    };
};

function mapSeverity(s: string): any {
    if (s === 'critico') return 'danger';
    if (s === 'baixo') return 'warning';
    return 'info';
}

function mapTitle(t: string): string {
    if (t === 'ruptura_stock') return 'Ruptura de Stock';
    if (t === 'stock_baixo') return 'Stock Baixo';
    if (t === 'validade_proxima') return 'Validade Próxima';
    return 'Alerta de Farmácia';
}
