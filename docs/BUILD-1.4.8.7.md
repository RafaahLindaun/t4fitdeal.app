# ACCQUA Sports — Build 1.4.8.7

## Escopo
Correções visuais finais do checklist pós-1.4.8.6, sem reaplicar itens que já estavam implementados nas builds anteriores.

## J — Bottom navigation mobile
- identificado o motivo da faixa reta: as telas fullscreen terminavam em `bottom: var(--app-bottomnav-offset)`, expondo uma área retangular do AppShell atrás da pílula;
- o wrapper da navegação agora é estritamente transparente e seus pseudo-elementos de fundo foram removidos;
- as telas visuais passam até o fim da viewport, por trás da pílula;
- apenas as áreas de conteúdo rolável reservam espaço inferior para que o último conteúdo continue acessível;
- a pílula mantém raio de 28px e safe-area do iOS.

## H1 — Header Minha dieta
- criado componente reutilizável `IconButton`;
- touch target 44x44px, ícone 20x20px e centralização real;
- superfície glass sutil e borda consistente;
- ações do lado direito usam `gap: 12px`;
- removido o spacer artificial entre ações quando o cronograma não está disponível;
- título continua responsivo e trunca com segurança em telas estreitas.

## I + C1 — Header do perfil do aluno
- header individual usa duas colunas reais: voltar + contexto;
- não reserva mais uma terceira coluna para o badge de pendências, que já não é renderizado no perfil individual;
- no mobile, a superfície tem largura 100%, `border-radius: 16px` uniforme, sem `clip-path`/overflow que possa recortar um canto;
- apenas uma superfície visual compõe o cabeçalho.

## Itens do checklist já presentes antes desta build
- A1/A2/A3: Build 1.4.8.1;
- B1: Build 1.4.8.2;
- C2/C3: Build 1.4.8.3;
- E1/E2: Build 1.4.8.4;
- F1: Build 1.4.8.5;
- D1: Build 1.4.8.6.

## Validação
A branch deve passar o pipeline ACCQUA CI: fixture/migração SQL, `npm ci`, TypeScript e build Vite de produção antes do merge.
