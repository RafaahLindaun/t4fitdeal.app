import { useState } from "react";
import { motion } from "framer-motion";
import ResponsiveDialog from "../ResponsiveDialog";
import { MenuShieldIcon } from "../MenuIcons";
import { statusMatricula, type MembershipHealth } from "../../lib/home";

const RECEPTION_WHATSAPP = "https://wa.me/551147181730?text=Olá,%20preciso%20de%20ajuda%20com%20minha%20matrícula%20na%20Accqua%20Sports.";

function formatDate(value: string) {
  if (!value) return "data não informada";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "data não informada";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day, 12));
}

function copyFor(status: MembershipHealth, validUntil: string) {
  const formatted = formatDate(validUntil);
  if (status === "ativa") return `Sua matrícula está ativa até ${formatted}.`;
  if (status === "vencendo") return `Sua matrícula vence em breve, em ${formatted}. Renove pra não ter interrupção no acesso.`;
  if (!validUntil) return "A data de validade da sua matrícula ainda não está informada. Fale com a recepção para conferir.";
  return "Sua matrícula está inativa. Envie uma mensagem ou vá até a recepção o mais rápido possível.";
}

export default function MembershipShield({ validUntil }: { validUntil: string }) {
  const [open, setOpen] = useState(false);
  const status = statusMatricula(validUntil);
  const label = status === "ativa" ? "Matrícula ativa" : status === "vencendo" ? "Matrícula vencendo" : "Matrícula inativa";

  return (
    <>
      <motion.button
        className={`accqua-membership-shield is-${status}`}
        data-membership-status={status}
        type="button"
        aria-label={`${label}. Abrir detalhes`}
        title={label}
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9, opacity: 0.86 }}
        transition={{ duration: 0.12 }}
      >
        <MenuShieldIcon size={23} />
      </motion.button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={copyFor(status, validUntil)}
        presentation="center"
        className="membership-status-dialog membership-status-dialog-v1657"
        bodyClassName="membership-status-dialog-body"
      >
        <div className={`membership-status-card is-${status}`}>
          <span className="membership-status-card-icon"><MenuShieldIcon size={34} /></span>
          <strong>{label}</strong>
          <p>{copyFor(status, validUntil)}</p>
          {status !== "ativa" ? (
            <a href={RECEPTION_WHATSAPP} target="_blank" rel="noreferrer">Falar com a recepção</a>
          ) : (
            <button type="button" onClick={() => setOpen(false)}>Entendi</button>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
}
