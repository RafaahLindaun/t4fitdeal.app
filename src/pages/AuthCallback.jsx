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

      // pega sessão atual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        finish("/login");
        return;
      }

      // busca profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        finish("/onboarding");
        return;
      }

      if (profile.onboarded) {
        finish("/dashboard");
      } else {
        finish("/onboarding");
      }

    };

    function finish(path) {

      setVisible(false);

      setTimeout(() => {
        nav(path, { replace: true });
      }, 350);

    }

    start();

  }, [nav]);

  useEffect(() => {

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

    const style = document.createElement("style");

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

      .fitdealFade {
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
        className="fitdealFade"
        style={{
          ...S.center,
          opacity: visible ? 1 : 0,
          transition:"opacity .45s ease"
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
