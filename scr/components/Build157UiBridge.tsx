import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function applyBuild157Copy() {
  document.querySelectorAll<HTMLElement>(".admin-training-action strong").forEach((node) => {
    if (node.textContent?.trim() === "Montar treino rápido") {
      node.textContent = "Selecionar treino rápido";
    }
  });
}

export default function Build157UiBridge() {
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith("/area-accqua")) return;
    applyBuild157Copy();
    const observer = new MutationObserver(applyBuild157Copy);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.search]);

  return null;
}
