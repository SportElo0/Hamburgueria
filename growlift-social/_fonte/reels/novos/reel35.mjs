// Reel 35 (24/11): "Você aparece no ChatGPT?". Skill da Semana, ep. 03: a skill "ai-seo" do Corey Haines (marketingskills,
// MIT, grátis no GitHub). Ensina 4 coisas pouco conhecidas sobre aparecer nas respostas de IA (os robôs diferentes do
// robots.txt, a IA copia trechos, cita quem os outros citam, testar várias vezes) e mostra o que a skill entrega.
// Tudo de exemplo é fictício e marcado. Sem narração: texto na tela; a música entra no app na hora de postar.
import { page, comentaBlock } from './base.mjs';

export const DURATION = 55.0;
export const COVER = 4.5;

const css = `
body{background:#06080d;color:#f3f5f9}
#bg{position:absolute;inset:0;background:radial-gradient(70% 45% at 50% 30%,rgba(8,101,254,.22),rgba(8,101,254,0) 70%),radial-gradient(60% 40% at 50% 100%,rgba(77,141,255,.10),rgba(0,0,0,0) 70%)}
#grid{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1.5px,transparent 1.5px);background-size:44px 44px;mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.2) 100%)}
#ep{position:absolute;left:84px;top:212px;z-index:40;font-size:28px;font-weight:800;letter-spacing:.06em;padding:12px 22px;border-radius:999px;background:#0865fe;color:#fff}
.say{position:absolute;left:70px;right:70px;z-index:30;font-weight:900;letter-spacing:-.04em;line-height:1.02;visibility:hidden}
.say em{font-style:normal;color:#4d8dff}
.kick{display:block;font-size:30px;font-weight:800;letter-spacing:.14em;color:#8db8ff;margin-bottom:22px;text-transform:uppercase}
#hook{top:300px;font-size:88px;visibility:visible}
#chat{position:absolute;left:56px;right:56px;top:740px;z-index:20;border-radius:36px;background:#0f1520;border:1.5px solid rgba(255,255,255,.12);box-shadow:0 60px 120px -50px rgba(8,101,254,.55);padding:34px 34px 30px}
#chat .lbl{font-size:24px;font-weight:800;letter-spacing:.12em;color:#8790a6}
#q{margin:22px 0 0 auto;max-width:900px;padding:28px 34px;border-radius:32px 32px 10px 32px;background:#0865fe;color:#fff;font-size:46px;font-weight:700;line-height:1.25;min-height:110px}
#caret{display:inline-block;width:4px;height:44px;background:#fff;vertical-align:-8px;margin-left:4px}
#ans{margin-top:30px;padding:32px 34px;border-radius:32px 32px 32px 10px;background:#151c29;font-size:42px;line-height:1.35;color:#c6cede}
#ans b{color:#f3f5f9}
#ans .it{display:flex;gap:18px;align-items:baseline;margin-top:14px}
#ans .it span{flex:none;width:52px;height:52px;border-radius:50%;background:#1f2a3d;display:grid;place-items:center;font-size:28px;font-weight:900;color:#8db8ff}
#stamp{position:absolute;right:30px;bottom:-34px;transform:rotate(-6deg);padding:16px 30px;border-radius:18px;background:#ff6b5b;color:#fff;font-size:40px;font-weight:900;letter-spacing:-.01em;box-shadow:0 30px 60px -20px rgba(255,107,91,.7);visibility:hidden}
#fic{position:absolute;left:70px;right:70px;top:1700px;z-index:25;font-size:34px;color:#c6cede;font-weight:700}
#s1{top:560px;font-size:110px}
#s1 small{display:block;margin-top:50px;font-size:58px;font-weight:700;letter-spacing:-.02em;line-height:1.25;color:#c6cede}
.lesson{position:absolute;left:56px;right:56px;top:330px;z-index:30;visibility:hidden}
.lesson h2{font-size:88px;font-weight:900;letter-spacing:-.04em;line-height:1.04}
.lesson h2 em{font-style:normal;color:#4d8dff}
.num{display:inline-grid;place-items:center;width:84px;height:84px;border-radius:24px;background:#0865fe;color:#fff;font-size:50px;font-weight:900;margin-bottom:30px}
.bots{margin-top:60px;display:grid;gap:28px}
.bot{display:grid;grid-template-columns:350px 1fr;gap:26px;align-items:center;padding:36px 34px;border-radius:30px;background:#0f1520;border:1.5px solid rgba(255,255,255,.12)}
.bot p{font-size:30px;font-weight:800;letter-spacing:.08em;color:#8db8ff;text-transform:uppercase}
.bot code{display:block;margin-top:10px;font:800 40px/1.1 ui-monospace,Menlo,monospace;color:#f3f5f9}
.bot span{font-size:40px;font-weight:600;line-height:1.3;color:#c6cede}
.bot.hot{border-color:#4d8dff;box-shadow:0 0 0 2px rgba(77,141,255,.35),0 30px 60px -30px rgba(8,101,254,.8)}
.warn{margin-top:40px;padding:32px 34px;border-radius:28px;background:rgba(255,107,91,.12);border:1.5px solid rgba(255,107,91,.5);font-size:42px;font-weight:700;line-height:1.3;color:#ffd1c9}
.warn b{color:#fff}
.note{margin-top:28px;font-size:34px;font-weight:600;line-height:1.35;color:#a9b3c7}
.checks{margin-top:64px;display:grid;gap:26px}
.ck{display:flex;align-items:center;gap:28px;padding:38px 36px;border-radius:30px;background:#0f1520;border:1.5px solid rgba(255,255,255,.12);font-size:50px;font-weight:800;letter-spacing:-.01em}
.ck b{flex:none;display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:#22c55e;color:#06080d;font-size:40px}
.ck small{display:block;font-size:36px;font-weight:600;color:#a9b3c7;margin-top:4px;letter-spacing:0}
#web{position:relative;margin:90px auto 0;width:960px;height:880px}
.nd{position:absolute;padding:26px 34px;border-radius:999px;background:#0f1520;border:1.5px solid rgba(255,255,255,.16);font-size:42px;font-weight:800;white-space:nowrap}
#you{left:50%;top:50%;transform:translate(-50%,-50%);padding:40px 56px;background:#0865fe;border-color:#0865fe;font-size:54px;box-shadow:0 30px 80px -20px rgba(8,101,254,.9)}
#web svg{position:absolute;inset:0}
#runs{margin-top:80px;display:grid;grid-template-columns:repeat(5,1fr);gap:18px}
#runs div{height:210px;border-radius:28px;display:grid;place-items:center;font-size:90px;font-weight:900;background:#0f1520;border:1.5px solid rgba(255,255,255,.12)}
#runs .y{color:#22c55e}#runs .n{color:#ff6b5b}
#rate{margin-top:60px;font-size:56px;font-weight:800;line-height:1.25}
#rate em{font-style:normal;color:#4d8dff}
#skill{position:absolute;left:44px;right:44px;top:300px;z-index:30;visibility:hidden}
#skill h2{font-size:80px;font-weight:900;letter-spacing:-.04em;line-height:1.04}
#skill h2 code{font:900 68px/1 ui-monospace,Menlo,monospace;color:#4d8dff}
#rep{margin-top:40px;border-radius:30px;background:#f3f5f9;color:#121826;overflow:hidden;box-shadow:0 60px 120px -50px rgba(8,101,254,.6)}
#rep .top{display:flex;justify-content:space-between;align-items:center;padding:28px 30px;background:#121826;color:#f3f5f9;font-size:34px;font-weight:800}
#rep .top span{font-size:28px;color:#ffd166;font-weight:900}
.tb{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,.75fr));font-size:34px}
.tb>div{min-width:0;padding:22px 16px;border-bottom:1.5px solid #dce2ec;display:flex;align-items:center}
.tb .h{font-size:22px;font-weight:900;letter-spacing:.02em;line-height:1.15;text-align:center;color:#6a7385;text-transform:uppercase}
.tb .hc{justify-content:center}.tb .c{justify-content:center;font-size:46px;font-weight:900}
.tb .y{color:#16a34a}.tb .n{color:#d93025}
#plan{padding:28px 30px 32px;background:#fff}
#plan h4{font-size:28px;font-weight:900;letter-spacing:.08em;color:#0865fe;text-transform:uppercase}
#plan p{margin-top:16px;font-size:36px;font-weight:700;line-height:1.3}
#plan p b{color:#0865fe}
#ex{margin-top:24px;font-size:30px;color:#8790a6;font-weight:600}
#cred{position:absolute;left:56px;right:56px;top:380px;z-index:30;visibility:hidden}
#cred h2{font-size:92px;font-weight:900;letter-spacing:-.04em;line-height:1.04}
#cred h2 em{font-style:normal;color:#4d8dff}
#cred .card{margin-top:44px;padding:30px 34px;border-radius:32px;background:#0f1520;border:1.5px solid rgba(255,255,255,.14)}
#cred .li{display:flex;align-items:center;gap:24px;font-size:46px;font-weight:800;padding:22px 0}
#cred .li+.li{border-top:1.5px solid rgba(255,255,255,.08)}
#cred .li b{flex:none;display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#0865fe;color:#fff;font-size:28px}
#cred .nt{margin-top:34px;font-size:36px;font-weight:600;line-height:1.38;color:#a9b3c7}
#dim{position:absolute;inset:0;background:#06080d;z-index:45;visibility:hidden}
#save{position:absolute;left:60px;right:60px;top:1450px;z-index:47;text-align:center;font-size:44px;font-weight:800;color:#ffd166;visibility:hidden}
#cap{display:none}
`;

