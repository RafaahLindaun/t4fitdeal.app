import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import ResponsiveDialog from "../ResponsiveDialog";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export default function WorkoutQrDialog({
  open,
  onOpenChange,
  sessionId,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  loading?: boolean;
}) {
  const url = useMemo(() => {
    if (!sessionId) return "";
    return `https://fitdeal.vercel.app/treino?session=${encodeURIComponent(sessionId)}`;
  }, [sessionId]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Continue no celular"
      description="Aponte a câmera do celular para abrir seu treino direto no app."
      ariaDescriptionId="workout-qr-description"
      className="home-workout-qr-dialog"
      bodyClassName="home-workout-qr-body"
      closeButton={<button type="button" aria-label="Fechar"><CloseIcon /></button>}
    >
      <div className="home-workout-qr-card" aria-live="polite">
        {loading ? (
          <div className="home-workout-qr-loading">
            <span aria-hidden="true" />
            <strong>Preparando seu treino...</strong>
          </div>
        ) : url ? (
          <>
            <div className="home-workout-qr-code">
              <QRCodeSVG
                value={url}
                size={210}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#061a35"
                title="QR code para continuar o treino no celular"
              />
            </div>
            <strong>Escaneie para continuar</strong>
            <p>O QR abre a mesma sessão de treino no celular.</p>
          </>
        ) : (
          <>
            <strong>Treino ainda não disponível</strong>
            <p>Assim que houver uma ficha ativa, o QR aparecerá aqui.</p>
          </>
        )}
      </div>
    </ResponsiveDialog>
  );
}
