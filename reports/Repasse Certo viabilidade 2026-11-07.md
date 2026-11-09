# Repasse Certo: é viável? (pesquisa de 07/11/2026)

Pergunta: dá para vender um sistema que confere o repasse do iFood e ajuda o restaurante a recuperar o que foi
descontado errado, cobrando uma parte do recuperado?

## Resposta curta

- **Dá para construir:** o iFood entrega os dados, por planilha e por API oficial, e o restaurante autoriza sem
  passar a senha.
- **Não é verdade que ninguém faz:** a pesquisa de 06/11 errou nisso. Já existem conferência automática de
  repasse do iFood (Koncili; Linx Degust One) e auditoria como serviço (Lumanet).
- **O dinheiro a recuperar pode ser pouco:**
  - Contestar cancelamento só vale por 7 dias e só em alguns casos.
  - A política nova do iFood (atualizada em 16/09/2026) já reduz os cancelamentos sem motivo.
  - Até um concorrente diz que o repasse costuma vir certo.
  - Ninguém publica quanto um restaurante perde por mês.

**Recomendação:** não construir como produto sozinho agora. Fazer um teste barato com planilhas reais. Se der
pouco dinheiro, a conferência vira um recurso dentro do pacote de restaurante, com o relatório "quanto o
iFood levou este mês". Esse relatório ajuda a vender o pedido próprio.

## 1. Dados: dá para pegar sem senha?

Sim, de dois jeitos.

