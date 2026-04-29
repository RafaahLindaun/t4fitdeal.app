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
  quadriceps: "quadriceps",
  gluteo: "gluteo",
  panturrilha: "panturrilha",
  posterior: "posterior",
  abdomen: "abdomen",
  emagrecer: "emagrecer",
  perda_peso: "perda_peso",
  biceps: "biceps",
  ombro: "ombro",
  triceps: "triceps",
  peitoral: "peitoral",
  peito: "peitoral",
  costas: "costas",
  lombar: "lombar",
  trapezio: "trapezio",
  pescoco: "pescoco",
  leve: "leve",
  turbo: "turbo",
  forte: "turbo",
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
  style = {},
  imgStyle = {},
}) {
  const sources = useMemo(() => buildSources(type), [type]);
  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [type]);

  const src = sources[srcIndex];

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        onError={() => {
          setSrcIndex((current) => {
            const next = current + 1;
            return next < sources.length ? next : current;
          });
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
          userSelect: "none",
          WebkitUserDrag: "none",
          pointerEvents: "none",
          ...imgStyle,
        }}
      />
    </div>
  );
}
