import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/notifications';

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'stock_alert',
        severity: 'critical',
        title: 'Estoque Crítico: Amoxicilina',
        message: 'O estoque de Amoxicilina 250mg atingiu o nível crítico (45 un). Verifique a necessidade de reposição.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        is_read: false,
        link: '/medications'
    },
    {
        id: '2',
        type: 'epi_alert',
        severity: 'warning',
        title: 'Aumento de Casos: Malária',
        message: 'Detetado um aumento de 15% nos casos de Malária na última semana na sua região.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        is_read: false,
        link: '/epidemiology'
    },
    {
        id: '3',
        type: 'system',
        severity: 'info',
        title: 'Manutenção do Sistema',
        message: 'Agendada manutenção para Sábado às 22h. O acesso poderá estar intermitente.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        is_read: true
    }
];

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const criticalCount = notifications.filter(n => !n.is_read && n.severity === 'critical').length;

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }, []);

    const dismiss = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

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
        formatRelativeTime
    };
};
