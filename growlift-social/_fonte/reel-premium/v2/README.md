# Reel "Sua marca merece mais." · vídeo final

**Pronto para postar (depois da aprovação de vocês):** `growlift-social/05-reels/09-sua-marca-merece-mais.mp4`, com a capa `09-sua-marca-merece-mais-capa.png`. A legenda e o passo a passo para postar estão em `growlift-social/05-reels/roteiros.md`, item 9.

25 s · 1080×1920 · 30 fps · sem som (a música entra pelo Instagram). Nada foi publicado.

## Abrir e avaliar

1. **O vídeo:** `renders/sua-marca-merece-mais.mp4`, a mesma cópia que está em `05-reels/`.
2. **Prévia navegável:** `previews/storyboard-preview.html`. Abre no navegador sem internet. As setas ← e → trocam o quadro e a barra de espaço passa com os tempos do vídeo. Ao lado aparece a ficha de cada momento.
3. **Prancha:** `previews/storyboard-contact-sheet.png`, os 13 momentos tirados do vídeo, com tempo, projeto, texto e a faixa de cor.
4. **Antes e depois:** `previews/antes-depois.png`, a prévia v1 ao lado do vídeo final.
5. **Quadros em tamanho real:** `renders/quadros/01…13.png`.

## Documentos

- `storyboard.md`: o roteiro de 25 s e o que acontece segundo a segundo.
- `storyboard.json`: a ficha de cada momento.
- `motion-plan.md`: a ferramenta, as gravações dos sites, as 5 transições e o uso do Higgsfield.
- `audit.md`: o que havia, os problemas encontrados, o que foi corrigido (inclusive na conferência do vídeo) e a pendência dos nomes.
- `creative-brief.md`: público, mensagem, peso de cada projeto e sistema visual.
- `asset-manifest.json`: cada imagem e gravação, com a origem real.

## Refazer

```
node growlift-social/_fonte/reel-premium/v2/source/capturar.mjs          # capturas de seção (~10 min)
SO_HERO4=1 node growlift-social/_fonte/reel-premium/v2/source/capturar.mjs   # só os heroes a 4×
python3 growlift-social/_fonte/reel-premium/v2/source/recortar.py         # recortes de interface
node growlift-social/_fonte/reel-premium/v2/source/gravacoes.mjs          # gravações dos sites (~1 min)
node growlift-social/_fonte/reel-premium/v2/source/reel.mjs               # o vídeo (~1,5 min) e a capa
node growlift-social/_fonte/reel-premium/v2/source/reel.mjs 9.7 12.0      # só alguns quadros, para conferir
node growlift-social/_fonte/reel-premium/v2/source/reel.mjs --quadros     # os 13 momentos em renders/quadros
node growlift-social/_fonte/reel-premium/v2/source/pranchas.mjs           # prancha, antes/depois e prévia
python3 growlift-social/_fonte/reel-premium/v2/source/manifesto.py        # asset-manifest.json
```

Depois de refazer o vídeo, copiem `renders/sua-marca-merece-mais.mp4` e a capa para `05-reels/` com o nome `09-…`.

As gravações (`assets/_gravacoes/`) e as capturas brutas não vão para o git, porque são grandes e se refazem com os comandos acima. No git ficam o vídeo, a capa, os quadros, os recortes usados, a marca, as fontes e o surfista genérico.

**Pastas antigas:**
- `keyframes/` é a prévia parada da pré-produção, já aprovada.
- A v1 continua intacta em `../styleframes/`. Ela tem a foto do dono da Swell Club: não publicar.
