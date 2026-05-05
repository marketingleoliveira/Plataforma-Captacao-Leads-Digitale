import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { originateCall, hangupCall } from "./threecx.server";

const createCampaignSchema = z.object({
  nome: z.string().min(1).max(120),
  leadIds: z.array(z.string().uuid()).min(1).max(5000),
});

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createCampaignSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: camp, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        nome: data.nome,
        total_leads: data.leadIds.length,
        status: "rascunho",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const rows = data.leadIds.map((leadId, i) => ({
      user_id: userId,
      campaign_id: camp.id,
      lead_id: leadId,
      ordem: i,
      status: "pendente" as const,
    }));
    const { error: qErr } = await supabase.from("call_queue").insert(rows);
    if (qErr) throw new Error(qErr.message);
    return { campaignId: camp.id };
  });

export const startCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ campaignId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("campaigns")
      .update({ status: "em_andamento", iniciada_em: new Date().toISOString() })
      .eq("id", data.campaignId)
      .eq("user_id", userId);
    return await dialNextInternal(supabase, userId, data.campaignId);
  });

export const pauseCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ campaignId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("campaigns")
      .update({ status: "pausada" })
      .eq("id", data.campaignId)
      .eq("user_id", userId);
    return { ok: true };
  });

export const stopCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ campaignId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // hang up any in-flight call
    const { data: active } = await supabase
      .from("call_queue")
      .select("id, call_id")
      .eq("campaign_id", data.campaignId)
      .in("status", ["discando", "em_chamada"]);
    const cfg = await loadConfig(supabase, userId);
    if (cfg && active) {
      for (const a of active) {
        if (a.call_id) await hangupCall(cfg, a.call_id);
      }
    }
    await supabase
      .from("call_queue")
      .update({ status: "falhou", finalizada_em: new Date().toISOString() })
      .eq("campaign_id", data.campaignId)
      .in("status", ["discando", "em_chamada"]);
    await supabase
      .from("campaigns")
      .update({ status: "cancelada", finalizada_em: new Date().toISOString() })
      .eq("id", data.campaignId)
      .eq("user_id", userId);
    return { ok: true };
  });

export const dialNext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ campaignId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    return await dialNextInternal(context.supabase, context.userId, data.campaignId);
  });

async function loadConfig(supabase: any, userId: string) {
  const { data } = await supabase
    .from("pbx_config")
    .select("pbx_url, extension, client_id, client_secret")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

async function dialNextInternal(supabase: any, userId: string, campaignId: string) {
  // ensure campaign is active
  const { data: camp } = await supabase
    .from("campaigns")
    .select("status")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();
  if (!camp || camp.status !== "em_andamento") {
    return { dialed: false, reason: "campaign_not_running" };
  }

  // ensure no active call
  const { count } = await supabase
    .from("call_queue")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["discando", "em_chamada"]);
  if ((count ?? 0) > 0) return { dialed: false, reason: "call_in_progress" };

  // get next pending item with lead phone
  const { data: next } = await supabase
    .from("call_queue")
    .select("id, lead_id, leads!inner(telefone, nome)")
    .eq("campaign_id", campaignId)
    .eq("status", "pendente")
    .order("ordem", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) {
    await supabase
      .from("campaigns")
      .update({ status: "concluida", finalizada_em: new Date().toISOString() })
      .eq("id", campaignId);
    return { dialed: false, reason: "queue_empty" };
  }

  const cfg = await loadConfig(supabase, userId);
  if (!cfg) throw new Error("3CX não configurado em Configurações");

  const phone = (next as any).leads.telefone as string;
  let callId: string;
  try {
    const r = await originateCall(cfg, phone);
    callId = r.callId;
  } catch (e: any) {
    await supabase
      .from("call_queue")
      .update({
        status: "falhou",
        resultado: e.message?.slice(0, 500) ?? "erro",
        finalizada_em: new Date().toISOString(),
      })
      .eq("id", next.id);
    throw e;
  }

  await supabase
    .from("call_queue")
    .update({
      status: "discando",
      call_id: callId,
      iniciada_em: new Date().toISOString(),
    })
    .eq("id", next.id);

  await supabase
    .from("leads")
    .update({
      status: "contatado",
      ultima_tentativa: new Date().toISOString(),
    })
    .eq("id", next.lead_id);

  return { dialed: true, queueItemId: next.id, callId };
}
