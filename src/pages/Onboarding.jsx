import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const BG = "#f8fafc";

export default function Onboarding() {

  const nav = useNavigate();
  const { user } = useAuth();

  const [step,setStep] = useState(0);
  const [nome,setNome] = useState("");
  const [nivel,setNivel] = useState(null);
  const [freq,setFreq] = useState(null);
  const [split,setSplit] = useState(null);

  const touchStartX = useRef(null);

  useEffect(()=>{
    if(user?.user_metadata?.nome){
      setNome(user.user_metadata.nome)
    } else if(user?.email){
      setNome(user.email.split("@")[0])
    }
  },[user])

  function saudacao(){
    const h = new Date().getHours()
    if(h < 12) return "Bom dia"
    if(h < 18) return "Boa tarde"
    return "Boa noite"
  }

  async function concluir(){

    const { data:{user} } = await supabase.auth.getUser()

    await supabase
      .from("profiles")
      .upsert({
        id:user.id,
        email:user.email
      },{onConflict:"id"})

    const {error} = await supabase
      .from("profiles")
      .update({
        nivel,
        frequencia:freq,
        split,
        onboarded:true
      })
      .eq("id",user.id)

    if(error){
      console.error(error)
      return
    }

    nav("/dashboard",{replace:true})
  }

  function next(){
    if(step < 2){
      setStep(step+1)
    }
  }

  function prev(){
    if(step > 0){
      setStep(step-1)
    }
  }

  function handleTouchStart(e){
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e){

    if(!touchStartX.current) return

    const delta = e.changedTouches[0].clientX - touchStartX.current

    if(delta > 80){
      prev()
    }

    if(delta < -80){
      next()
    }

    touchStartX.current = null
  }

  const niveis = [
    {
      name:"Iniciante",
      desc:"0–3 meses de treino",
      info:"Você está começando agora. O foco será aprender execução perfeita, construir consistência e iniciar hipertrofia de forma segura."
    },
    {
      name:"Intermediário",
      desc:"3–18 meses",
      info:"Seu corpo já se adaptou ao treino. Podemos aumentar volume, intensidade e técnicas avançadas."
    },
    {
      name:"Avançado",
      desc:"18+ meses",
      info:"Seu treino pode ser altamente específico. Usaremos progressão agressiva, sobrecarga inteligente e estratégias avançadas."
    }
  ]

  const frequencias = [
    {v:2,label:"2x semana",info:"Treinos mais intensos e focados."},
    {v:3,label:"3x semana",info:"Equilíbrio ideal entre recuperação e evolução."},
    {v:4,label:"4x semana",info:"Maior volume e estímulo muscular."},
    {v:5,label:"5x semana",info:"Treino estruturado por grupos musculares."}
  ]

  const splits = [
    {
      name:"ABC",
      info:"Treino dividido em 3 sessões diferentes. Excelente para hipertrofia."
    },
    {
      name:"ABCD",
      info:"Divisão mais avançada. Permite volume alto e foco muscular."
    },
    {
      name:"Full Body",
      info:"Treina o corpo inteiro em cada sessão. Ideal para iniciantes."
    }
  ]

  function Card({title,desc,info,selected,onClick}){

    const [open,setOpen] = useState(false)

    function toggle(){
      setOpen(!open)
      onClick()
    }

    return(
      <div
        style={{
          ...S.card,
          borderColor:selected?ORANGE:"#e2e8f0",
          background:selected?"#fff4ec":"white"
        }}
        onClick={toggle}
      >
        <div style={S.cardTitle}>{title}</div>

        {desc && (
          <div style={S.cardDesc}>{desc}</div>
        )}

        {open && (
          <div style={S.cardInfo}>
            {info}
          </div>
        )}
      </div>
    )
  }

  return(
    <div
      style={S.page}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      <div style={S.logo}>
        fitdeal<span style={{color:ORANGE}}>.</span>
      </div>

      <div style={S.header}>
        {saudacao()}, {nome}
      </div>

      <div style={S.title}>
        Vamos montar seu treino ideal
      </div>

      {step===0 && (
        <>
          <div style={S.question}>
            Qual seu nível atual de treino {nome}?
          </div>

          {niveis.map(n=>(
            <Card
              key={n.name}
              title={n.name}
              desc={n.desc}
              info={n.info}
              selected={nivel===n.name}
              onClick={()=>setNivel(n.name)}
            />
          ))}

          <button
            disabled={!nivel}
            style={S.btn}
            onClick={next}
          >
            Continuar
          </button>
        </>
      )}

      {step===1 && (
        <>
          <div style={S.question}>
            Quantas vezes por semana você consegue treinar?
          </div>

          {frequencias.map(f=>(
            <Card
              key={f.v}
              title={f.label}
              info={f.info}
              selected={freq===f.v}
              onClick={()=>setFreq(f.v)}
            />
          ))}

          <button
            disabled={!freq}
            style={S.btn}
            onClick={next}
          >
            Continuar
          </button>
        </>
      )}

      {step===2 && (
        <>
          <div style={S.question}>
            Como você prefere dividir seu treino?
          </div>

          {splits.map(s=>(
            <Card
              key={s.name}
              title={s.name}
              info={s.info}
              selected={split===s.name}
              onClick={()=>setSplit(s.name)}
            />
          ))}

          <button
            disabled={!split}
            style={S.btn}
            onClick={concluir}
          >
            Concluir
          </button>
        </>
      )}

    </div>
  )
}

const S = {

  page:{
    minHeight:"100vh",
    background:BG,
    padding:28,
    fontFamily:"system-ui"
  },

  logo:{
    fontSize:28,
    fontWeight:800,
    marginBottom:20,
    color:TEXT
  },

  header:{
    fontSize:18,
    color:"#64748b",
    marginBottom:8
  },

  title:{
    fontSize:28,
    fontWeight:700,
    marginBottom:30
  },

  question:{
    fontSize:20,
    marginBottom:18,
    fontWeight:600
  },

  card:{
    padding:18,
    borderRadius:16,
    border:"2px solid",
    marginBottom:12,
    cursor:"pointer",
    transition:"all .2s ease"
  },

  cardTitle:{
    fontWeight:700,
    fontSize:17
  },

  cardDesc:{
    color:"#64748b",
    fontSize:14
  },

  cardInfo:{
    marginTop:10,
    fontSize:14,
    color:"#475569",
    lineHeight:1.4
  },

  btn:{
    marginTop:30,
    width:"100%",
    padding:16,
    borderRadius:16,
    border:"none",
    background:ORANGE,
    color:"white",
    fontWeight:700,
    fontSize:16
  }

}
