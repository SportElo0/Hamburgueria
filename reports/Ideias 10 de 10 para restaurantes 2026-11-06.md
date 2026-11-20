# Três ideias de produto para restaurantes (pesquisa de 06/11/2026)

Pedido: achar dores reais de restaurantes que dê para resolver com sistema e IA, com pelo menos 3 ideias que
ninguém tenha hoje e que caibam numa mensalidade alta. Contexto: a maioria já tem sistema de caixa
(ver `Restaurantes já têm sistema 2026-11-06.md`), então nada aqui substitui o sistema deles.

"Ninguém tem" quer dizer: procurei e não achei um produto igual no Brasil. Pode existir algo pequeno que a
busca não pegou. Antes de construir, vale uma segunda checagem rápida.

## Antes: o que já existe (e por isso ficou de fora)

| Ideia | Quem já faz |
|---|---|
| Cardápio com prato em 3D e realidade aumentada na mesa | **Chateau.ia** ("Cardápio AR") ([chateauia.com](https://www.chateauia.com/)). O nosso 3D não é exclusivo. |
| IA que manda relatório de vendas para o dono no WhatsApp | **iFood**: Cris (em teste com 10 mil+ lojas) e Toqan ([iFood](https://institucional.ifood.com.br/inovacao/ifood-lanca-ia-no-whatsapp-cris-para-impulsionar-gestao-dos-restaurantes/), [Canaltech](https://canaltech.com.br/apps/ifood-lanca-ia-que-ajuda-restaurantes-a-vender-mais-e-envia-relatorios-pelo-whatsapp/)) |
| Atendente de IA no WhatsApp | Anota AI (iFood), Brendi e outros |
| Câmera que confere a montagem do prato | Chateau.ia (Kitchen Pass) |
| Previsão de demanda com clima, jogos e eventos | ACOM Sistemas com a ADECI, em piloto ([BRA 1](https://www.bra1.com.br/economia/id-688375/inteligencia_artificial_revoluciona_gestao_de_restaurantes_e_previne_desperdicios)) |
| Ficha técnica que puxa custo da nota fiscal (XML) e preço por canal | SisFood, Food Sistemas |

## Ideia 1: Auditor do iFood (recupera dinheiro que o restaurante perde nos repasses)

**A dor:** o restaurante perde dinheiro com cancelamento aceito sem ele concordar, taxa de cancelamento,
subsídio de promoção e comissão cobrados errado. A contestação é manual, tem prazo curto (relatos de até
7 dias) e o dono não tem tempo de conferir pedido por pedido.
- Reclamações frequentes de restaurantes no Reclame Aqui sobre cancelamento indevido, repasse retido e taxa
  cobrada errado ([exemplo 1](https://www.reclameaqui.com.br/ifood/problemas-com-repasse-de-valores-cancelamentos-indevidos-e-falta-de-suport_kMPwXiAyaM0wIhAd/),
  [exemplo 2](https://www.reclameaqui.com.br/ifood/reclamacao-sobre-comissoes-e-taxas-indevidas-cobradas-pelo-ifood-com-solic_isv_lRQp90NOmaZq/)).
- Golpes de cancelamento deixam lojas no prejuízo ([Diário do Nordeste](https://diariodonordeste.verdesmares.com.br/negocios/golpe-no-ifood-deixa-restaurantes-no-prejuizo-app-estuda-cobrar-taxa-de-cancelamento-do-cliente-1.3233691)).
- Escritórios já oferecem auditar 5 anos de extrato para entrar com ação ([Urbano Ribeiro](https://urbanoribeiroadvogados.com.br/taxas-abusivas-ifood-restaurante-contestar/)).
- O iFood tem relatório oficial de conciliação financeira ([iFood Developer](https://developer.ifood.com.br/pt-BR/docs/guides/modules/financial/api-reconciliation)).

**Por que ninguém tem:** achei só serviço manual (auditoria e advogado), nenhum sistema que confira tudo
sozinho todo dia. O iFood não vai construir uma ferramenta para auditar a si mesmo, e o sistema de caixa
só recebe os pedidos, não confere o repasse.

**O produto:**
1. Lê o extrato de repasse e os pedidos todo dia.
2. Aponta o que foi cobrado errado.
3. Avisa no WhatsApp antes do prazo de contestar e deixa o texto da contestação pronto.
4. Mostra no fim do mês "você recuperou R$ X".
5. Para valores antigos, monta o dossiê para um advogado parceiro.

**Cobrança sugerida (hipótese a testar):** uma parte do valor recuperado (por exemplo 20% a 30%) mais uma
mensalidade baixa de monitoramento. O dono só paga bem se ganhar.

**Como começar:** com 2 ou 3 restaurantes que mandem a planilha de repasse do Portal do Parceiro todo mês.
Ver quanto dinheiro aparece. Se aparecer, buscar a integração oficial com o iFood.

**Cuidados:** não usar a senha do restaurante para entrar no portal (regra nossa, e contra as regras do
iFood); usar exportação ou API oficial. Revisar com `revisor-legal` e `revisor-seguranca`. Não prometer
valor de recuperação antes de medir.

## Ideia 2: Treinador da casa no WhatsApp (funcionário novo pronto em dias, não em semanas)

**A dor:** o setor troca de gente o tempo todo e contrata quem nunca trabalhou na área.
- Rotatividade de **73,49%** em 12 meses (dez/2024 a nov/2025) ([Abrasel](https://abrasel.com.br/noticias/noticias/rotatividade-de-mao-de-obra-segue-alta-nos-bares-e-restaurantes/)).
- **90%** dos donos acham difícil ou muito difícil contratar; **92%** contratam gente sem experiência ou no
  primeiro emprego ([Abrasel](https://abrasel.com.br/noticias/noticias/apesar-salario-medio-recorde-bares-restaurantes-dificuldade-preencher-vagas/)).
- Cada funcionário novo é o dono ou o gerente parado ensinando, e o prato sai diferente até a pessoa aprender.

**Por que ninguém tem:** existe treinamento genérico pelo WhatsApp para empresas (ChatSkills, DOT Digital),
mas não achei nada feito para cozinha e salão de restaurante, com o padrão da própria casa
([ChatSkills](https://chatskills.com.br/), [DOT](https://dotgroup.com.br/whatsapp-learning)).

**O produto:**
1. O dono grava uma vez, em áudio ou vídeo, como faz cada prato e cada rotina (abrir, fechar, atender,
   montar o Smash).
2. A IA transforma isso em treinamento de 7 dias pelo WhatsApp, em áudio e com perguntas.
3. O funcionário tira dúvida a qualquer hora ("quanto de cheddar vai no Smash 3.0?") e a IA responde só com
   o que o dono ensinou.
4. O funcionário manda foto do prato montado e a IA compara com a foto padrão da casa.
5. O dono recebe "o Marcos está pronto para a chapa; a Ana ainda erra o ponto da carne".

**Cobrança sugerida:** mensalidade por unidade (por exemplo R$ 397 a R$ 697), mais implantação para gravar
o padrão da casa.

**Como começar:** num restaurante cliente (Downtown ou El Patron), com 3 pratos e 2 rotinas, medindo em
quantos dias um funcionário novo fica pronto.

**Cuidados:**
- A IA só responde o que o dono gravou; se não souber, manda perguntar ao gerente (regra de nada inventado).
- Gravação de funcionário só com autorização escrita dele.
- Dados de funcionário seguem a LGPD (`revisor-seguranca`).

## Ideia 3: Copiloto da Reforma Tributária (preço certo e regime certo antes de 2027)

**A dor:** a reforma muda o imposto de restaurante e quase ninguém entende o efeito no preço.
- **60,9%** dos donos não se sentem preparados; **49,4%** querem entender o efeito no preço e na margem
  (Abrasel, ~1.480 empresários) ([Correio Braziliense](https://blogs.correiobraziliense.com.br/capital-sa/2026/08/20/mais-de-60-dos-bares-e-restaurantes-nao-estao-preparados-para-a-reforma-tributaria/),
  [reformatributaria.com](https://www.reformatributaria.com/negocios/609-dos-empresarios-de-bares-e-restaurantes-nao-se-sentem-preparados-para-a-reforma-tributaria-aponta-pesquisa/)).
- O split payment começa em teste em outubro de 2026 e passa a valer em 2027: o imposto sai na hora da venda
  e o restaurante perde fôlego no caixa ([Fenacon](https://fenacon.org.br/reforma-tributaria/o-novo-cardapio-tributario-preocupa-empresarios-de-bares-e-restaurantes/)).
- **Regras que mudam o cardápio (LC 214/2025):**
  - Comida e bebida sem álcool têm imposto 40% menor.
  - Bebida alcoólica paga a alíquota cheia.
  - Por isso, a receita de cada tipo precisa ser separada.
  - Quem está no Simples pode escolher pagar IBS e CBS por fora.
  ([Blog iFood](https://blog-parceiros.ifood.com.br/ibs-e-cbs/), [Rota da Jurisprudência](https://rotadajurisprudencia.com.br/2026/05/reducao-de-40-que-quebra-a-cadeia-a-face-dupla-do-regime-especial-de-restaurantes-na-lc-214-2025/))

**Por que ninguém tem:** existem calculadoras de preço por canal (SisFood, Food Sistemas) e conteúdo de
contadores sobre a reforma. Não achei uma ferramenta que pegue as vendas reais do restaurante (prato por
prato, comida e bebida, por canal) e mostre o novo preço e a decisão de regime para aquele restaurante.

**O produto:**
1. Puxa as vendas do sistema de caixa e as notas de compra.
2. Mostra prato por prato quanto vai pagar de imposto em cada canal (salão, iFood, próprio) e o preço para
   manter a margem.
3. Avisa o que muda no caixa com o split payment.
4. Simula ficar no Simples ou pagar IBS e CBS por fora.
5. Uma IA explica tudo em áudio, simples.

**Cobrança sugerida:** diagnóstico pago (por exemplo R$ 1.500) mais mensalidade durante a transição (por
exemplo R$ 497 a R$ 997), **em parceria com um escritório de contabilidade**, que assina as decisões.

**Como começar:** um diagnóstico de um restaurante cliente, feito junto com um contador, para ver se o
resultado muda o preço de algum prato.

**Cuidados:**
- A Growlift não dá parecer tributário sozinha; quem decide é o contador parceiro.
- A alíquota de referência ainda depende de resolução do Senado, então os números são simulação e precisam
  dizer isso.
- Revisar com `revisor-legal`.

## Qual fazer primeiro

1. **Auditor do iFood:** a dor tem valor em reais, a venda é "você só paga se recuperar", ninguém faz
   sozinho e dá para testar já, com planilha.
2. **Treinador da casa:** a dor é a mais espalhada do setor e o teste cabe num cliente que já temos.
3. **Copiloto da Reforma:** tem prazo (2027) e urgência, mas precisa de um contador parceiro antes.

As três usam o que a Growlift já tem: painel, IA, WhatsApp oficial e voz brasileira. Nenhuma pede para o
restaurante trocar de sistema.

## Limites desta pesquisa

- Não achei número oficial de quanto o restaurante perde por mês nos repasses do iFood; o primeiro teste
  serve justamente para medir.
- Dados de concorrentes vêm do site deles ou de blogs; podem estar incompletos.
- Os preços sugeridos são hipóteses para testar, não valores de mercado confirmados.
