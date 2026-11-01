# Pedido na mesa (QR Code)

Parte do plano Scale. O cliente lê o QR da mesa, pede pelo celular, chama o garçom e pede a conta. O pedido cai na
mesma tela da cozinha dos pedidos do site e entra nos mesmos relatórios (modo "Mesa").

## Como ligar

1. No painel, loja › aba **Pedidos online** › **Pedido na mesa (QR)**: ligue, diga quantas mesas e **publique**.
   Precisa de "Receber pedidos pelo site" ligado.
2. Abra **QR Codes para imprimir** (`/loja/<loja>/mesas`), imprima em A4 e cole um em cada mesa.
3. O garçom abre a **tela do salão** no celular (`/loja/<loja>/salao`) com o login da loja e toca uma vez na tela
   para ligar o som.

## Como funciona

- **QR com chave:** cada QR leva a mesa e uma chave secreta daquela mesa (HMAC com o `SESSION_SECRET`). Sem a chave a
  página não abre, então ninguém chega numa mesa mudando o número no endereço. Trocar o `SESSION_SECRET` invalida
  todos os QR (é preciso imprimir de novo).
- **Abrir a mesa:** o primeiro celular abre a mesa e recebe um código de 4 números. Os outros da mesa entram com esse
  código. Errar o código 8 vezes em uma hora bloqueia aquele aparelho naquela mesa.
- **Garçom confirma o primeiro pedido:** o primeiro pedido de cada mesa fica "Aguardando o garçom" e não aparece na
  cozinha. O garçom vê no salão, confere se tem gente sentada e toca **Confirmar mesa**; daí em diante os pedidos da
  mesa vão direto para a cozinha. Se não tiver ninguém (foto do QR usada de fora), **Não tem ninguém** recusa o
  pedido e libera a mesa.
- **Chamar o garçom e pedir a conta:** aparecem no topo do salão e tocam um alerta até alguém atender.
- **Cozinha:** o pedido da mesa aparece como "Salão · Mesa N". "Pronto para levar à mesa" avisa o garçom no salão,
  que marca "Entreguei".
- **Fechar a conta:** o garçom escolhe como a mesa pagou (Pix, cartão ou dinheiro). Os pedidos ficam pagos com esse
  meio (é o que o relatório e as margens usam), o código deixa de valer e a mesa fica livre.

## Onde ficam os dados

- `mesas/<loja>/abertas.json`: as mesas abertas (código, se o garçom confirmou, chamadas, hash do token de cada
  celular). A mesa sai daqui quando a conta é fechada.
- Os pedidos ficam no mesmo lugar dos pedidos do site (`pedidos/<loja>/<dia>.json`), com `mode: 'mesa'` e
  `table: { number, session }`. Não têm nome nem telefone de cliente: não entram na lista de clientes nem nas campanhas.

## Mapa do salão, tempo nas mesas e reservas

- **Mapa ao vivo** (`/loja/<loja>/mapa`, login da loja): cada mesa livre, ocupada, esperando o garçom ou com a conta
  pedida, há quanto tempo está sentada e quantas pessoas. Tocar numa mesa livre → **Sentar clientes aqui** abre a mesa
  sem QR (já confirmada); o código da mesa continua valendo para os celulares.
- **Tempo nas mesas** (aba do mapa): tempo médio, mediana, mais rápida e mais longa, conta média (e por pessoa quando o
  garçom anotou), **quem pediu drink x quem não pediu**, por dia da semana, horário e mesa. Contas com menos de 5 min ou
  mais de 6 h ficam de fora (mesa esquecida aberta). Abaixo de 10 contas, aparece o aviso de que ainda varia muito.
  Vem de `mesas/<loja>/historico/<AAAA-MM>.json`, gravado quando a conta é fechada (sem dado de cliente). Só conta o
  que foi pedido pelo QR.
- **Bebidas:** Configurar → Pedido na mesa → "Quais categorias são bebida". Sem marcar, vale o nome da categoria.
- **Posição das mesas:** no mesmo lugar, quadro 12 × 8; sem configurar, as mesas ficam em fileiras de 6.
- **Movimento público** (`/movimento/<loja>`, sem login; JSON em `/api/public/lojas/<loja>/movimento`): nível
  (tranquilo, movimentado, cheio), mesas livres e o mapa só com livre/ocupada. Reserva que chega nos próximos 30 min
  conta como mesa ocupada. Dá para pôr um botão "Ver movimento" no site do restaurante.
