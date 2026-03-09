import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function normalizeProfile(profile, authUser) {
  if (!authUser) return null;

  return {
    id: authUser.id,
    email: authUser.email || profile?.email || "",
    nome:
      profile?.nome ||
      authUser.user_metadata?.nome ||
      authUser.user_metadata?.full_name ||
      "",
    idade: profile?.idade ?? "",
    altura: profile?.altura ?? "",
    peso: profile?.peso ?? "",
    objetivo: profile?.objetivo || "",
    frequencia: profile?.frequencia ?? "",
    nivel: profile?.nivel || "",
    split: profile?.split || "",
    intensidade: profile?.intensidade || "",
    onboarded: !!profile?.onboarded,
    photoUrl:
      profile?.photo_url ||
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      "",
    provider: authUser.app_metadata?.provider || profile?.provider || "email",
    createdAt: profile?.created_at || authUser.created_at || "",
  };
}

export function AuthProvider({ children }) {

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(authUser) {

    if (!authUser?.id) {
      setUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar profile:", error);
    }

    const merged = normalizeProfile(data, authUser);
    setUser(merged);

    return merged;
  }

  async function ensureProfile(authUser) {

    if (!authUser?.id) return null;

    const payload = {
      id: authUser.id,
      email: authUser.email || "",
      nome:
        authUser.user_metadata?.nome ||
        authUser.user_metadata?.full_name ||
        "",
      photo_url:
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        "",
      provider: authUser.app_metadata?.provider || "email",
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("Erro ao garantir profile:", error);
    }

    return fetchProfile(authUser);
  }

  useEffect(() => {

    let mounted = true;

    async function bootstrap() {

      try {

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession || null);

        if (currentSession?.user) {
          await ensureProfile(currentSession.user);
        } else {
          setUser(null);
        }

      } catch (err) {

        console.error("Erro no bootstrap auth:", err);

      } finally {

        if (mounted) setLoading(false);

      }

    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {

        setSession(newSession || null);

        if (event === "SIGNED_OUT") {
          setUser(null);
          return;
        }

        if (event === "SIGNED_IN" && newSession?.user) {
          await ensureProfile(newSession.user);
        }

      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };

  }, []);

  async function signup(payload) {

    try {

      const email = String(payload?.email || "").trim().toLowerCase();
      const password = String(payload?.senha || "");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome: payload?.nome || "" } },
      });

      if (error) {
        return { ok: false, msg: error.message };
      }

      return { ok: true, user: data?.user || null };

    } catch (err) {

      return { ok: false, msg: err?.message || "Erro ao criar conta." };

    }

  }

  async function loginWithEmail(email, senha) {

    try {

      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || "").trim().toLowerCase(),
        password: String(senha || ""),
      });

      if (error) {
        return { ok: false, msg: error.message };
      }

      return { ok: true, user: data?.user || null };

    } catch (err) {

      return { ok: false, msg: err?.message || "Erro ao entrar." };

    }

  }

  async function loginWithGoogle() {

    try {

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { ok: false, msg: error.message };
      }

      return { ok: true };

    } catch (err) {

      return { ok: false, msg: err?.message || "Erro ao entrar com Google." };

    }

  }

  async function loginWithApple() {

    try {

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { ok: false, msg: error.message };
      }

      return { ok: true };

    } catch (err) {

      return { ok: false, msg: err?.message || "Erro ao entrar com Apple." };

    }

  }

  async function logout() {

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);

  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signup,
      loginWithEmail,
      loginWithGoogle,
      loginWithApple,
      logout,
    }),
    [user, session, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  return useContext(AuthContext);
}
