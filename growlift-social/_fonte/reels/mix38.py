# Reel 38: corta a voz (voz38/original.mp3) em frases, encurta pausas internas, acelera um pouco, encaixa uma atrás
# da outra e mistura com a trilha (som-38.mp3, se existir). Gera tempos38.json e narracao-38-eleven.mp3.
import subprocess, json, os, sys, tempfile
SRC = 'voz38/original.mp3'; VEL = 1.15
FR = [('sozinho', 0.00, 5.10, .3), ('cinquenta', 5.67, 10.59, .3), ('atendente', 11.20, 16.07, .35), ('ia', 16.72, 22.80, .3),
      ('filtro', 23.98, 31.80, .35), ('agenda', 32.77, 35.22, .3), ('lembrete', 36.07, 39.15, .35), ('some', 39.42, 40.77, .3),
      ('retoma', 41.63, 44.72, .4), ('junto', 45.67, 51.03, .45), ('segue', 52.57, 56.84, 0)]
tmp = tempfile.mkdtemp()
t = 0.15; tempos = {}; files = []
for i, (k, a, b, gap) in enumerate(FR):
    f = os.path.join(tmp, f'{i}.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SRC, '-af',
                    f'atrim={a}:{b},asetpts=PTS-STARTPTS,silenceremove=stop_periods=-1:stop_duration=0.28:stop_threshold=-38dB:stop_silence=0.16,atempo={VEL},afade=t=in:d=0.015',
                    '-ar', '48000', '-ac', '1', f], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
    tempos[k] = round(t, 2); files.append((f, t)); t += d + gap
tempos['fim'] = round(t + 2.0, 2); DUR = tempos['fim']
json.dump(tempos, open('tempos38.json', 'w'))
ins = sum([['-i', f] for f, _ in files], [])
parts = [f'[{i}:a]adelay={int(s*1000)}|{int(s*1000)}[f{i}]' for i, (_, s) in enumerate(files)]
voz = ';'.join(parts) + f";{''.join(f'[f{i}]' for i in range(len(files)))}amix=inputs={len(files)}:normalize=0,apad,atrim=0:{DUR},highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=8:release=120,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.2:g=3,volume=2.1[voz]"
n = len(files)
if os.path.exists('som-38.mp3'):
    filtro = voz + f";[voz]asplit=2[v1][v2];[{n}:a]volume=0.55[tr];[tr][v1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck];[duck][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-i', 'som-38.mp3', '-filter_complex', filtro, '-map', '[out]', '-ar', '48000', '-ac', '2', '-b:a', '192k', 'narracao-38-eleven.mp3'], check=True)
print(json.dumps(tempos))
