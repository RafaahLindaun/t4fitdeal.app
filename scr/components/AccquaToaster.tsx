import { useEffect } from "react";
import { Toaster } from "sonner";
import "./accqua-interactions.css";

export default function AccquaToaster() {
  useEffect(() => {
    let frame = 0;
    const syncOverflowCounter = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const toaster = document.querySelector<HTMLElement>("[data-sonner-toaster]");
        if (!toaster) return;
        const count = toaster.querySelectorAll("[data-sonner-toast]").length;
        if (count > 3) toaster.dataset.accquaOverflowLabel = `+${count - 3} notificações`;
        else delete toaster.dataset.accquaOverflowLabel;
      });
    };
    syncOverflowCounter();
    const observer = new MutationObserver(syncOverflowCounter);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return (
    <Toaster
      position="top-right"
      richColors={false}
      expand
      closeButton
      duration={4200}
      visibleToasts={3}
      gap={8}
      swipeDirections={["top", "right"]}
      toastOptions={{
        classNames: {
          toast: "accqua-sonner-toast",
          title: "accqua-sonner-title",
          description: "accqua-sonner-description",
          actionButton: "accqua-sonner-action",
          cancelButton: "accqua-sonner-cancel",
        },
      }}
    />
  );
}
