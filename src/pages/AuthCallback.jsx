import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao recuperar sessão:", error);
          navigate("/login", { replace: true });
          return;
        }

        if (!session) {
          navigate("/login", { replace: true });
          return;
        }

        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Erro no callback:", err);
        navigate("/login", { replace: true });
      }
    }

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
        <p>Finalizando login...</p>
      </div>
    </div>
  );
}
