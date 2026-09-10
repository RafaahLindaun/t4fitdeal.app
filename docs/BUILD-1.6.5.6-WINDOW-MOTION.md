# Build 1.6.5.6 — ACCQUA Window Motion

## Regra permanente

Toda interface que abrir acima do conteúdo principal do ACCQUA deve possuir animação de **entrada e saída**. Isso inclui modal, dialog, alert dialog, bottom sheet, drawer, popover, visualizador, confirmação, editor rápido, seletor e qualquer painel foreground equivalente.

Não é permitido criar uma nova janela com montagem/desmontagem instantânea sem movimento de fechamento.

## Componentes preferenciais

1. `ResponsiveDialog` — padrão principal. Desktop abre como janela central; mobile abre como bottom sheet.
2. `CenteredModal` — janela central quando o comportamento não deve virar sheet no mobile.
3. `ConfirmDeleteDialog` / Radix AlertDialog — confirmações destrutivas.
4. Janelas manuais que realmente precisem existir devem usar `AnimatePresence` e os presets de `scr/lib/windowMotion.ts`.
5. Popovers e drawers Radix/Vaul devem usar o mesmo contrato de timing por `data-state="open|closed"`.

## Contrato visual ACCQUA

- Overlay: 190 ms na entrada, 150 ms na saída.
- Painel: 260 ms na entrada, 180 ms na saída.
- Curva de entrada: `cubic-bezier(.16, 1, .3, 1)`.
- Curva de saída: `cubic-bezier(.4, 0, 1, 1)`.
- Desktop / modal central: pequeno lift vertical + scale de 0.965 para 1 + blur curto.
- Mobile / sheet: subida curta + scale quase imperceptível + blur curto. Vaul continua responsável pela física de drag-to-close.
- Viewer: scale mais perceptível, adequado para foto/mídia.
- Popover ancorado: deslocamento curto de 8 px + scale 0.985 + blur leve, preservando o posicionamento do Radix.
- Overlay e painel se movimentam juntos, mas o overlay termina antes para a interface parecer responsiva.
- Botões de fechar dão feedback de pressão curto (`scale(.93)`).
- Navegações disparadas de dentro de uma janela devem aguardar o fechamento visual antes de trocar de rota.
- `prefers-reduced-motion` deve sempre ser respeitado.

A linguagem foi desenhada para ter o refinamento de interfaces modernas sem copiar uma animação específica: o ACCQUA usa tempos, escala e blur próprios e mantém amarelo/navy como identidade visual.

## API compartilhada

Arquivo: `scr/lib/windowMotion.ts`

Presets:
- `accquaOverlayVariants`
- `accquaWindowVariants.center`
- `accquaWindowVariants.sheet`
- `accquaWindowVariants.viewer`
- `accquaWindowVariants.popover`
- `accquaOverlayTransition`
- `accquaWindowTransition`
- `ACCQUA_WINDOW_MOTION`

A camada CSS global e focada fica em `scr/styles/window-motion-1.6.5.6.css` e deve continuar carregada por último em `scr/main.tsx` para vencer animações históricas sem alterar layout de páginas.

## Atributos do contrato

Superfícies compartilhadas devem marcar:

- overlay: `data-accqua-window-overlay`
- modal central: `data-accqua-window-surface="center"`
- bottom sheet: `data-accqua-window-surface="sheet"`
- viewer: `data-accqua-window-surface="viewer"`
- popover: `data-accqua-window-surface="popover"`

Janelas manuais controladas por Framer Motion devem também usar `data-accqua-motion-managed` no container principal, evitando que a camada CSS aplique uma segunda animação.

## Auditoria 1.6.5.6

Cobertura compartilhada com entrada + saída reais:
- `ResponsiveDialog` (Radix desktop + Vaul mobile)
- `CenteredModal`
- `ConfirmDeleteDialog`
- confirmação de reset de água em `WaterWidget`
- gestão de equipe do dono (herda `CenteredModal`)
- drawer da biblioteca do `AdminWorkoutBuilder` (Vaul)
- popover de treino rápido em `AdminArea` (Radix Popover)

Convertidos para `AnimatePresence` + presets compartilhados:
- `ProfilePhotoViewer`
- `WorkoutMedia` expandido
- `WorkoutCalendarSheet`
- `WelcomeOnboarding`
- primeiro acesso em `Login`
- configurações de Cardio
- histórico de Cardio
- confirmação de logout em `Profile`
- perfil resumido em `Ranking`
- pausa/saída do treino em `Treino`
- conclusão do treino em `Treino`
- histórico rápido da Dieta em `DietHistoryPopover`

No fluxo de Treino, fechar a janela e navegar são coordenados: a troca de rota acontece somente depois do `panelCloseMs`, evitando corte abrupto da animação. O redirecionamento automático para Cardio após treino concluído também segue essa regra.

## Regra de desenvolvimento futura

Antes de aprovar uma nova janela:

- confirmar que abre e fecha com movimento;
- confirmar Escape/backdrop/close sem salto visual;
- confirmar comportamento em desktop e mobile;
- confirmar que navegação disparada por ação dentro da janela respeita o fechamento;
- confirmar `prefers-reduced-motion`;
- não criar keyframes exclusivos de página sem necessidade funcional;
- não duplicar tempos/curvas fora de `windowMotion.ts`;
- preferir os componentes compartilhados antes de criar uma nova implementação manual.
