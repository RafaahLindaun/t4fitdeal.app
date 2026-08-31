# ACCQUA Sports — Build 1.4.8.8

## Objetivo

A Build 1.4.8.8 fecha o ciclo de correções visuais A1–J como **contratos verificáveis**, evitando que ajustes futuros reintroduzam problemas que já foram corrigidos nas builds 1.4.8.1–1.4.8.7.

## Contratos protegidos

- **A1** — sidebar Staff desktop independente, 238px → 72px, transição de 200ms e acessibilidade do toggle.
- **A2** — chips e cards usam superfície ativa própria, texto contrastante e borda de destaque.
- **A3/J** — uma única BottomNavigation global, safe-area, wrapper transparente e pílula de 28px sem faixa retangular.
- **B1** — lista de alunos desktop rola dentro do painel direito com `min-height: 0`.
- **C1** — badge geral de pendências não aparece no perfil individual do aluno.
- **C2** — `StatusBadge` único com variantes success/warning/danger/neutral.
- **C3** — treino rápido usa Radix Popover com colisão, offset e seta ancorada.
- **D1** — Montar Treino mantém progressive disclosure, checklist recolhível, etapa única no mobile e footer persistente.
- **E1/E2** — badge TREINO PENDENTE não corta; perfil mobile mantém 16px de respiro e tabs com fade horizontal.
- **F1** — modal Matrícula e pagamento mantém labels 13px, valores/inputs 16px e touch target mínimo de 44px.
- **H1** — header Minha dieta usa `IconButton` 44×44, ícone 20×20 e gap mínimo de 12px.
- **I** — faixa Professor / Administração mantém uma superfície única com raio de 16px e sem clipping.

## Hardening adicional

`bottom-navigation.css` agora define diretamente a geometria canônica da pílula. Telas de baixa altura podem compactar o conteúdo interno, mas não alteram mais o `border-radius` nem recriam recortes diferentes entre páginas.

## CI

Foi adicionado `npm run visual:contracts`, executado pelo workflow `ACCQUA CI` antes do TypeScript/build. O script verifica os contratos estruturais e de CSS acima e falha explicitamente indicando qual bloco A1–J regrediu.
