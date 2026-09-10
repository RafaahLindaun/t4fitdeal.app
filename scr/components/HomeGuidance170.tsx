import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function HomeGuidance170() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/menu-teste") return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const streak = document.querySelector<HTMLElement>(".accqua-streak-card");
        const title = streak?.querySelector<HTMLElement>(".accqua-streak-heading strong");
        const badge = streak?.querySelector<HTMLElement>(".accqua-streak-heading > span");
        if (!streak || !title || !badge) return;

        const zeroSequence = /^0\s+dias?\s+de\s+sequência/i.test(title.textContent?.trim() ?? "");
        const noPlan = /plano sem dias definidos/i.test(badge.textContent?.trim() ?? "");
        streak.classList.toggle("is-empty-170", zeroSequence && noPlan);

        if (zeroSequence) {
          const flame = title.querySelector(".accqua-streak-flame")?.outerHTML ?? '<span class="accqua-streak-flame" aria-hidden="true">🔥</span>';
          title.innerHTML = `${flame}<span class="accqua-streak-guided-copy-170">Comece hoje e inicie sua sequência</span>`;
        }
        if (noPlan) badge.textContent = "Seu ritmo começa no primeiro treino";
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [location.pathname]);

  return null;
}
