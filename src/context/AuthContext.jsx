import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      try {
        const url = window.location.href;

        // troca o code do OAuth por sessão
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);

        if (exchangeError) {
          console.error("exchangeCodeForSession error:", exchangeError);
          if (active) nav("/login", { replace: true });
          return;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("getSession error:", sessionError);
          if (active) nav("/login", { replace: true });
          return;
        }

        if (!session?.user) {
          if (active) nav("/login", { replace: true });
          return;
        }

        const authUser = session.user;

        const profilePayload = {
          id: authUser.id,
          email: authUser.email || null,
          nome:
            authUser?.user_metadata?.nome ||
            authUser?.user_metadata?.full_name ||
            authUser?.user_metadata?.name ||
            authUser?.email?.split("@")[0] ||
            null,
          photo_url:
            authUser?.user_metadata?.avatar_url ||
            authUser?.user_metadata?.picture ||
            null,
          provider: authUser?.app_metadata?.provider || "google",
        };

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(profilePayload, { onConflict: "id" });

        if (upsertError) {
          console.error("profiles upsert error:", upsertError);
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", authUser.id)
          .maybeSingle();

        if (!active) return;

        if (profile?.onboarded) {
          nav("/dashboard", { replace: true });
        } else {
          nav("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("AuthCallback fatal error:", err);
        if (active) nav("/login", { replace: true });
      }
    }

    const timeout = setTimeout(() => {
      if (active) {
        console.error("AuthCallback timeout");
        nav("/login", { replace: true });
      }
    }, 12000);

    finishLogin();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [nav]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        color: "#0f172a",
        fontSize: 34,
        fontWeight: 900,
        letterSpacing: -1,
      }}
    >
      fitdeal<span style={{ color: "#FF6A00" }}>.</span>
    </div>
  );
}
