import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";
const BG = "#f8fafc";
const TEXT = "#0f172a";

export default function AuthCallback() {

  const nav = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {

    const start = async () => {

      setVisible(true);

      // 1️⃣ verifica sessão existente
      const { data } = await supabase.auth.getSession();

      if (data?.session) {
        setTimeout(() => {
          nav("/dashboard", { replace: true });
        }, 500);
        return;
      }

      // 2️⃣ escuta evento de login OAuth
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {

          if (event === "SIGNED_IN" && session) {

            setTimeout(() => {
              nav("/dashboard", { replace: true });
            }, 500);

          }

        }
      );

      // 3️⃣ fallback de segurança
      setTimeout(() => {
        nav("/login", { replace: true });
      }, 6000);

      return () => {
        listener.subscription.unsubscribe();
      };

    };

    start();

  }, [nav]);

  useEffect(() => {

    const style = document.createElement("style");

    style.innerHTML = `

      @keyframes fadeApp {
        from {opacity:0; transform:scale(.98);}
        to {opacity:1; transform:scale(1);}
      }

      @keyframes pulseDot {
        0% {opacity:.4}
        50% {opacity:1}
        100% {opacity:.4}
      }

      .fitdealFade {
        animation: fadeApp .45s ease forwards;
      }

      .fitdealDot {
        animation: pulseDot 1.2s ease infinite;
      }

    `;

    document.head.appendChild(style);

  }, []);

  return (

    <div style={S.page}>

      <div
        className="fitdealFade"
        style={{
          ...S.center,
          opacity: visible ? 1 : 0
        }}
      >

        <div style={S.logo}>
          fitdeal<span style={S.dot}>.</span>
        </div>

      </div>

    </div>

  );

}

const S = {

  page:{
    height:"100vh",
    width:"100%",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    background:BG
  },

  center:{
    textAlign:"center"
  },

  logo:{
    fontSize:36,
    fontWeight:800,
    letterSpacing:-0.5,
    color:TEXT
  },

  dot:{
    color:ORANGE,
    marginLeft:2
  }

};
