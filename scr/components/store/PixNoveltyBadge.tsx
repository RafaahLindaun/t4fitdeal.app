import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const DISMISS_KEY = "accqua:pix-payment-novelty-dismissed:v1";
const DEFAULT_NOVELTY_UNTIL = Date.parse("2026-10-01T03:00:00.000Z");

export default function PixNoveltyBadge() {
  const reduceMotion = Boolean(useReducedMotion());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    setVisible(!dismissed && Date.now() < DEFAULT_NOVELTY_UNTIL);
  }, []);

  if (!visible) return null;

  return (
    <motion.button
      type="button"
      className="store-pix-novelty-badge"
      aria-label="Dispensar aviso de novidade do pagamento Pix"
      title="Toque para dispensar"
      animate={reduceMotion ? undefined : { opacity: [1, 0.32, 1] }}
      transition={reduceMotion ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
      }}
    >
      NOVIDADE <span aria-hidden="true">×</span>
    </motion.button>
  );
}
