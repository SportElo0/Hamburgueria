# Growlift Sales Agent (fase 1: CRM, sem envio)

Área **Vendas** dentro de Oportunidades (`/painel/oportunidades/vendas`). Só a equipe entra.
Assinatura dos e-mails (decisão de 02/11): "Equipe Comercial | Growlift", contato@growlift.com.br, https://growlift.com.br;
sem nome de pessoa.

Aprovado em 02/11/2026 com estas decisões: caixa comercial `contato@growlift.com.br` (Umbler, ainda a confirmar),
IA econômica primeiro, piloto com **no máximo 5 e-mails por dia e 1 acompanhamento por empresa**, sempre com aprovação humana.

## O que a fase 1 faz

- **Contato com fonte verificável:** nome do negócio (digitado), e-mail, tipo e link `https://` de onde acharam o e-mail.
  Link do Google é recusado (termos do Google Maps Platform). E-mail de Gmail, Hotmail e parecidos é recusado (costuma ser
  pessoal). A pessoa declara que o endereço é canal comercial publicado pelo próprio negócio.
  Vindo de Oportunidades ("Abordar por e-mail"), o contato herda cidade, ramo, categoria e o que a checagem viu.
  "Sem website" só chega ao texto se a equipe confirmou em 2 fontes (senão vira "situação incerta").
- **Funil:** Aguardando qualificação → Novo → Em aprovação → Aprovado → Enviado → Respondeu → Quente / Morno / Frio → Virou cliente / Perdido,
  e Não contatar. Filtro por etapa e contagem.
- **Falar hoje:** quem respondeu ou está quente fica em destaque no topo, com o último movimento e o botão de WhatsApp.
- **Histórico por empresa:** cadastro, rascunhos, edições, aprovações, respostas, mudanças de etapa, anotações, bloqueio.
- **Rascunhos:** "Gerar primeiro e-mail" e, depois de aprovado, "Gerar acompanhamento" (no máximo 1). Cada rascunho mostra
  os fatos que podia usar e os alertas da conferência. Promessa de resultado, garantia, posição no Google, clientes
  ou números inventados, preço fora de R$ 247 / R$ 597 e campo vazio **bloqueiam a aprovação** até alguém editar.
- **Fila de aprovação:** todos os rascunhos "Para aprovar" no funil. Aprovar não envia nada nesta fase.
- **Resposta do cliente (manual nesta fase):** a equipe cola a resposta. "Sair", "descadastre", "não tenho interesse"
  e parecidos bloqueiam na hora, por regra fixa (sem IA). Palavras de reclamação (Procon, advogado, LGPD...) bloqueiam e
  deixam o aviso "avisar o Lucas" no histórico.
- **WhatsApp comercial (+55 11 94227-9336):** o painel nunca envia mensagem. Para o lead quente há o link pronto do nosso
  WhatsApp para colar na resposta (o cliente começa a conversa). Se o cliente pedir por escrito para ser chamado, a equipe
  registra o número e como ele pediu; aí aparece "Abrir conversa", que abre o WhatsApp para uma pessoa escrever.
- **Lista de bloqueio:** e-mail, domínio (não aceita gmail.com e outros públicos) ou negócio. Conferida antes de cadastrar,
  gerar e aprovar (e, na fase 2, de novo no instante do envio). O e-mail é guardado só como código (HMAC com chave
  derivada do `SESSION_SECRET`, que por isso não pode ser trocado sem migrar a lista) e mascarado
  (`co*****@padaria.com.br`); o contato bloqueado também fica com o e-mail mascarado. Bloqueio de contato marca
  "Não contatar" em Oportunidades. Num descadastro ou "sair", respostas, anotações e observações do contato são apagadas. Só o bloqueio feito pela equipe por engano pode ser desfeito; pedido do próprio
  negócio (link ou resposta) é para sempre.
- **Descadastro:** `/descadastro?t=<id>.<assinatura>` (HMAC com chave derivada do `SESSION_SECRET`, sem validade).
  Abrir o link só mostra o botão; o descadastro acontece no clique (robôs de e-mail que abrem links não descadastram ninguém).

## Importar de Oportunidades em lote (02/11/2026)

