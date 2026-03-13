import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function pickActiveSubscription(row) {
  if (!row) return null;

  const status = String(row.status || "").toLowerCase();
  const isPremium = ["active", "trialing", "past_due"].includes(status);

  return {
    id: row.id || null,
    plan: row.plan || "free",
    status: row.status || "inactive",
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    currentPeriodEnd: row.current_period_end || null,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
    isPremium,
    isNutriPlus: row.plan === "nutri_plus" && isPremium,
  };
}

function normalizeProfile(profile, authUser, subscription) {
  if (!authUser) return null;

  const safeSub = pickActiveSubscription(subscription);

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

    // assinatura
    subscription: safeSub,
    plan: safeSub?.plan || "free",
    subscriptionStatus: safeSub?.status || "inactive",
    isPremium: !!safeSub?.isPremium,
    isNutriPlus: !!safeSub?.isNutriPlus,
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

    const [profileRes, subscriptionRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),

      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", authUser.id)
        .in("status", ["active", "trialing", "past_due", "canceled", "unpaid", "incomplete"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const profile = profileRes?.data || null;
    const subscription = subscriptionRes?.data || null;

    const merged = normalizeProfile(profile, authUser, subscription);
    setUser(merged);
    return merged;
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

    await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    await fetchProfile(authUser);
  }

  async function refreshUser() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      return null;
    }

    return fetchProfile(authUser);
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession || null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user);
      } else {
        setUser(null);
      }

      if (mounted) setLoading(false);
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession || null);

        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }

        if (
          ["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED", "INITIAL_SESSION"].includes(event) &&
          newSession?.user
        ) {
          await ensureProfile(newSession.user);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
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

    await fetchProfile(data?.user || null);
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

  async function updateUser(payload = {}) {
    if (!session?.user?.id) {
      return { ok: false, msg: "Usuário não autenticado." };
    }

    const profilePayload = {
      id: session.user.id,
      email: payload.email ?? user?.email ?? session.user.email ?? "",
      nome: payload.nome ?? user?.nome ?? "",
      idade: payload.idade ?? user?.idade ?? "",
      altura: payload.altura ?? user?.altura ?? "",
      peso: payload.peso ?? user?.peso ?? "",
      objetivo: payload.objetivo ?? user?.objetivo ?? "",
      frequencia: payload.frequencia ?? user?.frequencia ?? "",
      nivel: payload.nivel ?? user?.nivel ?? "",
      split: payload.split ?? user?.split ?? "",
      intensidade: payload.intensidade ?? user?.intensidade ?? "",
      onboarded: payload.onboarded ?? user?.onboarded ?? false,
      photo_url: payload.photoUrl ?? user?.photoUrl ?? "",
      provider: user?.provider || session.user.app_metadata?.provider || "email",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (error) {
      return { ok: false, msg: error.message };
    }

    await refreshUser();
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
      updateUser,
      refreshUser,
      isPremium: !!user?.isPremium,
      isNutriPlus: !!user?.isNutriPlus,
      plan: user?.plan || "free",
      subscription: user?.subscription || null,
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
