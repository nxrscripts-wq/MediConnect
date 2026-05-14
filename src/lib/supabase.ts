import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias para inicializar o MediConnect.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'medico' | 'enfermeiro' | 'farmaceutico' | 'gestor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  health_unit_id: string | null;
  health_unit_name: string;
  is_active: boolean;
  created_at: string;
}

