import { toast } from "sonner";

type UnknownError = unknown;

const INFRASTRUCTURE_PATTERNS = [
  /column reference/i,
  /is ambiguous/i,
  /postgres/i,
  /postgrest/i,
  /sqlstate/i,
  /syntax error/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /duplicate key/i,
  /violates .* constraint/i,
  /permission denied/i,
  /row-level security/i,
  /jwt/i,
  /rpc\b/i,
  /pgrst\d+/i,
  /42p\d+/i,
  /22p\d+/i,
  /2350\d/i,
  /failed to fetch/i,
  /networkerror/i,
  /fetch failed/i,
];

const CODE_MESSAGES: Array<[RegExp, string]> = [
  [/ACCQUA_STAFF_REQUIRED/i, "Seu acesso de equipe precisa ser atualizado. Entre novamente e tente de novo."],
  [/ACCQUA_STUDENT_NOT_FOUND/i, "Não encontramos esse aluno. Atualize a lista e tente novamente."],
  [/ACCQUA_MEMBERSHIP_PAYMENT_DATE_REQUIRED/i, "Informe a data do pagamento para confirmar a matrícula."],
  [/ACCQUA_MEMBERSHIP_PAYMENT_DAY_INVALID/i, "Informe um dia de pagamento válido entre 1 e 31."],
  [/ACCQUA_MEMBERSHIP_VALIDITY_INVALID/i, "A validade da matrícula não pode ser anterior ao último pagamento."],
  [/ACCQUA_CLASS_FULL/i, "Essa aula acabou de lotar."],
  [/MEMBERSHIP_OR_GYMPASS_REQUIRED/i, "A matrícula está inativa e não há Gympass informado."],
  [/MEMBERSHIP_REQUIRED/i, "A matrícula está inativa. Regularize antes de continuar."],
  [/GYMPASS_REQUIRED/i, "Informe o número do Gympass antes de continuar."],
  [/CLASS_PAST_DATE/i, "Essa aula já passou."],
  [/CLASS_INACTIVE/i, "Essa aula não está mais disponível."],
  [/product_image_required/i, "Adicione pelo menos uma foto antes de publicar."],
  [/product_copy_review_required/i, "Revise a descrição antes de publicar."],
];

function rawMessage(error: UnknownError) {
  if (error instanceof Error) return error.message.trim();
  if (typeof error === "string") return error.trim();
  if (error && typeof error === "object") {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string") return value.trim();
  }
  return "";
}

function isInfrastructureMessage(message: string) {
  return INFRASTRUCTURE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Converte falhas técnicas em mensagens seguras para Staff.
 * O erro real continua disponível para console/telemetria, mas SQL/PostgREST
 * nunca deve ser exibido literalmente em toast ou texto de interface.
 */
export function staffFacingErrorMessage(
  error: UnknownError,
  fallback = "Não foi possível concluir essa ação agora. Tente novamente.",
) {
  const message = rawMessage(error);
  if (!message) return fallback;

  for (const [pattern, friendly] of CODE_MESSAGES) {
    if (pattern.test(message)) return friendly;
  }

  if (isInfrastructureMessage(message)) return fallback;

  // Mensagens curtas e já escritas para usuário em português podem passar.
  // Evita transformar validações de formulário em um erro genérico.
  if (message.length <= 180 && /[áàâãéêíóôõúç]|não|informe|selecione|adicione|revise/i.test(message)) {
    return message;
  }

  return fallback;
}

export function logStaffError(scope: string, error: UnknownError) {
  console.error(`[ACCQUA Staff/${scope}]`, error);
}

let globalToastGuardInstalled = false;

/**
 * Última barreira de segurança: páginas legadas ainda podem chamar
 * toast.error(error.message). Se a string tiver assinatura de infraestrutura,
 * a mensagem é sanitizada antes de chegar ao usuário. Validações normais e
 * ReactNodes continuam passando sem alteração.
 */
export function installInfrastructureToastGuard() {
  if (globalToastGuardInstalled) return;
  globalToastGuardInstalled = true;

  const originalError = toast.error.bind(toast);
  const mutableToast = toast as typeof toast & { error: typeof toast.error };
  mutableToast.error = ((message: Parameters<typeof toast.error>[0], data?: Parameters<typeof toast.error>[1]) => {
    if (typeof message === "string" && isInfrastructureMessage(message)) {
      console.error("[ACCQUA/toast-infrastructure-error]", message);
      return originalError("Não foi possível concluir essa ação agora. Tente novamente.", data);
    }
    return originalError(message, data);
  }) as typeof toast.error;
}
