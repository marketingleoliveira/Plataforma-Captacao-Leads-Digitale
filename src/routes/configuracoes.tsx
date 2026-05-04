import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — VoiceLead AI" }] }),
  component: () => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> Configurações
        </CardTitle>
        <CardDescription>3CX, integrações, usuários e webhooks.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Disponível na próxima etapa.
      </CardContent>
    </Card>
  ),
});
