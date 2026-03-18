import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function updateUser(updates) {
    try {
      const currentUserId = user?.id;
      const currentEmail = (user?.email || "anon").toLowerCase();

      setUser((prev) => ({
        ...prev,
        ...updates,
      }));

      if (updates?.photoUrl) {
        localStorage.setItem(`acct_photo_${currentEmail}`, updates.photoUrl);
      }

      if (currentUserId) {
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

        if (Object.keys(payload).length > 0) {
          const { error } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", currentUserId);

          if (error) {
            return { ok: false, msg: error.message };
          }
        }
      }

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

    return { ok: true, user: data.user };
  }

  async function loginWithEmail(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) return { ok: false, msg: error.message };

    setSession(data.session);
    setUser(data.user);

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
