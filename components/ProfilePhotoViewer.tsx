import { useEffect } from "react";
import "./profile-photo-viewer.css";

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

  if (!open || !imageUrl) return null;

  return (
    <div
      className="profile-photo-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${name}`}
      onClick={onClose}
    >
      <figure onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="profile-photo-viewer-close"
          aria-label="Fechar foto"
          onClick={onClose}
        >
          ×
        </button>
        <img src={imageUrl} alt={`Foto de ${name}`} />
        <figcaption>{name}</figcaption>
      </figure>
    </div>
  );
}
