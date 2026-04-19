export type AppointmentStatus = 'agendado' | 'confirmado' | 'aguardando' | 'em_atendimento' | 'concluido' | 'cancelado' | 'faltou' | 'reagendado';
export type AppointmentType = 'consulta_geral' | 'retorno' | 'urgencia' | 'pre_natal' | 'pediatria' | 'vacinacao' | 'exames' | 'cirurgia' | 'outro';
export type AppointmentPriority = 'urgente' | 'alta' | 'normal' | 'baixa';

export interface Appointment {
  id: string;
  patient_id: string;
  health_unit_id: string;
  assigned_to?: string;
  scheduled_by: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  priority: AppointmentPriority;
  chief_complaint?: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient: {
    full_name: string;
    patient_code: string;
  };
  assigned_doctor?: {
    full_name: string;
  };
}
