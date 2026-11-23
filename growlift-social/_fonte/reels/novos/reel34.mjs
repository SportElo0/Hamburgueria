// Reel 34 (24/11): "Do caderno pra planilha". Skill da Semana, ep. 02: a skill de planilhas (xlsx) da Anthropic, que já
// vem no plano pago do Claude. O caixa anotado num caderno (lanchonete fictícia, caderno34.mjs) vira foto, a foto vira
// pedido em português e o pedido vira a planilha de verdade (10-presentes/planilha-controle-de-caixa.xlsx, feita com a
// skill: os números da tela são os dela, conferidos no recalc). Fim: "Segue e comenta PLANILHA" e o pedido de envio
// ("manda pro sócio que ainda usa caderno"). Sem narração: texto na tela; a música entra no app na hora de postar.
import { page, comentaBlock } from './base.mjs';
import { pagina, PAGINA_CSS, FONT_CSS, LINHAS } from './caderno34.mjs';

export const DURATION = 26.0;
export const COVER = 1.0;

const brl = (n) => n.toLocaleString('pt-BR');
// Saldo corrido, como na coluna F da planilha.
let s = 0;
const ROWS = LINHAS.map(([d, t, v]) => {
  s += v;
  return [d, t.charAt(0).toUpperCase() + t.slice(1), v > 0 ? brl(v) : '', v < 0 ? brl(-v) : '', brl(s)];
});
const ENTRADAS = LINHAS.filter((l) => l[2] > 0).reduce((a, l) => a + l[2], 0); // 7.075
const SAIDAS = -LINHAS.filter((l) => l[2] < 0).reduce((a, l) => a + l[2], 0); // 3.093
// Saídas por categoria (aba Resumo da planilha), da maior para a menor.
const BARRAS = [
  ['Aluguel', 1800],
  ['Equipe', 400],
  ['Contas da casa', 393],
  ['Fornecedores', 310],
  ['Embalagens', 190],
];

