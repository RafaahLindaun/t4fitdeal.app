import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function personPlusSvg() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M15 19c0-3-2.2-5-5-5s-5 2-5 5"/><circle cx="10" cy="8" r="3.2"/><path d="M18 7v6M15 10h6"/>';
  return svg;
}

function decoratePartnerButton(button: HTMLButtonElement) {
  if (button.dataset.compactPartner1659 === "1") return;
  const original = button.textContent?.trim() ?? "";
  const state = original.includes("Convite enviado")
    ? "pending"
    : original.includes("Parceiro")
      ? "accepted"
      : original.includes("Aceitar")
        ? "incoming"
        : original.includes("Aguarde")
          ? "busy"
          : "add";
  button.dataset.partnerState = state;
  button.dataset.compactPartner1659 = "1";
  button.setAttribute(
    "aria-label",
    state === "pending" ? "Convite de parceria enviado" : state === "accepted" ? "Parceiro de treino" : state === "incoming" ? "Aceitar convite de parceria" : "Adicionar parceiro",
  );

  const avatar = document.querySelector<HTMLImageElement>(".ranking-profile-header .ranking-profile-avatar img");
  const fallback = document.querySelector<HTMLElement>(".ranking-profile-header .ranking-profile-avatar")?.textContent?.trim().slice(0, 2) || "AS";
  button.replaceChildren();

  const mini = document.createElement("span");
  mini.className = "ranking-partner-mini-avatar";
  if (avatar?.src) {
    const image = document.createElement("img");
    image.src = avatar.src;
    image.alt = "";
    mini.appendChild(image);
  } else {
    mini.textContent = fallback;
  }

  const glyph = document.createElement("span");
  glyph.className = "ranking-partner-person-plus";
  glyph.appendChild(personPlusSvg());
  button.append(mini, glyph);
}

export default function RankingSocialBridge() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/ranking") return;
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLButtonElement>(".ranking-profile-add").forEach((button) => {
          if (button.dataset.compactPartner1659 === "1") {
            const hasReactText = /Adicionar|Convite|Parceiro|Aceitar|Aguarde/.test(button.textContent ?? "");
            if (hasReactText) delete button.dataset.compactPartner1659;
          }
          decoratePartnerButton(button);
        });
      });
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}
