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
- **Pedidos e delivery:** todos os pedidos de um dia (até 90 dias atrás), filtro por canal (entrega, retirada, mesa) e situação, detalhe de cada pedido (itens, pagamento, endereço, andamento) e o resumo do dia com o mesmo cálculo do relatório (`salesReport`). Mostra como o delivery está configurado; mudar continua com a equipe. Código: `dono/pedidos`, `src/lib/historico.ts`.
- **Equipe:** o dono cria, troca entre cozinha e garçom, gera nova senha e remove os logins **de cozinha e garçom** da própria loja. Login de dono, login antigo sem função e cadastro pendente só a equipe mexe. Máximo de 30 logins por loja e 30 mudanças por hora. A senha aparece uma vez. Código: `dono/equipe`, `donoAdicionaLogin` e cia. em `src/lib/operators.ts`; testes em `test/equipe-dono.test.ts`.
- **Clientes e avaliações:** a antiga tela de clientes e campanhas (a rota `/loja/<slug>/clientes` redireciona para cá) e o bloco de avaliações do Google (se o link está ligado e como responder).
- **Em breve:** promoção com data; demonstração no MacBook.

Código: `src/app/loja/[slug]/dono/`, `src/lib/dono.ts`, `src/lib/dono-resumo.ts`, `src/components/dono/`. Testes: `test/dono.test.ts` e os de função em `test/orders.test.ts`.

## Cadastro de restaurante novo

Na tela de entrar: **Sou restaurante › Sou novo**. O dono informa nome do restaurante, logo (opcional), o próprio nome, WhatsApp e e-mail, e cria a senha.

- O login nasce `pendente`: só abre `/cadastro/aguardando` até a equipe decidir (`canUse` nega tudo; `homeOf` manda para a espera). O `pendente` é lido do armazenamento a cada acesso.
- A equipe decide em **Painel › Cadastros** (aviso na tela Lojas quando há pedido). Fale com o dono pelo WhatsApp antes.
  - **Aprovar:** cria a loja em rascunho (nada publicado) com a logo em `extra.logo`, tira o `pendente` e põe o dono em Acesso da loja.
  - **Recusar:** apaga cadastro, login e logo. O mesmo e-mail pode se cadastrar de novo.
- Proteções: 3 cadastros por hora por endereço de internet, 30 por dia no painel (só contam os que passam na validação), campo isca, logo só JPG/PNG/WebP de até 2 MB conferida pelos primeiros bytes, mensagem igual para e-mail já usado.
- Aviso de privacidade em `/cadastro/privacidade` (versão em `AVISO_CADASTRO`, guardada no cadastro). Pedido para apagar conta aprovada: hoje é manual, em até 15 dias (remover o login em Acesso da loja e apagar `cadastros/<slug>.json`).
- Código: `src/lib/cadastros.ts`, `src/app/login/`, `src/app/cadastro/`, `src/app/painel/cadastros/`. Testes: `test/cadastros.test.ts`.
