import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function Onboarding() {

  const { user } = useAuth();
  const nav = useNavigate();

  const [step,setStep] = useState(1);
  const [expanded,setExpanded] = useState(null);
  const [nome,setNome] = useState("");

  const [goal,setGoal] = useState(null);
  const [freq,setFreq] = useState(null);
  const [level,setLevel] = useState(null);

  useEffect(()=>{

    if(user?.user_metadata?.nome){
      setNome(user.user_metadata.nome)
    }else if(user?.email){
      setNome(user.email.split("@")[0])
    }

  },[user])

  function saudacao(){

    const h = new Date().getHours()

    if(h<12) return "Bom dia"
    if(h<18) return "Boa tarde"
    return "Boa noite"

  }

  async function concluir(){

    const { data:{ user } } = await supabase.auth.getUser()

    await supabase.from("profiles").upsert({
      id:user.id,
      email:user.email
    },{onConflict:"id"})

    await supabase
      .from("profiles")
      .update({
        objetivo:goal,
        frequencia:freq,
        nivel:level,
        onboarded:true
      })
      .eq("id",user.id)

    nav("/dashboard",{replace:true})

  }

  const objetivos = [

    {
      name:"Hipertrofia",
      desc:"Foco em aumento de massa muscular.",
      gains:"Maior volume muscular, força progressiva."
    },

    {
      name:"Emagrecimento",
      desc:"Redução de gordura corporal.",
      gains:"Maior gasto calórico e condicionamento."
    },

    {
      name:"Performance",
      desc:"Treino para desempenho físico.",
      gains:"Explosão, resistência e força."
    }

  ]

  const niveis = [

    {
      name:"Iniciante",
      desc:"0–3 meses de treino",
      metrics:"Adaptação neural e coordenação"
    },

    {
      name:"Intermediário",
      desc:"3–18 meses",
      metrics:"Volume progressivo e hipertrofia"
    },

    {
      name:"Avançado",
      desc:"18+ meses",
      metrics:"Alta intensidade e periodização"
    }

  ]

  function toggle(i){

    if(expanded===i){
      setExpanded(null)
    }else{
      setExpanded(i)
    }

  }

  return(

    <div className="onboarding">

      {/* HEADER */}

      <div className="onb-header">

        <div className="logo">
          fitdeal<span className="dot">.</span>
        </div>

        <div className="hello">
          {saudacao()}, {nome}
        </div>

      </div>


      {/* PERGUNTA */}

      {step===1 && (

        <>
        <h2>
          Qual seu objetivo de treino {nome}?
        </h2>

        {objetivos.map((o,i)=>(

          <div
          key={o.name}
          className={`card ${goal===o.name ? "active":""}`}
          onClick={()=>{

            setGoal(o.name)
            toggle(i)

          }}
          >

            <div className="card-title">

              {o.name}

            </div>

            {expanded===i && (

              <div className="card-expand">

                <p>{o.desc}</p>
                <p className="metric">{o.gains}</p>

              </div>

            )}

          </div>

        ))}

        {goal && (
          <button onClick={()=>setStep(2)} className="btn">
            Continuar
          </button>
        )}

        </>

      )}


      {step===2 && (

        <>
        <h2>
          Quantas vezes por semana você treina {nome}?
        </h2>

        <div className="freq">

          {[2,3,4,5,6].map(n=>(

            <div
            key={n}
            className={`freq-card ${freq===n?"active":""}`}
            onClick={()=>setFreq(n)}
            >
              {n}x
            </div>

          ))}

        </div>

        {freq && (
          <button onClick={()=>setStep(3)} className="btn">
            Continuar
          </button>
        )}

        </>

      )}


      {step===3 && (

        <>
        <h2>
          Qual seu nível atual de treino {nome}?
        </h2>

        {niveis.map((n,i)=>(

          <div
          key={n.name}
          className={`card ${level===n.name?"active":""}`}
          onClick={()=>{

            setLevel(n.name)
            toggle(i)

          }}
          >

            <div className="card-title">

              {n.name}

            </div>

            {expanded===i && (

              <div className="card-expand">

                <p>{n.desc}</p>
                <p className="metric">{n.metrics}</p>

              </div>

            )}

          </div>

        ))}

        {level && (

          <button
          className="btn"
          onClick={concluir}
          >
            Concluir
          </button>

        )}

        </>

      )}

    </div>

  )

}
