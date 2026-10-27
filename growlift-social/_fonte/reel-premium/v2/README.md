# Reel "Sua marca merece mais." · pré-produção v2

Fase: **pré-produção visual para aprovação.** Sem animação, sem MP4 e sem crédito do Higgsfield.

## Abrir e avaliar

1. **Prévia navegável:** `previews/storyboard-preview.html`. Abra no navegador; funciona sem internet porque os quadros estão dentro do arquivo. Use ← e → para trocar de quadro, ou "Tocar com o tempo do vídeo" (espaço) para passar com os tempos do Reel. Ao lado aparece a ficha de cada quadro.
2. **Prancha:** `previews/storyboard-contact-sheet.png`, com os 13 quadros em ordem, tempos, projeto, texto e a faixa de cor dos 25 s.
3. **Antes e depois:** `previews/antes-depois.png` (v1 × v2, cena por cena).
4. **Quadros em tamanho real:** `keyframes/01…13.png` (1080×1920).

## Documentos

- `audit.md`: o que havia, os problemas (A a L), o que foi corrigido e a pendência dos nomes.
- `creative-brief.md`: público, mensagem, peso de cada projeto e sistema visual.
- `storyboard.md`: roteiro de 25 s e storyboard segundo a segundo.
- `storyboard.json`: ficha de cada quadro (objetivo, câmera, profundidade, entrada, saída, elemento que liga, técnica, arquivos de origem, status).
- `motion-plan.md`: as 5 transições, a ferramenta recomendada e o plano do Higgsfield.
- `asset-manifest.json`: cada asset com a origem real.

## Refazer

```
node growlift-social/_fonte/reel-premium/v2/source/capturar.mjs          # capturas de seção + gravações (~10 min)
SO_HERO4=1 node growlift-social/_fonte/reel-premium/v2/source/capturar.mjs   # só os heroes a 4×
python3 growlift-social/_fonte/reel-premium/v2/source/recortar.py         # recortes de interface
node growlift-social/_fonte/reel-premium/v2/source/keyframes.mjs [03 08]  # quadros (todos ou alguns)
node growlift-social/_fonte/reel-premium/v2/source/pranchas.mjs           # prancha, antes/depois e prévia
python3 growlift-social/_fonte/reel-premium/v2/source/manifesto.py        # asset-manifest.json
```

As capturas brutas (`assets/<site>/*.png`, `*.mp4`) não vão para o git porque são grandes e se refazem com o primeiro comando. No git ficam os recortes usados, as peças da Salinho, a marca, as fontes, os quadros e as pranchas.

A v1 continua intacta em `../styleframes/` para comparação.
