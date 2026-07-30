import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  loadWorkoutRequiredAlerts,
  markWorkoutRequiredAlertDelivered,
  type WorkoutRequiredAlert,
} from "../lib/admin";
import {
  showWorkoutRequiredNotification,
  WORKOUT_ALERTS_EVENT,
  WORKOUT_ALERTS_REFRESH_EVENT,
} from "../lib/staffNotifications";

function dispatchAlerts(alerts: WorkoutRequiredAlert[]) {
  window.dispatchEvent(
    new CustomEvent(WORKOUT_ALERTS_EVENT, {
      detail: alerts,
    }),
  );
}

export default function StaffWorkoutAlerts() {
  const { user, profile, landingPath } = useAuth();
  const notifying = useRef(new Set<string>());

  const isStaff =
    profile?.role === "professor" ||
    profile?.role === "reception" ||
    profile?.role === "admin";

  useEffect(() => {
    if (!user || !isStaff || landingPath !== "/menu-teste") {
      dispatchAlerts([]);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const alerts = await loadWorkoutRequiredAlerts();
        if (cancelled) return;

        dispatchAlerts(alerts);

        for (const alert of alerts) {
          if (alert.deliveredAt || notifying.current.has(alert.id)) continue;
          notifying.current.add(alert.id);

          const displayed = await showWorkoutRequiredNotification(alert);
          if (displayed) {
            await markWorkoutRequiredAlertDelivered(alert.id);
          }

          notifying.current.delete(alert.id);
        }
      } catch {
        if (!cancelled) dispatchAlerts([]);
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener(WORKOUT_ALERTS_REFRESH_EVENT, refresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(WORKOUT_ALERTS_REFRESH_EVENT, refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isStaff, landingPath, user?.id]);

  return null;
}
