# Reel 36: corta a narração do Antônio (ElevenLabs, voz "Carlos", voz36/original.mp3) em frases, deixa mais ágil
# (atempo), encaixa cada frase no segundo da cena e mistura com o som de cinema (som-36.mp3), abaixando a trilha
# quando a voz fala. Saída: narracao-36-eleven.mp3 (já com a trilha), que o render.mjs usa como AUDIO.
#   python3 mix36.py
import subprocess

SRC = 'voz36/original.mp3'
# (trechos do original em segundos, velocidade, onde entra no vídeo, texto da legenda)
FRASES = [
    ([(0.00, 1.68)], 1.06, 0.20, 'Existe uma skill...'),
    ([(2.12, 3.46), (3.76, 6.18)], 1.20, 1.95, 'que foi instalada mais de 4,5 milhões de vezes.'),
    ([(6.42, 8.02)], 1.20, 5.12, 'Ela não escreve código.'),
    ([(8.22, 9.28)], 1.08, 6.50, 'Não faz site.'),
    ([(9.50, 10.66)], 1.08, 7.52, 'Não cria imagem.'),
    ([(10.76, 11.62)], 1.00, 8.88, 'Ela acha.'),
    ([(11.96, 13.45)], 1.05, 11.40, 'São milhares de skills...'),
    ([(14.09, 15.88)], 1.05, 13.10, 'E você não sabe qual é a sua.'),
    ([(16.22, 17.71)], 1.05, 17.40, 'Ela procura por você...'),
    ([(18.05, 19.42)], 1.05, 22.75, '...e acha a certa.'),
    ([(19.86, 22.75), (23.00, 24.79)], 1.10, 25.30, 'Segue a Growlift e comenta SKILL, que a gente te manda no privado.'),
]

parts, labels = [], []
for i, (trechos, vel, inicio, _) in enumerate(FRASES):
    segs = []
    for j, (a, b) in enumerate(trechos):
        segs.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.04:.3f}:d=0.04[s{i}_{j}]')
    concat = ''.join(f'[s{i}_{j}]' for j in range(len(trechos)))
    segs.append(f'{concat}concat=n={len(trechos)}:v=0:a=1,atempo={vel},adelay={int(inicio * 1000)}|{int(inicio * 1000)}[f{i}]')
    parts += segs; labels.append(f'[f{i}]')

voz = ';'.join(parts) + f";{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:30," \
    "highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,equalizer=f=3200:t=q:w=1.2:g=2.5,volume=1.6[voz]"
filtro = voz + ";[voz]asplit=2[v1][v2];[1:a]volume=0.95[trilha];[trilha][v1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck];" \
    "[duck][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-i', 'som-36.mp3', '-filter_complex', filtro, '-map', '[out]',
                '-ar', '48000', '-ac', '2', '-b:a', '192k', 'narracao-36-eleven.mp3'], check=True)
print('narracao-36-eleven.mp3')
for _, vel, inicio, txt in FRASES:
    print(f'{inicio:5.2f}  {txt}')
