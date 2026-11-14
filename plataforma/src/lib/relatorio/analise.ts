import type { DaySummary } from '../inteligencia/resumo';
import type { Order } from '../ordering';

/**
 * Os números de um restaurante num período e as pistas de sugestão, todas tiradas dos pedidos e da ficha de custos
 * (nada inventado). Puro: quem chama lê os dados (relatorio/exportar.ts) e passa aqui.
 */

export interface ItemInfo {
  id: string;
  name: string;
  category: string;
  /** Preço atual no cardápio, centavos (null sem preço). */
  price: number | null;
  /** Custo de 1 unidade com embalagem, centavos (null sem custo). */
  cost: number | null;
  drink: boolean;
}

export interface EntradaPeriodo {
  /** Primeiro e último dia do período, YYYY-MM-DD. */
  de: string;
  ate: string;
  /** Pedidos vendidos do período (já filtrados: só os que contam como venda). */
  pedidos: Order[];
  /** Resumo diário de cada dia do período. */
  dias: DaySummary[];
  /** Resumo diário do mesmo número de dias logo antes (para comparar). */
  diasAnterior: DaySummary[];
  /** Resumo diário dos 90 dias que terminam no último dia (para itens parados). */
  dias90: DaySummary[];
  /** Itens do cardápio hoje. */
  itens: ItemInfo[];
}

export interface Numeros {
  vendas: number;
  pedidos: number;
  ticket: number;
  anterior: { vendas: number; pedidos: number; ticket: number } | null;
  /** Dia da semana (0 = domingo) com mais e com menos venda média, quando há pelo menos 3 semanas de dados. */
  melhorDia: { dia: number; media: number } | null;
  piorDia: { dia: number; media: number } | null;
  horaPico: number | null;
  /** Pedidos por hora do dia (horário de São Paulo), 24 posições. */
  porHora: number[];
  /** Venda média por dia de cada dia da semana (0 = domingo), só os dias com venda contados. */
  porDiaSemana: { dia: number; media: number; dias: number }[];
  maisPedidos: { id: string; name: string; quantity: number }[];
  /** Pedidos com comida e sem nenhuma bebida (null quando o cardápio não tem bebida). */
  semBebida: { pedidos: number; comComida: number } | null;
  /** Os pares que mais saem juntos no mesmo pedido. */
  pares: { a: string; b: string; pedidos: number }[];
  /** Fatia das vendas de itens que tem custo informado, 0–1. */
  coberturaCusto: number;
}

export interface Sugestao {
  id: string;
  titulo: string;
  texto: string;
  /** Os números que sustentam a sugestão, para a equipe conferir. */
  base: string;
  prioridade: number;
}

export interface ResultadoMes {
  numeros: Numeros;
  resumo: string;
  /** Todas as candidatas, da mais forte para a mais fraca; o relatório usa as 3 primeiras. */
  sugestoes: Sugestao[];
}

export const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const nomeMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`;
export const dataBR = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${Math.round(v * 100)}%`;
const soma = (ds: DaySummary[], f: (d: DaySummary) => number) => ds.reduce((n, d) => n + f(d), 0);
const diaDaSemana = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();
/** Preço "de cardápio": arredonda para cima até o próximo ,90. */
export function precoRedondo(cents: number) {
  const reais = Math.ceil((cents - 90) / 100);
  return Math.max(90, reais * 100 + 90);
}

