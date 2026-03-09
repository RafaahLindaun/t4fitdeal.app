import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";

// Duração mínima de carregamento (milissegundos)
const MIN_LOAD_MS = 30_000;
// duração do fadeout antes do nav (ms) — mantém impressão suave
const FADE_MS = 450;

export default function AuthCallback() {
  const nav = useNavigate();
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef(null);
  const listenerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (listenerRef.current) {
        try {
          listenerRef.current.subscription.unsubscribe();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    // trava scroll da página
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    // injeta estilos de animação (mesmo visual)
    const id = "fitdeal-auth-style";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        @keyframes fadeApp {
          from {opacity:0; transform:scale(.98);}
          to {opacity:1; transform:scale(1);}
        }
        @keyframes dotBounce {
          0% { transform: translateY(0px); }
          30% { transform: translateY(-8px); }
          60% { transform: translateY(2px); }
          100% { transform: translateY(0px); }
        }
        .fitdealFade { animation: fadeApp .45s ease forwards; }
        .dotJump { display:inline-block; animation: dotBounce .9s ease infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    let start = Date.now();
    setVisible(true);

    // função utilitária de sleep
    const sleep = (ms) => new Promise((r) => (timeoutRef.current = setTimeout(r, ms)));

    // tenta trocar code por sessão (supabase v2). se falhar, ignora.
    const tryExchange = async () => {
      try {
        if (typeof supabase?.auth?.exchangeCodeForSession === "function") {
          // passa a URL completa (onde o provider retornou o code)
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } catch (e) {
        // ignore
      }
    };

    // espera por sessão: retorna session object ou null após timeout
    const waitForSession = async (timeoutMs) => {
      // checa imediatamente
      const { data: current } = await supabase.auth.getSession();
      if (current?.session) return current.session;

      // senão, ouve evento SIGNED_IN por até timeoutMs
      return await new Promise((resolve) => {
        let resolved = false;

        // listener
        const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (resolved) return;
          if (event === "SIGNED_IN" && newSession) {
            resolved = true;
            // pequeno delay para garantir session persisted
            setTimeout(() => resolve(newSession), 50);
          }
        });

        listenerRef.current = listener;

        // timeout fallback
        const to = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          try {
            const { data } = await supabase.auth.getSession();
            resolve(data?.session || null);
          } catch (e) {
            resolve(null);
          }
        }, timeoutMs);

        // cleanup quando já resolvido
        const cleanup = () => {
          clearTimeout(to);
          try {
            listener.subscription.unsubscribe();
          } catch (e) {}
        };

        // attach resolve hook to cleanup after resolution
        const origResolve = resolve;
        resolve = (val) => {
          cleanup();
          origResolve(val);
        };
      });
    };

    (async () => {
      try {
        // 1) tenta exchange (se aplicável)
        await tryExchange();

        // 2) espera por sessão até MIN_LOAD_MS (para garantir fluxo OAuth)
        const session = await waitForSession(MIN_LOAD_MS);

        // 3) decide rota (busca profile.onboarded se houver sessão)
        let target = "/login";
        if (session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("onboarded")
              .eq("id", session.user.id)
              .maybeSingle();

            if (!error && profile) {
              target = profile.onboarded ? "/dashboard" : "/onboarding";
            } else {
              // se não encontrou profile, considerar onboarding
              target = "/onboarding";
            }
          } catch (e) {
            target = "/dashboard";
          }
        } else {
          target = "/login";
        }

        // 4) garante que o total visível seja ao menos MIN_LOAD_MS
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_LOAD_MS - elapsed);

        if (remaining > 0) {
          await sleep(remaining);
        }

        // 5) fadeout e navegar
        setVisible(false);

        await sleep(FADE_MS);
        if (!mountedRef.current) return;

        nav(target, { replace: true });
      } catch (err) {
        // fallback seguro: fade e voltar ao login
        try {
          setVisible(false);
          await sleep(FADE_MS);
          if (!mountedRef.current) return;
          nav("/login", { replace: true });
        } catch (e) {}
      }
    })();

    // cleanup já tratado no useEffect top
  }, [nav]);

  return (
    <div style={S.page}>
      <div
        className="fitdealFade"
        style={{
          ...S.center,
          opacity: visible ? 1 : 0,
          transition: "opacity .45s ease",
        }}
      >
        <div style={S.logo}>
          fitdeal<span className="dotJump" style={S.dot}>.</span>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: BG,
  },
  center: {
    textAlign: "center",
  },
  logo: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: -0.5,
    color: TEXT,
  },
  dot: {
    color: ORANGE,
  },
};
