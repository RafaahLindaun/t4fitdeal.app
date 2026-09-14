import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { loadMyProfileHighlights } from "../lib/profileHighlights";
import "./profile-highlights.css";

function achievementFor(days: number) {
  if (days >= 365) return { label: "LENDÁRIO", icon: "★" };
  if (days >= 180) return { label: "IMPARÁVEL", icon: "⚡" };
  if (days >= 100) return { label: "CENTENÁRIO", icon: "100" };
  if (days >= 50) return { label: "INSANO", icon: "🔥" };
  if (days >= 30) return { label: "NO RITMO", icon: "✓" };
  return { label: "COMEÇOU", icon: "•" };
}

export default function ProfileHighlights() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const reduceMotion = Boolean(useReducedMotion());
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const student = String(profile?.role ?? "student").toLowerCase() === "student";
  const enabled = location.pathname === "/perfil" && Boolean(user?.id) && student;

  useEffect(() => {
    if (!enabled) { setTarget(null); return; }
    let observer: MutationObserver | null = null;
    const find = () => {
      const next = document.querySelector<HTMLElement>(".accqua-profile-content.is-main-view .profile-stats-grid");
      if (next) {
        setTarget(next);
        observer?.disconnect();
        observer = null;
        return true;
      }
      return false;
    };
    if (!find()) {
      observer = new MutationObserver(find);
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return () => observer?.disconnect();
  }, [enabled, location.key]);

  const query = useQuery({
    queryKey: ["profile-highlights", "1.6.5.7", user?.id],
    queryFn: loadMyProfileHighlights,
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const achievement = useMemo(() => achievementFor(query.data?.daysInApp ?? 0), [query.data?.daysInApp]);
  if (!enabled || !target || !query.data) return null;

  return createPortal(
    <motion.article
      className="profile-highlight-card-v1657"
      initial={reduceMotion ? false : { opacity: 0, y: 10, scale: .985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: .28, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Marcos do perfil"
    >
      <div className="profile-highlight-days-v1657">
        <div><strong>{query.data.daysInApp}</strong><span>dias no app</span></div>
        <b><i>{achievement.icon}</i>{achievement.label}</b>
      </div>
      <div className="profile-highlight-meta-v1657">
        <span><small>Divisão atual</small><strong title={query.data.currentSplit}>{query.data.currentSplit}</strong></span>
        <span><small>Objetivo</small><strong title={query.data.objective}>{query.data.objective}</strong></span>
      </div>
    </motion.article>,
    target,
  );
}
