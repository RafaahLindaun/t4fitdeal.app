import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ProfileTabsBridge() {
  const location = useLocation();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (location.pathname !== "/perfil") {
      setHost(null);
      return;
    }

    let current: HTMLElement | null = null;
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const main = document.querySelector<HTMLElement>(".accqua-profile-content.is-main-view");
        if (!main) {
          current?.remove();
          current = null;
          setHost(null);
          return;
        }
        if (current?.isConnected && current.parentElement === main) {
          setHost(current);
          return;
        }
        current?.remove();
        current = document.createElement("div");
        current.className = "profile-main-tabs-host";
        main.prepend(current);
        setHost(current);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      current?.remove();
    };
  }, [location.pathname]);

  if (!host) return null;

  const openPartners = () => {
    const realButton = document.querySelector<HTMLButtonElement>(".profile-stat-partners");
    realButton?.click();
  };

  return createPortal(
    <nav className="profile-partners-tabs profile-main-tabs" aria-label="Perfil e parceiros">
      <button type="button" className="is-active" aria-current="page">Perfil</button>
      <button type="button" onClick={openPartners}>Parceiros</button>
    </nav>,
    host,
  );
}