export function analisarPeriodo(e: EntradaPeriodo): ResultadoMes {
  const itens = new Map(e.itens.map((i) => [i.id, i]));
  const vendas = soma(e.dias, (d) => d.revenue);
  const pedidos = soma(e.dias, (d) => d.orders);
  const ticket = pedidos ? Math.round(vendas / pedidos) : 0;
  const antV = soma(e.diasAnterior, (d) => d.revenue);
  const antP = soma(e.diasAnterior, (d) => d.orders);
  const anterior = e.diasAnterior.length && antP ? { vendas: antV, pedidos: antP, ticket: Math.round(antV / antP) } : null;

  // Dia da semana: média por dia (não a soma, porque um mês pode ter 5 sextas e 4 segundas).
  const porDia = Array.from({ length: 7 }, () => ({ total: 0, dias: 0 }));
  for (const d of e.dias) {
    const w = porDia[diaDaSemana(d.day)];
    w.total += d.revenue;
    w.dias++;
  }
  const medias = porDia.map((w, dia) => ({ dia, media: w.dias ? Math.round(w.total / w.dias) : 0, dias: w.dias })).filter((w) => w.dias >= 3);
  const ordenadas = [...medias].sort((a, b) => b.media - a.media);
  const melhorDia = pedidos && ordenadas.length >= 2 ? { dia: ordenadas[0].dia, media: ordenadas[0].media } : null;
  const piorDia = pedidos && ordenadas.length >= 2 ? { dia: ordenadas[ordenadas.length - 1].dia, media: ordenadas[ordenadas.length - 1].media } : null;

  const porHora = Array.from({ length: 24 }, (_, h) => soma(e.dias, (d) => d.byHour?.[h] ?? 0));
  const horaPico = pedidos ? porHora.indexOf(Math.max(...porHora)) : null;

  const qtd = new Map<string, { name: string; quantity: number }>();
  for (const d of e.dias) for (const [id, p] of Object.entries(d.products)) qtd.set(id, { name: p.name, quantity: (qtd.get(id)?.quantity ?? 0) + p.quantity });
  const maisPedidos = [...qtd.entries()].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, 'pt-BR')).slice(0, 5);

  // Cesta: o que sai junto no mesmo pedido.
  const temBebida = e.itens.some((i) => i.drink);
  let comComida = 0;
  let semBeb = 0;
  const pares = new Map<string, number>();
  for (const o of e.pedidos) {
    const ids = [...new Set(o.lines.map((l) => l.productId))];
    const comida = ids.some((id) => itens.get(id) && !itens.get(id)!.drink);
    const bebida = ids.some((id) => itens.get(id)?.drink);
    if (comida) {
      comComida++;
      if (!bebida) semBeb++;
    }
    const sorted = ids.filter((id) => itens.has(id)).sort();
    for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) pares.set(`${sorted[i]}|${sorted[j]}`, (pares.get(`${sorted[i]}|${sorted[j]}`) ?? 0) + 1);
  }
  const paresTop = [...pares.entries()]
    .map(([k, n]) => ({ a: k.split('|')[0], b: k.split('|')[1], pedidos: n }))
    .sort((x, y) => y.pedidos - x.pedidos)
    .slice(0, 3);

  // Quanto da venda de itens tem custo: sem custo não dá para falar de margem.
  let comCusto = 0;
  let total = 0;
  for (const d of e.dias)
    for (const [id, p] of Object.entries(d.products)) {
      const r = Object.values(p.revenue).reduce((n, v) => n + v, 0);
      total += r;
      if (itens.get(id)?.cost != null) comCusto += r;
    }

  const numeros: Numeros = {
    vendas,
    pedidos,
    ticket,
    anterior,
    melhorDia,
    piorDia,
    horaPico,
    porHora,
    porDiaSemana: porDia.map((w, dia) => ({ dia, media: w.dias ? Math.round(w.total / w.dias) : 0, dias: w.dias })),
    maisPedidos,
    semBebida: temBebida && comComida ? { pedidos: semBeb, comComida } : null,
    pares: paresTop,
    coberturaCusto: total ? comCusto / total : 0,
  };
  return { numeros, resumo: resumoDoPeriodo(e.de, e.ate, numeros), sugestoes: sugerir(e, numeros, qtd) };
}

function variacao(agora: number, antes: number) {
  if (!antes) return '';
  const v = (agora - antes) / antes;
  if (Math.abs(v) < 0.01) return ' (igual ao período anterior)';
  return ` (${pct(Math.abs(v))} ${v > 0 ? 'a mais' : 'a menos'} que o período anterior)`;
}

