import { Badge } from "@/components/ui/badge";
import { LeadStatus, statusLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<LeadStatus, string> = {
  novo: "bg-accent text-accent-foreground border-transparent",
  contatado: "bg-primary/10 text-primary border-primary/20",
  qualificado: "bg-success/15 text-success border-success/30",
  nao_qualificado: "bg-destructive/10 text-destructive border-destructive/20",
  nao_atendeu: "bg-warning/20 text-warning-foreground border-warning/30",
  caixa_postal: "bg-muted text-muted-foreground border-transparent",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-success/15 text-success"
      : score >= 40
      ? "bg-warning/20 text-warning-foreground"
      : score > 0
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold tabular-nums",
        tone,
      )}
    >
      {score || "—"}
    </span>
  );
}
