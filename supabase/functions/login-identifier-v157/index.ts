import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

const genericError = "E-mail, CPF, telefone ou senha incorretos.";
const unavailable = "O serviço de login está temporariamente instável. Tente novamente em alguns instantes.";
const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const text = (value: unknown) => String(value ?? "").trim();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function authStatus(error: unknown) {
  const value = Number((error as { status?: unknown } | null)?.status ?? 0);
  return Number.isFinite(value) ? value : 0;
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 12000): Promise<T> {
  return await Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("auth_upstream_timeout")), ms)),
  ]);
}

async function resolveEmail(admin: ReturnType<typeof createClient>, identifier: string) {
  if (identifier.includes("@")) return identifier.trim().toLowerCase();

  const normalized = digits(identifier);
  if (normalized.length < 10 || normalized.length > 11) return "";

  const exact = await admin
    .from("profiles")
    .select("email,cpf,phone")
    .or(`cpf.eq.${normalized},phone.eq.${normalized}`)
    .limit(3);

  if (!exact.error) {
    const matches = (exact.data ?? []).filter((row: any) =>
      digits(row?.cpf) === normalized || digits(row?.phone) === normalized,
    );
    if (matches.length === 1 && text(matches[0]?.email)) return text(matches[0].email).toLowerCase();
    if (matches.length > 1) return "";
  }

  const fallback = await admin.from("profiles").select("email,cpf,phone").limit(500);
  if (fallback.error) throw fallback.error;
  const matches = (fallback.data ?? []).filter((row: any) =>
    digits(row?.cpf) === normalized || digits(row?.phone) === normalized,
  );
  if (matches.length !== 1 || !text(matches[0]?.email)) return "";
  return text(matches[0].email).toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const identifier = text(body?.identifier).slice(0, 180);
    const password = String(body?.password ?? "");
    if (!identifier || !password || password.length > 256) {
      return json({ error: "invalid_credentials", message: genericError }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) {
      console.error("login-identifier-v157 missing Supabase environment");
      return json({ error: "unavailable", message: unavailable }, 503);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let email = "";
    try {
      email = await resolveEmail(admin, identifier);
    } catch (error) {
      console.error("login-identifier-v157 resolve_email", error instanceof Error ? error.message : String(error));
      return json({ error: "unavailable", message: unavailable }, 503);
    }

    if (!email) return json({ error: "invalid_credentials", message: genericError }, 401);

    const auth = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let result: Awaited<ReturnType<typeof auth.auth.signInWithPassword>>;
    try {
      result = await withTimeout(auth.auth.signInWithPassword({ email, password }));
    } catch (error) {
      console.error("login-identifier-v157 auth_upstream", error instanceof Error ? error.message : String(error));
      return json({ error: "auth_unavailable", message: unavailable }, 503);
    }

    const { data, error } = result;
    if (error || !data.session) {
      const status = authStatus(error);
      if (status >= 500 || status === 0) {
        console.error("login-identifier-v157 auth_upstream_status", status || "unknown");
        return json({ error: "auth_unavailable", message: unavailable }, 503);
      }
      console.warn("login-identifier-v157 invalid_credentials", status || "unknown");
      return json({ error: "invalid_credentials", message: genericError }, 401);
    }

    console.info("login-identifier-v157 success");
    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    });
  } catch (error) {
    console.error("login-identifier-v157", error instanceof Error ? error.message : String(error));
    return json({ error: "unavailable", message: unavailable }, 503);
  }
});