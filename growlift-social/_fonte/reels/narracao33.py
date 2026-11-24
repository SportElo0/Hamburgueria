# Narração do Reel 33 (versão 3): cada fala no mesmo segundo da fala do vídeo de referência, com vozes brasileiras
# gratuitas e locais (Piper pt_BR: rhasspy/piper-voices). Narrador = cliente; garçom; garçonete (voz do garçom com o tom
# subido, estilo desenho). Cada fala é ajustada para caber no seu tempo. Gera narracao-33-eleven.mp3 (nome que o
# render usa) e voz33/falas.json (início e fim reais de cada fala, para as legendas).
#   python3 narracao33.py <pasta-dos-modelos> [voz_narrador] [voz_garcom]
import sys, wave, json, subprocess, os
from piper import PiperVoice, SynthesisConfig
MOD = sys.argv[1]; NARR = sys.argv[2] if len(sys.argv) > 2 else 'cadu'; GARC = sys.argv[3] if len(sys.argv) > 3 else 'jeff'
FALAS = [
  (0.00, 2.2, 'N', 'Meia hora com a mão levantada!'),
  (2.30, 1.4, 'W', 'Já tô indo aí!'),
  (4.10, 1.4, 'N', 'Uma estrela.'),
  (5.85, 1.45, 'G', 'Pera, pera, pera!'),
  (7.40, 1.65, 'N', 'Faz meia hora que eu quero pedir.'),
  (9.10, 3.4, 'N', 'E a culpa nem é do garçom: são dez mesas e duas mãos.'),
  (12.60, 2.3, 'N', 'Seu QR me mostra um PDF.'),
  (15.00, 1.3, 'N', 'Olha o que esse aqui faz.'),
  (16.55, 1.9, 'N', 'Eu escaneio e já tenho o cardápio.'),
  (18.45, 1.15, 'N', 'Sem baixar nada.'),
  (19.62, 3.3, 'N', 'Se não sei o que pedir, vejo a foto de cada prato.'),
  (22.95, 3.7, 'N', 'E antes de pedir, vejo ele em cima da minha mesa.'),
  (26.76, 1.25, 'N', 'Peço agora.'),
  (29.16, 2.4, 'N', 'Chegou sozinho, com o número da minha mesa.'),
  (32.44, 1.1, 'W', 'Com licença!'),
  (33.68, 1.5, 'W', 'Hambúrguer clássico.'),
  (35.40, 2.1, 'N', 'Hmm... que delícia!'),
  (37.78, 2.15, 'N', 'E a conta? Não espero: pago aqui.'),
  (40.30, 1.7, 'N', 'Sem esperar ninguém.'),
  (42.18, 3.3, 'N', 'Comi muito bem: cinco estrelas. No Google.'),
  (45.80, 2.3, 'N', 'E agora há pouco eu ia dar uma.'),
  (48.16, 4.7, 'N', 'A mesma mesa. O mesmo lanche. Quatro estrelas de diferença.'),
  (52.96, 2.0, 'N', 'Manda pra aquele amigo que tem restaurante.'),
  (55.04, 4.2, 'N', 'E se o restaurante é seu: comenta três dê, que a gente te manda a demonstração.'),
]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voz33')
os.makedirs(OUT, exist_ok=True)
vozes = {'N': PiperVoice.load(f'{MOD}/pt_BR-{NARR}-medium.onnx'), 'W': PiperVoice.load(f'{MOD}/pt_BR-{GARC}-medium.onnx')}
vozes['G'] = vozes['W']
info = []
for i, (ini, slot, quem, txt) in enumerate(FALAS):
    v = vozes[quem]; f = f'{OUT}/f{i:02d}.wav'
    scale = 0.95
    for _ in range(10):
        with wave.open(f, 'wb') as w: v.synthesize_wav(txt, w, syn_config=SynthesisConfig(length_scale=scale))
        with wave.open(f) as w: dur = w.getnframes() / w.getframerate()
        if dur <= slot or scale <= 0.72: break
        scale *= max(0.9, slot / dur)
    if quem == 'G':  # garçonete: tom mais agudo, como personagem de desenho
        g = f'{OUT}/f{i:02d}g.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'asetrate=22050*1.32,aresample=22050,atempo=0.86', g], check=True)
        os.replace(g, f)
        with wave.open(f) as w: dur = w.getnframes() / w.getframerate()
    info.append({'ini': ini, 'fim': round(ini + dur, 2), 'quem': quem, 'texto': txt})
# mix: each line at its second, light compression and loudness
inputs, filt = [], []
for i, it in enumerate(info):
    inputs += ['-i', f'{OUT}/f{i:02d}.wav']
    ms = int(it['ini'] * 1000)
    filt.append(f'[{i}:a]adelay={ms}|{ms},aresample=44100[a{i}]')
filt.append(''.join(f'[a{i}]' for i in range(len(info))) + f'amix=inputs={len(info)}:normalize=0,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-16:TP=-1.5[o]')
dst = os.path.join(os.path.dirname(OUT), 'narracao-33-eleven.mp3')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filt), '-map', '[o]', '-c:a', 'libmp3lame', '-b:a', '192k', dst], check=True)
json.dump(info, open(f'{OUT}/falas.json', 'w'), ensure_ascii=False, indent=1)
print(dst, len(info))
