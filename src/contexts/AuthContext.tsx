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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }
    const dbProfile = await getProfile(nextUser.id);
    if (dbProfile) {
      setProfile(dbProfile);
      return;
    }
    const fallback = normalizeProfile({
      id: nextUser.id,
      email: nextUser.email,
      full_name: nextUser.user_metadata?.full_name || nextUser.user_metadata?.nome || nextUser.email?.split("@")[0],
      role: nextUser.email?.endsWith("@professor.com") ? "professor" : "aluno",
      status: nextUser.email?.endsWith("@professor.com") ? "active" : "pending",
    });
    setProfile(fallback);
  };

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      if (!isSupabaseReady) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadProfile(data.session?.user ?? null);
      setLoading(false);
    };
    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      await loadProfile(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady) return { error: "Configure o Supabase para logar de verdade." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "E-mail ou senha inválidos." };
    return {};
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseReady) return { error: "Configure o Supabase para usar o Google." };
    const redirectTo = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) return { error: "Falha no login com Google." };
    return {};
  };

  const signUpFirstAccess = async (data: FirstAccessData) => {
    if (!isSupabaseReady) return { error: "Configure o Supabase antes de cadastrar." };
    const role = data.email.toLowerCase().endsWith("@professor.com") ? "professor" : "aluno";
    const status = role === "professor" ? "active" : "pending";
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
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
    });
    if (error) return { error: error.message };
    const id = authData.user?.id;
    if (id) {
      await upsertProfile({
        id,
        email: data.email,
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
      });
    }
    return {
      success: role === "professor"
        ? "Conta criada. Faça login para acessar sua área de professor."
        : "Cadastro enviado. Agora a recepção precisa liberar seu acesso.",
    };
  };

  const signOut = async () => {
    if (isSupabaseReady) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile(user);
  };

  const value = useMemo<AuthContextValue>(() => ({
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
  }), [user, session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
