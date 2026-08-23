import { isSupabaseConfigured, supabase } from "./supabase";

export async function resolveProfileAvatar(value: string): Promise<string> {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) return clean;
  if (!isSupabaseConfigured) return "";

  const response = await supabase.storage
    .from("profile-avatars")
    .createSignedUrl(clean, 60 * 60);

  return response.error ? "" : response.data.signedUrl;
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
