/**
 * Motor de cálculos do Conselheiro. Funções puras, sem leitura nem gravação: o servidor e a tela do
 * simulador usam as mesmas. Nenhum número das análises vem da IA; ela só escolhe a conta e explica.
 *
 * Unidades:
 *   - dinheiro em centavos inteiros (number, sempre inteiro);
 *   - percentuais em pontos-base (100 = 1%, 10000 = 100%), inteiros;
 *   - volumes em unidades inteiras.
 * Arredondamento: cada componente em centavos é arredondado uma vez, para o centavo mais próximo
 * (meio para cima), antes de somar. Volumes de equilíbrio sobem para a próxima unidade inteira.
 *
 * Contribuição = receita da unidade depois do desconto − custos variáveis conhecidos. Não é lucro:
 * aluguel, equipe, energia e outros custos fixos não entram, e tributo só entra se foi informado.
 */

export class CalculoError extends Error {}

export const MAX_CENTAVOS = 100_000_000; // R$ 1 milhão por unidade
export const MAX_VOLUME = 10_000_000;

/** Custos de 1 unidade. `null` = não informado (não é zero). */
export interface CustosUnidade {
  ingredientes: number | null;
  embalagem: number | null;
  /** Outros custos variáveis informados (ex.: brinde, subsídio de entrega pago pela loja). */
  outros: number | null;
}

/** Percentuais do canal. `null` = não informado. Tributo só entra quando o dono confirmou. */
export interface TaxasCanal {
  comissaoBps: number | null;
  /** Sobre o que a comissão incide: preço depois do desconto (padrão) ou preço cheio. */
  comissaoBase: 'liquido' | 'bruto';
  pagamentoBps: number | null;
  tributosBps: number | null;
}

export interface EntradaUnidade {
  /** Preço cheio da unidade no canal. */
  preco: number;
  /** Desconto em centavos dado nesta unidade (0 sem desconto). */
  desconto: number;
  custos: CustosUnidade;
  taxas: TaxasCanal;
}

export type Rotulo = 'contribuição' | 'contribuição após ingredientes' | 'contribuição parcial';

export interface ResultadoUnidade {
  receita: number;
  comissao: number | null;
  pagamento: number | null;
  tributos: number | null;
  ingredientes: number | null;
  embalagem: number | null;
  outros: number | null;
  /** null quando falta o custo dos ingredientes: sem ele não há conta. */
  contribuicao: number | null;
  /** Contribuição sobre a receita, em pontos-base (null sem receita ou sem contribuição). */
  margemBps: number | null;
  rotulo: Rotulo;
  /** O que não entrou na conta por não estar informado. */
  naoConsiderados: string[];
}

export const SEM_TAXAS: TaxasCanal = { comissaoBps: 0, comissaoBase: 'liquido', pagamentoBps: 0, tributosBps: 0 };

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

function centavos(v: number | null, nome: string, nullable = true): void {
  if (v === null) {
    if (!nullable) throw new CalculoError(`${nome}: valor obrigatório.`);
    return;
  }
  if (!isInt(v) || v < 0 || v > MAX_CENTAVOS) throw new CalculoError(`${nome}: valor inválido.`);
}

function bps(v: number | null, nome: string): void {
  if (v === null) return;
  if (!isInt(v) || v < 0 || v > 10_000) throw new CalculoError(`${nome}: percentual inválido (use de 0% a 100%).`);
}

function volume(v: number, nome: string): void {
  if (!isInt(v) || v < 0 || v > MAX_VOLUME) throw new CalculoError(`${nome}: quantidade inválida (use um número inteiro de 0 a ${MAX_VOLUME}).`);
}

/** Percentual sobre uma base em centavos, arredondado ao centavo. */
export const pct = (base: number, pontos: number) => Math.round((base * pontos) / 10_000);

