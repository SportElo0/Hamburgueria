# Growlift Sales Agent (fase 1: CRM, sem envio)

Área **Vendas** dentro de Oportunidades (`/painel/oportunidades/vendas`). Só a equipe entra.
Aprovado em 02/11/2026 com estas decisões: caixa comercial `contato@growlift.com.br` (Umbler, ainda a confirmar),
IA econômica primeiro, piloto com **no máximo 5 e-mails por dia e 1 acompanhamento por empresa**, sempre com aprovação humana.

## O que a fase 1 faz

- **Contato com fonte verificável:** nome do negócio (digitado), e-mail, tipo e link `https://` de onde acharam o e-mail.
  Link do Google é recusado (termos do Google Maps Platform). A pessoa marca que o e-mail é público e do próprio negócio.
  Vindo de Oportunidades ("Abordar por e-mail"), o contato herda cidade, ramo, categoria e o que a checagem viu.
- **Funil:** Novo → Em aprovação → Aprovado → Enviado → Respondeu → Quente / Morno / Frio → Virou cliente / Perdido,
  e Não contatar. Filtro por etapa e contagem.
- **Falar hoje:** quem respondeu ou está quente fica em destaque no topo, com o último movimento e o botão de WhatsApp.
- **Histórico por empresa:** cadastro, rascunhos, edições, aprovações, respostas, mudanças de etapa, anotações, bloqueio.
- **Rascunhos:** "Gerar primeiro e-mail" e, depois de aprovado, "Gerar acompanhamento" (no máximo 1). Cada rascunho mostra
  os fatos que podia usar e os alertas da conferência. Promessa de resultado, garantia, posição no Google, clientes
  ou números inventados, preço fora de R$ 247 / R$ 597 e campo vazio **bloqueiam a aprovação** até alguém editar.
- **Fila de aprovação:** todos os rascunhos "Para aprovar" no funil. Aprovar não envia nada nesta fase.
- **Resposta do cliente (manual nesta fase):** a equipe cola a resposta. "Sair", "descadastre", "não tenho interesse"
  e parecidos bloqueiam na hora, por regra fixa (sem IA).
- **WhatsApp comercial (+55 11 94227-9336):** o painel nunca envia mensagem. Para o lead quente há o link pronto do nosso
  WhatsApp para colar na resposta (o cliente começa a conversa). Se o cliente pedir por escrito para ser chamado, a equipe
  registra o número e como ele pediu; aí aparece "Abrir conversa", que abre o WhatsApp para uma pessoa escrever.
- **Lista de bloqueio:** e-mail, domínio (não aceita gmail.com e outros públicos) ou negócio. Conferida antes de cadastrar,
  gerar e aprovar (e, na fase 2, antes de enviar). O e-mail é guardado só como código (SHA-256) e mascarado
  (`co*****@padaria.com.br`); o contato bloqueado também fica com o e-mail mascarado. Bloqueio de contato marca
  "Não contatar" em Oportunidades. Só o bloqueio feito pela equipe por engano pode ser desfeito; pedido do próprio
  negócio (link ou resposta) é para sempre.
- **Descadastro:** `/descadastro?t=<id>.<assinatura>` (HMAC com chave derivada do `SESSION_SECRET`, sem validade).
  Abrir o link só mostra o botão; o descadastro acontece no clique (robôs de e-mail que abrem links não descadastram ninguém).

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
Por isso a área de vendas **só grava em Production ou localmente** (`gravacaoPermitida` em `src/lib/vendas/dados.ts`):
numa prévia, tudo aparece mas nada é salvo. Testes e execução local usam arquivos em pasta temporária ou `.data/`.
A proposta para isolar todos os ambientes do painel está em `ISOLAR-AMBIENTES.md` (aguarda autorização).

## Dados guardados

- `vendas/contatos.json`: `{ <id>: Contato }` (contato, etapa, rascunhos, histórico de até 200 eventos).
- `vendas/bloqueio.json`: lista de bloqueio (código, rótulo mascarado, motivo, origem, data, quem).
- `limites/vendas-ia/<AAAA-MM>.json`: contador de rascunhos com IA no mês.

## Fase 2 (não feita)

1. Caixa `contato@growlift.com.br` confirmada na Umbler; SPF, DKIM e DMARC conferidos.
2. Envio pelo SMTP da Umbler só de rascunho aprovado, até 5 por dia, em horário comercial, com rodapé (CNPJ e link de
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
- `test/vendas.test.ts`: 21 testes, com rede proibida (qualquer chamada falha o teste) e IA falsa.