const css = `
${FONT_CSS}
body{background:#16110d}
#bgW{position:absolute;inset:0;background:radial-gradient(85% 60% at 50% 45%,#8a6a4c 0%,#4a3524 70%,#2a1d13 100%)}
#bgL{position:absolute;inset:0;background:linear-gradient(180deg,#eef3fb,#dfe8f6);opacity:0}
#dim{position:absolute;inset:0;background:#06080d;z-index:45;visibility:hidden}
.brandmark{z-index:60}
#ep{position:absolute;left:84px;top:212px;z-index:40;font-size:28px;font-weight:800;letter-spacing:.06em;padding:12px 22px;border-radius:999px;background:#0865fe;color:#fff}
#hook{position:absolute;left:70px;right:70px;top:300px;z-index:30;font-weight:900;font-size:96px;line-height:1.02;letter-spacing:-.04em;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.55)}
#hook em{font-style:normal;color:#ffd166}
#note{position:absolute;left:50%;top:640px;z-index:10;transform-origin:50% 0}
${PAGINA_CSS}
#vf{position:absolute;left:96px;right:96px;top:610px;height:960px;z-index:12;visibility:hidden}
#vf i{position:absolute;width:90px;height:90px;border:8px solid #fff}
#vf i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0;border-radius:18px 0 0 0}
#vf i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0;border-radius:0 18px 0 0}
#vf i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0;border-radius:0 0 0 18px}
#vf i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0;border-radius:0 0 18px 0}
#flash{position:absolute;inset:0;background:#fff;z-index:44;opacity:0}
.say{position:absolute;left:70px;right:70px;z-index:30;font-weight:900;letter-spacing:-.035em;line-height:1.04;visibility:hidden}
#s1{top:300px;font-size:96px;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.55)}
#chat{position:absolute;left:70px;right:70px;top:560px;z-index:20;visibility:hidden}
.bub{border-radius:40px;padding:30px 36px;font-size:44px;font-weight:700;line-height:1.25;box-shadow:0 30px 60px -30px rgba(18,24,38,.45)}
#qPh{margin-left:auto;width:330px;height:420px;border-radius:30px;overflow:hidden;background:#4a3524;border:6px solid #fff;box-shadow:0 30px 60px -30px rgba(18,24,38,.6);position:relative}
#qPh .caderno{transform:scale(.36) rotate(-3deg);transform-origin:0 0;position:absolute;left:16px;top:14px}
#qTx{margin:22px 0 0 auto;max-width:860px;background:#0865fe;color:#fff;border-bottom-right-radius:12px}
#aDots{margin-top:34px;width:170px;background:#fff;display:flex;gap:14px;justify-content:center;padding:34px 0;border-bottom-left-radius:12px}
#aDots i{width:20px;height:20px;border-radius:50%;background:#8a93a3}
#aTx{margin-top:34px;max-width:880px;background:#fff;color:#121826;border-bottom-left-radius:12px}
#aTx .file{margin-top:22px;display:flex;align-items:center;gap:20px;padding:22px 24px;border-radius:24px;background:#eef3fb;font-size:34px;color:#121826}
#aTx .file b{display:grid;place-items:center;width:90px;height:70px;border-radius:16px;background:#1f8a4c;color:#fff;font-size:22px;font-weight:900}
#lblChat{position:absolute;left:70px;top:300px;z-index:30;visibility:hidden;font-size:84px;font-weight:900;letter-spacing:-.035em;line-height:1.04;color:#121826}
#lblChat em{font-style:normal;color:#0865fe}
#sheet{position:absolute;left:50px;right:50px;top:440px;z-index:20;border-radius:30px;background:#fff;box-shadow:0 50px 100px -40px rgba(18,24,38,.55);overflow:hidden;visibility:hidden}
#shTop{display:flex;align-items:center;gap:18px;padding:22px 28px;background:#1f8a4c;color:#fff;font-size:30px;font-weight:800}
#shTop b{display:grid;place-items:center;width:72px;height:52px;border-radius:12px;background:rgba(255,255,255,.2);font-size:18px}
#shTabs{display:flex;gap:6px;padding:12px 20px 0;background:#f2f4f8;border-bottom:2px solid #dce2ec}
#shTabs span{padding:14px 30px;border-radius:14px 14px 0 0;font-size:28px;font-weight:800;color:#6a7385}
#shTabs span.on{background:#fff;color:#1f8a4c;box-shadow:0 -2px 0 #1f8a4c inset}
.grid{display:grid;grid-template-columns:150px 1fr 160px 160px 170px;font-size:29px}
.grid>div,.grid .row>div{padding:0 14px;height:52px;display:flex;align-items:center;border-bottom:1.5px solid #e6eaf2;border-right:1.5px solid #e6eaf2;white-space:nowrap;overflow:hidden}
.grid .h{background:#0865fe;color:#fff;font-weight:800;font-size:26px;justify-content:center;height:56px}
.grid .n{justify-content:flex-end;font-variant-numeric:tabular-nums;font-weight:700}
.grid .e{color:#1d6b3a}.grid .o{color:#b3261e}.grid .sd{color:#121826;background:#f6f8fb}
.grid .row{display:contents}
#kpis{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;padding:22px 24px;background:#f6f8fb;border-top:2px solid #dce2ec}
#kpis p{font-size:24px;font-weight:800;color:#6a7385;letter-spacing:.02em}
#kpis b{display:block;margin-top:6px;font-size:44px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:#121826}
#kpis .ok b{color:#0865fe}
#resumo{position:absolute;left:0;right:0;top:162px;bottom:0;background:#fff;padding:40px 44px;visibility:hidden}
#resumo h3{font-size:46px;font-weight:900;letter-spacing:-.02em;color:#121826}
.bar{display:grid;grid-template-columns:270px 1fr;align-items:center;gap:20px;margin-top:34px}
.bar span{font-size:32px;font-weight:700;color:#3c4558;text-align:right}
.bar div{display:flex;align-items:center;gap:16px}.bar i{display:block;height:62px;border-radius:12px;background:#0865fe;transform-origin:0 50%}.bar b{font-size:32px;font-weight:900;color:#121826;white-space:nowrap;font-variant-numeric:tabular-nums}
#real{position:absolute;left:50px;right:50px;top:1462px;z-index:25;display:flex;gap:14px;flex-wrap:wrap;visibility:hidden}
#real span{padding:14px 24px;border-radius:999px;background:#121826;color:#fff;font-size:28px;font-weight:800}
#real span.l{background:#fff;color:#3c4558;border:2px solid #dce2ec}
#skill{position:absolute;left:70px;right:70px;top:420px;z-index:30;visibility:hidden}
#skill h2{font-size:92px;font-weight:900;letter-spacing:-.04em;line-height:1.02;color:#121826}
#skill h2 em{font-style:normal;color:#0865fe}
#skill .card{margin-top:50px;padding:34px 38px;border-radius:34px;background:#fff;box-shadow:0 40px 80px -40px rgba(18,24,38,.45)}
#skill .li{display:flex;align-items:center;gap:22px;font-size:42px;font-weight:800;color:#121826;padding:16px 0}
#skill .li+.li{border-top:2px solid #eef1f5}
#skill .li b{flex:none;display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:#1f8a4c;color:#fff;font-size:30px}
#skill .nt{margin-top:30px;font-size:34px;font-weight:700;color:#3c4558;line-height:1.35}
#share{position:absolute;left:60px;right:60px;top:1420px;z-index:47;text-align:center;font-size:44px;font-weight:800;color:#ffd166;visibility:hidden}
#cap{display:none}
#s2{top:290px;font-size:84px;color:#121826}
#s2 em{font-style:normal;color:#0865fe}
`;

