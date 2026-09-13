# Rolagem sobre os cartões de alunos — 13/09/2026

A alteração anterior de cabeçalhos não resolveu a rolagem com o mouse sobre os alunos. A camada `build-1.5.5.css` ainda aplicava `overflow-y: auto` e `overscroll-behavior-y: contain` ao elemento `.admin-area-list.admin-dashboard-roster`. Mesmo com altura suficiente para todos os cartões, a lista criava uma barreira que impedia a rolagem de chegar a `.accqua-staff-content`.

Removida a lista dessa regra. A lista acompanha o fluxo da página, e a rolagem vertical continua no painel Staff. O comportamento dos painéis de recursos e das janelas de edição permanece definido em seus próprios estilos.

Regressão reproduzida em produção e no teste automatizado antes da nova compilação: roda do mouse sobre o avatar não alterava a posição do painel. A inspeção do navegador mostrou a regra acima aplicada à lista; o console não apresentava erros.

Após `npm run build`, `npm run test:staff-scroll` testa os estilos compilados com classes e estrutura da lista de produção e dados fictícios. Tamanhos: 375×812, 639×698, 1024×768, 1280×800 e 1920×1080. Em cada tamanho, verifica rolagem para baixo e para cima sobre avatar, nome, status, identificação, professor, treino, seta, borda do cartão e espaço entre linhas; também verifica movimentos repetidos, acesso ao último aluno e retorno ao início. O documento e a lista interna não devem roubar a rolagem do painel Staff. Testes aprovados nas cinco dimensões, além do build e dos 27 contratos visuais.

Para repetir: `npm run build && npm run test:staff-scroll`. O teste usa Chromium; no Windows, usa o Edge instalado. `BROWSER_CHANNEL` permite selecionar outro canal instalado. A verificação é de roda do mouse em tamanhos responsivos, não de hardware móvel físico.
