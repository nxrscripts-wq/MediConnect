import { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  PackageX, 
  AlertTriangle, 
  FlaskConical, 
  CalendarDays, 
  FileText, 
  X,
  CheckCheck
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notifications';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = ({ type, severity }: { type: NotificationType, severity: string }) => {
  const iconProps = { className: "h-4 w-4" };
  
  const icon = (() => {
    switch (type) {
      case 'stock_critico':
      case 'stock_baixo':
        return <PackageX {...iconProps} />;
      case 'alerta_epidemiologico':
        return <AlertTriangle {...iconProps} />;
      case 'exame_pendente':
        return <FlaskConical {...iconProps} />;
      case 'consulta_hoje':
        return <CalendarDays {...iconProps} />;
      case 'boletim_pendente':
        return <FileText {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  })();

  const colors = (() => {
    switch (severity) {
      case 'critical': return 'text-destructive bg-destructive/10';
      case 'warning': return 'text-warning bg-warning/10';
      case 'info': return 'text-info bg-info/10';
      case 'success': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  })();

  return (
    <div className={cn("rounded-lg p-1.5 shrink-0", colors)}>
      {icon}
    </div>
  );
};

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unread_count, 
    critical_count, 
    markAsRead, 
    markAllAsRead, 
    dismiss, 
    formatRelativeTime 
  } = useNotifications();

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (id: string, url?: string) => {
    markAsRead(id);
    if (url) {
      navigate(url);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* TRIGGER */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative h-8 w-8 hover:bg-muted transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread_count > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-1 ring-background",
            critical_count > 0 ? "bg-destructive animate-pulse" : "bg-primary"
          )}>
            {unread_count > 9 ? '9+' : unread_count}
          </span>
        )}
      </Button>

      {/* DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Notificações</h3>
            {unread_count > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 gap-1.5"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* LISTA */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <BellOff className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Sem notificações</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={cn(
                      "group relative px-4 py-3 flex gap-3 cursor-pointer transition-colors hover:bg-muted/50",
                      !n.is_read && "bg-primary/[0.03]"
                    )}
                    onClick={() => handleAction(n.id, n.action_url)}
                  >
                    <NotificationIcon type={n.type} severity={n.severity} />
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-xs leading-none",
                          !n.is_read ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                        )}>
                          {n.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(n.created_at)}
                        </span>
                        {n.action_url && (
                          <span className="text-[10px] text-primary font-semibold hover:underline">
                            {n.action_label || 'Ver detalhes'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DISMISS BUTTON */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(n.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t bg-muted/10 p-2 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8 text-[11px] text-muted-foreground hover:text-foreground font-medium"
            >
              Ver todas as notificações
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
