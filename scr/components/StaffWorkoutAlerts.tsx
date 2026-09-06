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
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const STAFF_ALERT_POLL_MS = 180_000;
const STAFF_ALERT_MIN_GAP_MS = 1_200;

function dispatchAlerts(alerts: WorkoutRequiredAlert[]) {
  window.dispatchEvent(new CustomEvent(WORKOUT_ALERTS_EVENT, { detail: alerts }));
}

export default function StaffWorkoutAlerts() {
  const { user, profile } = useAuth();
  const notifying = useRef(new Set<string>());
  const inFlight = useRef(false);
  const queuedRefresh = useRef(false);
  const lastRefreshAt = useRef(0);

  const isStaff = profile?.role === "professor" || profile?.role === "reception" || profile?.role === "admin";

  useEffect(() => {
    if (!user || !isStaff) {
      dispatchAlerts([]);
      return;
    }

    let cancelled = false;

    const refresh = async (force = false) => {
      if (cancelled || document.visibilityState !== "visible") return;
      if (inFlight.current) {
        queuedRefresh.current = true;
        return;
      }
      const now = Date.now();
      if (!force && now - lastRefreshAt.current < STAFF_ALERT_MIN_GAP_MS) return;
      inFlight.current = true;
      lastRefreshAt.current = now;
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
        if (!cancelled && queuedRefresh.current) {
          queuedRefresh.current = false;
          window.setTimeout(() => void refresh(true), 80);
        }
      }
    };

    void refresh(true);
    const interval = window.setInterval(() => void refresh(), STAFF_ALERT_POLL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    const handleFocus = () => void refresh(true);
    const handleRefreshEvent = () => void refresh(true);

    window.addEventListener("focus", handleFocus);
    window.addEventListener(WORKOUT_ALERTS_REFRESH_EVENT, handleRefreshEvent);
    document.addEventListener("visibilitychange", handleVisibility);

    const realtime = isSupabaseConfigured
      ? supabase
          .channel(`staff-workout-alerts-${user.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "accqua_staff_notifications", filter: `recipient_id=eq.${user.id}` },
            () => void refresh(true),
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(WORKOUT_ALERTS_REFRESH_EVENT, handleRefreshEvent);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (realtime) void supabase.removeChannel(realtime);
      inFlight.current = false;
      queuedRefresh.current = false;
    };
  }, [isStaff, user?.id]);

  return null;
}
