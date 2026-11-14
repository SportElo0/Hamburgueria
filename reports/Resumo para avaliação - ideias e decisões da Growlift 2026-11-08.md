# Growlift: tudo o que decidimos e as ideias em aberto (08/11/2026)

Documento para uma segunda opinião. No fim estão as perguntas que queremos que você avalie.

## Quem somos

- **Sócios:** Growlift é o Lucas e o Antônio, de São Paulo.
- **Começo:** agência de sites para negócios locais (restaurantes, deliveries, serviços).
- **Mudança de rumo (novembro/2026):** o principal deixa de ser criação de sites e passa a ser **automação com IA, cardápio
  em 3D e um painel que mostra o que dá lucro**. Sites viraram um serviço a mais.
- **O que já está no ar:**
  - site da Growlift: growlift.com.br;
  - painel próprio (Next.js) com pedidos, mesas e análises;
  - sites de 2 restaurantes clientes, feitos e no ar.

---

## 1. O que vendemos agora

### A) Restaurantes: "painel de decisões + cardápio 3D" (3 planos)

| | Essencial | Pro | Completo |
|---|---|---|---|
| Pratos em 3D | 3 | 8 | até 25 |
| Troca de prato em 3D (prato novo ou da estação) | — | 1 por mês | 2 por mês |
| Cardápio por QR com 3D e "ver na mesa" (realidade aumentada) | sim | sim | sim |
| Painel de decisões: vendas, margem por prato, matriz do cardápio, recomendação que o dono aprova | sim | sim | sim |
| Custo dos pratos montado por nós | 10 | 20 | todos |
| Hora da sobremesa + medição | — | sim | sim |
| Resumo do mês em áudio | — | sim | sim |
| Vendas do iFood e do caixa no painel (lucro por canal) | — | — | sim |
| Ficha técnica falada em áudio + preço do insumo pela nota fiscal | — | — | sim |
| Vídeo do 3D por mês para o Instagram | — | — | sim |
| **Implantação / mensalidade (hipótese)** | **R$ 397 / R$ 197** | **R$ 597 / R$ 297** | **R$ 997 / R$ 497** |

**Status de construção:**
- **Essencial:** pronto.
- **Pro:** falta só o resumo em áudio.
- **Completo:** faltam a importação de vendas, a IA da ficha técnica e o resumo em áudio.

**Hora da sobremesa (já construída e no ar no painel):**
- **No celular da mesa:** 15 minutos depois que o prato principal fica pronto, ou quando a mesa pede a conta, aparecem até 3
  sobremesas, as que têm 3D primeiro.
- **Na tela do garçom:** aviso "Mesa X: oferecer sobremesa".
- **Na mesa:** cartão com QR para imprimir.
- **Medição:** o painel compara a parte das mesas que pede sobremesa com o aviso e sem o aviso.
- **Modos:**
  - desligado (só mede);
  - metade das mesas (teste: as ímpares recebem o aviso, as pares são comparação);
  - todas.

**O que mais o painel de restaurante já faz (construído):**
- **Pedidos:**
  - pedido próprio pelo site, sem comissão (Pix, entrega e retirada);
  - tela da cozinha;
  - relatório.
- **Salão:**
  - pedido na mesa por QR;
  - mapa do salão;
  - reservas com sinal no Pix;
  - fila de espera;
  - pagar a conta pelo Pix na mesa.
- **Clientes:**
  - clube de clientes e campanhas;
  - pedido de avaliação no Google.
- **Integração:** com o Saipos, esperando parceria.

### B) Serviços locais (ex.: ar-condicionado, limpeza, reforma)

- **Pacote:**
  - site;
  - tudo levando ao WhatsApp;
  - **atendente de IA no WhatsApp oficial do cliente**;
  - pedido de avaliação no Google.
