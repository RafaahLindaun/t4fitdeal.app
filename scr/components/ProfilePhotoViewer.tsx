import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  accquaOverlayTransition,
  accquaOverlayVariants,
  accquaWindowTransition,
  accquaWindowVariants,
} from "../lib/windowMotion";
import "./profile-photo-viewer.css";
import ModalCloseButton from "./ModalCloseButton";

type ProfilePhotoViewerProps = {
  open: boolean;
  imageUrl: string;
  name: string;
  onClose: () => void;
};

export default function ProfilePhotoViewer({
  open,
  imageUrl,
  name,
  onClose,
}: ProfilePhotoViewerProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence initial={false}>
      {open && imageUrl ? (
        <motion.div
          key="profile-photo-viewer"
          className="profile-photo-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${name}`}
          onClick={onClose}
          variants={accquaOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={accquaOverlayTransition}
          data-accqua-window-overlay
          data-accqua-motion-managed
        >
          <motion.figure
            onClick={(event) => event.stopPropagation()}
            variants={accquaWindowVariants.viewer}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={accquaWindowTransition}
            data-accqua-window-surface="viewer"
          >
            <ModalCloseButton className="profile-photo-viewer-close" ariaLabel="Fechar foto" onClick={onClose} />
            <img src={imageUrl} alt={`Foto de ${name}`} />
            <figcaption>{name}</figcaption>
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
