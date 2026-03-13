import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";

export default function Onboarding() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [goal, setGoal] = useState("Hipertrofia");
  const [freq, setFreq] = useState(3);
  const [level, setLevel] = useState("Iniciante");

  useEffect(() => {
    if (user?.user_metadata?.nome) {
      setNome(user.user_metadata.nome);
    } else if (user?.email) {
      setNome(user.email.split("@")[0]);
    }
  }, [user]);

  function saudacao() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }

  async function concluir() {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email
        },
        { onConflict: "id" }
      );

    const { error } = await supabase
      .from("profiles")
      .update({
        objetivo: goal,
        frequencia: freq,
        nivel: level,
        onboarded: true
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    nav("/dashboard", { replace: true });
  }

  const goals = [
    { name: "Hipertrofia", desc: "Ganhar massa muscular e força" },
    { name: "Emagrecimento", desc: "Reduzir gordura e melhorar condicionamento" },
    { name: "Performance", desc: "Melhorar desempenho e resistência" }
  ];

  const levels = [
    { name: "Iniciante", desc: "0–3 meses de treino" },
    { name: "Intermediário", desc: "3–18 meses" },
    { name: "Avançado", desc: "18+ meses" }
  ];

  return (
    <div style={S.page}>
      
      {/* HEADER */}
      <div style={S.header}>
        <h2 style={S.sauda}>
          {saudacao()}, {nome}
        </h2>

        <h1 style={S.title}>
          Bem-vindo ao <span style={{color:ORANGE}}>FitDeal</span>
        </h1>

        <p style={S.subtitle}>
          Vamos montar um plano que realmente evolua seu treino.
        </p>
      </div>

      {/* PROGRESS */}
      <div style={S.progress}>
        <div style={{...S.bar, width:`${step*33}%`}} />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <h3 style={S.q}>Qual seu principal objetivo?</h3>

          {goals.map(g=>(
            <div
              key={g.name}
              style={{
                ...S.card,
                borderColor: goal===g.name ? ORANGE : "#ddd",
                background: goal===g.name ? "#fff4ec" : "white"
              }}
              onClick={()=>setGoal(g.name)}
            >
              <b>{g.name}</b>
              <p>{g.desc}</p>
            </div>
          ))}

          <button style={S.btn} onClick={()=>setStep(2)}>
            Continuar
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <h3 style={S.q}>Quantas vezes por semana você treina?</h3>

          <div style={S.freq}>
            {[2,3,4,5,6].map(n=>(
              <div
                key={n}
                style={{
                  ...S.freqCard,
                  background: freq===n ? ORANGE : "#f1f5f9",
                  color: freq===n ? "white" : "#0f172a"
                }}
                onClick={()=>setFreq(n)}
              >
                {n}x
              </div>
            ))}
          </div>

          <div style={S.nav}>
            <button style={S.back} onClick={()=>setStep(1)}>Voltar</button>
            <button style={S.btn} onClick={()=>setStep(3)}>Continuar</button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <h3 style={S.q}>Seu nível atual?</h3>

          {levels.map(l=>(
            <div
              key={l.name}
              style={{
                ...S.card,
                borderColor: level===l.name ? ORANGE : "#ddd",
                background: level===l.name ? "#fff4ec" : "white"
              }}
              onClick={()=>setLevel(l.name)}
            >
              <b>{l.name}</b>
              <p>{l.desc}</p>
            </div>
          ))}

          <div style={S.nav}>
            <button style={S.back} onClick={()=>setStep(2)}>Voltar</button>
            <button style={S.btn} onClick={concluir}>
              Concluir
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const S = {
  page:{
    minHeight:"100vh",
    background:"#f8fafc",
    padding:"28px",
    fontFamily:"system-ui"
  },

  header:{
    marginBottom:30
  },

  sauda:{
    fontSize:18,
    color:"#64748b",
    marginBottom:8
  },

  title:{
    fontSize:32,
    fontWeight:800,
    marginBottom:10
  },

  subtitle:{
    color:"#475569",
    fontSize:15
  },

  progress:{
    height:6,
    background:"#e2e8f0",
    borderRadius:20,
    marginBottom:30
  },

  bar:{
    height:"100%",
    background:ORANGE,
    borderRadius:20
  },

  q:{
    fontSize:22,
    marginBottom:16
  },

  card:{
    padding:18,
    borderRadius:18,
    border:"2px solid #ddd",
    marginBottom:12,
    cursor:"pointer"
  },

  freq:{
    display:"flex",
    gap:10,
    flexWrap:"wrap",
    marginBottom:30
  },

  freqCard:{
    padding:"14px 20px",
    borderRadius:12,
    fontWeight:700,
    cursor:"pointer"
  },

  btn:{
    width:"100%",
    padding:16,
    borderRadius:14,
    border:"none",
    background:ORANGE,
    color:"white",
    fontWeight:700,
    fontSize:16
  },

  back:{
    padding:16,
    borderRadius:14,
    border:"none",
    background:"#e2e8f0",
    fontWeight:700
  },

  nav:{
    display:"flex",
    gap:10
  }
}