export function resumoDoPeriodo(de: string, ate: string, n: Numeros): string {
  const quando = `De ${dataBR(de)} a ${dataBR(ate)}`;
  if (!n.pedidos) return `${quando} não houve pedidos registrados no sistema.`;
  const partes = [
    `${quando} foram ${n.pedidos} pedidos e ${brl(n.vendas)} em vendas${n.anterior ? variacao(n.vendas, n.anterior.vendas) : ''}.`,
    `O ticket médio foi de ${brl(n.ticket)}${n.anterior ? variacao(n.ticket, n.anterior.ticket) : ''}.`,
  ];
  if (n.melhorDia) partes.push(`O dia mais forte foi ${DIAS[n.melhorDia.dia]}${n.horaPico !== null ? `, e o horário de mais pedidos, ${n.horaPico}h` : ''}.`);
  if (n.maisPedidos[0]) partes.push(`O mais pedido foi ${n.maisPedidos[0].name} (${n.maisPedidos[0].quantity} vezes).`);
  return partes.join(' ');
}

function sugerir(e: EntradaPeriodo, n: Numeros, qtdMes: Map<string, { name: string; quantity: number }>): Sugestao[] {
  const itens = new Map(e.itens.map((i) => [i.id, i]));
  const nome = (id: string) => itens.get(id)?.name ?? qtdMes.get(id)?.name ?? id;
  const out: Sugestao[] = [];
  if (n.pedidos < 10) return out;

  // 1. Pedido com comida e sem bebida: combo.
  if (n.semBebida && n.semBebida.comComida >= 20) {
    const share = n.semBebida.pedidos / n.semBebida.comComida;
    const comida = n.maisPedidos.find((p) => itens.get(p.id) && !itens.get(p.id)!.drink);
    const bebida = [...qtdMes.entries()]
      .filter(([id]) => itens.get(id)?.drink)
      .sort((a, b) => b[1].quantity - a[1].quantity)[0];
    if (share >= 0.5 && comida && bebida) {
      const a = itens.get(comida.id)!;
      const b = itens.get(bebida[0])!;
      const separado = (a.price ?? 0) + (b.price ?? 0);
      let combo = '';
      if (a.price && b.price) {
        const preco = Math.min(separado - 100, precoRedondo(Math.round(separado * 0.9)));
        combo = ` por ${brl(preco)} (separados saem ${brl(separado)})`;
        if (a.cost != null && b.cost != null) combo += `; o combo ainda deixa ${pct((preco - a.cost - b.cost) / preco)} de margem`;
      }
      out.push({
        id: 'combo-bebida',
        titulo: 'Combo com bebida',
        texto: `${pct(share)} dos pedidos com comida saíram sem nenhuma bebida. Vale testar um combo ${a.name} + ${b.name}${combo}, oferecido na hora do pedido.`,
        base: `${n.semBebida.pedidos} de ${n.semBebida.comComida} pedidos com comida não tiveram bebida.`,
        prioridade: 60 + share * 40,
      });
    }
  }

  // 2. Item muito pedido com margem baixa: preço.
  n.maisPedidos.forEach((p, rank) => {
    const i = itens.get(p.id);
    if (!i?.price || i.cost == null) return;
    const margem = (i.price - i.cost) / i.price;
    if (margem >= 0.3) return;
    const alvo = precoRedondo(Math.ceil(i.cost / 0.65));
    out.push({
      id: `preco:${i.id}`,
      titulo: `Rever o preço de ${i.name}`,
      texto: `${i.name} é o ${rank + 1}º mais pedido, mas sobra só ${brl(i.price - i.cost)} por venda (${pct(margem)} do preço). Com ${brl(alvo)}, a margem passa de 35%. Outra saída é rever o custo da receita.`,
      base: `Preço ${brl(i.price)}, custo ${brl(i.cost)}, ${p.quantity} vendidos no período.`,
      prioridade: 70 + (5 - rank) * 4,
    });
  });

  // 3. Item parado nos últimos 3 meses (e com margem baixa ou sem custo): trocar ou tirar.
  const q3 = new Map<string, number>();
  for (const d of e.dias90) for (const [id, p] of Object.entries(d.products)) q3.set(id, (q3.get(id) ?? 0) + p.quantity);
  const noCardapio = e.itens.filter((i) => i.price !== null);
  const quantidades = noCardapio.map((i) => q3.get(i.id) ?? 0).sort((a, b) => a - b);
  const mediana = quantidades[Math.floor(quantidades.length / 2)] ?? 0;
  const parados = noCardapio
    .map((i) => ({ i, q: q3.get(i.id) ?? 0 }))
    .filter(({ q }) => mediana >= 10 && q <= mediana * 0.15)
    .sort((a, b) => a.q - b.q);
  for (const { i, q } of parados.slice(0, 2)) {
    const margem = i.price && i.cost != null ? (i.price - i.cost) / i.price : null;
    if (margem !== null && margem >= 0.45) continue; // sai pouco, mas dá lucro bom: não é caso de tirar
    out.push({
      id: `parado:${i.id}`,
      titulo: `Trocar ou tirar ${i.name}`,
      texto: `${i.name} saiu ${q === 0 ? 'nenhuma vez' : `só ${q} ${q === 1 ? 'vez' : 'vezes'}`} nos últimos 90 dias${margem !== null ? `, com margem de ${pct(margem)}` : ''}. Vale trocar por outro prato ou tirar do cardápio: menos itens deixam a cozinha mais rápida e o cardápio mais fácil de escolher.`,
      base: `Metade dos itens saiu ${mediana} vezes ou mais nos mesmos 90 dias.`,
      prioridade: 45 + (margem !== null && margem < 0.3 ? 15 : 0),
    });
  }

  // 4. O que já sai junto: preço fechado para os dois.
  const par = n.pares[0];
  if (par && par.pedidos / n.pedidos >= 0.15 && !out.some((s) => s.id === 'combo-bebida' && s.texto.includes(nome(par.a)) && s.texto.includes(nome(par.b)))) {
    out.push({
      id: `par:${par.a}:${par.b}`,
      titulo: 'Combo do que já sai junto',
      texto: `${nome(par.a)} e ${nome(par.b)} estiveram no mesmo pedido ${par.pedidos} vezes (${pct(par.pedidos / n.pedidos)} dos pedidos). Um combo dos dois com preço fechado facilita a escolha e pode puxar quem pediria só um deles.`,
      base: `${par.pedidos} de ${n.pedidos} pedidos tinham os dois.`,
      prioridade: 40 + (par.pedidos / n.pedidos) * 50,
    });
  }

  // 5. Dia fraco da semana.
  if (n.melhorDia && n.piorDia && n.melhorDia.media > 0 && n.piorDia.media < n.melhorDia.media * 0.6) {
    out.push({
      id: `dia:${n.piorDia.dia}`,
      titulo: `Movimentar a ${DIAS[n.piorDia.dia]}`,
      texto: `Na média, a ${DIAS[n.piorDia.dia]} vendeu ${brl(n.piorDia.media)}, contra ${brl(n.melhorDia.media)} na ${DIAS[n.melhorDia.dia]}. Uma promoção só nesse dia (um prato do dia ou a bebida junto) pode trazer mais gente sem mexer nos dias cheios.`,
      base: `Média por dia, só contando os dias do período em que houve venda.`,
      prioridade: 35 + (1 - n.piorDia.media / n.melhorDia.media) * 30,
    });
  }

  // 6. Ticket médio caiu com volume para comparar.
  if (n.anterior && n.pedidos >= 30 && n.anterior.pedidos >= 30 && n.ticket < n.anterior.ticket * 0.9) {
    out.push({
      id: 'ticket-caiu',
      titulo: 'Entender a queda do ticket médio',
      texto: `Cada pedido rendeu em média ${brl(n.ticket)}, contra ${brl(n.anterior.ticket)} no período anterior. Vale olhar se os clientes estão levando menos itens ou trocando por itens mais baratos, e oferecer um acompanhamento ou uma bebida no pedido.`,
      base: `${n.pedidos} pedidos neste período e ${n.anterior.pedidos} no anterior.`,
      prioridade: 50,
    });
  }

  // 7. Sem custos, as contas de lucro ficam de fora.
  if (n.coberturaCusto < 0.5) {
    out.push({
      id: 'custos',
      titulo: 'Completar os custos dos pratos',
      texto: `Só ${pct(n.coberturaCusto)} do que foi vendido tem o custo informado. Com o custo de cada prato, dá para mostrar quanto sobra em cada um e onde o preço está apertado.`,
      base: 'Custos em Preços e custos, no painel do dono.',
      prioridade: 30,
    });
  }

  return out.sort((a, b) => b.prioridade - a.prioridade);
}
