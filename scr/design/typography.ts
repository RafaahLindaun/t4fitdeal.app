/**
 * ACCQUA Sports — escala tipográfica canônica.
 * Componentes novos devem consumir estes tokens/CSS vars em vez de valores soltos.
 */
export const typography = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "28px",
} as const;

export type TypographyToken = keyof typeof typography;
