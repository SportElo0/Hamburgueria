# Cuts the interface pieces the keyframes use out of the real captures, at full resolution.
# Boxes are in CSS pixels of the captured page; DPR is the capture's density.
#   python3 growlift-social/_fonte/reel-premium/v2/source/recortar.py
import json
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ASSETS = Path(__file__).resolve().parent.parent / 'assets'
OUT = ASSETS / '_recortes'
MAX_W = 2900

# name: (source, dpr, (left, top, right, bottom) in CSS px, what it is)
CUTS = {
    'salinho-titulo': ('salinho/pc4x-hero.png', 4, (58, 284, 388, 466), 'título do hero "Leve por natureza."'),
    'salinho-painel': ('salinho/pc4x-hero.png', 4, (1108, 182, 1388, 716), 'painel da peça com tamanho e reserva'),
    'salinho-botao': ('salinho/pc4x-hero.png', 4, (1120, 463, 1379, 530), 'botão "Reserve minha peça"'),
    'salinho-miniaturas': ('salinho/pc4x-hero.png', 4, (1118, 624, 1382, 714), 'seletor das 4 peças'),
    'salinho-cartao': ('salinho/pc4x-hero.png', 4, (16, 16, 1424, 884), 'hero inteiro, sem a margem creme da página'),
    'chapa77-burger': ('chapa77/pc4x-hero.png', 4, (430, 290, 990, 760), 'lanche do hero sobre o vermelho'),
    'swellclub-letras': ('swellclub/pc-rodape.png', 2, (95, 205, 1440, 492), 'nome gigante do rodapé'),
    'fornada-bebida': ('fornada/pc-historia-4.png', 2, (900, 40, 1420, 820), 'cena ilustrativa de chocolate quente (hero)'),
    'fornada-titulo': ('fornada/pc-vitrine.png', 2, (108, 108, 604, 296), 'título "O simples. Extraordinário."'),
    'fornada-folhado': ('fornada/pc-vitrine.png', 2, (546, 467, 998, 1071), 'foto "Camada por camada."'),
    'fornada-folhado-legenda': ('fornada/pc-vitrine.png', 2, (540, 1086, 770, 1144), 'legenda da foto'),
    'fornada-paes': ('fornada/pc-vitrine.png', 2, (115, 362, 516, 896), 'foto "Pães com personalidade."'),
}

OUT.mkdir(exist_ok=True)
manifest = {}
for name, (src, dpr, box, what) in CUTS.items():
    im = Image.open(ASSETS / src)
    px = tuple(round(v * dpr) for v in box)
    part = im.crop(px)
    if part.width > MAX_W:  # still over twice the size any frame shows it at
        part = part.resize((MAX_W, round(part.height * MAX_W / part.width)), Image.LANCZOS)
    part.save(OUT / f'{name}.png')
    manifest[name] = {'origem': src, 'caixa_css': box, 'dpr': dpr, 'tamanho_px': part.size, 'o_que_e': what}
    print(name, part.size)
(OUT / 'recortes.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
