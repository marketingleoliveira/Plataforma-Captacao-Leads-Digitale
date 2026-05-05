import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — VoiceLead AI" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    pbx_url: "",
    extension: "",
    client_id: "",
    client_secret: "",
    webhook_secret: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("pbx_config").select("*").maybeSingle();
      if (data) setForm(data as any);
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return toast.error("Faça login novamente");
    }
    const payload = {
      user_id: u.user.id,
      pbx_url: form.pbx_url.trim(),
      extension: form.extension.trim(),
      client_id: form.client_id.trim(),
      client_secret: form.client_secret.trim(),
    };
    const { data, error } = await supabase
      .from("pbx_config")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setForm(data as any);
    toast.success("Configuração 3CX salva");
  }

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/3cx-webhook`
      : "/api/public/3cx-webhook";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Integração 3CX (Call Control API)
          </CardTitle>
          <CardDescription>
            Credenciais OAuth2 da sua extensão para discagem automática server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="URL do PBX" placeholder="https://meudominio.3cx.com.br:5001"
                  value={form.pbx_url} onChange={(v) => setForm({ ...form, pbx_url: v })} />
                <Field label="Extensão" placeholder="100"
                  value={form.extension} onChange={(v) => setForm({ ...form, extension: v })} />
                <Field label="Client ID"
                  value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} />
                <Field label="Client Secret" type="password"
                  value={form.client_secret} onChange={(v) => setForm({ ...form, client_secret: v })} />
              </div>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {form.webhook_secret && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook de eventos de chamada</CardTitle>
            <CardDescription>
              Configure no 3CX em <em>Settings → Integrations → Webhooks</em>. Ele atualiza o status da fila em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label>URL</Label>
              <div className="mt-1 flex gap-2">
                <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                <CopyBtn text={webhookUrl} copied={copied} setCopied={setCopied} />
              </div>
            </div>
            <div>
              <Label>Header obrigatório</Label>
              <Input
                readOnly
                value={`X-Webhook-Secret: ${form.webhook_secret}`}
                className="mt-1 font-mono text-xs"
              />
            </div>
            <p className="text-muted-foreground">
              Eventos esperados: <code>Established</code>, <code>Terminated</code> com{" "}
              <code>callid</code>, <code>cause</code> e <code>duration</code>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CopyBtn({ text, copied, setCopied }: { text: string; copied: boolean; setCopied: (b: boolean) => void }) {
  return (
    <Button
      type="button" variant="outline" size="icon"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
