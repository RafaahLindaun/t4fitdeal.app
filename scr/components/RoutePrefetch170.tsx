import { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function RoutePrefetch170() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType === "2g") return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const common = [
        import("../pages/Treino"),
        import("../pages/Aulas"),
        import("../pages/Profile"),
        import("../pages/Cardio"),
      ];
      if (profile?.role === "student") {
        void Promise.allSettled([...common, import("../pages/Diet"), import("../pages/Ranking")]);
      } else {
        void Promise.allSettled([...common, import("../pages/AdminArea"), import("../pages/WorkoutBuilderEntry")]);
      }
    };

    const idle = (window as typeof window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    let timer = 0;
    let idleId = 0;
    if (idle) idleId = idle(run, { timeout: 1800 });
    else timer = window.setTimeout(run, 900);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      const cancelIdle = (window as typeof window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idleId && cancelIdle) cancelIdle(idleId);
    };
  }, [profile?.role, user?.id]);

  return null;
}
