import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";

export default function AuthCallback() {

  const navigate = useNavigate();

  const [step, setStep] = useState("Conectando");
  const [progress, setProgress] = useState(20);

  useEffect(() => {

    const runAuth = async () => {

      try {

        setStep("Conectando");
        setProgress(30);

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        setStep("Verificando conta");
        setProgress(65);

        await new Promise(r => setTimeout(r, 400));

        if (data?.session) {

          setStep("Carregando menu");
          setProgress(100);

          await new Promise(r => setTimeout(r, 300));

          navigate("/dashboard", { replace: true });

        } else {

          navigate("/login", { replace: true });

        }

      } catch (err) {

        console.error("Auth error:", err);
        navigate("/login");

      }

    };

    runAuth();

  }, []);

  useEffect(() => {

    const style = document.createElement("style");

    style.innerHTML = `
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from {opacity:0; transform:translateY(6px);}
      to {opacity:1; transform:translateY(0);}
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    .fade {
      animation: fadeIn .35s ease;
    }

    `;

    document.head.appendChild(style);

  }, []);

  return (

    <div style={S.page}>

      <div style={S.card}>

        <div style={S.spinnerWrap}>

          <div style={S.spinnerTrack}>
            <div style={S.spinner} className="spin"/>
          </div>

        </div>

        <div style={S.step} className="fade">
          {step}...
        </div>

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

  );

}

const S = {

  page: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc"
  },

  card: {
    width: "100%",
    maxWidth: 340,
    padding: 32,
    borderRadius: 28,
    background: "white",
    border: "1px solid rgba(15,23,42,.06)",
    boxShadow: "0 20px 60px rgba(15,23,42,.08)",
    textAlign: "center"
  },

  spinnerWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 18
  },

  spinnerTrack: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "3px solid rgba(255,106,0,.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  spinner: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "3px solid transparent",
    borderTop: `3px solid ${ORANGE}`
  },

  step: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
    color: "#0f172a"
  },

  progressBar: {
    height: 6,
    borderRadius: 999,
    background: "rgba(15,23,42,.06)",
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: ORANGE,
    borderRadius: 999,
    transition: "width .4s ease"
  }

};
