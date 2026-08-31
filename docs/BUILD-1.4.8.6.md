# ACCQUA Sports — Build 1.4.8.6

## D — Desktop e Mobile: Montar Treino

Esta build reduz a densidade informacional do montador sem alterar a persistência, os handlers ou o data layer existentes.

### Progressive disclosure

- Apenas a etapa principal ativa fica visível no workspace: Programa, Dias, Exercícios ou Cardio.
- O stepper superior foi compactado; etapas concluídas continuam identificadas sem ocupar grandes cards permanentes.
- O estado ativo do montador reaproveita o `mobileStep` canônico já existente.

### Preparação do programa

- O checklist de preparação começa recolhido por padrão.
- O professor continua vendo porcentagem e estado geral em uma linha compacta.
- A lista detalhada só aparece ao tocar/clicar na preparação.

### Exercícios

- Biblioteca, busca e grupos musculares ficam concentrados na etapa Exercícios.
- No mobile, a biblioteca continua em drawer para não empilhar outro bloco na tela.
- Contagens da biblioteca foram rebaixadas para informação secundária.
- Ao trocar entre rotinas A/B/C durante a escolha de exercícios, o professor permanece na etapa Exercícios.

### Mobile

- Cada etapa ocupa o fluxo principal individualmente.
- Há navegação Voltar / Próximo independente dos botões de publicação.
- Elementos que não pertencem à etapa atual deixam de competir por espaço.

### Salvamento

- Salvar modelo e Salvar treino do aluno continuam em footer fixo, sempre acessível.
- O conteúdo ganha espaço inferior suficiente para não ser escondido pelo footer.

## Critérios de aceite

- O professor vê no máximo poucos blocos principais simultaneamente.
- Programa, Dias, Exercícios e Cardio não ficam mais empilhados no mobile.
- O checklist não abre automaticamente.
- A biblioteca aparece apenas quando necessária.
- Ações de salvar permanecem acessíveis sem rolar até o final.
- A troca de rotina durante seleção de exercícios não interrompe o contexto da etapa.
