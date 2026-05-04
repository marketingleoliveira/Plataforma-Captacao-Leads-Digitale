import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/discagem")({
  head: () => ({ meta: [{ title: "Discagem — VoiceLead AI" }] }),
  component: () => <Placeholder title="Discagem automática" desc="Conexão com 3CX, fila sequencial e chamadas ao vivo." />,
});

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Este módulo será conectado ao 3CX e à IA conversacional na próxima etapa.
      </CardContent>
    </Card>
  );
}
