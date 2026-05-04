import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Upload,
  Phone,
  CalendarClock,
  Filter,
  MoreHorizontal,
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
import { StatusBadge, ScorePill } from "@/components/StatusBadge";
import { LeadStatus, mockLeads, statusLabels } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — VoiceLead AI" },
      { name: "description", content: "Gestão completa de leads para qualificação por voz." },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "todos">("todos");

  const filtered = useMemo(() => {
    return mockLeads.filter((l) => {
      const matchQuery =
        !query ||
        l.nome.toLowerCase().includes(query.toLowerCase()) ||
        l.empresa.toLowerCase().includes(query.toLowerCase()) ||
        l.telefone.includes(query);
      const matchStatus = statusFilter === "todos" || l.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [query, statusFilter]);

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
          <Button
            variant="outline"
            onClick={() => toast.info("Em breve: importação de CSV/Excel")}
          >
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={() => toast.success("Iniciando campanha com leads filtrados")}>
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
                {filtered.length} de {mockLeads.length} leads exibidos
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Tentativas</TableHead>
                <TableHead>Última tentativa</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium">{lead.nome}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{lead.empresa}</TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {lead.telefone}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <ScorePill score={lead.score} />
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {lead.tentativas}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.ultimaTentativa
                      ? new Date(lead.ultimaTentativa).toLocaleString("pt-BR", {
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
                        <DropdownMenuItem>Ver histórico</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum lead encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
