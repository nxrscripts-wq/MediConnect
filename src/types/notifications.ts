export type NotificationType =
  | 'stock_critico'            // medicamento em falta
  | 'stock_baixo'              // medicamento abaixo do mínimo
  | 'exame_pendente'           // exame sem resultado há X dias
  | 'consulta_hoje'            // lembrete de consulta do dia
  | 'alerta_epidemiologico'    // surto ou alerta MINSA
  | 'boletim_pendente'         // boletim mensal por submeter
  | 'sistema';                 // mensagem geral do sistema

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  is_read: boolean;
  action_url?: string;          // rota para navegar ao clicar
  action_label?: string;        // texto do botão de acção
  created_at: string;           // ISO string
  metadata?: Record<string, unknown>;
}

export interface NotificationState {
  notifications: Notification[];
  unread_count: number;
}
