import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data?.session;
        if (!session?.user) {
          if (alive) nav("/login", { replace: true });
          return;
        }

        // opcional: decidir se vai onboarding ou dashboard
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!alive) return;

        if (profile?.onboarded) nav("/dashboard", { replace: true });
        else nav("/onboarding", { replace: true });
      } catch (e) {
        console.error("AuthCallback error:", e);
        if (alive) nav("/login", { replace: true });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [nav]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      Entrando...
    </div>
  );
}
