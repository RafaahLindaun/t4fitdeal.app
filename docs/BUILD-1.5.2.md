# ACCQUA Sports — Build 1.5.2

## Objetivo

Adicionar pagamento Pix real na Loja usando Woovi/OpenPix sem expor credenciais no bundle React e sem substituir o fluxo existente de reserva para pagamento na recepção.

## Arquitetura adotada

O projeto ACCQUA é React + Vite + Supabase. Por isso, as rotas server-side sugeridas como `app/api/...` foram adaptadas para Supabase Edge Functions:

- `create-woovi-charge` — autenticada por JWT do aluno; lê o preço do produto no banco, segura o estoque e cria a cobrança na Woovi.
- `woovi-webhook` — pública para receber chamadas externas, porém só processa eventos depois de validar a assinatura criptográfica da Woovi.

Nenhum segredo usa prefixo `VITE_` e nenhum segredo existe sob `scr/`.

## Banco e estoque

Migration: `20260901035500_build_1_5_2_woovi_pix_payments.sql`.

A tabela `pagamentos` guarda cobrança, correlação, QR, status, valor e timestamps. O cliente autenticado recebe apenas `SELECT` das próprias cobranças via RLS. Escrita e transição de status ficam restritas ao `service_role`.

Ao iniciar um Pix, o servidor cria primeiro uma `reserva` real. A trigger canônica de reservas já existente segura uma unidade de estoque atomicamente. Se a criação na Woovi falhar, ou a cobrança expirar/cancelar, a reserva é cancelada e a unidade volta ao estoque. Se o Pix for pago, a reserva continua ativa para retirada — não há segundo decremento de estoque.

Uma proteção adicional impede cancelar pelo fluxo comum uma reserva ligada a Pix `pendente` ou `pago`, evitando liberar uma unidade que ainda está em cobrança ou já foi paga.

## API Woovi

A criação usa `POST https://api.woovi.com/api/v1/charge`, `Authorization: WOOVI_APP_ID`, valor em centavos e `expiresIn: 300`.

O preço nunca vem do client: a Edge Function recebe apenas o `productId`, e o RPC retorna o `preco_pix` atual do banco.

## Segurança do webhook

A validação principal usa o mecanismo atualmente recomendado pela Woovi:

- lê o corpo bruto antes de `JSON.parse`;
- recebe `x-webhook-signature` em Base64;
- busca as chaves públicas em `https://api.woovi.com/api/v1/webhook/public-keys`;
- mantém cache por 1 hora e aceita qualquer chave publicada para suportar rotação;
- verifica RSA-SHA256 antes de acessar o banco.

`WOOVI_WEBHOOK_SECRET` é suportado como segunda camada opcional: quando configurado, também exige `x-openpix-signature` e valida HMAC-SHA1. Esse mecanismo é legado/depreciado pela Woovi e não substitui a assinatura RSA.

Eventos tratados:

- `OPENPIX:CHARGE_COMPLETED`
- `OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER`
- `OPENPIX:CHARGE_EXPIRED`

## Experiência do aluno

O detalhe do produto mantém `Reservar / Retire na recepção` e, para produtos com compra habilitada, adiciona `Pagar agora / Retirada garantida`.

O aviso `NOVIDADE`:

- pisca com Framer Motion;
- fica estático com `prefers-reduced-motion`;
- pode ser dispensado pelo aluno;
- expira automaticamente em 1º de outubro de 2026.

A tela Pix possui:

- QR Code retornado pela Woovi;
- contador derivado do `expiresDate` real;
- anel SVG de 300 s, amarelo e vermelho nos últimos 30 s;
- Pix copia-e-cola em um toque, com `✓ Copiado!` por 2 s;
- Supabase Realtime filtrado por `correlation_id`;
- estado de QR expirado com geração de nova cobrança;
- sucesso com o mesmo `CompletionCheckmark` do Treino e o mesmo padrão de `canvas-confetti`.

O cliente não possui `UPDATE`/`INSERT` em `pagamentos` e não consegue marcar `status='pago'`. Essa transição só ocorre no RPC liberado ao `service_role`, chamado pelo webhook validado.

## Secrets e ativação externa

Secrets server-side necessários:

- `WOOVI_APP_ID` — obrigatório para criar cobranças.
- `WOOVI_WEBHOOK_SECRET` — opcional, somente se a configuração do webhook também usar o HMAC legado como segunda camada.

Webhook de produção:

`https://cblokyqoauftejjcqjlt.supabase.co/functions/v1/woovi-webhook`

Antes do teste financeiro real, configurar o AppID no ambiente de Edge Functions e cadastrar o webhook no painel Woovi.

## Validação

- Migration aplicada no projeto Supabase de produção.
- `pagamentos` com RLS habilitado, Replica Identity FULL e publicação Realtime.
- `authenticated`: somente `SELECT`.
- RPCs de criação/finalização/cancelamento/expiração/conclusão: `service_role` only.
- Edge Function `create-woovi-charge`: `verify_jwt=true`.
- Edge Function `woovi-webhook`: `verify_jwt=false` intencionalmente, com autenticação criptográfica própria.
- `scripts/verify-visual-contracts-1.5.2.mjs` encadeia contratos anteriores e bloqueia regressões de segredo no client, estoque, webhook, Realtime e UI.

## Teste financeiro final

O teste `gerar QR → pagar valor real baixo → webhook → Realtime → sucesso → saldo na conta conectada` depende do AppID da conta Woovi/Nubank e de uma cobrança real. Ele não deve ser simulado nem marcado como concluído sem essas credenciais e sem movimentação financeira efetiva.
