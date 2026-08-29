import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ProfileMenuItemTone = "default" | "success" | "warning" | "danger" | "muted";

export default function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onClick,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  tone?: ProfileMenuItemTone;
}) {
  return (
    <motion.button
      className="profile-menu-item"
      type="button"
      onClick={onClick}
      data-subtitle-tone={tone}
      whileHover={{ backgroundColor: "rgba(255,255,255,.035)" }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="profile-menu-icon">{icon}</span>
      <div><strong>{title}</strong><p>{subtitle}</p></div>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
    </motion.button>
  );
}
