# ACCQUA Sports — Build 1.4.8.1

## Escopo

Correções globais aplicadas antes de novos ajustes de tela.

### A1 — Sidebar Staff desktop
- estado local `expanded/collapsed` no `StaffLayout`;
- largura 238px → 72px em 200ms;
- layout desktop passa de grid mutável para flex com conteúdo `flex: 1`;
- botão acessível de ocultar/mostrar com `aria-label` e `aria-expanded`;
- modo colapsado mantém somente ícones e não altera `grid-template-columns` do pai.

### A2 — Estados ativos de cards e chips
- tokens dedicados `--surface-active`, `--text-on-active` e `--border-active`;
- cobertura de `:hover`, `:active`, `.is-active`, `aria-pressed=true` e `aria-selected=true`;
- texto, ícones e badges permanecem legíveis no estado selecionado;
- foco por teclado recebe outline amarelo visível.

### A3 — Bottom navigation mobile
- preserva uma única instância global em `MainLayout`;
- pill canônica com raio 28px em todas as telas que utilizam a navegação;
- margem lateral de 12px e afastamento inferior com `env(safe-area-inset-bottom)`;
- sombra/vidro padronizados e offset global do conteúdo atualizado;
- regras antigas para telas baixas não mudam mais o recorte da barra;
- Área ACCQUA/Staff mobile continua em modo foco sem bottom navigation global, conforme a Build 1.4.8.

## Validação esperada

- npm ci;
- TypeScript strict;
- Vite production build;
- teste SQL de Aulas no CI.
