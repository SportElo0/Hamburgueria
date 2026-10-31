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

## Ainda não feito

- Pagar a conta pelo celular (Pix ou cartão na mesa) e dividir a conta.
- Quiz entre as mesas.
- Cupom em pedido da mesa.
