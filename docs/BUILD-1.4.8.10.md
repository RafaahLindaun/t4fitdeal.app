# ACCQUA Sports — Build 1.4.8.10

## Escopo

Correção cirúrgica de dois problemas mobile ainda presentes após a Build 1.4.8.9:

- **N v2 — Perfil do aluno:** os seis atalhos administrativos deixam de usar `aspect-ratio` e passam a ter **altura fixa de 84px**, em grid de **3 colunas**, com ícone de 24px, label curta em até duas linhas, sem subtitle e sem chevron. O objetivo é impedir qualquer interpretação que faça o tile crescer para a altura/largura da viewport.
- **O — Espaço fantasma da bottom navigation:** `/area-accqua` já opera em `routeFocusMode` no mobile e não renderiza a BottomNavigation global. A Build 1.4.8.10 remove as reservas legadas de `--app-bottomnav-offset` do shell Staff, da tela de administração e das subtelas operacionais, preservando apenas o safe-area real do aparelho.

## Regressões preservadas

Continuam protegidos os contratos anteriores de A–J e os ajustes M1/M2/M3 da Build 1.4.8.9:

- badge **Sem treino** com amarelo ACCQUA + texto navy;
- decoração/blob removida do roster mobile;
- header **Professor / Administração** sólido e acima dos cards durante o scroll;
- bottom navigation global transparente ao redor da pílula nas páginas que realmente a utilizam.

## Validação

`npm run visual:contracts`, `npm run typecheck` e `npm run build` fazem parte da validação da versão. O verificador 1.4.8.10 mantém os contratos A–J e adiciona contratos específicos para N v2 e O.