const linhaHTML = ([d, t, e, o, sd], i) =>
  `<div class="row" id="r${i}"><div>${d}</div><div>${t}</div><div class="n e">${e}</div><div class="n o">${o}</div><div class="n sd">${sd}</div></div>`;

const body = `
<div id="bgW"></div><div id="bgL"></div>
<div id="ep">SKILL DA SEMANA · EP. 02</div>
<h1 id="hook">Seu caixa ainda é anotado <em>no caderno?</em></h1>
<div id="note">${pagina()}</div>
<div id="vf"><i></i><i></i><i></i><i></i></div>
<p class="say" id="s1">Tira uma foto.</p>
<p class="say" id="s2">E ela devolve <em>isso:</em></p>

<p id="lblChat">E pede em <em>português:</em></p>
<div id="chat">
  <div id="qPh">${pagina()}</div>
  <p class="bub" id="qTx">Transforma isso numa planilha de caixa, com o total do mês e um gráfico.</p>
  <div class="bub" id="aDots"><i></i><i></i><i></i></div>
  <div class="bub" id="aTx">Pronto! Organizei os 12 lançamentos, somei tudo e fiz o gráfico.<div class="file"><b>XLSX</b>planilha-controle-de-caixa.xlsx</div></div>
</div>

<div id="sheet">
  <div id="shTop"><b>XLSX</b>planilha-controle-de-caixa.xlsx</div>
  <div id="shTabs"><span id="tC" class="on">Caixa</span><span id="tR">Resumo</span></div>
  <div class="grid">
    <div class="h">Data</div><div class="h">Descrição</div><div class="h">Entrada</div><div class="h">Saída</div><div class="h">Saldo</div>
    ${ROWS.map(linhaHTML).join('')}
  </div>
  <div id="kpis">
    <div><p>ENTRADAS</p><b id="kE">R$ 0</b></div>
    <div><p>SAÍDAS</p><b id="kS">R$ 0</b></div>
    <div class="ok"><p>SOBROU</p><b id="kO">R$ 0</b></div>
  </div>
  <div id="resumo">
    <h3>Para onde foi o dinheiro</h3>
    ${BARRAS.map(([n, v], i) => `<div class="bar"><span>${n}</span><div><i id="b${i}" style="width:${Math.max(4, (v / 1800) * 72)}%"></i><b id="bv${i}">R$ ${brl(v)}</b></div></div>`).join('')}
  </div>
</div>
<div id="real"><span>Arquivo .xlsx de verdade</span><span class="l">Excel · Google Planilhas · celular</span><span class="l">Exemplo ilustrativo: lanchonete fictícia</span></div>

<div id="skill">
  <h2>Isso é a <em>skill de planilhas</em> do Claude.</h2>
  <div class="card">
    <div class="li"><b>✓</b>Criada pela Anthropic</div>
    <div class="li"><b>✓</b>Já vem no plano pago do Claude</div>
    <div class="li"><b>✓</b>Você pede em português</div>
  </div>
  <p class="nt">A Growlift não é afiliada nem patrocinada pela Anthropic.<br>A conta precisa ter a criação de arquivos ligada (confira no app). Confira sempre os números que ela leu.</p>
</div>

<div id="dim"></div>
${comentaBlock('Quer essa planilha pronta pra usar?', 'PLANILHA', 'dark', 430, 'Comenta')}
<p id="share">📒 Manda pro sócio que ainda usa caderno<br><span style="font-size:34px;color:#c6cede;font-weight:700">Se curtir, segue a @growlift.ai 🙂</span></p>
<div id="flash"></div>
`;