- **Preço (hipótese):** R$ 997 de implantação + R$ 997/mês.
- **Por que esse nicho:** um serviço vale centenas de reais, então o cliente aguenta mensalidade alta. Restaurante não aguenta.
- **Status:** a atendente **ainda não foi construída**, e o site já oferece.
- **Para construir:** cliente piloto, conta da Meta dele e chave da IA.

### C) Agente de IA do negócio

- **O que é:** um assistente que conhece os números do negócio (o que vende, o que dá lucro, horários fortes e fracos), sugere o
  que testar para faturar mais e explica em português simples; o dono aprova.
- **Status:** a base (análises e recomendações por regras) existe. A parte de IA que conversa ainda não.

### D) Sites

- **Continua:** como serviço, sem plano fixo.
- **Clientes antigos:** os dos planos Start (R$ 247) e Grow (R$ 597) seguem com as condições do contrato.

### Como vendemos

- **Sem tabela fixa no site:** o cliente responde um diagnóstico de 3 passos (cerca de 1 minuto):
  1. a maior dor;
  2. ramo, atendimentos por dia e quem responde o WhatsApp;
  3. contato.
- **Proposta:** recebe um plano sob medida com preço por escrito em até 2 dias úteis.
- **Painel:** o diagnóstico chega com uma bolinha vermelha de "novo sem resposta".

---

## 2. Regras que decidimos (não negociáveis)

- **Nada inventado:** nenhum cliente, depoimento, número de vendas ou resultado que não seja verdade. Exemplos no site
  são marcados como fictícios.
- **Atendente de IA dos clientes:**
  - pode ter nome, falar como pessoa e mandar áudio;
  - nunca diz "mensagem automática";
  - **único limite:** se perguntarem sério se é robô, ela não mente ("sou a assistente da X, quer que eu chame alguém?").
  - roda no WhatsApp oficial do próprio cliente, que paga a Meta;
  - atende, faz orçamento, agenda e manda o Pix do pedido;
  - não cobra dívida nem manda propaganda para quem não aceitou receber.
- **Disparos:** sem envio em massa nem disparo automático para listas que não aceitaram receber. Avaliamos a ideia de usar
  robô de mensagens em massa e descartamos: risco de bloqueio do número e de problema com a LGPD.
- **Senhas:** nunca pedimos a senha do iFood ou de sistemas do cliente. Usamos exportação ou API oficial.
- **Marcas de clientes reais:** não aparecem em material público sem autorização escrita.

---

## 3. Ideias que avaliamos e descartamos (e por quê)

| Ideia | Por que saiu |
|---|---|
| **Repasse Certo** (auditor do repasse do iFood, cobrando 25% do recuperado) | Já existem ferramentas que fazem isso (Koncili, Linx) e auditoria como serviço (Lumanet). A contestação de cancelamento só vale por 7 dias. A política nova do iFood (set/2026) já reduz as perdas. Ninguém sabe quanto dinheiro aparece por restaurante. Ficou como possível recurso "Raio-X do iFood" (quanto o iFood levou no mês) dentro do plano Completo |
| **"Sistema completo" de restaurante (antigo plano Scale)** competindo com o PDV | 83% dos restaurantes já usam sistema de vendas (Abrasel, 2023). Trocar o sistema do dono é briga perdida. Vendemos o que soma ao que ele já usa |
| **IA de margem como produto principal** | Já tem concorrentes baratos (MenuTrack, Alô Chefia, Saipos com IA, Consumer) e engenharia de cardápio vem grátis em vários sistemas. Virou só uma parte do painel de decisões |
| **Cardápio inteiro em 3D sem limite** | O trabalho come a mensalidade. Limite de 25 pratos |
| **Treinador da casa** (treinar funcionário novo pelo WhatsApp) | Boa dor (rotatividade de 73%), mas ficou para depois |
| **Copiloto da Reforma Tributária** | Precisa de um contador parceiro. Ficou para depois |

---

## 4. Pesquisas e números que usamos

