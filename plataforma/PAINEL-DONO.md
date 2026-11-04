# Painel do dono e logins por função

## Logins da loja

Cada login da loja tem uma função, escolhida pela equipe em Lojas › (loja) › Pedidos online › Acesso da loja:

| Função | Entra em | Pode abrir |
| --- | --- | --- |
| Dono | `/loja/<slug>/dono` | tudo da loja: painel do dono, pedidos, salão, mapa, fila, QR das mesas, cardápio, relatório, clientes |
| Cozinha | `/loja/<slug>` | pedidos, abrir/fechar a loja, esgotados |
| Garçom | `/loja/<slug>/salao` | salão, mapa e reservas, fila, QR das mesas, marcar pedido entregue |

- Logins criados antes das funções valem como **Dono**.
- Trocar a função vale na próxima tela, sem nova senha: a função é lida do login a cada acesso (`operatorActive` em `src/lib/operators.ts`), não do cookie.
- Quem abre uma tela que não é da sua função volta para a sua tela inicial (`homeOf` em `src/lib/session.ts`). As Server Actions e as rotas `/api/loja/<slug>/*` checam a mesma regra (`requireStoreAccess`/`storeAccess` com DONO, COZINHA, SALAO ou TODOS em `src/lib/auth.ts`).
- A equipe da Growlift abre tudo, de todas as lojas.

## Painel do dono (`/loja/<slug>/dono`)

Feito para computador (barra escura à esquerda); no celular a barra vira uma faixa em cima.

- **Resumo geral:** vendas e pedidos de hoje contra o mesmo dia da semana passada, vendas e ticket médio dos últimos 7 dias contra os 7 anteriores, horários de pico (30 dias), mais e menos pedidos da semana, avisos (mesas chamando, margem baixa ou itens sem custo, esgotados). Usa os resumos diários da Inteligência (`summariesForDays`), sem dado pessoal de cliente.
- **Preços e custos:** muda nome e preço (vale na hora no cardápio publicado, como a tela Cardápio), esgota/volta o item e o dono escreve quanto gasta para fazer cada item. Mostra a sobra por venda e a margem (antes de taxas e impostos); abaixo de 30% aparece como margem baixa. Item com ficha técnica montada pela equipe mostra o custo da ficha e não pode ser mudado pelo dono.
- **Mesas:** mesas ao vivo (atualiza a cada 8 s) e chamados de garçom/conta com "Já atendido". Fechar conta e confirmar mesa continuam na tela do salão.
- **Em breve (etapas 2 e 3):** Pedidos e delivery, Equipe, Clientes e avaliações; promoção com data; demonstração no MacBook.

Código: `src/app/loja/[slug]/dono/`, `src/lib/dono.ts`, `src/lib/dono-resumo.ts`, `src/components/dono/`. Testes: `test/dono.test.ts` e os de função em `test/orders.test.ts`.
