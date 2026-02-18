// src/data/exerciseBank.js

export const LEVEL_RANK = { leve: 1, medio: 2, pesado: 3 };

export const MUSCLE_GROUPS = [
  {
    id: "peito_triceps",
    name: "Peito + Tríceps",
    muscles: ["Peito", "Tríceps"],
    library: [
      // --- PEITO (LEVE)
      { name: "Chest press (máquina)", group: "Peito", difficulty: "leve" },
      { name: "Peck deck", group: "Peito", difficulty: "leve" },
      { name: "Flexão inclinada (no banco)", group: "Peito", difficulty: "leve" },
      { name: "Flexão com joelhos", group: "Peito", difficulty: "leve" },

      // --- PEITO (MÉDIO)
      { name: "Supino com halteres", group: "Peito", difficulty: "medio" },
      { name: "Supino inclinado com halteres", group: "Peito", difficulty: "medio" },
      { name: "Crossover (cabo)", group: "Peito", difficulty: "medio" },

      // --- PEITO (PESADO)
      { name: "Supino reto (barra)", group: "Peito", difficulty: "pesado" },
      { name: "Supino inclinado (barra)", group: "Peito", difficulty: "pesado" },

      // --- TRÍCEPS (LEVE/MÉDIO)
      { name: "Tríceps corda", group: "Tríceps", difficulty: "leve" },
      { name: "Tríceps barra (cabo)", group: "Tríceps", difficulty: "leve" },
      { name: "Tríceps francês (halter)", group: "Tríceps", difficulty: "medio" },
      { name: "Mergulho no banco (assistido)", group: "Tríceps", difficulty: "medio" },

      // --- TRÍCEPS (PESADO)
      { name: "Paralelas", group: "Tríceps/Peito", difficulty: "pesado" },
    ],
  },

  {
    id: "costas_biceps",
    name: "Costas + Bíceps",
    muscles: ["Costas", "Bíceps"],
    library: [
      // COSTAS (LEVE)
      { name: "Puxada frente (puxador)", group: "Costas", difficulty: "leve" },
      { name: "Remada baixa (cabo)", group: "Costas", difficulty: "leve" },
      { name: "Remada máquina (peito apoiado)", group: "Costas", difficulty: "leve" },
      { name: "Pulldown braço reto (cabo)", group: "Costas", difficulty: "leve" },

      // COSTAS (MÉDIO)
      { name: "Remada unilateral (halter)", group: "Costas", difficulty: "medio" },
      { name: "Pull-up assistido (máquina)", group: "Costas", difficulty: "medio" },
      { name: "Face pull", group: "Ombro/escápulas", difficulty: "medio" },

      // COSTAS (PESADO)
      { name: "Barra fixa", group: "Costas", difficulty: "pesado" },
      { name: "Remada curvada (barra)", group: "Costas", difficulty: "pesado" },

      // BÍCEPS (LEVE/MÉDIO)
      { name: "Rosca alternada (halter)", group: "Bíceps", difficulty: "leve" },
      { name: "Rosca direta (halter)", group: "Bíceps", difficulty: "leve" },
      { name: "Rosca martelo", group: "Bíceps", difficulty: "leve" },
      { name: "Rosca no cabo", group: "Bíceps", difficulty: "medio" },
      { name: "Rosca na máquina (preacher)", group: "Bíceps", difficulty: "medio" },
    ],
  },

  {
    id: "pernas",
    name: "Pernas (Quad + geral)",
    muscles: ["Quadríceps", "Glúteos", "Posterior", "Panturrilha"],
    library: [
      // LEVES (ótimas pra iniciante)
      { name: "Leg press", group: "Pernas", difficulty: "leve" },
      { name: "Cadeira extensora", group: "Quadríceps", difficulty: "leve" },
      { name: "Mesa flexora", group: "Posterior", difficulty: "leve" },
      { name: "Abdutora (máquina)", group: "Glúteo médio", difficulty: "leve" },
      { name: "Adutora (máquina)", group: "Glúteo/adutores", difficulty: "leve" },
      { name: "Glute bridge", group: "Glúteos", difficulty: "leve" },
      { name: "Step-up (baixo)", group: "Glúteos/Quadríceps", difficulty: "leve" },
      { name: "Panturrilha (máquina)", group: "Panturrilha", difficulty: "leve" },

      // MÉDIOS
      { name: "Agachamento goblet (halter)", group: "Pernas", difficulty: "medio" },
      { name: "Afundo (halter leve)", group: "Glúteo/Quadríceps", difficulty: "medio" },
      { name: "Hip thrust (máquina/leve)", group: "Glúteos", difficulty: "medio" },

      // PESADOS
      { name: "Agachamento (barra)", group: "Pernas", difficulty: "pesado" },
      { name: "Terra romeno (barra)", group: "Posterior", difficulty: "pesado" },
    ],
  },

  {
    id: "ombro_core",
    name: "Ombro + Core",
    muscles: ["Ombros", "Core"],
    library: [
      // OMBRO (LEVE)
      { name: "Desenvolvimento (máquina)", group: "Ombros", difficulty: "leve" },
      { name: "Elevação lateral (halter leve)", group: "Ombros", difficulty: "leve" },
      { name: "Reverse fly (máquina)", group: "Ombro posterior", difficulty: "leve" },

      // OMBRO (MÉDIO)
      { name: "Desenvolvimento (halter)", group: "Ombros", difficulty: "medio" },
      { name: "Face pull", group: "Ombro/escápulas", difficulty: "medio" },
      { name: "Encolhimento (halter)", group: "Trapézio", difficulty: "medio" },

      // CORE (LEVE/MÉDIO/PESADO)
      { name: "Dead bug", group: "Core", difficulty: "leve" },
      { name: "Bird dog", group: "Core", difficulty: "leve" },
      { name: "Pallof press", group: "Core", difficulty: "leve" },
      { name: "Prancha", group: "Core", difficulty: "medio" },
      { name: "Abdominal (máquina)", group: "Core", difficulty: "medio" },
      { name: "Hanging knee raise", group: "Core", difficulty: "pesado" },
    ],
  },
];

