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

      try {

        // processa retorno OAuth
        await supabase.auth.getSessionFromUrl({ storeSession: true });

      } catch (e) {}

      // pega sessão
      const { data } = await supabase.auth.getSession();

      if (data?.session) {

        setTimeout(() => {
          nav("/dashboard", { replace: true });
        }, 600);

        return;

      }

      // escuta caso sessão chegue depois
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {

          if (session) {

            setTimeout(() => {
              nav("/dashboard", { replace: true });
            }, 600);

          }

        }
      );

      return () => listener.subscription.unsubscribe();

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

      @keyframes spin {
        from {transform:rotate(0deg)}
        to {transform:rotate(360deg)}
      }

      .fitdealFade {
        animation: fadeApp .45s ease forwards;
      }

      .fitdealSpin {
        animation: spin .9s linear infinite;
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

        <div style={S.loaderWrap}>
          <div style={S.loaderTrack}>
            <div className="fitdealSpin" style={S.loader}/>
          </div>
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
    color:ORANGE
  },

  loaderWrap:{
    marginTop:18,
    display:"flex",
    justifyContent:"center"
  },

  loaderTrack:{
    width:32,
    height:32,
    borderRadius:"50%",
    border:"2px solid rgba(255,106,0,.2)",
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  loader:{
    width:22,
    height:22,
    borderRadius:"50%",
    border:"2px solid transparent",
    borderTop:`2px solid ${ORANGE}`
  }

};
