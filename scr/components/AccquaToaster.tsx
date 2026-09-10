import { Toaster } from "sonner";
import "./accqua-interactions.css";

export default function AccquaToaster() {
  return (
    <Toaster
      position="top-center"
      richColors={false}
      expand={false}
      closeButton={false}
      duration={4200}
      visibleToasts={3}
      gap={8}
      swipeDirections={["top"]}
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
