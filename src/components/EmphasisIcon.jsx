import React from "react";

const ICONS = {
  gluteo: "/emphasis_pngs/gluteo.png",
  quadriceps: "/emphasis_pngs/quadriceps.png",
  panturrilha: "/emphasis_pngs/panturrilha.png",
  posterior: "/emphasis_pngs/posterior.png",
  abdomen: "/emphasis_pngs/abdomen.png",
  perda_peso: "/emphasis_pngs/perda_peso.png",
  emagrecer: "/emphasis_pngs/perda_peso.png",
  biceps: "/emphasis_pngs/biceps.png",
  ombro: "/emphasis_pngs/ombro.png",
  triceps: "/emphasis_pngs/triceps.png",
  peitoral: "/emphasis_pngs/peitoral.png",
  costas: "/emphasis_pngs/costas.png",
  lombar: "/emphasis_pngs/lombar.png",
  trapezio: "/emphasis_pngs/trapezio.png",
  pescoco: "/emphasis_pngs/pescoco.png",
  leve: "/emphasis_pngs/leve.png",
  turbo: "/emphasis_pngs/turbo.png",
  forte: "/emphasis_pngs/turbo.png",
};

export default function EmphasisIcon({
  type,
  size = 96,
  alt,
  style = {},
  imgStyle = {},
}) {
  const src = ICONS[type] || ICONS.gluteo;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt || type || "ícone"}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
          userSelect: "none",
          WebkitUserDrag: "none",
          ...imgStyle,
        }}
      />
    </div>
  );
}
