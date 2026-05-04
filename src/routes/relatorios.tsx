import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — VoiceLead AI" }] }),
  component: () => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Relatórios
        </CardTitle>
        <CardDescription>Exportação em PDF/CSV, filtros por período, status e score.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Em breve nesta etapa do projeto.
      </CardContent>
    </Card>
  ),
});
