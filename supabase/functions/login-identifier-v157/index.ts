import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const genericError = "E-mail, CPF, telefone ou senha incorretos.";
const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const text = (value: unknown) => String(value ?? "").trim();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
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
      return json({ error: "unavailable", message: "O acesso está temporariamente indisponível. Tente novamente em instantes." }, 503);
    }

    let email = "";
    if (identifier.includes("@")) {
      email = identifier.toLowerCase();
    } else {
      const normalized = digits(identifier);
      if (normalized.length < 10 || normalized.length > 11) {
        return json({ error: "invalid_credentials", message: genericError }, 401);
      }

      const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await admin
        .from("profiles")
        .select("email")
        .or(`cpf.eq.${normalized},phone.eq.${normalized}`)
        .limit(2);

      if (error) {
        console.error("login-identifier-v157 profile lookup", error.code, error.message);
        return json({ error: "unavailable", message: "O acesso está temporariamente indisponível. Tente novamente em instantes." }, 503);
      }

      if (!data || data.length !== 1 || !text(data[0]?.email)) {
        return json({ error: "invalid_credentials", message: genericError }, 401);
      }
      email = text(data[0].email).toLowerCase();
    }

    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await auth.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return json({ error: "invalid_credentials", message: genericError }, 401);
    }

    // Never return the resolved e-mail/profile. Only the session Supabase Auth
    // would have returned after valid credentials.
    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    });
  } catch (error) {
    console.error("login-identifier-v157", error instanceof Error ? error.message : String(error));
    return json({ error: "unavailable", message: "O acesso está temporariamente indisponível. Tente novamente em instantes." }, 503);
  }
});
