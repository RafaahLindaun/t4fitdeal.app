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
const productDialog = "scr/components/store/ProductDetailDialog.tsx";
const pixDialog = "scr/components/store/PixPaymentDialog.tsx";

// Segurança: credenciais da Woovi nunca entram no bundle React.
requireAbsentInTree("PIX/secrets-client", "scr", /WOOVI_APP_ID|WOOVI_WEBHOOK_SECRET/, "segredo da Woovi apareceu no bundle client");
requireMatch("PIX/appid-server", createFn, /Deno\.env\.get\("WOOVI_APP_ID"\)/, "AppID deixou de ser lido apenas no servidor");
requireMatch("PIX/woovi-endpoint", createFn, /https:\/\/api\.woovi\.com\/api\/v1\/charge/, "endpoint oficial de charge mudou");
requireMatch("PIX/server-price", createFn, /create_pix_payment_hold_v1_5_2[\s\S]*?const amount = Number\(hold\?\.amount/, "preço não está vindo do banco/RPC server-side");
requireMatch("PIX/five-minutes-constant", createFn, /EXPIRES_IN_SECONDS\s*=\s*300/, "prazo da cobrança deixou de ser 300s");
requireMatch("PIX/five-minutes-provider", createFn, /expiresIn:\s*EXPIRES_IN_SECONDS/, "prazo de 300s não está sendo enviado à Woovi");

// Estoque: a cobrança cria uma reserva real primeiro; expiração/cancelamento devolve o estoque pela trigger existente.
requireMatch("PIX/stock-hold", migration, /create_pix_payment_hold_v1_5_2[\s\S]*?insert into public\.reservas\(produto_id, aluno_id, status\)[\s\S]*?'reservado'/, "pagamento não segura estoque antes de chamar a Woovi");
requireMatch("PIX/release-expired", migration, /expire_pix_payment_v1_5_2[\s\S]*?set status = 'expirado'[\s\S]*?update public\.reservas[\s\S]*?set status = 'cancelado'/, "hold expirado deixou de devolver estoque");
requireMatch("PIX/no-client-write", migration, /revoke all on table public\.pagamentos from anon, authenticated;[\s\S]*?grant select on table public\.pagamentos to authenticated;/, "cliente voltou a ter escrita direta em pagamentos");
requireMatch("PIX/paid-server-only", migration, /revoke all on function public\.complete_pix_payment_v1_5_2\(text,timestamptz\) from public, anon, authenticated;[\s\S]*?grant execute on function public\.complete_pix_payment_v1_5_2\(text,timestamptz\) to service_role;/, "status pago pode voltar a ser alterado pelo client");
requireMatch("PIX/realtime", migration, /alter publication supabase_realtime add table public\.pagamentos;/, "pagamentos deixou de participar do Supabase Realtime");

// Webhook: assinatura recomendada RSA-SHA256 obrigatória; HMAC legado apenas como segunda camada opcional.
requireMatch("PIX/webhook-rsa-header", webhookFn, /x-webhook-signature/, "header de assinatura RSA não é lido");
requireMatch("PIX/webhook-rsa-algorithm", webhookFn, /RSASSA-PKCS1-v1_5[\s\S]*?SHA-256/, "webhook não usa RSA-SHA256");
requireMatch("PIX/webhook-rsa-required", webhookFn, /if \(!\(await verifyWooviSignature\(rawBody, signature\)\)\)[\s\S]*?401/, "assinatura RSA deixou de ser obrigatória");
requireMatch("PIX/webhook-public-keys", webhookFn, /https:\/\/api\.woovi\.com\/api\/v1\/webhook\/public-keys/, "chaves públicas da Woovi não são buscadas no endpoint oficial");
requireMatch("PIX/webhook-hmac-secret", webhookFn, /Deno\.env\.get\("WOOVI_WEBHOOK_SECRET"\)/, "HMAC opcional não usa secret server-side");
requireMatch("PIX/webhook-hmac-header", webhookFn, /x-openpix-signature/, "assinatura HMAC legada não é lida quando configurada");
requireMatch("PIX/webhook-hmac-algorithm", webhookFn, /name:\s*"HMAC",\s*hash:\s*"SHA-1"/, "HMAC legado deixou de usar algoritmo esperado pela Woovi");
requireMatch("PIX/webhook-completed", webhookFn, /OPENPIX:CHARGE_COMPLETED[\s\S]*?complete_pix_payment_v1_5_2/, "webhook pago não chega ao RPC server-only");
requireMatch("PIX/webhook-expired", webhookFn, /OPENPIX:CHARGE_EXPIRED[\s\S]*?expire_pix_payment_v1_5_2/, "expiração da Woovi não libera o hold");

// UI: ação nova, QR real, contador, copiar em um toque, Realtime e celebração compartilhada.
requireMatch("PIX/pay-now-copy", productDialog, />Pagar agora</, "CTA Pagar agora não está visível");
requireMatch("PIX/pay-now-subtitle", productDialog, />Retirada garantida</, "CTA perdeu a promessa de retirada garantida");
requireMatch("PIX/pay-now-handler", productDialog, /if \(!payDisabled\) onPayNow\(product\);/, "CTA Pagar agora não está ligado ao fluxo Pix");
requireMatch("PIX/remove-legacy-copy", productDialog, /description="Escolha reservar para pagar na recepção ou pagar agora via Pix\."/, "descrição do modal não reflete o novo pagamento");
requireMatch("PIX/clipboard-api", pixDialog, /navigator\.clipboard\?\.writeText/, "copia-e-cola deixou de usar Clipboard API");
requireMatch("PIX/clipboard-feedback", pixDialog, /✓ Copiado!/, "feedback imediato de cópia foi removido");
requireMatch("PIX/countdown-total", pixDialog, /TOTAL_SECONDS\s*=\s*300/, "contador deixou de usar 5 minutos");
requireMatch("PIX/countdown-ring", pixDialog, /strokeDashoffset=\{offset\}/, "anel deixou de esvaziar via strokeDashoffset");
requireMatch("PIX/countdown-critical", pixDialog, /seconds <= 30/, "últimos 30s deixaram de entrar em estado crítico");
requireMatch("PIX/realtime-client", "scr/lib/payments.ts", /postgres_changes[\s\S]*?table:\s*"pagamentos"[\s\S]*?correlation_id/, "tela deixou de ouvir pagamentos via Realtime");
requireMatch("PIX/shared-success-check", pixDialog, /CompletionCheckmark/, "pagamento deixou de reutilizar o check de conclusão");
requireMatch("PIX/shared-success-confetti", pixDialog, /confetti\(/, "pagamento deixou de reutilizar confete de conclusão");
requireMatch("PIX/shared-check-workout", "scr/components/home/TreinoHojeCard.tsx", /CompletionCheckmark/, "checkmark de conclusão não é mais compartilhado com treino");
requireMatch("PIX/novelty-reduced-motion", "scr/components/store/PixNoveltyBadge.tsx", /useReducedMotion[\s\S]*?reduceMotion \? undefined/, "badge novidade não respeita reduced-motion");
requireMatch("PIX/novelty-dismissible", "scr/components/store/PixNoveltyBadge.tsx", /localStorage\.setItem/, "badge novidade não pode mais ser dispensado");
requireMatch("PIX/novelty-expiry", "scr/components/store/PixNoveltyBadge.tsx", /2026-10-01T03:00:00\.000Z/, "badge novidade perdeu expiração configurada");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.2 — contratos Pix FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) 1.5.2 quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.5.2 — ${passes.length} contratos Pix validados.`);
