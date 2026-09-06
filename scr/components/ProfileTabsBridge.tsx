import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SWIPE_DISTANCE = 64;
const SWIPE_MAX_VERTICAL = 56;
const SWIPE_MAX_DURATION = 680;
const IOS_EDGE_GUARD = 22;
const CLICK_SUPPRESS_MS = 420;

type SpatialDestination = "left" | "right";

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
  return Boolean(element?.closest(
    "input,select,textarea,[contenteditable='true'],[data-tab-swipe-ignore],.accqua-swipe-item,.profile-partners-swipe",
  ));
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function animateViewChange(destination: SpatialDestination, action: () => void) {
  const current = profileContent();
  // A página de destino fica espacialmente à esquerda ou à direita da atual.
  // Para ir à esquerda, a página atual acompanha o dedo para a direita; para ir
  // à direita, a atual acompanha para a esquerda.
  const currentExitSign = destination === "left" ? 1 : -1;

  if (!current || reducedMotion()) {
    action();
    return;
  }

  try {
    await current.animate(
      [
        { transform: "translate3d(0,0,0)", opacity: 1 },
        { transform: `translate3d(${currentExitSign * 22}px,0,0)`, opacity: 0.74 },
      ],
      { duration: 122, easing: "cubic-bezier(.4,0,1,1)" },
    ).finished;
  } catch {
    // A troca pode desmontar a view antes do fim da animação.
  }

  action();

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const next = profileContent();
      if (!next || reducedMotion()) return;
      next.animate(
        [
          { transform: `translate3d(${-currentExitSign * 28}px,0,0)`, opacity: 0.68 },
          { transform: "translate3d(0,0,0)", opacity: 1 },
        ],
        { duration: 290, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    });
  });
}

export default function ProfileTabsBridge() {
  const location = useLocation();
  const navigate = useNavigate();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const transitionLock = useRef(false);
  const suppressClickUntil = useRef(0);

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

    const runTransition = async (destination: SpatialDestination, action: () => void) => {
      if (transitionLock.current) return;
      transitionLock.current = true;
      await animateViewChange(destination, action);
      window.setTimeout(() => { transitionLock.current = false; }, 330);
    };

    const openPartners = () => {
      if (!isMainView()) return;
      const realButton = document.querySelector<HTMLButtonElement>(".profile-stat-partners");
      if (!realButton) return;
      void runTransition("right", () => realButton.click());
    };

    const openMain = () => {
      if (!isPartnersView()) return;
      const back = document.querySelector<HTMLButtonElement>(".accqua-profile-header button[aria-label='Voltar']");
      if (!back) return;
      void runTransition("left", () => back.click());
    };

    const openClasses = () => {
      if (!isMainView()) return;
      void runTransition("left", () => navigate("/aulas"));
    };

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startedAt = 0;
    let startedInMain = false;
    let startedInPartners = false;

    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || shouldIgnoreGesture(event.target) || transitionLock.current) return;
      const main = isMainView();
      const partners = isPartnersView();
      if (!main && !partners) return;
      if (event.clientX <= IOS_EDGE_GUARD) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startedAt = performance.now();
      startedInMain = main && !partners;
      startedInPartners = partners;
    };

    const clearGesture = () => {
      pointerId = null;
      startedInMain = false;
      startedInPartners = false;
    };

    const pointerUp = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const duration = performance.now() - startedAt;
      const horizontalEnough = Math.abs(dx) >= SWIPE_DISTANCE
        && Math.abs(dy) <= Math.min(SWIPE_MAX_VERTICAL, Math.abs(dx) * 0.62);
      const fastEnough = duration <= SWIPE_MAX_DURATION;
      const partnersToProfile = startedInPartners && dx <= -SWIPE_DISTANCE;
      const profileToClasses = startedInMain && dx <= -SWIPE_DISTANCE;
      const profileToPartners = startedInMain && dx >= SWIPE_DISTANCE;
      clearGesture();

      if (!horizontalEnough || !fastEnough) return;

      suppressClickUntil.current = performance.now() + CLICK_SUPPRESS_MS;
      if (partnersToProfile) openMain();
      else if (profileToClasses) openClasses();
      else if (profileToPartners) openPartners();
    };

    const pointerCancel = (event: PointerEvent) => {
      if (pointerId !== null && event.pointerId === pointerId) clearGesture();
    };

    const suppressClickAfterSwipe = (event: MouseEvent) => {
      if (performance.now() > suppressClickUntil.current) return;
      suppressClickUntil.current = 0;
      event.preventDefault();
      event.stopPropagation();
    };

    const openMainEvent = () => openMain();

    window.addEventListener("accqua:profile-open-main", openMainEvent);
    document.addEventListener("pointerdown", pointerDown, { passive: true });
    document.addEventListener("pointerup", pointerUp, { passive: true });
    document.addEventListener("pointercancel", pointerCancel, { passive: true });
    document.addEventListener("click", suppressClickAfterSwipe, true);

    return () => {
      window.removeEventListener("accqua:profile-open-main", openMainEvent);
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointerup", pointerUp);
      document.removeEventListener("pointercancel", pointerCancel);
      document.removeEventListener("click", suppressClickAfterSwipe, true);
      clearGesture();
    };
  }, [location.pathname, navigate]);

  if (!host) return null;

  const openPartners = () => {
    if (transitionLock.current) return;
    const realButton = document.querySelector<HTMLButtonElement>(".profile-stat-partners");
    if (!realButton) return;
    transitionLock.current = true;
    void animateViewChange("right", () => realButton.click()).finally(() => {
      window.setTimeout(() => { transitionLock.current = false; }, 330);
    });
  };

  return createPortal(
    <nav className="profile-partners-tabs profile-main-tabs" aria-label="Perfil e parceiros">
      <button type="button" className="is-active" aria-current="page">Perfil</button>
      <button type="button" onClick={openPartners}>Parceiros</button>
    </nav>,
    host,
  );
}
