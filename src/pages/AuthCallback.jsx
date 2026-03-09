import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";

const MIN_LOAD_MS = 5_000;
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
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    // trava scroll da página
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;

    // adiciona a classe que oculta o bottom menu (mantém consistência com onboarding)
    document.body.classList.add("onboarding-mode");

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      // remove a classe ao desmontar para restaurar a navegação normal
      document.body.classList.remove("onboarding-mode");

      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
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

    const sleep = (ms) =>
      new Promise((r) => (timeoutRef.current = setTimeout(r, ms)));

    const tryExchange = async () => {
      try {
        if (typeof supabase?.auth?.exchangeCodeForSession === "function") {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }
      } catch {}
    };

    const waitForSession = async (timeoutMs) => {
      const { data: current } = await supabase.auth.getSession();
      if (current?.session) return current.session;

      return await new Promise((resolve) => {
        let resolved = false;

        const { data: listener } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (resolved) return;
            if (event === "SIGNED_IN" && newSession) {
              resolved = true;
              setTimeout(() => resolve(newSession), 50);
            }
          }
        );

        listenerRef.current = listener;

        const to = setTimeout(async () => {
          if (resolved) return;
          resolved = true;
          try {
            const { data } = await supabase.auth.getSession();
            resolve(data?.session || null);
          } catch {
            resolve(null);
          }
        }, timeoutMs);

        const cleanup = () => {
          clearTimeout(to);
          try {
            listener.subscription.unsubscribe();
          } catch {}
        };

        const origResolve = resolve;
        resolve = (val) => {
          cleanup();
          origResolve(val);
        };
      });
    };

    (async () => {
      try {
        await tryExchange();

        const session = await waitForSession(MIN_LOAD_MS);

        let target = "/login";

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("onboarded")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profile) {
              target = profile.onboarded ? "/dashboard" : "/onboarding";
            } else {
              target = "/onboarding";
            }
          } catch {
            target = "/dashboard";
          }
        }

        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_LOAD_MS - elapsed);

        if (remaining > 0) {
          await sleep(remaining);
        }

        setVisible(false);

        await sleep(FADE_MS);

        if (!mountedRef.current) return;

        nav(target, { replace: true });
      } catch {
        setVisible(false);
        await sleep(FADE_MS);
        if (!mountedRef.current) return;
        nav("/login", { replace: true });
      }
    })();
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
