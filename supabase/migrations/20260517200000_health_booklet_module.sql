-- ============================================================================
-- MEDICONNECT — MÓDULO BOLETIM DE SANIDADE DIGITAL
-- Persistência do Boletim de Sanidade Digital (MINSA Angola).
-- ============================================================================
-- Executar no Supabase SQL Editor ou via ferramenta de migração.
-- ============================================================================

-- 0. DECLARAÇÕES DE SEGURANÇA E FALLBACK DE FUNÇÕES COMUNS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_patient_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW) - 'national_id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD) - 'national_id';
    v_new := to_jsonb(NEW) - 'national_id';
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD) - 'national_id';
    v_new := NULL;
  END IF;

  -- Verifica dinamicamente qual tabela de auditoria está activa no ambiente
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) THEN
    EXECUTE 'INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by) VALUES ($1, $2, $3, $4, $5, $6)'
    USING TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, v_old, v_new, v_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_activity_log'
  ) THEN
    EXECUTE 'INSERT INTO public.user_activity_log (user_id, activity_type, description) VALUES ($1, $2, $3)'
    USING v_user_id, 'audit_' || TG_TABLE_NAME || '_' || TG_OP, 'Alteração na tabela ' || TG_TABLE_NAME || ' para o registo ' || COALESCE(NEW.id, OLD.id)::text;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;