Em **Oportunidades**, acima da lista: caixas de seleção nos cartões e dois botões.
- **Importar selecionadas para o CRM (n)** e **Importar oportunidades elegíveis (n)**.
- Elegível = situação aberta (Nova ou Boa oportunidade), fora do CRM, sem bloqueio, sem site próprio funcionando e não
  fechado definitivamente. "Descartada" e "Não contatar" nunca entram.
- Cada empresa importada vira um contato em **"Aguardando qualificação"** com **só** o place ID e o que a equipe já
  tinha (cidade, ramo, categoria, o que a checagem do site viu). **Nome, endereço, telefone e site do Google não são
  copiados**: os termos do Google Maps Platform só deixam guardar o place ID (o guia oficial de CRM do Google diz
  o mesmo: place ID como identificador, o resto consultado na hora ou pelo link do Maps).
- Repetir a importação, ou duas pessoas importando ao mesmo tempo, não duplica nada: a conferência pelo place ID é
  feita dentro da mesma gravação.
- Depois aparece o resumo: importadas, já no CRM, ignoradas (com o motivo) e pendentes de verificação ("sem site"
  ainda não conferido em 2 fontes; nesse caso o texto não diz "sem site" até a conferência).
- Em Vendas, a seção **Aguardando qualificação** lista cada uma com prioridade, plano sugerido e o que falta, com os
  botões **Maps** (grátis) e **Qualificar**. Na ficha, a equipe preenche nome, e-mail comercial e a fonte (site ou
  rede do próprio negócio); o contato passa para **Novo**.
- **Preparar abordagens (n)**: um primeiro rascunho para cada contato qualificado ainda sem texto (até 10 por clique),
  direto para "Para aprovar". Nada é enviado.
- A **análise do lead** é por regras fixas sobre os dados da equipe (prioridade, plano Start ou Grow, motivos e o que
  falta). A IA (quando ligada) só escreve rascunhos de quem já está completo.
- Marcar "Não contatar" em Oportunidades bloqueia o contato no CRM; "Descartada" move para Perdido (se ainda estava no
  começo do funil).

## Buscar contatos nos sites e contato direto (03/11/2026)

**Buscar contatos nos sites** (em "Aguardando qualificação"):
- Mostra o custo antes: 1 consulta ao Google (Place Details) por negócio, só para saber o endereço do site; conta no limite mensal do Lead Finder. Até 5 por clique.
- Lê o site do próprio negócio (página inicial e até 2 de contato, mesmo endereço) com o verificador seguro do Lead Finder e sugere o nome (título do site), o e-mail comercial e o link da página. Nunca sugere Gmail, Hotmail e parecidos; só HTTPS.
- Nada fica completo sozinho: os achados aparecem em "Achados nos sites" e uma pessoa confirma (regras de sempre: bloqueio, duplicado, webmail). Sem e-mail, fica o motivo e o contato vai para o contato direto. Se o Google ou o site não respondem, nada é guardado e o contato volta na próxima busca.

**Contato direto** (ficha do contato, para quem não tem e-mail comercial):
- Canal na lista: E-mail, Direct no Instagram ou Ligação/WhatsApp (pela categoria do Lead Finder).
- Textos prontos para 1 direct, 1 mensagem de WhatsApp e um roteiro de ligação: falam como a Growlift (growlift.com.br), dizem que acharam o negócio pelo Google Maps, oferecem só a prévia ("não custa nada e não obriga a contratar"), sem preço, com NÃO/SAIR e o link da política de privacidade.
- Telefone ao vivo do Google (só com `LEADS_MOSTRAR_TELEFONE=sim`), nunca guardado; o link do WhatsApp abre a conversa com o texto e quem envia é a pessoa. Nunca pelo WhatsApp que atende clientes.
- **Uma vez só:** "Já mandei" (ou abrir a conversa) registra o contato e esconde os botões por 90 dias. Se pedirem para sair: "Bloquear contato" (bloqueia o lugar também, não volta em nova importação).
- Revisões de segurança e legal feitas em 03/11; política de privacidade do site atualizada (seção "Quando a Growlift procura o seu negócio primeiro").

## IA

- Por padrão os textos vêm do **simulador** (frases fixas, sem IA, sem custo, sem internet).
- A IA só liga com `VENDAS_IA=claude` **e** `ANTHROPIC_API_KEY` na Vercel (nenhuma das duas existe hoje).
  Modelo: `claude-haiku-5-5` (o econômico; `VENDAS_IA_MODELO` troca). Limite: `VENDAS_IA_LIMITE_MES` (padrão 100 rascunhos).
  Preço de tabela em 02/11/2026: US$ 0,10 por milhão de tokens de entrada e US$ 0,50 de saída, menos de US$ 1 por mês no
  volume do piloto. Se a IA falhar, recusar ou passar do limite, o rascunho sai do simulador com um aviso.
