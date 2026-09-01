# ACCQUA Sports — Build 1.5.1

## Escopo

Build de regressão e acabamento visual. Mantém os contratos A–O consolidados nas builds 1.4.8.x e P1–P5 da Build 1.5.0, e adiciona os blocos Q e R.

## R — Modais e bottom sheets acima da bottom navigation

- `ResponsiveDialog` já marcava o `body` enquanto aberto, mas o **Perfil do ranking** é um sheet manual e não passava por esse componente.
- A correção agora é global: enquanto existir qualquer elemento com `aria-modal="true"`, `.accqua-main-layout-nav` fica invisível e sem `pointer-events`.
- O mecanismo existente `data-accqua-modal-open="true"` continua como fallback para `ResponsiveDialog`.
- Overlay/content de `ResponsiveDialog` usam a camada 10040/10041.
- O sheet manual de perfil do ranking foi explicitamente colocado nas mesmas camadas.

Assim, ranking, detalhes da Loja e demais modais reais não podem mais ser interceptados visualmente pela bottom navigation.

## Q — Loja mobile: detalhes do produto

### Imagem

- A imagem principal recebe `transform: none`, `rotate: 0deg` e `image-orientation: from-image`.
- No mobile passa a preencher o wrapper com `object-fit: cover`, removendo a área vazia causada pelo `contain` que fazia o selo parecer separado da foto.
- Miniaturas recebem a mesma proteção contra rotação CSS.

### Badge de desconto

- Continua dentro do wrapper `position: relative` da imagem.
- É travado em `position: absolute; top: 12px; left: 12px`, com camada própria.

### Reserva

- O CTA recebe alvo mínimo de 60px e `pointer-events: auto`.
- O body do sheet mantém scroll vertical e safe-area inferior para o botão não ser cortado.
- O handler do botão agora interrompe propagação e só chama `onReserve(product)` quando o estado não está bloqueado.
- Em `Store.tsx`, `onReserve` continua ligado diretamente a `reserveMutation.mutate(product)`.

## Regressão automática

`npm run visual:contracts` passa a executar `verify-visual-contracts-1.5.1.mjs`.

Esse verificador primeiro executa os contratos A–O e P1–P5 das builds anteriores e depois valida Q/R.

Nenhuma migration de banco é necessária nesta build.
