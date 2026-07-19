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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeDigits = (value: string) => value.replace(/\D/g, "");
function roleFromEmail(email?: string | null): AppRole | null {
  const normalized = String(email ?? "").trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";

  if (domain.includes("professor") || domain.includes("personal")) {
    return "professor";
  }
  if (
    domain.includes("recepcao") ||
    domain.includes("reception") ||
    domain.includes("atendimento")
  ) {
    return "reception";
  }
  if (domain.includes("admin")) return "admin";
  return null;
}

function normalizeRole(value: unknown, email?: string | null): AppRole {
  const role = String(value ?? "").toLowerCase();
  if (role === "professor" || role === "teacher" || role === "personal") {
    return "professor";
  }
  if (role === "reception" || role === "recepcao") return "reception";
  if (role === "admin") return "admin";
  return roleFromEmail(email) ?? "student";
}

function normalizeStatus(value: unknown, role: AppRole): MembershipStatus {
  const status = String(value ?? "").toLowerCase();
  if (status === "active" || status === "ativo") return "active";
  if (status === "inactive" || status === "inativo") return "inactive";
  if (status === "blocked" || status === "bloqueado") return "blocked";
  if (role !== "student") return "active";
  return "pending";
}

function normalizeProfile(raw: Record<string, unknown>, user: User): AppProfile {
  const email = String(raw.email ?? user.email ?? "");
  const role = normalizeRole(raw.role, email);
  return {
    id: String(raw.id ?? user.id),
    email,
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
  const email = user.email ?? "";
  const role = normalizeRole(user.user_metadata?.role, email);
  return {
    id: user.id,
    email,
    fullName: String(user.user_metadata?.full_name ?? user.user_metadata?.nome ?? ""),
    cpf: String(user.user_metadata?.cpf ?? ""),
    phone: String(user.user_metadata?.phone ?? ""),
    emergencyPhone: String(user.user_metadata?.emergency_phone ?? ""),
    birthDate: String(user.user_metadata?.birth_date ?? ""),
    objective: String(user.user_metadata?.objective ?? ""),
    role,
    status: normalizeStatus(user.user_metadata?.status, role),
  };
}

function profileIsComplete(profile: AppProfile | null) {
  return Boolean(
    profile?.fullName &&
      profile.cpf &&
      profile.phone &&
      profile.emergencyPhone,
  );
}

async function withTimeout<T>(promise: Promise<T>, ms = 6500): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      window.setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
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

    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      );
      if (error || !data) {
        setProfile(fallback);
        return;
      }
      setProfile(normalizeProfile(data as Record<string, unknown>, user));
    } catch {
      setProfile(fallback);
    }
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

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession?.user ?? null).finally(() => setLoading(false));
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const resolveEmail = async (identifier: string) => {
    const clean = identifier.trim();
    if (clean.includes("@")) return clean.toLowerCase();
    const digits = normalizeDigits(clean);
    if (!digits || !isSupabaseConfigured) return "";

    const { data } = await supabase
      .from("profiles")
      .select("email")
      .or(`cpf.eq.${digits},phone.eq.${digits}`)
      .maybeSingle();

    return String(data?.email ?? "").toLowerCase();
  };

  const signIn = async (identifier: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "As variáveis do Supabase não estão configuradas." };
    }
    const email = await resolveEmail(identifier);
    if (!email) {
      return { error: "Não encontrei seu cadastro. Confira os dados ou fale com a recepção." };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "E-mail, CPF, telefone ou senha incorretos." };
    return {};
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "As variáveis do Supabase não estão configuradas." };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/menu-teste` },
    });
    if (error) return { error: "Não foi possível abrir o login do Google." };
    return {};
  };

  const signUpFirstAccess = async (input: FirstAccessInput): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return { error: "As variáveis do Supabase não estão configuradas." };
    }

    const requestedRole = roleFromEmail(input.email) ?? "student";
    const isTeamAccount = requestedRole !== "student";
    const metadata = {
      full_name: input.fullName.trim(),
      nome: input.fullName.trim(),
      cpf: normalizeDigits(input.cpf),
      phone: normalizeDigits(input.phone),
      emergency_phone: normalizeDigits(input.emergencyPhone),
      birth_date: input.birthDate,
      objective: input.objective,
      requested_role: requestedRole,
      role: requestedRole,
      status: isTeamAccount ? "active" : "pending",
    };

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/menu-teste`,
        data: metadata,
      },
    });

    if (error) return { error: error.message };

    if (data.user) {
      const baseProfile = {
        id: data.user.id,
        email: input.email.trim().toLowerCase(),
        full_name: input.fullName.trim(),
        cpf: normalizeDigits(input.cpf),
        phone: normalizeDigits(input.phone),
        emergency_phone: normalizeDigits(input.emergencyPhone),
        birth_date: input.birthDate || null,
        objective: input.objective || null,
      };

      // Mantém compatibilidade com o Supabase já configurado. Se as políticas
      // não permitirem inserir diretamente, o trigger criado nas migrações
      // continua sendo a fonte oficial do perfil.
      await supabase.from("profiles").upsert(baseProfile, { onConflict: "id" });
    }

    return {
      message: isTeamAccount
        ? "Conta da equipe criada. Confirme o e-mail e entre no aplicativo."
        : "Cadastro enviado. A recepção ou o professor precisa liberar seu acesso.",
    };
  };

  const completeGoogleProfile = async (
    input: Omit<FirstAccessInput, "email" | "password">,
  ): Promise<AuthResult> => {
    const user = session?.user;
    if (!user?.email) return { error: "Sessão do Google não encontrada." };

    const payload = {
      id: user.id,
      email: user.email,
      full_name: input.fullName.trim(),
      cpf: normalizeDigits(input.cpf),
      phone: normalizeDigits(input.phone),
      emergency_phone: normalizeDigits(input.emergencyPhone),
      birth_date: input.birthDate || null,
      objective: input.objective || null,
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) return { error: "Não foi possível salvar seus dados." };
    await loadProfile(user);
    return { message: "Dados salvos. Seu cadastro foi enviado para liberação." };
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!email.includes("@")) return { error: "Digite seu e-mail para recuperar a senha." };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { error: "Não foi possível enviar o e-mail de recuperação." };
    return { message: "Enviamos o link de recuperação para seu e-mail." };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
    : isTeam
      ? "/menu-teste"
      : !profileIsComplete(profile)
        ? "/completar-cadastro"
        : profile?.status === "active"
          ? "/menu-teste"
          : "/aguardando";

  const value = useMemo<AuthContextValue>(
    () => ({
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
      signOut,
      refreshProfile,
    }),
    [session, user, profile, loading, isTeam, landingPath],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider.");
  return context;
}