// estilos (fichas) prontos
export const TRAINING_STYLES = [
  {
    id: "iniciante_fullbody_3x",
    name: "Iniciante • Full Body 3x",
    level: "iniciante",
    days: 3,
    dayGroups: ["pernas", "peito_triceps", "costas_biceps"], // você pode ajustar
    prescriptions: {
      0: { sets: 2, reps: "10–12", rest: "60–90s" },
      1: { sets: 2, reps: "10–12", rest: "60–90s" },
      2: { sets: 2, reps: "10–12", rest: "60–90s" },
    },
  },
  {
    id: "iniciante_upper_lower_4x",
    name: "Iniciante • Upper/Lower 4x",
    level: "iniciante",
    days: 4,
    dayGroups: ["peito_triceps", "pernas", "costas_biceps", "pernas"],
    prescriptions: {
      0: { sets: 3, reps: "8–12", rest: "60–90s" },
      1: { sets: 3, reps: "10–12", rest: "60–90s" },
      2: { sets: 3, reps: "8–12", rest: "60–90s" },
      3: { sets: 3, reps: "10–12", rest: "60–90s" },
    },
  },
  {
    id: "gluteo_foco_3x",
    name: "Glúteo foco • 3x",
    level: "iniciante",
    days: 3,
    dayGroups: ["pernas", "posterior_gluteo", "pernas"], // se você tiver esse group em outro lugar, mantém
    prescriptions: {
      0: { sets: 3, reps: "10–12", rest: "60–90s" },
      1: { sets: 3, reps: "10–12", rest: "60–90s" },
      2: { sets: 3, reps: "10–12", rest: "60–90s" },
    },
  },
];
