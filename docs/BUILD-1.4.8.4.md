# ACCQUA Sports — Build 1.4.8.4

## Escopo
Correções mobile do Perfil do Aluno dentro da Área ACCQUA/Staff.

### E1 — Badge TREINO PENDENTE
- o badge deixa de ficar com `top: -8px` no mobile;
- passa a ficar totalmente dentro do card, com `top/right: 8px`;
- o card reserva espaço superior para o badge;
- a animação mobile não translada nem rotaciona o card, evitando corte nas bordas;
- mantém pelo menos 16px de respiro lateral no perfil e 8px internos para o badge.

### E2 — Cards e abas mobile
- perfil individual recebe padding lateral mínimo de 16px;
- cards e grupos usam `max-width: 100%`, `min-width: 0` e `box-sizing: border-box`;
- barra Staff horizontal mantém scroll nativo;
- adiciona fade nas duas extremidades com `mask-image`/`-webkit-mask-image`;
- adiciona `scroll-padding-inline` e espaço extra para a última aba;
- preserva auto-centralização da aba ativa já existente no `StaffLayout`.

## Critérios de aceite
- badge TREINO PENDENTE 100% visível entre 360px e 430px;
- nenhum card do perfil encosta ou é cortado pela viewport;
- primeira e última aba podem ser alcançadas completamente;
- fade deixa evidente que existem mais abas horizontalmente;
- desktop permanece sem alteração visual deste lote.
