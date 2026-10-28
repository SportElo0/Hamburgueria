# Downloads the official photos and videos from the current Bacchi site (clipsbacchi.com.br) and writes
# web versions to public/: WebP for photos, H.264 + WebM for the hero and section videos.
# Nothing here is generated or retouched: the files are resized and re-encoded only.
#   python3 scripts/imagens.py            (needs Pillow and ffmpeg; downloads are cached in .cache-imagens/)
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public'
CACHE = ROOT / '.cache-imagens'
BASE = 'https://clipsbacchi.com.br/website/wp-content/uploads/'

# destination (under public/img) → source path under wp-content/uploads, max width
FOTOS = {
    # brand
    'marca/logo-azul.png': ('2023/10/Logotipo-Bacchi-H200.png', None),
    'marca/logo-branco.png': ('2023/10/Logotipo-Bacchi-curva-branco-300.png', None),
    'marca/avatar.png': ('2023/10/avatar-bacchi.png', None),
    # history (Santo André) and production (photos by Eduardo Sardinha, published on the current site)
    **{f'historia/historica-{i:02d}.webp': (f'2023/10/clips-bacchi-fotos-historicas-{i:02d}.jpg', 1600) for i in range(1, 10)},
    'historia/papelaria-antiga-pb.webp': ('2023/10/1-historia-producao-clips-bacchi-1-1.jpg', 1500),
    'historia/papelaria-antiga.webp': ('2023/10/1-historia-producao-clips-bacchi-1.jpg', 1500),
    'historia/cartao-santo-andre-pb.webp': ('2023/10/2-historia-producao-clips-bacchi-4-1.jpg', 1500),
    'historia/cartao-santo-andre.webp': ('2023/10/2-historia-producao-clips-bacchi-4.jpg', 1500),
    'historia/embalagens-antigas-pb.webp': ('2023/10/3-historia-producao-clips-bacchi-2-1.jpg', 1500),
    'historia/embalagens-antigas.webp': ('2023/10/3-historia-producao-clips-bacchi-2.jpg', 1500),
    'fabrica/maquinas-pb.webp': ('2023/10/historia-producao-clips-bacchi-6-1.jpg', 1500),
    'fabrica/maquinas.webp': ('2023/10/historia-producao-clips-bacchi-6.jpg', 1500),
    'fabrica/maquinas-2.webp': ('2023/10/historia-producao-clips-bacchi-7.jpg', 1500),
    'fabrica/ferramental.webp': ('2023/10/historia-producao-clips-bacchi-5.jpg', 1500),
    'fabrica/arame.webp': ('2023/10/producao-clips-bacchi-1-eduardo-sardinha.jpg', 1500),
    'fabrica/clips-saindo.webp': ('2023/10/producao-clips-bacchi-11-eduardo-sardinha.jpg', 1500),
    'fabrica/embalagem-linha.webp': ('2023/10/producao-clips-bacchi-12-eduardo-sardinha.jpg', 1500),
    'fabrica/caixas-amarelas.webp': ('2023/10/producao-clips-bacchi-13-eduardo-sardinha.jpg', 1500),
    'fabrica/embaladora.webp': ('2023/10/producao-clips-bacchi-14-eduardo-sardinha.jpg', 1500),
    'fabrica/caixas-fileira.webp': ('2023/10/producao-clips-bacchi-16-eduardo-sardinha.jpg', 1500),
    'fabrica/expedicao.webp': ('2023/10/producao-clips-bacchi-18-eduardo-sardinha.jpg', 1500),
    'fabrica/caixa-master.webp': ('2023/10/producao-clips-bacchi-19-eduardo-sardinha.jpg', 1500),
    'fabrica/estampo.webp': ('2023/10/producao-clips-bacchi-9-eduardo-sardinha.jpg', 1500),
    'fabrica/clips-geral.webp': ('2023/10/clips-geral-historia-producao-clips-bacchi-3-eduardo-sardinha.jpg', 1600),
    'fabrica/clips-coloridos-geral.webp': ('2023/10/historia-producao-clips-bacchi-clips-colorido-geral-3-eduardo-sardinha.jpg', 1600),
    # category banners (wide)
    'categorias/clips-coloridos.webp': ('2023/10/clips-coloridos-bacchi-CATEGORIA-2.jpg', 1600),
    'categorias/clips-dourados.webp': ('2023/10/clips-latonados-dourados-bacchi-CATEGORIA.jpg', 1600),
    'categorias/alfinetes-seguranca.webp': ('2024/03/alfinetes-de-seguranca-clips-bacchi-CATEGORIA-2.jpg', 1600),
    'categorias/alfinetes-mapa.webp': ('2023/10/alfinetes-para-mapa-clips-bacchi-CATEGORIA-2.jpg', 1000),
    'categorias/colchetes.webp': ('2023/10/colchetes-clips-bacchi-CATEGORIA-2.jpg', 1000),
    'categorias/encadernadores.webp': ('2023/10/encadernadores-para-pastas-clips-bacchi-CATEGORIA-2.jpg', 1000),
    'categorias/percevejos.webp': ('2023/10/percevejos-clips-bacchi-CATEGORIA-2.jpg', 1600),
    'categorias/extrator.webp': ('2023/10/extrator-capa-clips-bacchi.jpg', 1600),
    'categorias/clips-690.webp': ('2024/03/clips-bacchi-690.jpg', 1600),
    # product covers (square, studio)
    'produtos/clips-niquelado.webp': ('2023/10/clips-NIQUELADO-bacchi-CAPA.jpg', 1000),
    'produtos/clips-colorido.webp': ('2023/10/clips-colorido-bacchi-CAPA.jpg', 1000),
    'produtos/clips-coloridos.webp': ('2023/10/clips-coloridos-bacchi-CAPA.jpg', 1000),
    'produtos/clips-dourados.webp': ('2023/10/clips-latonados-dourados-bacchi-CAPA.jpg', 1000),
    'produtos/clips-10-0.webp': ('2023/10/clips-10-0-linha-premium-clips-bacchi.jpg', 1000),
    'produtos/clips-leve.webp': ('2023/10/clips-LEVE-bacchi-CAPA.jpg', 1000),
    'produtos/clips-leve-caixa.webp': ('2023/10/clips-galvanizados-linha-leve-bacchi-170-8-0.jpg', 1000),
    'produtos/clips-caixa-premium.webp': ('2023/10/clips-galvanizados-linha-premium-caixa-grande-bacchi-720-2-0-00.jpg', 1000),
    'produtos/clips-blister.webp': ('2023/10/clips-coloridos-bacchi-cx-blister-box-2-0.jpg', 1000),
    'produtos/clips-caixa-plastica.webp': ('2023/10/clips-latonados-dourados-bacchi-cx-plastica-200-5.jpg', 1000),
    'produtos/grampos-26.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-26-CAPA.jpg', 1000),
    'produtos/grampos-23.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-23-CAPA.jpg', 1000),
    'produtos/grampos-24.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-24-CAPA.jpg', 1000),
    'produtos/grampos-106.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-106-CAPA.jpg', 1000),
    'produtos/grampos-a13.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-A13-CAPA.jpg', 1000),
    'produtos/grampos-catu.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-CATU-CAPA.jpg', 1000),
    'produtos/grampos-puncar.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-PUNCAR-MAX-CAPA.jpg', 1000),
    'produtos/grampos-sp3.webp': ('2023/10/grampos-para-grampeadores-clips-bacchi-LINHA-SP3-CAPA.jpg', 1000),
    'produtos/grampos-tot.webp': ('2023/10/grampos-para-grampeadores-tot-clips-bacchi-CAPA.jpg', 1000),
    'produtos/grampos-caixa.webp': ('2023/10/grampos-para-grampeadores-linha-26-clips-bacchi-26-6-galvanizado-5000.jpg', 1000),
    'produtos/grampos-cobreado-caixa.webp': ('2023/10/grampos-para-grampeadores-linha-26-clips-bacchi-26-6-cobreado-5000.jpg', 1000),
    'produtos/grampos-trancados.webp': ('2023/10/grampos-trancados-clips-bacchi-CAPA.jpg', 1000),
    'produtos/grampos-trancados-caixa.webp': ('2023/10/grampos-trancados-clips-bacchi-2-GALVANIZADO-50.jpg', 1000),
    'produtos/alfinetes-costura.webp': ('2023/10/alfinete-para-costura-em-aco-niquelado-clips-bacchi-SOBRA.jpg', 1000),
    'produtos/alfinetes-seguranca.webp': ('2023/10/alfinetes-de-seguranca-clips-bacchi-CAPA.jpg', 1000),
    'produtos/alfinetes-seguranca-caixa.webp': ('2023/10/alfinetes-de-seguranca-clips-bacchi-2-100-niquelado.jpg', 1000),
    'produtos/alfinetes-seguranca-dourado.webp': ('2023/10/alfinetes-de-seguranca-clips-bacchi-000-100-DOURADO.jpg', 1000),
    'produtos/suporte-etiquetas.webp': ('2023/10/suporte-para-etiquetas-clips-bacchi-CAPA.jpg', 1000),
    'produtos/suporte-etiquetas-simples.webp': ('2023/10/suporte-para-etiquetas-clips-bacchi-aro-simples.jpg', 1000),
    'produtos/suporte-etiquetas-duplo.webp': ('2023/10/suporte-para-etiquetas-clips-bacchi-aro-duplo.jpg', 1000),
    'produtos/alfinetes-mapa.webp': ('2023/10/alfinetes-para-mapa-clips-bacchi-CAPA.jpg', 1000),
    'produtos/alfinetes-mapa-sortidos.webp': ('2023/10/alfinetes-para-mapa-clips-bacchi-sortidos-caixa-plastica.jpg', 1000),
    'produtos/encadernadores-metal.webp': ('2023/10/encadernadores-para-pastas-clips-bacchi-trilho-metal-produto.jpg', 1600),
    'produtos/encadernadores-preto.webp': ('2023/10/encadernadores-para-pastas-clips-bacchi-grampo-plastico-preto-produto.jpg', 1600),
    'produtos/encadernadores-branco-pacote.webp': ('2023/10/encadernadores-para-pastas-clips-bacchi-branco-10.jpg', 1000),
    'produtos/colchetes.webp': ('2023/10/colchetes-clips-bacchi-CAPA.jpg', 1000),
    'produtos/colchetes-caixa.webp': ('2023/10/colchetes-clips-bacchi-9.jpg', 1000),
    'produtos/pranchetas.webp': ('2023/10/pranchetas-clips-bacchi.jpg', 1000),
    'produtos/extrator.webp': ('2023/10/extratores-de-grampo-espatulas-clips-bacchi-CAPA.jpg', 1000),
    'produtos/extrator-pacote.webp': ('2023/10/extratores-de-grampo-espatulas-clips-bacchi-PACOTE.jpg', 1000),
    'produtos/percevejos.webp': ('2023/10/percevejos-clips-bacchi-CAPA.jpg', 1000),
    'produtos/percevejos-caixa.webp': ('2023/10/percevejos-clips-bacchi-2-latonado-caixa-cartao.jpg', 1000),
    'produtos/caixa-master.webp': ('2023/11/caixa-master-clips-bacchi-quadrada.jpg', 900),
}

