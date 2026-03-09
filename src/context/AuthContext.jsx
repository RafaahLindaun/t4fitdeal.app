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
    provider: authUser.app_metadata?.provider || "email",
    createdAt: profile?.created_at || authUser.created_at || "",
  };

}

export function AuthProvider({ children }) {

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(authUser) {

    if (!authUser?.id) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    const merged = normalizeProfile(data, authUser);
    setUser(merged);

  }

  async function ensureProfile(authUser) {

    if (!authUser?.id) return;

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

    await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    fetchProfile(authUser);

  }

  useEffect(() => {

    let mounted = true;

    async function bootstrap() {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session || null);

      if (session?.user) {
        fetchProfile(session.user);
      }

      setLoading(false);

    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {

        setSession(newSession || null);

        if (event === "SIGNED_OUT") {
          setUser(null);
          return;
        }

        if (event === "SIGNED_IN" && newSession?.user) {
          ensureProfile(newSession.user);
        }

      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };

  }, []);

  async function signup(payload) {

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

  }

  async function loginWithEmail(email, senha) {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim().toLowerCase(),
      password: String(senha || ""),
    });

    if (error) {
      return { ok: false, msg: error.message };
    }

    return { ok: true, user: data?.user || null };

  }

  async function loginWithGoogle() {

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

  }

  async function loginWithApple() {

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
