import { supabase } from "./supabase";

export type CheckinProvider = {
  id: string;
  name: string;
  logoUrl: string;
  deepLinkScheme: string;
  fallbackUrl: string;
  active: boolean;
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? "").trim();

export async function loadCheckinProviders(): Promise<CheckinProvider[]> {
  const { data, error } = await supabase
    .from("checkin_providers")
    .select("id,nome,logo_url,deep_link_scheme,fallback_url,ativo")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => ({
    id: text(row.id),
    name: text(row.nome),
    logoUrl: text(row.logo_url),
    deepLinkScheme: text(row.deep_link_scheme),
    fallbackUrl: text(row.fallback_url),
    active: row.ativo !== false,
  }));
}

const BLOCKED_SCHEME = /^(?:javascript|data|vbscript):/i;
const HTTP_URL = /^https?:\/\//i;

function safeDeepLink(value: string) {
  const url = value.trim();
  if (!url || BLOCKED_SCHEME.test(url)) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : "";
}

function safeFallback(value: string) {
  const url = value.trim();
  return HTTP_URL.test(url) ? url : "";
}

/**
 * Abre o app do benefício quando existe um deep link configurado.
 * Nenhum scheme é hardcoded: a configuração vem de checkin_providers.
 * Se não houver scheme (ou o app não assumir o foco), usa o fallback HTTPS.
 */
export function openCheckinProvider(provider: CheckinProvider) {
  const deepLink = safeDeepLink(provider.deepLinkScheme);
  const fallback = safeFallback(provider.fallbackUrl);

  if (!deepLink) {
    if (fallback) {
      window.location.assign(fallback);
      return { mode: "fallback" as const };
    }
    throw new Error("checkin_provider_not_configured");
  }

  const startedAt = Date.now();
  let pageHidden = document.visibilityState === "hidden";
  const onVisibility = () => {
    if (document.visibilityState === "hidden") pageHidden = true;
  };
  document.addEventListener("visibilitychange", onVisibility, { passive: true });

  window.location.href = deepLink;
  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    if (!fallback || pageHidden || document.visibilityState !== "visible") return;
    if (Date.now() - startedAt < 2_300) window.location.assign(fallback);
  }, 1_500);

  return { mode: "deep-link" as const };
}
