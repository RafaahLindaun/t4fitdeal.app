import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const BG = "#f8fafc";

export default function AuthCallback() {

  const nav = useNavigate();
  const [step, setStep] = useState("Conectando");
  const [progress, setProgress] = useState(20);

  useEffect(() => {

    const run = async () => {

      setStep("Conectando");
      setProgress(40);

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        nav("/dashboard", { replace: true });
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (event, session) => {

          if (event === "SIGNED_IN" && session) {

            setStep("Verificando conta");
            setProgress(70);

            await new Promise(r => setTimeout(r, 300));

            setStep("Carregando menu");
            setProgress(100);

            await new Promise(r => setTimeout(r, 300));

            nav("/dashboard", { replace: true });

          }

        }
      );

      setTimeout(() => {
        nav("/login", { replace: true });
      }, 4000);

      return () => listener.subscription.unsubscribe();

    };

    run();

  }, [nav]);

  useEffect(() => {

    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes spin {from{transform:rotate(0)}to{transform:rotate(360deg)}}
      .authSpin{animation:spin .9s linear infinite}
    `;

    document.head.appendChild(style);

  }, []);

  return (

    <div style={S.page}>

      <div style={S.card}>

        <div style={S.loaderTrack}>
          <div style={S.loader} className="authSpin"/>
        </div>

        <div style={S.step}>
          {step}...
        </div>

        <div style={S.bar}>
          <div style={{...S.fill,width:progress+"%"}}/>
        </div>

      </div>

    </div>

  );

}

const S = {

  page:{
    height:"100vh",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    background:BG
  },

  card:{
    width:320,
    padding:32,
    borderRadius:28,
    background:"white",
    border:"1px solid rgba(15,23,42,.06)",
    boxShadow:"0 20px 60px rgba(15,23,42,.08)",
    textAlign:"center"
  },

  loaderTrack:{
    width:44,
    height:44,
    borderRadius:"50%",
    border:"3px solid rgba(255,106,0,.15)",
    margin:"0 auto 16px auto",
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  loader:{
    width:34,
    height:34,
    borderRadius:"50%",
    border:"3px solid transparent",
    borderTop:`3px solid ${ORANGE}`
  },

  step:{
    fontSize:16,
    fontWeight:700,
    color:TEXT,
    marginBottom:16
  },

  bar:{
    height:6,
    background:"rgba(15,23,42,.06)",
    borderRadius:999,
    overflow:"hidden"
  },

  fill:{
    height:"100%",
    background:ORANGE,
    transition:"width .4s"
  }

};
