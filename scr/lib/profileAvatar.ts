import { isSupabaseConfigured, supabase } from "./supabase";

type AvatarCacheEntry = {
  url: string;
  expiresAt: number;
};

// A URL assinada muda a cada chamada. Sem cache, qualquer refetch da lista de
// alunos troca o src de todas as fotos e o navegador pisca/rebaixa cada imagem.
// Mantemos a mesma URL por 50 min, abaixo da validade de 60 min do Storage.
const SIGNED_URL_TTL_MS = 50 * 60 * 1000;
const avatarUrlCache = new Map<string, AvatarCacheEntry>();
const avatarInFlight = new Map<string, Promise<string>>();

export async function resolveProfileAvatar(value: string): Promise<string> {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) return clean;
  if (!isSupabaseConfigured) return "";

  const cached = avatarUrlCache.get(clean);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const pending = avatarInFlight.get(clean);
  if (pending) return pending;

  const request = (async () => {
    const response = await supabase.storage
      .from("profile-avatars")
      .createSignedUrl(clean, 60 * 60);

    const url = response.error ? "" : response.data.signedUrl;
    if (url) {
      avatarUrlCache.set(clean, {
        url,
        expiresAt: Date.now() + SIGNED_URL_TTL_MS,
      });
    }
    return url;
  })().finally(() => {
    avatarInFlight.delete(clean);
  });

  avatarInFlight.set(clean, request);
  return request;
}

export function invalidateProfileAvatarCache(value?: string) {
  const clean = String(value ?? "").trim();
  if (clean) {
    avatarUrlCache.delete(clean);
    avatarInFlight.delete(clean);
    return;
  }
  avatarUrlCache.clear();
  avatarInFlight.clear();
}

export async function loadResolvedAvatarsByUserIds(
  userIds: string[],
): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  const resolved = new Map<string, string>();
  if (!isSupabaseConfigured || !ids.length) return resolved;

  let rows: Array<{ user_id?: string; id?: string; avatar_url?: string }> = [];

  const rpc = await supabase.rpc("get_accqua_people_avatars_v8_9", {
    p_user_ids: ids,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    rows = rpc.data as Array<{ user_id?: string; id?: string; avatar_url?: string }>;
  } else {
    const direct = await supabase
      .from("profiles")
      .select("id,avatar_url")
      .in("id", ids);

    if (!direct.error && Array.isArray(direct.data)) {
      rows = direct.data.map((row) => ({
        user_id: String(row.id ?? ""),
        avatar_url: String(row.avatar_url ?? ""),
      }));
    }
  }

  await Promise.all(
    rows.map(async (row) => {
      const userId = String(row.user_id ?? row.id ?? "");
      if (!userId) return;
      const url = await resolveProfileAvatar(String(row.avatar_url ?? ""));
      if (url) resolved.set(userId, url);
    }),
  );

  return resolved;
}
