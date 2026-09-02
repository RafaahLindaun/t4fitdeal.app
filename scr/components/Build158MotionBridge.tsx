import { useEffect } from "react";

const STEP_ORDER = ["programa", "rotina", "exercicios", "cardio"] as const;

function currentStep(node: HTMLElement) {
  return STEP_ORDER.find((step) => node.classList.contains(`is-step-${step}`)) ?? "programa";
}

export default function Build158MotionBridge() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/area-accqua/montar")) return;

    const screen = document.querySelector<HTMLElement>(".admin-builder-screen");
    if (!screen) return;

    let previous = currentStep(screen);
    let timer = 0;

    const retrigger = (direction: "forward" | "back") => {
      screen.dataset.stepDirection = direction;
      screen.classList.remove("build158-step-animating");
      void screen.offsetWidth;
      screen.classList.add("build158-step-animating");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => screen.classList.remove("build158-step-animating"), 300);

      const scrollHost = screen.querySelector<HTMLElement>(".admin-builder-shell");
      if (scrollHost && window.matchMedia("(max-width: 1023px)").matches) {
        scrollHost.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const observer = new MutationObserver(() => {
      const next = currentStep(screen);
      if (next === previous) return;
      const from = STEP_ORDER.indexOf(previous);
      const to = STEP_ORDER.indexOf(next);
      retrigger(to >= from ? "forward" : "back");
      previous = next;
    });

    observer.observe(screen, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