- **Salão desenhado:** o mapa do dono, a página de movimento e o site do restaurante mostram o salão em perspectiva,
  com mesas, cadeiras e pessoinhas nas mesas ocupadas (`src/components/salao/SalaoDesenho.tsx`, SVG puro). No mapa,
  tocar numa mesa abre **Sentar clientes** ou **Liberar mesa** (sem pedidos pelo QR); o site muda em até ~15 s.
- **No site do restaurante:** `/movimento/<loja>/embed` é a única página do painel que pode ir dentro de outro site
  (iframe; `frame-ancestors *` só nela, ver `next.config.ts`). Ela avisa a altura para o site ajustar o quadro
  (`postMessage` tipo `growlift-movimento`). No El Patron: `elpatron/src/components/sections/MovimentoAoVivo.tsx`,
  que só aparece quando a loja tem mesas ligadas no painel.
- **Reservas** (`/reservar/<loja>`, sem login): o cliente escolhe dia, horário e pessoas, aceita as regras e paga o
  sinal pelo Pix (padrão: R$ 15 fixo por reserva, só para ninguém reservar à toa; dá para cobrar por pessoa; 0 = sem sinal). Página da reserva com o link secreto
  (`/reservar/<loja>/<id>?t=…`): Pix, confirmação e cancelamento.
  - Regras gravadas em cada reserva: cancelou até N horas antes → devolve; depois, ou não chegou até a tolerância →
    o sinal fica. O restaurante pode cancelar e sempre devolve.
  - No mapa: **Chegou** → tocar na mesa livre: a mesa abre com o sinal como crédito (o salão mostra "Falta pagar" ou
    "Devolver ao cliente"). **Não veio** só depois da tolerância. Fechar a conta conclui a reserva.
  - Capacidade: "reservas por horário" (quantas mesas ficam para reserva em cada horário). Reserva pelo site fecha
    1 hora antes do horário. Pix não pago expira em 30 minutos e libera o horário.
  - Arrependimento (CDC art. 49): até 7 dias depois de pagar o sinal, cancelar devolve tudo, enquanto o horário não
    chegou. Fora disso vale o prazo de horas. Na prática, o sinal só fica em "não veio" ou cancelamento tardio de
    reserva feita com mais de 7 dias de antecedência. Confirmar com advogado antes de mudar.
  - Só liga com **razão social, CNPJ (nunca CPF), endereço e contato de privacidade** preenchidos (aparecem no rodapé e
    no aviso de privacidade `/reservar/<loja>/privacidade`). Sinal até R$ 100 por pessoa; prazo de devolução até 24 h.
  - Com Pix em demonstração e sinal maior que zero, a página fica desligada numa loja de verdade (só funciona em loja
    de demonstração ou com `RESERVAS_PIX_DEMO=1` no ambiente local).
  - Pix pago depois de cancelar, depois de expirar ou com valor menor é devolvido sozinho. Ao cancelar, o Pix aberto
    é cancelado no Mercado Pago. Cancelar trava a reserva antes de devolver, então "Chegou" não acontece junto.
  - Cada reserva guarda o momento do aceite e as regras daquele momento (valor por pessoa, prazos, versão do texto).
  - Dados: `reservas/<loja>/<AAAA-MM-DD>.json`. Nome, telefone e e-mail são apagados depois dos meses configurados
    (padrão 6); fica só o registro do valor. O restaurante é o controlador; a Growlift, operadora.
  - Limites: 5 reservas por aparelho (rede IPv6 /64) por dia e 80 por loja por dia.

## Fila de espera, pagar na mesa e PDV (01/11/2026)

Os três ficam desligados por padrão. A equipe liga em Configurar → Pedido na mesa (com mesas ligadas).
Os três só funcionam com os **dados do restaurante preenchidos** (razão social, CNPJ, endereço e contato de
privacidade, na parte de Reservas), porque o aviso de privacidade `/privacidade/<loja>` precisa deles.