# destination stem (under public/video) → source, start (s), length (s), width
VIDEOS = {
    'clips-macro': ('2023/10/clips-bacchi-eduardo-sardinha.mp4', 2.0, 14.0, 1280),
    'clips-monte': ('2023/10/clips-bacchi.mp4', 0.0, 8.0, 960),
    'produtos-montagem': ('2024/03/Beatleap-80047AE7-551E-489E-BA35-50EB24C3A1B2-2.mp4', 0.0, 15.0, 1280),
}


def baixar(src: str) -> Path:
    alvo = CACHE / src.replace('/', '_')
    if not alvo.exists():
        CACHE.mkdir(exist_ok=True)
        req = urllib.request.Request(BASE + src, headers={'User-Agent': 'Mozilla/5.0 (site Bacchi, imagens oficiais)'})
        with urllib.request.urlopen(req, timeout=120) as r, open(alvo, 'wb') as f:
            shutil.copyfileobj(r, f)
    return alvo


def main() -> None:
    for dest, (src, largura) in FOTOS.items():
        alvo = OUT / 'img' / dest
        alvo.parent.mkdir(parents=True, exist_ok=True)
        im = Image.open(baixar(src))
        if largura and im.width > largura:
            im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
        if dest.endswith('.png'):
            im.save(alvo, optimize=True)
        else:
            im.convert('RGB').save(alvo, 'WEBP', quality=82, method=6)
        print(f'{dest}: {im.width}×{im.height}, {alvo.stat().st_size // 1024} KB')

    (OUT / 'video').mkdir(parents=True, exist_ok=True)
    for stem, (src, ini, dur, largura) in VIDEOS.items():
        origem = baixar(src)
        base = ['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ini), '-t', str(dur), '-i', str(origem), '-an', '-vf', f'scale={largura}:-2,fps=30']
        subprocess.run([*base, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUT / 'video' / f'{stem}.mp4')], check=True)
        subprocess.run([*base, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', str(OUT / 'video' / f'{stem}.webm')], check=True)
        # poster: first frame, shown before the video plays and when motion is reduced
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ini + 0.2), '-i', str(origem), '-frames:v', '1', '-vf', f'scale={largura}:-2', str(OUT / 'video' / f'{stem}.jpg')], check=True)
        Image.open(OUT / 'video' / f'{stem}.jpg').save(OUT / 'video' / f'{stem}.webp', 'WEBP', quality=80)
        (OUT / 'video' / f'{stem}.jpg').unlink()
        print(f'video/{stem}: mp4 {(OUT / "video" / f"{stem}.mp4").stat().st_size // 1024} KB, webm {(OUT / "video" / f"{stem}.webm").stat().st_size // 1024} KB')

    # The catalogue for download is the client's file "Catálogo Bacchi (novo).pdf" (1.5 MB, same pages as the
    # 17 MB PDF on the current site), kept in assets/; copied here so the site serves it.
    shutil.copy(ROOT / 'assets' / 'catalogo-bacchi.pdf', OUT / 'catalogo-bacchi.pdf')
    print('catalogo-bacchi.pdf copiado')


if __name__ == '__main__':
    sys.exit(main())
