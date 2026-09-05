import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import "./centered-modal.css";

type CenteredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
};

export default function CenteredModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "",
  bodyClassName = "",
  closeLabel = "Fechar",
}: CenteredModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="centered-modal-overlay-v164" data-accqua-window-overlay />
        <Dialog.Content
          className={`centered-modal-content-v164 ${className}`.trim()}
          data-accqua-window-surface="center"
        >
          <header className="centered-modal-header-v164">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description ? <Dialog.Description>{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close className="centered-modal-close-v164" aria-label={closeLabel}>×</Dialog.Close>
          </header>
          <div className={`centered-modal-body-v164 ${bodyClassName}`.trim()}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