const body = `
<div id="bg"></div><div id="grid"></div>
<div id="ep">SKILL DA SEMANA · EP. 03</div>

<h1 class="say" id="hook">Pergunta pro ChatGPT quem é o melhor do seu ramo na sua cidade. <em>Você aparece?</em></h1>
<div id="chat">
  <p class="lbl">PERGUNTA PARA UMA IA</p>
  <p id="q"><span id="qt"></span><span id="caret"></span></p>
  <div id="ans">
    Aqui estão boas opções em Campinas:
    <div class="it"><span>1</span><p><b>Oficina Jacarandá Azul</b>: avaliações altas e preço no site</p></div>
    <div class="it"><span>2</span><p><b>Auto Mecânica Vento Sul</b>: citada em guias da cidade</p></div>
    <div class="it"><span>3</span><p><b>Garagem Sete Ipês</b>: responde rápido</p></div>
  </div>
  <div id="stamp">E a sua, aparece?</div>
</div>
<p id="fic">Exemplo ilustrativo, com nomes fictícios.</p>

<p class="say" id="s1">Não é sobre anúncio.<small>Em geral, a IA cita quem ela consegue <b style="color:#fff">ler</b> e <b style="color:#fff">confirmar</b>. Quatro coisas que pouca gente sabe:</small></p>

<div class="lesson" id="L1">
  <span class="num">1</span>
  <h2>Não existe "o robô da IA". <em>São três.</em></h2>
  <div class="bots">
    <div class="bot" id="b1"><div><p>Treino</p><code>GPTBot</code></div><span>lê o site para treinar o modelo</span></div>
    <div class="bot" id="b2"><div><p>Busca</p><code>OAI-SearchBot</code></div><span>decide se você entra nas respostas com busca</span></div>
    <div class="bot" id="b3"><div><p>Na hora</p><code>ChatGPT-User</code></div><span>abre seu site quando alguém pede</span></div>
  </div>
  <p class="warn" id="w1"><b>Bloquear o robô errado no robots.txt</b> pode tirar seu site das respostas.</p>
  <p class="note" id="n1">E bloquear o Google-Extended não tira você da Busca nem do resumo de IA do Google: ele controla o uso para o Gemini.</p>
</div>

<div class="lesson" id="L2">
  <span class="num">2</span>
  <h2>A IA não copia páginas. <em>Copia trechos.</em></h2>
  <div class="checks">
    <div class="ck" id="c1"><b>✓</b><div>Resposta na primeira frase<small>nada de "bem-vindo ao nosso site"</small></div></div>
    <div class="ck" id="c2"><b>✓</b><div>Blocos que se entendem sozinhos<small>cada parte responde uma pergunta</small></div></div>
    <div class="ck" id="c3"><b>✓</b><div>Tabela de comparação<small>preço, prazo, o que inclui</small></div></div>
    <div class="ck" id="c4"><b>✓</b><div>Número com fonte e data<small>"segundo X, em 2026…"</small></div></div>
  </div>
</div>

<div class="lesson" id="L3">
  <span class="num">3</span>
  <h2>Ela cita quem <em>os outros citam.</em></h2>
  <div id="web">
    <svg viewBox="0 0 960 880" preserveAspectRatio="none"><g stroke="#33476b" stroke-width="4" stroke-dasharray="10 12" fill="none">
      <line x1="480" y1="440" x2="200" y2="110"/><line x1="480" y1="440" x2="760" y2="110"/><line x1="480" y1="440" x2="190" y2="770"/><line x1="480" y1="440" x2="770" y2="770"/></g></svg>
    <div class="nd" id="nd1" style="left:40px;top:70px">⭐ Avaliações</div>
    <div class="nd" id="nd2" style="right:30px;top:70px">📰 Guias da cidade</div>
    <div class="nd" id="nd3" style="left:20px;bottom:70px">📍 Diretórios</div>
    <div class="nd" id="nd4" style="right:20px;bottom:70px">💬 Fóruns</div>
    <div class="nd" id="you">Seu negócio</div>
  </div>
  <p class="note" style="text-align:center;font-size:36px;margin-top:20px">Seu site sozinho não basta: a IA confere em outros lugares.</p>
</div>

<div class="lesson" id="L4">
  <span class="num">4</span>
  <h2>Uma pergunta não prova nada. <em>A resposta muda.</em></h2>
  <div id="runs"><div class="y" id="r0">✓</div><div class="n" id="r1">✗</div><div class="y" id="r2">✓</div><div class="n" id="r3">✗</div><div class="n" id="r4">✗</div></div>
  <p id="rate">Teste <em>10 a 20 perguntas</em> que trazem cliente, várias vezes, e acompanhe <em>de quantas vezes</em> você aparece.</p>
</div>

<div id="skill">
  <h2>A skill <code>ai-seo</code> te guia nisso tudo:</h2>
  <div id="rep">
    <div class="top">Auditoria de visibilidade em IA<span>EXEMPLO</span></div>
    <div class="tb">
      <div class="h">Pergunta</div><div class="h hc">ChatGPT</div><div class="h hc">Perplexity</div><div class="h hc">IA do Google</div>
      <div id="t1">Melhor oficina em Campinas</div><div class="c n">✗</div><div class="c n">✗</div><div class="c y">✓</div>
      <div id="t2">Troca de embreagem preço</div><div class="c n">✗</div><div class="c y">✓</div><div class="c n">✗</div>
      <div id="t3">Oficina aberta sábado</div><div class="c y">✓</div><div class="c n">✗</div><div class="c n">✗</div>
    </div>
    <div id="plan">
      <h4>Plano em ordem de prioridade</h4>
      <p id="p1"><b>1.</b> Liberar o robô de busca no robots.txt</p>
      <p id="p2"><b>2.</b> Página de serviços com a resposta na 1ª frase e tabela de preços</p>
      <p id="p3"><b>3.</b> Entrar nos guias que a IA já cita</p>
    </div>
  </div>
  <p id="ex">Exemplo ilustrativo. Ela ajuda a entender por que o concorrente aparece e você não.</p>
</div>

<div id="cred">
  <h2>Skill <em>ai-seo</em>, do Corey Haines.</h2>
  <div class="card">
    <div class="li"><b>✓</b>Gratuita no GitHub (licença MIT)</div>
    <div class="li"><b>✓</b>Funciona no Claude (depende do plano)</div>
    <div class="li"><b>✓</b>Você pede em português</div>
  </div>
  <p class="nt">Ninguém controla a resposta da IA: a skill mostra o que melhorar, não garante posição. A Growlift não é afiliada ao autor nem à Anthropic.</p>
</div>

<div id="dim"></div>
${comentaBlock('Quer o passo a passo para instalar e testar?', 'IA', 'dark', 430, 'Comenta')}
<p id="save">📌 Salva pra testar no seu negócio<br><span style="font-size:34px;color:#c6cede;font-weight:700">Seguir é opcional: vale pra todo mundo que comentar</span></p>
`;

