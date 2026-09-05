import { useEffect, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import clsx from "clsx";
import { useMediaQuery } from "../hooks/useMediaQuery";
import ModalCloseButton from "./ModalCloseButton";
import "./responsive-dialog.css";

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  closeButton?: ReactNode;
  ariaDescriptionId?: string;
  presentation?: "responsive" | "center";
};

let openDialogCount = 0;

function syncModalAccessibility(open: boolean) {
  if (typeof document === "undefined") return () => undefined;
  const nav = document.querySelector<HTMLElement>(".accqua-main-layout-nav");
  if (open) {
    openDialogCount += 1;
    document.body.dataset.accquaModalOpen = "true";
    nav?.setAttribute("aria-hidden", "true");
  }
  return () => {
    if (!open) return;
    openDialogCount = Math.max(0, openDialogCount - 1);
    if (openDialogCount === 0) {
      delete document.body.dataset.accquaModalOpen;
      nav?.removeAttribute("aria-hidden");
    }
  };
}

export default function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  bodyClassName,
  ariaDescriptionId,
  presentation = "responsive",
}: ResponsiveDialogProps) {
  const desktop = useMediaQuery("(min-width: 768px)");
  // Recipe AI predates the presentation prop; keep it centered without forcing
  // a risky rewrite of the large StoreAdmin page. New callers should use the prop.
  const legacyCentered = className?.split(/\s+/).includes("recipe-ai-dialog") ?? false;
  const centered = desktop || presentation === "center" || legacyCentered;

  useEffect(() => syncModalAccessibility(open), [open]);

  if (centered) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="responsive-dialog-overlay" data-accqua-window-overlay />
          <Dialog.Content
            className={clsx("responsive-dialog-content", className)}
            aria-describedby={description ? ariaDescriptionId : undefined}
            data-accqua-window-surface="center"
          >
            <header className="responsive-dialog-header">
              <div>
                <Dialog.Title>{title}</Dialog.Title>
                {description ? <Dialog.Description id={ariaDescriptionId}>{description}</Dialog.Description> : null}
              </div>
              <Dialog.Close asChild><ModalCloseButton /></Dialog.Close>
            </header>
            <div className={clsx("responsive-dialog-body", bodyClassName)}>{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="responsive-dialog-overlay" data-accqua-window-overlay />
        <Drawer.Content
          className={clsx("responsive-dialog-drawer", className)}
          aria-describedby={description ? ariaDescriptionId : undefined}
          data-accqua-window-surface="sheet"
        >
          <div className="responsive-dialog-handle" aria-hidden="true" />
          <header className="responsive-dialog-header">
            <div>
              <Drawer.Title>{title}</Drawer.Title>
              {description ? <Drawer.Description id={ariaDescriptionId}>{description}</Drawer.Description> : null}
            </div>
            <Drawer.Close asChild><ModalCloseButton /></Drawer.Close>
          </header>
          <div className={clsx("responsive-dialog-body", bodyClassName)}>{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
