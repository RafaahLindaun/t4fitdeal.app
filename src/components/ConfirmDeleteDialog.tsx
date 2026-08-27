import * as AlertDialog from "@radix-ui/react-alert-dialog";
import "./confirm-delete-dialog.css";

export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Excluir",
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="accqua-delete-overlay" />
        <AlertDialog.Content className="accqua-delete-dialog">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <div className="accqua-delete-dialog-actions">
            <AlertDialog.Cancel disabled={busy}>Cancelar</AlertDialog.Cancel>
            <AlertDialog.Action disabled={busy} onClick={(event) => { event.preventDefault(); void Promise.resolve(onConfirm()).then(() => onOpenChange(false)).catch(() => undefined); }}>{busy ? "Excluindo..." : confirmLabel}</AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
