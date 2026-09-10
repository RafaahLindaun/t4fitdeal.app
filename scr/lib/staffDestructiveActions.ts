let installed = false;

export function installStaffDestructiveActionGuard() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>(
        ".store-admin-list > article .store-admin-row-actions .danger",
      );
      if (!button || button.disabled) return;

      const confirmed = window.confirm(
        "Excluir esta reserva? Esta ação remove a reserva da lista e não pode ser desfeita.",
      );
      if (confirmed) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    },
    true,
  );
}
