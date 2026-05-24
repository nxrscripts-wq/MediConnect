-- ============================================================================
-- MEDICONNECT — SISTEMA NACIONAL DE BOLETIM DE SANIDADE DIGITAL
-- Estrutura DDL para Clínicas, Empresas, Exames e Auditorias de QR Code.
-- ============================================================================

-- 0. CORRECÇÃO DA FUNÇÃO DE FALLBACK DE AUDITORIA (AJUSTE DE SCHEMA E SEÇÃO ADMIN)
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

  -- Se for execução administrativa ou migração, v_user_id será NULL.
  -- Buscamos o primeiro utilizador administrativo da base de dados como fallback.
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.user_profiles LIMIT 1;
  END IF;

  -- Fallback de último caso (UUID estático temporário de sistema)
  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

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
    EXECUTE 'INSERT INTO public.user_activity_log (user_id, action, description) VALUES ($1, $2, $3)'
    USING v_user_id, 'audit_' || TG_TABLE_NAME || '_' || TG_OP, 'Alteração na tabela ' || TG_TABLE_NAME || ' para o registo ' || COALESCE(NEW.id, OLD.id)::text;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;


-- 1. TABELA DE CLÍNICAS E LABORATÓRIOS OFICIAIS
CREATE TABLE IF NOT EXISTS public.clinics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  nif                 text NOT NULL UNIQUE,
  license             text NOT NULL UNIQUE,
  municipality        text NOT NULL,
  province            text NOT NULL,
  technical_director  text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 2. TABELA DE EMPRESAS REGULADAS (EMPREGADORES)
CREATE TABLE IF NOT EXISTS public.companies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  nif                 text NOT NULL UNIQUE,
  address             text,
  industry            text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. TABELA DE VÍNCULOS DE COLABORADORES E PARTILHA DE BOLETIM
CREATE TABLE IF NOT EXISTS public.company_employees (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  patient_id          uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  is_authorized       boolean NOT NULL DEFAULT false,             -- Autorização de partilha do paciente
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, patient_id)
);

-- 4. TABELA DE EXAMES MÉDICOS E LABORATORIAIS
CREATE TABLE IF NOT EXISTS public.medical_exams (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id           uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_name         text NOT NULL,
  doctor_license      text NOT NULL,
  exam_type           text NOT NULL,                              -- 'sangue', 'urina', 'raio_x', 'clinico'
  exam_date           date NOT NULL DEFAULT CURRENT_DATE,
  result              text NOT NULL DEFAULT 'pendente',           -- 'normal', 'alterado', 'pendente'
  clinical_notes      text,
  attachment_url      text,                                       -- PDF do laudo laboratorial
  status              text NOT NULL DEFAULT 'pendente',           -- 'pendente', 'aprovado', 'rejeitado'
  signature_url       text,                                       -- Assinatura médica
  stamp_url           text,                                       -- Carimbo médico
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 5. TABELA DE AUDITORIA DE QR CODE (VALIDAÇÕES EM TEMPO REAL)
CREATE TABLE IF NOT EXISTS public.qr_validations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booklet_id          uuid NOT NULL REFERENCES public.health_booklets(id) ON DELETE CASCADE,
  validator_ip        text,
  validator_entity    text NOT NULL,                              -- 'public', 'empresa', 'governo'
  status              text NOT NULL,                              -- 'valido', 'expirado', 'revogado'
  validated_at        timestamptz NOT NULL DEFAULT now()
);

-- 6. ATIVAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clinics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_exams     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_validations    ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS - ACESSO TOTAL PARA UTILIZADORES AUTENTICADOS
DO $$ BEGIN
  CREATE POLICY clinics_select ON public.clinics FOR SELECT TO authenticated USING (true);
  CREATE POLICY clinics_all ON public.clinics FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated USING (true);
  CREATE POLICY companies_all ON public.companies FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY company_employees_select ON public.company_employees FOR SELECT TO authenticated USING (true);
  CREATE POLICY company_employees_all ON public.company_employees FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY medical_exams_select ON public.medical_exams FOR SELECT TO authenticated USING (true);
  CREATE POLICY medical_exams_all ON public.medical_exams FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY qr_validations_select ON public.qr_validations FOR SELECT TO authenticated USING (true);
  CREATE POLICY qr_validations_insert ON public.qr_validations FOR INSERT TO public WITH CHECK (true); -- Permitir inserção pública
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. GATILHO PARA ATUALIZAÇÃO DO CAMPO updated_at EM medical_exams
DROP TRIGGER IF EXISTS trg_medical_exams_updated_at ON public.medical_exams;
CREATE TRIGGER trg_medical_exams_updated_at
  BEFORE UPDATE ON public.medical_exams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. GATILHOS DE AUDITORIA DE ALTERAÇÃO
DROP TRIGGER IF EXISTS trg_clinics_audit ON public.clinics;
CREATE TRIGGER trg_clinics_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.clinics
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patient_changes();

DROP TRIGGER IF EXISTS trg_companies_audit ON public.companies;
CREATE TRIGGER trg_companies_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patient_changes();

DROP TRIGGER IF EXISTS trg_medical_exams_audit ON public.medical_exams;
CREATE TRIGGER trg_medical_exams_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_exams
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patient_changes();


-- 10. INSERÇÃO DE DADOS DE SEED (CLÍNICAS E EMPRESAS PARA SIMULAÇÃO)
INSERT INTO public.clinics (id, name, nif, license, municipality, province, technical_director)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Clínica Sagrada Esperança', '5401123490', 'LIC-MINSA-2024-0091', 'Maianga', 'Luanda', 'Dr. Manuel Domingos'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Centro Médico e Laboratório Patriota', '5401198754', 'LIC-MINSA-2024-0238', 'Talatona', 'Luanda', 'Dra. Ana Maria Gaspar')
ON CONFLICT (nif) DO NOTHING;

INSERT INTO public.companies (id, name, nif, address, industry)
VALUES 
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Sonangol E.P.', '5401000192', 'Rua Rainha Ginga, Edifício Sede, Luanda', 'Petróleo & Energia'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Unitel S.A.', '5401029384', 'Via S8, Talatona, Luanda', 'Telecomunicações')
ON CONFLICT (nif) DO NOTHING;
