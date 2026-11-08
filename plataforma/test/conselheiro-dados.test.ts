import { beforeEach, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { useFileStorage } from '@/lib/storage';
import { createStore, getDraft, getPublished, setProdutoContratado } from '@/lib/stores';
import { produtoDa } from '@/lib/produto';
import { createDemo } from '@/lib/inteligencia/dados';
import { DEMO_SLUG } from '@/lib/inteligencia/demo';
import {
  adicionarCustos,
  adicionarProduto,
  contexto,
  getCustos,
  getPerfil,
  hoje,
  linha,
  salvarCanal,
  salvarPerfil,
  vendasDoPeriodo,
} from '@/lib/conselheiro/dados';
import { importar, previsualizar } from '@/lib/conselheiro/importar';
import { dataBR, dinheiroBR, inteiroBR, lerCsv } from '@/lib/conselheiro/csv';
import { comparar, criarDecisao, criarTeste, getSimulacao, getTestes, medirTeste, mudarDecisao, mudarStatusTeste, prepararBase, registrarResultado, salvarSimulacao } from '@/lib/conselheiro/registros';
import { calcularAlertas, marcarAlerta, panorama } from '@/lib/conselheiro/alertas';
import { CANAL_PAINEL } from '@/lib/conselheiro/modelo';

const OUTRA = 'outra-loja';
const NOW = new Date('2026-11-08T15:00:00Z');
const canalBase = { comissaoBase: 'liquido' as const, tributosBps: 0, tributosConfirmado: true, ativo: true };

async function montar() {
  await createDemo('equipe', NOW);
  await createStore({ slug: OUTRA, name: 'Outra', segment: 'restaurante' }, 'equipe');
  await salvarPerfil(DEMO_SLUG, { segmento: 'Hamburgueria', unidade: 'Centro', prioritarios: ['classico', 'duplo-bacon'], metaContribuicaoBps: 4000 }, 'negocio', 'dono');
  await salvarCanal(DEMO_SLUG, { id: CANAL_PAINEL, nome: 'Pedidos pelo painel', tipo: 'delivery-proprio', comissaoBps: 0, pagamentoBps: 100, embalagem: true, ...canalBase }, 'dono');
  const app = await salvarCanal(DEMO_SLUG, { nome: 'App de delivery', tipo: 'app', comissaoBps: 2300, pagamentoBps: 320, embalagem: true, ...canalBase }, 'dono');
  return { app };
}

describe('leitura de planilha', () => {
  it('números e datas no formato brasileiro', () => {
    expect(dinheiroBR('R$ 1.234,56')).toEqual({ ok: true, valor: 123_456 });
    expect(dinheiroBR('12.5')).toEqual({ ok: true, valor: 1250 });
    expect(dinheiroBR('1.234').ok).toBe(false); // ambíguo
    expect(dinheiroBR('-5,00').ok).toBe(false);
    expect(inteiroBR('1.200')).toEqual({ ok: true, valor: 1200 });
    expect(inteiroBR('1,5').ok).toBe(false);
    expect(dataBR('31/02/2026').ok).toBe(false);
    expect(dataBR('01/11/2026')).toEqual({ ok: true, valor: '2026-11-01' });
    expect(lerCsv('produto;preço\n"Pão; com ""queijo""";12,00\n').linhas[0]).toEqual(['Pão; com "queijo"', '12,00']);
  });
});

describe('conselheiro: dados da loja', () => {
  beforeEach(() => useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'conselheiro-'))));

  it('cada loja só vê os próprios dados', async () => {
    await montar();
    await adicionarCustos(DEMO_SLUG, [{ produtoId: 'classico', ingredientes: 1100, embalagem: 150, outros: 0, lote: null, inicio: '2026-11-01', origem: 'informado', loteId: null, nota: '', confirmadoPor: 'dono' }], 'dono');
    expect((await getPerfil(OUTRA)).canais).toEqual([]);
    expect(await getCustos(OUTRA)).toEqual([]);
    // Produto de outra loja não serve aqui.
    await expect(adicionarCustos(OUTRA, [{ produtoId: 'classico', ingredientes: 1, embalagem: null, outros: null, lote: null, inicio: '2026-11-01', origem: 'informado', loteId: null, nota: '', confirmadoPor: 'x' }], 'x')).rejects.toThrow(/Produto não encontrado/);
    const sim = await salvarSimulacao(DEMO_SLUG, { tipo: 'preco', titulo: 'x', entrada: entradaPreco(), fontes: [], hipoteses: [], origem: 'simulador', conversaId: null }, 'dono');
    expect(await getSimulacao(OUTRA, sim.id)).toBeNull();
    expect(await getSimulacao(DEMO_SLUG, sim.id)).not.toBeNull();
  });

  it('custo novo não muda simulação salva; a versão usada fica registrada', async () => {
    await montar();
    await adicionarCustos(DEMO_SLUG, [{ produtoId: 'classico', ingredientes: 1100, embalagem: 150, outros: 0, lote: null, inicio: '2026-11-01', origem: 'informado', loteId: null, nota: '', confirmadoPor: 'dono' }], 'dono');
    const ctx = await contexto(DEMO_SLUG, NOW);
    const prep = await prepararBase(ctx, 'classico', CANAL_PAINEL, 30, NOW);
    expect(prep.base!.custos.ingredientes).toBe(1100);
    expect(prep.volumeAtual).toBeGreaterThan(0); // pedidos da demonstração
    expect(prep.fontes.find((f) => f.rotulo.startsWith('Custo'))!.versao).toMatch(/^cu-/);
    const sim = await salvarSimulacao(DEMO_SLUG, { tipo: 'preco', titulo: 'Clássico +R$ 2', entrada: { produtoId: 'classico', canalId: CANAL_PAINEL, origemVolume: prep.origemVolume, atual: prep.base, proposto: { ...prep.base!, preco: prep.base!.preco + 200 }, volumeAtual: prep.volumeAtual, volumes: [] }, fontes: prep.fontes, hipoteses: [], origem: 'simulador', conversaId: null }, 'dono');
    const antes = sim.resultado;
    await adicionarCustos(DEMO_SLUG, [{ produtoId: 'classico', ingredientes: 1500, embalagem: 150, outros: 0, lote: null, inicio: '2026-11-07', origem: 'informado', loteId: null, nota: 'carne subiu', confirmadoPor: 'dono' }], 'dono');
    const depois = await getSimulacao(DEMO_SLUG, sim.id);
    expect(depois!.resultado).toEqual(antes);
    const ctx2 = await contexto(DEMO_SLUG, NOW);
    const l = linha(ctx2, ctx2.produtos.find((p) => p.id === 'classico')!, ctx2.perfil.canais[0]);
    expect(l.custo!.ingredientes).toBe(1500);
    expect(l.custo!.anterior!.ingredientes).toBe(1100);
  });

  it('importação: prévia, erros por linha, cancelamento, repetição e arquivo repetido', async () => {
    const { app } = await montar();
    const csv = ['produto;canal;data;quantidade;receita;status', `Clássico;${app.nome};01/11/2026;3;"105,00";`, `Clássico;${app.nome};01/11/2026;1;"35,00";`, `Clássico;${app.nome};01/11/2026;1;;cancelado`, `Inexistente;${app.nome};01/11/2026;1;10,00;`, `Clássico;${app.nome};02/11/2026;1.5;10,00;`].join('\n');
    const p = await previsualizar(DEMO_SLUG, 'vendas', csv, null, NOW);
    expect(p.validas).toBe(1); // as três linhas do dia 1 viram uma
    expect(p.comErro).toBe(2);
    expect(p.linhas.find((l) => l.n === 5)!.erros[0]).toMatch(/não cadastrado/);
    expect(p.linhas.find((l) => l.n === 6)!.erros[0]).toMatch(/inteiro/);
    const r = await importar(DEMO_SLUG, { tipo: 'vendas', texto: csv, mapeamento: p.mapeamento, arquivo: 'app.csv' }, 'dono', NOW);
    expect(r.importadas).toBe(1);
    await expect(importar(DEMO_SLUG, { tipo: 'vendas', texto: csv, mapeamento: p.mapeamento, arquivo: 'app.csv' }, 'dono', NOW)).rejects.toThrow(/já foi importado/);
    // Mesmo produto, canal e dia em outro arquivo: linha repetida, não soma duas vezes.
    const outro = await previsualizar(DEMO_SLUG, 'vendas', `${csv}\n`, null, NOW);
    expect(outro.repetidas).toBe(1);
    const v = await vendasDoPeriodo(DEMO_SLUG, '2026-11-01', '2026-11-01', NOW);
    expect(v.linhas.find((l) => l.canalId === app.id)).toEqual({ produtoId: 'classico', canalId: app.id, quantidade: 4, receita: 14_000, canceladas: 1 });
  });

  it('custo por lote e rendimento; período que inclui hoje é avisado', async () => {
    const { app } = await montar();
    const custos = 'produto;custo do lote;rendimento;embalagem\nClássico;"96,00";8;"1,50"\n';
    const p = await previsualizar(DEMO_SLUG, 'custos', custos, null, NOW);
    expect(p.validas).toBe(1);
    await importar(DEMO_SLUG, { tipo: 'custos', texto: custos, mapeamento: p.mapeamento, arquivo: 'custos.csv' }, 'dono', NOW);
    const c = (await getCustos(DEMO_SLUG))[0];
    expect(c).toMatchObject({ ingredientes: 1200, embalagem: 150, origem: 'calculado', lote: { custo: 9600, rendimento: 8 }, confirmadoPor: 'dono' });
    const vendas = `produto;canal;inicio;fim;quantidade;receita\nClássico;${app.nome};01/11/2026;${hoje(NOW).split('-').reverse().join('/')};10;300,00\n`;
    expect((await previsualizar(DEMO_SLUG, 'vendas', vendas, null, NOW)).avisos.join(' ')).toMatch(/incompletas/);
  });

  it('produto contratado: sem marcação vale o sistema completo; só Conselheiro fica no rascunho', async () => {
    await montar();
    expect(produtoDa((await getDraft(OUTRA))!.data.store)).toBe('completo');
    await setProdutoContratado(OUTRA, 'conselheiro', 'equipe');
    expect(produtoDa((await getDraft(OUTRA))!.data.store)).toBe('conselheiro');
    expect(await getPublished(OUTRA)).toBeNull(); // não publica nada
    expect(produtoDa((await getDraft(DEMO_SLUG))!.data.store)).toBe('completo');
  });

  it('canal sem vendas registradas é "sem dado", não zero', async () => {
    const { app } = await montar();
    const v = await vendasDoPeriodo(DEMO_SLUG, '2026-10-01', '2026-10-31', NOW);
    expect(v.cobertura.find((c) => c.canalId === app.id)!.ultimoDia).toBeNull();
    expect(v.linhas.some((l) => l.canalId === app.id)).toBe(false);
    expect(v.linhas.some((l) => l.canalId === CANAL_PAINEL)).toBe(true);
  });

  it('tributo só com confirmação; produto fora do cardápio', async () => {
    await montar();
    await expect(salvarCanal(DEMO_SLUG, { nome: 'Balcão', tipo: 'salao', comissaoBps: 0, comissaoBase: 'liquido', pagamentoBps: 0, tributosBps: 600, tributosConfirmado: false, embalagem: false, ativo: true }, 'dono')).rejects.toThrow(/Confirme/);
    const p = await adicionarProduto(DEMO_SLUG, { nome: 'Marmita do dia', categoria: 'Almoço' }, 'dono');
    expect(p.id).toMatch(/^p-/);
    await expect(adicionarProduto(DEMO_SLUG, { nome: 'marmita do DIA', categoria: '' }, 'dono')).rejects.toThrow(/Já existe/);
  });
});

