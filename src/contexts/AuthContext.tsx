import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseReady } from "../lib/supabase";
import { getProfile, normalizeProfile, upsertProfile } from "../lib/data";
import type { Profile } from "../types";

interface FirstAccessData {
  full_name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  emergency_phone: string;
  birth_date?: string;
  goal?: string;
  current_weight?: number | null;
  height_cm?: number | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signUpFirstAccess: (data: FirstAccessData) => Promise<{ error?: string; success?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isTeam: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_TIMEOUT_MS = 6500;

function withTimeout<T>(promise: Promise<T>, milliseconds = AUTH_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("AUTH_TIMEOUT")), milliseconds);
    }),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fallbackProfile = (nextUser: User): Profile =>
    normalizeProfile({
      id: nextUser.id,
      email: nextUser.email,
      full_name:
        nextUser.user_metadata?.full_name ||
        nextUser.user_metadata?.nome ||
        nextUser.email?.split("@")[0] ||
        "Aluno Accqua",
      role: nextUser.email?.toLowerCase().endsWith("@professor.com") ? "professor" : "aluno",
      status: nextUser.email?.toLowerCase().endsWith("@professor.com") ? "active" : "pending",
    });

  const loadProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    try {
      const dbProfile = await withTimeout(getProfile(nextUser.id));
      setProfile(dbProfile || fallbackProfile(nextUser));
    } catch (error) {
      console.warn("Não foi possível carregar o perfil dentro do tempo esperado.", error);
      setProfile(fallbackProfile(nextUser));
    }
  };

  const applySession = async (nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null;
    setSession(nextSession);
    setUser(nextUser);
    await loadProfile(nextUser);
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        if (!isSupabaseReady) {
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          return;
        }

        const response = await withTimeout(supabase.auth.getSession());
        if (!mounted) return;
        await applySession(response.data.session);
      } catch (error) {
        console.error("Falha ao iniciar a autenticação. O app seguirá para o login.", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void (async () => {
        try {
          await applySession(nextSession);
        } catch (error) {
          console.error("Falha ao atualizar a sessão.", error);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady) return { error: "Configure o Supabase para entrar." };

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),
      );
      if (error) return { error: "E-mail ou senha inválidos." };
      return {};
    } catch {
      return { error: "O login demorou demais. Tente novamente." };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseReady) return { error: "Configure o Supabase para usar o Google." };

    const redirectTo = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) return { error: "Falha no login com Google." };
    return {};
  };

  const signUpFirstAccess = async (data: FirstAccessData) => {
    if (!isSupabaseReady) return { error: "Configure o Supabase antes de cadastrar." };

    const normalizedEmail = data.email.trim().toLowerCase();
    const role = normalizedEmail.endsWith("@professor.com") ? "professor" : "aluno";
    const status = role === "professor" ? "active" : "pending";

    try {
      const { data: authData, error } = await withTimeout(
        supabase.auth.signUp({
          email: normalizedEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              nome: data.full_name,
              cpf: data.cpf,
              phone: data.phone,
              emergency_phone: data.emergency_phone,
              goal: data.goal,
            },
            emailRedirectTo: `${window.location.origin}/home`,
          },
        }),
      );

      if (error) return { error: error.message };

      const id = authData.user?.id;
      if (id) {
        await withTimeout(
          upsertProfile({
            id,
            email: normalizedEmail,
            full_name: data.full_name,
            cpf: data.cpf,
            phone: data.phone,
            emergency_phone: data.emergency_phone,
            birth_date: data.birth_date,
            goal: data.goal,
            current_weight: data.current_weight,
            height_cm: data.height_cm,
            role,
            status,
            diet_active: false,
          }),
        );
      }

      return {
        success:
          role === "professor"
            ? "Conta criada. Faça login para acessar a área de professor."
            : "Cadastro enviado. Aguarde a liberação da recepção.",
      };
    } catch {
      return { error: "O cadastro demorou demais. Tente novamente." };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseReady) await withTimeout(supabase.auth.signOut(), 4000);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    await loadProfile(user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signUpFirstAccess,
      signOut,
      refreshProfile,
      isTeam: profile ? ["professor", "recepcao", "admin"].includes(profile.role) : false,
    }),
    [user, session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
