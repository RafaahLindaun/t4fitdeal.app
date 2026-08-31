# ACCQUA Sports — Build 1.4.8.2

## B1 — Staff > Lista de Alunos (desktop)

Correção da cadeia de altura/overflow que impedia visualizar alunos além dos primeiros cards.

### Implementação
- shell Staff desktop limitado a `100dvh` com `overflow: hidden`;
- sidebar permanece fixa na viewport;
- painel direito usa `flex: 1`, `min-height: 0` e `overflow-y: auto`;
- rota e tela `admin-area-screen` deixam de criar/cortar um segundo scroll;
- header do Staff e busca/filtros permanecem sticky dentro do painel rolável;
- scrollbar desktop discreta e visível;
- comportamento mobile não é alterado.

## Critério de aceite
- com mais de seis alunos cadastrados, o painel rola até o último card;
- sidebar não se move junto com a lista;
- busca e filtros continuam acessíveis durante a rolagem;
- nenhum card é cortado no final da lista;
- TypeScript e build de produção permanecem verdes.
