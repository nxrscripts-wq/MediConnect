-- ============================================================
-- MEDICONNECT — REFERÊNCIAS E TELECONSULTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_unit_id        uuid NOT NULL REFERENCES public.health_units(id),
  referring_doctor_id   uuid NOT NULL REFERENCES public.user_profiles(id),
  patient_id            uuid NOT NULL REFERENCES public.patients(id),
  destination_unit_id   uuid NOT NULL REFERENCES public.health_units(id),
  destination_specialty text,
  referral_reason       text NOT NULL,
  clinical_summary      text NOT NULL,
  urgency               text NOT NULL DEFAULT 'normal'
                        CHECK (urgency IN ('imediata','urgente','normal','eletiva')),
  referral_type         text NOT NULL DEFAULT 'consulta'
                        CHECK (referral_type IN ('consulta','internamento','exame','cirurgia','emergencia','teleconsulta')),
  icd10_code            text,
  icd10_description     text,
  vital_signs           jsonb,
  current_medications   text,
  status                text NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','aceite','recusado','em_atendimento','concluido','cancelado','expirado')),
  priority_score        integer DEFAULT 0,
  referral_code         text UNIQUE,
  referred_at           timestamptz NOT NULL DEFAULT now(),
  accepted_at           timestamptz,
  scheduled_date        date,
  scheduled_time        time,
  completed_at          timestamptz,
  expires_at            timestamptz DEFAULT now() + INTERVAL '72 hours',
  receiving_doctor_id   uuid REFERENCES public.user_profiles(id),
  acceptance_notes      text,
  refusal_reason        text,
  transport_mode        text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.counter_referrals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id           uuid NOT NULL REFERENCES public.referrals(id),
  patient_id            uuid NOT NULL REFERENCES public.patients(id),
  sending_unit_id       uuid NOT NULL REFERENCES public.health_units(id),
  receiving_unit_id     uuid NOT NULL REFERENCES public.health_units(id),
  created_by            uuid NOT NULL REFERENCES public.user_profiles(id),
  diagnosis             text NOT NULL,
  icd10_code            text,
  treatment_provided    text NOT NULL,
  outcome               text NOT NULL,
  follow_up_required    boolean DEFAULT false,
  follow_up_instructions text,
  follow_up_date        date,
  medications_prescribed text,
  discharge_summary     text,
  recommendations       text NOT NULL,
  status                text NOT NULL DEFAULT 'emitida',
  counter_referral_code text UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teleconsultations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id           uuid REFERENCES public.referrals(id),
  patient_id            uuid NOT NULL REFERENCES public.patients(id),
  requesting_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  responding_unit_id    uuid REFERENCES public.health_units(id),
  requesting_doctor_id  uuid NOT NULL REFERENCES public.user_profiles(id),
  responding_doctor_id  uuid REFERENCES public.user_profiles(id),
  specialty             text NOT NULL,
  subject               text NOT NULL,
  clinical_question     text NOT NULL,
  clinical_context      text,
  urgency               text NOT NULL DEFAULT 'normal',
  status                text NOT NULL DEFAULT 'aguardando'
                        CHECK (status IN ('aguardando','em_progresso','respondida','arquivada','cancelada')),
  response              text,
  response_at           timestamptz,
  tags                  text[],
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teleconsultation_messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teleconsultation_id   uuid NOT NULL REFERENCES public.teleconsultations(id) ON DELETE CASCADE,
  sender_id             uuid NOT NULL REFERENCES public.user_profiles(id),
  sender_unit_id        uuid NOT NULL REFERENCES public.health_units(id),
  message_type          text NOT NULL DEFAULT 'text',
  content               text NOT NULL,
  attachment_url        text,
  attachment_name       text,
  is_read               boolean NOT NULL DEFAULT false,
  read_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_referrals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teleconsultations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teleconsultation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_access" ON public.referrals FOR ALL USING (
  origin_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  OR destination_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('gestor','admin'))
);

CREATE POLICY "counter_ref_access" ON public.counter_referrals FOR ALL USING (
  sending_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  OR receiving_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "teleconsult_access" ON public.teleconsultations FOR ALL USING (
  requesting_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  OR COALESCE(responding_unit_id, requesting_unit_id) = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  OR status = 'aguardando'
);

CREATE POLICY "messages_access" ON public.teleconsultation_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.teleconsultations t
    WHERE t.id = teleconsultation_id
      AND (t.requesting_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
           OR t.responding_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()))
  )
);

ALTER TABLE public.referrals REPLICA IDENTITY FULL;
ALTER TABLE public.teleconsultations REPLICA IDENTITY FULL;
ALTER TABLE public.teleconsultation_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teleconsultation_messages;

