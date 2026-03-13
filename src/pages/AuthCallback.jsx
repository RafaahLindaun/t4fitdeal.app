import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finalizando login...");

  useEffect(() => {
    let mounted = true;

    async function finishOAuth() {
      try {
        setMessage("Validando sessão...");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          setMessage("Nenhuma sessão encontrada. Redirecionando...");
          setTimeout(() => {
            if (mounted) navigate("/login", { replace: true });
          }, 1200);
          return;
        }

        const user = session.user;

        setMessage("Preparando seu perfil...");

        const profilePayload = {
          id: user.id,
          email: user.email || "",
          nome:
            user.user_metadata?.nome ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "",
          photo_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            "",
          provider: user.app_metadata?.provider || "google",
        };

        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(profilePayload, { onConflict: "id" });

        if (upsertError) {
          throw upsertError;
        }

        setMessage("Login concluído. Entrando...");

        setTimeout(() => {
          if (mounted) navigate("/dashboard", { replace: true });
        }, 500);
      } catch (error) {
        console.error("Erro no AuthCallback:", error);
        setMessage("Erro ao concluir login. Redirecionando...");
        setTimeout(() => {
          if (mounted) navigate("/login", { replace: true });
        }, 1500);
      }
    }

    finishOAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-xl">
        <div className="mb-4 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>

        <h1 className="text-xl font-semibold">FitDeal</h1>
        <p className="mt-3 text-sm text-zinc-300">{message}</p>
      </div>
    </div>
  );
}
