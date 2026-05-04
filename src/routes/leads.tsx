import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  Phone,
  CalendarClock,
  Filter,
  MoreHorizontal,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StatusBadge, ScorePill } from "@/components/StatusBadge";
import { ImportLeadsDialog } from "@/components/ImportLeadsDialog";
import { LeadStatus, statusLabels } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads — VoiceLead AI" }] }),
  component: LeadsPage,
});

type LeadRow = {
  id: string;
  nome: string;
  telefone: string;
  empresa: string | null;
  email: string | null;
  origem: string | null;
  status: LeadStatus;
  score: number;
  tentativas: number;
  ultima_tentativa: string | null;
  campos_extras: Record<string, string>;
};

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "todos">("todos");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id,nome,telefone,empresa,email,origem,status,score,tentativas,ultima_tentativa,campos_extras")
      .order("created_at", { ascending: false })
      .limit(1000);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads((data ?? []) as LeadRow[]);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((l) => {
      const matchQuery =
        !q ||
        l.nome.toLowerCase().includes(q) ||
        (l.empresa ?? "").toLowerCase().includes(q) ||
        l.telefone.includes(query);
      const matchStatus = statusFilter === "todos" || l.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [leads, query, statusFilter]);

  async function deleteLead(id: string) {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead removido");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Importe, filtre e dispare campanhas de qualificação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV/Excel
          </Button>
          <Button
            disabled={!filtered.length}
            onClick={() => toast.success(`Iniciando campanha com ${filtered.length} leads`)}
          >
            <Phone className="mr-2 h-4 w-4" /> Iniciar campanha
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Lista de leads</CardTitle>
              <CardDescription>
                {filtered.length} de {leads.length} leads exibidos
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, empresa ou telefone"
                  className="w-72 pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as LeadStatus | "todos")}
              >
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {(Object.keys(statusLabels) as LeadStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando leads...
            </div>
          ) : leads.length === 0 ? (
            <EmptyState onImport={() => setImportOpen(true)} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Extras</TableHead>
                  <TableHead>Última tentativa</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => {
                  const extrasCount = Object.keys(lead.campos_extras ?? {}).length;
                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">{lead.nome}</div>
                        {lead.email && (
                          <div className="text-xs text-muted-foreground">{lead.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{lead.empresa ?? "—"}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {lead.telefone}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <ScorePill score={lead.score} />
                      </TableCell>
                      <TableCell className="text-center">
                        {extrasCount > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                <Sparkles className="h-3 w-3" /> {extrasCount}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="center" className="w-72 p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Campos personalizados
                              </p>
                              <div className="space-y-1.5 text-sm">
                                {Object.entries(lead.campos_extras).map(([k, v]) => (
                                  <div key={k} className="flex justify-between gap-3 border-b border-dashed pb-1 last:border-0">
                                    <span className="text-muted-foreground">{k}</span>
                                    <span className="text-right font-medium">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.ultima_tentativa
                          ? new Date(lead.ultima_tentativa).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.success(`Discando para ${lead.nome}`)}>
                              <Phone className="mr-2 h-4 w-4" /> Discar agora
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Follow-up agendado")}>
                              <CalendarClock className="mr-2 h-4 w-4" /> Agendar follow-up
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteLead(lead.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      Nenhum lead encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ImportLeadsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={load}
      />
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Upload className="h-7 w-7" />
      </div>
      <div>
        <p className="text-base font-semibold">Nenhum lead cadastrado ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Importe um arquivo CSV ou Excel para começar a qualificar.
        </p>
      </div>
      <Button onClick={onImport}>
        <Upload className="mr-2 h-4 w-4" /> Importar CSV/Excel
      </Button>
      <Badge variant="outline" className="text-xs font-normal">
        Colunas mínimas: nome e telefone
      </Badge>
    </div>
  );
}
