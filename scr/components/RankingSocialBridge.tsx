import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function personPlusSvg(state: string) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  if (state === "accepted") {
    svg.innerHTML = '<path d="m6.5 12.5 3.2 3.2 7.8-8"/>';
  } else if (state === "pending") {
    svg.innerHTML = '<circle cx="12" cy="12" r="7"/><path d="M12 8v4l2.5 1.5"/>';
  } else {
    svg.innerHTML = '<path d="M15 19c0-3-2.2-5-5-5s-5 2-5 5"/><circle cx="10" cy="8" r="3.2"/><path d="M18 7v6M15 10h6"/>';
  }
  return svg;
}

function stateFromButton(button: HTMLButtonElement) {
  const original = button.textContent?.trim() ?? "";
  if (original.includes("Convite enviado")) return "pending";
  if (original.includes("Parceiro")) return "accepted";
  if (original.includes("Aceitar")) return "incoming";
  if (original.includes("Aguarde")) return "busy";
  return "add";
}

function ariaForState(state: string) {
  if (state === "pending") return "Convite de parceria enviado";
  if (state === "accepted") return "Parceiro de treino";
  if (state === "incoming") return "Aceitar convite de parceria";
  if (state === "busy") return "Atualizando parceria";
  return "Adicionar parceiro de treino";
}

function syncAvatarPartnerAction(button: HTMLButtonElement) {
  const state = stateFromButton(button);
  button.dataset.partnerState = state;
  button.dataset.avatarPartnerProxy = "1";

  const avatar = document.querySelector<HTMLElement>(".ranking-profile-header .ranking-profile-avatar");
  if (!avatar) return;
  avatar.classList.add("has-partner-action");

  let proxy = avatar.querySelector<HTMLElement>(".ranking-profile-avatar-partner-action");
  if (!proxy) {
    proxy = document.createElement("span");
    proxy.className = "ranking-profile-avatar-partner-action";
    proxy.setAttribute("role", "button");
    proxy.tabIndex = 0;
    proxy.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    proxy.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const source = document.querySelector<HTMLButtonElement>(".ranking-profile-add[data-avatar-partner-proxy='1']");
      if (!source || source.disabled) return;
      source.click();
    });
    proxy.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      const source = document.querySelector<HTMLButtonElement>(".ranking-profile-add[data-avatar-partner-proxy='1']");
      if (!source || source.disabled) return;
      source.click();
    });
    avatar.appendChild(proxy);
  }

  proxy.dataset.partnerState = state;
  proxy.setAttribute("aria-label", ariaForState(state));
  proxy.setAttribute("aria-disabled", button.disabled ? "true" : "false");
  proxy.replaceChildren(personPlusSvg(state));
}

function cleanupLegacyCompactUi() {
  document.querySelectorAll(".ranking-partner-mini-avatar,.ranking-partner-person-plus").forEach((element) => element.remove());
  document.querySelectorAll<HTMLButtonElement>(".ranking-profile-add").forEach((button) => {
    button.removeAttribute("data-compact-partner1659");
  });
}

export default function RankingSocialBridge() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/ranking") return;
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        cleanupLegacyCompactUi();
        document.querySelectorAll<HTMLButtonElement>(".ranking-profile-add").forEach(syncAvatarPartnerAction);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled", "class"],
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}
