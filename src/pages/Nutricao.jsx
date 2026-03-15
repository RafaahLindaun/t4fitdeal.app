import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ORANGE = "#FF6A00"
const TEXT = "#0f172a"
const MUTED = "#64748b"

/* =========================
HELPERS
========================= */

function clamp(n,a,b){
 return Math.max(a,Math.min(b,n))
}

function waterGoalMl(pesoKg=80){
 const kg = Number(pesoKg||0)||80
 return clamp(Math.round(kg*35),1800,5000)
}

/* =========================
COMPONENT
========================= */

export default function Nutricao(){

 const nav = useNavigate()
 const {user} = useAuth()

 const email = (user?.email||"anon").toLowerCase()

 const peso = Number(user?.peso||80)

 const goalMl = useMemo(()=>waterGoalMl(peso),[peso])

 const today = new Date().toISOString().slice(0,10)

 const waterKey = `water_${email}_${today}`

 const [water,setWater] = useState(()=>{
   const v = Number(localStorage.getItem(waterKey)||0)
   return v||0
 })

 function addWater(v){
   const next = clamp(water+v,0,goalMl*2)
   setWater(next)
   localStorage.setItem(waterKey,next)
 }

 function resetWater(){
   setWater(0)
   localStorage.setItem(waterKey,0)
 }

 const waterPct = Math.round((water/goalMl)*100)

 /* =========================
 FAVORITOS
 ========================= */

 const favKey=`nutri_fav_${email}`

 const [fav,setFav]=useState(()=>{
  try{
   const raw=localStorage.getItem(favKey)
   return raw?JSON.parse(raw):{}
  }catch{
   return{}
  }
 })

 function getBaseId(id){
  const p=id.split("_")
  p.pop()
  return p.join("_")
 }

 function toggleFav(recipe){

  const baseId=getBaseId(recipe.id)

  const next={
   ...fav,
   [baseId]:!fav[baseId]
  }

  setFav(next)

  localStorage.setItem(favKey,JSON.stringify(next))
 }

 /* =========================
 RECIPES
 ========================= */

 const {RECIPE_BANK}=window

 const [mealTab,setMealTab]=useState("cafe")
 const [query,setQuery]=useState("")
 const [showFav,setShowFav]=useState(false)

 const recipes = RECIPE_BANK?.[mealTab] || []

 const filtered = useMemo(()=>{

  let list=[...recipes]

  if(query){

   const q=query.toLowerCase()

   list=list.filter(r=>
    r.title.toLowerCase().includes(q)
   )

  }

  if(showFav){

   list=list.filter(r=>{
    const id=getBaseId(r.id)
    return fav[id]
   })

  }

  return list

 },[recipes,query,showFav,fav])

 /* =========================
 UI
 ========================= */

 return(

 <div style={S.page}>

 {/* HEADER */}

 <div style={S.header}>

  <div>

   <div style={S.logo}>
    fitdeal<span style={{color:ORANGE}}>.</span>
   </div>

   <div style={S.subtitle}>
    Nutrição inteligente
   </div>

  </div>

  <button
  style={S.back}
  onClick={()=>nav("/dashboard")}
  >
  Voltar
  </button>

 </div>


 {/* HIDRATAÇÃO */}

 <div style={S.card}>

  <div style={S.cardTitle}>
   Hidratação<span style={{color:ORANGE}}>.</span>
  </div>

  <div style={S.progress}>

   <div
   style={{
    ...S.progressBar,
    width:`${waterPct}%`
   }}
   />

  </div>

  <div style={S.waterRow}>

   <button style={S.waterBtn} onClick={()=>addWater(200)}>+200</button>
   <button style={S.waterBtn} onClick={()=>addWater(300)}>+300</button>
   <button style={S.waterBtn} onClick={()=>addWater(500)}>+500</button>

   <button style={S.waterReset} onClick={resetWater}>
    Reset
   </button>

  </div>

  <div style={S.waterText}>
   {water} ml hoje
  </div>

 </div>


 {/* SUPLEMENTAÇÃO */}

 <button
 style={S.supp}
 onClick={()=>nav("/suplementacao")}
 >
 Plano de suplementos<span style={{color:ORANGE}}>.</span>
 </button>


 {/* TABS */}

 <div style={S.tabs}>

 {[
  {k:"cafe",t:"Café"},
  {k:"almoco",t:"Almoço"},
  {k:"janta",t:"Janta"}
 ].map(x=>{

  const on=mealTab===x.k

  return(

   <button
   key={x.k}
   style={{
    ...S.tab,
    ...(on?S.tabOn:S.tabOff)
   }}
   onClick={()=>setMealTab(x.k)}
   >

   {x.t}

   </button>

  )

 })}

 </div>


 {/* SEARCH */}

 <div style={S.searchRow}>

 <input
 value={query}
 onChange={e=>setQuery(e.target.value)}
 placeholder="Buscar receita..."
 style={S.search}
 />

 <button
 style={{
  ...S.favBtn,
  ...(showFav?S.favOn:S.favOff)
 }}
 onClick={()=>setShowFav(v=>!v)}
 >
 ★
 </button>

 </div>


 {/* LISTA */}

 <div style={S.list}>

 {filtered.map(r=>{

 const baseId=getBaseId(r.id)
 const isFav=fav[baseId]

 return(

 <div
 key={r.id}
 style={S.recipe}
 >

  <div style={S.recipeTop}>

   <div>

    <div style={S.recipeTitle}>
     {r.title}
    </div>

   </div>

   <button
   style={{
    ...S.star,
    ...(isFav?S.starOn:S.starOff)
   }}
   onClick={()=>toggleFav(r)}
   >
   ★
   </button>

  </div>

 </div>

 )

 })}

 </div>

 </div>

 )

}

