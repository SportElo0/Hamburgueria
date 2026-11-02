# Regras de design

## Identidade (não muda)

Fundo `#06080d` com brilho azul e grade sutil, azul elétrico `#0865fe` (destaque `#4d8dff`), texto branco, Inter. Vermelho e verde só para errado/certo e antes/depois. Objetos do mundo real (cardápio, comanda, avaliação) em papel claro, para quebrar o ritmo escuro. Um slide claro inteiro só quando a função pede (ficha para imprimir).

## Grade e texto

Canvas 1080×1350. Margem lateral 88 px. Área útil de 150 a 1210 px (o topo leva só o nome da série; o rodapé, a barra de progresso). Escala: capa 112, título 84/64/52, texto 42/36/30, rótulos 28. Mínimo 26 px fora das telas desenhadas (20 px dentro do celular).

## Como um slide se monta

Um slide é um **arranjo** com **blocos**. Grupos aninhados permitem compor livremente:

- `pilha`: texto em cima, visual embaixo (o visual com `"flex": 1` ocupa o espaço livre e se estica).
- `palco`: visual em cima ocupando a cena, texto ancorado embaixo (bom para capa).
- `lado`: duas colunas (`cols` define a proporção), ex.: celular + explicação.
- `centro`: tudo centralizado (use pouco).
- `grupo`: um bloco que tem o seu próprio arranjo e blocos dentro (ex.: `lado` dentro de `pilha`).

Componentes (`componentes.mjs`):

| Tipo | Para quê |
|---|---|
| `titulo`, `texto`, `rotulo`, `selo` | texto; `selo` marca "Exemplo ilustrativo" |
| `fluxo` (v ou h) | caminho passo a passo com setas; `alerta` em vermelho, `ok` em verde |
| `linhaTempo` | etapas com pontos destacados (`ativo`) |
| `colunas` | comparação lado a lado (ruim × bom, longo × curto) |
| `lista` | lista curta com x, check, número ou ponto |
| `cardapio` | cardápio em papel; item com `marca` ?, x ou ok; `apagado` |
| `antesDepois` | o mesmo item antes e depois |
| `anatomia` | um texto com as partes numeradas e explicadas |
| `comanda` | comanda de papel rabiscada ou com campos legíveis |
| `celular` + `tela` | telas desenhadas: `perfil`, `links`, `pdf`, `chat`, `cardapio` |
| `contador` | ícone + número/rótulo grande (só número do próprio exemplo) |
| `modelo` | texto para copiar, com [campos] destacados |
| `ficha` | ficha para preencher ou imprimir (`claro: true`) |
| `tarefa` | "tarefa de hoje" |
| `resumo` | resumo numerado para salvar |
| `cta` | pedido final de uma linha com a palavra do direct |

Componente novo: crie em `componentes.mjs`, registre em `COMPONENTES` (e em `VISUAIS` se for visual), use só tokens da marca, texto com `data-txt`.

## Ritmo

- Não repita a mesma composição em slides seguidos, nem a mesma estrutura três vezes seguidas.
- Pelo menos 4 tipos de visual por carrossel. Slide só de texto é exceção.
- Telas de celular: no máximo duas seguidas.
- A marca: pequena na capa (logo + @growlift.ai) e no último slide. Nunca slide só de logo.
