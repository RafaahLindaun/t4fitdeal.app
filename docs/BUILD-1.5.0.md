# ACCQUA Sports — Build 1.5.0

## Escopo

Build estrutural do fluxo **Staff → Montar Treino**, com foco principal na experiência mobile. Mantém as correções e contratos visuais A–O consolidados nas builds 1.4.8.x.

## P1 — Progresso único

- O mobile passa a usar uma única barra fina segmentada, estilo stories, com 4 etapas: **Programa, Dias, Exercícios e Revisão**.
- Indicadores antigos concorrentes (context bar com %, pills das etapas e barra Voltar/Etapa/Próximo) ficam fora da experiência mobile.
- A preparação/revisão permanece recolhida e só aparece na etapa final quando existe pendência real.
- Segmentos concluídos usam verde; etapa atual usa o accent amarelo; futuras permanecem neutras.

## P4 — Scroll e rodapé contextual

- O wrapper da tela fica preso a `100dvh` e não rola.
- `admin-builder-shell` é o único conteúdo vertical rolável no mobile, com `min-height: 0` e `overflow-y: auto`.
- O rodapé móvel mostra apenas o nome da etapa e **uma ação primária**.
- Etapas 1–3 usam **Próximo**; a etapa final usa **Salvar treino**.
- **Salvar modelo** passa a ser ação textual secundária.

## P2 — Hierarquia de cor

- Amarelo: ação primária + segmento de progresso atual.
- Azul: seleção de divisão, rotina, grupo e dias.
- Verde: conclusão.
- Montagem guiada e demais ações auxiliares usam superfície neutra.

## P3 — Divisão por swipe

- FULL / AB / ABC / ABCD / ABCDE / ABCDEF passam a uma faixa horizontal rolável.
- `scroll-snap-type: x mandatory`, chips com mínimo de 88px e `scroll-snap-align: center`.
- A opção selecionada usa azul e `scale(1.05)`.
- O toque direto continua selecionando qualquer opção visível.

## P5 — Reordenação real dos exercícios

- A lista usa `Reorder.Group` / `Reorder.Item` do Framer Motion.
- Cada exercício tem handle dedicado com área mínima de 44×44px.
- Durante o arrasto o item ganha escala e sombra.
- `onReorder` atualiza `routines` através de `reorderActiveRoutineExercises`, recalculando `position`.
- A ordem atualizada participa do rascunho local e do mesmo payload `routines` usado por `publishAdminProgram`, portanto não é apenas uma animação visual.

## Regressão

`npm run visual:contracts` passa a executar `verify-visual-contracts-1.5.0.mjs`, que primeiro preserva os contratos A–O da 1.4.8.10 e depois verifica P1–P5.

Nenhuma migration de banco é necessária para esta build.
