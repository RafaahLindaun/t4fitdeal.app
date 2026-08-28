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
          aria-label={preferred ? `Check-in com ${preferred.name}` : "Escolher parceiro para check-in"}
          title={preferred ? `Check-in com ${preferred.name}` : "Check-in"}
          onClick={() => preferred ? launch(preferred) : setOpen(true)}
        >
          <MenuCheckinIcon size={20} />
          <span>Check-in</span>
        </button>
        {preferred ? (
          <button
            type="button"
            className="accqua-checkin-change"
            aria-label="Trocar parceiro de check-in"
            title="Trocar parceiro"
            onClick={() => setOpen(true)}
          >
            <span aria-hidden="true">⌄</span>
          </button>
        ) : null}
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
