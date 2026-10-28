# Growlift Intelligence (fase 1: analytics sem IA)

Aba **Inteligência** do painel (`/painel/inteligencia`). Só a equipe da Growlift acessa.

## O que já funciona

- **Resumo do período** (30, 60 ou 90 dias) comparado ao período anterior do mesmo tamanho: faturamento, pedidos,
  ticket médio e margem de contribuição. A comparação só é marcada como confiável com 30+ pedidos em cada período.
- **Custos** (`/painel/inteligencia/<loja>/custos`): insumos, ficha técnica ou custo direto por item, embalagem e
  taxa de Pix, cartão e dinheiro (com a caixinha "a loja confirmou").
- **Matriz do cardápio** por categoria (método Kasavana & Smith): Estrela, Cavalo de batalha, Quebra-cabeça e Abacaxi.
- **Itens vendidos**: quantidade, venda, preço médio, custo, margem por unidade e %.
- **Recomendações para testar**: geradas por regras fixas, cada uma com a evidência em números, o teste sugerido e
  como medir. A equipe registra a decisão (Dono aprovou, Em teste, Concluída, Descartar) com uma observação.
- **Ritmo**: pedidos por dia da semana e por horário.
- **Demonstração**: loja "Hamburgueria Exemplo (dados fictícios)", slug `demo-inteligencia`, com 120 dias de pedidos
  e custos gerados pelo painel (semente fixa). É só rascunho: não é publicada e a API pública não a serve.

## Regras das contas (em `src/lib/inteligencia/analise.ts`)

- Venda = pedido aceito pela loja (preparo, saiu, pronto, concluído) e não devolvido.
- Margem de contribuição = venda do item (desconto do cupom rateado entre os itens) − taxa do meio de pagamento −
  custo de insumos e embalagem. **Não é lucro**: aluguel, equipe, entrega e impostos não entram.
- Tudo em centavos inteiros, calculado no servidor. Nenhum número vem de IA.
- Item sem custo continua nas vendas, mas fica fora das margens e da matriz.
- Adicionais (opções pagas) entram no preço do item, mas o custo deles ainda não é considerado.
- A análise usa só pedidos que chegam pelo painel (site da loja). iFood, balcão e telefone não aparecem.

## Onde ficam os dados

- `inteligencia/<slug>/custos.json`: ficha de custos.
- `inteligencia/<slug>/decisoes.json`: decisão sobre cada recomendação (id estável = regra + produto).

## Próximas fases (não feitas)

1. Tela do dono do restaurante (hoje só a equipe vê) e relatório mensal em PDF.
2. Custos dos adicionais e importação de vendas de outros canais (com autorização).
3. IA consultiva: explicar os números já calculados e responder perguntas, com limite de custo e sem inventar dados.
4. Central interna: tarefas, reuniões e horas por cliente para o acompanhamento do Scale.

O plano Scale (R$ 897) continua **proposta**: não anunciar antes de testar com restaurantes-piloto.
