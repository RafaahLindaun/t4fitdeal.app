import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function ensureProfile(authUser) {
    try {
      if (!authUser?.id) return;

      const baseProfile = {
        id: authUser.id,
        email: authUser.email || null,
        nome:
          authUser?.user_metadata?.nome ||
          authUser?.user_metadata?.full_name ||
          authUser?.user_metadata?.name ||
          authUser?.email?.split("@")[0] ||
          null,
        provider: authUser?.app_metadata?.provider || null,
        photo_url:
          authUser?.user_metadata?.avatar_url ||
          authUser?.user_metadata?.picture ||
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

  async function buildUserWithProfile(authUser) {
    try {
      if (!authUser?.id) return null;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("buildUserWithProfile error:", error);
        return fallbackUser(authUser);
      }

      return {
        ...authUser,
        nome:
          profile?.nome ||
          authUser?.user_metadata?.nome ||
          authUser?.user_metadata?.full_name ||
          authUser?.user_metadata?.name ||
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
        photoUrl:
          profile?.photo_url ||
          authUser?.user_metadata?.avatar_url ||
          authUser?.user_metadata?.picture ||
          "",
        provider: profile?.provider || authUser?.app_metadata?.provider || "",
        createdAt: profile?.created_at || authUser?.created_at || "",
      };
    } catch (err) {
      console.error("buildUserWithProfile catch:", err);
      return fallbackUser(authUser);
    }
  }

  async function hydrateAuthUser(authUser) {
    if (!authUser) return null;
    await ensureProfile(authUser);
    return await buildUserWithProfile(authUser);
  }

  async function loadSession() {
    setLoading(true);

    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("getSession error:", error);
        setSession(null);
        setUser(null);
        return;
      }

      setSession(currentSession);

      if (currentSession?.user) {
        const mergedUser = await hydrateAuthUser(currentSession.user);
        setUser(mergedUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("loadSession catch:", err);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        try {
          if (!mounted) return;

          setSession(newSession);

          if (newSession?.user) {
            const mergedUser = await hydrateAuthUser(newSession.user);
            if (!mounted) return;
            setUser(mergedUser);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("onAuthStateChange catch:", err);
          if (mounted) {
            setUser(newSession?.user ? fallbackUser(newSession.user) : null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function refreshUser() {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        return { ok: false, msg: error?.message || "Usuário não encontrado." };
      }

      const mergedUser = await hydrateAuthUser(authUser);
      setUser(mergedUser);

      return { ok: true, user: mergedUser };
    } catch (err) {
      console.error("refreshUser catch:", err);
      return { ok: false, msg: err?.message || "Erro ao atualizar usuário." };
    }
  }

  async function updateUser(updates) {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) {
        return { ok: false, msg: "Usuário não encontrado." };
      }

      const payload = {
        id: currentUserId,
      };

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
        idade:
          updates.idade !== undefined
            ? updates.idade === "" ? "" : Number(updates.idade)
            : prev?.idade,
        altura:
          updates.altura !== undefined
            ? updates.altura === "" ? "" : Number(updates.altura)
            : prev?.altura,
        peso:
          updates.peso !== undefined
            ? updates.peso === "" ? "" : Number(updates.peso)
            : prev?.peso,
        frequencia:
          updates.frequencia !== undefined
            ? updates.frequencia === "" ? "" : Number(updates.frequencia)
            : prev?.frequencia,
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
        options: {
          data: { nome },
        },
      });

      if (error) return { ok: false, msg: error.message };

      if (data?.user) {
        await ensureProfile(data.user);
      }

      return { ok: true, user: data.user };
    } catch (err) {
      console.error("signup catch:", err);
      return { ok: false, msg: err?.message || "Erro no cadastro." };
    }
  }

  async function loginWithEmail(email, senha) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) return { ok: false, msg: error.message };

      setSession(data.session);

      if (data.user) {
        const mergedUser = await hydrateAuthUser(data.user);
        setUser(mergedUser);
      } else {
        setUser(null);
      }

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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
