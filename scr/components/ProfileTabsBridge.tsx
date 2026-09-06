import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const SWIPE_TRIGGER = 64;
const DRAG_LIMIT = 92;

function profileContent() {
  return document.querySelector<HTMLElement>(".accqua-profile-content");
}

function isMainView() {
  return Boolean(document.querySelector(".accqua-profile-content.is-main-view"));
}

function isPartnersView() {
  return Boolean(document.querySelector(".profile-partners-panel"));
}

function shouldIgnoreGesture(target: EventTarget | null) {
  const element = target instanceof Element ? target : null;
  return Boolean(element?.closest("button,input,select,textarea,a,[role='button'],[data-tab-swipe-ignore],.accqua-swipe-item"));
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resetInlineDrag(content: HTMLElement | null) {
  if (!content) return;
  content.style.removeProperty("transform");
  content.style.removeProperty("opacity");
  content.style.removeProperty("transition");
  content.style.removeProperty("will-change");
}

async function animateViewChange(direction: "forward" | "back", action: () => void) {
  const current = profileContent();
  const sign = direction === "forward" ? -1 : 1;

  if (!current || reducedMotion()) {
    resetInlineDrag(current);
    action();
    return;
  }

  resetInlineDrag(current);
  try {
    await current.animate(
      [
        { transform: "translate3d(0,0,0)", opacity: 1 },
        { transform: `translate3d(${sign * 28}px,0,0)`, opacity: 0.18 },
      ],
      { duration: 150, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    ).finished;
  } catch {
    // A troca de view pode desmontar conteúdo durante a animação; seguimos normalmente.
  }

  action();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const next = profileContent();
      if (!next) return;
      resetInlineDrag(next);
      next.animate(
        [
          { transform: `translate3d(${-sign * 30}px,0,0)`, opacity: 0.18 },
          { transform: "translate3d(0,0,0)", opacity: 1 },
        ],
        { duration: 310, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    });
  });
}

export default function ProfileTabsBridge() {
  const location = useLocation();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (location.pathname !== "/perfil") {
      setHost(null);
      return;
    }

    let current: HTMLElement | null = null;
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const main = document.querySelector<HTMLElement>(".accqua-profile-content.is-main-view");
        if (!main) {
          current?.remove();
          current = null;
          setHost(null);
          return;
        }
        if (current?.isConnected && current.parentElement === main) {
          setHost(current);
          return;
        }
        current?.remove();
        current = document.createElement("div");
        current.className = "profile-main-tabs-host";
        main.prepend(current);
        setHost(current);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      current?.remove();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/perfil") return;

    const openPartners = () => {
      if (!isMainView()) return;
      const realButton = document.querySelector<HTMLButtonElement>(".profile-stat-partners");
      if (!realButton) return;
      void animateViewChange("forward", () => realButton.click());
    };

    const openMain = () => {
      if (!isPartnersView()) return;
      const back = document.querySelector<HTMLButtonElement>(".accqua-profile-header button[aria-label='Voltar']");
      if (!back) return;
      void animateViewChange("back", () => back.click());
    };

    const interceptPartnerTab = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const profileTab = target?.closest<HTMLButtonElement>(".profile-partners-panel .profile-partners-tabs button:first-child");
      if (!profileTab) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openMain();
    };

    let startX = 0;
    let startY = 0;
    let dragging = false;
    let horizontal = false;
    let draggedContent: HTMLElement | null = null;

    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || shouldIgnoreGesture(event.target)) return;
      if (!isMainView() && !isPartnersView()) return;
      startX = event.clientX;
      startY = event.clientY;
      dragging = true;
      horizontal = false;
      draggedContent = profileContent();
      if (draggedContent) draggedContent.style.willChange = "transform, opacity";
    };

    const pointerMove = (event: PointerEvent) => {
      if (!dragging || !draggedContent) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!horizontal) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.18) {
          dragging = false;
          resetInlineDrag(draggedContent);
          draggedContent = null;
          return;
        }
        horizontal = true;
      }

      const allowed = isMainView() ? Math.min(0, dx) : isPartnersView() ? Math.max(0, dx) : 0;
      const translated = Math.max(-DRAG_LIMIT, Math.min(DRAG_LIMIT, allowed));
      draggedContent.style.transition = "none";
      draggedContent.style.transform = `translate3d(${translated}px,0,0)`;
      draggedContent.style.opacity = String(Math.max(0.72, 1 - Math.abs(translated) / 330));
    };

    const settleBack = (content: HTMLElement | null) => {
      if (!content) return;
      const animation = content.animate(
        [
          { transform: content.style.transform || "translate3d(0,0,0)", opacity: Number(content.style.opacity || 1) },
          { transform: "translate3d(0,0,0)", opacity: 1 },
        ],
        { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" },
      );
      void animation.finished.finally(() => resetInlineDrag(content));
    };

    const pointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      const content = draggedContent;
      const dx = event.clientX - startX;
      dragging = false;
      draggedContent = null;

      if (horizontal && isMainView() && dx <= -SWIPE_TRIGGER) {
        resetInlineDrag(content);
        openPartners();
        return;
      }
      if (horizontal && isPartnersView() && dx >= SWIPE_TRIGGER) {
        resetInlineDrag(content);
        openMain();
        return;
      }
      settleBack(content);
    };

    document.addEventListener("click", interceptPartnerTab, true);
    document.addEventListener("pointerdown", pointerDown, { passive: true });
    document.addEventListener("pointermove", pointerMove, { passive: true });
    document.addEventListener("pointerup", pointerUp, { passive: true });
    document.addEventListener("pointercancel", pointerUp, { passive: true });

    return () => {
      document.removeEventListener("click", interceptPartnerTab, true);
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("pointerup", pointerUp);
      document.removeEventListener("pointercancel", pointerUp);
      resetInlineDrag(draggedContent);
    };
  }, [location.pathname]);

  if (!host) return null;

  const openPartners = () => {
    const realButton = document.querySelector<HTMLButtonElement>(".profile-stat-partners");
    if (!realButton) return;
    void animateViewChange("forward", () => realButton.click());
  };

  return createPortal(
    <nav className="profile-partners-tabs profile-main-tabs" aria-label="Perfil e parceiros">
      <button type="button" className="is-active" aria-current="page">Perfil</button>
      <button type="button" onClick={openPartners}>Parceiros</button>
    </nav>,
    host,
  );
}
