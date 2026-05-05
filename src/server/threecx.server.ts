// Server-only helpers to talk to a 3CX PBX (Call Control API v18+).
// Uses OAuth2 client_credentials.

type PbxConfig = {
  pbx_url: string;
  extension: string;
  client_id: string;
  client_secret: string;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function normalizeUrl(u: string) {
  return u.replace(/\/+$/, "");
}

export async function getAccessToken(cfg: PbxConfig): Promise<string> {
  const key = `${cfg.pbx_url}|${cfg.client_id}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const url = `${normalizeUrl(cfg.pbx_url)}/connect/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.client_id,
    client_secret: cfg.client_secret,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`3CX auth failed [${res.status}]: ${text}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(key, {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  });
  return json.access_token;
}

export async function originateCall(
  cfg: PbxConfig,
  destination: string,
): Promise<{ callId: string }> {
  const token = await getAccessToken(cfg);
  const url = `${normalizeUrl(cfg.pbx_url)}/callcontrol/${encodeURIComponent(
    cfg.extension,
  )}/makecall`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ destination }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`3CX makecall failed [${res.status}]: ${text}`);
  }
  const json = (await res.json().catch(() => ({}))) as {
    result?: { callid?: string | number };
    callid?: string | number;
  };
  const callId = String(
    json?.result?.callid ?? json?.callid ?? `local-${Date.now()}`,
  );
  return { callId };
}

export async function hangupCall(cfg: PbxConfig, callId: string): Promise<void> {
  const token = await getAccessToken(cfg);
  const url = `${normalizeUrl(cfg.pbx_url)}/callcontrol/${encodeURIComponent(
    cfg.extension,
  )}/participants/${encodeURIComponent(callId)}/drop`;
  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}
