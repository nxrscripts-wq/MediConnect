import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

// Detect if we should run in Demo Mode (no keys provided)
export const IS_DEMO_MODE = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("SEU_PROJECTO") || supabaseAnonKey === "eyJ...";

if (IS_DEMO_MODE) {
  console.warn(
    "[MediConnect] Executando em MODO DEMO. Algumas funcionalidades podem usar dados simulados. " +
    "Para usar o backend real, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ficheiro .env.local"
  );
}

export const supabase = createClient(
  supabaseUrl && !supabaseUrl.includes("SEU_PROJECTO") ? supabaseUrl : "https://placeholder.supabase.co",
  supabaseAnonKey && supabaseAnonKey !== "eyJ..." ? supabaseAnonKey : "placeholder-key"
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
