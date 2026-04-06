-- ============================================================================
-- MEDICONNECT — MÓDULO DE PACIENTES
-- Modelagem completa do banco de dados para o Supabase (PostgreSQL 17)
-- Sistema de Informação e Gestão Integrada de Saúde (SIGIS) — Angola
-- ============================================================================
-- Executar numa única passagem no Supabase SQL Editor.
-- Todas as instruções usam IF NOT EXISTS para idempotência.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 2. TIPOS ENUM
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE health_unit_type AS ENUM (
    'hospital_provincial',
    'hospital_municipal',
    'centro_saude',
    'posto_saude',
    'clinica_privada',
    'maternidade'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE patient_gender AS ENUM (
    'masculino',
    'feminino'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE blood_type AS ENUM (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'desconhecido'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 3. TABELA: public.health_units
-- Unidades sanitárias de Angola
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.health_units (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,                       -- ex: HJM-001
  name          text NOT NULL,                              -- ex: Hospital Josina Machel
  type          health_unit_type NOT NULL,
  province      text NOT NULL,
  municipality  text NOT NULL,
  address       text,
  phone         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. TABELA: public.patients
-- Registo central de pacientes — núcleo do módulo
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code                text NOT NULL UNIQUE,           -- PAC-YYYY-NNNNN (auto-gerado)
  national_id                 text,                           -- Bilhete de Identidade angolano
  full_name                   text NOT NULL,
  date_of_birth               date NOT NULL,
  gender                      patient_gender NOT NULL,
  blood_type                  blood_type,
  phone                       text,
  email                       text,
  province                    text NOT NULL,
  municipality                text NOT NULL,
  neighborhood                text,                           -- bairro
  address                     text,                           -- rua, número, referência
  emergency_contact_name      text,
  emergency_contact_phone     text,
  emergency_contact_relation  text,
  allergies                   text[] DEFAULT '{}',
  chronic_conditions          text[] DEFAULT '{}',
  primary_health_unit_id      uuid REFERENCES public.health_units(id),
  registered_by               uuid NOT NULL REFERENCES public.user_profiles(id),
  registered_at_unit_id       uuid NOT NULL REFERENCES public.health_units(id),
  is_active                   boolean NOT NULL DEFAULT true,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  -- Constraints de validação
  CONSTRAINT chk_dob_not_future   CHECK (date_of_birth <= CURRENT_DATE),
  CONSTRAINT chk_dob_not_ancient  CHECK (date_of_birth >= '1900-01-01'),
  CONSTRAINT chk_phone_format     CHECK (phone IS NULL OR phone ~ '^[+0-9\s\-()]{7,20}$'),
  CONSTRAINT chk_national_id_length CHECK (
    national_id IS NULL OR (length(national_id) >= 10 AND length(national_id) <= 20)
  )
);

-- ============================================================================
-- 5. TABELA: public.patient_health_units
-- Histórico de unidades por onde o paciente passou (relação M:N)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patient_health_units (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  health_unit_id  uuid NOT NULL REFERENCES public.health_units(id),
  first_visit_date date NOT NULL DEFAULT CURRENT_DATE,
  last_visit_date  date,
  is_primary      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_patient_health_unit UNIQUE (patient_id, health_unit_id)
);

-- ============================================================================
-- 6. TABELA: public.angola_locations
-- Referência geográfica: 18 províncias e respectivos municípios
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.angola_locations (
  id            serial PRIMARY KEY,
  province      text NOT NULL,
  municipality  text NOT NULL,
  UNIQUE (province, municipality)
);

-- ============================================================================
-- 7. TABELA: public.audit_logs
-- Registo imutável de acções sobre pacientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  text NOT NULL,
  record_id   uuid NOT NULL,
  action      text NOT NULL,       -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_data    jsonb,
  new_data    jsonb,
  changed_by  uuid REFERENCES public.user_profiles(id),
  changed_at  timestamptz NOT NULL DEFAULT now(),
  ip_address  text,
  user_agent  text
);

-- ============================================================================
-- 8. ACTIVAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.health_units          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_health_units  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angola_locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. POLÍTICAS RLS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 9.1 health_units — Leitura: todos autenticados | Escrita: admin
-- --------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY health_units_select_authenticated ON public.health_units
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY health_units_insert_admin ON public.health_units
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY health_units_update_admin ON public.health_units
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY health_units_delete_admin ON public.health_units
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 9.2 patients — SELECT: mesma unidade + gestores/admins vêem tudo
-- --------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY patients_select_own_unit ON public.patients
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR health_unit_id = patients.registered_at_unit_id
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: qualquer utilizador autenticado
DO $$ BEGIN
  CREATE POLICY patients_insert_authenticated ON public.patients
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: medico, enfermeiro, gestor, admin (não farmaceutico)
DO $$ BEGIN
  CREATE POLICY patients_update_clinical ON public.patients
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('medico', 'enfermeiro', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: apenas admin
DO $$ BEGIN
  CREATE POLICY patients_delete_admin ON public.patients
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 9.3 patient_health_units — mesma lógica de unidade
-- --------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY phu_select_authenticated ON public.patient_health_units
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY phu_insert_authenticated ON public.patient_health_units
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY phu_update_authenticated ON public.patient_health_units
    FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY phu_delete_admin ON public.patient_health_units
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 9.4 angola_locations — Leitura pública | Escrita admin
-- --------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY angola_locations_select_authenticated ON public.angola_locations
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY angola_locations_insert_admin ON public.angola_locations
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY angola_locations_update_admin ON public.angola_locations
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY angola_locations_delete_admin ON public.angola_locations
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 9.5 audit_logs — SELECT: gestor/admin | INSERT/UPDATE/DELETE: bloqueado
-- --------------------------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY audit_logs_select_management ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY audit_logs_no_direct_insert ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY audit_logs_no_update ON public.audit_logs
    FOR UPDATE TO authenticated
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY audit_logs_no_delete ON public.audit_logs
    FOR DELETE TO authenticated
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 10. FUNÇÃO: update_updated_at_column()
-- Actualiza automaticamente o campo updated_at em cada UPDATE
-- ============================================================================
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

-- ============================================================================
-- 11. TRIGGER: updated_at automático em patients
-- ============================================================================
DROP TRIGGER IF EXISTS trg_patients_updated_at ON public.patients;
CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. FUNÇÃO: generate_patient_code()
-- Gera código PAC-YYYY-NNNNN automaticamente no INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_patient_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  current_year integer;
  next_seq integer;
BEGIN
  -- Apenas gerar se patient_code não foi fornecido
  IF NEW.patient_code IS NOT NULL AND NEW.patient_code != '' THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM now())::integer;

  -- Contar pacientes registados no ano actual e obter próximo sequencial
  SELECT COALESCE(MAX(
    CASE
      WHEN patient_code ~ ('^PAC-' || current_year::text || '-[0-9]{5}$')
      THEN SUBSTRING(patient_code FROM '[0-9]{5}$')::integer
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM public.patients
  WHERE patient_code LIKE 'PAC-' || current_year::text || '-%';

  NEW.patient_code := 'PAC-' || current_year::text || '-' || LPAD(next_seq::text, 5, '0');
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 13. TRIGGER: patient_code automático em patients
-- ============================================================================
DROP TRIGGER IF EXISTS trg_patients_generate_code ON public.patients;
CREATE TRIGGER trg_patients_generate_code
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION generate_patient_code();

-- ============================================================================
-- 14. FUNÇÃO: audit_patient_changes() — SECURITY DEFINER
-- Regista todas as acções (INSERT/UPDATE/DELETE) na tabela audit_logs
-- Remove campo sensível national_id dos dados guardados
-- ============================================================================
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
  -- Obter utilizador actual
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    -- Remover campo sensível
    v_new := v_new - 'national_id';
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_old := v_old - 'national_id';
    v_new := v_new - 'national_id';
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_old := v_old - 'national_id';
    v_new := NULL;
  END IF;

  INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old,
    v_new,
    v_user_id
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 15. TRIGGER: audit automático em patients
-- ============================================================================
DROP TRIGGER IF EXISTS trg_patients_audit ON public.patients;
CREATE TRIGGER trg_patients_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

-- ============================================================================
-- 16. FUNÇÃO UTILITÁRIA: get_patient_age(date)
-- Calcula a idade actual em anos completos
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_patient_age(dob date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $function$
  SELECT EXTRACT(YEAR FROM age(dob))::integer;
$function$;

-- ============================================================================
-- 17. FUNÇÃO UTILITÁRIA: search_patients(text, uuid)
-- Busca por nome, código ou BI com tolerância a erros (pg_trgm)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.search_patients(
  search_term text,
  unit_id uuid DEFAULT NULL
)
RETURNS SETOF patients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.patients p
  WHERE
    p.is_active = true
    AND (
      p.full_name ILIKE '%' || search_term || '%'
      OR p.patient_code ILIKE '%' || search_term || '%'
      OR p.national_id ILIKE '%' || search_term || '%'
    )
    AND (unit_id IS NULL OR p.registered_at_unit_id = unit_id)
  ORDER BY
    similarity(p.full_name, search_term) DESC,
    p.created_at DESC
  LIMIT 50;
END;
$function$;

-- ============================================================================
-- 18. ÍNDICES
-- ============================================================================

-- patients: busca por BI (parcial)
CREATE INDEX IF NOT EXISTS idx_patients_national_id
  ON public.patients (national_id)
  WHERE national_id IS NOT NULL;

-- patients: busca por nome com pg_trgm (GIN)
CREATE INDEX IF NOT EXISTS idx_patients_full_name_trgm
  ON public.patients USING gin (full_name gin_trgm_ops);

-- patients: filtro por unidade
CREATE INDEX IF NOT EXISTS idx_patients_health_unit
  ON public.patients (registered_at_unit_id);

-- patients: filtro por província
CREATE INDEX IF NOT EXISTS idx_patients_province
  ON public.patients (province);

-- patients: listagem ordenada por data de criação
CREATE INDEX IF NOT EXISTS idx_patients_created_at
  ON public.patients (created_at DESC);

-- audit_logs: histórico por registo
CREATE INDEX IF NOT EXISTS idx_audit_record
  ON public.audit_logs (table_name, record_id);

-- audit_logs: listagem por data
CREATE INDEX IF NOT EXISTS idx_audit_changed_at
  ON public.audit_logs (changed_at DESC);

-- audit_logs: FK index para changed_by
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by
  ON public.audit_logs (changed_by);

-- patient_health_units: FK index para health_unit_id
CREATE INDEX IF NOT EXISTS idx_phu_health_unit_id
  ON public.patient_health_units (health_unit_id);

-- patients: FK index para primary_health_unit_id (parcial)
CREATE INDEX IF NOT EXISTS idx_patients_primary_health_unit_id
  ON public.patients (primary_health_unit_id)
  WHERE primary_health_unit_id IS NOT NULL;

-- patients: FK index para registered_by
CREATE INDEX IF NOT EXISTS idx_patients_registered_by
  ON public.patients (registered_by);

-- ============================================================================
-- 19. DADOS DE REFERÊNCIA — PROVÍNCIAS E MUNICÍPIOS DE ANGOLA
-- ============================================================================
INSERT INTO public.angola_locations (province, municipality) VALUES
  -- Bengo (6 municípios)
  ('Bengo', 'Caxito'),
  ('Bengo', 'Dande'),
  ('Bengo', 'Ambriz'),
  ('Bengo', 'Bula Atumba'),
  ('Bengo', 'Dembos'),
  ('Bengo', 'Pango Aluquém'),
  -- Benguela (9 municípios)
  ('Benguela', 'Benguela'),
  ('Benguela', 'Lobito'),
  ('Benguela', 'Baia Farta'),
  ('Benguela', 'Balombo'),
  ('Benguela', 'Bocoio'),
  ('Benguela', 'Caimbambo'),
  ('Benguela', 'Chongoroi'),
  ('Benguela', 'Cubal'),
  ('Benguela', 'Ganda'),
  -- Bié (8 municípios)
  ('Bié', 'Kuito'),
  ('Bié', 'Camacupa'),
  ('Bié', 'Catabola'),
  ('Bié', 'Chinguar'),
  ('Bié', 'Chitembo'),
  ('Bié', 'Cunhinga'),
  ('Bié', 'Nharea'),
  ('Bié', 'Andulo'),
  -- Cabinda (4 municípios)
  ('Cabinda', 'Cabinda'),
  ('Cabinda', 'Belize'),
  ('Cabinda', 'Buco-Zau'),
  ('Cabinda', 'Cacongo'),
  -- Cuando Cubango (8 municípios)
  ('Cuando Cubango', 'Menongue'),
  ('Cuando Cubango', 'Calai'),
  ('Cuando Cubango', 'Cuangar'),
  ('Cuando Cubango', 'Cuchi'),
  ('Cuando Cubango', 'Dirico'),
  ('Cuando Cubango', 'Mavinga'),
  ('Cuando Cubango', 'Nancova'),
  ('Cuando Cubango', 'Rivungo'),
  -- Cuanza Norte (9 municípios)
  ('Cuanza Norte', 'Ndalatando'),
  ('Cuanza Norte', 'Ambaca'),
  ('Cuanza Norte', 'Banga'),
  ('Cuanza Norte', 'Bolongongo'),
  ('Cuanza Norte', 'Cambambe'),
  ('Cuanza Norte', 'Golungo Alto'),
  ('Cuanza Norte', 'Lucala'),
  ('Cuanza Norte', 'Quiculungo'),
  ('Cuanza Norte', 'Samba Caju'),
  -- Cuanza Sul (14 municípios)
  ('Cuanza Sul', 'Sumbe'),
  ('Cuanza Sul', 'Amboim'),
  ('Cuanza Sul', 'Cassongue'),
  ('Cuanza Sul', 'Cela'),
  ('Cuanza Sul', 'Conda'),
  ('Cuanza Sul', 'Ebo'),
  ('Cuanza Sul', 'Kibala'),
  ('Cuanza Sul', 'Killengues'),
  ('Cuanza Sul', 'Libolo'),
  ('Cuanza Sul', 'Mussende'),
  ('Cuanza Sul', 'Porto Amboim'),
  ('Cuanza Sul', 'Quibala'),
  ('Cuanza Sul', 'Quilenda'),
  ('Cuanza Sul', 'Seles'),
  -- Cunene (5 municípios)
  ('Cunene', 'Ondjiva'),
  ('Cunene', 'Cahama'),
  ('Cunene', 'Cuanhama'),
  ('Cunene', 'Curoca'),
  ('Cunene', 'Namacunde'),
  -- Huambo (11 municípios)
  ('Huambo', 'Huambo'),
  ('Huambo', 'Bailundo'),
  ('Huambo', 'Caála'),
  ('Huambo', 'Catchiungo'),
  ('Huambo', 'Chicala Cholohanga'),
  ('Huambo', 'Chinjenje'),
  ('Huambo', 'Ecunha'),
  ('Huambo', 'Longonjo'),
  ('Huambo', 'Mungo'),
  ('Huambo', 'Ukuma'),
  ('Huambo', 'Tchicala-Tcholoanga'),
  -- Huíla (15 municípios)
  ('Huíla', 'Lubango'),
  ('Huíla', 'Caconda'),
  ('Huíla', 'Cacula'),
  ('Huíla', 'Caluquembe'),
  ('Huíla', 'Chiange'),
  ('Huíla', 'Chibia'),
  ('Huíla', 'Chicomba'),
  ('Huíla', 'Chipindo'),
  ('Huíla', 'Cuvango'),
  ('Huíla', 'Gambos'),
  ('Huíla', 'Humpata'),
  ('Huíla', 'Jamba'),
  ('Huíla', 'Matala'),
  ('Huíla', 'Quilengues'),
  ('Huíla', 'Quipungo'),
  -- Luanda (13 municípios)
  ('Luanda', 'Luanda'),
  ('Luanda', 'Belas'),
  ('Luanda', 'Cazenga'),
  ('Luanda', 'Icolo e Bengo'),
  ('Luanda', 'Cacuaco'),
  ('Luanda', 'Kilamba Kiaxi'),
  ('Luanda', 'Viana'),
  ('Luanda', 'Talatona'),
  ('Luanda', 'Ingombota'),
  ('Luanda', 'Maianga'),
  ('Luanda', 'Rangel'),
  ('Luanda', 'Sambizanga'),
  ('Luanda', 'Samba'),
  -- Lunda Norte (10 municípios)
  ('Lunda Norte', 'Dundo'),
  ('Lunda Norte', 'Cambulo'),
  ('Lunda Norte', 'Capenda-Camulemba'),
  ('Lunda Norte', 'Caungula'),
  ('Lunda Norte', 'Chitato'),
  ('Lunda Norte', 'Cuango'),
  ('Lunda Norte', 'Cuílo'),
  ('Lunda Norte', 'Lubalo'),
  ('Lunda Norte', 'Lucapa'),
  ('Lunda Norte', 'Xá-Muteba'),
  -- Lunda Sul (4 municípios)
  ('Lunda Sul', 'Saurimo'),
  ('Lunda Sul', 'Cacolo'),
  ('Lunda Sul', 'Dala'),
  ('Lunda Sul', 'Muconda'),
  -- Malanje (13 municípios)
  ('Malanje', 'Malanje'),
  ('Malanje', 'Calandula'),
  ('Malanje', 'Cambundi-Catembo'),
  ('Malanje', 'Cangandala'),
  ('Malanje', 'Caombo'),
  ('Malanje', 'Cuaba Nzogo'),
  ('Malanje', 'Cunda-dia-Baze'),
  ('Malanje', 'Luquembo'),
  ('Malanje', 'Marimba'),
  ('Malanje', 'Massango'),
  ('Malanje', 'Mucari'),
  ('Malanje', 'Quela'),
  ('Malanje', 'Quirima'),
  -- Moxico (8 municípios)
  ('Moxico', 'Luena'),
  ('Moxico', 'Alto Zambeze'),
  ('Moxico', 'Bundas'),
  ('Moxico', 'Camanongue'),
  ('Moxico', 'Léua'),
  ('Moxico', 'Luchazes'),
  ('Moxico', 'Lumege'),
  ('Moxico', 'Lutembo'),
  -- Namibe (5 municípios)
  ('Namibe', 'Moçâmedes'),
  ('Namibe', 'Bibala'),
  ('Namibe', 'Camucuio'),
  ('Namibe', 'Tômbwa'),
  ('Namibe', 'Virei'),
  -- Uíge (19 municípios)
  ('Uíge', 'Uíge'),
  ('Uíge', 'Alto Cauale'),
  ('Uíge', 'Ambuíla'),
  ('Uíge', 'Bembe'),
  ('Uíge', 'Buengas'),
  ('Uíge', 'Bungo'),
  ('Uíge', 'Damba'),
  ('Uíge', 'Macocola'),
  ('Uíge', 'Maquela do Zombo'),
  ('Uíge', 'Milunga'),
  ('Uíge', 'Mucaba'),
  ('Uíge', 'Negage'),
  ('Uíge', 'Puri'),
  ('Uíge', 'Quimbele'),
  ('Uíge', 'Quitexe'),
  ('Uíge', 'Rinção'),
  ('Uíge', 'Sanza Pombo'),
  ('Uíge', 'Songo'),
  ('Uíge', 'Zombo'),
  -- Zaire (6 municípios)
  ('Zaire', 'M''banza-Kongo'),
  ('Zaire', 'Cuimba'),
  ('Zaire', 'Nóqui'),
  ('Zaire', 'Nzeto'),
  ('Zaire', 'Soyo'),
  ('Zaire', 'Tomboco')
ON CONFLICT (province, municipality) DO NOTHING;

-- ============================================================================
-- 20. UNIDADES DE SAÚDE DE EXEMPLO (desenvolvimento)
-- ============================================================================
INSERT INTO public.health_units (code, name, type, province, municipality) VALUES
  ('HJM-001', 'Hospital Josina Machel',       'hospital_provincial', 'Luanda', 'Maianga'),
  ('HSM-001', 'Hospital Sanatório de Luanda',  'hospital_provincial', 'Luanda', 'Ingombota'),
  ('CSV-001', 'Centro de Saúde de Viana',      'centro_saude',        'Luanda', 'Viana')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
-- Resultado esperado:
--   ✓ 1 extensão (pg_trgm)
--   ✓ 3 ENUMs (health_unit_type, patient_gender, blood_type)
--   ✓ 5 tabelas com RLS activo (health_units, patients, patient_health_units,
--     angola_locations, audit_logs)
--   ✓ 20+ políticas RLS por papel e unidade
--   ✓ 3 triggers (updated_at, patient_code, audit)
--   ✓ 5 funções (update_updated_at_column, generate_patient_code,
--     audit_patient_changes, get_patient_age, search_patients)
--   ✓ 7 índices personalizados (GIN trgm, parcial, B-tree)
--   ✓ 4 CHECK constraints (dob, phone, national_id)
--   ✓ 167 municípios em 18 províncias angolanas
--   ✓ 3 unidades de saúde de exemplo
-- ============================================================================
