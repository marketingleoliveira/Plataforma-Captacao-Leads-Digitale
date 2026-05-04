-- Status enum
DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM (
    'novo', 'contatado', 'qualificado', 'nao_qualificado', 'nao_atendeu', 'caixa_postal'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text NOT NULL,
  empresa text,
  email text,
  origem text DEFAULT 'digitaletextil.com.br',
  status public.lead_status NOT NULL DEFAULT 'novo',
  score integer NOT NULL DEFAULT 0,
  tentativas integer NOT NULL DEFAULT 0,
  ultima_tentativa timestamptz,
  observacoes text,
  campos_extras jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_telefone_idx ON public.leads(telefone);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
CREATE POLICY "Users can insert their own leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
CREATE POLICY "Users can update their own leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Users can delete their own leads" ON public.leads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
