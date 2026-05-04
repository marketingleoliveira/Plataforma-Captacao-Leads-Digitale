import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  PhoneCall,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dailyCallStats, mockLeads } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — VoiceLead AI" },
      { name: "description", content: "Métricas em tempo real da operação de qualificação por voz." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const total = mockLeads.length;
  const qualificados = mockLeads.filter((l) => l.status === "qualificado").length;
  const naoQualificados = mockLeads.filter((l) => l.status === "nao_qualificado").length;
  const ligacoes = mockLeads.reduce((s, l) => s + l.tentativas, 0);
  const taxa = ligacoes ? Math.round((qualificados / ligacoes) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a operação do agente virtual em tempo real.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total de leads" value={total} icon={Users} trend="+12 esta semana" />
        <MetricCard label="Ligações" value={ligacoes} icon={PhoneCall} tone="primary" trend="Últimos 7 dias" />
        <MetricCard label="Qualificados" value={qualificados} icon={CheckCircle2} tone="success" />
        <MetricCard label="Não qualificados" value={naoQualificados} icon={XCircle} tone="destructive" />
        <MetricCard label="Taxa de conversão" value={`${taxa}%`} icon={TrendingUp} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Desempenho semanal</CardTitle>
            <CardDescription>Ligações realizadas vs leads qualificados</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCallStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ligacoes" name="Ligações" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="qualificados" name="Qualificados" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filas de discagem</CardTitle>
            <CardDescription>Status das chamadas em curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <QueueRow label="Pendentes" value={48} total={120} tone="bg-primary" />
            <QueueRow label="Em andamento" value={6} total={120} tone="bg-warning" />
            <QueueRow label="Concluídas" value={66} total={120} tone="bg-success" />
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Agente IA ativo
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Discando: <span className="font-medium text-foreground">Carlos Eduardo Lima</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência de conversão</CardTitle>
          <CardDescription>Qualificações ao longo da semana</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyCallStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="qualificados"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-primary)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function QueueRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}/{total}</span>
      </div>
      <Progress value={pct} className="h-2" indicatorClassName={tone} />
    </div>
  );
}
