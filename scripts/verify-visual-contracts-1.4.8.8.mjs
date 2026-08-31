import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
const failures = [];
const passes = [];

function read(file) {
  if (!cache.has(file)) {
    cache.set(file, fs.readFileSync(path.join(root, file), "utf8"));
  }
  return cache.get(file);
}

function requireMatch(id, file, pattern, note) {
  const source = read(file);
  if (!pattern.test(source)) {
    failures.push(`${id} — ${note} (${file})`);
    return;
  }
  passes.push(id);
}

function requireCount(id, file, token, expected, note) {
  const source = read(file);
  const count = source.split(token).length - 1;
  if (count !== expected) {
    failures.push(`${id} — ${note}; esperado ${expected}, encontrado ${count} (${file})`);
    return;
  }
  passes.push(id);
}

// A1 — sidebar independente, colapso local e transição previsível.
requireMatch("A1/state", "scr/components/StaffLayout.tsx", /const \[sidebarCollapsed, setSidebarCollapsed\] = useState\(false\);/, "estado local da sidebar ausente");
requireMatch("A1/a11y", "scr/components/StaffLayout.tsx", /aria-expanded=\{!sidebarCollapsed\}/, "aria-expanded da sidebar ausente");
requireMatch("A1/flex", "scr/styles/build-1.4.8.1.css", /\.accqua-staff-layout\s*\{[\s\S]*?display:\s*flex\s*!important;/, "layout desktop não está em flex");
requireMatch("A1/widths", "scr/styles/build-1.4.8.1.css", /--staff-sidebar-expanded-width:\s*238px;[\s\S]*?--staff-sidebar-collapsed-width:\s*72px;/, "larguras expanded/collapsed divergiram");
requireMatch("A1/motion", "scr/styles/build-1.4.8.1.css", /width\s+200ms\s+ease-in-out/, "transição de 200ms da sidebar ausente");

// A2 — superfície ativa própria, sem herdar background da página.
requireMatch("A2/tokens", "scr/styles/build-1.4.8.1.css", /--surface-active:[^;]+;[\s\S]*?--text-on-active:[^;]+;[\s\S]*?--border-active:[^;]+;/, "tokens interativos não estão definidos");
requireMatch("A2/filters", "scr/styles/build-1.4.8.1.css", /\.admin-area-filters button\[aria-pressed="true"\][\s\S]*?background:\s*var\(--surface-active\)\s*!important;/, "filtro selecionado não usa superfície ativa");
requireMatch("A2/stats", "scr/styles/build-1.4.8.1.css", /\.admin-dashboard-stat\[aria-pressed="true"\][\s\S]*?background:\s*var\(--surface-active\)\s*!important;/, "card estatístico selecionado não usa superfície ativa");

// A3 + J — uma única bottom nav, wrapper transparente e safe-area.
requireCount("A3/single", "scr/components/MainLayout.tsx", "<BottomNavigation", 1, "BottomNavigation deve ser renderizada uma única vez pelo AppShell");
requireMatch("A3/fixed", "scr/styles/build-1.4.8.1.css", /\.accqua-main-layout-nav\s*\{[\s\S]*?position:\s*fixed\s*!important;[\s\S]*?env\(safe-area-inset-bottom\)/, "wrapper global não está fixo com safe-area");
requireMatch("J/transparent", "scr/components/main-layout-v1487.css", /\.accqua-main-layout > \.accqua-main-layout-nav\s*\{[\s\S]*?background:\s*transparent\s*!important;/, "wrapper da bottom nav voltou a pintar fundo");
requireMatch("J/no-rect", "scr/components/main-layout-v1487.css", /\.accqua-main-layout > \.accqua-main-layout-nav::before,[\s\S]*?content:\s*none\s*!important;/, "pseudo-elemento retangular voltou à bottom nav");
requireMatch("J/radius", "scr/components/main-layout-v1487.css", /\.accqua-bottom-navigation\s*\{[\s\S]*?border-radius:\s*28px\s*!important;/, "pílula deixou de usar raio canônico de 28px");

// B1 — scroll desktop pertence ao painel direito.
requireMatch("B1/root", "scr/styles/build-1.4.8.2.css", /\.accqua-staff-layout\s*\{[\s\S]*?height:\s*100dvh\s*!important;[\s\S]*?overflow:\s*hidden\s*!important;/, "shell Staff não prende a viewport");
requireMatch("B1/content", "scr/styles/build-1.4.8.2.css", /\.accqua-staff-content\s*\{[\s\S]*?min-height:\s*0\s*!important;[\s\S]*?overflow-y:\s*auto\s*!important;/, "painel direito não possui scroll interno com min-height 0");

// C1 — pendências só na listagem, nunca no aluno individual.
requireMatch("C1/conditional", "scr/pages/AdminArea.tsx", /!selectedStudent\s*\?\s*\(\s*<button[\s\S]*?className=\{clsx\("admin-area-pending"/, "badge de pendências não está condicionado à listagem");
requireMatch("C1/header-grid", "scr/pages/admin-area-v1483.css", /\.admin-area-shell\.is-student-detail \.admin-area-header\s*\{\s*grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s*!important;/, "perfil individual ainda reserva terceira coluna");

// C2 — StatusBadge único e semântico.
requireMatch("C2/component", "scr/components/StatusBadge.tsx", /"success"\s*\|\s*"warning"\s*\|\s*"danger"\s*\|\s*"neutral"/, "variantes semânticas do StatusBadge divergiram");
requireMatch("C2/shape", "scr/components/status-badge.css", /padding:\s*6px\s+12px;[\s\S]*?border-radius:\s*999px;[\s\S]*?font-size:\s*13px;[\s\S]*?font-weight:\s*600;/, "geometria/tipografia do StatusBadge divergiram");
requireMatch("C2/use", "scr/pages/AdminArea.tsx", /<StatusBadge[\s\S]*?<StatusBadge[\s\S]*?<StatusBadge/, "perfil não usa StatusBadge de forma consistente");

// C3 — Radix Popover com detecção de colisão e seta.
requireMatch("C3/radix", "scr/pages/AdminArea.tsx", /<Popover\.Content[\s\S]*?side="bottom"[\s\S]*?align="start"[\s\S]*?sideOffset=\{8\}[\s\S]*?collisionPadding=\{16\}[\s\S]*?avoidCollisions/, "popover rápido perdeu ancoragem/collision detection");
requireMatch("C3/arrow", "scr/pages/AdminArea.tsx", /<Popover\.Arrow[^>]*admin-quick-popover-arrow-v1483/, "seta ancorada do popover ausente");

// D1 — progressive disclosure no montador.
requireMatch("D1/steps", "scr/pages/admin-workout-builder-v1486.css", /Compact step indicator[\s\S]*?\.admin-builder-step-nav/, "steps compactos do montador ausentes");
requireMatch("D1/collapse", "scr/pages/admin-workout-builder-v1486.css", /\.admin-builder-readiness-summary\[aria-expanded="false"\]/, "checklist de preparação deixou de ser recolhível");
requireMatch("D1/active-only", "scr/pages/admin-workout-builder-v1486.css", /\.admin-builder-screen:not\(\.is-step-programa\)[\s\S]*?display:\s*none;/, "etapas inativas voltaram a aparecer juntas");
requireMatch("D1/mobile", "scr/pages/admin-workout-builder-v1486.css", /\.admin-builder-mobile-step-controls\s*\{[\s\S]*?display:\s*grid;/, "navegação Próximo/Voltar mobile ausente");
requireMatch("D1/footer", "scr/pages/admin-workout-builder-v1486.css", /\.admin-builder-footer\s*\{[\s\S]*?z-index:\s*120;/, "footer persistente do montador ausente");

// E1/E2 — perfil mobile sem cortes e tabs com affordance horizontal.
requireMatch("E1/badge", "scr/components/staff-layout-v1484.css", /\.admin-training-action\.is-build-urgent\s*\{[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?padding-top:\s*34px\s*!important;/, "badge TREINO PENDENTE pode voltar a ser cortado");
requireMatch("E2/padding", "scr/components/staff-layout-v1484.css", /padding-left:\s*max\(16px,\s*env\(safe-area-inset-left\)\)\s*!important;[\s\S]*?padding-right:\s*max\(16px,\s*env\(safe-area-inset-right\)\)\s*!important;/, "respiro lateral do perfil mobile divergente");
requireMatch("E2/fade", "scr/components/staff-layout-v1484.css", /mask-image:\s*linear-gradient\(/, "fade da navegação Staff horizontal ausente");

// F1 — matrícula legível e tocável.
requireMatch("F1/labels", "scr/components/student-membership-editor.css", /\.admin-membership-current small\s*\{[\s\S]*?font-size:\s*13px;[\s\S]*?font-weight:\s*500;/, "labels do modal de matrícula ficaram pequenas");
requireMatch("F1/values", "scr/components/student-membership-editor.css", /\.admin-membership-current strong\s*\{[\s\S]*?font-size:\s*16px;[\s\S]*?font-weight:\s*600;/, "valores do modal de matrícula ficaram pequenos");
requireMatch("F1/touch", "scr/components/student-membership-editor.css", /\.admin-membership-form input\s*\{[\s\S]*?min-height:\s*44px;/, "inputs da matrícula deixaram de respeitar touch target");
requireMatch("F1/gap", "scr/components/student-membership-editor.css", /\.admin-membership-form\s*\{[\s\S]*?gap:\s*16px\s+12px;/, "espaçamento vertical da matrícula diminuiu");

// H1 — IconButton canônico no header da Dieta.
requireMatch("H1/component", "scr/components/icon-button.css", /\.accqua-icon-button\.is-md\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/, "IconButton md deixou de medir 44x44");
requireMatch("H1/icon", "scr/components/icon-button.css", /\.accqua-icon-button > svg\s*\{[\s\S]*?width:\s*20px\s*!important;[\s\S]*?height:\s*20px\s*!important;/, "ícone interno do IconButton deixou de medir 20px");
requireMatch("H1/gap", "scr/pages/diet-header-v1487.css", /\.diet-topbar-side\.is-right\s*\{[\s\S]*?gap:\s*12px\s*!important;/, "ações da Dieta ficaram próximas demais");
requireMatch("H1/use", "scr/pages/Diet.tsx", /<IconButton[\s\S]*?Informações sobre Minha dieta[\s\S]*?<IconButton[\s\S]*?Configurar metas da dieta/, "header da Dieta deixou de usar IconButton compartilhado");

// I — faixa Professor/Administração é uma única superfície sem recorte.
requireMatch("I/radius", "scr/pages/admin-area-v1483.css", /is-student-detail-screen[\s\S]*?\.admin-area-header\s*\{[\s\S]*?overflow:\s*visible\s*!important;[\s\S]*?clip-path:\s*none\s*!important;[\s\S]*?border-radius:\s*16px\s*!important;/, "header mobile do aluno pode voltar a recortar cantos");

if (failures.length) {
  console.error("\nACCQUA Build 1.4.8.8 — contratos visuais FALHARAM:\n");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error(`\n${failures.length} contrato(s) quebrado(s).`);
  process.exit(1);
}

console.log(`ACCQUA Build 1.4.8.8 — ${passes.length} contratos visuais validados.`);