/** Contribuição de 1 unidade. Cada percentual incide uma vez só, sobre a base definida. */
export function contribuicaoUnitaria(e: EntradaUnidade): ResultadoUnidade {
  centavos(e.preco, 'Preço', false);
  centavos(e.desconto, 'Desconto', false);
  if (e.desconto > e.preco) throw new CalculoError('O desconto não pode ser maior que o preço.');
  centavos(e.custos.ingredientes, 'Custo dos ingredientes');
  centavos(e.custos.embalagem, 'Embalagem');
  centavos(e.custos.outros, 'Outros custos');
  bps(e.taxas.comissaoBps, 'Comissão do canal');
  bps(e.taxas.pagamentoBps, 'Taxa de pagamento');
  bps(e.taxas.tributosBps, 'Tributos');

  const receita = e.preco - e.desconto;
  const baseComissao = e.taxas.comissaoBase === 'bruto' ? e.preco : receita;
  const comissao = e.taxas.comissaoBps === null ? null : pct(baseComissao, e.taxas.comissaoBps);
  const pagamento = e.taxas.pagamentoBps === null ? null : pct(receita, e.taxas.pagamentoBps);
  const tributos = e.taxas.tributosBps === null ? null : pct(receita, e.taxas.tributosBps);
  const { ingredientes, embalagem, outros } = e.custos;

  const partes: [string, number | null][] = [
    ['embalagem', embalagem],
    ['comissão do canal', comissao],
    ['taxa de pagamento', pagamento],
    ['tributos variáveis', tributos],
    ['outros custos variáveis', outros],
  ];
  const naoConsiderados = partes.filter(([, v]) => v === null).map(([n]) => n);
  if (ingredientes === null) naoConsiderados.unshift('custo dos ingredientes');
  const rotulo: Rotulo = naoConsiderados.length === 0 ? 'contribuição' : naoConsiderados.length === partes.length ? 'contribuição após ingredientes' : 'contribuição parcial';

  const contribuicao = ingredientes === null ? null : receita - ingredientes - partes.reduce((s, [, v]) => s + (v ?? 0), 0);
  return {
    receita,
    comissao,
    pagamento,
    tributos,
    ingredientes,
    embalagem,
    outros,
    contribuicao,
    margemBps: contribuicao === null || receita <= 0 ? null : Math.round((contribuicao * 10_000) / receita),
    rotulo,
    naoConsiderados,
  };
}

/** Uma divisão com o valor exato (2 casas, em texto) e o inteiro para cima. */
export interface Quociente {
  /** Ex.: "166,67". */
  exato: string;
  /** Próxima unidade inteira (ex.: 167). */
  inteiro: number;
}

