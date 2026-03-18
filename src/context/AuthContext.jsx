import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(authUser) {
    if (!authUser?.id) return;

    const baseProfile = {
      id: authUser.id,
      email: authUser.email || null,
      nome:
        authUser?.user_metadata?.nome ||
        authUser?.user_metadata?.full_name ||
        authUser?.email?.split("@")[0] ||
        null,
      provider: authUser?.app_metadata?.provider || null,
    };

    await supabase.from("profiles").upsert(baseProfile, { onConflict: "id" });
  }

  async function buildUserWithProfile(authUser) {
    if (!authUser?.id) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    return {
      ...authUser,
      nome:
        profile?.nome ||
        authUser?.user_metadata?.nome ||
        authUser?.user_metadata?.full_name ||
        authUser?.email?.split("@")[0] ||
        "",
      idade: profile?.idade ?? "",
      altura: profile?.altura ?? "",
      peso: profile?.peso ?? "",
      objetivo: profile?.objetivo || "",
      frequencia: profile?.frequencia ?? "",
      nivel: profile?.nivel || "",
      split: profile?.split || "",
      intensidade: profile?.intensidade || "",
      onboarded: profile?.onboarded ?? false,
      photoUrl: profile?.photo_url || "",
      provider: profile?.provider || authUser?.app_metadata?.provider || "",
      createdAt: profile?.created_at || authUser?.created_at || "",
    };
  }

  async function loadSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await ensureProfile(session.user);
        const mergedUser = await buildUserWithProfile(session.user);
        setUser(mergedUser);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          await ensureProfile(newSession.user);
          const mergedUser = await buildUserWithProfile(newSession.user);
          setUser(mergedUser);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function updateUser(updates) {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) {
        return { ok: false, msg: "Usuário não encontrado." };
      }

      const payload = {};

      if (updates.nome !== undefined) payload.nome = updates.nome;
      if (updates.idade !== undefined) {
        payload.idade = updates.idade === "" ? null : Number(updates.idade);
      }
      if (updates.altura !== undefined) {
        payload.altura = updates.altura === "" ? null : Number(updates.altura);
      }
      if (updates.peso !== undefined) {
        payload.peso = updates.peso === "" ? null : Number(updates.peso);
      }
      if (updates.photoUrl !== undefined) {
        payload.photo_url = updates.photoUrl;
      }
      if (updates.objetivo !== undefined) payload.objetivo = updates.objetivo;
      if (updates.frequencia !== undefined) {
        payload.frequencia =
          updates.frequencia === "" ? null : Number(updates.frequencia);
      }
      if (updates.nivel !== undefined) payload.nivel = updates.nivel;
      if (updates.split !== undefined) payload.split = updates.split;
      if (updates.intensidade !== undefined) {
        payload.intensidade = updates.intensidade;
      }
      if (updates.onboarded !== undefined) payload.onboarded = !!updates.onboarded;

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", currentUserId);

        if (error) {
          return { ok: false, msg: error.message };
        }
      }

      const mergedUser = await buildUserWithProfile({
        ...user,
        ...updates,
      });

      setUser(mergedUser);

      return { ok: true };
    } catch (err) {
      return { ok: false, msg: err?.message || "Erro ao atualizar usuário." };
    }
  }

  async function signup(payload) {
    const { email, senha, nome } = payload;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    });

    if (error) return { ok: false, msg: error.message };

    if (data?.user) {
      await ensureProfile(data.user);
    }

    return { ok: true, user: data.user };
  }

  async function loginWithEmail(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) return { ok: false, msg: error.message };

    setSession(data.session);

    if (data.user) {
      await ensureProfile(data.user);
      const mergedUser = await buildUserWithProfile(data.user);
      setUser(mergedUser);
    } else {
      setUser(null);
    }

    return { ok: true };
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) return { ok: false, msg: error.message };

    return { ok: true };
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }

  const value = {
    user,
    session,
    loading,
    signup,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
