import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HOME_DAILY_MESSAGES = [
  "Seu app da academia",
  "Aplicativo ACCQUA Sports",
  "Bem-vindo ao ACCQUA",
  "ACCQUA Sports em suas mãos",
  "Seu espaço ACCQUA",
  "Tudo da ACCQUA em um só lugar",
  "Seu dia na ACCQUA começa aqui",
  "Conectado com a ACCQUA",
  "Sua rotina, seu ACCQUA",
  "ACCQUA com você",
  "Seu ritmo. Seu ACCQUA.",
  "Mais perto da sua evolução",
  "Sua academia no seu ritmo",
  "Seu progresso em movimento",
  "Hoje é dia de ACCQUA",
  "Sua experiência ACCQUA",
  "Treino e evolução no ACCQUA",
  "O seu ACCQUA de todos os dias",
  "Sua jornada começa aqui",
  "Evolua com o ACCQUA",
  "Seu próximo passo está aqui",
  "ACCQUA Sports, do seu jeito",
  "Seu treino na palma da mão",
  "Sua rotina fitness no ACCQUA",
  "Um novo dia no ACCQUA",
  "Seu espaço de evolução",
  "ACCQUA acompanha seu ritmo",
  "Sua academia mais perto",
  "Tudo pronto para o seu dia",
  "Seu movimento começa aqui",
  "Treine. Evolua. ACCQUA.",
  "Seu progresso mora aqui",
  "Bem-vindo ao seu espaço ACCQUA",
  "Sua experiência fitness começa aqui",
  "ACCQUA no seu dia",
  "Seu treino, sua rotina, seu app",
  "Mais treino, mais evolução",
  "Seu dia em movimento",
  "ACCQUA Sports com você",
  "Seu ACCQUA, todos os dias",
] as const;

function dailyMessage(date = new Date()) {
  const localDaySerial = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  const index =
    ((localDaySerial % HOME_DAILY_MESSAGES.length) + HOME_DAILY_MESSAGES.length) %
    HOME_DAILY_MESSAGES.length;
  return HOME_DAILY_MESSAGES[index];
}

export default function HomeGuidance170() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/menu-teste") return;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const welcomeCopy = document.querySelector<HTMLElement>(".accqua-menu-welcome p");
        const message = dailyMessage();
        if (welcomeCopy && welcomeCopy.textContent !== message) {
          welcomeCopy.textContent = message;
        }

        const streak = document.querySelector<HTMLElement>(".accqua-streak-card");
        const title = streak?.querySelector<HTMLElement>(".accqua-streak-heading strong");
        const badge = streak?.querySelector<HTMLElement>(".accqua-streak-heading > span");
        if (!streak || !title || !badge) return;

        const zeroSequence = /^0\s+dias?\s+de\s+sequência/i.test(title.textContent?.trim() ?? "");
        const alreadyGuided = Boolean(title.querySelector(".accqua-streak-guided-copy-170"));
        const noPlan = /plano sem dias definidos/i.test(badge.textContent?.trim() ?? "");
        streak.classList.toggle("is-empty-170", (zeroSequence || alreadyGuided) && noPlan);

        if (zeroSequence) {
          const flame =
            title.querySelector(".accqua-streak-flame")?.outerHTML ??
            '<span class="accqua-streak-flame" aria-hidden="true">🔥</span>';
          title.innerHTML = `${flame}<span class="accqua-streak-guided-copy-170">Comece hoje e inicie sua sequência</span>`;
        }
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const dailyRefresh = window.setInterval(sync, 60_000);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearInterval(dailyRefresh);
    };
  }, [location.pathname]);

  return null;
}
