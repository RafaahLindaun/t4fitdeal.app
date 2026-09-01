import { supabase } from "./supabase";

export type PixPaymentStatus = "pendente" | "pago" | "expirado" | "cancelado";

export type PixPayment = {
  id: string;
  productId: string;
  studentId: string;
  reservationId: string;
  correlationId: string;
  transactionId: string;
  brCode: string;
  qrCodeImageUrl: string;
  status: PixPaymentStatus;
  amount: number;
  expiresAt: string;
  paidAt: string;
  createdAt: string;
};

type Row = Record<string, unknown>;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentFromRow(row: Row): PixPayment {
  return {
    id: text(row.id),
    productId: text(row.produto_id),
    studentId: text(row.aluno_id),
    reservationId: text(row.reserva_id),
    correlationId: text(row.correlation_id),
    transactionId: text(row.transaction_id),
    brCode: text(row.br_code),
    qrCodeImageUrl: text(row.qr_code_image_url),
    status: (text(row.status) || "pendente") as PixPaymentStatus,
    amount: number(row.valor),
    expiresAt: text(row.expira_em),
    paidAt: text(row.pago_em),
    createdAt: text(row.created_at),
  };
}

export async function createPixPayment(productId: string): Promise<PixPayment> {
  const { data, error } = await supabase.functions.invoke("create-woovi-charge", {
    body: { productId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  if (!data?.payment) throw new Error("Resposta de pagamento inválida.");

  return paymentFromRow(data.payment as Row);
}

export async function loadPixPayment(correlationId: string) {
  const { data, error } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("correlation_id", correlationId)
    .maybeSingle();

  if (error) throw error;
  return data ? paymentFromRow(data as Row) : null;
}

export function subscribeToPixPayment(
  correlationId: string,
  onChange: (payment: PixPayment) => void,
) {
  const channel = supabase
    .channel(`accqua-pix-${correlationId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pagamentos",
        filter: `correlation_id=eq.${correlationId}`,
      },
      (payload) => {
        if (payload.new) onChange(paymentFromRow(payload.new as Row));
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
