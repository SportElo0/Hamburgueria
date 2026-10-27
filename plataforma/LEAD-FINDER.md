# Growlift Lead Finder

Aba **Oportunidades** do painel (`/painel/oportunidades`). Ela acha negócios por cidade, bairro e segmento na Places API (New) do Google e mostra quais podem precisar de site. A equipe confere cada um à mão e exporta a lista em CSV.

Só a equipe da Growlift entra; os logins de loja não veem esta aba.

## O que ele faz

1. **Pesquisa** (Text Search) por segmento + cidade, com bairro opcional. Ex.: "barbearia em Perequê, Ilhabela - SP". Até 20 lugares por busca; no máximo 3 buscas (60 lugares) por pesquisa, que é o teto do Google.
2. **Mostra o custo antes** e só pesquisa depois de alguém marcar "Aprovo". O servidor confere de novo a aprovação e o limite do mês.
3. **Tira repetidos** pelo place ID, dentro da pesquisa e contra a lista já guardada, e ignora lugares de outra cidade (pelo endereço).
4. **Classifica** cada lugar em:
   - **Sem website cadastrado:** o perfil no Google não tem site.
   - **Apenas rede social:** o link leva a Instagram, Facebook, Linktree, WhatsApp, iFood, Booksy e parecidos.
   - **Website próprio:** o site abriu com HTTPS e versão para celular.
   - **Website com problemas identificados:**
     - não abre, ou o domínio não existe;
     - responde com erro;
     - não tem HTTPS ou tem certificado com problema;
     - não tem versão para celular;
     - a página está parada, à venda ou em construção;
     - demora mais de 6 s.
   - **Situação incerta:**
     - o site não respondeu a tempo;
     - o link é estranho;
     - o Google marca o lugar como fechado definitivamente.
5. **Checagem do site:** uma única visita à página inicial, como uma pessoa abrindo o link. Não abre outras páginas nem guarda o conteúdo. Recusa endereços internos (proteção contra SSRF), também em IPv6, depois de redirecionamentos e no momento da conexão.
6. **Verificação manual:** "Sem website" só vale como confirmado depois de a equipe marcar pelo menos **2 fontes públicas** consultadas:
   - busca no Google;
   - Instagram;
   - Facebook;
   - app de pedidos;
   - Registro.br.

   Os links do que acharam também são anotados. Fica registrado quem verificou e quando.
7. **Exporta CSV** (abre no Excel) com:
   - place ID e link do Google Maps;
   - cidade, bairro e segmento pesquisados;
   - categoria e o que a checagem viu, com data;
   - verificação manual: fontes, links, data e quem verificou;
   - observações e situação.

   Quem está como "Não contatar" fica fora do CSV, a não ser que esse filtro seja escolhido.

## O que ele não faz (de propósito)

- **Não guarda nem exporta** nome, endereço, telefone ou site vindos do Google. Os Termos do Google Maps Platform proíbem: seção 3.2.3(a) "No Scraping", que inclui "copy and save business names, addresses". Esses dados aparecem só na tela, no resultado da pesquisa ou no botão "Ver dados do Google", com a atribuição "Google Maps". O que pode ser guardado para sempre é o **place ID**, que é a chave de tudo.
- **Não envia mensagem nenhuma.** Não tem botão de WhatsApp nem de e-mail. Contato é feito por uma pessoa, um negócio por vez, dizendo quem é. Se pedirem para não ser contatados, marquem "Não contatar". Campanha de WhatsApp só para quem aceitou receber (regras no CLAUDE.md).
- **Não raspa o Google nem outros sites.** A busca é pela API oficial; a checagem do site é uma visita à página inicial; as outras fontes a equipe confere à mão.
- **Não mostra telefone** a não ser que `LEADS_MOSTRAR_TELEFONE=sim`. Mesmo assim, o telefone só aparece na tela, nunca é guardado. Ao lado dele vem um botão **"Chamar no WhatsApp"** (celular) ou **"Ligar (fixo)"**: o link é montado na hora, um contato por vez, à mão; nada de envio em massa.
- **Só quem não tem site funcionando:** lugares com site próprio que passou na checagem são contados ("N com site funcionando ficaram de fora"), mas não aparecem nem são guardados. Os que já estavam na lista ficam escondidos; o chip "Website próprio" ainda mostra.

## Custos (tabela do Google, conferida em 26/10/2026)

Fonte: developers.google.com/maps/billing-and-pricing/pricing. Valores em dólar; o Google cobra em reais pela cotação do dia.

| O que o painel usa | SKU | Grátis por mês | Depois disso |
| --- | --- | --- | --- |
| Cada página de pesquisa (até 20 lugares) | Text Search Enterprise | 1.000 chamadas | US$ 35 a cada 1.000 |
| Botão "Ver dados do Google" | Place Details Enterprise | 1.000 chamadas | US$ 20 a cada 1.000 |

A pesquisa cai no nível Enterprise porque precisa do `websiteUri`. O telefone também é Enterprise e vem no mesmo pedido, sem custo a mais.