export function quociente(numerador: number, denominador: number): Quociente {
  if (!isInt(numerador) || !isInt(denominador) || numerador < 0 || denominador <= 0) throw new CalculoError('Divisão inválida.');
  const cents = Math.round((numerador * 100) / denominador);
  const exato = `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
  // Teto exato com inteiros (sem erro de ponto flutuante).
  return { exato, inteiro: Math.floor((numerador + denominador - 1) / denominador) };
}

export interface Cenario {
  volume: number;
  /** Contribuição total com o preço proposto nesse volume. */
  total: number;
  /** Diferença para a contribuição total de hoje (null sem volume de hoje). */
  diferenca: number | null;
}

export interface Equilibrio {
  /** Volume que mantém a contribuição total de hoje com a nova contribuição por unidade. */
  volume: Quociente | null;
  /** Quantas unidades a menos dá para vender sem perder contribuição (positivo) ou quantas a mais são precisas (negativo). */
  folgaUnidades: number | null;
  /** A mesma folga em pontos-base do volume de hoje: queda máxima (positivo) ou aumento necessário (negativo). */
  folgaBps: number | null;
  /** Explicação quando o método normal não se aplica. */
  observacao: string | null;
}

export type Status = 'ok' | 'sem-custo' | 'sem-volume';

export interface ResultadoPreco {
  status: Status;
  atual: ResultadoUnidade;
  proposto: ResultadoUnidade;
  volumeAtual: number | null;
  totalAtual: number | null;
  cenarios: Cenario[];
  equilibrio: Equilibrio;
  avisos: string[];
}

function equilibrio(totalAtual: number | null, volumeAtual: number | null, unidadeAtual: number, unidadeNova: number): Equilibrio {
  const vazio = (observacao: string): Equilibrio => ({ volume: null, folgaUnidades: null, folgaBps: null, observacao });
  if (totalAtual === null || volumeAtual === null) return vazio('Sem o volume de hoje não dá para calcular o ponto de equilíbrio: informe quantas unidades saem no período.');
  if (volumeAtual === 0) return vazio('Sem vendas no período de base, não há contribuição de hoje para manter.');
  if (unidadeNova <= 0) return vazio('Com a nova contribuição por unidade zero ou negativa, cada venda perde dinheiro: não existe ponto de equilíbrio positivo pelo método normal.');
  if (unidadeAtual <= 0) return vazio('A contribuição de hoje já é zero ou negativa: qualquer volume com a nova contribuição positiva fica acima dela.');
  const v = quociente(totalAtual, unidadeNova);
  const folgaUnidades = volumeAtual - v.inteiro;
  const folgaBps = Math.floor(((unidadeNova - unidadeAtual) * 10_000) / unidadeNova);
  return { volume: v, folgaUnidades, folgaBps, observacao: null };
}

/**
 * Mudança de preço: contribuição de hoje e proposta, resultado em cada volume simulado, volume que mantém a
 * contribuição total e a queda máxima de volume suportada. Os volumes são hipóteses de quem simula.
 */
export function simularPreco(input: { atual: EntradaUnidade; proposto: EntradaUnidade; volumeAtual: number | null; volumes: number[] }): ResultadoPreco {
  if (input.volumeAtual !== null) volume(input.volumeAtual, 'Volume de hoje');
  if (input.volumes.length > 12) throw new CalculoError('No máximo 12 volumes por simulação.');
  input.volumes.forEach((v) => volume(v, 'Volume simulado'));
  const atual = contribuicaoUnitaria(input.atual);
  const proposto = contribuicaoUnitaria(input.proposto);
  const avisos: string[] = [];
  if (atual.rotulo !== 'contribuição' || proposto.rotulo !== 'contribuição') {
    const faltam = [...new Set([...atual.naoConsiderados, ...proposto.naoConsiderados])].filter((n) => n !== 'custo dos ingredientes');
    if (faltam.length) avisos.push(`Fora da conta por não estarem informados: ${faltam.join(', ')}.`);
  }
  if (atual.contribuicao === null || proposto.contribuicao === null) {
    return {
      status: 'sem-custo',
      atual,
      proposto,
      volumeAtual: input.volumeAtual,
      totalAtual: null,
      cenarios: [],
      equilibrio: { volume: null, folgaUnidades: null, folgaBps: null, observacao: 'Falta o custo dos ingredientes: sem ele não há contribuição para comparar.' },
      avisos,
    };
  }
  const totalAtual = input.volumeAtual === null ? null : atual.contribuicao * input.volumeAtual;
  const cenarios = [...new Set(input.volumes)]
    .sort((a, b) => a - b)
    .map((v) => ({ volume: v, total: proposto.contribuicao! * v, diferenca: totalAtual === null ? null : proposto.contribuicao! * v - totalAtual }));
  if (proposto.contribuicao <= 0) avisos.push('Com o preço proposto a contribuição por unidade fica zero ou negativa.');
  return {
    status: input.volumeAtual === null ? 'sem-volume' : 'ok',
    atual,
    proposto,
    volumeAtual: input.volumeAtual,
    totalAtual,
    cenarios,
    equilibrio: equilibrio(totalAtual, input.volumeAtual, atual.contribuicao, proposto.contribuicao),
    avisos,
  };
}

export interface ResultadoDesconto extends ResultadoPreco {
  descontoUnidade: number;
  /** Unidades a mais (sobre o volume de hoje) para manter a contribuição total, já em inteiros. */
  volumeAdicional: number | null;
  capacidade: number | null;
}

/**
 * Promoção com desconto percentual. Calcula quantas unidades a mais seriam precisas para manter a
 * contribuição total de hoje e confere com a capacidade informada (se houver).
 */
export function simularDesconto(input: { base: EntradaUnidade; descontoBps: number; volumeAtual: number | null; volumes: number[]; capacidade: number | null }): ResultadoDesconto {
  bps(input.descontoBps, 'Desconto');
  if (input.base.desconto !== 0) throw new CalculoError('A base da promoção deve estar sem desconto.');
  if (input.capacidade !== null) volume(input.capacidade, 'Capacidade');
  const descontoUnidade = pct(input.base.preco, input.descontoBps);
  const r = simularPreco({ atual: input.base, proposto: { ...input.base, desconto: descontoUnidade }, volumeAtual: input.volumeAtual, volumes: input.volumes });
  const v = r.equilibrio.volume;
  const volumeAdicional = v && input.volumeAtual !== null ? Math.max(0, v.inteiro - input.volumeAtual) : null;
  const avisos = [...r.avisos];
  if (v && input.capacidade !== null && v.inteiro > input.capacidade) {
    avisos.push(`Para manter a contribuição seriam precisas ${v.inteiro} unidades, acima da capacidade informada (${input.capacidade}).`);
  }
  if (input.capacidade === null && v) avisos.push('Confira se a cozinha e a equipe dão conta do volume a mais antes de lançar a promoção.');
  avisos.push('Promoção pode trazer custos que não estão aqui (divulgação, horas extras, mais embalagem): some se houver.');
  return { ...r, avisos, descontoUnidade, volumeAdicional, capacidade: input.capacidade };
}

export interface ItemCombo {
  id: string;
  nome: string;
  quantidade: number;
  /** Preço avulso de 1 unidade no mesmo canal. */
  precoAvulso: number;
  /** Custo de ingredientes de 1 unidade; null = não informado. */
  custoUnitario: number | null;
}

/** De cada 100 combos vendidos, quantos (em pontos-base) viriam de cada tipo de cliente. Hipóteses. */
export interface MixCombo {
  /** Já compraria todos os itens separados: o combo só dá desconto. */
  jaCompravamBps: number;
  /** Compraria só o item principal: o combo vende o resto. */
  soPrincipalBps: number;
  /** Não compraria nada sem o combo. */
  novosBps: number;
}

export interface ResultadoCombo {
  status: 'ok' | 'sem-custo';
  combo: ResultadoUnidade;
  separado: ResultadoUnidade;
  principal: ResultadoUnidade;
  precoSeparado: number;
  descontoCombo: number;
  descontoComboBps: number;
  /** Ganho ou perda de contribuição por combo, comparado ao que o cliente faria sem ele. */
  incrementalPorTipo: { jaCompravam: number | null; soPrincipal: number | null; novos: number | null };
  /** Total incremental pelas premissas do mix, no volume informado. */
  incrementalTotal: number | null;
  /** O que daria se todo combo contasse como venda nova (o erro comum). */
  seTudoFosseNovo: number | null;
  vendasCombo: number;
  avisos: string[];
}

export function simularCombo(input: {
  itens: ItemCombo[];
  principalId: string;
  precoCombo: number;
  taxas: TaxasCanal;
  embalagem: number | null;
  vendasCombo: number;
  mix: MixCombo;
}): ResultadoCombo {
  if (input.itens.length < 2 || input.itens.length > 8) throw new CalculoError('Um combo tem de 2 a 8 itens.');
  centavos(input.precoCombo, 'Preço do combo', false);
  centavos(input.embalagem, 'Embalagem');
  volume(input.vendasCombo, 'Combos vendidos');
  const { jaCompravamBps, soPrincipalBps, novosBps } = input.mix;
  [jaCompravamBps, soPrincipalBps, novosBps].forEach((v) => bps(v, 'Mix de clientes'));
  if (jaCompravamBps + soPrincipalBps + novosBps !== 10_000) throw new CalculoError('O mix de clientes precisa somar 100%.');
  for (const i of input.itens) {
    if (!isInt(i.quantidade) || i.quantidade < 1 || i.quantidade > 20) throw new CalculoError(`${i.nome}: quantidade inválida.`);
    centavos(i.precoAvulso, `${i.nome}: preço avulso`, false);
    centavos(i.custoUnitario, `${i.nome}: custo`);
  }
  const principal = input.itens.find((i) => i.id === input.principalId);
  if (!principal) throw new CalculoError('Escolha o item principal do combo.');

  const custo = (itens: ItemCombo[]) => (itens.some((i) => i.custoUnitario === null) ? null : itens.reduce((s, i) => s + i.custoUnitario! * i.quantidade, 0));
  const preco = (itens: ItemCombo[]) => itens.reduce((s, i) => s + i.precoAvulso * i.quantidade, 0);
  const unidade = (p: number, itens: ItemCombo[]) =>
    contribuicaoUnitaria({ preco: p, desconto: 0, custos: { ingredientes: custo(itens), embalagem: input.embalagem, outros: 0 }, taxas: input.taxas });

  const precoSeparado = preco(input.itens);
  const combo = unidade(input.precoCombo, input.itens);
  const separado = unidade(precoSeparado, input.itens);
  const princ = unidade(preco([principal]), [principal]);
  const descontoCombo = precoSeparado - input.precoCombo;
  const avisos: string[] = [];
  if (descontoCombo < 0) avisos.push('O combo está mais caro que os itens separados.');
  if (input.embalagem === null) avisos.push('Embalagem não informada: ficou fora da conta.');
  avisos.push('O mix de clientes é uma hipótese: dá para medir depois com um teste.');

  if (combo.contribuicao === null || separado.contribuicao === null || princ.contribuicao === null) {
    return {
      status: 'sem-custo',
      combo,
      separado,
      principal: princ,
      precoSeparado,
      descontoCombo,
      descontoComboBps: precoSeparado ? Math.round((descontoCombo * 10_000) / precoSeparado) : 0,
      incrementalPorTipo: { jaCompravam: null, soPrincipal: null, novos: null },
      incrementalTotal: null,
      seTudoFosseNovo: null,
      vendasCombo: input.vendasCombo,
      avisos: [`Falta o custo de: ${input.itens.filter((i) => i.custoUnitario === null).map((i) => i.nome).join(', ')}.`, ...avisos],
    };
  }
  const jaCompravam = combo.contribuicao - separado.contribuicao;
  const soPrincipal = combo.contribuicao - princ.contribuicao;
  const novos = combo.contribuicao;
  const incrementalTotal = Math.round((input.vendasCombo * (jaCompravamBps * jaCompravam + soPrincipalBps * soPrincipal + novosBps * novos)) / 10_000);
  return {
    status: 'ok',
    combo,
    separado,
    principal: princ,
    precoSeparado,
    descontoCombo,
    descontoComboBps: precoSeparado ? Math.round((descontoCombo * 10_000) / precoSeparado) : 0,
    incrementalPorTipo: { jaCompravam, soPrincipal, novos },
    incrementalTotal,
    seTudoFosseNovo: input.vendasCombo * novos,
    vendasCombo: input.vendasCombo,
    avisos,
  };
}

/** Um grupo medido de um teste: valor da métrica, dias e atendimentos elegíveis. */
export interface Medida {
  /** Centavos (contribuição, receita) ou unidades, conforme a métrica. */
  valor: number;
  dias: number;
  atendimentos: number | null;
}

export interface Avaliacao {
  diferencaTotal: number;
  /** Por dia, para comparar períodos de tamanhos diferentes. */
  porDiaBase: number;
  porDiaTeste: number;
  diferencaPorDia: number;
  porAtendimentoBase: number | null;
  porAtendimentoTeste: number | null;
  /** Sempre "observado": esta conta não prova causa. */
  natureza: 'observado';
  avisos: string[];
}

/** Pouca amostra: abaixo disso em um dos grupos o resultado é marcado como fraco. */
export const AMOSTRA_MINIMA = 30;

/**
 * Compara o grupo de base com o grupo do teste sem teste estatístico: mostra a diferença observada,
 * normalizada por dia e por atendimento, e diz o que a comparação não consegue separar.
 */
export function avaliarResultado(input: { desenho: 'antes-depois' | 'controle'; base: Medida; teste: Medida }): Avaliacao {
  const { base, teste } = input;
  for (const [nome, m] of [['base', base], ['teste', teste]] as const) {
    if (!isInt(m.valor) || Math.abs(m.valor) > MAX_CENTAVOS * 1000) throw new CalculoError(`Valor do grupo ${nome} inválido.`);
    if (!isInt(m.dias) || m.dias < 1 || m.dias > 366) throw new CalculoError(`Dias do grupo ${nome} inválidos.`);
    if (m.atendimentos !== null) volume(m.atendimentos, `Atendimentos do grupo ${nome}`);
  }
  const porDiaBase = Math.round(base.valor / base.dias);
  const porDiaTeste = Math.round(teste.valor / teste.dias);
  const porAt = (m: Medida) => (m.atendimentos ? Math.round(m.valor / m.atendimentos) : null);
  const avisos: string[] = ['Resultado observado: mostra o que aconteceu, não prova que foi a mudança que causou.'];
  if (input.desenho === 'antes-depois') {
    avisos.push('Antes e depois não separam o efeito da mudança de época do ano, clima, feriados, promoções e falta de produto no período.');
  }
  if (base.dias !== teste.dias) avisos.push(`Os períodos têm tamanhos diferentes (${base.dias} e ${teste.dias} dias): compare os valores por dia.`);
  if ((base.atendimentos ?? 0) < AMOSTRA_MINIMA || (teste.atendimentos ?? 0) < AMOSTRA_MINIMA) {
    avisos.push(`Pouca amostra (menos de ${AMOSTRA_MINIMA} atendimentos em um dos grupos): a diferença pode ser acaso. Considere inconclusivo ou estender o teste.`);
  }
  return {
    diferencaTotal: teste.valor - base.valor,
    porDiaBase,
    porDiaTeste,
    diferencaPorDia: porDiaTeste - porDiaBase,
    porAtendimentoBase: porAt(base),
    porAtendimentoTeste: porAt(teste),
    natureza: 'observado',
    avisos,
  };
}

/** Custo por porção quando se conhece o custo de um lote e quantas porções ele rende. */
export function custoPorPorcao(custoLote: number, rendimento: number): number {
  centavos(custoLote, 'Custo do lote', false);
  if (typeof rendimento !== 'number' || !Number.isFinite(rendimento) || rendimento <= 0 || rendimento > 100_000) throw new CalculoError('Rendimento inválido: informe quantas porções o lote rende (maior que zero).');
  return Math.round(custoLote / rendimento);
}

/** "12,5%" em texto a partir de pontos-base. */
export function fmtBps(v: number | null): string {
  if (v === null) return '—';
  const s = (v / 100).toFixed(v % 100 === 0 ? 0 : v % 10 === 0 ? 1 : 2).replace('.', ',');
  return `${s}%`;
}

export function brl(cents: number | null): string {
  if (cents === null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100).replace(/\u00a0/g, ' ');
}

/**
 * Contribuição de um conjunto de vendas já somadas (receita depois dos descontos e unidades). Os
 * percentuais incidem sobre a receita; comissão "bruto" usa receita + desconto quando o desconto é conhecido.
 * Sem custo dos ingredientes, devolve null (não inventa).
 */
export function contribuicaoAgregada(input: { receita: number; quantidade: number; desconto: number | null; custos: CustosUnidade; taxas: TaxasCanal }): { contribuicao: number | null; naoConsiderados: string[] } {
  const { receita, quantidade, desconto, custos, taxas } = input;
  if (!isInt(receita) || receita < 0 || !isInt(quantidade) || quantidade < 0) throw new CalculoError('Vendas inválidas.');
  const naoConsiderados: string[] = [];
  if (custos.ingredientes === null) return { contribuicao: null, naoConsiderados: ['custo dos ingredientes'] };
  const porUnidade = custos.ingredientes + (custos.embalagem ?? 0) + (custos.outros ?? 0);
  if (custos.embalagem === null) naoConsiderados.push('embalagem');
  if (custos.outros === null) naoConsiderados.push('outros custos variáveis');
  const baseComissao = taxas.comissaoBase === 'bruto' && desconto !== null ? receita + desconto : receita;
  if (taxas.comissaoBase === 'bruto' && desconto === null && taxas.comissaoBps) naoConsiderados.push('desconto (comissão calculada sobre a receita líquida)');
  const perc = (v: number | null, base: number, nome: string) => {
    if (v === null) {
      naoConsiderados.push(nome);
      return 0;
    }
    return pct(base, v);
  };
  const taxasTotal = perc(taxas.comissaoBps, baseComissao, 'comissão do canal') + perc(taxas.pagamentoBps, receita, 'taxa de pagamento') + perc(taxas.tributosBps, receita, 'tributos variáveis');
  return { contribuicao: receita - porUnidade * quantidade - taxasTotal, naoConsiderados };
}

export type ClasseCardapio = 'estrela' | 'cavalo-de-batalha' | 'quebra-cabeca' | 'abacaxi';

/**
 * Matriz de engenharia de cardápio (Kasavana & Smith) dentro de cada categoria: "vende muito" quando a
 * participação na quantidade passa de 70% da participação média (1/N); "deixa muito" quando a
 * contribuição por unidade passa da média da categoria ponderada pela quantidade. Itens sem custo ou
 * sem venda ficam fora (não dá para classificar sem dado).
 */
export function classificarCardapio(itens: { id: string; categoria: string; quantidade: number; contribuicaoUnitaria: number | null }[]) {
  const porCategoria = new Map<string, typeof itens>();
  for (const i of itens) {
    if (i.contribuicaoUnitaria === null || i.quantidade <= 0) continue;
    porCategoria.set(i.categoria, [...(porCategoria.get(i.categoria) ?? []), i]);
  }
  const out: { id: string; categoria: string; classe: ClasseCardapio; participacaoBps: number; limiteParticipacaoBps: number; limiteContribuicao: number }[] = [];
  for (const [categoria, grupo] of porCategoria) {
    if (grupo.length < 2) continue;
    const total = grupo.reduce((s, i) => s + i.quantidade, 0);
    const limiteParticipacaoBps = Math.round((0.7 * 10_000) / grupo.length);
    const limiteContribuicao = Math.round(grupo.reduce((s, i) => s + i.contribuicaoUnitaria! * i.quantidade, 0) / total);
    for (const i of grupo) {
      const participacaoBps = Math.round((i.quantidade * 10_000) / total);
      const popular = participacaoBps >= limiteParticipacaoBps;
      const rentavel = i.contribuicaoUnitaria! >= limiteContribuicao;
      out.push({ id: i.id, categoria, classe: popular ? (rentavel ? 'estrela' : 'cavalo-de-batalha') : rentavel ? 'quebra-cabeca' : 'abacaxi', participacaoBps, limiteParticipacaoBps, limiteContribuicao });
    }
  }
  return out;
}