/* =========================
STYLES
========================= */

const S={

page:{
 padding:20,
 paddingBottom:120,
 background:"#f8fafc"
},

header:{
 display:"flex",
 justifyContent:"space-between",
 alignItems:"center",
 marginBottom:18
},

logo:{
 fontSize:22,
 fontWeight:900,
 color:TEXT
},

subtitle:{
 fontSize:12,
 color:MUTED,
 marginTop:4
},

back:{
 padding:"10px 14px",
 borderRadius:12,
 border:"1px solid #e2e8f0",
 background:"#fff",
 fontWeight:700
},

card:{
 background:"#fff",
 borderRadius:20,
 padding:16,
 marginBottom:14,
 border:"1px solid #e5e7eb"
},

cardTitle:{
 fontWeight:900,
 marginBottom:10
},

progress:{
 height:10,
 borderRadius:999,
 background:"#e5e7eb",
 overflow:"hidden"
},

progressBar:{
 height:"100%",
 background:`linear-gradient(90deg,${ORANGE},#ff8a3d)`
},

waterRow:{
 marginTop:12,
 display:"flex",
 gap:8
},

waterBtn:{
 flex:1,
 padding:10,
 borderRadius:12,
 border:"1px solid #e5e7eb",
 background:"#fff",
 fontWeight:800
},

waterReset:{
 padding:10,
 borderRadius:12,
 border:"1px solid #e5e7eb",
 background:"#fff"
},

waterText:{
 marginTop:10,
 fontWeight:700,
 color:MUTED
},

supp:{
 width:"100%",
 padding:16,
 borderRadius:20,
 background:"#0B0C0F",
 color:"#fff",
 border:"none",
 fontWeight:800,
 marginBottom:14
},

tabs:{
 display:"grid",
 gridTemplateColumns:"1fr 1fr 1fr",
 gap:8,
 marginBottom:12
},

tab:{
 padding:12,
 borderRadius:999,
 border:"1px solid #e5e7eb",
 fontWeight:800
},

tabOn:{
 background:"#FFE7D7"
},

tabOff:{
 background:"#fff"
},

searchRow:{
 display:"flex",
 gap:10,
 marginBottom:12
},

search:{
 flex:1,
 padding:12,
 borderRadius:14,
 border:"1px solid #e5e7eb"
},

favBtn:{
 width:46,
 borderRadius:14,
 border:"1px solid #e5e7eb",
 fontSize:18
},

favOn:{
 background:ORANGE
},

favOff:{
 background:"#fff"
},

list:{
 display:"grid",
 gap:10
},

recipe:{
 background:"#fff",
 borderRadius:16,
 padding:14,
 border:"1px solid #e5e7eb"
},

recipeTop:{
 display:"flex",
 justifyContent:"space-between",
 alignItems:"center"
},

recipeTitle:{
 fontWeight:900
},

star:{
 width:38,
 height:38,
 borderRadius:12
},

starOn:{
 background:ORANGE
},

starOff:{
 background:"#fff"
}

}