**Limites do painel**, que por padrão ficam abaixo da parte grátis:
- `LEADS_LIMITE_BUSCAS_MES`: padrão 200 buscas por mês;
- `LEADS_LIMITE_DETALHES_MES`: padrão 300 consultas por mês.

Cada chamada desconta do contador **antes** de ir ao Google, então o limite vale mesmo com duas pessoas pesquisando ao mesmo tempo.

**Atenção:** a parte grátis é da conta de faturamento inteira. Se a mesma conta usar a Places API em outro sistema, sobra menos do que o painel mostra. Por isso use um projeto só para o Lead Finder e configure as cotas e o alerta abaixo.

## Configuração (uma vez, feita pelo Lucas)

O Google Cloud exige ser maior de 18 anos, então a conta e a chave ficam no nome do Lucas.

1. **Projeto:** em console.cloud.google.com, crie um projeto novo chamado `growlift-lead-finder` e ligue o faturamento.
2. **API:** em "APIs e serviços › Biblioteca", ative só a **Places API (New)**.
3. **Chave:**
   - Em "APIs e serviços › Credenciais", clique em "Criar credenciais › Chave de API".
   - Em "Restrições da API", escolha **Places API (New)** e nada mais.
   - Não restrinja por site (HTTP referrer): a chave é usada no servidor, não no navegador. O painel roda na Vercel, que não tem um IP fixo, então a proteção vem da restrição de API, das cotas e de a chave nunca sair do servidor.
4. **Cotas** (o freio do lado do Google): em "APIs e serviços › Places API (New) › Cotas", baixe:
   - "Text Search requests per day" para **30**;
   - "Get Place requests per day" para **100**.

   Os nomes podem variar um pouco no console.
5. **Alerta de gasto:** em "Faturamento › Orçamentos e alertas", crie um orçamento de **R$ 10 por mês** com aviso por e-mail em 50%, 90% e 100%. O alerta avisa, mas não bloqueia: quem freia são as cotas do passo 4 e o limite do painel.
6. **Vercel:** no projeto do painel (`prj_RtyR3H3YbwXdXkv9s08IhAQszQvK`), em "Settings › Environment Variables":
   - adicione `GOOGLE_MAPS_API_KEY` com a chave, marcada como **Sensitive**, só em Production;
   - opcional: `LEADS_LIMITE_BUSCAS_MES`, `LEADS_LIMITE_DETALHES_MES` e `LEADS_MOSTRAR_TELEFONE=sim`.

   Depois faça um novo deploy.
7. **Nunca** cole a chave no código, no chat, em commit ou em print. Se vazar, apague a chave no Google Cloud e crie outra.

## Como usar

1. Painel › **Oportunidades** › Nova pesquisa: cidade, UF, bairro (opcional), segmento e quantos lugares.
2. **1. Calcular o custo:** confira o custo, marque "Aprovo" e clique em **2. Pesquisar**.
3. O resultado aparece com nome, endereço e site. Essa lista não fica salva; na **Lista para revisar** ficam o place ID e a conclusão.
4. Em cada lugar:
   - "Abrir no Google Maps" é grátis;
   - "Ver dados do Google" usa 1 consulta.

   Depois clique em **Revisar** para:
   - marcar as fontes que consultaram;
   - colar os links do que acharam;
   - acertar a categoria;
   - escolher a situação: Nova, Boa oportunidade, Descartada ou Não contatar.
5. **Exportar CSV** respeita os filtros da tela.

Para incluir outro segmento, acrescente uma linha em `SEGMENTOS`, em `src/lib/oportunidades/regras.ts`. O `tipo` vem da tabela oficial em developers.google.com/maps/documentation/places/web-service/place-types.

## Arquivos

- `src/lib/oportunidades/regras.ts`: categorias, segmentos, tabela de preços, estimativa, leitura do link, CSV.
- `src/lib/oportunidades/places.ts`: chamadas à Places API (New) com máscara de campos mínima (só servidor).
- `src/lib/oportunidades/site.ts`: checagem da página inicial, com proteção contra endereços internos.
- `src/lib/oportunidades/dados.ts`: aprovação, limite do mês, pesquisa, remoção de repetidos, revisão. Os dados ficam no Blob, em `oportunidades/lugares.json` e `oportunidades/pesquisas.json`; os contadores em `limites/places/<AAAA-MM>.json`.
- `src/app/painel/oportunidades/`: página, ações e `exportar/route.ts` (CSV).
- `test/oportunidades.test.ts`: 17 testes com o Google e os sites simulados. Nenhum teste chama a API de verdade.

## Ferramenta de documentação

O MCP oficial **Google Maps Platform Code Assist** está no `.mcp.json` do projeto, na versão remota `https://mapscodeassist.googleapis.com/mcp`. O pacote npm `@googlemaps/code-assist-mcp` foi descontinuado em 1º/06/2026. As regras, preços e termos acima foram tirados dele e das páginas oficiais.

Use of this code is subject to the Google Maps Platform Terms of Service: https://cloud.google.com/maps-platform/terms
