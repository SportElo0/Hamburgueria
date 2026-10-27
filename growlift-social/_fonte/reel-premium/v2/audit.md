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
| M | A foto do hero da Swell Club (o surfista) é do **dono da loja**, pessoa real (avisado por vocês em 27/10) | imagem de pessoa sem autorização; e é foto do negócio, não da Growlift | A foto foi trocada **na hora da captura** por um surfista gerado por IA (pessoa que não existe, de costas, sem rosto; 2,75 créditos, autorizado), com `swapPhotos` no `anonimizar.mjs`. Nenhum arquivo do dono foi guardado. A transição 4 ficou sendo a ponte do creme | 09 e 12 com o surfista genérico | `asset-manifest.json`: `foto-generica/surfista-generico.png` |
| N | "®" depois de SWELL CLUB no rodapé (herdado da marca real) | nome fictício não pode parecer marca registrada | O anonimizador tira ® e ™ dos quatro sites | | `assets/swellclub/pc-rodape.png` |
| L | Capturas pequenas ampliadas | perde nitidez | Hero dos 4 sites refeito a 4× (5760×3600); todo recorte é reduzido, nunca ampliado acima da captura | | `assets/*/pc4x-hero.png` |

## O que ficou de fora de propósito

- A foto do hero da Swell Club (o dono da loja), a avaliação de cliente com nome e a foto da fachada (Swell Club), e a foto do casal (Fornada): pessoas e lugar reais.
- A prévia v1 (`../styleframes/`) ainda mostra a foto do dono nos quadros 08, 09 e 11. Ficou como histórico, sem uso; não publicar.
- Lista de bebidas do Chapa 77 (marcas de terceiros: Heineken, Coca e outras).
- Nenhuma palavra das marcas reais sobrou no texto das páginas capturadas (conferido automaticamente; só "feito à mão", que é expressão comum).

## Pendência que depende de vocês

**Nomes.** O briefing novo usa os nomes reais (Downtown Burger, Surflife, Feito à Mão). O CLAUDE.md proíbe marca de negócio real em material público sem autorização por escrito, e em 26/10 vocês decidiram usar nomes fictícios. Mantive Salinho, Chapa 77, Swell Club e Fornada. Se houver autorização por escrito de cada negócio, trocar é rápido: a captura sem anonimização e uma nova renderização dos quadros. Mesmo assim, como foram demonstrações, o selo continuaria dizendo que não são clientes contratados.

## Conferência do vídeo final (27/10/2026)

Conferido no MP4, não só na página: quadros a cada 0,5 s e, nas transições, a 10 por segundo. O que apareceu e foi corrigido:

| Problema visto | Correção |
| --- | --- |
| O primeiro quadro era preto (no Reels, o primeiro quadro precisa ter conteúdo) | "SUA MARCA" já entra no quadro 0 |
| O topo das letras de MAIS. aparecia antes da entrada | a máscara esconde as letras inteiras (conferido: 0 pixel azul antes da entrada) |
| MAIS subia por cima de MERECE | as duas linhas saem antes |
| Computador → celular e Chapa 77 → verde-água mostravam duas imagens fundidas no mesmo retângulo | o computador sobe e sai enquanto o celular sobe; a carta do Chapa 77 cresce até o lanche em camadas, sem fusão |
| Título do site cortado no topo ao crescer a carta do Chapa 77 | novo enquadramento; o botão do site some no verde-água |
| Faixa de cor diferente entre o verde-água do site e o fundo | fundo com o mesmo degradê do site |
| Na aproximação da Salinho, o "L" de "Leve por natureza." encostava na borda | aproximação ancorada no título |
| A janela vermelha abria com a camisa ainda na tela | as peças saem antes de a janela abrir |
| O SWELL gigante passava para fora do cartão creme | as letras ficam dentro do cartão, cortadas pela borda dele |
| Retângulo claro em volta do título da Fornada | o cartão creme tem o mesmo degradê do fundo |
| Legenda da Fornada embaixo dos botões do Instagram, selo em duas linhas | legenda e foto à esquerda, celular à direita; selo numa linha só |
| O ponto de MAIS. encostava na coluna de botões do Instagram | MAIS. um pouco menor (320 px) |

Arquivo final: H.264 High, 1080×1920, 30 fps, 750 quadros, 25,0 s, cerca de 10,9 MB, decodifica sem erro.

## Revisão legal (subagente `revisor-legal`, 27/10/2026) e correções

| Ponto | O que o parecer apontou | O que foi feito |
| --- | --- | --- |
| **A1 (alta)** | O Chapa 77 mostrava fotos recortadas do cardápio impresso do negócio real, os 4 preços reais (R$ 39,90 / 69,90 / 58,90 / 58,90), o slogan e a faixa "Burgers ★ Steaks ★ Fries ★ Shakes" | Na captura, as fotos são trocadas pelos renders 3D da Growlift (`public/renders`). Os preços ficam escondidos, o slogan vira "Hambúrguer na chapa, do jeito da casa." e a faixa sai. Capturas, recortes, gravação e vídeo foram refeitos |
| **A2 (alta até provar)** | A foto "Camada por camada" e a cena da bebida da Fornada não têm origem comprovada | A Fornada aparece só pela tela de reserva do café, com toque no dia, rolagem e dois produtos adicionados. Não há nenhuma foto do site |
| B1 | O selo aparecia por 1 a 2 s | O selo fica na tela de 3,0 a 19,4 s |
| B2 | Subir o aviso na legenda | A legenda abre com "Quatro projetos conceito, com nomes fictícios. Não são clientes." (`05-reels/roteiros.md`) |
| B3 | Rótulo de IA | A legenda diz que o surfista foi gerado com IA. Ao postar, ativar o "Rótulo de IA" do Instagram |
| B4 | Música de conta comercial | Instrução corrigida em `05-reels/roteiros.md` |
| B5 | Busca no INPI dos nomes fictícios | **Pendente, com vocês** |
| B6 | "Ok" por escrito dos quatro donos | **Recomendado, com vocês** |
| B7 | "Litoral Norte" e o nome da cidade | Trocados por "litoral" nos quatro sites |
| B8 | Pedido de "quero igual ao do vídeo" | Orientação em `05-reels/roteiros.md` |
| B9 | Foto do dono ainda no repositório | A prévia v1 e as capturas v1 foram refeitas com o surfista genérico. **O repositório no GitHub é público** e os commits antigos ainda têm a foto. Recomendação: deixar o repositório privado. Apagar do histórico exige reescrever o git, e só deve ser feito se vocês pedirem |
| B10 | `marketing/apresentacao/deck-negocios.html` usa os nomes reais dos sites | Fora deste Reel e não alterado. Vale a mesma regra se for enviado a terceiros |

Ainda contêm material antigo, só para histórico e sem publicar: `keyframes/` (prévia parada da pré-produção, com as fotos do cardápio do Chapa 77 e da Fornada) e os recortes `fornada-folhado`, `fornada-paes` e `fornada-bebida`.
