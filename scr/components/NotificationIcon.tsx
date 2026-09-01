export type NotificationIconId = "megafone" | "treino" | "pagamento" | "presente" | "alerta" | "conquista";

export const NOTIFICATION_ICON_OPTIONS: { id: NotificationIconId; label: string }[] = [
  { id: "megafone", label: "Aviso geral" },
  { id: "treino", label: "Treino" },
  { id: "pagamento", label: "Pagamento/matrícula" },
  { id: "presente", label: "Promoção/prêmio" },
  { id: "alerta", label: "Urgente" },
  { id: "conquista", label: "Conquista/ranking" },
];

export default function NotificationIcon({ id, size = 20 }: { id: NotificationIconId | string; size?: number }) {
  const common = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:1.9, strokeLinecap:"round" as const, strokeLinejoin:"round" as const, "aria-hidden":true };
  if (id === "treino") return <svg {...common}><path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12" /></svg>;
  if (id === "pagamento") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M7 15h4"/></svg>;
  if (id === "presente") return <svg {...common}><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7c-1.2-3.3-5-3.7-5.5-1.5C6 7.3 8.3 8 12 7ZM12 7c1.2-3.3 5-3.7 5.5-1.5C18 7.3 15.7 8 12 7Z"/></svg>;
  if (id === "alerta") return <svg {...common}><path d="M12 3 2.7 20h18.6L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>;
  if (id === "conquista") return <svg {...common}><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/></svg>;
  return <svg {...common}><path d="M4 10v4h4l6 4V6l-6 4H4Z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>;
}
