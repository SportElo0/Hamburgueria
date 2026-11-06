# Writes v2/asset-manifest.json: every asset of the Reel v2 with where it really came from.
#   python3 growlift-social/_fonte/reel-premium/v2/source/manifesto.py
import json
from pathlib import Path
from PIL import Image

V2 = Path(__file__).resolve().parent.parent
A = V2 / 'assets'
Image.MAX_IMAGE_PIXELS = None

SITES = {
    'salinho': {'nome_no_reel': 'Salinho', 'site_base': 'https://semvo-juquehy.pages.dev/pt/?loja=juquehy', 'feito_por': 'Growlift'},
    'chapa77': {'nome_no_reel': 'Chapa 77', 'site_base': 'https://downtown-burger-gilt.vercel.app', 'feito_por': 'Growlift'},
    'swellclub': {'nome_no_reel': 'Swell Club', 'site_base': 'https://surflife-juquehy.pages.dev/', 'feito_por': 'Growlift'},
    'fornada': {'nome_no_reel': 'Fornada', 'site_base': 'https://feito-a-mao-juquehy.pages.dev', 'feito_por': 'Growlift'},
}
KIND = {
    'pc4x-hero': 'hero no computador, 1440×900 a 4× (para recortes)', 'pc-hero': 'hero no computador, 1440×900 a 2×',
    'cel-hero': 'hero no celular, 390×844 a 3×', 'pc-rolagem': 'gravação da rolagem no computador (referência do movimento)',
}

def describe(f):
    stem = f.stem
    for k, v in KIND.items():
        if stem == k:
            return v
    dev = 'computador 2×' if stem.startswith('pc-') else 'celular 3×' if stem.startswith('cel-') else ''
    part = stem.split('-', 1)[-1]
    if part.startswith('historia-'):
        return f'momento {part.split("-")[1]} da história contada na rolagem ({dev})'
    if part.startswith('hero-peca-'):
        return f'hero depois de clicar na peça {part.split("-")[-1]} ({dev})'
    return f'seção "{part}" inteira ({dev})'

items = []
for site, meta in SITES.items():
    for f in sorted((A / site).rglob('*')):
        if f.is_dir() or f.name.startswith('.'):
            continue
        it = {'arquivo': str(f.relative_to(V2)), 'projeto': meta['nome_no_reel'], 'origem': meta['site_base'],
              'como': 'captura com Playwright, nome, logo e lugares trocados na página antes da foto (anonimizar.mjs)'}
        if f.parent.name == 'foto-generica':
            it.update(como='gerada no Higgsfield (gpt_image_2_5, 2k, qualidade alta, 2,75 créditos); prompt em growlift-social/08-prompts/prompts.md',
                      origem='imagem gerada por IA, pessoa que não existe', o_que_e='surfista genérico que substitui, só na captura, a foto do dono da loja')
        elif f.parent.name == 'pecas':
            it.update(como='arquivo de imagem do próprio site (peça com fundo transparente), baixado sem alteração',
                      origem=f"https://semvo-juquehy.pages.dev/assets/{f.name}", o_que_e='peça de linho')
        else:
            it['o_que_e'] = describe(f)
        if f.suffix == '.png':
            it['tamanho_px'] = Image.open(f).size
        items.append(it)

growlift = {
    'marca.svg': ('growlift/favicon.svg do repositório (o mesmo vetor do logotipo do site)', 'símbolo oficial da Growlift'),
    'pc-hero.png': ('https://growlift.com.br, captura 1440×900 a 2×', 'hero do site da Growlift'),
    'cel-hero.png': ('https://growlift.com.br, captura 390×844 a 3×', 'hero do site da Growlift no celular'),
    'marca-vidro-vertical.png': ('growlift-social/_fonte/assets/hd (gerada no Higgsfield a partir do logotipo; ver 08-prompts)', 'marca de vidro vertical'),
    'hero-video-quadro.png': ('quadro em 3,5 s de growlift/img/hero.mp4 (vídeo do site)', 'marca de vidro do vídeo do site'),
}
for name, (orig, what) in growlift.items():
    items.append({'arquivo': f'assets/growlift/{name}', 'projeto': 'Growlift', 'origem': orig, 'o_que_e': what})
items.append({'arquivo': 'assets/fontes/', 'projeto': 'Growlift', 'origem': 'growlift/fonts (Inter, licença OFL, a mesma do site)', 'o_que_e': 'fonte da marca'})

for d in sorted((A / '_gravacoes').glob('rec-*')):
    n = len(list(d.glob('*.jpg')))
    items.append({'arquivo': str(d.relative_to(V2)) + '/', 'projeto': d.name[4:], 'origem': SITES.get(d.name[4:], {}).get('site_base', ''),
                  'o_que_e': f'gravação quadro a quadro do site ({n} quadros, 30 por segundo), para o vídeo final',
                  'como': 'source/gravacoes.mjs: navegador de verdade, anonimizado como na captura; não vai para o git (refazer com o script)'})

cuts = json.loads((A / '_recortes' / 'recortes.json').read_text())
for name, c in cuts.items():
    items.append({'arquivo': f'assets/_recortes/{name}.png', 'projeto': name.split('-')[0], 'origem': f"assets/{c['origem']}",
                  'o_que_e': c['o_que_e'], 'como': f"recorte da captura (caixa CSS {c['caixa_css']}, {c['dpr']}×), sem alteração", 'tamanho_px': c['tamanho_px']})

(V2 / 'asset-manifest.json').write_text(json.dumps({
    'regra': 'Só capturas reais e arquivos dos próprios sites. Nenhuma interface gerada por IA, nenhum logo inventado. '
             'Os quatro sites aparecem como projetos conceito com nome fictício (CLAUDE.md, marcas de terceiros).',
    'como_refazer': ['node growlift-social/_fonte/reel-premium/v2/source/capturar.mjs', 'SO_HERO4=1 node …/capturar.mjs',
                     'python3 …/recortar.py', 'node …/keyframes.mjs', 'node …/pranchas.mjs', 'python3 …/manifesto.py'],
    'assets': items}, ensure_ascii=False, indent=2))
print(len(items), 'assets')