function entradaPreco() {
  const u = { preco: 3000, desconto: 0, custos: { ingredientes: 1500, embalagem: 0, outros: 0 }, taxas: { comissaoBps: 0, comissaoBase: 'liquido' as const, pagamentoBps: 0, tributosBps: 0 } };
  return { produtoId: null, canalId: null, origemVolume: 'informado', atual: u, proposto: { ...u, preco: 3500 }, volumeAtual: 100, volumes: [90] };
}

describe('conselheiro: decisões, testes e alertas', () => {
  beforeEach(() => useFileStorage(fs.mkdtempSync(path.join(os.tmpdir(), 'conselheiro-'))));

  it('fluxo completo: decisão aprovada vira teste, resultado e conclusão', async () => {
    await montar();
    await adicionarCustos(DEMO_SLUG, [{ produtoId: 'classico', ingredientes: 1100, embalagem: 150, outros: 0, lote: null, inicio: '2026-09-01', origem: 'informado', loteId: null, nota: '', confirmadoPor: 'dono' }], 'dono');
    const sim = await salvarSimulacao(DEMO_SLUG, { tipo: 'preco', titulo: 'Clássico R$ 35', entrada: entradaPreco(), fontes: [], hipoteses: ['volume de 90'], origem: 'simulador', conversaId: null }, 'dono');
    const d = await criarDecisao(DEMO_SLUG, { titulo: 'Subir o Clássico', pergunta: 'Posso subir?', metodo: 'precificacao', dadosUsados: [], faltando: [], hipoteses: [], calculos: '', recomendacao: 'Testar R$ 35 por 14 dias', riscos: ['clientes sensíveis a preço'], proximoPasso: 'teste', simulacaoIds: [sim.id], produtos: ['classico'], origem: 'simulador', conversaId: null }, 'dono');
    expect(d.status).toBe('proposta');
    await expect(criarTeste(DEMO_SLUG, { nome: 't', hipotese: 'h', produtos: ['classico'], canais: [CANAL_PAINEL], responsavel: 'Ana', metrica: 'contribuicao-total', protecao: [], comparacao: 'antes-depois', inicio: '2026-10-20', fim: '2026-11-02', premissas: '', limites: '', decisaoId: d.id }, 'dono')).rejects.toThrow(/aprovada/);
    await expect(mudarDecisao(DEMO_SLUG, d.id, 'descartada', '', 'dono')).rejects.toThrow(/por que/);
    await mudarDecisao(DEMO_SLUG, d.id, 'aprovada', '', 'dono');
    const t = await criarTeste(DEMO_SLUG, { nome: 'Clássico R$ 35', hipotese: 'Contribuição total não cai', produtos: ['classico'], canais: [CANAL_PAINEL], responsavel: 'Ana', metrica: 'contribuicao-total', protecao: ['pedidos por dia'], comparacao: 'antes-depois', inicio: '2026-10-20', fim: '2026-11-02', premissas: '', limites: '', decisaoId: d.id }, 'dono');
    await expect(mudarStatusTeste(DEMO_SLUG, t.id, 'em-andamento', { motivo: '' }, 'dono')).rejects.toThrow(/não pode ir/);
    await mudarStatusTeste(DEMO_SLUG, t.id, 'aprovado', { motivo: '' }, 'dono');
    await mudarStatusTeste(DEMO_SLUG, t.id, 'em-andamento', { motivo: '' }, 'dono');
    const m = await medirTeste(DEMO_SLUG, (await getTestes(DEMO_SLUG))[0], NOW);
    expect(m.base.dias).toBe(14);
    expect(m.teste.dias).toBe(14);
    expect(m.teste.valor).not.toBe(0);
    await expect(mudarStatusTeste(DEMO_SLUG, t.id, 'concluido', { motivo: '', decisaoFinal: 'manter' }, 'dono')).rejects.toThrow(/resultado da base/);
    await registrarResultado(DEMO_SLUG, t.id, { grupo: 'base', ...m.base, nota: m.base.periodo, origem: 'calculado' }, 'dono');
    await registrarResultado(DEMO_SLUG, t.id, { grupo: 'teste', ...m.teste, nota: m.teste.periodo, origem: 'calculado' }, 'dono');
    const fim = await mudarStatusTeste(DEMO_SLUG, t.id, 'concluido', { motivo: '', decisaoFinal: 'Manter R$ 35' }, 'dono');
    expect(fim.status).toBe('concluido');
    expect(comparar(fim)!.avaliacao.natureza).toBe('observado');
    expect(comparar(fim)!.avaliacao.avisos.join(' ')).toMatch(/não prova/);
  });

  it('alertas por regra: sem custo, custo que subiu, abaixo da meta; dispensar com motivo', async () => {
    await montar();
    await adicionarCustos(DEMO_SLUG, [{ produtoId: 'classico', ingredientes: 1000, embalagem: 150, outros: 0, lote: null, inicio: '2026-10-01', origem: 'informado', loteId: null, nota: '', confirmadoPor: 'dono' }], 'dono');
    await adicionarCustos(DEMO_SLUG, [{ produtoId: 'classico', ingredientes: 1300, embalagem: 150, outros: 0, lote: null, inicio: '2026-11-05', origem: 'informado', loteId: null, nota: '', confirmadoPor: 'dono' }], 'dono');
    const base = `/loja/${DEMO_SLUG}/dono/conselheiro`;
    const p = await panorama(DEMO_SLUG, base, NOW);
    const regras = p.alertas.map((a) => a.regra);
    expect(regras).toContain('custo-mudou');
    expect(p.alertas.find((a) => a.regra === 'custo-mudou')!.evidencia).toMatch(/R\$ 10,00.*R\$ 13,00/);
    // A demonstração tem ficha para outros itens; o que não tem custo aparece se é prioritário ou vendeu.
    expect(p.alertas.every((a) => a.evidencia.length > 0 && a.acao.href.startsWith(base.replace('/conselheiro', '')))).toBe(true);
    const alvo = p.alertas[0];
    await expect(marcarAlerta(DEMO_SLUG, alvo.chave, 'dispensado', '', 'dono')).rejects.toThrow(/por que/);
    await marcarAlerta(DEMO_SLUG, alvo.chave, 'dispensado', 'já negociado com o fornecedor', 'dono', NOW);
    const p2 = await panorama(DEMO_SLUG, base, NOW);
    expect(p2.alertas.some((a) => a.chave === alvo.chave)).toBe(false);
    expect(p2.ocultos).toBe(1);
  });

  it('sem períodos comparáveis não há alerta de queda de vendas', async () => {
    await montar();
    const ctx = await contexto(DEMO_SLUG, NOW);
    const vazio = { inicio: '2026-10-09', fim: '2026-11-07', dias: 30, linhas: [], pedidosPainel: 0, cobertura: [], parciaisForaDaConta: 0 };
    const recente = { ...vazio, linhas: [{ produtoId: 'classico', canalId: CANAL_PAINEL, quantidade: 5, receita: 1, canceladas: 0 }] };
    const anterior = { ...vazio, dias: 29, linhas: [{ produtoId: 'classico', canalId: CANAL_PAINEL, quantidade: 100, receita: 1, canceladas: 0 }] };
    expect(calcularAlertas(ctx, '/x', { testes: [], recente, anterior }).some((a) => a.regra === 'queda-vendas')).toBe(false);
    // Mesmo tamanho mas sem cobertura até o fim do período: também não.
    expect(calcularAlertas(ctx, '/x', { testes: [], recente, anterior: { ...anterior, dias: 30 } }).some((a) => a.regra === 'queda-vendas')).toBe(false);
  });
});
