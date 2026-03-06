import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Conectando...");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        // 1) tenta pegar session normal
        let { data } = await supabase.auth.getSession();
        let session = data?.session || null;

        // 2) fallback: se veio com ?code= (PKCE), troca por session
        if (!session) {
          const url = new URL(window.location.href);
          const code = url.searchParams.get("code");
          if (code) {
            const exchanged = await supabase.auth.exchangeCodeForSession(code);
            session = exchanged?.data?.session || null;
          }
        }

        if (!alive) return;

        if (!session?.user) {
          setMsg("Não foi possível autenticar. Voltando…");
          setTimeout(() => nav("/login", { replace: true }), 600);
          return;
        }

        // 3) garante profile e lê onboarded
        setMsg("Preparando sua conta...");
        const authUser = session.user;

        await supabase.from("profiles").upsert(
          {
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
            provider: authUser.app_metadata?.provider || "oauth",
          },
          { onConflict: "id" }
        );

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", authUser.id)
          .maybeSingle();

        const onboarded = !!profile?.onboarded;

        nav(onboarded ? "/dashboard" : "/onboarding", { replace: true });
      } catch (e) {
        console.error(e);
        setMsg("Erro no login. Voltando…");
        setTimeout(() => nav("/login", { replace: true }), 700);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [nav]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      {msg}
    </div>
  );
}
