# Narração do Reel 10 (pedido na mesa). Voz Piper pt_BR, gratuita e local (rhasspy/piper-voices).
#   pip install piper-tts
#   baixe pt_BR-faber-medium.onnx e .onnx.json de huggingface.co/rhasspy/piper-voices (pt/pt_BR/faber/medium)
#   python3 narracao-10.py faber   → faber-0.wav … (cada fala ajustada ao tempo da cena)
# Depois: cada fala entra no seu segundo com adelay, mistura, compressão leve e loudnorm -16 LUFS (ffmpeg),
# e o áudio vai para 10-pedido-na-mesa-narrado.mp4. "Scale" está escrito "Iskêiu" para a voz falar como no Brasil.
import sys, wave, json
from piper import PiperVoice, SynthesisConfig
voice_name = sys.argv[1] if len(sys.argv) > 1 else 'faber'
v = PiperVoice.load(f'pt_BR-{voice_name}-medium.onnx')
LINES = [
  (0.3, 3.9, 'Salão cheio, garçom correndo, e a mesa esperando para pedir.'),
  (4.3, 2.6, 'Agora, o cliente lê o QR da mesa.'),
  (7.4, 6.4, 'E pede pelo celular. Sem baixar aplicativo, sem cadastro.'),
  (14.2, 2.0, 'O pedido vai direto para a cozinha.'),
  (16.5, 5.3, 'O amigo entra com o código da mesa, e tudo cai na mesma conta.'),
  (22.4, 5.6, 'O garçom confirma a mesa e atende os chamados.'),
  (28.4, 2.8, 'Depois, libera a mesa.'),
  (31.4, 3.9, 'Pedido na mesa, sem aplicativo. Plano Iskêiu, em breve.'),
]
out = []
for i, (start, slot, text) in enumerate(LINES):
    scale = 1.05
    for _ in range(8):
        f = f'{voice_name}-{i}.wav'
        with wave.open(f, 'wb') as w:
            v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=scale))
        with wave.open(f) as w:
            dur = w.getnframes() / w.getframerate()
        if dur <= slot or scale <= 0.8: break
        scale = max(0.8, scale * slot / dur * 0.98)
    out.append({'file': f, 'start': start, 'dur': round(dur, 2), 'slot': slot, 'scale': round(scale, 2)})
print(json.dumps(out, indent=1))
