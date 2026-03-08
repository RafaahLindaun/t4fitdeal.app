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

  // ✅ loading APENAS pro boot inicial (não travar o app a cada USER_UPDATED)
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

    if (error) console.error("Erro ao buscar profile:", error);

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

    if (error) console.error("Erro ao garantir profile:", error);

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // ✅ NÃO ficar alternando loading aqui (evita travar no Safari)
      setSession(newSession || null);

      try {
        if (event === "SIGNED_OUT") {
          setUser(null);
          return;
        }

        if (newSession?.user) {
          // ✅ atualiza profile em background sem travar a rota
          await ensureProfile(newSession.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Erro no onAuthStateChange:", err);
        // se der erro, não deixa user “sumir” à toa
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

      if (error) return { ok: false, msg: error.message };

      if (data?.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email,
            nome: payload?.nome || "",
            altura: payload?.altura ? Number(payload.altura) : null,
            peso: payload?.peso ? Number(payload.peso) : null,
            provider: "email",
            onboarded: false,
          },
          { onConflict: "id" }
        );

        if (profileError) {
          console.error("Erro ao criar profile no signup:", profileError);
        }
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

      if (error) return { ok: false, msg: error.message };

      if (data?.user) await ensureProfile(data.user);

      return { ok: true, user: data?.user || null };
    } catch (err) {
      return { ok: false, msg: err?.message || "Erro ao entrar." };
    }
  }

  async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://fitdeal.vercel.app/auth/callback"
    }
  });

  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}
  }

  async function loginWithApple() {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo },
      });

      if (error) return { ok: false, msg: error.message };
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: err?.message || "Erro ao entrar com Apple." };
    }
  }

  async function updateUser(patch) {
    try {
      // ✅ pega o usuário REAL (não depende do state)
      const {
        data: { session: liveSession },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr) {
        return { ok: false, msg: sessionErr.message };
      }

      const authUser = liveSession?.user;
      if (!authUser?.id) {
        return { ok: false, msg: "Usuário não autenticado." };
      }

      const payload = {};

      if ("nome" in patch) payload.nome = patch.nome || "";
      if ("email" in patch) payload.email = String(patch.email || "").toLowerCase();
      if ("idade" in patch) payload.idade = patch.idade ? Number(patch.idade) : null;
      if ("altura" in patch) payload.altura = patch.altura ? Number(patch.altura) : null;
      if ("peso" in patch) payload.peso = patch.peso ? Number(patch.peso) : null;
      if ("objetivo" in patch) payload.objetivo = patch.objetivo || "";
      if ("frequencia" in patch) payload.frequencia = patch.frequencia ? Number(patch.frequencia) : null;
      if ("nivel" in patch) payload.nivel = patch.nivel || "";
      if ("split" in patch) payload.split = patch.split || "";
      if ("intensidade" in patch) payload.intensidade = patch.intensidade || "";
      if ("onboarded" in patch) payload.onboarded = !!patch.onboarded;
      if ("photoUrl" in patch) payload.photo_url = patch.photoUrl || "";
      if ("provider" in patch) payload.provider = patch.provider || "";

      // ✅ IMPORTANTÍSSIMO:
      // NÃO atualize email no auth aqui (Google/Apple podem travar/precisar reauth).
      // Se quiser mudar email de verdade, faça numa tela própria só para provider=email.
      // (mantemos "email" no profiles para exibir/organizar no app)

      // ✅ metadata só quando precisa (isso pode disparar USER_UPDATED, mas não travamos loading)
      if ("nome" in patch || "photoUrl" in patch) {
        const metadataPatch = {};
        if ("nome" in patch) metadataPatch.nome = patch.nome || "";
        if ("photoUrl" in patch) metadataPatch.avatar_url = patch.photoUrl || "";

        const { error: metaError } = await supabase.auth.updateUser({
          data: metadataPatch,
        });

        if (metaError) {
          console.error("Erro ao atualizar metadata:", metaError);
          // não bloqueia salvar perfil
        }
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: authUser.id, ...payload }, { onConflict: "id" });

      if (error) return { ok: false, msg: error.message };

      await fetchProfile(authUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: err?.message || "Erro ao atualizar perfil." };
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
      updateUser,
      logout,
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

