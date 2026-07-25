import { supabase } from "./supabase";

export type FeedbackPreferences = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  workoutNotifications: boolean;
  classNotifications: boolean;
  activityReminders: boolean;
  newsNotifications: boolean;
};
const fallback: FeedbackPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
  workoutNotifications: true,
  classNotifications: true,
  activityReminders: true,
  newsNotifications: false,
};
const key = (userId: string) => `accqua:feedback:${userId}`;

export function cacheFeedbackPreferences(userId: string, preferences: Partial<FeedbackPreferences>) {
  try { localStorage.setItem(key(userId), JSON.stringify({ ...readFeedbackPreferences(userId), ...preferences })); } catch { /* noop */ }
}

export function readFeedbackPreferences(userId = ""): FeedbackPreferences {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback; }
}

export async function loadFeedbackPreferences(userId: string): Promise<FeedbackPreferences> {
  const response = await supabase.from("accqua_profile_preferences").select("sound_enabled,vibration_enabled,workout_notifications,class_notifications,activity_reminders,news_notifications").eq("user_id", userId).maybeSingle();
  const preferences = response.error ? readFeedbackPreferences(userId) : {
    soundEnabled: response.data?.sound_enabled !== false,
    vibrationEnabled: response.data?.vibration_enabled !== false,
    workoutNotifications: response.data?.workout_notifications !== false,
    classNotifications: response.data?.class_notifications !== false,
    activityReminders: response.data?.activity_reminders !== false,
    newsNotifications: response.data?.news_notifications === true,
  };
  cacheFeedbackPreferences(userId, preferences);
  return preferences;
}

export function performHaptic(userId: string, pattern: number | number[] = [38, 24, 38]) {
  if (!readFeedbackPreferences(userId).vibrationEnabled || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

export function playAccquaChime(userId: string, kind: "success" | "attention" | "newWorkout" = "success") {
  if (!readFeedbackPreferences(userId).soundEnabled) return;
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const notes = kind === "attention" ? [740, 988] : kind === "newWorkout" ? [523, 659, 784] : [659, 880];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * .11;
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.12, start + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + .18);
    });
    window.setTimeout(() => void context.close(), 700);
  } catch { /* autoplay/browser limitation */ }
}
