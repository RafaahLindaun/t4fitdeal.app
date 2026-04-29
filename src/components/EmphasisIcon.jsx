import { useEffect, useMemo, useState } from "react";

const ICON_FILES = {
  gluteo: "gluteo.png",
  quadriceps: "quadriceps.png",
  panturrilha: "panturrilha.png",
  posterior: "posterior.png",
  abdomen: "abdomen.png",
  perda_peso: "perda-peso.png",
  emagrecer: "perda-peso.png",
  biceps: "biceps.png",
  ombro: "ombro.png",
  triceps: "triceps.png",
  peitoral: "peitoral.png",
  costas: "costas.png",
  lombar: "lombar.png",
  trapezio: "trapezio.png",
  pescoco: "pescoco.png",
  leve: "leve.png",
  turbo: "turbo.png",
  forte: "turbo.png",
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
  abdominal: "abdomen",
  core: "abdomen",

  emagrecer: "emagrecer",
  emagrecimento: "emagrecer",
  perda: "perda_peso",
  perda_peso: "perda_peso",
  perda_de_peso: "perda_peso",

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

function buildSources(type) {
  const key = normalizeType(type);
  const file = ICON_FILES[key] || ICON_FILES.gluteo;

  const lowerFile = file;
  const upperFile = file.replace(".png", ".PNG");

  return [
    `/icons/emphasis/${lowerFile}`,
    `/icons/emphasis/${upperFile}`,

    `/emphasis_pngs/${lowerFile}`,
    `/emphasis_pngs/${upperFile}`,

    `/icons/${lowerFile}`,
    `/icons/${upperFile}`,

    `/assets/icons/emphasis/${lowerFile}`,
    `/assets/icons/emphasis/${upperFile}`,
  ];
}

export default function EmphasisIcon({
  type = "gluteo",
  size = 118,
  alt = "",
  style = {},
  imgStyle = {},
}) {
  const sources = useMemo(() => buildSources(type), [type]);
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrcIndex(0);
    setFailed(false);
  }, [type]);

  const src = sources[srcIndex];

  /*
    O PNG foi salvo em 512x512 com espaço transparente em volta.
    Por isso o scale precisa compensar esse respiro interno.
    No card grande, ele aumenta mais.
    No card pequeno, aumenta menos para não estourar.
  */
  const visualScale = size >= 110 ? 1.95 : 1.45;

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        flexShrink: 0,
        lineHeight: 0,
        ...style,
      }}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          aria-hidden={alt ? undefined : "true"}
          draggable={false}
          onError={() => {
            setSrcIndex((current) => {
              const next = current + 1;

              if (next < sources.length) {
                return next;
              }

              setFailed(true);
              return current;
            });
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            transform: `scale(${visualScale})`,
            transformOrigin: "center",
            userSelect: "none",
            WebkitUserDrag: "none",
            pointerEvents: "none",
            ...imgStyle,
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 24,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,106,0,.10)",
            color: "#FF6A00",
            fontSize: Math.max(18, size * 0.32),
            fontWeight: 950,
          }}
        >
          {String(type || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}
