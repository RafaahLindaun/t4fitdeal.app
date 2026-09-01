import "./verify-visual-contracts-1.5.1.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function requireMatch(id, file, pattern, note) {
  if (!pattern.test(read(file))) failures.push(`${id} — ${note} (${file})`);
  else passes.push(id);
}

function collectFiles(dir) {
  const absolute = path.join(root, dir);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    return entry.isDirectory() ? collectFiles(relative) : [relative];
  });
}

function requireAbsentInTree(id, dir, pattern, note) {
  const found = collectFiles(dir).find((file) => pattern.test(read(file)));
  if (found) failures.push(`${id} — ${note} (${found})`);
  else passes.push(id);
}

const migration = "supabase/migrations/20260901035500_build_1_5_2_woovi_pix_payments.sql";
const createFn = "supabase/functions/create-woovi-charge/index.ts";
const webhookFn = "supabase/functions/woovi-webhook/index.ts";

// Segurança: credenciais da Woovi nunca entram no bundle React.
requireAbsentInTree("PIX/secrets-client", "scr", /WOOVI_APP_ID|WOOVI_WEBHOOK_SECRET/, "segredo da Woovi apareceu no bundle client");
requireMatch("PIX/appid-server", createFn, /Deno\.env\.get\("WOOVI_APP_ID"\)/, "AppID deixou de ser lido apenas no servidor");
requireMatch("PIX/woovi-endpoint", createFn, /https:\/\/api\.woovi\.com\/api\/v1\/charge/, "endpoint oficial de charge mudou");
requireMatch("PIX/server-price", createFn, /create_pix_payment_hold_v1_5_2[\s\S]*?const amount = Number\(hold\?\.amount/, "preço não está vindo do banco/RPC server-side");
requireMatch("PIX/five-minutes", createFn, /EXPIRES_IN_SECONDS\s*=\s*300[\s\S]*?expiresIn:\s*EXPIRES_IN_SECONDS/, "cobrança deixou de expirar em 300s");

// Estoque: a cobrança cria uma reserva real primeiro; expiração/cancelamento devolve o estoque pela trigger existente.
requireMatch("PIX/stock-hold", migration, /create_pix_payment_hold_v1_5_2[\s\S]*?insert into public\.reservas\(produto_id, aluno_id, status\)[\s\S]*?'reservado'/, "pagamento não segura estoque antes de chamar a Woovi");
requireMatch("PIX/release-expired", migration, /expire_pix_payment_v1_5_2[\s\S]*?set status = 'expirado'[\s\S]*?update public\.reservas[\s\S]*?set status = 'cancelado'/, "hold expirado deixou de devolver estoque");
requireMatch("PIX/no-client-write", migration, /revoke all on table public\.pagamentos from anon, authenticated;[\s\S]*?grant select on table public\.pagamentos to authenticated;/, "cliente voltou a ter escrita direta em pagamentos");
requireMatch("PIX/paid-server-only", migration, /revoke all on function public\.complete_pix_payment_v1_5_2\(text,timestamptz\) from public, anon, authenticated;[\s\S]*?grant execute on function public\.complete_pix_payment_v1_5_2\(text,timestamptz\) to service_role;/, "status pago pode voltar a ser alterado pelo client");
requireMatch("PIX/realtime", migration, /alter publication supabase_realtime add table public\.pagamentos;/, "pagamentos deixou de participar do Supabase Realtime");

// Webhook: assinatura recomendada RSA-SHA256 obrigatória; HMAC legado apenas como segunda camada opcional.
requireMatch("PIX/webhook-rsa", webhookFn, /x-webhook-signature[\s\S]*?RSASSA-PKCS1-v1_5[\s\S]*?SHA-256/, "webhook não valida a assinatura RSA recomendada pela Woovi");
requireMatch("PIX/webhook-public-keys", webhookFn, /https:\/\/api\.woovi\.com\/api\/v1\/webhook\/public-keys/, "chaves públicas da Woovi não são buscadas no endpoint oficial");
requireMatch("PIX/webhook-hmac", webhookFn, /WOOVI_WEBHOOK_SECRET[\s\S]*?x-openpix-signature[\s\S]*?SHA-1/, "HMAC opcional deixou de ser validado quando configurado");
requireMatch("PIX/webhook-completed", webhookFn, /OPENPIX:CHARGE_COMPLETED[\s\S]*?complete_pix_payment_v1_5_2/, "webhook pago não chega ao RPC server-only");
requireMatch("PIX/webhook-expired", webhookFn, /OPENPIX:CHARGE_EXPIRED[\s\S]*?expire_pix_payment_v1_5_2/, "expiração da Woovi não libera o hold");

// UI: ação nova, QR real, contador, copiar em um toque, Realtime e celebração compartilhada.
requireMatch("PIX/pay-now", "scr/components/store/ProductDetailDialog.tsx", /Pagar agora[\s\S]*?Retirada garantida[\s\S]*?onPayNow\(product\)/, "CTA Pagar agora não está ligado ao fluxo Pix");
requireMatch("PIX/remove-legacy-copy", "scr/components/store/ProductDetailDialog.tsx", /description="Escolha reservar para pagar na recepção ou pagar agora via Pix\."/, "descrição do modal não reflete o novo pagamento");
requireMatch("PIX/clipboard", "scr/components/store/PixPaymentDialog.tsx", /navigator\.clipboard\?\.writeText[\s\S]*?✓ Copiado!/, "copia-e-cola deixou de copiar em um clique com feedback");
requireMatch("PIX/countdown", "scr/components/store/PixPaymentDialog.tsx", /TOTAL_SECONDS\s*=\s*300[\s\S]*?strokeDashoffset[\s\S]*?seconds <= 30/, "anel de 5 minutos/alerta final foi removido");
requireMatch("PIX/realtime-client", "scr/lib/payments.ts", /postgres_changes[\s\S]*?table:\s*"pagamentos"[\s\S]*?correlation_id/, "tela deixou de ouvir pagamentos via Realtime");
requireMatch("PIX/shared-success", "scr/components/store/PixPaymentDialog.tsx", /CompletionCheckmark[\s\S]*?confetti\(/, "pagamento deixou de reutilizar linguagem de conclusão do treino");
requireMatch("PIX/shared-check-workout", "scr/components/home/TreinoHojeCard.tsx", /CompletionCheckmark/, "checkmark de conclusão não é mais compartilhado com treino");
requireMatch("PIX/novelty-reduced-motion", "scr/components/store/PixNoveltyBadge.tsx", /useReducedMotion[\s\S]*?reduceMotion \? undefined[\s\S]*?localStorage\.setItem/, "badge novidade não respeita reduced-motion ou não pode ser dispensado");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.2 — contratos Pix FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.5.2 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.5.2 — ${passes.length} contratos Pix validados.`);
