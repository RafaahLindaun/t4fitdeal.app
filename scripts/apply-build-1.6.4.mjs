import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);

function replaceOnce(file, before, after, label, optional = false) {
  const source = read(file);
  if (source.includes(after)) return false;
  if (!source.includes(before)) {
    if (optional) return false;
    throw new Error(`[1.6.4] ${label}: trecho não encontrado em ${file}`);
  }
  write(file, source.replace(before, after));
  return true;
}

function transform(file, fn) {
  const source = read(file);
  const next = fn(source);
  if (next !== source) write(file, next);
}

// Versionamento + camada final.
transform("package.json", (source) => source
  .replace('"version": "1.6.3"', '"version": "1.6.4"')
  .replace('node scripts/verify-visual-contracts-1.6.3.mjs', 'node scripts/verify-visual-contracts-1.6.4.mjs'));
transform("package-lock.json", (source) => source.replace(/"version": "1\.6\.3"/g, '"version": "1.6.4"'));
replaceOnce(
  "scr/main.tsx",
  'import "./styles/build-1.6.3.css";\n',
  'import "./styles/build-1.6.3.css";\nimport "./styles/build-1.6.4.css";\n',
  "import da camada 1.6.4",
);

// Staff: elimina a divisão histórica entre document scroll/internal scroll.
transform("scr/components/StaffLayout.tsx", (source) => {
  source = source.replace(/\n  const usesDocumentScroll = \[[\s\S]*?const usesInternalPageScroll = \["classes", "ranking", "notifications"\]\.includes\(active\);\n/, "\n");
  source = source.replace(
    'className={`accqua-staff-layout ${usesDocumentScroll ? "uses-document-scroll" : ""} ${usesInternalPageScroll ? "uses-internal-page-scroll" : ""} ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}',
    'className={`accqua-staff-layout uses-unified-mobile-scroll ${location.pathname.startsWith("/area-accqua/montar") ? "uses-builder-internal-scroll" : ""} ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}',
  );
  if (/usesDocumentScroll|usesInternalPageScroll/.test(source)) throw new Error("[1.6.4] contrato antigo de scroll Staff permaneceu");
  return source;
});

// Biblioteca: cards operacionais pertencem somente à visão Alunos.
transform("scr/pages/AdminArea.tsx", (source) => {
  const start = '            <section className="admin-work-queue admin-dashboard-statbar" aria-label="Resumo operacional">';
  if (!source.includes('{dashboardView === "students" ? (\n            <section className="admin-work-queue admin-dashboard-statbar"')) {
    if (!source.includes(start)) throw new Error("[1.6.4] statbar do AdminArea não encontrado");
    source = source.replace(start, '{dashboardView === "students" ? (\n' + start);
    const end = '            </section>\n\n            <section className={clsx("admin-area-search-wrap admin-dashboard-search-wrap", dashboardView === "students" && "is-student-sticky")}>';
    const after = '            </section>\n            ) : null}\n\n            <section className={clsx("admin-area-search-wrap admin-dashboard-search-wrap", dashboardView === "students" && "is-student-sticky")}>';
    if (!source.includes(end)) throw new Error("[1.6.4] fim da statbar do AdminArea não encontrado");
    source = source.replace(end, after);
  }
  return source;
});

// Modais de Modelos salvos e Assistente guiado usam o mesmo componente centralizado.
transform("scr/pages/WorkoutBuilderEntry.tsx", (source) => {
  if (!source.includes('import CenteredModal from "../components/CenteredModal";')) {
    source = source.replace(
      'import ResponsiveDialog from "../components/ResponsiveDialog";\n',
      'import ResponsiveDialog from "../components/ResponsiveDialog";\nimport CenteredModal from "../components/CenteredModal";\n',
    );
  }
  source = source
    .replace('      <ResponsiveDialog open={mode === "guide"}', '      <CenteredModal open={mode === "guide"}')
    .replace(
      '        </AnimatePresence>\n      </ResponsiveDialog>\n\n      <ResponsiveDialog open={mode === "templates"}',
      '        </AnimatePresence>\n      </CenteredModal>\n\n      <CenteredModal open={mode === "templates"}',
    )
    .replace(
      '      </ResponsiveDialog>\n\n      <ResponsiveDialog open={mode === "ai"}',
      '      </CenteredModal>\n\n      <ResponsiveDialog open={mode === "ai"}',
    )
    .replace('                  <p>Isso define o estilo do treino — dá para mudar depois.</p>\n', '')
    .replace('                  <p>É só um ponto de partida; tudo poderá ser revisado no editor.</p>\n', '')
    .replace('                  <p>A divisão se ajusta sozinha a partir disso.</p>\n', '');
  return source;
});

// Revisão: move o resumo completo para dentro da quarta etapa, antes do cardio.
transform("scr/pages/AdminWorkoutBuilder.tsx", (source) => {
  const stageMarker = '        <div className="admin-builder-stage-v163 is-revisao">\n';
  const reviewStartToken = '        <section className="admin-builder-review-summary admin-builder-anchor" aria-label="Resumo do treino para revisão">';
  const alreadyPlaced = source.indexOf(stageMarker) >= 0 && source.indexOf(reviewStartToken) > source.indexOf(stageMarker) && source.indexOf(reviewStartToken) < source.indexOf('className="admin-builder-cardio admin-builder-anchor"');
  if (alreadyPlaced) return source;
  const reviewStart = source.indexOf(reviewStartToken);
  if (reviewStart < 0) throw new Error("[1.6.4] resumo de revisão não encontrado");
  const closeToken = '\n        </section>\n        </div>\n        ) : null}';
  const reviewClose = source.indexOf(closeToken, reviewStart);
  if (reviewClose < 0) throw new Error("[1.6.4] fechamento do resumo de revisão não encontrado");
  const reviewEnd = reviewClose + '\n        </section>'.length;
  const reviewBlock = source.slice(reviewStart, reviewEnd);
  source = source.slice(0, reviewStart) + source.slice(reviewEnd);
  if (!source.includes(stageMarker)) throw new Error("[1.6.4] etapa Revisão não encontrada");
  return source.replace(stageMarker, stageMarker + reviewBlock + '\n\n');
});

// Loja: receita IA centralizada, erro explícito e exclusão real de reservas.
transform("scr/pages/StoreAdmin.tsx", (source) => {
  if (!source.includes('import CenteredModal from "../components/CenteredModal";')) {
    source = source.replace(
      'import ResponsiveDialog from "../components/ResponsiveDialog";\n',
      'import ResponsiveDialog from "../components/ResponsiveDialog";\nimport CenteredModal from "../components/CenteredModal";\n',
    );
  }
  if (!source.includes('staffDeleteReservation,')) {
    source = source.replace('  staffSetReservationStatus,\n', '  staffSetReservationStatus,\n  staffDeleteReservation,\n');
  }
  if (!source.includes('type StoreReservation,')) {
    source = source.replace('  type StoreProduct,\n', '  type StoreProduct,\n  type StoreReservation,\n');
  }
  source = source.replace(
    ' const [aiCreateOpen,setAiCreateOpen]=useState(false);const [aiPrompt,setAiPrompt]=useState("");const [aiCreateStage,setAiCreateStage]=useState<"input"|"generating">("input");const [aiProgressIndex,setAiProgressIndex]=useState(0);',
    ' const [aiCreateOpen,setAiCreateOpen]=useState(false);const [aiPrompt,setAiPrompt]=useState("");const [aiCreateStage,setAiCreateStage]=useState<"input"|"generating">("input");const [aiProgressIndex,setAiProgressIndex]=useState(0);const [aiCreateError,setAiCreateError]=useState("");',
  );
  if (!source.includes('reservationDeleteTarget')) {
    source = source.replace(
      ' const [deleteTarget,setDeleteTarget]=useState<{kind:"product"|"recipe";id:string;name:string}|null>(null);',
      ' const [deleteTarget,setDeleteTarget]=useState<{kind:"product"|"recipe";id:string;name:string}|null>(null);const [reservationDeleteTarget,setReservationDeleteTarget]=useState<StoreReservation|null>(null);',
    );
  }
  if (!source.includes('const reservationDelete=useMutation')) {
    const statusMutation = ' const status=useMutation({mutationFn:({id,next}:{id:string;next:"retirado"|"cancelado"})=>staffSetReservationStatus(id,next),onSuccess:()=>{toast.success("Reserva atualizada.");void qc.invalidateQueries({queryKey:["staff-reservations"]});void qc.invalidateQueries({queryKey:["staff-products"]})}});';
    const deleteMutation = statusMutation + '\n const reservationDelete=useMutation({mutationFn:({id,allowWithdrawn}:{id:string;allowWithdrawn:boolean})=>staffDeleteReservation(id,allowWithdrawn),onSuccess:()=>{toast.success("Reserva excluída.");setReservationDeleteTarget(null);void qc.invalidateQueries({queryKey:["staff-reservations"]});void qc.invalidateQueries({queryKey:["staff-products"]})},onError:(error:any)=>toast.error(error?.message||"Não foi possível excluir a reserva.")});';
    if (!source.includes(statusMutation)) throw new Error("[1.6.4] mutation de status de reserva não encontrada");
    source = source.replace(statusMutation, deleteMutation);
  }

  source = source.replace(
    / const createWithAI=async\(\)=>\{[\s\S]*?setAiCreateStage\("input"\)\}\};\n return <div/,
    ' const createWithAI=async()=>{if(!aiPrompt.trim()||aiCreateStage==="generating")return;setAiCreateError("");setAiCreateStage("generating");setAiProgressIndex(0);console.info("[ACCQUA][recipe-ai] generation started");try{const draft=await generateRecipeWithAI(aiPrompt);const next:RecipeAdminInput={name:draft.name,imageUrl:draft.imageUrl,imageValidated:false,imageConfidence:draft.imageConfidence,imageSource:draft.imageSource,macrosEstimatedAi:draft.macrosEstimatedAi,objectiveCategories:draft.objectiveCategories.length?draft.objectiveCategories:["emagrecimento"],mealCategory:draft.mealCategory,dayPeriod:draft.dayPeriod,calorieLevel:"",healthLevel:draft.healthLevel,kcal:draft.kcal,protein:draft.protein,carbs:draft.carbs,fat:draft.fat,portionDescription:draft.portionDescription,ingredients:draft.ingredients,instructions:draft.instructions,active:true};setRecipeEditing({id:"",...next,aiScore:draft.imageConfidence,aiReason:draft.imageReason});setRecipeForm(next);setIngredientsText(JSON.stringify(draft.ingredients,null,2));setAiCreateOpen(false);setAiPrompt("");setAiCreateStage("input");console.info("[ACCQUA][recipe-ai] generation completed");if(draft.macrosEstimatedAi)toast.warning("A TACO não confirmou todos os ingredientes. Revise os macros destacados antes de salvar.");else toast.success("Rascunho criado com macros calculados pela TACO. Revise antes de salvar.")}catch(error){const message=error instanceof Error?error.message:"Não foi possível criar a receita com IA.";console.error("[ACCQUA][recipe-ai] generation failed",error);setAiCreateError(message);toast.error(message);setAiCreateStage("input")}};\n return <div',
  );

  source = source.replace('onClick={()=>setAiCreateOpen(true)} aria-label="Criar receita com IA"', 'onClick={()=>{setAiCreateError("");setAiCreateOpen(true)}} aria-label="Criar receita com IA"');

  const reservationsPattern = /\{tab==="reservas"\?<><div className="store-admin-section-title">[\s\S]*?<\/div><\/>:null\}\n    \{tab==="receitas"/;
  if (!source.includes('store-reservation-swipe-v164')) {
    const reservationsReplacement = `{tab==="reservas"?<><div className="store-admin-section-title"><div><small>RETIRADA</small><h1>Reservas</h1></div><span>{pendingReservations.filter(r=>r.status==="reservado").length} pendentes</span></div><div className="store-admin-list">{pendingReservations.map(r=><SwipeableListItem key={r.id} className="store-reservation-swipe-v164" onDelete={()=>setReservationDeleteTarget(r)} deleteLabel="Excluir reserva" disabled={reservationDelete.isPending}><article><div className="store-admin-thumb">{r.product?.imageUrl?<img src={r.product.imageUrl} alt=""/>:"•"}</div><div><strong>{r.studentName}</strong><span>{r.product?.name??"Produto"}</span><small>{new Date(r.reservedAt).toLocaleString("pt-BR")} · {r.status}</small></div>{r.status==="reservado"?<div className="store-admin-row-actions"><button onClick={()=>status.mutate({id:r.id,next:"retirado"})}>Retirado</button><button className="danger" onClick={()=>status.mutate({id:r.id,next:"cancelado"})}>Cancelar</button></div>:null}</article></SwipeableListItem>)}</div></>:null}\n    {tab==="receitas"`;
    if (!reservationsPattern.test(source)) throw new Error("[1.6.4] bloco de reservas não encontrado");
    source = source.replace(reservationsPattern, reservationsReplacement);
  }

  const aiModalPattern = /<ResponsiveDialog open=\{aiCreateOpen\}[\s\S]*?<\/ResponsiveDialog>\n <ResponsiveDialog open=\{Boolean\(recipeEditing\)\}/;
  if (!source.includes('recipe-ai-error-v164')) {
    const aiModal = `<CenteredModal open={aiCreateOpen} onOpenChange={(open)=>{if(!open&&aiCreateStage==="generating")return;setAiCreateOpen(open);if(!open){setAiPrompt("");setAiCreateError("");setAiCreateStage("input")}}} title="Criar receita com IA" description="A IA cria o rascunho e cruza os macros com a TACO; revise antes de salvar." className="recipe-ai-dialog" bodyClassName="recipe-ai-dialog-body">{aiCreateStage==="input"?<div className="recipe-ai-prompt"><label>Descreva a receita<input autoFocus value={aiPrompt} onChange={e=>{setAiPrompt(e.target.value);if(aiCreateError)setAiCreateError("")}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void createWithAI()}}} placeholder="Ex: frango grelhado com batata-doce e brócolis"/></label>{aiCreateError?<p className="recipe-ai-error-v164" role="alert">{aiCreateError}</p>:null}<button className="recipe-ai-generate-v164" aria-busy={false} onClick={()=>void createWithAI()} disabled={!aiPrompt.trim()}>Gerar receita</button></div>:<div className="recipe-ai-loading" aria-live="polite" aria-busy="true"><Sparkles/><strong>Gerando receita · {["escrevendo o rascunho","calculando macros pela TACO","buscando uma imagem"][aiProgressIndex]}</strong></div>}</CenteredModal>\n <ResponsiveDialog open={Boolean(recipeEditing)}`;
    if (!aiModalPattern.test(source)) throw new Error("[1.6.4] modal de receita IA não encontrado");
    source = source.replace(aiModalPattern, aiModal);
  }

  if (!source.includes('title="Excluir reserva?"')) {
    const marker = ' <ConfirmDeleteDialog open={Boolean(replaceImageTarget)}';
    const confirm = ' <ConfirmDeleteDialog open={Boolean(reservationDeleteTarget)} onOpenChange={(open)=>{if(!open)setReservationDeleteTarget(null)}} title="Excluir reserva?" description={reservationDeleteTarget?.status==="retirado"?"Esta reserva já foi retirada. A confirmação abaixo remove definitivamente o histórico dessa reserva do banco.":"A reserva será removida definitivamente do banco e desaparecerá da lista sem recarregar a página."} confirmLabel={reservationDeleteTarget?.status==="retirado"?"Excluir definitivamente":"Excluir reserva"} onConfirm={async()=>{if(reservationDeleteTarget)await reservationDelete.mutateAsync({id:reservationDeleteTarget.id,allowWithdrawn:reservationDeleteTarget.status==="retirado"})}} busy={reservationDelete.isPending}/>\n' + marker;
    if (!source.includes(marker)) throw new Error("[1.6.4] marker de confirmação da Loja não encontrado");
    source = source.replace(marker, confirm);
  }
  return source;
});

transform("scr/lib/store.ts", (source) => {
  if (!source.includes('export async function staffDeleteReservation')) {
    const marker = 'export async function staffSetReservationStatus(reservationId:string,status:"retirado"|"cancelado"){const{error}=await supabase.rpc("staff_set_reservation_status_v1_3_1",{p_reserva_id:reservationId,p_status:status});if(error)throw error;}';
    const addition = marker + '\nexport async function staffDeleteReservation(reservationId:string,allowWithdrawn=false){const{data,error}=await supabase.rpc("staff_delete_reservation_v1_6_4",{p_reserva_id:reservationId,p_allow_retirado:allowWithdrawn});if(error)throw error;return Boolean(data);}';
    if (!source.includes(marker)) throw new Error("[1.6.4] staffSetReservationStatus não encontrado");
    source = source.replace(marker, addition);
  }
  return source;
});

// Compatibilidade de compilação com o componente 1.6.3 ainda presente no repo.
transform("scr/lib/trainingPartners.ts", (source) => {
  if (!source.includes('export async function inviteTrainingPartner')) {
    source += '\nexport async function inviteTrainingPartner(partnerId: string) {\n  return requestTrainingPartner(partnerId);\n}\n';
  }
  return source;
});

// Ranking: explicação curta, visual e com safe-area via camada CSS 1.6.4.
transform("scr/pages/Ranking.tsx", (source) => {
  source = source.replace(
    'description="Entenda como sua posição no Ranking ACCQUA é calculada."',
    'description="Três regras para entender sua posição no Ranking ACCQUA."',
  );
  const before = `<div className="ranking-info-list">\n        <article><strong>Dias treinados do mês</strong><p>Cada dia válido conta no máximo uma vez no ranking, mesmo que você registre mais de um treino no mesmo dia.</p></article>\n        <article><strong>Presença com lastro</strong><p>O dia só entra na disputa quando há matrícula válida naquela data ou presença registrada em uma aula.</p></article>\n        <article><strong>Prêmio para o 1º lugar</strong><p>Quem terminar o mês em primeiro lugar ganha: {prizeName}.</p></article>\n        <article><strong>Todo mês começa do zero</strong><p>No primeiro dia de cada mês começa um novo período de disputa.</p></article>\n      </div>`;
  const after = `<div className="ranking-info-list ranking-info-list-v164">\n        <p className="ranking-info-summary-v164">Seu lugar no ranking vem dos dias válidos em que você treinou neste mês.</p>\n        <article className="ranking-info-rule-v164"><span>1</span><div><strong>Um dia conta uma vez</strong><p>Mesmo com mais de um treino, o dia soma apenas 1 posição válida.</p></div></article>\n        <article className="ranking-info-rule-v164"><span>✓</span><div><strong>O dia precisa ser válido</strong><p>É necessário ter matrícula válida na data ou presença registrada em aula.</p></div></article>\n        <article className="ranking-info-rule-v164"><span>★</span><div><strong>O mês reinicia</strong><p>Todo mês começa do zero; o 1º lugar disputa {prizeName}.</p></div></article>\n      </div>`;
  if (!source.includes(after)) {
    if (!source.includes(before)) throw new Error("[1.6.4] conteúdo Como funciona do Ranking não encontrado");
    source = source.replace(before, after);
  }
  return source;
});

// Perfil: destaques visuais + Parceiros como subview real do Perfil.
transform("scr/pages/Profile.tsx", (source) => {
  source = source.replace('import ProfileTrainingPartners163 from "../components/ProfileTrainingPartners163";', 'import ProfileTrainingPartners164 from "../components/ProfileTrainingPartners164";');
  if (!source.includes('| "partners"')) source = source.replace('  | "security"\n  | "support";', '  | "security"\n  | "partners"\n  | "support";');
  if (!source.includes('partners: "Parceiros"')) source = source.replace('  security: "Segurança",\n  support: "Ajuda e suporte",', '  security: "Segurança",\n  partners: "Parceiros",\n  support: "Ajuda e suporte",');
  if (!source.includes('function profileAppMilestoneV164')) {
    const marker = 'function formatDate(value: string, withTime = false) {';
    const helper = `function profileAppMilestoneV164(value: string) {\n  const start = new Date(value);\n  if (Number.isNaN(start.getTime())) return { days: null as number | null, label: "" };\n  const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));\n  const levels = [\n    { days: 365, label: "LENDÁRIO" },\n    { days: 180, label: "IMPARÁVEL" },\n    { days: 90, label: "CONSISTENTE" },\n    { days: 50, label: "INSANO" },\n    { days: 30, label: "NO RITMO" },\n  ];\n  return { days, label: levels.find((level) => days >= level.days)?.label ?? "" };\n}\n\n`;
    if (!source.includes(marker)) throw new Error("[1.6.4] marker formatDate do Perfil não encontrado");
    source = source.replace(marker, helper + marker);
  }
  if (!source.includes('className="profile-highlights-v164"')) {
    const marker = '              <motion.section className="profile-stats-grid" aria-label="Resumo do perfil" variants={profileStatsVariants} initial="hidden" animate="visible">';
    const highlights = `              {!isStaffProfile ? (\n                <section className="profile-highlights-v164" aria-label="Destaques do perfil">\n                  <article className="profile-highlight-v164"><small>TEMPO NO APP</small><strong>{profileAppMilestoneV164(details.memberSince).days === null ? "Começando agora" : \`${'${profileAppMilestoneV164(details.memberSince).days}'} dias no app\`}</strong>{profileAppMilestoneV164(details.memberSince).label ? <em>{profileAppMilestoneV164(details.memberSince).label}</em> : null}</article>\n                  <article className="profile-highlight-v164"><small>DIVISÃO ATUAL</small><strong>{dashboard.activeWorkout?.splitType || "A definir"}</strong></article>\n                  <article className="profile-highlight-v164"><small>OBJETIVO</small><strong>{details.objective || "Defina no perfil"}</strong></article>\n                </section>\n              ) : null}\n\n`;
    if (!source.includes(marker)) throw new Error("[1.6.4] grid de stats do Perfil não encontrado");
    source = source.replace(marker, highlights + marker);
  }
  if (!source.includes('title="Parceiros" subtitle="Conexões e chamadas para treino"')) {
    const marker = '                  <ProfileMenuItem icon={<ProfileIcon name="calendar" size={22} />}  title="Minhas aulas" subtitle="Agendadas e já realizadas" onClick={() => openView("classes")} />';
    const after = marker + '\n                  <ProfileMenuItem icon={<ProfileIcon name="dumbbell" size={22} />} title="Parceiros" subtitle="Conexões e chamadas para treino" onClick={() => openView("partners")} />';
    if (!source.includes(marker)) throw new Error("[1.6.4] item Minhas aulas do Perfil não encontrado");
    source = source.replace(marker, after);
  }
  source = source.replace('              <ProfileTrainingPartners163 />\n\n', '');
  if (!source.includes('view === "partners"')) {
    const marker = '          {!loadingDashboard && view === "personal" ? (';
    const partners = `          {!loadingDashboard && view === "partners" ? (\n            <section className="profile-subview profile-partners-subview-v164">\n              <ProfileTrainingPartners164 />\n            </section>\n          ) : null}\n\n`;
    if (!source.includes(marker)) throw new Error("[1.6.4] subview personal do Perfil não encontrada");
    source = source.replace(marker, partners + marker);
  }
  return source;
});

console.log("ACCQUA Sports — Build 1.6.4 source patch applied.");
