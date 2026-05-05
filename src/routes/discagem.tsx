import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PhoneCall, Play, Pause, Square, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  createCampaign,
  startCampaign,
  pauseCampaign,
  stopCampaign,
  dialNext,
} from "@/server/dialer.functions";

export const Route = createFileRoute("/discagem")({
  head: () => ({ meta: [{ title: "Discagem — VoiceLead AI" }] }),
  component: DiscagemPage,
});

type Campaign = {
  id: string;
  nome: string;
  status: string;
  total_leads: number;
  total_concluidos: number;
};

type QueueItem = {
  id: string;
  status: string;
  ordem: number;
  resultado: string | null;
  call_id: string | null;
  leads: { nome: string; telefone: string } | null;
};

const queueLabels: Record<string, { label: string; tone: string }> = {
  pendente: { label: "Pendente", tone: "bg-muted text-foreground" },
  discando: { label: "Discando", tone: "bg-blue-500/15 text-blue-600" },
  em_chamada: { label: "Em chamada", tone: "bg-emerald-500/15 text-emerald-600" },
  concluido: { label: "Concluído", tone: "bg-emerald-500/15 text-emerald-600" },
  sem_resposta: { label: "Sem resposta", tone: "bg-amber-500/15 text-amber-600" },
  ocupado: { label: "Ocupado", tone: "bg-amber-500/15 text-amber-600" },
  caixa_postal: { label: "Caixa postal", tone: "bg-violet-500/15 text-violet-600" },
  falhou: { label: "Falhou", tone: "bg-destructive/15 text-destructive" },
};

function DiscagemPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");

  async function loadCampaigns() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, nome, status, total_leads, total_concluidos")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return toast.error(error.message);
    setCampaigns((data ?? []) as Campaign[]);
    if (!activeId && data?.length) setActiveId(data[0].id);
    setLoading(false);
  }

  async function loadQueue(id: string) {
    const { data } = await supabase
      .from("call_queue")
      .select("id, status, ordem, resultado, call_id, leads(nome, telefone)")
      .eq("campaign_id", id)
      .order("ordem", { ascending: true });
    setQueue((data ?? []) as any);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadQueue(activeId);
    const ch = supabase
      .channel(`queue-${activeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_queue", filter: `campaign_id=eq.${activeId}` },
        () => loadQueue(activeId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns", filter: `id=eq.${activeId}` },
        () => loadCampaigns(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId]);

  async function handleCreate() {
    if (!newName.trim()) return toast.error("Dê um nome à campanha");
    setCreating(true);
    const { data: leads, error } = await supabase
      .from("leads")
      .select("id")
      .in("status", ["novo", "nao_atendeu"])
      .limit(500);
    if (error || !leads?.length) {
      setCreating(false);
      return toast.error(error?.message ?? "Nenhum lead disponível para discar");
    }
    try {
      const r = await createCampaign({
        data: { nome: newName.trim(), leadIds: leads.map((l) => l.id) },
      });
      toast.success(`Campanha criada com ${leads.length} leads`);
      setNewName("");
      setActiveId(r.campaignId);
      await loadCampaigns();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function action(fn: () => Promise<any>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const active = campaigns.find((c) => c.id === activeId);
  const counts = useMemo(() => {
    const c = { pendente: 0, ativos: 0, concluido: 0, falhou: 0 };
    for (const q of queue) {
      if (q.status === "pendente") c.pendente++;
      else if (["discando", "em_chamada"].includes(q.status)) c.ativos++;
      else if (["concluido", "ocupado", "sem_resposta", "caixa_postal"].includes(q.status)) c.concluido++;
      else c.falhou++;
    }
    return c;
  }, [queue]);
  const progress = active?.total_leads
    ? Math.round((counts.concluido / active.total_leads) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discagem automática</h1>
          <p className="text-sm text-muted-foreground">
            Campanhas sequenciais via 3CX Call Control API.
          </p>
        </div>
        <Link to="/configuracoes" className="text-sm text-primary hover:underline">
          Configurar 3CX →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova campanha</CardTitle>
          <CardDescription>
            Cria uma fila com todos os leads novos e não atendidos (até 500).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <Label>Nome</Label>
            <Input
              className="mt-1"
              placeholder="Ex: Campanha Outubro"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Criar campanha
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma campanha criada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campanhas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    activeId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium truncate">{c.nome}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {c.status.replace("_", " ")} · {c.total_concluidos}/{c.total_leads}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-primary" /> {active?.nome}
                  </CardTitle>
                  <CardDescription className="capitalize">
                    Status: {active?.status?.replace("_", " ")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {active?.status !== "em_andamento" && (
                    <Button
                      size="sm"
                      disabled={busy || !activeId}
                      onClick={() =>
                        action(() => startCampaign({ data: { campaignId: activeId! } }), "Campanha iniciada")
                      }
                    >
                      <Play className="mr-1.5 h-4 w-4" /> Iniciar
                    </Button>
                  )}
                  {active?.status === "em_andamento" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          action(() => dialNext({ data: { campaignId: activeId! } }), "Próximo lead chamado")
                        }
                      >
                        Próximo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          action(() => pauseCampaign({ data: { campaignId: activeId! } }), "Campanha pausada")
                        }
                      >
                        <Pause className="mr-1.5 h-4 w-4" /> Pausar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy || !activeId}
                    onClick={() =>
                      action(() => stopCampaign({ data: { campaignId: activeId! } }), "Campanha encerrada")
                    }
                  >
                    <Square className="mr-1.5 h-4 w-4" /> Parar
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                <Stat label="Pendentes" value={counts.pendente} />
                <Stat label="Ativos" value={counts.ativos} />
                <Stat label="Concluídos" value={counts.concluido} />
                <Stat label="Falhas" value={counts.falhou} />
              </div>
              <Progress value={progress} className="mt-3 h-2" />
            </CardHeader>
            <CardContent className="max-h-[520px] overflow-auto p-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/40">
                  <tr className="text-left">
                    <th className="px-4 py-2 w-12">#</th>
                    <th className="px-4 py-2">Lead</th>
                    <th className="px-4 py-2">Telefone</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((q) => {
                    const s = queueLabels[q.status] ?? { label: q.status, tone: "" };
                    return (
                      <tr key={q.id} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{q.ordem + 1}</td>
                        <td className="px-4 py-2">{q.leads?.nome ?? "—"}</td>
                        <td className="px-4 py-2 font-mono text-xs">{q.leads?.telefone}</td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className={`border-0 ${s.tone}`}>{s.label}</Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{q.resultado ?? "—"}</td>
                      </tr>
                    );
                  })}
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        Fila vazia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-2 py-2">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