- **Fila de espera** (`/fila/<loja>`, sem login): o cliente lê o QR da porta (cartaz para imprimir em
  `/loja/<loja>/fila`), deixa nome, número de pessoas e, se quiser, telefone. A página fica aberta mostrando a posição e
  vibra/toca quando a recepção chama. No mapa (`/loja/<loja>/mapa`), seção Fila: Chamar, Desfazer chamada, Sentou
  (escolhe a mesa e ela já abre), Não veio, "Chegou sem o QR" e "Avisar no WhatsApp" (abre o WhatsApp da pessoa da
  equipe com o texto pronto; nada é enviado sozinho). O movimento público mostra "Entrar na fila · N na frente".
  - Dados: `fila/<loja>/<AAAA-MM-DD>.json`: fica só a lista de hoje e de ontem (até 2 dias). O telefone é apagado
    assim que a pessoa sai da fila (sentou, saiu ou não veio). Link do cliente com token (só o SHA-256 fica
    salvo). Limite: 4 entradas por aparelho (rede IPv6 /64) por dia e o tamanho máximo da fila configurado.
- **Pagar na mesa pelo Pix:** na aba Conta do celular, "Pagar pelo Pix": conta inteira ou dividida (1 a 20 pessoas).
  A parte é sempre da conta inteira (menos o sinal da reserva): com 3 pessoas cada uma paga um terço, e a última paga
  só o que falta. O valor é calculado no servidor. Quando nada falta, a mesa fecha sozinha ("pago pelo Pix na mesa") e
  a reserva é concluída. Pix pago a mais (conta já paga), a menos ou de mesa já fechada é devolvido sozinho.
  - Só depois do garçom confirmar a mesa. Com Mercado Pago, pede e-mail (exigência deles). No máximo 8 Pix abertos e
    20 tentativas por hora em cada mesa. Índice para devoluções: `mesas/<loja>/pix-da-mesa.json` (2 dias).
  - O salão mostra "Pago pelo Pix na mesa" e "Falta pagar".
  - Precisa do Pix real (Mercado Pago). Com Pix em demonstração o botão some numa loja de verdade (o cliente poderia
    "pagar" sem pagar); só aparece em loja de demonstração ou com `RESERVAS_PIX_DEMO=1` no ambiente local.
  - Dois celulares pagando juntos: a decisão é tomada na gravação, com a conta daquele momento. Só o que falta conta;
    o que passar volta (devolução parcial no Mercado Pago). O celular que pagou vê quanto voltou. Se o Mercado Pago
    recusar a devolução, aparece "Devolver no caixa" no mapa para a equipe devolver e marcar "Já devolvi".
  - Taxa de serviço, couvert e gorjeta precisam ser itens da conta: o Pix cobra só o total da mesa.
- **PDV Saipos:** pedido aceito pela loja vai para o Saipos do restaurante (mesa, retirada ou entrega; nunca CPF).
  Precisa de: (1) parceria da Growlift com o Saipos, que dá `SAIPOS_PARTNER_ID` e `SAIPOS_SECRET`, colocados só nas
  variáveis de ambiente da Vercel; (2) o código da loja no Saipos (`cod_store`) e, de preferência, os códigos dos itens
  ("id-do-item = código"; adicional: "id-do-item:Nome = código"); (3) cidade e UF para entregas.
  - O envio roda depois da resposta do "Aceitar" (não trava a tela da loja).
  - Antes de ligar numa loja: confirmar com o Saipos que a autorização é por loja e que o código é daquele
    restaurante, e citar o envio ao PDV no contrato com o restaurante.
  - Cada envio fica em `pdv/<loja>/envios.json` (últimos 300). No editor da equipe aparecem os últimos envios com
    "Reenviar" para os que falharam. Opcional: `SAIPOS_API_URL` para o ambiente de testes do Saipos.

## Ainda não feito

- Pagar com cartão pelo celular na mesa.
- Apagar sozinho os dados das reservas antigas.
- Devolver só a diferença do sinal pelo Pix (hoje o garçom devolve no caixa).
- Quiz entre as mesas.
- Cupom em pedido da mesa.