-- 1. TABELA PRINCIPAL: public.health_booklets
CREATE TABLE IF NOT EXISTS public.health_booklets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booklet_number      text NOT NULL UNIQUE,                       -- auto-gerado (BSD-YYYY-NNNNN)
  patient_id          uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  health_unit_id      uuid NOT NULL REFERENCES public.health_units(id),
  created_by          uuid NOT NULL REFERENCES public.user_profiles(id),
  
  -- Dados Demográficos Oficiais do Boletim
  bi_number           text,                                       -- Número do Bilhete de Identidade
  bi_issue_date       date,                                       -- Data de Emissão do BI
  bi_archive          text,                                       -- Arquivo / Local de Emissão do BI
  birth_place         text,                                       -- Naturalidade
  civil_status        text,                                       -- Estado Civil
  profession          text,                                       -- Profissão
  workplace           text,                                       -- Local de Trabalho
  
  -- Mídias Associadas (URLs no Supabase Storage)
  photo_url           text,                                       -- Fotografia do paciente
  signature_url       text,                                       -- Assinatura do médico sanitário
  stamp_url           text,                                       -- Carimbo digital da inspeção
  
  observations        text,                                       -- Observações Gerais
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 2. TABELA DETALHE: public.health_booklet_vaccines
-- Controle de vacinas administradas (como VAT T.T.-1 a T.T.-5 e outras)
CREATE TABLE IF NOT EXISTS public.health_booklet_vaccines (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booklet_id          uuid NOT NULL REFERENCES public.health_booklets(id) ON DELETE CASCADE,
  vaccine_code        text NOT NULL,                              -- 'tt_1', 'tt_2', 'tt_3', 'tt_4', 'tt_5', 'outra'
  vaccine_name        text NOT NULL,                              -- 'T.T.-1', 'T.T.-2', 'T.T.-3', 'T.T.-4', 'T.T.-5' ou outras
  dose_date           date,                                       -- Data da dose
  lot_number          text,                                       -- Lote da vacina
  observations        text,                                       -- Observações ou notas
  administered_by     uuid REFERENCES public.user_profiles(id),   -- Responsável pela dose
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. TABELA DETALHE: public.health_booklet_inspections
-- Registro de vistorias sanitárias e inspeções
CREATE TABLE IF NOT EXISTS public.health_booklet_inspections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booklet_id          uuid NOT NULL REFERENCES public.health_booklets(id) ON DELETE CASCADE,
  inspection_date     date NOT NULL DEFAULT CURRENT_DATE,         -- Data da Inspeção
  next_inspection_date date,                                      -- Reinspeção
  doctor_id           uuid NOT NULL REFERENCES public.user_profiles(id), -- Médico Sanitário
  observations        text,                                       -- Observações Gerais
  clinical_notes      text,                                       -- Notas Clínicas específicas
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 4. ATIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.health_booklets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_booklet_vaccines   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_booklet_inspections ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS - public.health_booklets
-- Leitura: Qualquer utilizador autenticado
DO $$ BEGIN
  CREATE POLICY health_booklets_select ON public.health_booklets
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Inserção/Atualização: apenas médicos, gestores ou administradores
DO $$ BEGIN
  CREATE POLICY health_booklets_insert ON public.health_booklets
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('medico', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY health_booklets_update ON public.health_booklets
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('medico', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deleção: apenas administradores
DO $$ BEGIN
  CREATE POLICY health_booklets_delete ON public.health_booklets
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. POLÍTICAS RLS - public.health_booklet_vaccines
DO $$ BEGIN
  CREATE POLICY vaccines_all ON public.health_booklet_vaccines
    FOR ALL TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. POLÍTICAS RLS - public.health_booklet_inspections
DO $$ BEGIN
  CREATE POLICY inspections_all ON public.health_booklet_inspections
    FOR ALL TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. GATILHO PARA ATUALIZAÇÃO DO CAMPO updated_at EM health_booklets
DROP TRIGGER IF EXISTS trg_health_booklets_updated_at ON public.health_booklets;
CREATE TRIGGER trg_health_booklets_updated_at
  BEFORE UPDATE ON public.health_booklets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. REGISTRO DE AUDITORIA NOS TRIGGERS
DROP TRIGGER IF EXISTS trg_health_booklets_audit ON public.health_booklets;
CREATE TRIGGER trg_health_booklets_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.health_booklets
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patient_changes();

DROP TRIGGER IF EXISTS trg_health_booklet_vaccines_audit ON public.health_booklet_vaccines;
CREATE TRIGGER trg_health_booklet_vaccines_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.health_booklet_vaccines
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patient_changes();

DROP TRIGGER IF EXISTS trg_health_booklet_inspections_audit ON public.health_booklet_inspections;
CREATE TRIGGER trg_health_booklet_inspections_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.health_booklet_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patient_changes();

-- 10. FUNÇÃO E TRIGGER PARA AUTO-GERAÇÃO DO CÓDIGO DO BOLETIM (BSD-YYYY-NNNNN)
CREATE OR REPLACE FUNCTION public.generate_booklet_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_year integer;
  next_seq integer;
BEGIN
  -- Apenas gerar se booklet_number não foi fornecido
  IF NEW.booklet_number IS NOT NULL AND NEW.booklet_number != '' THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM now())::integer;

  -- Contar boletins registados no ano actual e obter o próximo sequencial
  SELECT COALESCE(MAX(
    CASE
      WHEN booklet_number ~ ('^BSD-' || current_year::text || '-[0-9]{5}$')
      THEN SUBSTRING(booklet_number FROM '[0-9]{5}$')::integer
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM public.health_booklets
  WHERE booklet_number LIKE 'BSD-' || current_year::text || '-%';

  NEW.booklet_number := 'BSD-' || current_year::text || '-' || LPAD(next_seq::text, 5, '0');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_health_booklets_generate_code ON public.health_booklets;
CREATE TRIGGER trg_health_booklets_generate_code
  BEFORE INSERT ON public.health_booklets
  FOR EACH ROW
  EXECUTE FUNCTION generate_booklet_code();

-- 11. ÍNDICES DE PERFORMANCE E PESQUISA
CREATE INDEX IF NOT EXISTS idx_health_booklets_patient_id ON public.health_booklets(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_booklets_health_unit_id ON public.health_booklets(health_unit_id);
CREATE INDEX IF NOT EXISTS idx_health_booklets_booklet_number ON public.health_booklets(booklet_number);
CREATE INDEX IF NOT EXISTS idx_health_booklet_vaccines_booklet_id ON public.health_booklet_vaccines(booklet_id);
CREATE INDEX IF NOT EXISTS idx_health_booklet_inspections_booklet_id ON public.health_booklet_inspections(booklet_id);

-- 12. ESTRUTURA DO BUCKET DE STORAGE E SUAS RESPECTIVAS POLÍTICAS RLS
-- Criando o bucket health-booklet-assets se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-booklet-assets', 'health-booklet-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Apagando políticas antigas caso já existam (segurança contra execuções repetidas)
DROP POLICY IF EXISTS "Public View Health Booklets Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Health Booklets Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Health Booklets Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Health Booklets Assets" ON storage.objects;

-- Criando políticas para permitir leitura pública das imagens e controle restrito para inserções
CREATE POLICY "Public View Health Booklets Assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'health-booklet-assets');

CREATE POLICY "Authenticated Insert Health Booklets Assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'health-booklet-assets');

CREATE POLICY "Authenticated Update Health Booklets Assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'health-booklet-assets');

CREATE POLICY "Authenticated Delete Health Booklets Assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'health-booklet-assets');
