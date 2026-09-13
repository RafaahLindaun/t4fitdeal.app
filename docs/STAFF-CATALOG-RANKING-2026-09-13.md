# Ajustes de menu, ranking e Área Accqua — 13/09/2026

- Menu: removidos os dois avisos solicitados para alunos sem treino; a contagem de treinos planejados continua aparecendo quando existe planejamento.
- Ranking: painel com mês e encerramento no fuso de São Paulo, posição e dias reais do participante, diferença para o líder, prêmio do período e atualização manual. Carregamento, erro e prêmio não anunciado têm estados distintos. As explicações seguem o cálculo ativo: musculação válida com pelo menos 70% da ficha, limite de um ponto por dia, condições de acesso e desempate. Cardio isolado ainda não soma dias nessa regra. Nenhuma função de pontuação foi alterada nesta entrega.
- Alunos: título e busca acompanham a rolagem, sem cobrir os cartões. A navegação de seções permanece disponível e o painel continua sendo o único contêiner vertical.
- Gestão de aulas: um único título; fundo herdado do Staff e resumo de acesso em coluna própria no desktop.
- Loja: fundo herdado do Staff; catálogo vazio com cadastro manual e criação por IA. Filtros sem resultados e falha de carregamento têm mensagens específicas. O atalho de IA também ganhou texto.
- A pedido do usuário, as 91 receitas existentes foram removidas do catálogo de produção. Foram verificadas as referências e a ausência de favoritos; uma cópia de recuperação foi salva localmente, fora do repositório. Conferência posterior: zero receitas. Novas receitas são cadastradas pelas ações existentes, sem inserção automática de exemplos.

Validação: TypeScript, build Vite e 27 contratos visuais aprovados. Verificação em navegador de componentes reais com dados fictícios, nos tamanhos 320×568, 639×698 e 1280×800: ações manual/IA, estados do ranking, coluna de aulas sem sobreposição e rolagem até o último cartão. Datas verificadas na virada mensal/anual e em fevereiro bissexto. A geração de IA e o salvamento de novas receitas não foram disparados durante os testes.