const Q = 'Qual a melhor oficina mecânica em Campinas?';
// A narração (voz Piper pt_BR "cadu", brasileira, 50,8 s; narracao35.py) manda no ritmo: cada cena é esticada para o trecho da fala que a explica.
// Pontos [tempo do vídeo, tempo das cenas]: o desenho das cenas segue o tempo antigo, esticado por partes.
const script = `
window.MOTION=2;
const Q=${JSON.stringify(Q)};
const MAPA=[[0,0],[5.5,6.2],[11.4,9.6],[17.5,16.4],[24.1,21.6],[30.2,26.0],[36.2,30.4],[42.9,35.2],[47.9,39.5],[55.0,43.0]];
const remap=(t)=>{for(let i=1;i<MAPA.length;i++){if(t<=MAPA[i][0]){const [a,b]=MAPA[i-1],[c,d]=MAPA[i];return b+(d-b)*(t-a)/(c-a);}}return MAPA[MAPA.length-1][1];};
window.draw=(t0)=>{
  const t=remap(t0);
  show('ep',t,-1,39.5,{dy:0});
  // 0. gancho: a pergunta na tela e sendo digitada já no primeiro quadro
  show('hook',t,-1,6.2,{dy:0});
  show('chat',t,-1,6.2,{dy:0});
  show('fic',t,-1,6.2,{dy:0});
  const n=Math.floor(clamp((t-0.1)/1.6)*Q.length); $('qt').textContent=Q.slice(0,Math.max(n,8));
  $('caret').style.opacity=(n<Q.length||Math.floor(t*3)%2)?1:0;
  show('ans',t,1.5,undefined,{dy:24});
  const its=document.querySelectorAll('#ans .it'); its.forEach((e,i)=>show(e,t,1.8+i*.35,undefined,{dy:18}));
  show('stamp',t,3.2,6.2,{pop:true,sc:.06,dy:0,base:'rotate(-6deg)'});
  // 1. a virada
  show('s1',t,6.2,9.6,{dy:24});
  // 2. lição 1: três robôs
  show('L1',t,9.6,16.4,{dy:30});
  ['b1','b2','b3'].forEach((id,i)=>show(id,t,10.0+i*.45,undefined,{dy:24,x:-30}));
  $('b2').className='bot'+(t>12.6&&t<16.4?' hot':'');
  show('w1',t,12.6,undefined,{dy:20});
  show('n1',t,14.0,undefined,{dy:16});
  // 3. lição 2: trechos
  show('L2',t,16.4,21.6,{dy:30});
  ['c1','c2','c3','c4'].forEach((id,i)=>show(id,t,16.9+i*.6,undefined,{dy:20,x:-24}));
  // 4. lição 3: citações
  show('L3',t,21.6,26.0,{dy:30});
  ['nd1','nd2','nd3','nd4'].forEach((id,i)=>show(id,t,22.0+i*.3,undefined,{dy:16,sc:.06}));
  show('you',t,21.8,undefined,{dy:0,sc:.06,base:'translate(-50%,-50%)'});
  // 5. lição 4: testar várias vezes
  show('L4',t,26.0,30.4,{dy:30});
  for(let i=0;i<5;i++) show('r'+i,t,26.4+i*.28,undefined,{dy:16,sc:.06});
  show('rate',t,28.0,undefined,{dy:18});
  // 6. a skill
  show('skill',t,30.4,35.2,{dy:40});
  ['t1','t2','t3'].forEach((id,i)=>{const k=show(id,t,30.9+i*.3,undefined,{dy:0}); const row=$(id); let c=row.nextElementSibling; for(let j=0;j<3;j++){c.style.opacity=String(k); c=c.nextElementSibling;}});
  ['p1','p2','p3'].forEach((id,i)=>show(id,t,32.2+i*.4,undefined,{dy:14}));
  // 7. créditos
  show('cred',t,35.2,39.5,{dy:30});
  // 8. fim: comenta IA + salva
  show('dim',t,39.5,undefined,{dy:0,fi:.4});
  comenta(t,39.5,40.1,'IA');
  show('save',t,40.1,undefined,{dy:20});
};
`;

export const html = () => page({ css, body, script, captions: [], brandColor: '#f3f5f9' });
