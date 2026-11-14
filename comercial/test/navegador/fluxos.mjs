// Browser check of the automation builder. Needs the app running with demo data. Usage: node test/navegador/fluxos.mjs [pasta-das-capturas]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/x.js')('playwright-core')); }
const BASE = process.env.APP_URL ?? 'http://localhost:3100';
const pasta = process.argv[2] ?? 'test/navegador/capturas';
mkdirSync(pasta, { recursive: true });
let falhas = 0;
const ok = (c, t) => { console.log(`${c ? 'ok  ' : 'FALHOU'} ${t}`); if (!c) falhas++; };
const b = await chromium.launch();
const erros = [];
async function entrar(ctx, email) { const p = await ctx.newPage(); p.on('pageerror', (e) => erros.push(e.message)); await p.goto(`${BASE}/login`); await p.fill('#email', email); await p.fill('#senha', 'demonstracao-2026'); await p.click('button[type=submit]'); await p.waitForURL(/painel$/); return p; }

const a = await entrar(await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }), 'admin@lumivale.demo');
await a.goto(`${BASE}/painel/automacoes`);
await a.locator('#t-fluxos').waitFor();
ok(await a.getByText('Seus fluxos').isVisible(), 'tela de automações mostra "Seus fluxos"');
ok((await a.locator('section[aria-labelledby=t-fluxos] > ul > li').count()) === 5, 'os 5 fluxos de exemplo aparecem');
ok((await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)), 'sem rolagem lateral no celular');
await a.screenshot({ path: `${pasta}/20-automacoes-fluxos.png`, fullPage: true });

// create from a model, edit, turn on
await a.selectOption('#modelo', { label: /Pós-venda/ }).catch(async () => { const v = await a.locator('#modelo option', { hasText: 'Pós-venda' }).getAttribute('value'); await a.selectOption('#modelo', v); });
await a.getByRole('button', { name: 'Criar e editar' }).click();
await a.waitForURL(/automacoes\/fluxos\//);
ok(await a.locator('#nome').inputValue() === 'Pós-venda', 'editor abre com o modelo escolhido');
await a.fill('#nome', 'Pós-venda do navegador');
const linhaVazia = a.locator('select[name=passo_tipo]').nth(2);
await linhaVazia.selectOption('avisar_equipe');
await a.locator('input[name=passo_texto]').nth(2).fill('Ligar para saber se está tudo certo');
await a.check('input[name=ativo]');
await a.getByRole('button', { name: 'Salvar fluxo' }).click();
await a.getByText('Fluxo salvo e ligado.').waitFor();
ok(true, 'salvar e ligar mostra a confirmação');
await a.waitForTimeout(1500);
ok((await a.locator('select[name=passo_tipo]').nth(2).inputValue()) === 'avisar_equipe', 'depois de salvar, o passo 3 continua como "Avisar a equipe"');
await a.screenshot({ path: `${pasta}/21-editor-fluxo.png`, fullPage: true });

// an invalid step is explained by step number
await a.locator('select[name=passo_tipo]').nth(3).selectOption('enviar_whatsapp');
await a.getByRole('button', { name: 'Salvar fluxo' }).click();
await a.getByText(/Linha 4: Escreva a mensagem/).waitFor();
ok(true, 'erro aponta a linha da tela');

// branching flow from the "visit" model: the "Se…" row keeps its target after saving
await a.goto(`${BASE}/painel/automacoes`); await a.locator('#t-fluxos').waitFor();
const visita = await a.locator('a', { hasText: 'Cliente pediu visita' }).first().getAttribute('href');
await a.goto(`${BASE}${visita}`);
ok(await a.locator('figure[aria-label="Desenho do fluxo"]').getByText('Sim → passo 4').isVisible(), 'desenho do fluxo mostra o desvio do "Se…"');
await a.locator('figure[aria-label="Desenho do fluxo"]').screenshot({ path: `${pasta}/23-desenho-fluxo.png` });
ok((await a.locator('#gatilho').inputValue()) === 'mensagem_recebida' && (await a.locator('#palavra').inputValue()) === 'visita', 'gatilho por mensagem com palavra-chave aparece no editor');
ok((await a.locator('select[name=passo_tipo]').nth(1).inputValue()) === 'se' && (await a.locator('input[name=passo_qtd]').nth(1).inputValue()) === '4', 'passo "Se… ir para o passo 4" aparece no editor');
await a.locator('input[name=passo_qtd]').nth(1).fill('1');
await a.getByRole('button', { name: 'Salvar fluxo' }).click();
await a.getByText(/Linha 2: só dá para ir para um passo mais abaixo/).waitFor();
ok(true, 'pular para trás é recusado com a linha certa');

// a vendor cannot reach the builder
const v = await entrar(await b.newContext(), 'vendas@lumivale.demo');
await v.goto(`${BASE}/painel/automacoes`); await v.waitForURL(/\/painel$/, { timeout: 8000 }).catch(() => {});
ok(v.url().endsWith('/painel'), 'vendedor não abre Automações');

// the other company never sees these flows
const o = await entrar(await b.newContext(), 'admin@soldovale.demo');
await o.goto(`${BASE}/painel/automacoes`);
ok(!(await o.getByText('Pós-venda do navegador').count()), 'outra empresa não vê o fluxo');

// trigger: seller moves a request to "Proposta enviada" -> execution appears
const vend = await entrar(await b.newContext(), 'vendas@lumivale.demo');
await vend.goto(`${BASE}/painel/oportunidades?ver=lista&etapa=novo`);
await vend.locator('ul.cartao a').first().click(); await vend.waitForURL(/oportunidades\/[0-9a-f-]{36}/);
await vend.selectOption('#etapa', 'proposta'); await vend.getByRole('button', { name: 'Salvar etapa' }).click(); await vend.getByText('Etapa atualizada.').waitFor();
await a.goto(`${BASE}/painel/automacoes`);
await a.locator('a', { hasText: 'Proposta sem resposta' }).first().click(); await a.waitForURL(/fluxos\//);
ok(await a.getByText(/Execuções \([1-9]/).isVisible(), 'mudar a etapa iniciou o fluxo (aparece em Execuções)');
await a.screenshot({ path: `${pasta}/22-execucoes.png`, fullPage: true });
ok(erros.length === 0, `sem erros de JavaScript${erros.length ? ': ' + erros.slice(0, 2).join(' | ') : ''}`);
await b.close();
console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : '\nTodas as verificações do construtor passaram.');
process.exit(falhas ? 1 : 0);
