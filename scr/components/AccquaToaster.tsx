import { useEffect } from "react";
import { Toaster } from "sonner";
import "./accqua-interactions.css";

const CUSTOM_EPHEMERAL_SELECTOR = [
  ".workout-toast",
  ".cardio-toast",
  ".accqua-engagement-toast",
  ".workout-rest-confirmation",
].join(",");

export default function AccquaToaster() {
  useEffect(() => {
    let active: HTMLElement | null = null;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;

    const clear = () => {
      active = null;
      pointerId = null;
    };

    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(CUSTOM_EPHEMERAL_SELECTOR)
        : null;
      if (!target) return;
      active = target;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
    };

    const pointerUp = (event: PointerEvent) => {
      if (!active || pointerId === null || event.pointerId !== pointerId) return;
      const target = active;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      clear();

      if (dy > -38 || Math.abs(dx) > Math.abs(dy) * 0.9) return;

      target.style.pointerEvents = "none";
      const animation = target.animate(
        [
          { transform: "translate3d(0,0,0)", opacity: 1 },
          { transform: "translate3d(0,-26px,0) scale(.985)", opacity: 0 },
        ],
        { duration: 180, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
      );
      void animation.finished.finally(() => {
        target.style.visibility = "hidden";
      });
    };

    const pointerCancel = (event: PointerEvent) => {
      if (pointerId !== null && event.pointerId === pointerId) clear();
    };

    document.addEventListener("pointerdown", pointerDown, { passive: true });
    document.addEventListener("pointerup", pointerUp, { passive: true });
    document.addEventListener("pointercancel", pointerCancel, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointerup", pointerUp);
      document.removeEventListener("pointercancel", pointerCancel);
      clear();
    };
  }, []);

  return (
    <Toaster
      position="top-center"
      richColors
      expand
      closeButton={false}
      duration={4200}
      visibleToasts={4}
      gap={10}
      swipeDirections={["top"]}
      toastOptions={{
        classNames: {
          toast: "accqua-sonner-toast",
          title: "accqua-sonner-title",
          description: "accqua-sonner-description",
          actionButton: "accqua-sonner-action",
          cancelButton: "accqua-sonner-cancel",
        },
      }}
    />
  );
}
