import clsx from "clsx";

type ModalCloseButtonProps = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
};

export default function ModalCloseButton({
  onClick,
  ariaLabel = "Fechar",
  className,
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      className={clsx("accqua-modal-close-button", className)}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
      </svg>
    </button>
  );
}
