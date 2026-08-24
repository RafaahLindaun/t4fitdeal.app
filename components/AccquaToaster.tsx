import { Toaster } from "sonner";
import "./accqua-interactions.css";

export default function AccquaToaster() {
  return (
    <Toaster
      position="bottom-center"
      richColors
      closeButton
      duration={2600}
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
