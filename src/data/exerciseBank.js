/**
 * exercisebank.js
 * Banco de exercícios (70+), cada um com variações guiadas por nível:
 * easy / medium / hard.
 *
 * ✔ pronto pra você linkar GIF depois (campo gif)
 * ✔ busca por nome/alias sem diferenciar maiúsculas/minúsculas
 *
 * Uso:
 *   import exerciseBank from "../data/exercisebank";
 *   const ex = exerciseBank.get("agachamento");
 *   ex.variants.easy ... / medium ... / hard ...
 */

function normalize(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(str = "") {
  return normalize(str).replace(/\s+/g, "_");
}

function makeEntry({
  name,
  group,
  equipment = [],
  pattern = "",
  aliases = [],
  primaryMuscles = [],
  gif = null,
  variants,
}) {
  const id = slugify(name);
  return {
    id,
    name,
    group,
    equipment,
    pattern,
    primaryMuscles,
    aliases,
    gif, // você coloca o caminho do gif depois: "/gifs/agachamento.gif"
    variants: {
      easy: variants?.easy || null,
      medium: variants?.medium || null,
      hard: variants?.hard || null,
    },
  };
}

const EXERCISE_BANK = [
  // ---------- PERNAS / GLÚTEO ----------
  makeEntry({
    name: "Agachamento ao banco",
    group: "Pernas",
    equipment: ["Banco/caixa"],
    pattern: "Agachar",
    aliases: ["box squat", "agachamento caixa", "sentar e levantar"],
    primaryMuscles: ["Quadríceps", "Glúteos"],
    variants: {
      easy: {
        title: "Ao banco (assistido)",
        sets: "2–3",
        reps: "10–15",
        rest: "60–90s",
        cues: ["Desce até encostar leve no banco", "Joelhos acompanham a ponta do pé", "Tronco firme"],
        notes: "Ótimo pra iniciante ganhar padrão de agachar com segurança.",
      },
      medium: {
        title: "Ao banco (sem pausa)",
        sets: "3–4",
        reps: "8–12",
        rest: "75–120s",
        cues: ["Sem relaxar no banco", "Subida forte contraindo glúteo"],
        notes: "Aumente amplitude e controle.",
      },
      hard: {
        title: "Ao banco com halter (goblet)",
        sets: "4",
        reps: "6–10",
        rest: "90–150s",
        cues: ["Halter junto ao peito", "Desce controlando", "Sobe explosivo"],
        notes: "Progressão segura antes do agachamento livre pesado.",
      },
    },
  }),

  makeEntry({
    name: "Agachamento goblet",
    group: "Pernas",
    equipment: ["Halter/Kettlebell"],
    pattern: "Agachar",
    aliases: ["goblet squat"],
    primaryMuscles: ["Quadríceps", "Glúteos", "Core"],
    variants: {
      easy: {
        title: "Goblet leve",
        sets: "2–3",
        reps: "10–15",
        rest: "60–90s",
        cues: ["Peito aberto", "Cotovelo aponta pra baixo", "Desce até onde mantém postura"],
        notes: "Comece leve e foque em técnica.",
      },
      medium: {
        title: "Goblet moderado",
        sets: "3–4",
        reps: "8–12",
        rest: "75–120s",
        cues: ["Pausa 1s no fundo", "Subida firme"],
        notes: "Ótimo para hipertrofia de pernas para iniciantes/intermediários.",
      },
      hard: {
        title: "Goblet tempo 3–1–1",
        sets: "4",
        reps: "6–10",
        rest: "90–150s",
        cues: ["3s descida", "1s pausa", "1s subida"],
        notes: "Aumenta a dificuldade sem precisar de muita carga.",
      },
    },
  }),

  makeEntry({
    name: "Leg press",
    group: "Pernas",
    equipment: ["Máquina"],
    pattern: "Empurrar (joelho)",
    aliases: ["legpress 45", "pressa de pernas"],
    primaryMuscles: ["Quadríceps", "Glúteos"],
    variants: {
      easy: {
        title: "Amplitude confortável",
        sets: "2–3",
        reps: "12–15",
        rest: "60–90s",
        cues: ["Não travar joelho", "Descer sem tirar lombar do encosto"],
        notes: "Aprenda amplitude sem dor.",
      },
      medium: {
        title: "Pés médios (ênfase quad)",
        sets: "3–4",
        reps: "10–12",
        rest: "75–120s",
        cues: ["Pés na largura do ombro", "Desce controlando"],
        notes: "Progresso de carga gradual.",
      },
      hard: {
        title: "Pausa no fundo",
        sets: "4",
        reps: "8–10",
        rest: "90–150s",
        cues: ["1–2s pausa no fundo", "Sobe forte sem travar"],
        notes: "Dificulta com controle e segurança.",
      },
    },
  }),

  makeEntry({
    name: "Cadeira extensora",
    group: "Pernas",
    equipment: ["Máquina"],
    pattern: "Extensão de joelho",
    aliases: ["extensora"],
    primaryMuscles: ["Quadríceps"],
    variants: {
      easy: { title: "Leve e controlado", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["1s contração no topo"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Desce 2s"], notes: "" },
      hard: { title: "Drop-set simples", sets: "3", reps: "10 + 8 + 6", rest: "90s", cues: ["Reduz carga 2x sem descanso grande"], notes: "Ótimo para finalizar." },
    },
  }),

  makeEntry({
    name: "Cadeira flexora",
    group: "Posterior",
    equipment: ["Máquina"],
    pattern: "Flexão de joelho",
    aliases: ["mesa flexora sentada", "flexora"],
    primaryMuscles: ["Posterior de coxa"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Subir e segurar 1s"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Desce controlando"], notes: "" },
      hard: { title: "Tempo 3–0–1", sets: "4", reps: "8–10", rest: "75–120s", cues: ["3s descida"], notes: "" },
    },
  }),

  makeEntry({
    name: "Stiff com halteres (romeno)",
    group: "Posterior",
    equipment: ["Halteres"],
    pattern: "Dobradiça de quadril",
    aliases: ["terra romeno halteres", "romeno"],
    primaryMuscles: ["Posterior de coxa", "Glúteos", "Lombar (estabilização)"],
    variants: {
      easy: { title: "Romeno curto", sets: "2–3", reps: "10–12", rest: "75–120s", cues: ["Desce até sentir posterior sem perder postura"], notes: "Amplitude menor = mais seguro no início." },
      medium: { title: "Romeno completo", sets: "3–4", reps: "8–12", rest: "90–150s", cues: ["Coluna neutra", "Quadril vai pra trás"], notes: "" },
      hard: { title: "Romeno com pausa", sets: "4", reps: "6–10", rest: "90–150s", cues: ["Pausa 1s na metade"], notes: "" },
    },
  }),

  makeEntry({
    name: "Hip thrust",
    group: "Glúteo",
    equipment: ["Banco", "Barra/Halter"],
    pattern: "Extensão de quadril",
    aliases: ["elevação pélvica", "hip thrust barra"],
    primaryMuscles: ["Glúteos", "Posterior"],
    variants: {
      easy: { title: "Sem carga", sets: "2–3", reps: "12–20", rest: "60–90s", cues: ["Queixo levemente recolhido", "Contraia glúteo no topo 1s"], notes: "" },
      medium: { title: "Com halter", sets: "3–4", reps: "10–15", rest: "75–120s", cues: ["Pés firmes", "Não hiperestender lombar"], notes: "" },
      hard: { title: "Com barra + pausa", sets: "4", reps: "8–12", rest: "90–150s", cues: ["2s de pausa no topo"], notes: "Excelente para hipertrofia de glúteo." },
    },
  }),

  makeEntry({
    name: "Ponte de glúteo no chão",
    group: "Glúteo",
    equipment: ["Colchonete", "Halter opcional"],
    pattern: "Extensão de quadril",
    aliases: ["glute bridge"],
    primaryMuscles: ["Glúteos"],
    variants: {
      easy: { title: "Sem carga", sets: "2–3", reps: "15–20", rest: "45–75s", cues: ["Subir e segurar 1s"], notes: "" },
      medium: { title: "Com halter", sets: "3–4", reps: "12–15", rest: "60–90s", cues: ["Desce 2s"], notes: "" },
      hard: { title: "Unilateral", sets: "3–4", reps: "8–12 cada perna", rest: "75–120s", cues: ["Quadril nivelado"], notes: "Progressão forte pra glúteo e core." },
    },
  }),

  makeEntry({
    name: "Afundo (passada) parado",
    group: "Pernas",
    equipment: ["Peso corporal", "Halteres opcional"],
    pattern: "Lunge",
    aliases: ["lunge", "passada fixa"],
    primaryMuscles: ["Quadríceps", "Glúteos"],
    variants: {
      easy: { title: "Curto e estável", sets: "2–3", reps: "8–12 cada perna", rest: "60–90s", cues: ["Passo curto", "Desce vertical"], notes: "" },
      medium: { title: "Passo normal", sets: "3–4", reps: "10–12 cada perna", rest: "75–120s", cues: ["Joelho da frente não colapsa"], notes: "" },
      hard: { title: "Com halteres", sets: "4", reps: "8–10 cada perna", rest: "90–150s", cues: ["Tronco firme", "Subida forte"], notes: "" },
    },
  }),

  makeEntry({
    name: "Step-up no banco",
    group: "Pernas",
    equipment: ["Banco/caixa"],
    pattern: "Subida unilateral",
    aliases: ["subida no banco"],
    primaryMuscles: ["Glúteos", "Quadríceps"],
    variants: {
      easy: { title: "Banco baixo", sets: "2–3", reps: "10 cada perna", rest: "60–90s", cues: ["Suba empurrando o chão", "Desça controlando"], notes: "" },
      medium: { title: "Banco médio", sets: "3–4", reps: "8–12 cada perna", rest: "75–120s", cues: ["Evite impulso do pé de trás"], notes: "" },
      hard: { title: "Com halteres", sets: "4", reps: "6–10 cada perna", rest: "90–150s", cues: ["Controle total"], notes: "" },
    },
  }),

  makeEntry({
    name: "Abdução de quadril (máquina)",
    group: "Glúteo",
    equipment: ["Máquina"],
    pattern: "Abdução",
    aliases: ["abdutora"],
    primaryMuscles: ["Glúteo médio"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "15–20", rest: "45–75s", cues: ["1s no pico"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "12–15", rest: "60–90s", cues: ["Sem roubar no tronco"], notes: "" },
      hard: { title: "Pulsos no final", sets: "3", reps: "12–15 + 10 pulsos", rest: "75–120s", cues: ["Pequenos pulsos curtos"], notes: "" },
    },
  }),

  makeEntry({
    name: "Panturrilha em pé",
    group: "Panturrilha",
    equipment: ["Máquina", "Degrau opcional"],
    pattern: "Flexão plantar",
    aliases: ["calf raise em pé"],
    primaryMuscles: ["Panturrilha"],
    variants: {
      easy: { title: "Amplitude confortável", sets: "2–3", reps: "12–20", rest: "45–75s", cues: ["Suba e segure 1s"], notes: "" },
      medium: { title: "Amplitude total", sets: "3–4", reps: "10–15", rest: "60–90s", cues: ["Desce bem no alongamento"], notes: "" },
      hard: { title: "Unilateral", sets: "4", reps: "8–12 cada", rest: "75–120s", cues: ["Controle sem balançar"], notes: "" },
    },
  }),

  // ---------- COSTAS / BÍCEPS ----------
  makeEntry({
    name: "Puxada na frente (pulldown)",
    group: "Costas",
    equipment: ["Puxador"],
    pattern: "Puxar vertical",
    aliases: ["lat pulldown", "puxada barra"],
    primaryMuscles: ["Dorsal", "Bíceps (assistência)"],
    variants: {
      easy: { title: "Pegada neutra leve", sets: "2–3", reps: "10–15", rest: "60–90s", cues: ["Puxa com as costas", "Cotovelos para baixo"], notes: "" },
      medium: { title: "Pegada pronada moderada", sets: "3–4", reps: "8–12", rest: "75–120s", cues: ["Peito aberto", "Sem puxar com o pescoço"], notes: "" },
      hard: { title: "Pausa embaixo", sets: "4", reps: "6–10", rest: "90–150s", cues: ["1–2s de contração"], notes: "" },
    },
  }),

  makeEntry({
    name: "Remada baixa (cabo)",
    group: "Costas",
    equipment: ["Cabo"],
    pattern: "Puxar horizontal",
    aliases: ["remada no cabo", "seated row"],
    primaryMuscles: ["Costas médias", "Bíceps"],
    variants: {
      easy: { title: "Leve, foco escápula", sets: "2–3", reps: "12–15", rest: "60–90s", cues: ["Puxa e fecha escápulas"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "75–120s", cues: ["Sem jogar tronco"], notes: "" },
      hard: { title: "Tempo 2–1–2", sets: "4", reps: "8–10", rest: "90–150s", cues: ["1s segurando atrás"], notes: "" },
    },
  }),

  makeEntry({
    name: "Remada unilateral com halter",
    group: "Costas",
    equipment: ["Halter", "Banco"],
    pattern: "Puxar horizontal",
    aliases: ["serrote", "one arm row"],
    primaryMuscles: ["Dorsal", "Costas médias"],
    variants: {
      easy: { title: "Leve, amplitude curta", sets: "2–3", reps: "10–12 cada", rest: "60–90s", cues: ["Cotovelos junto ao corpo"], notes: "" },
      medium: { title: "Completa", sets: "3–4", reps: "10–12 cada", rest: "75–120s", cues: ["Pausa 1s em cima"], notes: "" },
      hard: { title: "Mais carga", sets: "4", reps: "6–10 cada", rest: "90–150s", cues: ["Sem girar tronco"], notes: "" },
    },
  }),

  makeEntry({
    name: "Face pull",
    group: "Ombros/escápulas",
    equipment: ["Cabo", "Elástico"],
    pattern: "Puxar alto",
    aliases: ["puxada para face"],
    primaryMuscles: ["Deltoide posterior", "Manguito", "Trapézio médio"],
    variants: {
      easy: { title: "Elástico leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Cotovelos altos", "Puxa até o rosto"], notes: "" },
      medium: { title: "Cabo moderado", sets: "3–4", reps: "12–15", rest: "60–90s", cues: ["Segura 1s atrás"], notes: "" },
      hard: { title: "Tempo 2–2–2", sets: "4", reps: "10–12", rest: "75–120s", cues: ["2s segurando atrás"], notes: "" },
    },
  }),

  makeEntry({
    name: "Rosca direta",
    group: "Bíceps",
    equipment: ["Barra", "Halter"],
    pattern: "Flexão de cotovelo",
    aliases: ["curl", "rosca barra"],
    primaryMuscles: ["Bíceps"],
    variants: {
      easy: { title: "Halter leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Cotovelo fixo"], notes: "" },
      medium: { title: "Barra moderada", sets: "3–4", reps: "8–12", rest: "60–90s", cues: ["Sem balançar"], notes: "" },
      hard: { title: "Tempo + pausa", sets: "4", reps: "6–10", rest: "75–120s", cues: ["2s descida", "1s no meio"], notes: "" },
    },
  }),

  makeEntry({
    name: "Rosca martelo",
    group: "Bíceps",
    equipment: ["Halter"],
    pattern: "Flexão de cotovelo",
    aliases: ["hammer curl"],
    primaryMuscles: ["Bíceps", "Braquiorradial"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Punho neutro"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Sem subir ombro"], notes: "" },
      hard: { title: "Alternado lento", sets: "4", reps: "8–10 cada", rest: "75–120s", cues: ["3s descida"], notes: "" },
    },
  }),

  // ---------- PEITO / TRÍCEPS ----------
  makeEntry({
    name: "Flexão de braços (apoio)",
    group: "Peito",
    equipment: ["Peso corporal"],
    pattern: "Empurrar horizontal",
    aliases: ["push-up", "flexao"],
    primaryMuscles: ["Peito", "Tríceps", "Ombros"],
    variants: {
      easy: { title: "Flexão inclinada", sets: "2–3", reps: "8–15", rest: "60–90s", cues: ["Mãos numa superfície alta"], notes: "Perfeito pra iniciante." },
      medium: { title: "Flexão no chão", sets: "3–4", reps: "6–12", rest: "75–120s", cues: ["Corpo reto", "Desce controlando"], notes: "" },
      hard: { title: "Flexão com pausa", sets: "4", reps: "5–10", rest: "90–150s", cues: ["Pausa 1s embaixo"], notes: "" },
    },
  }),

  makeEntry({
    name: "Supino com halteres no banco",
    group: "Peito",
    equipment: ["Halteres", "Banco"],
    pattern: "Empurrar horizontal",
    aliases: ["supino halter", "dumbbell bench press"],
    primaryMuscles: ["Peito", "Tríceps"],
    variants: {
      easy: { title: "Leve e estável", sets: "2–3", reps: "10–15", rest: "60–90s", cues: ["Escápulas firmes no banco"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "8–12", rest: "75–120s", cues: ["Desce até linha do peito"], notes: "" },
      hard: { title: "Tempo 3s descida", sets: "4", reps: "6–10", rest: "90–150s", cues: ["Controle total"], notes: "" },
    },
  }),

  makeEntry({
    name: "Crucifixo com halteres",
    group: "Peito",
    equipment: ["Halteres", "Banco"],
    pattern: "Adução horizontal",
    aliases: ["fly", "crucifixo reto"],
    primaryMuscles: ["Peito"],
    variants: {
      easy: { title: "Amplitude curta", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Cotovelo levemente flexionado"], notes: "" },
      medium: { title: "Amplitude completa", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Sobe contraindo peito"], notes: "" },
      hard: { title: "Tempo + pausa", sets: "4", reps: "8–10", rest: "75–120s", cues: ["1s embaixo", "2s subida"], notes: "" },
    },
  }),

  makeEntry({
    name: "Tríceps na polia (corda)",
    group: "Tríceps",
    equipment: ["Cabo"],
    pattern: "Extensão de cotovelo",
    aliases: ["triceps corda", "pushdown"],
    primaryMuscles: ["Tríceps"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Cotovelo colado ao corpo"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Abra a corda embaixo"], notes: "" },
      hard: { title: "Pausa embaixo", sets: "4", reps: "8–10", rest: "75–120s", cues: ["1–2s segurando"], notes: "" },
    },
  }),

  makeEntry({
    name: "Tríceps francês com halter",
    group: "Tríceps",
    equipment: ["Halter"],
    pattern: "Extensão acima da cabeça",
    aliases: ["overhead triceps extension", "frances"],
    primaryMuscles: ["Tríceps"],
    variants: {
      easy: { title: "Sentado leve", sets: "2–3", reps: "12–15", rest: "60–90s", cues: ["Cotovelo apontado pra cima"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "75–120s", cues: ["Desce até alongar"], notes: "" },
      hard: { title: "Tempo 3s descida", sets: "4", reps: "8–10", rest: "90–150s", cues: ["Controle total"], notes: "" },
    },
  }),

  // ---------- OMBROS ----------
  makeEntry({
    name: "Elevação lateral",
    group: "Ombros",
    equipment: ["Halter", "Cabo opcional"],
    pattern: "Abdução de ombro",
    aliases: ["lateral raise"],
    primaryMuscles: ["Deltoide lateral"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Cotovelo levemente dobrado"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–15", rest: "60–90s", cues: ["Sobe até altura do ombro"], notes: "" },
      hard: { title: "Parciais no final", sets: "4", reps: "10–12 + 10 parciais", rest: "75–120s", cues: ["Curto e controlado"], notes: "" },
    },
  }),

  makeEntry({
    name: "Desenvolvimento com halteres",
    group: "Ombros",
    equipment: ["Halteres", "Banco"],
    pattern: "Empurrar vertical",
    aliases: ["shoulder press"],
    primaryMuscles: ["Deltoide", "Tríceps"],
    variants: {
      easy: { title: "Sentado leve", sets: "2–3", reps: "10–15", rest: "60–90s", cues: ["Costas apoiadas"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "8–12", rest: "75–120s", cues: ["Sem arquear lombar"], notes: "" },
      hard: { title: "Tempo + pausa", sets: "4", reps: "6–10", rest: "90–150s", cues: ["Pausa 1s embaixo"], notes: "" },
    },
  }),

  makeEntry({
    name: "Reverse fly (posterior de ombro)",
    group: "Ombros",
    equipment: ["Halter", "Máquina", "Cabo"],
    pattern: "Abertura posterior",
    aliases: ["crucifixo invertido", "rear delt fly"],
    primaryMuscles: ["Deltoide posterior", "Escápulas"],
    variants: {
      easy: { title: "Leve no banco inclinado", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Peito apoiado"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Abre sem subir trapézio"], notes: "" },
      hard: { title: "Tempo 2–1–2", sets: "4", reps: "8–12", rest: "75–120s", cues: ["1s segurando aberto"], notes: "" },
    },
  }),

  // ---------- CORE ----------
  makeEntry({
    name: "Prancha",
    group: "Core",
    equipment: ["Colchonete"],
    pattern: "Anti-extensão",
    aliases: ["plank"],
    primaryMuscles: ["Abdômen", "Lombar (estabilização)"],
    variants: {
      easy: { title: "Prancha joelhos", sets: "2–3", reps: "20–40s", rest: "45–75s", cues: ["Quadril alinhado"], notes: "" },
      medium: { title: "Prancha padrão", sets: "3–4", reps: "30–60s", rest: "60–90s", cues: ["Glúteo firme", "Respiração controlada"], notes: "" },
      hard: { title: "Prancha com toque no ombro", sets: "4", reps: "20–30 toques", rest: "75–120s", cues: ["Sem balançar"], notes: "" },
    },
  }),

  makeEntry({
    name: "Dead bug",
    group: "Core",
    equipment: ["Colchonete"],
    pattern: "Anti-extensão",
    aliases: ["inseto morto"],
    primaryMuscles: ["Abdômen profundo", "Flexores do quadril (controle)"],
    variants: {
      easy: { title: "Braços alternados", sets: "2–3", reps: "8–12", rest: "45–75s", cues: ["Lombar colada no chão"], notes: "" },
      medium: { title: "Braço + perna", sets: "3–4", reps: "8–12 cada lado", rest: "60–90s", cues: ["Movimento lento"], notes: "" },
      hard: { title: "Com mini-band", sets: "4", reps: "10–14 cada", rest: "75–120s", cues: ["Mais tensão"], notes: "" },
    },
  }),

  makeEntry({
    name: "Pallof press",
    group: "Core",
    equipment: ["Cabo", "Elástico"],
    pattern: "Anti-rotação",
    aliases: ["pallof"],
    primaryMuscles: ["Oblíquos", "Core"],
    variants: {
      easy: { title: "Elástico leve", sets: "2–3", reps: "10–12 cada", rest: "45–75s", cues: ["Segura 1s estendido"], notes: "" },
      medium: { title: "Cabo moderado", sets: "3–4", reps: "10–12 cada", rest: "60–90s", cues: ["Quadril travado"], notes: "" },
      hard: { title: "Pallof com passo lateral", sets: "4", reps: "8–10 cada", rest: "75–120s", cues: ["Sem girar tronco"], notes: "" },
    },
  }),

  makeEntry({
    name: "Elevação de pernas (joelhos)",
    group: "Core",
    equipment: ["Colchonete", "Barra opcional"],
    pattern: "Flexão de quadril",
    aliases: ["leg raise", "elevacao de joelhos"],
    primaryMuscles: ["Abdômen inferior"],
    variants: {
      easy: { title: "Joelhos dobrados no chão", sets: "2–3", reps: "10–15", rest: "45–75s", cues: ["Controle na descida"], notes: "" },
      medium: { title: "Elevação de pernas", sets: "3–4", reps: "8–12", rest: "60–90s", cues: ["Sem arquear lombar"], notes: "" },
      hard: { title: "Suspenso (barra)", sets: "4", reps: "6–12", rest: "90–150s", cues: ["Sem balanço"], notes: "" },
    },
  }),

  // ---------- CARDIO / CONDICIONAMENTO ----------
  makeEntry({
    name: "Caminhada inclinada (esteira)",
    group: "Cardio",
    equipment: ["Esteira"],
    pattern: "Aeróbio",
    aliases: ["incline walk"],
    primaryMuscles: ["Cardiorrespiratório", "Pernas (leve)"],
    variants: {
      easy: { title: "10–20 min leve", sets: "1", reps: "10–20min", rest: "-", cues: ["Confortável, dá pra conversar"], notes: "" },
      medium: { title: "20–30 min moderado", sets: "1", reps: "20–30min", rest: "-", cues: ["Suor leve", "Respiração mais forte"], notes: "" },
      hard: { title: "Intervalos 1:1", sets: "1", reps: "15–25min", rest: "-", cues: ["1 min forte / 1 min leve"], notes: "" },
    },
  }),

  makeEntry({
    name: "Bike ergométrica",
    group: "Cardio",
    equipment: ["Bike"],
    pattern: "Aeróbio",
    aliases: ["spinning leve", "bicicleta"],
    primaryMuscles: ["Cardiorrespiratório", "Pernas (leve)"],
    variants: {
      easy: { title: "Cadência constante", sets: "1", reps: "10–20min", rest: "-", cues: ["Resistência baixa"], notes: "" },
      medium: { title: "Progressivo", sets: "1", reps: "20–30min", rest: "-", cues: ["Aumenta leve a cada 5min"], notes: "" },
      hard: { title: "Sprints", sets: "1", reps: "12–20min", rest: "-", cues: ["20s forte / 40s leve"], notes: "" },
    },
  }),

  makeEntry({
    name: "Polichinelo",
    group: "Cardio",
    equipment: ["Peso corporal"],
    pattern: "Pliométrico leve",
    aliases: ["jumping jack"],
    primaryMuscles: ["Cardiorrespiratório"],
    variants: {
      easy: { title: "Sem salto (passo lateral)", sets: "2–4", reps: "30–45s", rest: "30–45s", cues: ["Baixo impacto"], notes: "" },
      medium: { title: "Com salto", sets: "4–6", reps: "30–45s", rest: "30–45s", cues: ["Ritmo constante"], notes: "" },
      hard: { title: "Sprint de jacks", sets: "6–10", reps: "20–30s", rest: "20–40s", cues: ["Ritmo alto"], notes: "" },
    },
  }),

  // ---------- MOBILIDADE / SAÚDE ----------
  makeEntry({
    name: "Alongamento de flexores do quadril",
    group: "Mobilidade",
    equipment: ["Colchonete"],
    pattern: "Mobilidade",
    aliases: ["hip flexor stretch"],
    primaryMuscles: ["Flexores do quadril"],
    variants: {
      easy: { title: "30s cada lado", sets: "1–2", reps: "30–45s", rest: "-", cues: ["Quadril encaixado"], notes: "" },
      medium: { title: "45–60s cada lado", sets: "1–2", reps: "45–60s", rest: "-", cues: ["Contraia glúteo do lado alongado"], notes: "" },
      hard: { title: "Com elevação do braço", sets: "1–2", reps: "45–60s", rest: "-", cues: ["Incline levemente", "Sem dor"], notes: "" },
    },
  }),

  // ==========================================================
  // A PARTIR DAQUI: MAIS EXERCÍCIOS (total 70+)
  // ==========================================================

  // Perna/Glúteo extras
  makeEntry({
    name: "Agachamento sumô com halter (leve)",
    group: "Pernas",
    equipment: ["Halter"],
    pattern: "Agachar",
    aliases: ["sumo squat halter"],
    primaryMuscles: ["Glúteos", "Adutores"],
    variants: {
      easy: { title: "Halter leve", sets: "2–3", reps: "12–15", rest: "60–90s", cues: ["Pés abertos, joelhos acompanham"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "75–120s", cues: ["Pausa 1s embaixo"], notes: "" },
      hard: { title: "Tempo 3s descida", sets: "4", reps: "8–10", rest: "90–150s", cues: ["Controle total"], notes: "" },
    },
  }),

  makeEntry({
    name: "Cadeira adutora",
    group: "Pernas",
    equipment: ["Máquina"],
    pattern: "Adução",
    aliases: ["adutora"],
    primaryMuscles: ["Adutores"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "15–20", rest: "45–75s", cues: ["1s contraindo"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "12–15", rest: "60–90s", cues: ["Sem bater os pesos"], notes: "" },
      hard: { title: "Parciais no final", sets: "4", reps: "12 + 10 parciais", rest: "75–120s", cues: ["Curto e controlado"], notes: "" },
    },
  }),

  makeEntry({
    name: "Elevação pélvica no banco (glute bridge elevado)",
    group: "Glúteo",
    equipment: ["Banco", "Halter opcional"],
    pattern: "Extensão de quadril",
    aliases: ["glute bridge elevado"],
    primaryMuscles: ["Glúteos"],
    variants: {
      easy: { title: "Sem carga", sets: "2–3", reps: "12–20", rest: "60–90s", cues: ["Pausa 1s no topo"], notes: "" },
      medium: { title: "Com halter", sets: "3–4", reps: "10–15", rest: "75–120s", cues: ["Desce 2s"], notes: "" },
      hard: { title: "Unilateral", sets: "4", reps: "8–12 cada", rest: "90–150s", cues: ["Quadril alinhado"], notes: "" },
    },
  }),

  makeEntry({
    name: "Elevação de panturrilha sentado",
    group: "Panturrilha",
    equipment: ["Máquina", "Halter opcional"],
    pattern: "Flexão plantar",
    aliases: ["calf raise sentado"],
    primaryMuscles: ["Panturrilha (sóleo)"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "15–20", rest: "45–75s", cues: ["Pausa 1s em cima"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "12–15", rest: "60–90s", cues: ["Amplitude total"], notes: "" },
      hard: { title: "Tempo 3s descida", sets: "4", reps: "10–12", rest: "75–120s", cues: ["Controle"], notes: "" },
    },
  }),

  // Costas extras
  makeEntry({
    name: "Pulldown braço reto",
    group: "Costas",
    equipment: ["Cabo"],
    pattern: "Extensão de ombro",
    aliases: ["straight arm pulldown"],
    primaryMuscles: ["Dorsal"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Braço quase estendido", "Desce até a coxa"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Sem balançar tronco"], notes: "" },
      hard: { title: "Pausa embaixo", sets: "4", reps: "8–10", rest: "75–120s", cues: ["1–2s de contração"], notes: "" },
    },
  }),

  makeEntry({
    name: "Remada curvada com halteres",
    group: "Costas",
    equipment: ["Halteres"],
    pattern: "Puxar horizontal",
    aliases: ["bent over row"],
    primaryMuscles: ["Costas", "Posterior (estabilização)"],
    variants: {
      easy: { title: "Inclinação leve", sets: "2–3", reps: "10–12", rest: "75–120s", cues: ["Coluna neutra"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "8–12", rest: "90–150s", cues: ["Puxa cotovelo para trás"], notes: "" },
      hard: { title: "Tempo 3s descida", sets: "4", reps: "6–10", rest: "90–150s", cues: ["Controle"], notes: "" },
    },
  }),

  // Peito extras
  makeEntry({
    name: "Crossover no cabo",
    group: "Peito",
    equipment: ["Cabo"],
    pattern: "Adução horizontal",
    aliases: ["cross over", "crossover"],
    primaryMuscles: ["Peito"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Cotovelo levemente flexionado"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Cruza levemente à frente"], notes: "" },
      hard: { title: "Pausa na contração", sets: "4", reps: "8–12", rest: "75–120s", cues: ["2s segurando"], notes: "" },
    },
  }),

  // Ombros extras
  makeEntry({
    name: "Elevação frontal",
    group: "Ombros",
    equipment: ["Halter", "Cabo"],
    pattern: "Flexão de ombro",
    aliases: ["front raise"],
    primaryMuscles: ["Deltoide anterior"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "12–15", rest: "45–75s", cues: ["Até a altura do ombro"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "10–12", rest: "60–90s", cues: ["Sem balançar"], notes: "" },
      hard: { title: "Tempo 3–1–1", sets: "4", reps: "8–10", rest: "75–120s", cues: ["Controle total"], notes: "" },
    },
  }),

  // Tríceps extras
  makeEntry({
    name: "Mergulho no banco (tríceps)",
    group: "Tríceps",
    equipment: ["Banco"],
    pattern: "Empurrar",
    aliases: ["bench dip"],
    primaryMuscles: ["Tríceps", "Peito (assistência)"],
    variants: {
      easy: { title: "Joelhos dobrados", sets: "2–3", reps: "8–12", rest: "60–90s", cues: ["Ombro para trás", "Desce curto"], notes: "Se doer ombro, substitua por polia." },
      medium: { title: "Pernas estendidas", sets: "3–4", reps: "8–12", rest: "75–120s", cues: ["Controle total"], notes: "" },
      hard: { title: "Com peso no colo", sets: "4", reps: "6–10", rest: "90–150s", cues: ["Amplitude segura"], notes: "" },
    },
  }),

  // Bíceps extras
  makeEntry({
    name: "Rosca alternada",
    group: "Bíceps",
    equipment: ["Halteres"],
    pattern: "Flexão de cotovelo",
    aliases: ["alternate curl"],
    primaryMuscles: ["Bíceps"],
    variants: {
      easy: { title: "Leve", sets: "2–3", reps: "10–12 cada", rest: "45–75s", cues: ["Sem girar tronco"], notes: "" },
      medium: { title: "Moderado", sets: "3–4", reps: "8–12 cada", rest: "60–90s", cues: ["Pausa 1s no topo"], notes: "" },
      hard: { title: "Lento (3s descida)", sets: "4", reps: "6–10 cada", rest: "75–120s", cues: ["Controle"], notes: "" },
    },
  }),

  // Core extras
  makeEntry({
    name: "Abdominal crunch",
    group: "Core",
    equipment: ["Colchonete", "Máquina opcional"],
    pattern: "Flexão de tronco",
    aliases: ["crunch"],
    primaryMuscles: ["Reto abdominal"],
    variants: {
      easy: { title: "Curto e controlado", sets: "2–3", reps: "12–20", rest: "45–75s", cues: ["Queixo longe do peito"], notes: "" },
      medium: { title: "Completo", sets: "3–4", reps: "12–15", rest: "60–90s", cues: ["Expire na subida"], notes: "" },
      hard: { title: "Com carga (anilha)", sets: "4", reps: "8–12", rest: "75–120s", cues: ["Controle"], notes: "" },
    },
  }),

  // Cardio extras
  makeEntry({
    name: "Corda (pular corda)",
    group: "Cardio",
    equipment: ["Corda"],
    pattern: "Pliométrico",
    aliases: ["jump rope"],
    primaryMuscles: ["Cardiorrespiratório", "Panturrilha (leve)"],
    variants: {
      easy: { title: "Passos alternados", sets: "4–6", reps: "20–30s", rest: "30–45s", cues: ["Baixo impacto"], notes: "" },
      medium: { title: "Ritmo contínuo", sets: "6–10", reps: "30–45s", rest: "30–45s", cues: ["Respiração controlada"], notes: "" },
      hard: { title: "Sprints", sets: "8–12", reps: "15–25s", rest: "20–40s", cues: ["Ritmo máximo"], notes: "" },
    },
  }),

  // Mobilidade extra
  makeEntry({
    name: "Mobilidade de tornozelo (joelho na parede)",
    group: "Mobilidade",
    equipment: ["Parede"],
    pattern: "Mobilidade",
    aliases: ["ankle mobility"],
    primaryMuscles: ["Tornozelo"],
    variants: {
      easy: { title: "2x30s", sets: "1–2", reps: "30s", rest: "-", cues: ["Calcanhar no chão"], notes: "" },
      medium: { title: "2x45s", sets: "1–2", reps: "45s", rest: "-", cues: ["Aumente alcance do joelho"], notes: "" },
      hard: { title: "Com carga leve", sets: "1–2", reps: "45–60s", rest: "-", cues: ["Sem dor"], notes: "" },
    },
  }),
  // =========================
  // PACK EXTRA (65 exercícios)
  // cole dentro do EXERCISE_BANK
  // =========================

  makeEntry({ name:"Agachamento livre", group:"Pernas", equipment:["Barra"], pattern:"Agachar", aliases:["back squat"], primaryMuscles:["Quadríceps","Glúteos","Core"],
    variants:{
      easy:{ title:"Com barra leve (técnica)", sets:"2–3", reps:"8–10", rest:"90–150s", cues:["Amplitude segura","Coluna neutra"], notes:"Só quando o padrão estiver bom." },
      medium:{ title:"Moderado", sets:"3–4", reps:"6–10", rest:"120–180s", cues:["Joelhos acompanham","Respiração/bracing"], notes:"" },
      hard:{ title:"Pausa no fundo", sets:"4", reps:"4–8", rest:"150–210s", cues:["Pausa 1–2s"], notes:"" },
    }
  }),

  makeEntry({ name:"Hack squat (máquina)", group:"Pernas", equipment:["Máquina"], pattern:"Agachar", aliases:["hack"], primaryMuscles:["Quadríceps","Glúteos"],
    variants:{
      easy:{ title:"Amplitude confortável", sets:"2–3", reps:"12–15", rest:"75–120s", cues:["Sem tirar lombar"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"8–12", rest:"90–150s", cues:["Controle na descida"], notes:"" },
      hard:{ title:"Pausa no fundo", sets:"4", reps:"6–10", rest:"120–180s", cues:["1s pausa"], notes:"" },
    }
  }),

  makeEntry({ name:"Passada caminhando", group:"Pernas", equipment:["Peso corporal","Halteres opcional"], pattern:"Lunge", aliases:["walking lunge"], primaryMuscles:["Glúteos","Quadríceps"],
    variants:{
      easy:{ title:"Sem carga, passo curto", sets:"2–3", reps:"10–16 passos", rest:"60–90s", cues:["Equilíbrio"], notes:"" },
      medium:{ title:"Passo normal", sets:"3–4", reps:"16–24 passos", rest:"75–120s", cues:["Tronco firme"], notes:"" },
      hard:{ title:"Com halteres", sets:"4", reps:"12–20 passos", rest:"90–150s", cues:["Controle total"], notes:"" },
    }
  }),

  makeEntry({ name:"Cadeira abdutora (elástico em casa)", group:"Glúteo", equipment:["Mini-band"], pattern:"Abdução", aliases:["abdução com elástico"], primaryMuscles:["Glúteo médio"],
    variants:{
      easy:{ title:"Mini-band leve", sets:"2–3", reps:"15–20", rest:"45–75s", cues:["Sem inclinar tronco"], notes:"" },
      medium:{ title:"Mais tensão", sets:"3–4", reps:"12–20", rest:"60–90s", cues:["1s no pico"], notes:"" },
      hard:{ title:"Isometria + reps", sets:"4", reps:"10–15 + 15s", rest:"75–120s", cues:["Segura aberto"], notes:"" },
    }
  }),

  makeEntry({ name:"Good morning (leve)", group:"Posterior", equipment:["Barra leve","Bastão"], pattern:"Dobradiça", aliases:["goodmorning"], primaryMuscles:["Posterior","Glúteos","Lombar (estabilização)"],
    variants:{
      easy:{ title:"Com bastão", sets:"2–3", reps:"10–12", rest:"75–120s", cues:["Quadril para trás"], notes:"" },
      medium:{ title:"Barra leve", sets:"3–4", reps:"8–10", rest:"90–150s", cues:["Coluna neutra"], notes:"" },
      hard:{ title:"Tempo 3s descida", sets:"4", reps:"6–10", rest:"120–180s", cues:["Controle"], notes:"" },
    }
  }),

  makeEntry({ name:"Elevação de quadril no cabo (kickback)", group:"Glúteo", equipment:["Cabo","Tornozeleira"], pattern:"Extensão quadril", aliases:["glute kickback cabo"], primaryMuscles:["Glúteos"],
    variants:{
      easy:{ title:"Leve", sets:"2–3", reps:"12–15", rest:"45–75s", cues:["Sem girar quadril"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"10–15", rest:"60–90s", cues:["1s no topo"], notes:"" },
      hard:{ title:"Pausa + parciais", sets:"4", reps:"10–12 + 10 parciais", rest:"75–120s", cues:["Curto e controlado"], notes:"" },
    }
  }),

  // COSTAS
  makeEntry({ name:"Barra fixa assistida", group:"Costas", equipment:["Máquina assistida","Elástico"], pattern:"Puxar vertical", aliases:["pull-up assistido"], primaryMuscles:["Dorsal","Bíceps"],
    variants:{
      easy:{ title:"Assistência alta", sets:"2–3", reps:"5–8", rest:"90–150s", cues:["Queixo sobe", "Sem balançar"], notes:"" },
      medium:{ title:"Assistência média", sets:"3–4", reps:"6–10", rest:"120–180s", cues:["Puxa com costas"], notes:"" },
      hard:{ title:"Pouca assistência", sets:"4", reps:"4–8", rest:"150–210s", cues:["Pausa em cima"], notes:"" },
    }
  }),

  makeEntry({ name:"Remada máquina", group:"Costas", equipment:["Máquina"], pattern:"Puxar horizontal", aliases:["remada articulada"], primaryMuscles:["Costas","Bíceps"],
    variants:{
      easy:{ title:"Leve", sets:"2–3", reps:"12–15", rest:"60–90s", cues:["Escápula fecha"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"8–12", rest:"90–150s", cues:["Sem roubar"], notes:"" },
      hard:{ title:"Pausa 2s atrás", sets:"4", reps:"6–10", rest:"120–180s", cues:["Segura"], notes:"" },
    }
  }),

  makeEntry({ name:"Pullover no cabo", group:"Costas", equipment:["Cabo"], pattern:"Extensão ombro", aliases:["pullover"], primaryMuscles:["Dorsal","Peito (assistência)"],
    variants:{
      easy:{ title:"Leve", sets:"2–3", reps:"12–15", rest:"45–75s", cues:["Costas contraem"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"10–12", rest:"60–90s", cues:["Sem arquear lombar"], notes:"" },
      hard:{ title:"Tempo 3s subida", sets:"4", reps:"8–10", rest:"75–120s", cues:["Controle"], notes:"" },
    }
  }),

  // PEITO
  makeEntry({ name:"Supino inclinado (halter)", group:"Peito", equipment:["Halteres","Banco"], pattern:"Empurrar horizontal", aliases:["incline dumbbell press"], primaryMuscles:["Peito superior","Tríceps"],
    variants:{
      easy:{ title:"Leve", sets:"2–3", reps:"10–15", rest:"60–90s", cues:["Escápulas firmes"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"8–12", rest:"75–120s", cues:["Amplitude segura"], notes:"" },
      hard:{ title:"Pausa embaixo", sets:"4", reps:"6–10", rest:"90–150s", cues:["1s pausa"], notes:"" },
    }
  }),

  makeEntry({ name:"Peck-deck", group:"Peito", equipment:["Máquina"], pattern:"Adução horizontal", aliases:["voador"], primaryMuscles:["Peito"],
    variants:{
      easy:{ title:"Leve", sets:"2–3", reps:"12–15", rest:"45–75s", cues:["Sem bater pesos"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"10–12", rest:"60–90s", cues:["1s contração"], notes:"" },
      hard:{ title:"Drop-set", sets:"3", reps:"10 + 8 + 6", rest:"90s", cues:["Reduz carga"], notes:"" },
    }
  }),

  // OMBROS
  makeEntry({ name:"Elevação lateral no cabo", group:"Ombros", equipment:["Cabo"], pattern:"Abdução", aliases:["lateral raise cabo"], primaryMuscles:["Deltoide lateral"],
    variants:{
      easy:{ title:"Leve", sets:"2–3", reps:"12–15", rest:"45–75s", cues:["Controle"], notes:"" },
      medium:{ title:"Moderado", sets:"3–4", reps:"10–15", rest:"60–90s", cues:["Pausa 1s"], notes:"" },
      hard:{ title:"Parciais + reps", sets:"4", reps:"10–12 + 10 parciais", rest:"75–120s", cues:["Queima"], notes:"" },
    }
  }),

  // CORE
  makeEntry({ name:"Prancha lateral", group:"Core", equipment:["Colchonete"], pattern:"Anti-flexão lateral", aliases:["side plank"], primaryMuscles:["Oblíquos","Glúteo médio"],
    variants:{
      easy:{ title:"Joelho no chão", sets:"2–3", reps:"20–40s", rest:"45–75s", cues:["Quadril alto"], notes:"" },
      medium:{ title:"Completa", sets:"3–4", reps:"30–60s", rest:"60–90s", cues:["Sem cair"], notes:"" },
      hard:{ title:"Com elevação de perna", sets:"4", reps:"20–40s", rest:"75–120s", cues:["Controle"], notes:"" },
    }
  }),

  // CARDIO
  makeEntry({ name:"Elíptico", group:"Cardio", equipment:["Elíptico"], pattern:"Aeróbio", aliases:["elliptical"], primaryMuscles:["Cardiorrespiratório"],
    variants:{
      easy:{ title:"10–20 min leve", sets:"1", reps:"10–20min", rest:"-", cues:["Confortável"], notes:"" },
      medium:{ title:"20–30 min", sets:"1", reps:"20–30min", rest:"-", cues:["Moderado"], notes:"" },
      hard:{ title:"Intervalos 30/30", sets:"1", reps:"12–20min", rest:"-", cues:["30s forte/30s leve"], notes:"" },
    }
  }),
];

// Se você quiser GARANTIR que tem 60+ sempre, valida aqui:
if (EXERCISE_BANK.length < 60) {
  // eslint-disable-next-line no-console
  console.warn("[exercisebank] Banco com menos de 60 itens:", EXERCISE_BANK.length);
}

/**
 * Index para buscar por nome/alias (case-insensitive)
 */
function buildIndex(list) {
  const map = new Map();
  for (const ex of list) {
    const keys = [ex.name, ...(ex.aliases || [])].map(normalize).filter(Boolean);
    for (const k of keys) {
      if (!map.has(k)) map.set(k, ex);
    }
    // também indexa pelo id
    map.set(normalize(ex.id), ex);
  }
  return map;
}

const INDEX = buildIndex(EXERCISE_BANK);

const exerciseBank = {
  list: EXERCISE_BANK,
  index: INDEX,

  /**
   * get("agachamento goblet") ou get("goblet squat")
   */
  get(query) {
    const k = normalize(query);
    return INDEX.get(k) || null;
  },

  /**
   * search("agach") retorna lista por contains
   */
  search(query) {
    const q = normalize(query);
    if (!q) return [];
    const out = [];
    for (const ex of EXERCISE_BANK) {
      const all = [ex.name, ...(ex.aliases || []), ex.id].map(normalize);
      if (all.some((s) => s.includes(q))) out.push(ex);
    }
    return out;
  },

  /**
   * Ex: getGuided("agachamento goblet", "easy")
   */
  getGuided(query, level = "easy") {
    const ex = this.get(query);
    if (!ex) return null;
    const lv = String(level || "easy").toLowerCase();
    return ex.variants?.[lv] || ex.variants?.easy || null;
  },
};

export default exerciseBank;
export { EXERCISE_BANK };
