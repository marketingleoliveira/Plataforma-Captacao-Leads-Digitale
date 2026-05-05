
-- Config 3CX por usuário
CREATE TABLE public.pbx_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  pbx_url text NOT NULL,
  extension text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  webhook_secret text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pbx_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pbx_config select" ON public.pbx_config FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own pbx_config insert" ON public.pbx_config FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pbx_config update" ON public.pbx_config FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pbx_config delete" ON public.pbx_config FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER pbx_config_updated BEFORE UPDATE ON public.pbx_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Campanhas
CREATE TYPE public.campaign_status AS ENUM ('rascunho','em_andamento','pausada','concluida','cancelada');

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'rascunho',
  total_leads integer NOT NULL DEFAULT 0,
  total_concluidos integer NOT NULL DEFAULT 0,
  iniciada_em timestamptz,
  finalizada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns select" ON public.campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own campaigns insert" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own campaigns update" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own campaigns delete" ON public.campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fila de chamadas
CREATE TYPE public.queue_status AS ENUM ('pendente','discando','em_chamada','concluido','falhou','sem_resposta','ocupado','caixa_postal');

CREATE TABLE public.call_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  status queue_status NOT NULL DEFAULT 'pendente',
  call_id text,
  resultado text,
  duracao_segundos integer,
  iniciada_em timestamptz,
  finalizada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own queue select" ON public.call_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own queue insert" ON public.call_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own queue update" ON public.call_queue FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own queue delete" ON public.call_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER call_queue_updated BEFORE UPDATE ON public.call_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX call_queue_campaign_status_idx ON public.call_queue (campaign_id, status, ordem);

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
