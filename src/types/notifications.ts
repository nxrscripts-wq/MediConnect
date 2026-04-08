export type NotificationType = 'stock_alert' | 'epi_alert' | 'system' | 'appointment' | 'report';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    message: string;
    timestamp: string; // ISO string
    is_read: boolean;
    link?: string;
}
