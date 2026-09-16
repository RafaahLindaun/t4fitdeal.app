import { useEffect } from "react";

const BLOCKED_COPY = /(indispon[ií]vel|sem estoque|lotad[oa]|matr[ií]cula necess[aá]ria|regularizar acesso|n[aã]o dispon[ií]vel|n[aã]o permitido|bloquead[oa]|acesso necess[aá]rio|fora do (?:seu )?plano)/i;
const TEMPORARY_COPY = /(carregando|salvando|enviando|gerando|reservando|verificando|processando|aguarde|entrando|excluindo|cancelando|publicando|analisando)/i;
const CANDIDATE_SELECTOR = [
  "button:disabled",
  "[aria-disabled='true']",
  "[data-not-allowed='true']",
  ".class-card.is-blocked button",
  ".staff-action-card:disabled",
  ".accqua-bottom-item.is-disabled",
].join(",");

function readableCopy(element: HTMLElement) {
  return [
    element.textContent ?? "",
    element.getAttribute("aria-label") ?? "",
    element.getAttribute("title") ?? "",
  ].join(" ").replace(/\s+/g, " ").trim();
}

function isSemanticallyBlocked(element: HTMLElement) {
  if (element.dataset.notAllowed === "true") return true;
  if (element.closest(".class-card.is-blocked")) return true;
  if (element.matches(".staff-action-card:disabled, .accqua-bottom-item.is-disabled")) return true;

  const copy = readableCopy(element);
  if (element.getAttribute("aria-busy") === "true" || TEMPORARY_COPY.test(copy)) return false;
  return BLOCKED_COPY.test(copy);
}

function enhance(element: HTMLElement) {
  if (!isSemanticallyBlocked(element)) {
    if (element.dataset.accquaNotAllowed === "true") {
      element.classList.remove("accqua-not-allowed-action", "is-denied-feedback");
      delete element.dataset.accquaNotAllowed;
      delete element.dataset.accquaWasNativeDisabled;
    }
    return;
  }

  element.dataset.accquaNotAllowed = "true";
  element.classList.add("accqua-not-allowed-action");

  if (element instanceof HTMLButtonElement && element.disabled) {
    element.dataset.accquaWasNativeDisabled = "true";
    element.disabled = false;
    element.setAttribute("aria-disabled", "true");
  }
}

function scan(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR).forEach(enhance);
  if (root instanceof HTMLElement && root.matches(CANDIDATE_SELECTOR)) enhance(root);
}

export default function NotAllowedRuntime() {
  useEffect(() => {
    let frame = 0;
    const scheduleScan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => scan());
    };

    scan();
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "aria-busy", "class", "data-not-allowed"],
      characterData: true,
    });

    const pulse = (event: Event) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".accqua-not-allowed-action")
        : null;
      if (!target) return;
      target.classList.remove("is-denied-feedback");
      void target.offsetWidth;
      target.classList.add("is-denied-feedback");
      window.setTimeout(() => target.classList.remove("is-denied-feedback"), 360);
    };

    const block = (event: Event) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".accqua-not-allowed-action")
        : null;
      if (!target || target.dataset.accquaNotAllowed !== "true") return;
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
      pulse(event);
    };

    document.addEventListener("pointerdown", pulse, true);
    document.addEventListener("click", block, true);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("pointerdown", pulse, true);
      document.removeEventListener("click", block, true);
    };
  }, []);

  return null;
}
