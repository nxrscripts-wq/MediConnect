import { useState, useRef, useEffect } from 'react';
import {
    Bell,
    Package,
    Activity,
    AlertCircle,
    Calendar,
    FileText,
    X,
    CheckCheck,
    ExternalLink
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notifications';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TypeIcon = ({ type }: { type: NotificationType }) => {
    switch (type) {
        case 'stock_alert': return <Package className="h-4 w-4" />;
        case 'epi_alert': return <Activity className="h-4 w-4" />;
        case 'appointment': return <Calendar className="h-4 w-4" />;
        case 'report': return <FileText className="h-4 w-4" />;
        default: return <AlertCircle className="h-4 w-4" />;
    }
};

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        criticalCount,
        markAsRead,
        markAllAsRead,
        dismiss,
        formatRelativeTime
    } = useNotifications();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            navigate(link);
            setIsOpen(false);
        }
    };

    const handleMarkAll = () => {
        markAllAsRead();
        toast.success('Todas as notificações marcadas como lidas');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className={cn(
                        "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-1 ring-background",
                        criticalCount > 0 ? "bg-destructive animate-pulse" : "bg-primary"
                    )}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border bg-card shadow-lg ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-sm">Notificações</h3>
                            <p className="text-[10px] text-muted-foreground">Você tem {unreadCount} mensagens não lidas</p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[11px] gap-1 hover:text-primary transition-colors"
                                onClick={handleMarkAll}
                            >
                                <CheckCheck className="h-3 w-3" />
                                Marcar lidas
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[350px] overflow-y-auto overflow-x-hidden scrollbar-thin">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Sem notificações no momento</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "group relative p-4 flex gap-3 transition-all hover:bg-muted/50 cursor-pointer",
                                            !n.is_read && "bg-primary/[0.02]"
                                        )}
                                        onClick={() => handleNotificationClick(n.id, n.link)}
                                    >
                                        {!n.is_read && (
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                                        )}

                                        <div className={cn(
                                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                            n.severity === 'critical' ? "bg-destructive/10 text-destructive" :
                                                n.severity === 'warning' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                                        )}>
                                            <TypeIcon type={n.type} />
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={cn("text-sm font-semibold", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                                                    {n.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatRelativeTime(n.timestamp)}
                                                </span>
                                            </div>
                                            <p className={cn("text-xs leading-relaxed line-clamp-2", n.is_read ? "text-muted-foreground" : "text-foreground/80")}>
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <div className="flex items-center text-[10px] text-primary font-medium gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Ver detalhes <ExternalLink className="h-2.5 w-2.5" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dismiss(n.id);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-muted/30 text-center">
                        <Button variant="link" size="sm" className="text-[11px] h-4" onClick={() => setIsOpen(false)}>
                            Ver histórico completo
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