const script = `
window.MOTION=2;
const N=${ROWS.length};
const E=${ENTRADAS}, S=${SAIDAS};
const brl=(n)=>'R$ '+Math.round(n).toLocaleString('pt-BR');
window.draw=(t)=>{
  // a marca do topo acompanha o fundo (claro no meio do vídeo)
  document.querySelector('.brandmark').style.color=t>4.7&&t<20.75?'#121826':'#f3f5f9';
  // 0. hook: o caderno e a pergunta já no primeiro quadro
  show('ep',t,-1,16.8,{dy:0});
  show('hook',t,-1,3.1,{dy:0});
  const zoom=1.02-0.05*eoS(t/3);
  const note=$('note'); const vis=t<5.0;
  note.style.visibility=vis?'visible':'hidden';
  // a foto: depois do clique, o caderno encolhe e sobe
  const shot=eioS((t-4.35)/.6);
  const sc=0.84*zoom*(1-0.55*shot);
  note.style.transform='translateX(-50%) translateY('+(-120*shot)+'px) rotate('+(-2.5+2*shot)+'deg) scale('+sc+')';
  note.style.opacity=vis?String(1-clamp((t-4.6)/.35)):'0';
  // 1. "Tira uma foto."
  show('s1',t,3.1,4.9,{dy:20});
  show('vf',t,3.3,4.45,{dy:0,sc:.06});
  $('flash').style.opacity=t>=4.35&&t<4.75?String(.85*(1-(t-4.35)/.4)):'0';
  // fundo: madeira → claro
  $('bgL').style.opacity=String(eoS((t-4.5)/.5));
  // 2. o pedido em português
  show('lblChat',t,5.0,8.3,{dy:20});
  show('chat',t,5.0,8.3,{dy:0,fi:.3});
  show('qPh',t,5.05,undefined,{dy:40,sc:.06});
  show('qTx',t,5.5,undefined,{dy:30});
  show('aDots',t,6.5,7.3,{dy:20});
  [0,1,2].forEach((i)=>{const d=$('aDots').children[i]; d.style.opacity=String(.35+.65*Math.abs(Math.sin((t-6.5)*6-i*.7)));});
  show('aTx',t,7.3,undefined,{dy:30});
  // 3. a planilha se monta, linha por linha
  show('sheet',t,8.3,16.9,{dy:60,fi:.45});
  show('s2',t,8.3,16.9,{dy:20});
  for(let i=0;i<N;i++){
    const a=8.75+i*0.26; const k=eoS((t-a)/.3);
    const row=$('r'+i); const cells=row.children;
    for(const c of cells){c.style.opacity=String(k); c.style.transform='translateX('+((1-k)*40)+'px)'; c.style.background=t>a&&t<a+.45?'#fff6cc':'';}
  }
  const tot=eoS((t-12.1)/1.1);
  $('kE').textContent=brl(E*tot); $('kS').textContent=brl(S*tot); $('kO').textContent=brl((E-S)*tot);
  $('kpis').style.opacity=String(clamp((t-11.9)/.3));
  // aba Resumo: o gráfico cresce
  const res=t>=13.9;
  $('tC').className=res?'':'on'; $('tR').className=res?'on':'';
  show('resumo',t,13.9,undefined,{dy:0,fi:.25});
  for(let i=0;i<5;i++){ const k=eoS((t-14.1-i*.18)/.7); $('b'+i).style.transform='scaleX('+Math.max(.02,k)+')'; $('bv'+i).style.opacity=String(clamp((k-.6)/.4)); }
  show('real',t,9.2,16.9,{dy:20});
  // 4. de onde vem
  show('skill',t,17.0,20.8,{dy:40});
  // 5. o fim: comenta PLANILHA + manda pro sócio
  show('dim',t,20.7,undefined,{dy:0,fi:.4});
  comenta(t,20.8,21.7,'PLANILHA');
  show('share',t,23.0,undefined,{dy:24});
};
`;

export const html = () => page({ css, body, script, captions: [], brandColor: '#f3f5f9' });
