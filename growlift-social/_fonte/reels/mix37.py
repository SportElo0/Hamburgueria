# Reel 37: corta a voz (ElevenLabs "Matheus", voz37/original.mp3) em frases, tira o "GTA 6" que saiu estranho na voz
# (a tela mostra "GTA 6" grande nesse momento), encaixa frase a frase com pausas e mistura com o som (som-37.mp3).
# Gera narracao-37-eleven.mp3 e tempos37.json (início de cada frase no vídeo), que o reel37.mjs usa.
import subprocess, json
SRC = 'voz37/original.mp3'
SRC2 = 'voz37/corrigido.mp3'  # só o "Foi o tempo que o mundo esperou pelo GTA 6", que aqui saiu certo
VEL = 1.1
# (chave, início, fim no original, pausa depois)
FR = [('treze', 0.00, 0.86, .35), ('esperou', [(1.60, 4.36), (4.64, 5.47)], None, .35), ('lancou', 5.76, 8.90, .35), ('porque', 9.30, 10.03, .45),
      ('perdido', 10.62, 12.98, .25), ('mapa', 13.50, 14.76, .2), ('missao', 15.21, 17.30, .2), ('responde', 17.80, 18.93, .35),
      ('cliente', 19.42, 23.64, .3), ('msg', 24.15, 26.25, .3), ('liga', 26.88, 30.22, .3), ('orc', 30.83, 33.18, .35),
      ('prende', 33.85, 36.43, .35), ('segue', 36.84, 40.34, 0)]
t = 0.15; tempos = {}; parts = []; labels = []
for i, (k, a, b, gap) in enumerate(FR):
    tempos[k] = round(t, 2)
    src = 1 if k == 'esperou' else 0
    trechos = a if isinstance(a, list) else [(a, b)]
    segs = []
    for j, (x, y) in enumerate(trechos):
        parts.append(f'[{src}:a]atrim={x}:{y},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={y-x-0.03:.3f}:d=0.03[s{i}_{j}]')
        segs.append(f'[s{i}_{j}]')
    eco = ',apad=pad_dur=1.6,aecho=0.8:0.75:320|640:0.45|0.25' if k == 'treze' else ''
    parts.append(f"{''.join(segs)}concat=n={len(segs)}:v=0:a=1,atempo={VEL}{eco},adelay={int(t*1000)}|{int(t*1000)}[f{i}]")
    labels.append(f'[f{i}]')
    d = sum(y - x for x, y in trechos) / VEL
    if k == 'esperou': tempos['gta'] = round(t + (3.81 - 1.60) / VEL, 2)
    t += d + gap
tempos['fim'] = round(t + 1.6, 2)
DUR = tempos['fim']
voz = ';'.join(parts) + f";{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{DUR},highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.2:g=3.5,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=90,volume=2.1[voz]"
filtro = voz + ";[voz]asplit=2[v1][v2];[2:a]volume=0.55[tr];[tr][v1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck];[duck][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
json.dump(tempos, open('tempos37.json', 'w'))
import os
if os.path.exists('som-37.mp3'):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-i', SRC2, '-i', 'som-37.mp3', '-filter_complex', filtro, '-map', '[out]', '-ar', '48000', '-ac', '2', '-b:a', '192k', 'narracao-37-eleven.mp3'], check=True)
else:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-i', SRC2, '-filter_complex', voz, '-map', '[voz]', '-ar', '48000', '-ac', '2', '-b:a', '192k', 'voz37/so-voz.mp3'], check=True)
print(json.dumps(tempos))
