import type { WorkoutRequiredAlert } from "./admin";

export const WORKOUT_ALERTS_EVENT = "accqua:workout-alerts";
export const WORKOUT_ALERTS_REFRESH_EVENT = "accqua:workout-alerts-refresh";

export async function requestStaffNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function showWorkoutRequiredNotification(
  alert: WorkoutRequiredAlert,
): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  const url = `/area-accqua?student=${encodeURIComponent(alert.studentId)}`;
  const options: NotificationOptions = {
    body: alert.message,
    icon: "/accqua-logo-oficial.png",
    badge: "/accqua-logo-oficial.png",
    tag: `accqua-workout-${alert.studentId}`,
    renotify: true,
    data: { url },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(alert.title, options);
      return true;
    }

    const notification = new Notification(alert.title, options);
    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