- **Sobremesa em 3D:** num estudo de campo num restaurante, 41,2% de quem viu a sobremesa em realidade aumentada pediu
  sobremesa, contra 18,0% com o cardápio comum, e o gasto com sobremesa foi mais que o dobro (Fritz, Hadi e
  Stephen, *Journal of the Academy of Marketing Science*, 2023).
  - **Limite:** 101 clientes, duas noites, tablet. Não dá para prometer o número; dá para testar.
- **Responder rápido:** quem respondeu o contato em até 1 hora teve cerca de 7 vezes mais chance de levar a conversa adiante
  (*Harvard Business Review*, 2011).
  - **O estudo dos "5 minutos":** é real (InsideSales/Oldroyd, 2007): responder em 5 minutos, e não em 30, deu 21 vezes mais
    chance de a conversa avançar.
  - **O "cai 500%" que circula:** é distorcido.
- **Mercado de restaurantes:** 83% já usam software de vendas, 63% vendem pelo WhatsApp e 2 em cada 3 ainda atendem na mão
  (Abrasel).
- **WhatsApp oficial:** responder quem chamou nas últimas 24 h não é cobrado. Mensagem de serviço sai por ~R$ 0,04 a
  0,08 e de propaganda por ~R$ 0,31 a 0,39 (estimativas; quem paga é o cliente).
- **Preços de mercado:**
  - pedido próprio: R$ 60 a 300/mês;
  - cardápio 3D: R$ 69 a 299/mês;
  - atendente de IA: R$ 200 a 500/mês no plano e R$ 400 a 1.500 no custo total;
  - gestão do Google: R$ 400 a 1.200/mês;
  - pacote de agência para serviços: ~R$ 1.500/mês.

---

## 5. O site agora (growlift.com.br)

1. **Capa:** "Tecnologia de empresa grande, sob medida para o seu negócio."
2. **Seção que segura a tela** com um navegador passando por 4 telas: WhatsApp com IA, prato em 3D, painel com o
   agente de IA e site.
3. **Hambúrguer 3D em cima de um prato:**
   - gira com o dedo e só para os lados;
   - QR "Veja na sua mesa" no computador e botão "Ver na minha mesa" no celular.
4. **Cena da pesquisa da sobremesa:** os números sobem com a rolagem (18% → 41%).
5. **Cena do WhatsApp em 4 passos:** 23h41 o cliente chama → a IA responde → 23h42 agendado → 7h30 "você acorda com
   tudo feito" + 7x de Harvard.
6. **O resto:** modelos de site, "Um degrau por vez" (plano sob medida), diagnóstico em 3 passos, quem somos e dúvidas.

---

## 6. Próximos passos que propusemos

1. **Construir o que o site já vende e não existe:** atendente de IA no WhatsApp (primeiro) e agente de IA do negócio.
2. **Piloto real no restaurante The Burguest:**
   - 2 semanas só medindo a sobremesa;
   - depois a Hora da sobremesa em metade das mesas, com 2 sobremesas escaneadas com o iPhone.
3. **Levar gente ao site:**
   - Reels do hambúrguer girando e dos 4 passos do WhatsApp;
   - contato um a um com empresas de ar-condicionado e restaurantes da região.

---

## 7. O que queremos que você avalie

1. **Foco:** faz sentido ter dois públicos ao mesmo tempo (restaurantes e serviços locais)? Ou é melhor escolher um só no
   começo?
2. **Preços:** os preços dos planos de restaurante (R$ 197 a 497/mês) e do pacote de serviços (R$ 997/mês) estão bons para o
   mercado brasileiro de pequenos negócios?
3. **Prioridade:** começar pela atendente de IA no WhatsApp é a melhor escolha? O que construir primeiro para ter receita mais
   rápido?
4. **Venda:** sem tabela de preço no site e com plano sob medida depois do diagnóstico, converte mais ou menos que ter preço à
   vista?
5. **Riscos:** o que pode dar errado (legal, técnico, de mercado) que ainda não vimos?
6. **Ideias:** tem alguma ideia de produto ou de canal de venda que deveríamos considerar e não consideramos?
