import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProfileTabs171() {
  const location = useLocation();
  const { profile } = useAuth();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [partnersView, setPartnersView] = useState(false);
  const active = location.pathname === "/perfil" && profile?.role === "student";

  useEffect(() => {
    if (!active) { setHost(null); return; }
    let current: HTMLElement | null = null;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const content = document.querySelector<HTMLElement>(".accqua-profile-content");
        const title = document.querySelector<HTMLElement>(".accqua-profile-title-row h1")?.textContent?.trim() ?? "";
        const isPartners = title.toLowerCase().includes("parceiros");
        setPartnersView(isPartners);
        if (!content) { current?.remove(); current = null; setHost(null); return; }
        if (!current?.isConnected) {
          current = document.createElement("div");
          current.className = "profile-tabs-host-171";
          content.prepend(current);
        } else if (current.parentElement !== content) {
          current.remove();
          content.prepend(current);
        }
        setHost(current);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); current?.remove(); };
  }, [active]);

  const openProfile = () => {
    if (!partnersView) return;
    document.querySelector<HTMLButtonElement>(".accqua-profile-header button[aria-label='Voltar']")?.click();
  };

  const openPartners = () => {
    if (partnersView) return;
    document.querySelector<HTMLButtonElement>(".profile-stat-partners")?.click();
  };

  if (!host) return null;
  return createPortal(
    <nav className="profile-tabs-171" aria-label="Perfil e parceiros">
      <button type="button" className={!partnersView ? "is-active" : ""} aria-current={!partnersView ? "page" : undefined} onClick={openProfile}>Perfil</button>
      <button type="button" className={partnersView ? "is-active" : ""} aria-current={partnersView ? "page" : undefined} onClick={openPartners}>Parceiros</button>
    </nav>,
    host,
  );
}
