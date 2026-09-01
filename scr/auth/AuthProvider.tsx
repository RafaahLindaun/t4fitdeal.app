import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type AppRole = "student" | "professor" | "reception" | "admin";
export type MembershipStatus = "pending" | "active" | "inactive" | "blocked";
export type AppApprovalStatus = "pending" | "approved" | "blocked";

export type AppProfile = {
  id: string;
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  objective: string;
  role: AppRole;
  status: MembershipStatus;
};

export type FirstAccessInput = {
  fullName: string;
  cpf: string;
  email: string;
  password: string;
  phone: string;
  emergencyPhone: string;
  birthDate: string;
  objective: string;
};

type AuthResult = { error?: string; message?: string };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AppProfile | null;
  loading: boolean;
  isTeam: boolean;
  landingPath: string;
  signIn: (identifier: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signUpFirstAccess: (input: FirstAccessInput) => Promise<AuthResult>;
  completeGoogleProfile: (input: Omit<FirstAccessInput, "email" | "password">) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateRecoveredPassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const normalizeDigits = (value: string) => value.replace(/\D/g, "");

function normalizeRole(value: unknown): AppRole {
  const role = String(value ?? "").trim().toLowerCase();
  if (["professor", "teacher", "personal"].includes(role)) return "professor";
  if (["reception", "recepcao"].includes(role)) return "reception";
  if (role === "admin") return "admin";
  return "student";
}

function normalizeStatus(value: unknown, role: AppRole): MembershipStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (["active", "ativo"].includes(status)) return "active";
  if (["inactive", "inativo"].includes(status)) return "inactive";
  if (["blocked", "bloqueado"].includes(status)) return "blocked";
  return role === "student" ? "pending" : "active";
}

function normalizeApprovalStatus(value: unknown): AppApprovalStatus | null {
  const status = String(value ?? "").trim().toLowerCase();
  if (["approved", "active", "ativo"].includes(status)) return "approved";
  if (["blocked", "bloqueado"].includes(status)) return "blocked";
  if (["pending", "pendente"].includes(status)) return "pending";
  return null;
}

function approvalToMembershipStatus(approval: AppApprovalStatus): MembershipStatus {
  if (approval === "approved") return "active";
  if (approval === "blocked") return "blocked";
  return "pending";
}

function normalizeProfile(raw: Record<string, unknown>, user: User): AppProfile {
  const role = normalizeRole(raw.role);
  return {
    id: String(raw.id ?? user.id),
    email: String(raw.email ?? user.email ?? ""),
    fullName: String(raw.full_name ?? raw.nome ?? user.user_metadata?.full_name ?? ""),
    cpf: String(raw.cpf ?? ""),
    phone: String(raw.phone ?? raw.telefone ?? ""),
    emergencyPhone: String(raw.emergency_phone ?? raw.telefone_emergencia ?? ""),
    birthDate: String(raw.birth_date ?? raw.data_nascimento ?? ""),
    objective: String(raw.objective ?? raw.objetivo ?? raw.goal ?? ""),
    role,
    status: normalizeStatus(raw.status, role),
  };
}

function fallbackProfile(user: User): AppProfile {
  const role = normalizeRole(user.app_metadata?.role);
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: String(user.user_metadata?.full_name ?? user.user_metadata?.nome ?? ""),
    cpf: String(user.user_metadata?.cpf ?? ""),
    phone: String(user.user_metadata?.phone ?? ""),
    emergencyPhone: String(user.user_metadata?.emergency_phone ?? ""),
    birthDate: String(user.user_metadata?.birth_date ?? ""),
    objective: String(user.user_metadata?.objective ?? ""),
    role,
    status: normalizeStatus(
      user.user_metadata?.status ?? user.user_metadata?.membership_status ?? user.user_metadata?.app_access_status,
      role,
    ),
  };
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 6500): Promise<T> {
  return await Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function loadCanonicalAccessStatus(userId: string): Promise<AppApprovalStatus | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const rpc = await withTimeout(supabase.rpc("get_my_accqua_access_v4"));
    if (!rpc.error && rpc.data) {
      const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
      const status = normalizeApprovalStatus(
        typeof row === "object" && row !== null ? (row as Record<string, unknown>).status : row,
      );
      if (status) return status;
    }

    const direct = await withTimeout(
      supabase.from("accqua_app_approval").select("status").eq("user_id", userId).maybeSingle(),
    );
    if (!direct.error && direct.data) return normalizeApprovalStatus(direct.data.status);
  } catch {
    return null;
  }
  return null;
}

