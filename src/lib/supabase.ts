import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[MediConnect] Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. " +
    "Crie um ficheiro .env.local na raiz do projecto com essas variáveis."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-key"
);

// ---------- tipos ----------

export type UserRole =
  | "medico"
  | "enfermeiro"
  | "farmaceutico"
  | "gestor"
  | "admin";

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
