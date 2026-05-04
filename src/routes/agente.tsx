import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/agente")({
  head: () => ({ meta: [{ title: "Agente IA — VoiceLead AI" }] }),
  component: () => (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Agente IA de voz
        </CardTitle>
        <CardDescription>
          Script editável, voz natural em PT-BR e tratamento de objeções.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Configuração de prompts, voz (ElevenLabs/OpenAI) e fluxo de qualificação será implementada na próxima etapa.
      </CardContent>
    </Card>
  ),
});
