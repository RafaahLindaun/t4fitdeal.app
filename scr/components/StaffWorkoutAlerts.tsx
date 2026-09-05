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
import { loadFeedbackPreferences, playAccquaChime } from "../lib/appFeedback";

const STAFF_ALERT_POLL_MS = 90_000;

function dispatchAlerts(alerts: WorkoutRequiredAlert[]) {
  window.dispatchEvent(
    new CustomEvent(WORKOUT_ALERTS_EVENT, {
      detail: alerts,
    }),
  );
}

export default function StaffWorkoutAlerts() {
  const { user, profile } = useAuth();
  const notifying = useRef(new Set<string>());
  const inFlight = useRef(false);

  const isStaff =
    profile?.role === "professor" ||
    profile?.role === "reception" ||
    profile?.role === "admin";

  useEffect(() => {
    if (!user || !isStaff) {
      dispatchAlerts([]);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      if (cancelled || inFlight.current || document.visibilityState !== "visible") return;
      inFlight.current = true;
      try {
        const alerts = await loadWorkoutRequiredAlerts();
        if (cancelled) return;

        dispatchAlerts(alerts);
        const preferences = await loadFeedbackPreferences(user.id);

        for (const alert of alerts) {
          if (alert.deliveredAt || notifying.current.has(alert.id)) continue;
          notifying.current.add(alert.id);

          const displayed = preferences.workoutNotifications
            ? await showWorkoutRequiredNotification(alert)
            : false;
          if (displayed) {
            playAccquaChime(user.id, "attention");
            await markWorkoutRequiredAlertDelivered(alert.id);
          }

          notifying.current.delete(alert.id);
        }
      } catch {
        if (!cancelled) dispatchAlerts([]);
      } finally {
        inFlight.current = false;
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), STAFF_ALERT_POLL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    const handleFocus = () => void refresh();
    const handleRefreshEvent = () => void refresh();

    window.addEventListener("focus", handleFocus);
    window.addEventListener(WORKOUT_ALERTS_REFRESH_EVENT, handleRefreshEvent);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(WORKOUT_ALERTS_REFRESH_EVENT, handleRefreshEvent);
      document.removeEventListener("visibilitychange", handleVisibility);
      inFlight.current = false;
    };
  }, [isStaff, user?.id]);

  return null;
}
