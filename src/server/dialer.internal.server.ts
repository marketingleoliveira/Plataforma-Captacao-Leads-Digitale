// Server-only: dial next using admin client (used by the 3CX webhook).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { originateCall } from "./threecx.server";

export async function dialNextForUser(userId: string, campaignId: string) {
  const { data: camp } = await supabaseAdmin
    .from("campaigns")
    .select("status")
    .eq("id", campaignId)
    .single();
  if (!camp || camp.status !== "em_andamento") return;

  const { count } = await supabaseAdmin
    .from("call_queue")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["discando", "em_chamada"]);
  if ((count ?? 0) > 0) return;

  const { data: next } = await supabaseAdmin
    .from("call_queue")
    .select("id, lead_id, leads!inner(telefone)")
    .eq("campaign_id", campaignId)
    .eq("status", "pendente")
    .order("ordem", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) {
    await supabaseAdmin
      .from("campaigns")
      .update({ status: "concluida", finalizada_em: new Date().toISOString() })
      .eq("id", campaignId);
    return;
  }

  const { data: cfg } = await supabaseAdmin
    .from("pbx_config")
    .select("pbx_url, extension, client_id, client_secret")
    .eq("user_id", userId)
    .maybeSingle();
  if (!cfg) return;

  const phone = (next as any).leads.telefone as string;
  try {
    const { callId } = await originateCall(cfg, phone);
    await supabaseAdmin
      .from("call_queue")
      .update({
        status: "discando",
        call_id: callId,
        iniciada_em: new Date().toISOString(),
      })
      .eq("id", next.id);
    await supabaseAdmin
      .from("leads")
      .update({
        status: "contatado",
        ultima_tentativa: new Date().toISOString(),
      })
      .eq("id", next.lead_id);
  } catch (e: any) {
    await supabaseAdmin
      .from("call_queue")
      .update({
        status: "falhou",
        resultado: e.message?.slice(0, 500) ?? "erro",
        finalizada_em: new Date().toISOString(),
      })
      .eq("id", next.id);
  }
}
