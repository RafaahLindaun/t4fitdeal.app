# APK Android — ACCQUA Sports

O projeto web continua sendo a fonte principal do app. O APK é um wrapper Capacitor com `com.accqua.sports` que abre `https://fitdeal.vercel.app` em uma WebView segura (`cleartext: false`). Isso evita colocar a chave pública do Supabase no GitHub Actions e mantém atualizações do frontend disponíveis sem reinstalar o APK.

## Gerar

O workflow `.github/workflows/android-apk.yml` instala Node 24, Java 21 e Capacitor 7 em um runner Linux, executa contratos visuais, TypeScript e build Vite, cria o projeto Android e publica o APK debug como artefato por 14 dias.

Depois do push, abra a aba **Actions**, selecione **ACCQUA Sports Android APK**, abra a execução concluída e baixe o artefato `accqua-sports-android-<commit>`. O arquivo `accqua-sports-<commit>.apk` pode ser instalado para homologação em aparelhos Android com instalação de fontes desconhecidas autorizada pelo próprio usuário.

## Limites atuais

- É um APK de homologação (`debug`), não uma versão assinada para Play Store.
- O conteúdo depende de internet e usa a produção. A versão offline/bundled exige um APK separado com as variáveis públicas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` fornecidas por um segredo do CI.
- Web Push e recursos específicos de PWA precisam de teste em aparelho Android real; o APK não deve ser considerado certificado para publicação antes dessa homologação.
- O binário só deve ser instalado se a execução do workflow estiver verde e o SHA corresponder ao código revisado.