**Planilha do Portal do Parceiro**
- **Onde:** em Financeiro, botão "Exportar", sai a lista de pedidos do mês ([FAQ Financeiro iFood](https://blog-parceiros.ifood.com.br/wp-content/uploads/2023/05/faq-financeiro.pdf)).
- **Taxas cobradas:** cada repasse tem o detalhe em "Taxas e comissões".
- **Relatório de conciliação:** detalha cada lançamento: venda, desconto, promoção, cancelamento, reembolso
  ([iFood](https://blog-parceiros.ifood.com.br/conciliacao-financeira/)).
- **Limite:** não confirmei o nome exato das colunas. Precisa de uma planilha real.

**API oficial (módulo financeiro)**
- **O que tem:** conciliação num arquivo só (CSV compactado, separado por ";"), repasses (settlements),
  eventos financeiros e ajustes de venda (salesAdjustments). Os ajustes incluem item cancelado depois da
  entrega, cobrança de saldo pendente, contestação aceita e ajuste por falha do sistema
  ([iFood Developer](https://developer.ifood.com.br/en-US/docs/guides/financial/v3),
  [v2](https://developer.ifood.com.br/en-US/docs/guides/financial/v2)).
- **Como o restaurante autoriza:** no Portal do Parceiro, em Serviços > Aplicativos, com login de dono (Gestor).
  Não há senha envolvida ([Alterdata](https://ajuda.alterdata.com.br/spice/funcoes-administrativas-spice/configuracoes-do-spice/provedores-de-integracao)).
- **O que o iFood exige** ([homologação](https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/homologation)):
  - conta com **CNPJ** (cadastro com CPF é recusado);
  - aplicativo **já pronto**;
  - formulário respondido com dados do ambiente de teste;
  - reunião em que eles avaliam também como a informação é mostrada à loja.

**Conclusão:** começar pela planilha. A API só depois de o teste dar certo e de a Growlift ter CNPJ.

## 2. Quem já faz

| Quem | O que faz | Para quem |
|---|---|---|
| **Koncili** | Diz ter integração nativa com o iFood. Confere cada linha do repasse (mais de 2.000 tipos de lançamento) e avisa de divergência sozinho. Preço não publicado ([Koncili](https://www.koncili.com/blog/repasse-ifood-como-funciona/), [página](https://materiais.koncili.com/conciliacao-repasse-ifood)) | O formulário só oferece supermercado, farmácia e pet shop. Não cita restaurante |
| **Linx Degust One** (com Equals) | Concilia pagamentos do iFood e aponta divergência de valor e taxa ([manual Linx](https://share.linx.com.br/pages/viewpage.action?pageId=343445095), antigo) | Redes de restaurante com sistema Linx |
| **Lumanet** | Auditoria do iFood como serviço, sob orçamento ([Lumanet](https://www.lumanet.com.br/servico-auditoria-ifood)) | Restaurantes |
| **Advogados** | Pedem 5 anos de histórico ao iFood pela LGPD e entram com ação ([Urbano Ribeiro](https://urbanoribeiroadvogados.com.br/taxas-abusivas-ifood-restaurante-contestar/)) | Restaurantes |

**O espaço que sobra:**
- conferência simples e barata para o restaurante pequeno, com aviso no WhatsApp e texto pronto;
- cobrança por resultado.

Não achei ninguém fazendo exatamente isso, mas o espaço é menor do que parecia em 06/11.

## 3. Onde estaria o dinheiro

| Tipo | Dá para recuperar? | Observação |
|---|---|---|
| **Cancelamento que a loja pode contestar** | Sim, mas **só até 7 dias** depois do cancelamento e só em alguns casos | Casos: loja recusou o acordo, problema no endereço do cliente, entregador alegou loja fechada, pedido duplicado. Prova só vale se estiver no chat do iFood. O iFood analisa em até 72 h ([iFood](https://blog-parceiros.ifood.com.br/contestacao-cancelamento/)) |
| **Comissão acima do contrato** | Sim, por chamado ("Divergência no valor recebido") | Regra clara: a comissão incide sobre o valor bruto, incluindo a taxa de entrega ([FAQ](https://blog-parceiros.ifood.com.br/wp-content/uploads/2023/05/faq-financeiro.pdf)). Valores citados: 12% no Básico e 23% no Entrega, mais 3,2% de pagamento online. Uma página do próprio iFood diz 3,5% ([Jefe](https://www.chejefe.com/pt-br/blog/comissao-ifood-restaurantes-2026)) |
| **Mensalidade cobrada errada** | Sim | É cobrada uma vez, no dia em que a loja passa do faturamento do contrato |
| **Promoção cobrada da loja sem ela ter aderido** | Sim, por chamado | Precisa cruzar com as campanhas que a loja aceitou |
| **Repasse "Retido"** | Não é erro do iFood | Normalmente é o banco segurando por causa de empréstimo |
| **Cobranças antigas (até 5 anos)** | Só com advogado | A Growlift monta o dossiê e um advogado parceiro entra com o pedido |

**Os dois pontos que mudam o produto:**

1. **Conferir uma vez por mês não serve para cancelamento.** Com 7 dias de prazo, a conferência precisa ser
   pelo menos semanal. O ideal é diária, pela API. Se o dono só mandar a planilha no fim do mês, o prazo já
   passou.
2. **A política nova reduz a perda.**
   - Depois que a loja aceita o pedido e começa o preparo, o cliente não cancela sozinho.
   - Reclamação de tamanho, cheiro, sabor ou temperatura não dá mais reembolso.
   - Fonte: [iFood, atualizado em 16/09/2026](https://blog-parceiros.ifood.com.br/politica-cancelamento-pedidos/).

**Quanto dinheiro aparece?** Ninguém publica.
- Um concorrente (Koncili) diz que o repasse "costuma estar correto na grande maioria dos casos". O problema
  seria só a falta de tempo para conferir.
- O exemplo do escritório de advocacia (R$ 2 a mais por pedido, 300 pedidos por mês) é hipotético.
- Só a planilha de restaurantes reais responde.

## 4. Conta do negócio (hipótese)

| Recuperado por mês | Growlift recebe (25% + R$ 97) |
|---|---|
| R$ 100 | R$ 122 |
| R$ 300 | R$ 172 |
| R$ 1.000 | R$ 347 |

Se aparecer pouco, os R$ 97 viram o preço de "conferência e relatório". Aí o produto compete com o próprio
Portal do iFood, que já mostra tudo, e fica difícil vender sozinho.

## 5. Cuidados

- **Senha:** nunca pedir a senha do iFood; usar exportação ou autorização oficial (regra da casa).
- **Dados pessoais:** a planilha pode ter nome do cliente final; um concorrente busca pedidos por nome do
  cliente.
  - A leitura descarta essas colunas e guarda só número do pedido, data e valores.
  - CPF nunca é salvo.
  - Passar pelo `revisor-seguranca` antes de guardar extratos.
- **Contestação:** quem clica e envia é o dono, no Portal. A Growlift só aponta o pedido e deixa o texto
  pronto. O texto passa pelo `revisor-legal`.
- **Advogado:** recuperar valores antigos na Justiça é trabalho de advogado. A Growlift só prepara os números.
- **Promessa:** nada de "recupere R$ X". Mostrar o que foi achado.

## 6. Plano de teste (custa quase zero)

1. **Pedir as planilhas:** 3 restaurantes que vendem no iFood exportam pedidos, repasses e "Taxas e
   comissões" dos últimos 3 meses, sem passar senha. Pode ser The Burguest, Downtown ou El Patron, se usarem
   iFood.
2. **Ler as planilhas:** escrevo um leitor que descarta os dados de cliente e confere:
   - comissão e taxa contra o contrato;
   - mensalidade;
   - promoções;
   - cancelamentos que estariam dentro dos casos contestáveis.
3. **Medir dois números por restaurante:**
   - quanto estava errado e ainda daria para cobrar;
   - quanto se perdeu porque passou o prazo de 7 dias.
4. **Decidir:**
   - **Contestável em média ≥ R$ 300/mês por restaurante:** vira produto. Conferência semanal, aviso no
     WhatsApp e, depois, a API oficial (aí precisa do CNPJ da Growlift).
   - **Abaixo disso:** vira recurso do pacote de restaurante, o "Raio-X do iFood". Mostra quanto o iFood levou
     no mês (comissão + taxas + promoções) e quanto ficaria no pedido próprio. É argumento para vender o
     pedido sem comissão, que a Growlift já tem.

## Limites desta pesquisa

- Não vi uma planilha real nem a documentação completa das colunas: parte da documentação do iFood bloqueou
  o acesso automático.
- Os textos sobre Koncili e Lumanet são dos próprios fornecedores; preços não publicados.
- Não há dado público de quanto o restaurante perde por mês nos repasses.
