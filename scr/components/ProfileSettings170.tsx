import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type ThemeMode = "system" | "dark" | "light";

function supportsVibration() {
  return typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function";
}

function findSettingsCard() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".profile-toggle-card"));
  return cards.find((card) => card.textContent?.includes("Sons do aplicativo") && card.textContent?.includes("Vibração")) ?? null;
}

function resolvedTheme(mode: ThemeMode) {
  if (mode !== "system") return mode;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(mode: ThemeMode) {
  const resolved = resolvedTheme(mode);
  document.documentElement.dataset.accquaThemeMode = mode;
  document.documentElement.dataset.accquaTheme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export default function ProfileSettings170() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [mode, setMode] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const vibrationSupported = useMemo(() => supportsVibration(), []);
  const isStudent = profile?.role === "student";

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    let alive = true;
    void supabase.from("accqua_profile_preferences").select("theme_mode").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!alive) return;
      const value = String(data?.theme_mode ?? "system") as ThemeMode;
      const next: ThemeMode = value === "dark" || value === "light" ? value : "system";
      setMode(next);
      applyTheme(next);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, [user?.id]);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const sync = () => applyTheme("system");
    media?.addEventListener("change", sync);
    return () => media?.removeEventListener("change", sync);
  }, [mode]);

  useEffect(() => {
    if (location.pathname !== "/perfil" || !isStudent) {
      setHost(null);
      return;
    }
    let frame = 0;
    let current: HTMLElement | null = null;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const card = findSettingsCard();
        if (!card) {
          current?.remove();
          current = null;
          setHost(null);
          return;
        }

        const rows = Array.from(card.querySelectorAll<HTMLLabelElement>(".profile-toggle-row"));
        const vibrationRow = rows.find((row) => row.textContent?.includes("Vibração"));
        if (vibrationRow && !vibrationSupported) {
          vibrationRow.classList.add("is-unsupported-170");
          const input = vibrationRow.querySelector<HTMLInputElement>('input[type="checkbox"]');
          if (input) input.disabled = true;
          const description = vibrationRow.querySelector<HTMLElement>("p");
          if (description) description.textContent = "Não disponível no iPhone/Safari.";
          if (!vibrationRow.querySelector(".accqua-capability-inline-170")) {
            const note = document.createElement("small");
            note.className = "accqua-capability-inline-170";
            note.textContent = "O iOS não oferece vibração para PWAs. O restante do app continua funcionando normalmente.";
            vibrationRow.querySelector("div")?.append(note);
          }
        }

        if (!current?.isConnected) {
          current = document.createElement("div");
          current.dataset.accquaThemeHost = "true";
          card.insertAdjacentElement("afterend", current);
        }
        setHost(current);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); current?.remove(); };
  }, [isStudent, location.pathname, vibrationSupported]);

  const saveTheme = async (next: ThemeMode) => {
    if (!user?.id || saving) return;
    const previous = mode;
    setMode(next);
    applyTheme(next);
    setSaving(true);
    try {
      const update = await supabase.from("accqua_profile_preferences").update({ theme_mode: next, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      if (update.error) throw update.error;
    } catch {
      setMode(previous);
      applyTheme(previous);
    } finally {
      setSaving(false);
    }
  };

  if (!host || !loaded) return null;

  return createPortal(
    <section className="accqua-theme-settings-170" aria-label="Tema do aplicativo">
      <div><strong>Tema</strong><p>Escolha como o ACCQUA aparece neste aparelho. A preferência fica salva na sua conta.</p></div>
      <div className="accqua-theme-options-170" role="radiogroup" aria-label="Tema">
        {(["system", "dark", "light"] as const).map((value) => (
          <button key={value} type="button" role="radio" aria-checked={mode === value} className={mode === value ? "is-active" : ""} disabled={saving} onClick={() => void saveTheme(value)}>
            {value === "system" ? "Sistema" : value === "dark" ? "Escuro" : "Claro"}
          </button>
        ))}
      </div>
    </section>,
    host,
  );
}