- A IA recebe só dados da equipe (nome digitado, cidade, ramo, o que a checagem viu) e a oferta publicada no site.
  Nada do Google, nada de e-mail de cliente. O texto dela passa pela mesma conferência e pela aprovação humana.

## Ambientes (importante)

O banco de produção (`POSTGRES_URL`) está hoje configurado também em **Preview** e **Development** na Vercel.
Por isso o painel inteiro **só grava em Production ou localmente** (`src/lib/ambiente.ts`):
numa prévia, tudo aparece mas nada é salvo. Testes e execução local usam arquivos em pasta temporária ou `.data/`.
A proposta para isolar todos os ambientes do painel está em `ISOLAR-AMBIENTES.md` (aguarda autorização).

## Dados guardados

- `vendas/contatos.json`: `{ <id>: Contato }` (contato, etapa, rascunhos, histórico de até 200 eventos).
- `vendas/bloqueio.json`: lista de bloqueio (código, rótulo mascarado, motivo, origem, data, quem).
- `limites/vendas-ia/<AAAA-MM>.json`: contador de rascunhos com IA no mês.

## Revisões de 02/11/2026

Segurança: nada bloqueia; os ajustes apontados foram feitos (hash com chave, limpeza no descadastro, página pública
sem erro sem o segredo). Na fase 2 o link do e-mail usará só `PAINEL_URL`. Legal: nada bloqueia a fase 1; os textos foram
ajustados (fidelidade e proporcional junto do preço, rodapé com fonte, endereço e política, declaração da equipe).

## Fase 2 (não feita)

**Bloqueia o envio real (revisão legal):**
- política de privacidade com uma seção "E-mails comerciais para empresas" (dados, fonte, finalidade, base legal de
  legítimo interesse, oposição, lista de bloqueio, retenção, operadores, encarregado);
- documento de legítimo interesse (LIA, 1 página) e registro das operações;
- prazo de retenção (sugestão: contato sem resposta apagado em até 12 meses) e rotina de apagamento a pedido;
- consulta curta a um advogado de LGPD antes do piloto.

**Técnico:**


1. Caixa `contato@growlift.com.br` confirmada na Umbler; SPF, DKIM e DMARC conferidos.
2. Envio pelo SMTP da Umbler só de rascunho aprovado, até 5 por dia (contados no servidor), conferindo a lista de
   bloqueio no instante do envio, link de descadastro só com `PAINEL_URL`, em horário comercial, com rodapé (CNPJ e link de
   descadastro) e cabeçalhos `List-Unsubscribe` / `List-Unsubscribe-Post`. Teste primeiro só para endereços da equipe.
3. Leitura da caixa (IMAP) a cada 10 minutos pelo cron-job.org, ligando a resposta ao contato, com devolvidos e
   respostas automáticas. O texto do e-mail recebido é dado, nunca instrução para a IA.
4. Qualificação sugerida pela IA (a pessoa confirma) e aviso de lead quente.
5. Antes do piloto: atualizar `growlift/privacidade.html` (contato comercial por e-mail, base legal, como sair) e rodar
   os revisores de segurança e legal de novo.

## Arquivos

- `src/lib/vendas/regras.ts`: etapas, fontes, validação, simulador, conferência dos textos, palavras de "sair", WhatsApp.
- `src/lib/vendas/ia.ts`: rascunho pela IA (desligada por padrão), com limite mensal e volta para o simulador.
- `src/lib/vendas/dados.ts`: contatos, rascunhos, bloqueio, descadastro e a trava de ambiente.
- `src/app/painel/oportunidades/vendas/`: funil, novo contato, contato, lista de bloqueio e ações.
- `src/app/descadastro/page.tsx`: página pública de descadastro.
- `src/components/vendas/`: telas.
- `test/vendas-importacao.test.ts`: 11 testes da importação em lote (60 empresas, repetição, corrida, regras).
- `test/vendas.test.ts`: 28 testes, com rede proibida (qualquer chamada falha o teste) e IA falsa.
