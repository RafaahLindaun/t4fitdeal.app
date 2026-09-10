import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const OWNER_EMAIL = "rafaalexandrowitch@professor.com";
const STAFF_DOMAINS: Record<string, string> = {
  professor: "professor.com",
  admin: "admin.com",
  reception: "recepcao.com",
};

const text = (value: unknown) => String(value ?? "").trim();

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: cors });
}

function normalizeUsername(value: unknown) {
  return text(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 40);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!url || !anon || !service) return response({ error: "server_config_missing" }, 500);

  try {
    const auth = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user) return response({ error: "unauthorized" }, 401);

    const callerEmail = text(authData.user.email).toLowerCase();
    if (callerEmail !== OWNER_EMAIL) return response({ error: "owner_only" }, 403);

    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Double-check the owner against the canonical Auth record before using service privileges.
    const { data: ownerRecord, error: ownerError } = await admin.auth.admin.getUserById(authData.user.id);
    if (
      ownerError ||
      !ownerRecord.user ||
      text(ownerRecord.user.email).toLowerCase() !== OWNER_EMAIL
    ) {
      return response({ error: "owner_only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = text(body?.action || "create").toLowerCase();

    if (action === "list") {
      const { data, error } = await admin
        .from("profiles")
        .select("id,email,full_name,role,status,created_at")
        .in("role", ["professor", "admin", "reception"])
        .order("full_name", { ascending: true });
      if (error) throw error;
      return response({
        staff: (data ?? []).map((row: any) => ({
          id: row.id,
          email: text(row.email),
          fullName: text(row.full_name) || "Equipe ACCQUA",
          role: text(row.role),
          status: text(row.status),
          createdAt: row.created_at ?? null,
          owner: text(row.email).toLowerCase() === OWNER_EMAIL,
        })),
      });
    }

    if (action !== "create") return response({ error: "invalid_action" }, 400);

    const role = text(body?.role).toLowerCase();
    const domain = STAFF_DOMAINS[role];
    const fullName = text(body?.fullName).replace(/\s+/g, " ").slice(0, 80);
    const username = normalizeUsername(body?.username);
    const password = text(body?.password);

    if (!domain || !["professor", "admin", "reception"].includes(role)) {
      return response({ error: "invalid_role", message: "Selecione Professor, Administração ou Recepção." }, 400);
    }
    if (fullName.length < 2) {
      return response({ error: "invalid_name", message: "Informe o nome do membro da equipe." }, 400);
    }
    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) {
      return response({ error: "invalid_username", message: "Use um usuário com 3 a 40 caracteres, sem espaços ou acentos." }, 400);
    }
    if (password.length < 8) {
      return response({ error: "weak_password", message: "A senha precisa ter pelo menos 8 caracteres." }, 400);
    }

    const email = `${username}@${domain}`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        nome: fullName,
        status: "active",
        created_by_owner: true,
      },
    });

    if (createError || !created.user) {
      const message = text(createError?.message).toLowerCase();
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        return response({ error: "email_exists", message: `${email} já está cadastrado.` }, 409);
      }
      console.error("owner-create-staff createUser", createError?.message ?? "unknown");
      return response({ error: "create_auth_failed", message: "Não foi possível criar essa conta agora." }, 500);
    }

    const newUserId = created.user.id;
    try {
      const now = new Date().toISOString();
      const { error: profileError } = await admin.from("profiles").upsert({
        id: newUserId,
        email,
        full_name: fullName,
        nome: fullName,
        role,
        status: "active",
        provider: "email",
        onboarded: true,
        access_mode: "staff_owner_created",
        access_updated_at: now,
        access_updated_by: authData.user.id,
      }, { onConflict: "id" });
      if (profileError) throw profileError;

      const { error: approvalError } = await admin.from("accqua_app_approval").upsert({
        user_id: newUserId,
        status: "approved",
        approved_by: authData.user.id,
        approved_at: now,
        updated_at: now,
      }, { onConflict: "user_id" });
      if (approvalError) throw approvalError;

      const { error: metadataError } = await admin.auth.admin.updateUserById(newUserId, {
        app_metadata: { role },
        user_metadata: {
          full_name: fullName,
          nome: fullName,
          status: "active",
          created_by_owner: true,
        },
      });
      if (metadataError) throw metadataError;

      const { error: auditError } = await admin.from("accqua_staff_account_audit").insert({
        action: "create",
        created_by: authData.user.id,
        target_user_id: newUserId,
        target_email: email,
        target_role: role,
      });
      if (auditError) throw auditError;

      return response({
        success: true,
        staff: {
          id: newUserId,
          fullName,
          email,
          role,
          status: "active",
        },
      }, 201);
    } catch (error) {
      console.error("owner-create-staff provisioning", error instanceof Error ? error.message : String(error));
      await admin.auth.admin.deleteUser(newUserId).catch(() => undefined);
      return response({ error: "provision_failed", message: "A conta não foi concluída e foi revertida. Tente novamente." }, 500);
    }
  } catch (error) {
    console.error("owner-create-staff", error instanceof Error ? error.message : String(error));
    return response({ error: "unexpected_failure", message: "Não foi possível concluir a operação." }, 500);
  }
});
