import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getMyNotificationsEnabled,
  isIosBrowser,
  isStandaloneApp,
  registerAccquaPush,
  setMyNotificationsEnabled,
} from "../lib/notifications";

type PushState = "idle" | "ready" | "ios_install" | "denied" | "unsupported" | "error";

function findNotificationsHost() {
  const banners = Array.from(document.querySelectorAll<HTMLElement>(".profile-info-banner"));
  const banner = banners.find((element) => element.textContent?.includes("Alertas do seu treino"));
  if (!banner) return null;
  const section = banner.closest<HTMLElement>(".profile-subview");
  if (!section) return null;

  let host = section.querySelector<HTMLElement>("[data-accqua-notification-master-host]");
  if (!host) {
    host = document.createElement("div");
    host.dataset.accquaNotificationMasterHost = "true";
    banner.insertAdjacentElement("afterend", host);
  }
  return host;
}

export default function NotificationPreferenceBridge() {
  const { user, profile } = useAuth();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushState, setPushState] = useState<PushState>("idle");

  const isStudent = useMemo(() => {
    const role = String(profile?.role ?? "student").toLowerCase();
    return !["professor", "admin", "reception", "recepcao"].includes(role);
  }, [profile?.role]);

  useEffect(() => {
    if (!user?.id || !isStudent) return;
    let frame = 0;
    const syncHost = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setHost(findNotificationsHost()));
    };
    syncHost();
    const observer = new MutationObserver(syncHost);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [user?.id, isStudent]);

  useEffect(() => {
    if (!user?.id || !isStudent || !host) return;
    let alive = true;
    void getMyNotificationsEnabled().then((value) => {
      if (!alive) return;
      setEnabled(value);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, [user?.id, isStudent, host]);

  const ensurePush = async () => {
    if (!user?.id) return;
    try {
      const result = await registerAccquaPush(user.id);
      if (result.ok) {
        setPushState("ready");
        return;
      }
      if (result.reason === "ios_install_required") setPushState("ios_install");
      else if (result.reason === "permission_denied") setPushState("denied");
      else if (result.reason === "unsupported") setPushState("unsupported");
      else setPushState("error");
    } catch {
      setPushState("error");
    }
  };

  const toggle = async (next: boolean) => {
    if (saving) return;
    setSaving(true);
    setEnabled(next);
    try {
      await setMyNotificationsEnabled(next);
      if (next) await ensurePush();
      else setPushState("idle");
    } catch {
      setEnabled(!next);
      setPushState("error");
    } finally {
      setSaving(false);
    }
  };

  if (!host || !user?.id || !isStudent) return null;

  const iosInstallHint = isIosBrowser() && !isStandaloneApp();
  const note = pushState === "ios_install" || iosInstallHint
    ? "No iPhone, para receber push, adicione o ACCQUA à Tela de Início e abra por lá."
    : pushState === "denied"
      ? "A permissão do navegador está bloqueada. Você continua vendo os avisos no sino do app."
      : pushState === "unsupported"
        ? "Este navegador não oferece Web Push. Os avisos continuam disponíveis no sino do app."
        : pushState === "error"
          ? "Não foi possível configurar o push agora. A preferência do sino continua salva."
          : pushState === "ready"
            ? "Push do celular configurado neste dispositivo."
            : "Desative para não receber novos avisos gerais nem push da academia.";

  return createPortal(
    <section className="accqua-notification-master-card" aria-label="Preferência geral de notificações">
      <label className="accqua-notification-master-row">
        <span>
          <strong>Notificações ativas</strong>
          <small>{loaded ? note : "Carregando preferência..."}</small>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          disabled={!loaded || saving}
          onChange={(event) => void toggle(event.target.checked)}
        />
        <i aria-hidden="true"><b /></i>
      </label>
      {enabled && loaded && pushState !== "ready" && !(iosInstallHint || pushState === "ios_install") ? (
        <button type="button" onClick={() => void ensurePush()} disabled={saving}>
          Ativar push neste celular
        </button>
      ) : null}
    </section>,
    host,
  );
}
