import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { searchWorkoutStudents } from "../lib/admin";
import { loadFeedbackPreferences, playAccquaChime } from "../lib/appFeedback";
import { classDateTime, loadMyClasses } from "../lib/classes";
import { supabase } from "../lib/supabase";

const REMINDER_HOUR = 16;
const STUDENT_POLL_MS = 120_000;
const STAFF_POLL_MS = 300_000;
const MIN_FOCUS_GAP_MS = 20_000;

type Toast = { title: string; message: string } | null;

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function showSystemNotification(title: string, message: string, url: string, tag: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  const options: NotificationOptions = {
    body: message,
    icon: "/accqua-logo-header.png",
    badge: "/accqua-logo-header.png",
    tag,
    data: { url },
  };
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return true;
    }
    const notification = new Notification(title, options);
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

async function loadActiveWorkoutSignature(userId: string) {
  const program = await supabase
    .from("workout_programs")
    .select("id,version,updated_at,name")
    .eq("student_id", userId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!program.error && program.data) {
    return {
      signature: `${program.data.id}:${program.data.version ?? 1}:${program.data.updated_at ?? ""}`,
      name: String(program.data.name ?? "Seu novo treino"),
    };
  }

  const plan = await supabase
    .from("workout_plans")
    .select("id,updated_at,program_name,name")
    .or(`student_id.eq.${userId},user_id.eq.${userId}`)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (plan.error || !plan.data) return null;
  return {
    signature: `${plan.data.id}:${plan.data.updated_at ?? ""}`,
    name: String(plan.data.program_name ?? plan.data.name ?? "Seu novo treino"),
  };
}

async function hasActivityToday(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const response = await supabase
    .from("accqua_activity_history")
    .select("id")
    .eq("student_id", userId)
    .gte("performed_at", start.toISOString())
    .limit(1);
  return !response.error && Boolean(response.data?.length);
}

const reminderMessages = [
  "Seu treino está sentindo sua falta 💛 Faça o check-in pelo Wellhub ou TotalPass e venha para a ACCQUA.",
  "Hoje ainda dá tempo de somar presença e evolução. Bora treinar na ACCQUA?",
  "A constância de hoje vira resultado amanhã. Seu treino está esperando por você.",
  "Passa na ACCQUA, faça seu check-in e não deixe sua sequência parar hoje.",
];

export default function EngagementNotifications() {
  const { user, profile } = useAuth();
  const [toast, setToast] = useState<Toast>(null);
  const busy = useRef(false);
  const lastCheckAt = useRef(0);
  const isStaff = Boolean(profile && ["professor", "reception", "admin"].includes(profile.role));

  useEffect(() => {
    if (!user?.id || !profile) return;
    let cancelled = false;
    let toastTimer = 0;

    const announce = async (title: string, message: string, url: string, tag: string, chime: "attention" | "newWorkout") => {
      if (cancelled) return;
      setToast({ title, message });
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setToast(null), 5200);
      playAccquaChime(user.id, chime);
      await showSystemNotification(title, message, url, tag);
    };

    const checkStudent = async () => {
      const preferences = await loadFeedbackPreferences(user.id);
      const workout = await loadActiveWorkoutSignature(user.id);
      if (workout && preferences.workoutNotifications) {
        const storageKey = `accqua:last-workout:${user.id}`;
        const previous = localStorage.getItem(storageKey);
        if (previous !== workout.signature) {
          await announce(
            "Novo treino liberado",
            `${workout.name} já está disponível. Abra o app para começar.`,
            "/treino",
            `accqua-new-workout-${user.id}`,
            "newWorkout",
          );
        }
        localStorage.setItem(storageKey, workout.signature);
      }

      const now = new Date();

      if (preferences.classNotifications) {
        const reservations = await loadMyClasses();
        const leadMs = Math.max(30, preferences.classReminderMinutes || 120) * 60_000;
        const nextClass = reservations
          .filter((reservation) => reservation.status === "reservado")
          .map((reservation) => ({
            reservation,
            startsAt: classDateTime(reservation.date, reservation.startTime),
          }))
          .filter(({ startsAt }) => startsAt.getTime() > now.getTime() && startsAt.getTime() - now.getTime() <= leadMs)
          .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];

        if (nextClass) {
          const reminderKey = `accqua:class-reminder:${user.id}:${nextClass.reservation.reservationId}:${nextClass.reservation.date}`;
          if (!localStorage.getItem(reminderKey)) {
            localStorage.setItem(reminderKey, "1");
            const time = nextClass.reservation.startTime.slice(0, 5);
            await announce(
              "Sua aula começa em breve",
              `${nextClass.reservation.name} às ${time}${nextClass.reservation.location ? ` · ${nextClass.reservation.location}` : ""}.`,
              "/aulas",
              `accqua-class-${nextClass.reservation.reservationId}`,
              "attention",
            );
          }
        }
      }

      const dayKey = localDateKey(now);
      const reminderKey = `accqua:daily-reminder:${user.id}:${dayKey}`;
      if (
        preferences.activityReminders &&
        now.getHours() >= REMINDER_HOUR &&
        !localStorage.getItem(reminderKey) &&
        !(await hasActivityToday(user.id))
      ) {
        localStorage.setItem(reminderKey, "1");
        const message = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
        await announce("A ACCQUA te espera", message, "/menu-teste", `accqua-daily-${dayKey}`, "attention");
      }
    };

    const checkStaff = async () => {
      const preferences = await loadFeedbackPreferences(user.id);
      if (!preferences.workoutNotifications) return;
      const students = await searchWorkoutStudents("");
      const pending = students.filter((student) => ["pending", "inactive"].includes(student.status));
      const signature = pending.map((student) => student.id).sort().join(",");
      const key = `accqua:pending-students:${user.id}`;
      const previous = localStorage.getItem(key);
      if (signature !== previous && pending.length > 0) {
        const previousIds = new Set((previous ?? "").split(",").filter(Boolean));
        const newPending = previous === null
          ? pending
          : pending.filter((student) => !previousIds.has(student.id));
        if (newPending.length > 0) {
          const first = newPending[0];
          await announce(
            "Aluno aguardando autorização",
            newPending.length === 1
              ? `${first.fullName} precisa ter o acesso analisado.`
              : `${newPending.length} novos alunos precisam de autorização.`,
            "/area-accqua",
            `accqua-pending-${newPending.map((student) => student.id).join("-")}`,
            "attention",
          );
        }
      }
      localStorage.setItem(key, signature);
    };

    const check = async (force = false) => {
      if (busy.current || cancelled || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (!force && now - lastCheckAt.current < MIN_FOCUS_GAP_MS) return;
      busy.current = true;
      lastCheckAt.current = now;
      try {
        if (isStaff) await checkStaff();
        else if (profile.status === "active") await checkStudent();
      } catch {
        // Notificações são best-effort e nunca podem pressionar o app em caso de backend lento.
      } finally {
        busy.current = false;
      }
    };

    void check(true);
    const interval = window.setInterval(
      () => void check(),
      isStaff ? STAFF_POLL_MS : STUDENT_POLL_MS,
    );
    const handleFocus = () => void check();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(toastTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isStaff, profile?.status, user?.id]);

  if (!toast) return null;
  return (
    <div className="accqua-engagement-toast" role="status">
      <span aria-hidden="true">✦</span>
      <div><strong>{toast.title}</strong><p>{toast.message}</p></div>
    </div>
  );
}
