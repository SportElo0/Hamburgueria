---
name: carrossel-editorial
description: Cria carrosséis editoriais do Instagram da Growlift (conteúdo útil para donos de restaurante e pequeno negócio, não propaganda), com roteiro slide a slide, composição por componentes, conferência automática de legibilidade e conteúdo, prévia para aprovar e registro de feedback. Use quando pedirem carrossel, post em sequência, "conteúdo útil", ou para registrar o que acharam de um carrossel.
argument-hint: "[tema do carrossel, ou 'feedback: ...']"
---

# Carrossel editorial da Growlift

Tudo mora em `growlift-social/_fonte/editorial/`. Os 12 carrosséis antigos continuam em `_fonte/carrosseis.mjs` → `09-carrosseis/` e não são tocados por aqui.

```
editorial/
├── roteiros/<slug>.json   # o carrossel: texto + composição (é o que se revisa e aprova)
├── nucleo.mjs             # grade, escala de texto, arranjos, moldura (marca só na capa e no fim)
├── componentes.mjs        # peças visuais combináveis (diagramas, telas, objetos, listas, fecho)
├── conferir.mjs           # conferência automática (conteúdo + tela + repetição)
├── render.mjs             # gera saida/<slug>/NN.png e saida/relatorio.json
├── previa.mjs             # folhas de conferência, comparativo e página de prévia
├── fatos.json             # o que a Growlift faz de verdade (o fecho só cita o que está aqui)
├── preferencias.json      # o que o Lucas e o Antônio já disseram que gostam ou não
├── feedback.mjs           # registra uma preferência nova
└── aprovar.mjs            # trava um roteiro aprovado
```

## Passo a passo

1. **Leia antes de escrever:** `conteudo.md` e `design.md` desta pasta, `editorial/preferencias.json` (vale para todo roteiro novo) e `editorial/fatos.json`. Confira os temas que já existem (`roteiros/` e `growlift-social/09-carrosseis/carrosseis.md`) para não repetir.
2. **Roteiro primeiro, em texto:** mostre ao usuário, no chat, a tabela slide a slide (função, composição, texto) e espere o "ok" do roteiro antes de desenhar.
3. **Escreva o JSON** em `roteiros/<letra-ou-numero>-<slug>.json` com `status: "rascunho"`. Cada slide tem `funcao`, `arranjo` e `blocos` (ver `design.md`).
4. **Gere e confira:** `node growlift-social/_fonte/editorial/render.mjs <prefixo>`. Erro trava: corrija até zerar. Avisos: decida um a um (corrija ou explique na entrega).
5. **Olhe você mesmo** a folha (`node previa.mjs` → `saida/folhas/<slug>.png`): a conferência não vê gosto, ritmo, nem se a imagem conta a história. Uma rodada de correção, uma de confirmação.
6. **Revisão legal:** rode o subagente `revisor-legal` sobre o roteiro e as imagens. Aplique o que ele marcar como obrigatório.
7. **Prévia para aprovar:** `node previa.mjs` e publique `saida/previa/index.html` como página (Artifact, privada) com as imagens de `saida/previa/img/`. Mande o link e a folha.
8. **Aprovação:** quando o usuário aprovar, `node aprovar.mjs <slug> "<quem>"`. A partir daí o roteiro fica travado: qualquer mudança faz a conferência acusar erro.
9. **Agenda (só com autorização explícita):** copiar os PNGs aprovados para `growlift-social/09-carrosseis/<slug>/`, colocar o item em `agenda.json` e publicar o painel. Isso é a fase 2 e depende do deploy do painel: **não faça sem o usuário pedir**, e nunca publique no Instagram sem a aprovação no painel.

## Feedback (aprendizado)

Quando o usuário comentar uma capa, um texto ou um layout, registre:

```
node growlift-social/_fonte/editorial/feedback.mjs capa "Capa com objeto real funcionou melhor que celular" --capa-com cardapio
node growlift-social/_fonte/editorial/feedback.mjs texto "Não usar 'dicas'" --evitar dicas
node growlift-social/_fonte/editorial/feedback.mjs layout "Menos celular seguido" --sem-componente celular
node growlift-social/_fonte/editorial/feedback.mjs geral "Fechos mais curtos"
node growlift-social/_fonte/editorial/feedback.mjs listar
```

As opções `--evitar`, `--max-capa`, `--sem-componente` e `--capa-com` viram aviso automático na conferência dos próximos roteiros. Preferências só valem para roteiros em rascunho: **nunca reescreva um roteiro aprovado por causa de uma preferência nova.**

## Nunca

- Inventar estatística, preço, depoimento, cliente, resultado, prazo ou funcionalidade. Número com cara de estatística exige `fonte` no slide (a conferência trava).
- Slide só com logo, ou a Growlift no meio do carrossel. A marca aparece pequena na capa e no último slide.
- Prometer clientes, vendas, posição no Google, "melhor", "líder", "garantido".
- Dizer "mensagem automática" ou "robô" (inclusive no direct que a palavra-chave dispara).
- Marca, loja ou pessoa real nos exemplos; nada de foto do Lucas e do Antônio por enquanto.
- Mexer em `plataforma/`, Agenda, Instagram, cron ou Sales Agent sem pedido explícito.
