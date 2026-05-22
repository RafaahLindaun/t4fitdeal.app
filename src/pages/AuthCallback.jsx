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

function getAfterAuthRedirect() {

  const saved = localStorage.getItem("fitdeal_after_auth_redirect");

  if (!saved) return "";

  const allowed = [

    "/dashboard",

    "/onboarding",

    "/treino",

    "/planos",

    "/nutricao",

    "/cardio",

    "/conta",

  ];

  if (allowed.includes(saved)) return saved;

  return "";

}

export default function AuthCallback() {

  const nav = useNavigate();

  const [visible, setVisible] = useState(false);

  const mountedRef = useRef(true);

  const timeoutRef = useRef(null);

  const observerRef = useRef(null);

  const hiddenMapRef = useRef(new Map());

  function sleep(ms) {

    return new Promise((resolve) => {

      timeoutRef.current = setTimeout(resolve, ms);

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

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (observerRef.current) {

        try {

          observerRef.current.disconnect();

        } catch {}

      }

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

    async function waitForSession() {

      for (let i = 0; i < 20; i += 1) {

        const {

          data: { session },

        } = await supabase.auth.getSession();

        if (session?.user) return session;

        await sleep(250);

      }

      return null;

    }

    async function ensureProfile(user) {

      const payload = {

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

      const { error } = await supabase

        .from("profiles")

        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

    }

    async function getProfile(userId) {

      const { data, error } = await supabase

        .from("profiles")

        .select("onboarded")

        .eq("id", userId)

        .maybeSingle();

      if (error) {

        console.warn("AuthCallback getProfile error:", error);

      }

      return data || null;

    }

    async function run() {

      try {

        const session = await waitForSession();

        let target = "/";

        if (session?.user) {

          await ensureProfile(session.user);

          const savedTarget = getAfterAuthRedirect();

          const profile = await getProfile(session.user.id);

          if (savedTarget === "/onboarding") {

            target = profile?.onboarded ? "/dashboard" : "/onboarding";

          } else if (savedTarget) {

            target = savedTarget;

          } else {

            target = profile?.onboarded ? "/dashboard" : "/onboarding";

          }

        }

        localStorage.removeItem("fitdeal_after_auth_redirect");

        const elapsed = Date.now() - startedAt;

        const remaining = Math.max(0, MIN_LOAD_MS - elapsed);

        if (remaining > 0) {

          await sleep(remaining);

        }

        setVisible(false);

        await sleep(FADE_MS);

        if (!mountedRef.current) return;

        nav(target, { replace: true });

      } catch (error) {

        console.error("AuthCallback error:", error);

        localStorage.removeItem("fitdeal_after_auth_redirect");

        setVisible(false);

        await sleep(FADE_MS);

        if (!mountedRef.current) return;

        nav("/", { replace: true });

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
