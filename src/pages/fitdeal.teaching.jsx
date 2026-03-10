import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"

const BG = "#f8fafc"
const TEXT = "#0f172a"
const MUTED = "#64748b"
const ORANGE = "#FF6A00"

export default function FitdealTeaching(){

const nav = useNavigate()

const [connecting,setConnecting] = useState(false)
const [msg,setMsg] = useState("")

async function connectGoogle(){

setConnecting(true)
setMsg("")

try{

const {error} = await supabase.auth.signInWithOAuth({
provider:"google",
options:{
redirectTo:window.location.origin + "/auth/callback"
}
})

if(error){
setMsg("Erro ao conectar conta Google")
}

}catch(e){
setMsg("Falha ao iniciar conexão")
}

setConnecting(false)

}

return(

<div style={S.page}>

<div style={S.header}>

<button style={S.back} onClick={()=>nav(-1)}>
←
</button>

<div>

<div style={S.title}>
fitdeal<span style={{color:ORANGE}}>.</span> teaching
</div>

<div style={S.subtitle}>
Guia técnico do funcionamento do sistema de treinos
</div>

</div>

</div>


<div style={S.hero}>

<img
src="/images/fitness-hero.jpg"
style={S.heroImg}
/>

<div style={S.heroOverlay}>

<div style={S.heroTitle}>
Treinos inteligentes baseados em ciência
</div>

<div style={S.heroText}>
O sistema do app cria divisões de treino automáticas com base em frequência semanal,
objetivo do usuário e progressão de volume.
</div>

</div>

</div>


<div style={S.section}>

<div style={S.sectionTitle}>
Conectar contas
</div>

<div style={S.card}>

<div style={S.cardTitle}>
Sincronização de perfil
</div>

<div style={S.cardText}>
Conecte sua conta Google ou Apple para sincronizar seus treinos,
histórico de progresso e preferências entre dispositivos.
</div>

<button
style={S.connectBtn}
onClick={connectGoogle}
disabled={connecting}
>

{connecting ? "Conectando..." : "Conectar Google"}

</button>

{msg && <div style={S.msg}>{msg}</div>}

</div>

</div>



<div style={S.section}>

<div style={S.sectionTitle}>
Sistema de treino do app
</div>

<div style={S.grid}>

<Card
title="Split inteligente"
text="O sistema cria automaticamente divisões de treino (AB, ABC, ABCD) com base na frequência semanal escolhida pelo usuário."
/>

<Card
title="Progressão de volume"
text="O volume semanal de séries é calculado automaticamente para manter equilíbrio entre grupos musculares."
/>

<Card
title="Catálogo de exercícios"
text="O banco interno possui centenas de exercícios categorizados por grupo muscular."
/>

<Card
title="Personalização avançada"
text="Usuários premium podem editar completamente a estrutura de exercícios."
/>

</div>

</div>



<div style={S.section}>

<div style={S.sectionTitle}>
Arquitetura técnica
</div>

<div style={S.longCard}>

<div style={S.techTitle}>
Banco de dados
</div>

<div style={S.techText}>
Os treinos são armazenados na tabela <b>profiles</b> utilizando campos JSON
para permitir flexibilidade na estrutura de exercícios.
</div>

<div style={S.techTitle}>
Geração automática
</div>

<div style={S.techText}>
O sistema utiliza funções internas para gerar splits automaticamente com base
nos parâmetros fornecidos durante o onboarding.
</div>

<div style={S.techTitle}>
Atualização por treinador
</div>

<div style={S.techText}>
Treinadores podem editar o treino diretamente no banco através
da interface TreinoPorProfessor.
</div>

</div>

</div>



<div style={S.section}>

<div style={S.sectionTitle}>
Como o treino é calculado
</div>

<div style={S.timeline}>

<Step
n="1"
title="Objetivo do usuário"
text="Durante o onboarding o usuário define hipertrofia, força ou condicionamento."
/>

<Step
n="2"
title="Frequência semanal"
text="O sistema calcula a divisão de treino com base na quantidade de dias."
/>

<Step
n="3"
title="Distribuição muscular"
text="Os grupos musculares são distribuídos para evitar sobrecarga."
/>

<Step
n="4"
title="Exercícios"
text="Exercícios são escolhidos automaticamente do catálogo."
/>

</div>

</div>



<div style={S.footer}>

<button
style={S.startBtn}
onClick={()=>nav("/dashboard")}
>

Ir para o app

</button>

</div>


</div>

)

}



function Card({title,text}){

return(

<div style={SC.card}>

<div style={SC.title}>
{title}
</div>

<div style={SC.text}>
{text}
</div>

</div>

)

}



function Step({n,title,text}){

return(

<div style={ST.row}>

<div style={ST.badge}>
{n}
</div>

<div>

<div style={ST.title}>
{title}
</div>

<div style={ST.text}>
{text}
</div>

</div>

</div>

)

}



const S={

page:{
background:BG,
minHeight:"100vh",
padding:20,
paddingBottom:120
},

header:{
display:"flex",
gap:14,
alignItems:"center",
marginBottom:20
},

back:{
width:44,
height:44,
borderRadius:14,
border:"1px solid rgba(0,0,0,.08)",
background:"#fff",
fontWeight:900
},

title:{
fontSize:22,
fontWeight:900,
color:TEXT
},

subtitle:{
fontSize:13,
color:MUTED
},

hero:{
position:"relative",
borderRadius:20,
overflow:"hidden",
marginBottom:26
},

heroImg:{
width:"100%",
height:220,
objectFit:"cover"
},

heroOverlay:{
position:"absolute",
bottom:0,
left:0,
right:0,
padding:20,
background:"linear-gradient(transparent,rgba(0,0,0,.6))",
color:"#fff"
},

heroTitle:{
fontWeight:900,
fontSize:18
},

heroText:{
fontSize:13,
opacity:.9
},

section:{
marginBottom:30
},

sectionTitle:{
fontSize:16,
fontWeight:900,
marginBottom:12
},

card:{
padding:18,
borderRadius:18,
background:"#fff",
border:"1px solid rgba(0,0,0,.06)"
},

cardTitle:{
fontWeight:900,
marginBottom:6
},

cardText:{
fontSize:13,
color:MUTED
},

connectBtn:{
marginTop:14,
padding:12,
borderRadius:14,
border:"none",
background:ORANGE,
color:"#fff",
fontWeight:900
},

msg:{
marginTop:8,
fontSize:12,
color:MUTED
},

grid:{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:12
},

longCard:{
padding:18,
borderRadius:18,
background:"#fff",
border:"1px solid rgba(0,0,0,.06)"
},

techTitle:{
fontWeight:900,
marginTop:10
},

techText:{
fontSize:13,
color:MUTED
},

timeline:{
display:"flex",
flexDirection:"column",
gap:16
},

footer:{
marginTop:40
},

startBtn:{
width:"100%",
padding:16,
borderRadius:18,
border:"none",
background:"#0b0b0c",
color:"#fff",
fontWeight:900
}

}



const SC={

card:{
padding:16,
borderRadius:16,
background:"#fff",
border:"1px solid rgba(0,0,0,.06)"
},

title:{
fontWeight:900,
fontSize:14
},

text:{
fontSize:12,
color:MUTED,
marginTop:6
}

}



const ST={

row:{
display:"flex",
gap:12,
alignItems:"flex-start"
},

badge:{
width:32,
height:32,
borderRadius:999,
background:ORANGE,
color:"#fff",
fontWeight:900,
display:"flex",
alignItems:"center",
justifyContent:"center"
},

title:{
fontWeight:900
},

text:{
fontSize:13,
color:MUTED
}

}
