# Auditoria do material existente (27/10/2026)

## O que havia

| Item | Onde | Estado |
| --- | --- | --- |
| Pré-produção v1 (análise, roteiro de 27 s, storyboard, plano Higgsfield) | `../pre-producao.md` | mantida; esta v2 a substitui onde diverge |
| Script de anonimização dos 4 sites | `../anonimizar.mjs` | funcionando; agora exporta `SITES` e `anonymize()` para a v2 reaproveitar |
| Capturas v1 (hero e página inteira) | `../capturas/` | mantidas; as de página inteira saem do git (grandes, refazíveis) |
| Prévia v1 (12 quadros) | `../styleframes/` + `../styleframes.mjs` | **mantida intacta** para comparação (ver `previews/antes-depois.png`) |
| Motor dos 8 Reels (HTML → quadros → ffmpeg) | `../../reels/motor.mjs` | funcionando; é o motor recomendado para a animação |
| Fontes | `growlift/fonts` (Inter, OFL) | copiadas para `assets/fontes` |
| Logo | `growlift/favicon.svg` = símbolo do site | copiado para `assets/growlift/marca.svg` |
| Marca de vidro | `../../assets/hd/marca-vidro-vertical.png` e `growlift/img/hero.mp4` | copiadas |
| Ferramentas de motion | HyperFrames 0.8.206 (plugin), 12 skills do Remotion, Lemo-Opuscar (plugin), Playwright, ffmpeg 6.1 | instaladas; nenhuma nova foi necessária nesta fase |
| Repositório | branch `claude/downtown-burger-site` | limpo antes de começar; nada pendente |
| Higgsfield | saldo 197,25 créditos | **nada gasto** nesta fase |

## Problemas encontrados e o que foi feito

| # | Problema | Por que prejudica | Solução | Feito | Como verificar |
| --- | --- | --- | --- | --- | --- |
| A | Quadros pretos com ícone de arquivo na gravação da prévia | parece arquivo quebrado | Conferi os 12 PNGs da v1: 0 imagens quebradas, fontes carregadas, nenhum quadro preto por erro (os escuros são 01, 02 e 11, de propósito). O preto com ícone é o cartão de anexo do app antes de a imagem carregar. Havia um risco real: a v1 baixava fontes (Google) e as peças da Salinho da internet na hora de gerar | Na v2 tudo é local, e o gerador confere cada quadro (imagem decodificada + fonte Inter ativa) e falha se algo faltar | `node v2/source/keyframes.mjs` imprime "ok" em cada quadro |
| B | Storyboard fragmentado: cada quadro com fundo, etiqueta e tipografia diferentes | parece colagem, não campanha | Um sistema só: palco azul-escuro da Growlift, a mesma "tela" arredondada do início ao fim, a mesma legenda (símbolo + GROWLIFT, nome, descrição, selo) no mesmo lugar, e cada transição com um elemento que liga os dois lados | 13 quadros refeitos | `previews/storyboard-contact-sheet.png` |
| C | Todos os projetos com o mesmo peso | o melhor trabalho não se destaca | Salinho com 6 s e 4 quadros; os outros com cerca de 3 s cada | | tempos em `storyboard.json` |
| D | Abertura: MAIS. do mesmo tamanho do resto, linha de luz decorativa, sem marca | hierarquia fraca nos 2 primeiros segundos | MAIS. com o dobro do tamanho, símbolo + GROWLIFT no topo, linha removida; o ponto azul vira a tela do primeiro site | | 01 e 02 |
| E | "Não basta estar online. Sua presença precisa impressionar." | repete a tese e atrasa os sites em 1,8 s | Removida. Os sites entram aos 2 s | | 02 |
| F | Fechamento com "Growlift" em texto comum e marca de vidro com brilho demais | a marca oficial não aparece | Logotipo oficial (símbolo vetorial + GROWLIFT espaçado, como no site), frase, chamada e endereço | | 13 |
| G | Etiqueta "Prévia 03/12" dentro do quadro | sujava a composição | Saiu do quadro; a numeração fica na prancha e na prévia navegável | | quadros limpos |
| H | Barras de navegador desenhadas e fundos inventados (amarelo, faixa com texto) | elemento falso, parece mockup barato | Só capturas reais; o fundo de cada cena é a cor exata do site | | `asset-manifest.json` |
| I | Logo da Salinho com o original por trás e "Ø" da marca real na roleta | vazava a marca verdadeira | O logo antigo também era desenhado por máscara CSS (`.brand::before`); escondido. O "Ø" da roleta e do endereço foi removido | | `assets/salinho/pc-roleta.png` |
| J | A cena da Fornada não é café | o roteiro v1 falava em "espuma de café" | O próprio site diz "Cena ilustrativa de chocolate quente". Passa a ser "bebida quente" | | 10 e 11 |
| K | Barras fixas e "Pular para o conteúdo" por cima das capturas de seção | captura com defeito | Escondidos só durante a foto | | capturas de seção |
| L | Capturas pequenas ampliadas | perde nitidez | Hero dos 4 sites refeito a 4× (5760×3600); todo recorte é reduzido, nunca ampliado acima da captura | | `assets/*/pc4x-hero.png` |

## O que ficou de fora de propósito

- Avaliação de cliente com nome e foto da fachada (Swell Club) e a foto do casal (Fornada): pessoas e lugar reais.
- Lista de bebidas do Chapa 77 (marcas de terceiros: Heineken, Coca e outras).
- Nenhuma palavra das marcas reais sobrou no texto das páginas capturadas (conferido automaticamente; só "feito à mão", que é expressão comum).

## Pendência que depende de vocês

**Nomes.** O briefing novo usa os nomes reais (Downtown Burger, Surflife, Feito à Mão). O CLAUDE.md proíbe marca de negócio real em material público sem autorização por escrito, e em 26/10 vocês decidiram usar nomes fictícios. Mantive Salinho, Chapa 77, Swell Club e Fornada. Se houver autorização por escrito de cada negócio, trocar é rápido: a captura sem anonimização e uma nova renderização dos quadros. Mesmo assim, como foram demonstrações, o selo continuaria dizendo que não são clientes contratados.