CREATE INDEX IF NOT EXISTS idx_referrals_origin ON public.referrals(origin_unit_id, status, referred_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_dest ON public.referrals(destination_unit_id, status, referred_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_tc ON public.teleconsultation_messages(teleconsultation_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.create_referral(
  p_patient_id uuid, p_destination_unit_id uuid,
  p_referral_reason text, p_clinical_summary text,
  p_urgency text DEFAULT 'normal', p_referral_type text DEFAULT 'consulta',
  p_destination_specialty text DEFAULT NULL, p_icd10_code text DEFAULT NULL,
  p_icd10_description text DEFAULT NULL, p_vital_signs jsonb DEFAULT NULL,
  p_current_medications text DEFAULT NULL, p_transport_mode text DEFAULT NULL,
  p_notes text DEFAULT NULL, p_scheduled_date date DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_unit_id uuid; v_unit_code text; v_doctor_id uuid;
  v_ref_code text; v_referral_id uuid; v_expires_at timestamptz;
  v_priority integer; v_dest_name text; v_patient_name text; v_user_name text;
BEGIN
  SELECT p.health_unit_id, h.code, p.id, p.full_name
  INTO v_unit_id, v_unit_code, v_doctor_id, v_user_name
  FROM public.user_profiles p JOIN public.health_units h ON h.id = p.health_unit_id
  WHERE p.id = auth.uid();

  SELECT name INTO v_dest_name FROM public.health_units WHERE id = p_destination_unit_id;
  SELECT full_name INTO v_patient_name FROM public.patients WHERE id = p_patient_id;

  v_ref_code := UPPER(v_unit_code) || '-REF-' || TO_CHAR(now(), 'YYMMDD') || '-' ||
                LPAD((EXTRACT(EPOCH FROM now())::bigint % 99999)::text, 5, '0');

  v_priority := CASE p_urgency WHEN 'imediata' THEN 100 WHEN 'urgente' THEN 75 WHEN 'normal' THEN 50 ELSE 25 END;
  v_expires_at := CASE p_urgency
    WHEN 'imediata' THEN now() + INTERVAL '6 hours'
    WHEN 'urgente'  THEN now() + INTERVAL '24 hours'
    WHEN 'normal'   THEN now() + INTERVAL '72 hours'
    ELSE                 now() + INTERVAL '7 days' END;

  INSERT INTO public.referrals (
    origin_unit_id, referring_doctor_id, patient_id, destination_unit_id,
    destination_specialty, referral_reason, clinical_summary, urgency, referral_type,
    icd10_code, icd10_description, vital_signs, current_medications,
    transport_mode, notes, scheduled_date, referral_code, priority_score, expires_at
  ) VALUES (
    v_unit_id, v_doctor_id, p_patient_id, p_destination_unit_id,
    p_destination_specialty, p_referral_reason, p_clinical_summary, p_urgency, p_referral_type,
    p_icd10_code, p_icd10_description, p_vital_signs, p_current_medications,
    p_transport_mode, p_notes, p_scheduled_date, v_ref_code, v_priority, v_expires_at
  ) RETURNING id INTO v_referral_id;

  INSERT INTO public.notifications (
    user_id, health_unit_id, type, severity, title, message, action_url, action_label, source
  )
  SELECT up.id, p_destination_unit_id,
    'broadcast',
    CASE p_urgency WHEN 'imediata' THEN 'critical' WHEN 'urgente' THEN 'warning' ELSE 'info' END,
    'Nova referência — ' || p_urgency,
    'Paciente ' || v_patient_name || ' referenciado por ' || v_user_name,
    '/teleconsulta', 'Ver referência', 'referral'
  FROM public.user_profiles up
  WHERE up.health_unit_id = p_destination_unit_id
    AND up.is_active = true AND up.role IN ('medico','gestor','admin');

  RETURN json_build_object('referral_id', v_referral_id, 'referral_code', v_ref_code, 'expires_at', v_expires_at);
END; $$;

CREATE OR REPLACE FUNCTION public.respond_to_referral(
  p_referral_id uuid, p_action text,
  p_notes text DEFAULT NULL, p_refusal_reason text DEFAULT NULL,
  p_scheduled_date date DEFAULT NULL, p_scheduled_time time DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref record; v_doc_id uuid; v_name text;
BEGIN
  SELECT id, full_name INTO v_doc_id, v_name FROM public.user_profiles WHERE id = auth.uid();
  SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id;
  IF v_ref IS NULL THEN RAISE EXCEPTION 'REFERRAL_NOT_FOUND'; END IF;
  IF v_ref.status != 'pendente' THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;

  UPDATE public.referrals SET
    status = p_action,
    receiving_doctor_id = v_doc_id,
    accepted_at = CASE WHEN p_action = 'aceite' THEN now() ELSE NULL END,
    acceptance_notes = CASE WHEN p_action = 'aceite' THEN p_notes ELSE NULL END,
    refusal_reason = CASE WHEN p_action = 'recusado' THEN p_refusal_reason ELSE NULL END,
    scheduled_date = p_scheduled_date,
    scheduled_time = p_scheduled_time,
    updated_at = now()
  WHERE id = p_referral_id;

  INSERT INTO public.notifications (
    user_id, health_unit_id, type, severity, title, message, action_url, action_label, source
  )
  SELECT up.id, v_ref.origin_unit_id, 'broadcast',
    CASE p_action WHEN 'aceite' THEN 'success' ELSE 'warning' END,
    'Referência ' || CASE p_action WHEN 'aceite' THEN 'aceite' ELSE 'recusada' END,
    'A referência ' || v_ref.referral_code || ' foi ' || p_action || ' por ' || v_name,
    '/teleconsulta', 'Ver referência', 'referral'
  FROM public.user_profiles up
  WHERE up.health_unit_id = v_ref.origin_unit_id AND up.is_active = true;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_teleconsultation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_unit_id uuid;
BEGIN
  SELECT health_unit_id INTO v_unit_id FROM public.user_profiles WHERE id = auth.uid();
  UPDATE public.teleconsultation_messages SET is_read = true, read_at = now()
  WHERE teleconsultation_id = p_teleconsultation_id
    AND sender_unit_id != v_unit_id AND is_read = false;
END; $$;

CREATE OR REPLACE FUNCTION public.get_referral_dashboard()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_unit_id uuid;
BEGIN
  SELECT health_unit_id INTO v_unit_id FROM public.user_profiles WHERE id = auth.uid();
  RETURN json_build_object(
    'outgoing', json_build_object(
      'total',      (SELECT COUNT(*) FROM public.referrals WHERE origin_unit_id = v_unit_id),
      'pending',    (SELECT COUNT(*) FROM public.referrals WHERE origin_unit_id = v_unit_id AND status = 'pendente'),
      'accepted',   (SELECT COUNT(*) FROM public.referrals WHERE origin_unit_id = v_unit_id AND status = 'aceite'),
      'completed',  (SELECT COUNT(*) FROM public.referrals WHERE origin_unit_id = v_unit_id AND status = 'concluido'),
      'this_month', (SELECT COUNT(*) FROM public.referrals WHERE origin_unit_id = v_unit_id AND referred_at >= date_trunc('month', now()))
    ),
    'incoming', json_build_object(
      'total',      (SELECT COUNT(*) FROM public.referrals WHERE destination_unit_id = v_unit_id),
      'pending',    (SELECT COUNT(*) FROM public.referrals WHERE destination_unit_id = v_unit_id AND status = 'pendente'),
      'urgent',     (SELECT COUNT(*) FROM public.referrals WHERE destination_unit_id = v_unit_id AND status = 'pendente' AND urgency IN ('imediata','urgente')),
      'this_month', (SELECT COUNT(*) FROM public.referrals WHERE destination_unit_id = v_unit_id AND referred_at >= date_trunc('month', now()))
    ),
    'teleconsultations', json_build_object(
      'awaiting_response', (SELECT COUNT(*) FROM public.teleconsultations WHERE requesting_unit_id = v_unit_id AND status = 'aguardando'),
      'to_respond',        (SELECT COUNT(*) FROM public.teleconsultations WHERE status = 'aguardando' AND requesting_unit_id != v_unit_id)
    ),
    'recent_activity', (
      SELECT json_agg(json_build_object(
        'id', r.id, 'referral_code', r.referral_code,
        'patient_name', p.full_name,
        'direction', CASE WHEN r.origin_unit_id = v_unit_id THEN 'saida' ELSE 'entrada' END,
        'other_unit', CASE WHEN r.origin_unit_id = v_unit_id THEN h_dest.name ELSE h_orig.name END,
        'urgency', r.urgency, 'status', r.status,
        'referred_at', r.referred_at, 'expires_at', r.expires_at
      ) ORDER BY r.referred_at DESC)
      FROM public.referrals r
      JOIN public.patients p ON p.id = r.patient_id
      JOIN public.health_units h_dest ON h_dest.id = r.destination_unit_id
      JOIN public.health_units h_orig ON h_orig.id = r.origin_unit_id
      WHERE (r.origin_unit_id = v_unit_id OR r.destination_unit_id = v_unit_id)
        AND r.status NOT IN ('cancelado','expirado')
      LIMIT 15
    )
  );
END; $$;
