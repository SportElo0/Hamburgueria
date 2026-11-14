// Browser check of the main path on a phone-sized screen. Needs the app running (npm run start) with demo data.
// Usage: node test/navegador/fluxo.mjs [pasta-das-capturas]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/x.js')('playwright-core')); }
const BASE = process.env.APP_URL ?? 'http://localhost:3100';
const pasta = process.argv[2] ?? 'test/navegador/capturas';
mkdirSync(pasta, { recursive: true });
const SENHA = 'demonstracao-2026';
const tel = `119${String(Date.now()).slice(-8)}`;
const nome = `Teste Navegador ${String(Date.now()).slice(-5)}`;
let falhas = 0;
const ok = (cond, texto) => { console.log(`${cond ? 'ok  ' : 'FALHOU'} ${texto}`); if (!cond) falhas++; };

const b = await chromium.launch();
const celular = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const erros = [];
async function pagina(ctx) { const p = await ctx.newPage(); p.on('pageerror', (e) => erros.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/favicon|status of 404/.test(m.text()) && erros.push(m.text())); return p; }
const semRolagemLateral = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function entrar(p, email) {
  await p.goto(`${BASE}/login`);
  await p.fill('#email', email); await p.fill('#senha', SENHA);
  await p.click('button[type=submit]');
  await p.waitForURL(/\/(painel|admin)$/);
}

// 1 and 12: visitor on a phone sends a request, fixing the errors the form points out.
const visitante = await b.newContext(celular);
const s = await pagina(visitante);
await s.goto(`${BASE}/s/lumivale-demo`);
ok(await semRolagemLateral(s), 'site: sem rolagem lateral no celular');
await s.screenshot({ path: `${pasta}/01-site-celular.png` });
await s.locator('#orcamento').scrollIntoViewIfNeeded();
await s.fill('#nome', nome); await s.fill('#telefone', '123'); await s.fill('#cidade', 'Campinas');
await s.click('#orcamento button.botao');
ok(await s.locator('#telefone-erro').isVisible(), 'formulário: aponta o telefone inválido');
ok(await s.locator('#extra_tipo_imovel-erro').isVisible(), 'formulário: aponta o tipo de imóvel que faltou');
ok((await s.inputValue('#nome')) === nome, 'formulário: mantém o que já foi digitado');
await s.screenshot({ path: `${pasta}/02-formulario-erros.png` });
await s.fill('#telefone', tel); await s.selectOption('#extra_tipo_imovel', 'Casa'); await s.fill('#necessidade', 'Quero um orçamento para minha casa.');
await s.check('input[name=aceite_whatsapp]');
// Double click on purpose: only one request may be created.
await s.evaluate(() => { const f = document.querySelector('#orcamento form'); f.requestSubmit(); f.requestSubmit(); });
await s.getByText('Pedido recebido.').waitFor({ timeout: 15000 });
ok(true, 'formulário: confirma só depois de salvar');
await s.screenshot({ path: `${pasta}/03-pedido-recebido.png`, fullPage: true });
// Chat after the request: a documented question and then asking for a person.
const chat = s.locator('section[aria-label^="Chat"]');
await chat.locator('input').fill('Funciona em dia nublado?'); await chat.locator('button.botao').click();
await chat.getByText('continua gerando').waitFor({ timeout: 15000 });
ok(true, 'chat: responde a pergunta documentada');
ok(await chat.getByText('simulação').first().isVisible(), 'chat: resposta marcada como simulação');
await chat.locator('input').fill('quero falar com um atendente'); await chat.locator('button.botao').click();
await chat.getByText('uma pessoa vai continuar').waitFor({ timeout: 15000 });
ok(true, 'chat: pedir atendente encaminha para uma pessoa');
await s.screenshot({ path: `${pasta}/04-chat.png`, fullPage: true });

