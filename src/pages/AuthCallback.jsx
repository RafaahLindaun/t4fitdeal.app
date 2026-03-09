import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";

const MIN_LOAD_MS = 5_000;
const FADE_MS = 450;

// seletores comuns de bottom nav — adicione o seu seletor específico se necessário
const BOTTOM_SELECTORS = [
  ".bottom-nav",
  ".app-bottom-bar",
  ".bottom-tabs",
  ".bottomBar",
  "#bottom-nav",
  ".footer-nav",
  ".tab-bar",
  ".home-bottom-nav",
  ".app-footer",
  "nav.bottom",
  ".mobile-bottom-space",
];

export default function AuthCallback() {
  const nav = useNavigate();
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef(null);
  const listenerRef = useRef(null);
  const observerRef = useRef(null);
  const hiddenMapRef = useRef(new Map()); // element -> previousInlineStyle

  // aplica ocultação (inline styles) em todos os elementos que casam com os seletores
  function applyHide() {
    try {
      BOTTOM_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el) return;
          if (hiddenMapRef.current.has(el)) return; // já escondido
          // salva estilo inline atual para restaurar depois
          const prev = el.getAttribute("style") || "";
          hiddenMapRef.current.set(el, prev);
          // aplica estilos que escondem definitivamente
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("height", "0px", "important");
          el.style.setProperty("min-height", "0px", "important");
        });
      });
    } catch (e) {
      // não quebrar se algo der errado
      // eslint-disable-next-line no-console
      console.warn("applyHide error:", e);
    }
  }

  // restaura todos os elementos escondidos ao estilo anterior
  function restoreHidden() {
    try {
      hiddenMapRef.current.forEach((prevStyle, el) => {
        if (!el) return;
        if (prevStyle) {
          el.setAttribute("style", prevStyle);
        } else {
          el.removeAttribute("style");
        }
      });
      hiddenMapRef.current.clear();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("restoreHidden error:", e);
    }
  }

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
      if (observerRef.current) {
        try {
          observerRef.current.disconnect();
        } catch {}
      }
      // garante restauração se algo sobrar
      restoreHidden();
      document.body.classList.remove("onboarding-mode");
    };
  }, []);

  useEffect(() => {
    // trava scroll da página
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;

    // adiciona a classe que oculta via CSS global (se existir)
    document.body.classList.add("onboarding-mode");

    // aplica ocultação imediata via JS (mais robusto)
    applyHide();

    // observa alterações no DOM para reaplicar ocultação (caso bottom nav seja montada por portal depois)
    const mo = new MutationObserver(() => {
      applyHide();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    observerRef.current = mo;

    // evita scroll da página enquanto callback está ativo
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      // remove observador e restaura estilos
      try {
        if (observerRef.current) observerRef.current.disconnect();
      } catch {}
      restoreHidden();
      document.body.classList.remove("onboarding-mode");
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    // injeta estilos de animação + garante auth-callback-top (z-index alto)
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

        /* garante que o callback seja mostrado por cima de tudo */
        .auth-callback-top {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999 !important;
          background: transparent;
          pointer-events: none; /* evita interceptar toques; o conteúdo interno pode ter pointer-events:auto se necessário */
        }

        .auth-callback-top > .auth-callback-inner {
          pointer-events: auto; /* permite interagir com o conteúdo se necessário */
        }
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

        // fadeout
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
    // .auth-callback-top garante z-index alto para cobrir qualquer bottom nav que esteja acima
    <div className="auth-callback-top">
      <div className="auth-callback-inner" style={S.page}>
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
