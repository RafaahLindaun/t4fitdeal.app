import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function syncCardioReviewCopy() {
  const toggle = document.querySelector<HTMLElement>(".admin-builder-cardio-toggle");
  if (!toggle) return;

  const eyebrow = toggle.querySelector<HTMLElement>("div > small");
  const state = toggle.querySelector<HTMLElement>(".admin-builder-cardio-state-label");
  const enabled = toggle.getAttribute("aria-pressed") === "true";

  if (eyebrow && eyebrow.textContent !== "REVISÃO · CARDIO") {
    eyebrow.textContent = "REVISÃO · CARDIO";
  }

  const nextState = enabled ? "Cardio incluído" : "Sem cardio";
  if (state && state.textContent !== nextState) state.textContent = nextState;
}

export default function Build1658Runtime() {
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.includes("/area-accqua/montar/editor")) return;

    let frame = 0;
    let shell: HTMLElement | null = null;
    let footer: HTMLElement | null = null;
    let lastTop = 0;
    let cleanupScroll = () => {};

    const bind = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        syncCardioReviewCopy();

        const nextShell = document.querySelector<HTMLElement>(".admin-builder-shell");
        const nextFooter = document.querySelector<HTMLElement>(".admin-builder-footer");
        if (!nextShell || !nextFooter) return;
        if (nextShell === shell && nextFooter === footer) return;

        cleanupScroll();
        shell = nextShell;
        footer = nextFooter;
        lastTop = shell.scrollTop;

        const onScroll = () => {
          if (!shell || !footer) return;
          if (window.matchMedia("(min-width: 1024px)").matches) {
            footer.classList.remove("is-scroll-hidden-1658");
            lastTop = shell.scrollTop;
            return;
          }

          const top = Math.max(0, shell.scrollTop);
          const delta = top - lastTop;

          if (top < 34 || delta < -5) {
            footer.classList.remove("is-scroll-hidden-1658");
          } else if (delta > 6) {
            footer.classList.add("is-scroll-hidden-1658");
          }

          lastTop = top;
        };

        const onResize = () => {
          if (window.matchMedia("(min-width: 1024px)").matches) {
            footer?.classList.remove("is-scroll-hidden-1658");
          }
        };

        shell.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize, { passive: true });
        cleanupScroll = () => {
          shell?.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
          footer?.classList.remove("is-scroll-hidden-1658");
        };
      });
    };

    bind();
    const observer = new MutationObserver(bind);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-pressed"],
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      cleanupScroll();
    };
  }, [location.pathname, location.search]);

  return null;
}
