import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate } from "react-router-dom";

type MobileOnlyRouteProps = {
  children: ReactNode;
};

const DESKTOP_MEDIA = "(min-width: 900px)";

function desktopMatches() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(DESKTOP_MEDIA).matches
  );
}

export default function MobileOnlyRoute({
  children,
}: MobileOnlyRouteProps) {
  const [desktop, setDesktop] = useState(desktopMatches);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const sync = () => setDesktop(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  if (desktop) {
    return <Navigate to="/menu-teste" replace />;
  }

  return <>{children}</>;
}
