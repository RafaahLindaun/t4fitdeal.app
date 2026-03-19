import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";

const MIN_LOAD_MS = 1800;
const FADE_MS = 450;

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
  const timerRefs = useRef([]);
  const observerRef = useRef(null);
  const hiddenMapRef = useRef(new Map());
  const authSubRef = useRef(null);

  function registerTimer(id) {
    timerRefs.current.push(id);
    return id;
  }

  function clearAllTimers() {
    timerRefs.current.forEach((id) => clearTimeout(id));
    timerRefs.current = [];
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      registerTimer(id);
    });
  }

  function applyHide() {
    try {
      BOTTOM_SELECTORS.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          if (!el || hiddenMapRef.current.has(el)) return;

          const prevStyle = el.getAttribute("style") || "";
          hiddenMapRef.current.set(el, prevStyle);

          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("height", "0px", "important");
          el.style.setProperty("min-height", "0px", "important");
        });
      });
    } catch (error) {
      console.warn("applyHide error:", error);
    }
  }

  function restoreHidden() {
    try {
      hiddenMapRef.current.forEach((prevStyle, el) => {
        if (!el) return;
        if (prevStyle) el.setAttribute("style", prevStyle);
        else el.removeAttribute("style");
      });
      hiddenMapRef.current.clear();
    } catch (error) {
      console.warn("restoreHidden error:", error);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearAllTimers();

      if (observerRef.current) {
        try {
          observerRef.current.disconnect();
        } catch {}
      }

      try {
        authSubRef.current?.unsubscribe?.();
      } catch {}

      restoreHidden();
      document.body.classList.remove("onboarding-mode");
    };
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;

    document.body.classList.add("onboarding-mode");
    applyHide();

    const observer = new MutationObserver(() => {
      applyHide();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    observerRef.current = observer;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      try {
        observer.disconnect();
      } catch {}

      restoreHidden();
      document.body.classList.remove("onboarding-mode");
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    const styleId = "fitdeal-auth-style";

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes fadeApp {
          from { opacity: 0; transform: scale(.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes dotBounce {
          0% { transform: translateY(0px); }
          30% { transform: translateY(-8px); }
          60% { transform: translateY(2px); }
          100% { transform: translateY(0px); }
        }

        .fitdealFade {
          animation: fadeApp .45s ease forwards;
        }

        .dotJump {
          display: inline-block;
          animation: dotBounce .9s ease infinite;
        }

        .auth-callback-top {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999 !important;
          background: transparent;
          pointer-events: none;
        }

        .auth-callback-top > .auth-callback-inner {
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    setVisible(true);

    async function exchangeCodeIfNeeded() {
      const hasCode =
        window.location.search.includes("code=") ||
        window.location.search.includes("error=");

      if (!hasCode) return;

      if (typeof supabase.auth.exchangeCodeForSession !== "function") return;

      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("exchangeCodeForSession error:", error);
        throw error;
      }
    }

    async function getSessionFast() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("getSession error:", error);
        throw error;
      }

      if (session?.user) return session;

      return new Promise((resolve) => {
        let settled = false;

        const finish = (value) => {
          if (settled) return;
          settled = true;

          try {
            authSubRef.current?.unsubscribe?.();
          } catch {}

          resolve(value);
        };

        const { data } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            if (newSession?.user) {
              finish(newSession);
            }
          }
        );

        authSubRef.current = data?.subscription || data;

        const fallbackId = setTimeout(async () => {
          try {
            const {
              data: { session: fallbackSession },
            } = await supabase.auth.getSession();

            finish(fallbackSession || null);
          } catch {
            finish(null);
          }
        }, 2500);

        registerTimer(fallbackId);
      });
    }

    async function ensureProfile(user) {
      const payload = {
        id: user.id,
        email: user.email || "",
        nome:
          user.user_metadata?.nome ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "",
        photo_url:
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          "",
        provider: user.app_metadata?.provider || "google",
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
    }

    async function finishNavigation(target) {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_LOAD_MS - elapsed);

      if (remaining > 0) {
        await sleep(remaining);
      }

      setVisible(false);
      await sleep(FADE_MS);

      if (!mountedRef.current) return;
      nav(target, { replace: true });
    }

    async function run() {
      try {
        await exchangeCodeIfNeeded();

        const session = await getSessionFast();

        if (!session?.user) {
          await finishNavigation("/login");
          return;
        }

        await ensureProfile(session.user);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("profile onboarded fetch error:", profileError);
        }

        const target = profile?.onboarded ? "/dashboard" : "/onboarding";
        await finishNavigation(target);
      } catch (error) {
        console.error("AuthCallback error:", error);
        await finishNavigation("/login");
      }
    }

    run();
  }, [nav]);

  return (
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