// The seller of that company sees it, on a phone too.
const vend = await b.newContext(celular);
const p = await pagina(vend);
await entrar(p, 'vendas@lumivale.demo');
ok(await p.getByText('Simulação — nenhuma mensagem externa enviada').first().isVisible(), 'painel: faixa de simulação visível');
await p.screenshot({ path: `${pasta}/05-visao-geral.png`, fullPage: true });
await p.goto(`${BASE}/painel/oportunidades?ver=lista&busca=${encodeURIComponent(nome)}`);
ok((await p.getByText(nome).count()) === 1, 'painel: o pedido aparece uma única vez (duplo clique não duplicou)');
ok(await semRolagemLateral(p), 'painel: lista sem rolagem lateral no celular');
await p.getByText(nome).click(); await p.waitForURL(/oportunidades\/[0-9a-f-]{36}/);
const urlOp = p.url();
await p.selectOption('#etapa', 'atendimento'); await p.getByRole('button', { name: 'Salvar etapa' }).click();
await p.getByText('Etapa atualizada.').waitFor();
ok(await p.getByText('Novo pedido → Em atendimento').isVisible(), 'oportunidade: histórico mostra a mudança de etapa');
await p.screenshot({ path: `${pasta}/06-oportunidade.png`, fullPage: true });
await p.goto(`${BASE}/painel/atendimento?estado=aguardando_humano`);
await p.getByText(nome).first().click(); await p.waitForURL(/atendimento\/[0-9a-f-]{36}/);
await p.fill('#texto', 'Olá! Aqui é o Rafael, vou cuidar do seu orçamento.'); await p.getByRole('button', { name: 'Assumir e enviar' }).click();
await p.getByText('Humano atendendo').first().waitFor();
ok(true, 'atendimento: vendedor assume e responde');
await p.screenshot({ path: `${pasta}/07-conversa.png`, fullPage: true });
await s.waitForTimeout(6000);
ok(await chat.getByText('vou cuidar do seu orçamento').isVisible(), 'chat: o visitante recebe a resposta da pessoa');
await p.goto(`${BASE}/painel/tarefas?de=todas`); await p.screenshot({ path: `${pasta}/08-tarefas.png`, fullPage: true });
await p.goto(`${BASE}/painel/configuracoes`);
await p.waitForURL(/\/painel$/, { timeout: 10000 }).catch(() => {});
ok(p.url().endsWith('/painel') && !(await p.getByText('Configurações e integrações').count()), 'vendedor não abre Configurações');
ok((await p.request.get(`${BASE}/api/exportar/contatos`)).status() === 403, 'vendedor não exporta contatos');

// 3: another company's user cannot open it, even with the address.
const outra = await b.newContext(celular);
const o = await pagina(outra);
await entrar(o, 'admin@soldovale.demo');
await o.goto(urlOp);
await o.getByText('Página não encontrada').waitFor({ timeout: 10000 }).catch(() => {});
ok((await o.getByText('Página não encontrada').count()) === 1 && !(await o.getByText(nome).count()) && !(await o.content()).includes(tel), 'outra empresa: endereço da oportunidade diz "não encontrada" e não mostra o contato');
ok(!(await (await o.request.get(`${BASE}/api/exportar/contatos`)).text()).includes(nome), 'outra empresa: exportação não traz o contato');
await o.goto(`${BASE}/painel/oportunidades`);
ok(!(await o.getByText(nome).count()), 'outra empresa: lista não traz o contato');

// Admin screens on a desktop-sized window.
const adm = await b.newContext({ viewport: { width: 1280, height: 800 } });
const a = await pagina(adm);
await entrar(a, 'admin@lumivale.demo');
await a.goto(`${BASE}/painel/oportunidades`); await a.screenshot({ path: `${pasta}/09-quadro.png` });
await a.goto(`${BASE}/painel/configuracoes`); await a.screenshot({ path: `${pasta}/10-configuracoes.png`, fullPage: true });
await a.goto(`${BASE}/painel/conhecimento`); ok(await a.getByText('Conhecimento da empresa').isVisible(), 'admin abre Conhecimento');
const g = await pagina(await b.newContext({ viewport: { width: 1280, height: 800 } }));
await entrar(g, 'equipe@growlift.demo');
ok(g.url().endsWith('/admin'), 'equipe Growlift cai na administração, sem dados de clientes');
ok(!(await g.getByText(nome).count()), 'administração Growlift não mostra contatos');
await g.screenshot({ path: `${pasta}/11-admin-growlift.png`, fullPage: true });
await g.goto(`${BASE}/painel/oportunidades`);
await g.waitForURL(/\/admin$/, { timeout: 10000 }).catch(() => {});
ok(g.url().endsWith('/admin'), 'equipe Growlift não abre o painel sem acesso registrado');

// Unauthenticated access.
const anon = await pagina(await b.newContext());
await anon.goto(`${BASE}/painel/oportunidades`);
ok(anon.url().includes('/login'), 'sem login: painel redireciona para entrar');
ok((await anon.request.get(`${BASE}/api/exportar/contatos`)).status() === 401, 'sem login: exportação recusada');
ok((await anon.request.post(`${BASE}/api/webhooks/whatsapp`, { data: { object: 'whatsapp_business_account' } })).status() === 401, 'webhook sem assinatura é recusado');

ok(erros.length === 0, `sem erros de JavaScript nas páginas${erros.length ? `: ${erros.slice(0, 3).join(' | ')}` : ''}`);
await b.close();
console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTodas as verificações do navegador passaram.');
process.exit(falhas ? 1 : 0);
