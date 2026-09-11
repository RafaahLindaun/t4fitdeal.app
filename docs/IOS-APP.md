# ACCQUA Sports no iPhone

Há duas formas de instalar o ACCQUA Sports no iPhone:

## Instalação imediata pelo Safari

1. Abra `https://fitdeal.vercel.app` no Safari.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início** e confirme **Adicionar**.

Essa instalação usa a mesma produção do app, recebe as atualizações web automaticamente, mostra o ícone ACCQUA e mantém os fluxos de login, treino, aulas, perfil, ranking, loja e área Staff. É a opção que funciona sem Mac, Xcode ou conta Apple Developer.

## App iOS nativo

O workflow `.github/workflows/ios-app.yml` cria o wrapper Capacitor com o identificador `com.accqua.sports` e aplica o ícone ACCQUA em todos os tamanhos do iPhone. Ele sempre valida o frontend antes de montar o projeto iOS.

Para gerar um IPA instalável em um iPhone físico, o repositório precisa ter uma conta Apple Developer e estes segredos no GitHub:

- `IOS_CERTIFICATE_BASE64`: certificado de distribuição ou desenvolvimento exportado como `.p12` e convertido para Base64.
- `IOS_CERTIFICATE_PASSWORD`: senha do `.p12`.
- `IOS_KEYCHAIN_PASSWORD`: senha temporária do keychain do runner (opcional; o workflow usa uma temporária se omitido).
- `IOS_PROVISIONING_PROFILE_BASE64`: perfil Ad Hoc ou Development do bundle `com.accqua.sports`, em Base64.
- `IOS_TEAM_ID`: identificador de 10 caracteres da equipe Apple.
- `IOS_PROVISIONING_PROFILE_NAME`: nome exato do perfil.

Com esses segredos, o workflow publica `accqua-sports-ios-<commit>.ipa` como artefato. Um perfil Ad Hoc precisa incluir o UDID de cada iPhone que será instalado. Para distribuição pública, o IPA deve ser enviado ao TestFlight/App Store Connect com o certificado e o perfil apropriados.

Sem os segredos, o workflow gera apenas um app de simulador para QA. Ele não instala em um iPhone físico, porque a Apple exige assinatura e provisionamento.

O app nativo carrega `https://fitdeal.vercel.app` em HTTPS, portanto os dados e integrações continuam no backend atual sem expor chaves no projeto iOS. Notificações push dependem da permissão do iPhone; no Safari, elas exigem que o app esteja adicionado à Tela de Início.
