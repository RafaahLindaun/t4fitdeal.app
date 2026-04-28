const ICONS = {
  gluteo: "/icons/emphasis/gluteo.png",
  quadriceps: "/icons/emphasis/quadriceps.png",
  panturrilha: "/icons/emphasis/panturrilha.png",
  posterior: "/icons/emphasis/posterior.png",
  abdomen: "/icons/emphasis/abdomen.png",
  perda_peso: "/icons/emphasis/perda-peso.png",
  biceps: "/icons/emphasis/biceps.png",
  ombro: "/icons/emphasis/ombro.png",
  triceps: "/icons/emphasis/triceps.png",
  peitoral: "/icons/emphasis/peitoral.png",
  costas: "/icons/emphasis/costas.png",
  lombar: "/icons/emphasis/lombar.png",
  trapezio: "/icons/emphasis/trapezio.png",
  pescoco: "/icons/emphasis/pescoco.png",
  leve: "/icons/emphasis/leve.png",
  turbo: "/icons/emphasis/turbo.png",
};

const ALIASES = {
  gluteo: "gluteo",
  gluteos: "gluteo",

  quadriceps: "quadriceps",
  quadriceps_femoral: "quadriceps",

  panturrilha: "panturrilha",

  posterior: "posterior",
  posterior_coxa: "posterior",
  posterior_de_coxa: "posterior",

  abdomen: "abdomen",
  abdomen_trincado: "abdomen",
  abdominal: "abdomen",
  core: "abdomen",

  emagrecer: "perda_peso",
  emagrecimento: "perda_peso",
  perda_peso: "perda_peso",
  perda_de_peso: "perda_peso",
  perda: "perda_peso",

  biceps: "biceps",
  braco_biceps: "biceps",

  ombro: "ombro",
  ombros: "ombro",
  deltoide: "ombro",

  triceps: "triceps",
  braco_triceps: "triceps",

  peito: "peitoral",
  peitoral: "peitoral",

  costas: "costas",
  dorsais: "costas",
  costas_dorsais: "costas",

  lombar: "lombar",
  ciatico: "lombar",
  lombar_ciatico: "lombar",

  trapezio: "trapezio",

  pescoco: "pescoco",
  cervical: "pescoco",

  leve: "leve",
  modo_leve: "leve",

  forte: "turbo",
  turbo: "turbo",
  modo_turbo: "turbo",
};

function normalizeType(type) {
  const raw = String(type || "gluteo")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return ALIASES[raw] || raw;
}

export default function EmphasisIcon({
  type = "gluteo",
  size = 118,
  alt = "",
  style,
}) {
  const key = normalizeType(type);
  const src = ICONS[key] || ICONS.gluteo;

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      draggable={false}
      onError={(event) => {
        if (!event.currentTarget.dataset.fallback) {
          event.currentTarget.dataset.fallback = "1";
          event.currentTarget.src = ICONS.gluteo;
        }
      }}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
        userSelect: "none",
        WebkitUserDrag: "none",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}