async function edgeFunctionMessage(error: unknown, fallback: string) {
  const context = (error as { context?: unknown } | null)?.context as
    | { clone?: () => Response; json?: () => Promise<unknown> }
    | undefined;
  try {
    const response = typeof context?.clone === "function" ? context.clone() : context;
    if (response && typeof response.json === "function") {
      const payload = (await response.json()) as { message?: unknown };
      const message = String(payload?.message ?? "").trim();
      if (message) return message;
    }
  } catch {
    // Keep the safe fallback below.
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fallback = fallbackProfile(user);
    if (!isSupabaseConfigured) {
      setProfile(fallback);
      return;
    }

    let resolvedProfile = fallback;
    try {
      const rpcResult = await withTimeout(supabase.rpc("get_my_accqua_profile"));
      if (!rpcResult.error && rpcResult.data && typeof rpcResult.data === "object") {
        const rpcProfile = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;
        if (rpcProfile && typeof rpcProfile === "object") {
          resolvedProfile = normalizeProfile(rpcProfile as Record<string, unknown>, user);
        }
      } else {
        const { data, error } = await withTimeout(
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        );
        if (!error && data) resolvedProfile = normalizeProfile(data as Record<string, unknown>, user);
      }
    } catch {
      resolvedProfile = fallback;
    }

    const approval = await loadCanonicalAccessStatus(user.id);
    setProfile({
      ...resolvedProfile,
      status: approval ? approvalToMembershipStatus(approval) : "pending",
    });
  }, []);

  useEffect(() => {
    let alive = true;
    const boot = async () => {
      try {
        if (!isSupabaseConfigured) return;
        const { data } = await withTimeout(supabase.auth.getSession());
        if (!alive) return;
        setSession(data.session);
        await loadProfile(data.session?.user ?? null);
      } catch {
        if (alive) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    void boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        window.sessionStorage.setItem("accqua:password-recovery", "1");
      }
      setSession(nextSession);
      void loadProfile(nextSession?.user ?? null).finally(() => setLoading(false));
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (identifier: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "O acesso está temporariamente indisponível. Tente novamente em instantes." };
    }

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      return { error: "Preencha seu acesso e sua senha." };
    }

    const { data, error } = await supabase.functions.invoke("login-identifier-v157", {
      body: { identifier: cleanIdentifier, password },
    });

    if (error || !data?.access_token || !data?.refresh_token) {
      return {
        error: await edgeFunctionMessage(
          error,
          String(data?.message ?? "E-mail, CPF, telefone ou senha incorretos."),
        ),
      };
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: String(data.access_token),
      refresh_token: String(data.refresh_token),
    });
    if (sessionError) return { error: "Não foi possível concluir o acesso. Tente novamente." };
    return {};
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "O acesso está temporariamente indisponível. Tente novamente em instantes." };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) return { error: "Não foi possível abrir o login do Google." };
    return {};
  };

  const signUpFirstAccess = async (input: FirstAccessInput): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "O acesso está temporariamente indisponível. Tente novamente em instantes." };
    }

    const metadata = {
      full_name: input.fullName.trim(),
      nome: input.fullName.trim(),
      cpf: normalizeDigits(input.cpf),
      phone: normalizeDigits(input.phone),
      emergency_phone: normalizeDigits(input.emergencyPhone),
      birth_date: input.birthDate,
      objective: input.objective,
      status: "pending",
    };

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: metadata,
      },
    });
    if (error) return { error: error.message };

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: input.email.trim().toLowerCase(),
        full_name: input.fullName.trim(),
        cpf: normalizeDigits(input.cpf),
        phone: normalizeDigits(input.phone),
        emergency_phone: normalizeDigits(input.emergencyPhone),
        birth_date: input.birthDate || null,
        objective: input.objective || null,
      }, { onConflict: "id" });
    }

    return { message: "Cadastro enviado. Um professor, a administração ou a recepção precisa liberar seu acesso." };
  };

  const completeGoogleProfile = async (
    input: Omit<FirstAccessInput, "email" | "password">,
  ): Promise<AuthResult> => {
    const user = session?.user;
    if (!user?.email) return { error: "Sessão do Google não encontrada." };

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: input.fullName.trim(),
      cpf: normalizeDigits(input.cpf),
      phone: normalizeDigits(input.phone),
      emergency_phone: normalizeDigits(input.emergencyPhone),
      birth_date: input.birthDate || null,
      objective: input.objective || null,
    }, { onConflict: "id" });
    if (error) return { error: "Não foi possível salvar seus dados." };
    await loadProfile(user);
    return { message: "Dados salvos. Seu cadastro foi enviado para liberação." };
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!email.includes("@")) return { error: "Digite seu e-mail para recuperar a senha." };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) return { error: "Não foi possível enviar o e-mail de recuperação." };
    return { message: "Enviamos o link de recuperação para seu e-mail." };
  };

  const updateRecoveredPassword = async (password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "O acesso está temporariamente indisponível. Tente novamente em instantes." };
    }
    if (password.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: "Não foi possível atualizar sua senha. Abra novamente o link recebido por e-mail." };
    window.sessionStorage.removeItem("accqua:password-recovery");
    return { message: "Senha alterada com sucesso." };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.sessionStorage.removeItem("accqua:password-recovery");
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile(session?.user ?? null);
  };

  const user = session?.user ?? null;
  const isTeam = Boolean(profile && ["professor", "reception", "admin"].includes(profile.role));
  const landingPath = !user
    ? "/login"
    : profile?.status === "active"
      ? "/menu-teste"
      : "/aguardando";

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    profile,
    loading,
    isTeam,
    landingPath,
    signIn,
    signInWithGoogle,
    signUpFirstAccess,
    completeGoogleProfile,
    resetPassword,
    updateRecoveredPassword,
    signOut,
    refreshProfile,
  }), [session, user, profile, loading, isTeam, landingPath]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider.");
  return context;
}
