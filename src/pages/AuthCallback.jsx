import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BG = "#f8fafc";

export default function AuthCallback() {

  const nav = useNavigate();

  const [step, setStep] = useState("Conectando");
  const [progress, setProgress] = useState(0);

  useEffect(() => {

    async function handleAuth() {

      try {

        setStep("Conectando");
        setProgress(33);

        await supabase.auth.getSession();

        setStep("Verificando conta");
        setProgress(66);

        await new Promise(r => setTimeout(r, 500));

        setStep("Carregando menu");
        setProgress(100);

        await new Promise(r => setTimeout(r, 400));

        nav("/dashboard", { replace: true });

      } catch (err) {

        console.error("Auth error:", err);
        nav("/login");

      }

    }

    handleAuth();

  }, []);

  useEffect(() => {

    if (typeof document === "undefined") return;

    const id = "fitdeal-auth-ui";

    if (document.getElementById(id)) return;

    const style = document.createElement("style");

    style.id = id;

    style.innerHTML = `

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes fadeIn {
        from { opacity:0; transform:translateY(4px); }
        to { opacity:1; transform:translateY(0); }
      }

      .authSpin {
        animation: spin .9s linear infinite;
      }

      .authFade {
        animation: fadeIn .25s ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .authSpin { animation:none }
        .authFade { animation:none }
      }

    `;

    document.head.appendChild(style);

  }, []);

  return (

    <div style={S.page}>

      <div style={S.card}>

        <div style={S.loaderWrap}>

          <div style={S.loaderTrack}>
            <div style={S.loader} className="authSpin"/>
          </div>

        </div>

        <div style={S.step} className="authFade">
          {step}...
        </div>

        <div style={S.progressWrap}>

          <div style={S.progressBar}>
            <div
              style={{
                ...S.progressFill,
                width: progress + "%"
              }}
            />
          </div>

        </div>

      </div>

    </div>

  );

}

const S = {

  page: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: BG,
    padding: 24
  },

  card: {
    width: "100%",
    maxWidth: 320,
    padding: 32,
    borderRadius: 28,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 20px 60px rgba(15,23,42,.08)",
    textAlign: "center",
    backdropFilter: "blur(12px)"
  },

  loaderWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 18
  },

  loaderTrack: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "3px solid rgba(255,106,0,.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  loader: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid transparent",
    borderTop: `3px solid ${ORANGE}`
  },

  step: {
    fontSize: 15,
    fontWeight: 900,
    color: TEXT,
    letterSpacing: -0.2
  },

  progressWrap: {
    marginTop: 18
  },

  progressBar: {
    height: 6,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: ORANGE,
    transition: "width .4s ease"
  }

};
