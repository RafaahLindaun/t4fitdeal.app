import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import ResponsiveDialog from "../ResponsiveDialog";
import CompletionCheckmark from "../CompletionCheckmark";
import type { StoreProduct } from "../../lib/store";
import {
  loadPixPayment,
  subscribeToPixPayment,
  type PixPayment,
} from "../../lib/payments";
import "./pix-payment.css";

const TOTAL_SECONDS = 300;

function formatMMSS(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function useCountdown(expiresAt: string) {
  const expiresAtMs = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [expiresAtMs]);

  if (!Number.isFinite(expiresAtMs)) return 0;
  return Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
}

function CountdownRing({ seconds }: { seconds: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, seconds / TOTAL_SECONDS));
  const offset = circumference * (1 - ratio);
  const critical = seconds <= 30;

  return (
    <div className={`store-pix-countdown-ring ${critical ? "is-critical" : ""}`} aria-label={`${seconds} segundos restantes`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="store-pix-countdown-track" cx="50" cy="50" r={radius} />
        <circle
          className="store-pix-countdown-progress"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{formatMMSS(seconds)}</strong>
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

type Props = {
  payment: PixPayment | null;
  product: StoreProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateNew: () => void;
  regenerating?: boolean;
  onPaid?: (payment: PixPayment) => void;
  onViewReservations?: () => void;
};

export default function PixPaymentDialog({
  payment,
  product,
  open,
  onOpenChange,
  onGenerateNew,
  regenerating = false,
  onPaid,
  onViewReservations,
}: Props) {
  const reduceMotion = Boolean(useReducedMotion());
  const [current, setCurrent] = useState<PixPayment | null>(payment);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const celebratedCorrelation = useRef("");
  const copiedTimer = useRef<number | null>(null);

  useEffect(() => {
    setCurrent(payment);
    setCopied(false);
    setCopyError(false);
  }, [payment?.correlationId]);

  useEffect(() => () => {
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
  }, []);

  useEffect(() => {
    if (!open || !payment?.correlationId) return;

    let active = true;
    void loadPixPayment(payment.correlationId)
      .then((fresh) => {
        if (active && fresh) setCurrent(fresh);
      })
      .catch(() => undefined);

    const unsubscribe = subscribeToPixPayment(payment.correlationId, (next) => {
      if (active) setCurrent(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [open, payment?.correlationId]);

  useEffect(() => {
    if (!current || current.status !== "pago") return;
    if (celebratedCorrelation.current === current.correlationId) return;
    celebratedCorrelation.current = current.correlationId;
    onPaid?.(current);

    if (!reduceMotion) {
      confetti({
        particleCount: 90,
        spread: 74,
        startVelocity: 34,
        origin: { y: 0.72 },
        disableForReducedMotion: true,
      });
    }
  }, [current, onPaid, reduceMotion]);

  const secondsRemaining = useCountdown(current?.expiresAt ?? "");
  const expired = Boolean(current && current.status !== "pago" && (current.status === "expirado" || secondsRemaining <= 0));
  const canceled = current?.status === "cancelado";

  if (!payment || !product || !current) return null;

  const handleCopy = async () => {
    if (!current.brCode) return;
    try {
      await copyText(current.brCode);
      setCopyError(false);
      setCopied(true);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={current.status === "pago" ? "Pagamento confirmado" : "Pagamento via Pix"}
      description={current.status === "pago" ? "Seu produto já está separado para retirada." : `${product.name} · Pix com confirmação automática`}
      className="store-pix-dialog"
      bodyClassName="store-pix-dialog-body"
      ariaDescriptionId="store-pix-payment-description"
    >
      {current.status === "pago" ? (
        <motion.div
          className="store-pix-success"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
        >
          <CompletionCheckmark className="store-pix-success-check" size={76} />
          <span>PAGAMENTO APROVADO</span>
          <h2>Pagamento confirmado!</h2>
          <p>Retire seu produto na recepção da ACCQUA.</p>
          <button type="button" onClick={onViewReservations ?? (() => onOpenChange(false))}>Ver minhas reservas</button>
        </motion.div>
      ) : expired || canceled ? (
        <div className="store-pix-expired" role="status">
          <span aria-hidden="true">⌛</span>
          <h2>{canceled ? "Cobrança cancelada" : "QR Code expirado"}</h2>
          <p>{canceled ? "Essa cobrança não pode mais ser paga." : "Os 5 minutos terminaram. Gere um novo Pix para continuar com a retirada garantida."}</p>
          <button type="button" disabled={regenerating} onClick={onGenerateNew}>
            {regenerating ? "Gerando novo Pix..." : "Gerar novo QR Code"}
          </button>
        </div>
      ) : (
        <div className="store-pix-payment">
          <div className="store-pix-payment-topline">
            <div>
              <small>PIX · RETIRADA GARANTIDA</small>
              <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(current.amount)}</strong>
            </div>
            <CountdownRing seconds={secondsRemaining} />
          </div>

          <div className="store-pix-qr-card">
            <img src={current.qrCodeImageUrl} alt="QR Code Pix para pagamento" draggable={false} />
          </div>

          <div className="store-pix-copy-block">
            <small>Pix copia e cola</small>
            <code>{current.brCode}</code>
            <button type="button" onClick={() => void handleCopy()} disabled={!current.brCode}>
              {copied ? "✓ Copiado!" : "Copiar código"}
            </button>
            {copyError ? <p role="alert">Não foi possível copiar automaticamente. Tente novamente.</p> : null}
          </div>

          <div className="store-pix-waiting" role="status" aria-live="polite">
            <i aria-hidden="true" />
            <span>Aguardando confirmação do pagamento...</span>
          </div>
          <p className="store-pix-safety">A confirmação vem diretamente da Woovi pelo servidor. O app não consegue marcar um Pix como pago manualmente.</p>
        </div>
      )}
    </ResponsiveDialog>
  );
}
