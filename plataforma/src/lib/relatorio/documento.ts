import { MENU_CLASS_HINT, MENU_CLASS_LABEL, type Analysis, type MenuClass } from '../inteligencia/analise';
import type { DaySummary } from '../inteligencia/resumo';
import { DIAS, dataBR, type ItemInfo, type ResultadoMes } from './analise';

/**
 * O documento que a equipe baixa para levar ao projeto do Claude: tudo o que o painel sabe do restaurante no período,
 * em Markdown (tabelas), sem nenhum dado de cliente (só contagens). Puro, para testar sem banco.
 */

export interface DadosDocumento {
  nome: string;
  de: string;
  ate: string;
  anteriorDe: string;
  anteriorAte: string;
  geradoEm: Date;
  resultado: ResultadoMes;
  analise: Analysis;
  itens: ItemInfo[];
  dias90: DaySummary[];
}

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${Math.round(v * 100)}%`;
const vari = (agora: number, antes: number) => (antes > 0 ? `${agora >= antes ? '+' : '−'}${pct(Math.abs((agora - antes) / antes))}` : '—');
/** Texto que vai dentro de uma célula de tabela Markdown. */
const cel = (t: string) => t.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

export function montarDocumento(d: DadosDocumento): string {
  const { numeros: n } = d.resultado;
  const a = d.analise;
  const itens = new Map(d.itens.map((i) => [i.id, i]));
  const L: string[] = [];
  const quando = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(d.geradoEm);

  L.push(`# Dados do restaurante: ${d.nome}`, '');
  L.push(`- Período: ${dataBR(d.de)} a ${dataBR(d.ate)} (${a.current.days} dias)`);
  L.push(`- Comparado com: ${dataBR(d.anteriorDe)} a ${dataBR(d.anteriorAte)}`);
  L.push(`- Gerado pelo painel da Growlift em ${quando}`);
  L.push(
    '- Fonte: só os pedidos registrados no sistema (site, mesa pelo QR e garçom). Vendas feitas fora dele (caixa, aplicativos de entrega) não aparecem. Nenhum dado pessoal de cliente: só contagens.',
    '',
  );

  L.push('## Resumo', '', d.resultado.resumo, '');

  L.push('## Números do período', '');
  L.push('| Métrica | Período | Período anterior | Variação |', '| --- | --- | --- | --- |');
  const linha = (nome: string, agora: number, antes: number, fmt: (v: number) => string) => L.push(`| ${nome} | ${fmt(agora)} | ${fmt(antes)} | ${vari(agora, antes)} |`);
  linha('Vendas', a.current.revenue, a.previous.revenue, brl);
  linha('Pedidos', a.current.orders, a.previous.orders, String);
  linha('Ticket médio', a.current.average, a.previous.average, brl);
  linha('Clientes diferentes (pedidos com telefone)', a.current.customers, a.previous.customers, String);
  linha('Clientes que voltaram no período', a.current.returning, a.previous.returning, String);
  linha('Descontos de cupom', a.current.discounts, a.previous.discounts, brl);
  linha('Pedidos recusados pela loja', a.current.refused, a.previous.refused, String);
  linha('Pedidos abandonados (Pix não pago)', a.current.abandoned, a.previous.abandoned, String);
  L.push('');

  L.push('## Itens vendidos', '');
  L.push(
    'Margem = (preço médio efetivo − custo) ÷ preço, antes de taxas de pagamento, impostos e despesas fixas. "Classe" é a engenharia de cardápio (popularidade × margem, comparando itens da mesma categoria); só existe para itens com custo.',
    '',
  );
  L.push('| Item | Categoria | Vendidos | Receita | Preço atual | Custo | Sobra por unidade | Margem | Classe |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const p of a.products) {
    const info = itens.get(p.productId);
    L.push(
      `| ${cel(p.name)} | ${cel(p.category)} | ${p.quantity} | ${brl(p.revenue)} | ${info?.price != null ? brl(info.price) : '—'} | ${p.unitCost != null ? brl(p.unitCost) : 'sem custo'} | ${p.unitContribution != null ? brl(p.unitContribution) : '—'} | ${p.marginRate != null ? pct(p.marginRate) : '—'} | ${p.menuClass ? MENU_CLASS_LABEL[p.menuClass] : '—'} |`,
    );
  }
  const vendidos = new Set(a.products.map((p) => p.productId));
  const naoVendidos = d.itens.filter((i) => i.price !== null && !vendidos.has(i.id));
  if (naoVendidos.length) L.push('', `No cardápio e sem nenhuma venda no período: ${naoVendidos.map((i) => i.name).join(', ')}.`);
  L.push('', `Custos informados cobrem ${pct(a.costCoverage)} da receita de itens.${a.contributionRate != null ? ` Margem média dos itens com custo: ${pct(a.contributionRate)}.` : ''}`, '');

  const classes = (['estrela', 'cavalo-de-batalha', 'quebra-cabeca', 'abacaxi'] as MenuClass[])
    .map((c) => ({ c, nomes: a.products.filter((p) => p.menuClass === c).map((p) => p.name) }))
    .filter((x) => x.nomes.length);
  if (classes.length) {
    L.push('## Engenharia de cardápio', '');
    for (const { c, nomes } of classes) L.push(`- **${MENU_CLASS_LABEL[c]}** (${MENU_CLASS_HINT[c]}): ${nomes.join(', ')}`);
    L.push('');
  }

  L.push('## O que sai junto no mesmo pedido', '');
  if (n.semBebida) L.push(`- Pedidos com comida e sem nenhuma bebida: ${n.semBebida.pedidos} de ${n.semBebida.comComida} (${pct(n.semBebida.pedidos / n.semBebida.comComida)}).`);
  else L.push('- O cardápio não tem categoria de bebida identificada (ou não houve pedido com comida).');
  if (n.pares.length) {
    for (const p of n.pares) L.push(`- ${itens.get(p.a)?.name ?? p.a} + ${itens.get(p.b)?.name ?? p.b}: juntos em ${p.pedidos} pedidos (${pct(p.pedidos / Math.max(1, n.pedidos))}).`);
  } else L.push('- Nenhum par de itens se repetiu nos pedidos.');
  L.push('');

  L.push('## Horários (pedidos por hora)', '');
  const horas = n.porHora.map((q, h) => ({ h, q })).filter((x) => x.q > 0);
  if (horas.length) {
    L.push('| Hora | Pedidos |', '| --- | --- |');
    for (const { h, q } of horas) L.push(`| ${h}h | ${q} |`);
  } else L.push('Sem pedidos no período.');
  L.push('');

  L.push('## Dias da semana (venda média por dia)', '');
  L.push('| Dia | Venda média | Dias com venda no período |', '| --- | --- | --- |');
  for (const w of [1, 2, 3, 4, 5, 6, 0].map((i) => n.porDiaSemana[i])) L.push(`| ${DIAS[w.dia]} | ${w.dias ? brl(w.media) : '—'} | ${w.dias} |`);
  L.push('');

  // Itens que menos saíram nos últimos 90 dias (até o fim do período).
  const q90 = new Map<string, number>();
  for (const day of d.dias90) for (const [id, p] of Object.entries(day.products)) q90.set(id, (q90.get(id) ?? 0) + p.quantity);
  const menos = d.itens
    .filter((i) => i.price !== null)
    .map((i) => ({ i, q: q90.get(i.id) ?? 0 }))
    .sort((x, y) => x.q - y.q)
    .slice(0, 5);
  if (menos.length) {
    L.push('## Os que menos saíram nos últimos 90 dias', '');
    for (const { i, q } of menos) {
      const margem = i.price && i.cost != null ? `, margem ${pct((i.price - i.cost) / i.price)}` : ', sem custo informado';
      L.push(`- ${i.name} (${i.category}): ${q} vendidos${margem}`);
    }
    L.push('');
  }

  L.push('## Pistas calculadas pelo painel', '');
  L.push('Regras automáticas, a partir dos números acima. São pistas para conferir, não conclusões.', '');
  if (d.resultado.sugestoes.length) {
    d.resultado.sugestoes.forEach((s, i) => L.push(`${i + 1}. **${s.titulo}.** ${s.texto} (Base: ${s.base})`));
  } else L.push('Poucos pedidos no período para tirar pistas.');
  L.push('');

  L.push('## Cuidados ao usar estes dados', '');
  L.push(`- ${a.feesConfirmed ? 'As taxas de Pix e cartão foram confirmadas na ficha de custos.' : 'As taxas de Pix e cartão não foram confirmadas: a margem está sem elas.'}`);
  if (a.current.orders < 30) L.push('- Menos de 30 pedidos no período: trate as comparações com cuidado.');
  L.push('- Não use nenhum número que não esteja neste documento.');
  return L.join('\n') + '\n';
}
