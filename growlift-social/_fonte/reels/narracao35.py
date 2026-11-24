# Narração do Reel 35: voz brasileira grátis e local (Piper pt_BR "faber", escolhida pelo Antônio em 24/11; rhasspy/piper-voices).
# Cada fala ganha um tratamento para soar menos robótica: tom 4% mais grave, mais corpo nos graves, presença e compressão.
#   python3 narracao35.py <pasta-dos-modelos> [voz]
# Gera cada fala, mede a duração, junta com pausas e escreve narracao-35-eleven.mp3 (nome que o render usa) e
# voz35/tempos.json: o segundo em que começa cada cena, para o vídeo acompanhar a fala.
import sys, wave, json, subprocess, os
from piper import PiperVoice, SynthesisConfig
MOD = sys.argv[1]; VOZ = sys.argv[2] if len(sys.argv) > 2 else 'faber'
# Escrito como se fala no Brasil: "ChatGPT" = chat gê pê tê; "IA" = i á; "SEO" = ésse ê ó.
CENAS = [
  ('hook', 'Pergunta pro chat gê pê tê quem é o melhor do seu ramo, na sua cidade. Você aparece?'),
  ('s1', 'Em geral, a i á cita quem ela consegue ler e confirmar. Quatro coisas que pouca gente sabe.'),
  ('L1', 'Um. São três robôs, não um. Bloquear o errado pode tirar o seu site das respostas.'),
  ('L2', 'Dois. Ela copia trechos, não páginas. Resposta na primeira frase, e tabela de comparação.'),
  ('L3', 'Três. Ela cita quem os outros citam. Avaliações, guias da cidade, diretórios.'),
  ('L4', 'Quatro. Uma pergunta não prova nada. Teste de dez a vinte perguntas, várias vezes.'),
  ('skill', 'A skill êi ai, ésse ê ó, do Córi Hêinz, te guia nessa auditoria. É grátis, no GitHub.'),
  ('cred', 'Ninguém controla a resposta da i á: ela mostra o que melhorar, não garante posição.'),
  ('fim', 'Comenta i á, que a gente te manda o passo a passo.'),
]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voz35'); os.makedirs(OUT, exist_ok=True)
v = PiperVoice.load(f'{MOD}/pt_BR-{VOZ}-medium.onnx')
t = 0.25; info = []; ins = []; filt = []
for i, (cena, txt) in enumerate(CENAS):
    f = f'{OUT}/f{i:02d}.wav'
    with wave.open(f, 'wb') as w: v.synthesize_wav(txt, w, syn_config=SynthesisConfig(length_scale=0.88))
    g = f.replace('.wav', 'g.wav')
    sr = v.config.sample_rate
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', f'asetrate={int(sr*0.96)},aresample={sr},atempo={1/0.96:.5f},highpass=f=80,equalizer=f=150:t=q:w=1:g=3.5,equalizer=f=3200:t=q:w=1.1:g=2,acompressor=threshold=-22dB:ratio=3.5:attack=5:release=120,aecho=0.85:0.6:25:0.12', g], check=True)
    os.replace(g, f)
    with wave.open(f) as w: dur = w.getnframes() / w.getframerate()
    info.append({'cena': cena, 'ini': round(t, 2), 'fim': round(t + dur, 2), 'texto': txt})
    ins += ['-i', f]; ms = int(t * 1000)
    filt.append(f'[{i}:a]adelay={ms}|{ms},aresample=44100[a{i}]')
    t += dur + (0.40 if cena not in ("hook",) else 0.35)
total = info[-1]['fim']
filt.append(''.join(f'[a{i}]' for i in range(len(info))) + f'amix=inputs={len(info)}:normalize=0,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-16:TP=-1.5[o]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt), '-map', '[o]', '-ar', '44100', '-b:a', '128k', os.path.join(os.path.dirname(OUT), 'narracao-35-eleven.mp3')], check=True)
json.dump({'falas': info, 'fim_da_fala': total}, open(f'{OUT}/tempos.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(info, ensure_ascii=False)); print('fala termina em', total)
