import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ResponsiveDialog from "../ResponsiveDialog";
import { MenuCheckinIcon } from "../MenuIcons";
import { loadCheckinProviders, openCheckinProvider, type CheckinProvider } from "../../lib/checkin";

const STORAGE_KEY = "accqua:preferred-checkin-provider";

function readPreferredId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function persistPreferredId(id: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Preferência local é conveniência, não bloqueia o check-in.
  }
}

function QrCheckinIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 14h2v4h-2zM14 18h4v2h-4zM20 20h.01" />
    </svg>
  );
}

export default function CheckInButton() {
  const [open, setOpen] = useState(false);
  const [preferredId, setPreferredId] = useState(readPreferredId);
  const providersQuery = useQuery({
    queryKey: ["checkin-providers"],
    queryFn: loadCheckinProviders,
    staleTime: 5 * 60_000,
  });

  const providers = providersQuery.data ?? [];
  const preferred = useMemo(
    () => providers.find((provider) => provider.id === preferredId) ?? null,
    [preferredId, providers],
  );

  const launch = (provider: CheckinProvider) => {
    setPreferredId(provider.id);
    persistPreferredId(provider.id);
    setOpen(false);
    try {
      openCheckinProvider(provider);
    } catch {
      toast.error("O acesso de check-in deste parceiro ainda não foi configurado pela equipe.");
    }
  };

  return (
    <>
      <div className={`accqua-checkin-control ${preferred ? "has-preference" : ""}`}>
        <button
          type="button"
          className="accqua-checkin-button"
          aria-label={preferred ? `Abrir opções de check-in. Preferido: ${preferred.name}` : "Abrir opções de check-in"}
          title={preferred ? `Check-in · ${preferred.name}` : "Check-in"}
          onClick={() => setOpen(true)}
        >
          <QrCheckinIcon />
          <span>Check-in</span>
        </button>
      </div>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Fazer check-in"
        description="Escolha o benefício usado hoje. Sua escolha fica salva para o próximo acesso."
        className="checkin-provider-dialog"
        bodyClassName="checkin-provider-dialog-body"
        closeButton={<button type="button" aria-label="Fechar">×</button>}
      >
        <div className="checkin-provider-list">
          {providersQuery.isLoading ? (
            <div className="checkin-provider-state">Carregando parceiros...</div>
          ) : providers.length ? providers.map((provider) => (
            <button key={provider.id} type="button" onClick={() => launch(provider)}>
              <span className="checkin-provider-logo">
                {provider.logoUrl ? <img src={provider.logoUrl} alt="" /> : <MenuCheckinIcon size={22} />}
              </span>
              <span>
                <strong>{provider.name}</strong>
                <small>{provider.deepLinkScheme ? "Abrir aplicativo de check-in" : "Abrir canal oficial do parceiro"}</small>
              </span>
              {preferredId === provider.id ? <b>Preferido</b> : <i aria-hidden="true">›</i>}
            </button>
          )) : (
            <div className="checkin-provider-state">Nenhum parceiro de check-in está habilitado no momento.</div>
          )}
        </div>
        <p className="checkin-provider-note">O aplicativo ACCQUA não realiza nem valida o check-in. Ele apenas abre o canal oficial configurado para o parceiro.</p>
      </ResponsiveDialog>
    </>
  );
}
