import { useRef, type TouchEventHandler } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const PRIMARY_TAB_ROUTES = ["/menu-teste", "/treino", "/aulas", "/perfil"] as const;

const IGNORE_SELECTOR = [
  "[data-tab-swipe-ignore]",
  ".accqua-swipe-item",
  ".classes-day-pills",
  ".classes-type-filters",
  ".workout-exercise-stage",
  "input",
  "textarea",
  "select",
  "[role='slider']",
].join(",");

function tabIndexForPath(pathname: string) {
  return PRIMARY_TAB_ROUTES.findIndex((route) => pathname.startsWith(route));
}

function shouldIgnore(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(IGNORE_SELECTOR));
}

export function useTabSwipe({
  disabled = false,
  threshold = 60,
  onNavigate,
  onBoundary,
}: {
  disabled?: boolean;
  threshold?: number;
  onNavigate?: (direction: -1 | 1) => void;
  onBoundary?: (direction: -1 | 1) => void;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const index = tabIndexForPath(location.pathname);
  const startRef = useRef<{ x: number; y: number; enabled: boolean } | null>(null);

  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    if (disabled || index < 0 || event.touches.length !== 1 || shouldIgnore(event.target)) {
      startRef.current = null;
      return;
    }
    const touch = event.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, enabled: true };
  };

  const onTouchMove: TouchEventHandler<HTMLElement> = (event) => {
    const start = startRef.current;
    if (!start?.enabled || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > Math.abs(dx) + 10) startRef.current = null;
  };

  const onTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start?.enabled || disabled || index < 0) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.2) return;

    // Swipe para a esquerda avança; swipe para a direita volta.
    const direction: -1 | 1 = dx < 0 ? 1 : -1;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= PRIMARY_TAB_ROUTES.length) {
      onBoundary?.(direction);
      return;
    }
    onNavigate?.(direction);
    navigate(PRIMARY_TAB_ROUTES[nextIndex]);
  };

  return {
    enabled: !disabled && index >= 0,
    activeIndex: index,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
