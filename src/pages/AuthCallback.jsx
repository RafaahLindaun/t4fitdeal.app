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

    const finishLogin = async () => {

      setVisible(true);

      try {

        // 1️⃣ troca o code do Google por sessão
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          console.error("OAuth error:", error);
          nav("/login", { replace: true });
          return;
        }

        // 2️⃣ pega sessão já salva
        const { data } = await supabase.auth.getSession();

        if (data?.session) {

          // pequena pausa só para o efeito visual
          setTimeout(() => {
            nav("/dashboard", { replace: true });
          }, 700);

        } else {

          nav("/login", { replace: true });

        }

      } catch (err) {

        console.error("AuthCallback error:", err);
        nav("/login", { replace: true });

      }

    };

    finishLogin();

  }, [nav]);

  // trava scroll
  useEffect(() => {

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };

  }, []);

  // animações
  useEffect(() => {

    const style = document.createElement("style");

    style.innerHTML = `

      @keyframes fadeApp {
        from {opacity:0; transform:scale(.98);}
        to {opacity:1; transform:scale(1);}
      }

      @keyframes dotBounce {
        0% { transform: translateY(0px); }
        40% { transform: translateY(-8px); }
        70% { transform: translateY(2px); }
        100% { transform: translateY(0px); }
      }

      .fadeApp {
        animation: fadeApp .45s ease forwards;
      }

      .dotJump {
        display:inline-block;
        animation: dotBounce .9s ease infinite;
      }

    `;

    document.head.appendChild(style);

  }, []);

  return (

    <div style={S.page}>

      <div
        className="fadeApp"
        style={{
          ...S.center,
          opacity: visible ? 1 : 0
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

  page:{
    height:"100vh",
    width:"100%",
    overflow:"hidden",
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
    color:ORANGE
  }

};
