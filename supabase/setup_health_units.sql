-- 1. Criar a tabela 'health_units' se não existir
CREATE TABLE IF NOT EXISTS public.health_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    province TEXT NOT NULL,
    municipality TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Activar RLS (Row Level Security) para proteger a tabela
ALTER TABLE public.health_units ENABLE ROW LEVEL SECURITY;

-- 3. Criar Política: Todos os utilizadores (mesmo não autenticados) podem VER as unidades (necessário para o ecrã de Registo)
DROP POLICY IF EXISTS "Permitir leitura publica de health_units" ON public.health_units;
CREATE POLICY "Permitir leitura publica de health_units"
    ON public.health_units
    FOR SELECT
    USING (true);

-- 4. Inserir os dados das unidades de saúde de Angola
INSERT INTO public.health_units (code, name, type, province, municipality, address, phone, is_active)
VALUES
  ('HJM', 'Hospital Josina Machel', 'Hospital Central', 'Luanda', 'Luanda', 'Rua da Missão, Luanda', '+244 923 000 001', true),
  ('HAB', 'Hospital Américo Boavida', 'Hospital Central', 'Luanda', 'Luanda', 'Rua Cónego Manuel das Neves, Luanda', '+244 923 000 002', true),
  ('MLP', 'Maternidade Lucrécia Paim', 'Hospital Especializado', 'Luanda', 'Luanda', 'Avenida Deolinda Rodrigues, Luanda', '+244 923 000 003', true),
  ('HPDB', 'Hospital Pediátrico David Bernardino', 'Hospital Especializado', 'Luanda', 'Luanda', 'Rua Augusto Ngangula, Luanda', '+244 923 000 004', true),
  ('HGL', 'Hospital Geral de Luanda', 'Hospital Geral', 'Luanda', 'Kilamba Kiaxi', 'Camama, Kilamba Kiaxi', '+244 923 000 005', true),
  ('CMP', 'Clínica Multiperfil', 'Clínica Especializada', 'Luanda', 'Luanda', 'Morro do Bento, Luanda', '+244 923 000 006', true),
  ('HGB', 'Hospital Geral de Benguela', 'Hospital Geral', 'Benguela', 'Benguela', 'Bairro da Graça, Benguela', '+244 923 000 007', true),
  ('HGH', 'Hospital Geral do Huambo', 'Hospital Geral', 'Huambo', 'Huambo', 'Cidade Alta, Huambo', '+244 923 000 008', true),
  ('HCL', 'Hospital Central do Lubango', 'Hospital Central', 'Huíla', 'Lubango', 'Lubango', '+244 923 000 009', true),
  ('HGM', 'Hospital Geral de Malanje', 'Hospital Geral', 'Malanje', 'Malanje', 'Malanje', '+244 923 000 010', true),
  ('HGBIE', 'Hospital Geral do Bié', 'Hospital Geral', 'Bié', 'Kuito', 'Kuito, Bié', '+244 923 000 011', true),
  ('HPC', 'Hospital Provincial de Cabinda', 'Hospital Provincial', 'Cabinda', 'Cabinda', 'Cabinda', '+244 923 000 012', true),
  ('CSS', 'Centro de Saúde da Samba', 'Centro de Saúde', 'Luanda', 'Samba', 'Samba, Luanda', '+244 923 000 013', true),
  ('CSC', 'Centro de Saúde do Cazenga', 'Centro de Saúde', 'Luanda', 'Cazenga', 'Cazenga, Luanda', '+244 923 000 014', true),
  ('HMK', 'Hospital Municipal do Kilamba Kiaxi', 'Hospital Municipal', 'Luanda', 'Kilamba Kiaxi', 'Kilamba Kiaxi, Luanda', '+244 923 000 015', true)
ON CONFLICT (code) DO UPDATE 
SET is_active = EXCLUDED.is_active;

-- Actualizar o schema cache
NOTIFY pgrst, 'reload schema';
