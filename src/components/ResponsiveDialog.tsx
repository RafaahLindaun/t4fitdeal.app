import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import clsx from "clsx";
import { useMediaQuery } from "../hooks/useMediaQuery";
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
};

export default function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  bodyClassName,
  closeButton,
  ariaDescriptionId,
}: ResponsiveDialogProps) {
  const desktop = useMediaQuery("(min-width: 768px)");

  if (desktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="responsive-dialog-overlay" />
          <Dialog.Content
            className={clsx("responsive-dialog-content", className)}
            aria-describedby={description ? ariaDescriptionId : undefined}
          >
            <header className="responsive-dialog-header">
              <div>
                <Dialog.Title>{title}</Dialog.Title>
                {description ? <Dialog.Description id={ariaDescriptionId}>{description}</Dialog.Description> : null}
              </div>
              {closeButton ? <Dialog.Close asChild>{closeButton}</Dialog.Close> : null}
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
        <Drawer.Overlay className="responsive-dialog-overlay" />
        <Drawer.Content
          className={clsx("responsive-dialog-drawer", className)}
          aria-describedby={description ? ariaDescriptionId : undefined}
        >
          <div className="responsive-dialog-handle" aria-hidden="true" />
          <header className="responsive-dialog-header">
            <div>
              <Drawer.Title>{title}</Drawer.Title>
              {description ? <Drawer.Description id={ariaDescriptionId}>{description}</Drawer.Description> : null}
            </div>
            {closeButton ? <Drawer.Close asChild>{closeButton}</Drawer.Close> : null}
          </header>
          <div className={clsx("responsive-dialog-body", bodyClassName)}>{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
