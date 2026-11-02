# Conferência automática (o que o render checa)

`render.mjs` roda `conferir.mjs` em cada slide e grava `editorial/saida/relatorio.json`. **Erro** trava (o comando sai com código 1); **aviso** aparece para decidir.

## Conteúdo (no roteiro)

| Regra | Nível |
|---|---|
| Slide sem `funcao` | erro |
| Slide com menos de 3 palavras (só marca) | erro |
| Mais de 60 palavras / mais de 45 | erro / aviso |
| Expressão proibida (garantido, líder, o melhor, nº 1, mensagem automática, robô, sorteio, mais clientes, topo do Google…) | erro |
| Número com cara de estatística ou preço (%, R$, mil, "x vezes mais") sem `fonte` | erro |
| `cta` sem `fato` existente em `fatos.json` | erro |
| Growlift citada fora do último slide; `cta` fora do fim | aviso |
| Capa sem visual ou sem título | erro |
| Capa com mais de 12 palavras ou gancho genérico (dicas, tudo sobre…) | aviso |
| Mesma composição do slide anterior | erro |
| Mesma composição mais de 2 vezes; mesma estrutura 3 seguidas; menos de 4 tipos de visual | aviso |
| Mais de 5 hashtags; legenda ou alt faltando | erro |
| Roteiro aprovado alterado depois da aprovação | erro |
| Preferências registradas (`preferencias.json`) | aviso |

## Tela (na página renderizada)

| Regra | Nível |
|---|---|
| Conteúdo maior que a área útil | erro |
| Texto fora da área segura | erro |
| Texto cortado pela caixa que o contém (tela do celular, cartão) | erro |
| Textos encostando um no outro | erro |
| Letra menor que 26 px (20 px dentro do celular) | erro |
| Contraste abaixo de 4,5:1 (3:1 para texto grande) | erro |
| Texto do primeiro nível fora da margem | aviso |
| Faixa vazia maior que 200 px | aviso |
| Dois slides seguidos quase iguais na imagem (dHash ≤ 6/64) | aviso |

A conferência não substitui o olho: depois dela, olhe a folha inteira uma vez.
