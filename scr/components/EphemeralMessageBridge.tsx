import { useEffect } from "react";
import { toast } from "sonner";

const SOURCE_SELECTOR = [
  ".workout-toast",
  ".cardio-toast",
  ".accqua-engagement-toast",
  ".workout-rest-confirmation",
  ".accqua-profile-toast",
  ".accqua-menu-toast",
].join(",");

const TOAST_DURATION = 4200;

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function messageFromSource(element: HTMLElement) {
  if (element.matches(".accqua-engagement-toast")) {
    const title = cleanText(element.querySelector("strong")?.textContent) || "ACCQUA Sports";
    const description = cleanText(element.querySelector("p")?.textContent);
    return { title, description };
  }

  if (element.matches(".workout-rest-confirmation")) {
    const message = cleanText(element.querySelector("strong")?.textContent || element.textContent);
    return {
      title: "Descanso atualizado",
      description: message || "Seu tempo de descanso foi atualizado.",
    };
  }

  if (element.matches(".cardio-toast")) {
    const message = cleanText(element.textContent);
    return {
      title: "Cardio",
      description: message || "Atualização do seu cardio.",
    };
  }

  if (element.matches(".accqua-profile-toast")) {
    const message = cleanText(element.textContent);
    return {
      title: "Perfil",
      description: message || "Seu perfil foi atualizado.",
    };
  }

  if (element.matches(".accqua-menu-toast")) {
    const message = cleanText(element.textContent);
    return {
      title: "ACCQUA",
      description: message || "Ação concluída.",
    };
  }

  const message = cleanText(element.textContent);
  return {
    title: "Treino",
    description: message || "Atualização do seu treino.",
  };
}

export default function EphemeralMessageBridge() {
  useEffect(() => {
    const signatures = new WeakMap<HTMLElement, string>();
    const hiddenSources = new Set<HTMLElement>();

    const mirror = (element: HTMLElement) => {
      const { title, description } = messageFromSource(element);
      const signature = `${title}\u0000${description}`;
      if (!title && !description) return;

      element.classList.add("accqua-ephemeral-source-hidden");
      element.setAttribute("aria-hidden", "true");
      hiddenSources.add(element);

      if (signatures.get(element) === signature) return;
      signatures.set(element, signature);

      toast(title, {
        description: description || undefined,
        duration: TOAST_DURATION,
      });
    };

    const scan = (node: Node) => {
      if (node instanceof HTMLElement) {
        if (node.matches(SOURCE_SELECTOR)) mirror(node);
        node.querySelectorAll<HTMLElement>(SOURCE_SELECTOR).forEach(mirror);
        return;
      }

      if (node.parentElement) {
        const source = node.parentElement.closest<HTMLElement>(SOURCE_SELECTOR);
        if (source) mirror(source);
      }
    };

    scan(document.body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          scan(record.target);
          continue;
        }

        scan(record.target);
        record.addedNodes.forEach(scan);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      hiddenSources.forEach((element) => {
        if (!element.isConnected) return;
        element.classList.remove("accqua-ephemeral-source-hidden");
        element.removeAttribute("aria-hidden");
      });
      hiddenSources.clear();
    };
  }, []);

  return null;
}
