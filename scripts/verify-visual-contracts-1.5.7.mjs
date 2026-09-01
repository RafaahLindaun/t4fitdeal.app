import "./verify-visual-contracts-1.5.6.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const passes = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireMatch = (id, file, pattern, note) => pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAll = (id, file, patterns, note) => patterns.every((pattern) => pattern.test(read(file))) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);
const requireAbsent = (id, file, pattern, note) => !pattern.test(read(file)) ? passes.push(id) : failures.push(`${id} — ${note} (${file})`);

const css = "scr/styles/build-1.5.7.css";
const migration = "supabase/migrations/20260901203000_build_1_5_7_login_reservations_access.sql";
const loginFn = "supabase/functions/login-identifier-v157/index.ts";
const recipeFn = "supabase/functions/generate-recipe-ai/index.ts";

requireMatch("157/version", "package.json", /"version":\s*"1\.5\.7"/, "package não está em 1.5.7");
requireMatch("157/contracts", "package.json", /verify-visual-contracts-1\.5\.7\.mjs/, "npm não executa contratos 1.5.7");
requireMatch("157/css-last", "scr/main.tsx", /build-1\.5\.6\.css";\s*\nimport "\.\/styles\/build-1\.5\.7\.css";/, "camada 1.5.7 não é a última da cascata");

requireAll("157/login-edge", loginFn, [/cpf\.eq\.\$\{normalized\}/, /phone\.eq\.\$\{normalized\}/, /signInWithPassword/, /access_token/, /refresh_token/], "endpoint não resolve CPF/telefone + senha com segurança");
requireAbsent("157/login-no-email-leak", loginFn, /return json\(\{[^}]*email:/, "endpoint pode devolver o e-mail resolvido");
requireAll("157/login-client", "scr/auth/AuthProvider.tsx", [/login-identifier-v157/, /supabase\.auth\.setSession/, /E-mail, CPF, telefone ou senha incorretos/], "AuthProvider não usa login por identificador");
requireAll("157/login-ui", css, [/concept-feedback/, /concept-feature-grid article:hover/, /translateY\(-4px\)/], "login perdeu encaixe/hover 1.5.7");

requireAll("157/reservation-policy", migration, [/reservas_select_own_or_staff/, /aluno_id = auth\.uid\(\)/], "aluno não consegue ver o próprio histórico de reservas");
requireAll("157/reservation-delete-rpc", migration, [/delete_my_cancelled_reservation_v1_5_7/, /lower\(coalesce\(status,\s*''\)\)\s*=\s*'cancelado'/, /revoke all[\s\S]*?from public, anon/], "exclusão não está limitada à reserva cancelada autenticada");
requireAll("157/reservation-ui", "scr/components/ProfileReservations157.tsx", [/status === "reservado"/, /status === "cancelado"/, /Apagar/, /activeCount/], "perfil não separa Cancelar/Apagar e contador ativo");

requireAll("157/access-summary", migration, [/get_accqua_access_mode_summary_v1_5_5/, /public\.profiles/, /accqua_app_approval/, /numero_gympass/, /numero_totalpass/], "resumo de acesso continua preso à tabela vazia antiga");
requireMatch("157/workout-resolve", "scr/lib/admin.ts", /publishAdminProgram[\s\S]*?resolveStudentWorkoutAlerts\(input\.studentId\)/, "publicar treino não resolve alerta pendente");
requireAll("157/workout-alert-exit", "scr/components/home/NotificationsSheet.tsx", [/AnimatePresence/, /exit=\{\{ opacity: 0, x: 38, scale: 0\.96 \}\}/], "alerta resolvido não anima a saída");

requireAll("157/staff-header-component", "scr/components/StaffSubPageHeader.tsx", [/staff-subpage-back/, /navigate\(-1\)/, /aria-label="Voltar"/], "header Staff compartilhado ausente");
requireAll("157/staff-headers", "scr/pages/NotificationsStaff.tsx", [/StaffSubPageHeader/, /title="Notificações"/], "Notificações não usa header compartilhado");
requireAll("157/staff-ranking-header", "scr/pages/RankingStaff.tsx", [/StaffSubPageHeader/, /title="Ranking"/], "Ranking não usa header compartilhado");
requireAll("157/staff-classes-header", "scr/pages/ClassesAdminV155.tsx", [/StaffSubPageHeader/, /title="Gestão de aulas"/], "Aulas não usa header compartilhado");
requireAll("157/sidebar-autocollapse", "scr/components/StaffLayout.tsx", [/location\.pathname === "\/area-accqua\/montar"/, /setSidebarCollapsed\(true\)/], "entrada do montador não recolhe a sidebar pelo estado canônico");
requireAll("157/sidebar-hover", css, [/accqua-sidebar-wiggle-v157/, /rotate\(-8deg\)/, /accqua-sidebar-underline-v157/, /prefers-reduced-motion:no-preference/], "sidebar perdeu hover sutil/acessível");

requireAll("157/method-hover", css, [/workout-entry-methods button p/, /button:hover p/, /opacity: 0/], "descrição dos métodos não está progressivamente revelada no desktop");
requireAll("157/builder-footer", css, [/admin-builder-shell[\s\S]*?padding-bottom: max\(138px/, /admin-builder-mobile-footer-copy > strong[\s\S]*?white-space: normal/, /admin-builder-mobile-primary[\s\S]*?max-width: 46vw/], "footer pode sobrepor/cortar dados após IA");
requireAll("157/home-icons", css, [/accqua-membership-shield/, /accqua-notification-button/, /background: #0a2a54/, /border-radius: 12px/], "ícones do topo da Início não compartilham o card visual");
requireAll("157/quick-copy", "scr/components/Build157UiBridge.tsx", [/Montar treino rápido/, /Selecionar treino rápido/], "rótulo Selecionar treino rápido não foi aplicado");
requireMatch("157/profile-icons", css, /admin-training-action > span[\s\S]*?color: var\(--accent\)/, "ícones dos cards de treino não estão amarelos");

requireAll("157/loading", css, [/@keyframes accqua-loading-pulse-v157/, /opacity:/, /transform:/, /\.72s/], "loading global não usa animação leve 1.5.7");
requireAbsent("157/loading-no-layout", css, /@keyframes accqua-loading-pulse-v157\s*\{[^}]*?(?:width|height|top|left|margin|padding):/s, "loading anima propriedade de layout");

requireAll("157/recipe-pipeline", recipeFn, [/const tacoPromise = loadTaco\(\)/, /gemini-3\.1-flash-lite/, /gemini-2\.5-flash-lite/, /AbortSignal\.timeout/, /imageReason: "Use Validar IA/], "pipeline de receita continua suscetível ao 502 antigo");
requireAbsent("157/recipe-no-37", recipeFn, /gemini-3\.7-flash/, "modelo instável voltou ao caminho crítico da receita");
requireAll("157/recipe-taco-only", recipeFn, [/NÃO calcule e NÃO retorne kcal/, /macrosEstimatedAi: !allMatched/, /nutritionSource:/], "macros podem voltar a ser inventados pelo LLM");

if (failures.length) {
  console.error("\nACCQUA Build 1.5.7 — contratos FALHARAM:\n");
  failures.forEach((failure) => console.error(` - ${failure}`));
  console.error(`\n${failures.length} contrato(s) 1.5.7 quebrado(s).`);
  process.exit(1);
}
console.log(`ACCQUA Build 1.5.7 — ${passes.length} contratos validados.`);
