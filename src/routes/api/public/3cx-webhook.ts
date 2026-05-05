import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// 3CX Call Control envia eventos como:
// { event: "Established"|"Terminated"|..., callid: "...", duration?: number, cause?: string, secret: "..." }
// Mapeamos para nossos status de fila e disparamos a próxima chamada da campanha.

const payloadSchema = z.object({
  callid: z.union([z.string(), z.number()]).transform(String),
  event: z.string().min(1).max(64),
  duration: z.number().int().nonnegative().optional(),
  cause: z.string().max(120).optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
};

function mapStatus(event: string, cause?: string) {
  const e = event.toLowerCase();
  const c = (cause ?? "").toLowerCase();
  if (e.includes("establish") || e.includes("answered")) return "em_chamada";
  if (e.includes("ringing") || e.includes("dialing")) return "discando";
  if (e.includes("terminat") || e.includes("ended") || e.includes("cleared")) {
    if (c.includes("busy")) return "ocupado";
    if (c.includes("no answer") || c.includes("noanswer") || c.includes("timeout"))
      return "sem_resposta";
    if (c.includes("voicemail") || c.includes("mailbox")) return "caixa_postal";
    return "concluido";
  }
  return null;
}

export const Route = createFileRoute("/api/public/3cx-webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const secret = request.headers.get("x-webhook-secret") ?? "";
        if (!secret) {
          return new Response("missing secret", { status: 401, headers: CORS });
        }
        const raw = await request.text();
        let parsed;
        try {
          parsed = payloadSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("bad payload", { status: 400, headers: CORS });
        }

        // find queue item by call_id; verify secret matches owner's pbx_config.webhook_secret
        const { data: item } = await supabaseAdmin
          .from("call_queue")
          .select("id, user_id, campaign_id, lead_id")
          .eq("call_id", parsed.callid)
          .maybeSingle();
        if (!item) return new Response("not found", { status: 404, headers: CORS });

        const { data: cfg } = await supabaseAdmin
          .from("pbx_config")
          .select("webhook_secret")
          .eq("user_id", item.user_id)
          .maybeSingle();
        if (!cfg || cfg.webhook_secret !== secret) {
          return new Response("invalid secret", { status: 401, headers: CORS });
        }

        const newStatus = mapStatus(parsed.event, parsed.cause);
        if (!newStatus) return new Response("ignored", { headers: CORS });

        const isFinal = ["concluido", "ocupado", "sem_resposta", "caixa_postal"].includes(
          newStatus,
        );

        await supabaseAdmin
          .from("call_queue")
          .update({
            status: newStatus as any,
            resultado: parsed.cause ?? parsed.event,
            duracao_segundos: parsed.duration ?? null,
            finalizada_em: isFinal ? new Date().toISOString() : null,
          })
          .eq("id", item.id);

        if (isFinal) {
          // increment campaign counter
          const { data: c } = await supabaseAdmin
            .from("campaigns")
            .select("total_concluidos, status")
            .eq("id", item.campaign_id)
            .single();
          if (c) {
            await supabaseAdmin
              .from("campaigns")
              .update({ total_concluidos: (c.total_concluidos ?? 0) + 1 })
              .eq("id", item.campaign_id);
          }

          // map lead status
          const leadStatus =
            newStatus === "concluido"
              ? "contatado"
              : newStatus === "caixa_postal"
                ? "caixa_postal"
                : "nao_atendeu";
          await supabaseAdmin
            .from("leads")
            .update({ status: leadStatus as any })
            .eq("id", item.lead_id);

          // trigger next dial if campaign still running
          if (c?.status === "em_andamento") {
            // fire-and-forget by calling dialer logic via internal HTTP would loop — use direct DB + 3CX
            // simplest: mark for client to call dialNext via realtime; or do it inline:
            try {
              const { dialNextForUser } = await import("@/server/dialer.internal.server");
              await dialNextForUser(item.user_id, item.campaign_id);
            } catch (e) {
              console.error("[3cx-webhook] dialNext failed", e);
            }
          }
        }

        return new Response("ok", { headers: CORS });
      },
    },
  },
});
