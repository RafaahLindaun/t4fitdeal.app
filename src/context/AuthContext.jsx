import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

function fallbackUser(authUser) {
  if (!authUser) return null;

  return {
    ...authUser,
    nome:
      authUser?.user_metadata?.nome ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split("@")[0] ||
      "",
    idade: "",
    altura: "",
    peso: "",
    objetivo: "",
    frequencia: "",
    nivel: "",
    split: "",
    intensidade: "",
    onboarded: false,
    photoUrl:
      authUser?.user_metadata?.avatar_url ||
      authUser?.user_metadata?.picture ||
      "",
    provider: authUser?.app_metadata?.provider || "",
    createdAt: authUser?.created_at || "",
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(currentAuthUser) {
    try {
      if (!currentAuthUser?.id) return;

      const baseProfile = {
        id: currentAuthUser.id,
        email: currentAuthUser.email || null,
        nome:
          currentAuthUser?.user_metadata?.nome ||
          currentAuthUser?.user_metadata?.full_name ||
          currentAuthUser?.user_metadata?.name ||
          currentAuthUser?.email?.split("@")[0] ||
          null,
        provider: currentAuthUser?.app_metadata?.provider || null,
        photo_url:
          currentAuthUser?.user_metadata?.avatar_url ||
          currentAuthUser?.user_metadata?.picture ||
          null,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(baseProfile, { onConflict: "id" });

      if (error) {
        console.error("ensureProfile error:", error);
      }
    } catch (err) {
      console.error("ensureProfile catch:", err);
    }
  }

  async function buildUserWithProfile(currentAuthUser) {
    try {
      if (!currentAuthUser?.id) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentAuthUser.id)
        .maybeSingle();

      if (error) {
        console.error("buildUserWithProfile error:", error);
        return fallbackUser(currentAuthUser);
      }

      return {
        ...currentAuthUser,
        nome:
          profile?.nome ||
          currentAuthUser?.user_metadata?.nome ||
          currentAuthUser?.user_metadata?.full_name ||
          currentAuthUser?.user_metadata?.name ||
          currentAuthUser?.email?.split("@")[0] ||
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
        photoUrl:
          profile?.photo_url ||
          currentAuthUser?.user_metadata?.avatar_url ||
          currentAuthUser?.user_metadata?.picture ||
          "",
        provider: profile?.provider || currentAuthUser?.app_metadata?.provider || "",
        createdAt: profile?.created_at || currentAuthUser?.created_at || "",
      };
    } catch (err) {
      console.error("buildUserWithProfile catch:", err);
      return fallbackUser(currentAuthUser);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("getSession error:", error);
          if (!mounted) return;
          setSession(null);
          setAuthUser(null);
          setUser(null);
          return;
        }

        if (!mounted) return;

        setSession(currentSession);
        setAuthUser(currentSession?.user ?? null);
      } catch (err) {
        console.error("loadInitialSession catch:", err);
        if (!mounted) return;
        setSession(null);
        setAuthUser(null);
        setUser(null);
      }
    }

    loadInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setAuthUser(newSession?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!authUser) {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await ensureProfile(authUser);
        const mergedUser = await buildUserWithProfile(authUser);

        if (!mounted) return;
        setUser(mergedUser);
      } catch (err) {
        console.error("hydrate effect catch:", err);
        if (!mounted) return;
        setUser(fallbackUser(authUser));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, [authUser]);

  async function updateUser(updates) {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) {
        return { ok: false, msg: "Usuário não encontrado." };
      }

      const payload = { id: currentUserId };

      if (updates.nome !== undefined) payload.nome = updates.nome || null;
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
        payload.photo_url = updates.photoUrl || null;
      }
      if (updates.objetivo !== undefined) payload.objetivo = updates.objetivo || null;
      if (updates.frequencia !== undefined) {
        payload.frequencia =
          updates.frequencia === "" ? null : Number(updates.frequencia);
      }
      if (updates.nivel !== undefined) payload.nivel = updates.nivel || null;
      if (updates.split !== undefined) payload.split = updates.split || null;
      if (updates.intensidade !== undefined) payload.intensidade = updates.intensidade || null;
      if (updates.onboarded !== undefined) payload.onboarded = !!updates.onboarded;

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("updateUser error:", error);
        return { ok: false, msg: error.message };
      }

      setUser((prev) => ({
        ...prev,
        ...updates,
        photoUrl:
          updates.photoUrl !== undefined ? updates.photoUrl : prev?.photoUrl,
      }));

      return { ok: true };
    } catch (err) {
      console.error("updateUser catch:", err);
      return { ok: false, msg: err?.message || "Erro ao atualizar usuário." };
    }
  }

  async function signup(payload) {
    try {
      const { email, senha, nome } = payload;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      });

      if (error) return { ok: false, msg: error.message };
      return { ok: true, user: data.user };
    } catch (err) {
      console.error("signup catch:", err);
      return { ok: false, msg: err?.message || "Erro no cadastro." };
    }
  }

  async function loginWithEmail(email, senha) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) return { ok: false, msg: error.message };
      return { ok: true };
    } catch (err) {
      console.error("loginWithEmail catch:", err);
      return { ok: false, msg: err?.message || "Erro no login." };
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

      if (error) return { ok: false, msg: error.message };
      return { ok: true };
    } catch (err) {
      console.error("loginWithGoogle catch:", err);
      return { ok: false, msg: err?.message || "Erro no login com Google." };
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("logout catch:", err);
    } finally {
      setSession(null);
      setAuthUser(null);
      setUser(null);
      setLoading(false);
    }
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
