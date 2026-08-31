# ACCQUA Sports — Build 1.4.5 Hardening

Branch de consolidação técnica da Build 1.4.5.

## Escopo

- remover integrações legadas do FitDeal que não pertencem mais ao ACCQUA;
- corrigir autorização e isolamento de dados locais;
- tornar instalação, typecheck e build reproduzíveis no GitHub Actions;
- corrigir login desktop e desalinhamentos recorrentes de botões;
- reduzir bundle inicial com carregamento sob demanda;
- expor rotas inválidas em vez de mascará-las com redirect silencioso;
- preservar os fluxos funcionais atuais de Treino, Cardio, Dieta, Aulas, Loja, Perfil e Staff.

## Regra de merge

Esta branch não deve ser mesclada em `main` enquanto o CI não estiver verde e as mudanças visuais principais não tiverem sido revisadas.
