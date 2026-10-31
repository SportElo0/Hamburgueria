# Guia visual para redes sociais

**Base:** o site da Growlift (`growlift/styles.css`). Conferi as cores e a fonte direto no código do site. Os valores do briefing (#2864FF, #0B1020) não são os do site, então valem os de baixo. Resumo visual em `sistema-visual.png`.

## Cores

| Nome | Hex | Uso |
| --- | --- | --- |
| Azul Growlift | `#0865FE` | O azul da logo. Botões e o símbolo. |
| Azul claro | `#4D8DFF` | Ícones, palavra em destaque no título, detalhes |
| Azul suave | `#8DB8FF` | Etiquetas e chips |
| Rótulo | `#6EA6FF` | Texto pequeno em maiúsculas acima dos títulos |
| Fundo | `#06080D` | Base de todas as peças |
| Superfície | `#0F1520` | Cartões |
| Texto | `#F3F5F9` | Títulos |
| Cinza claro | `#C6CEDE` | Texto de apoio |
| Cinza | `#A9B3C7` | Texto secundário |

**Brilho:** um círculo de luz azul (`#0865FE` com transparência), sempre num canto da peça, nunca atrás do texto.

## Tipografia: Inter (a mesma do site)

| Estilo | Peso | Detalhes |
| --- | --- | --- |
| Título | 800 | Letras apertadas (-3,5%). Uma palavra-chave em azul claro, terminando em ponto. |
| Texto de apoio | 400 | Cinza claro. Frases curtas, no máximo 2 ou 3 linhas por tela. |
| Rótulo | 600 | Maiúsculas, espaçado (16%), azul. |
| Botão | 700 | Pílula azul `#0865FE`, texto branco. |

**Tamanhos mínimos para ler no celular:**
- story: 36 px no texto e 96 px no título;
- post: 28 px no texto e 84 px no título.

## Formatos e margens

| Peça | Tamanho | Margens |
| --- | --- | --- |
| Story e destaque | 1080×1920 | Conteúdo entre y=250 e y=1590, 96 px nas laterais. A barra do Instagram cobre o topo e a base. |
| Capa de destaque | 1080×1920 | Ícone no centro, 500 px. O perfil mostra só o círculo do meio. |
| Post e carrossel | 1080×1350 | 88 px nas laterais, 96 px em cima, rodapé com a marca e "n/total" |
| Foto de perfil | 1080×1080 | Símbolo centralizado com folga. Legível em 110 px. |

## Ícones

- Traço fino (1,5 a 1,7), pontas e cantos arredondados, grade de 24.
- Em azul claro sobre o fundo. Nos cartões, ficam dentro de um quadrado azul translúcido.
- Desenhados para este conjunto em `_fonte/pecas.mjs`: projetos, serviços, clientes, design, processo, contato, site, Google, pedido, lista, celular.

## Imagens

- **Pode:** prints do site da Growlift e dos **projetos conceito**, sempre com a etiqueta "Projeto conceito".
- **Não pode:** prints de sites feitos para negócios reais sem autorização por escrito do dono da marca.
- **Fotos de pessoas:** só de quem autorizou. O Antônio está autorizado pela mãe; guardem o e-mail.
- **Banco de imagem:** nada que pareça cliente real.

## Tom de voz

- Direto, próximo, sem jargão: "a gente", "você", "o seu negócio".
- Frases curtas. Uma ideia por tela.
- Nada de promessa de faturamento, posição no Google, "líder" ou "melhor".
- Chamada sempre concreta: "Peça o diagnóstico grátis", "Link na bio".

## Modelos editáveis

- Os modelos de peça estão em `_fonte/pecas.mjs`: capa, título, projeto, serviço, passo, contato, capa de carrossel, lista, chamada final.
- Os textos de cada peça estão em `_fonte/gerar.mjs`.
- O HTML de cada peça fica em `_fonte/html/`. Abra no navegador para ver ou ajustar.
- Para gerar tudo de novo: `node growlift-social/_fonte/gerar.mjs`.
