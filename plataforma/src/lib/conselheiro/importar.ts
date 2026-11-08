import 'server-only';
import crypto from 'node:crypto';
import { CAMPOS, CANCELADO, CsvError, dataBR, dinheiroBR, inteiroBR, lerCsv, mapearColunas, semAcento } from './csv';
import { custoPorPorcao, CalculoError } from './calculos';
import {
  DadosError,
  adicionarCustos,
  adicionarPrecos,
  adicionarProduto,
  chavesDeVendas,
  getLotes,
  getPerfil,
  gravarVendas,
  hoje,
  limpar,
  listarProdutos,
  novoId,
  registrarLote,
} from './dados';
import { TIPOS_LOTE, type CustoVersao, type PrecoCanal, type TipoLote, type Venda } from './modelo';

/**
 * Importação de planilhas: o dono vê a prévia (linha por linha, com os erros) antes de gravar, e a
 * gravação refaz toda a conferência no servidor com o mesmo arquivo. Nada da prévia vem do navegador.
 */

export interface LinhaPrevia {
  n: number;
  /** O que a linha vai gravar, em texto para o dono conferir. */
  resumo: string;
  erros: string[];
  repetida: boolean;
}

export interface Previa {
  tipo: TipoLote;
  cabecalho: string[];
  mapeamento: Record<string, number | null>;
  linhas: LinhaPrevia[];
  validas: number;
  comErro: number;
  repetidas: number;
  periodo: { inicio: string; fim: string } | null;
  avisos: string[];
  hash: string;
  jaImportado: boolean;
}

type Registro =
  | { tipo: 'produtos'; nome: string; categoria: string }
  | { tipo: 'custos'; custo: Omit<CustoVersao, 'id' | 'registradoEm' | 'registradoPor' | 'loteId' | 'confirmadoPor'> }
  | { tipo: 'precos'; preco: Omit<PrecoCanal, 'id' | 'registradoEm' | 'registradoPor' | 'loteId'> }
  | { tipo: 'vendas'; venda: Venda };

const brl = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;

async function conferir(slug: string, tipo: TipoLote, texto: string, mapaIn: Record<string, number | null> | null, now: Date) {
  if (!TIPOS_LOTE.includes(tipo)) throw new DadosError('Tipo de importação inválido.');
  const { cabecalho, linhas } = lerCsv(texto);
  const auto = mapearColunas(tipo, cabecalho);
  const mapeamento: Record<string, number | null> = {};
  for (const c of CAMPOS[tipo]) {
    const v = mapaIn ? mapaIn[c.id] : auto[c.id];
    mapeamento[c.id] = typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < cabecalho.length ? v : null;
  }
  const faltando = CAMPOS[tipo].filter((c) => c.obrigatorio && mapeamento[c.id] === null).map((c) => c.nome);
  if (tipo === 'vendas' && mapeamento.data === null && (mapeamento.inicio === null || mapeamento.fim === null)) faltando.push('Data, ou Início e Fim do período');
  if (tipo === 'custos' && mapeamento.ingredientes === null && mapeamento.custoLote === null && mapeamento.embalagem === null) faltando.push('um custo (ingredientes, lote ou embalagem)');

  const [produtos, perfil, lotes] = await Promise.all([listarProdutos(slug), getPerfil(slug), getLotes(slug)]);
  const hash = crypto.createHash('sha256').update(texto).digest('hex');
  const porNome = new Map(produtos.map((p) => [semAcento(p.nome), p] as const));
  const porId = new Map(produtos.map((p) => [p.id, p] as const));
  const canalPorNome = new Map(perfil.canais.flatMap((c) => [[semAcento(c.nome), c] as const, [c.id, c] as const]));
  const existentes = tipo === 'vendas' ? await chavesDeVendas(slug) : new Set<string>();
  const dia = hoje(now);
  const col = (l: string[], campo: string) => (mapeamento[campo] === null || mapeamento[campo] === undefined ? '' : (l[mapeamento[campo]!] ?? '').trim());

  const saida: { linha: LinhaPrevia; registro: Registro | null }[] = [];
  const nomesNoArquivo = new Set<string>();
  // Vendas por dia ou por item vendido: somadas por produto, canal e dia antes de conferir repetição.
  const somaDia = new Map<string, { n: number[]; venda: Venda }>();

  linhas.forEach((l, i) => {
    const n = i + 2;
    const erros: string[] = [];
    const pegaProduto = () => {
      const v = col(l, 'produto');
      const p = porId.get(v) ?? porNome.get(semAcento(v));
      if (!v) erros.push('produto vazio');
      else if (!p) erros.push(`produto "${limpar(v, 60)}" não cadastrado (cadastre ou importe a lista de produtos antes)`);
      return p ?? null;
    };
    const pegaCanal = () => {
      const v = col(l, 'canal');
      const c = canalPorNome.get(semAcento(v)) ?? canalPorNome.get(v);
      if (!v) erros.push('canal vazio');
      else if (!c) erros.push(`canal "${limpar(v, 40)}" não cadastrado (cadastre em Canais de venda)`);
      return c ?? null;
    };
    const dinheiro = (campo: string, obrigatorio: boolean) => {
      const v = col(l, campo);
      if (!v) {
        if (obrigatorio) erros.push(`${campo} vazio`);
        return null;
      }
      const r = dinheiroBR(v);
      if (!r.ok) {
        erros.push(`${campo}: ${r.erro}`);
        return null;
      }
      return r.valor;
    };
    const data = (campo: string, padrao: string | null) => {
      const v = col(l, campo);
      if (!v) return padrao;
      const r = dataBR(v);
      if (!r.ok) {
        erros.push(r.erro);
        return null;
      }
      return r.valor;
    };

    let registro: Registro | null = null;
    let resumo = '';
    if (tipo === 'produtos') {
      const nome = limpar(col(l, 'nome'), 80);
      if (!nome) erros.push('nome vazio');
      else if (porNome.has(semAcento(nome))) erros.push(`"${nome}" já está cadastrado`);
      else if (nomesNoArquivo.has(semAcento(nome))) erros.push('nome repetido no arquivo');
      nomesNoArquivo.add(semAcento(nome));
      registro = { tipo, nome, categoria: limpar(col(l, 'categoria'), 60) };
      resumo = `${nome}${registro.categoria ? ` (${registro.categoria})` : ''}`;
    } else if (tipo === 'custos') {
      const p = pegaProduto();
      let ingredientes = dinheiro('ingredientes', false);
      const custoLote = dinheiro('custoLote', false);
      const rendTxt = col(l, 'rendimento').replace(',', '.');
      let lote: { custo: number; rendimento: number } | null = null;
      if (custoLote !== null) {
        const rendimento = Number(rendTxt);
        try {
          const porPorcao = custoPorPorcao(custoLote, rendimento);
          if (ingredientes !== null && ingredientes !== porPorcao) erros.push('custo por unidade e lote ÷ rendimento não batem: deixe só um');
          ingredientes = porPorcao;
          lote = { custo: custoLote, rendimento };
        } catch (err) {
          erros.push(err instanceof CalculoError ? err.message : 'rendimento inválido');
        }
      } else if (rendTxt) erros.push('rendimento sem custo do lote');
      const embalagem = dinheiro('embalagem', false);
      const outros = dinheiro('outros', false);
      const inicio = data('inicio', dia);
      if (inicio && inicio > dia) erros.push('data no futuro');
      if (ingredientes === null && embalagem === null && outros === null && !erros.length) erros.push('nenhum custo informado');
      if (p && inicio) {
        registro = { tipo, custo: { produtoId: p.id, ingredientes, embalagem, outros, lote, inicio, origem: lote ? 'calculado' : 'importado', nota: lote ? `lote de ${brl(lote.custo)} ÷ ${lote.rendimento} porções` : '' } };
        resumo = `${p.nome}: ingredientes ${ingredientes === null ? '—' : brl(ingredientes)}${lote ? ` (lote ÷ ${lote.rendimento})` : ''}, embalagem ${embalagem === null ? '—' : brl(embalagem)}, desde ${inicio.split('-').reverse().join('/')}`;
      }
    } else if (tipo === 'precos') {
      const p = pegaProduto();
      const c = pegaCanal();
      const preco = dinheiro('preco', true);
      const inicio = data('inicio', dia);
      if (p && c && preco !== null && inicio) {
        registro = { tipo, preco: { produtoId: p.id, canalId: c.id, preco, inicio, origem: 'importado' } };
        resumo = `${p.nome} em ${c.nome}: ${brl(preco)} desde ${inicio.split('-').reverse().join('/')}`;
      }
    } else {
      const p = pegaProduto();
      const c = pegaCanal();
      const umDia = data('data', null);
      const inicio = umDia ?? data('inicio', null);
      const fim = umDia ?? data('fim', null);
      if (!inicio || !fim) {
        if (!erros.some((e) => e.includes('data'))) erros.push('período sem data');
      } else if (inicio > fim) erros.push('início depois do fim');
      const cancelada = CANCELADO.test(semAcento(col(l, 'status')));
      const q = inteiroBR(col(l, 'quantidade'));
      if (!q.ok) erros.push(q.erro);
      const receita = dinheiro('receita', !cancelada);
      const desconto = dinheiro('desconto', false);
      if (p && c && inicio && fim && q.ok && !erros.length) {
        const venda: Venda = { produtoId: p.id, canalId: c.id, inicio, fim, quantidade: cancelada ? 0 : q.valor, receita: cancelada ? 0 : (receita ?? 0), desconto: cancelada ? null : desconto, canceladas: cancelada ? q.valor : 0 };
        if (umDia) {
          const k = `${p.id}|${c.id}|${inicio}|${fim}`;
          const s = somaDia.get(k);
          if (s) {
            s.n.push(n);
            s.venda.quantidade += venda.quantidade;
            s.venda.receita += venda.receita;
            s.venda.canceladas += venda.canceladas;
            if (venda.desconto !== null) s.venda.desconto = (s.venda.desconto ?? 0) + venda.desconto;
            saida.push({ linha: { n, resumo: `${p.nome} em ${c.nome}, ${inicio.split('-').reverse().join('/')}: somada à linha ${s.n[0]}`, erros: [], repetida: false }, registro: null });
            return;
          }
          somaDia.set(k, { n: [n], venda });
        }
        registro = { tipo, venda };
        resumo = `${p.nome} em ${c.nome}, ${inicio.split('-').reverse().join('/')}${fim !== inicio ? ` a ${fim.split('-').reverse().join('/')}` : ''}: ${venda.quantidade} un., ${brl(venda.receita)}${venda.canceladas ? `, ${venda.canceladas} cancelada(s)` : ''}`;
      }
    }
    saida.push({ linha: { n, resumo, erros, repetida: false }, registro: erros.length ? null : registro });
  });

  const avisos: string[] = [];
  let periodo: { inicio: string; fim: string } | null = null;
  if (tipo === 'vendas') {
    const chavesArquivo = new Set<string>();
    for (const s of saida) {
      if (s.registro?.tipo !== 'vendas') continue;
      const v = s.registro.venda;
      const k = `${v.produtoId}|${v.canalId}|${v.inicio}|${v.fim}`;
      if (existentes.has(k)) {
        s.linha.repetida = true;
        s.registro = null;
      } else if (chavesArquivo.has(k)) {
        s.linha.erros.push('mesmo produto, canal e período em outra linha do arquivo');
        s.registro = null;
      }
      chavesArquivo.add(k);
    }
    const vs = saida.flatMap((s) => (s.registro?.tipo === 'vendas' ? [s.registro.venda] : []));
    if (vs.length) {
      periodo = { inicio: vs.reduce((m, v) => (v.inicio < m ? v.inicio : m), vs[0].inicio), fim: vs.reduce((m, v) => (v.fim > m ? v.fim : m), vs[0].fim) };
      if (periodo.fim >= dia) avisos.push('O período inclui hoje ou dias futuros: as vendas de hoje ainda estão incompletas.');
      if (periodo.fim > dia) avisos.push('Há datas no futuro: confira o arquivo.');
    }
  }
  const lotesAtivos = lotes.filter((l) => !l.desfeitoEm);
  return {
    previa: {
      tipo,
      cabecalho,
      mapeamento,
      linhas: saida.map((s) => s.linha),
      validas: saida.filter((s) => s.registro).length,
      comErro: saida.filter((s) => s.linha.erros.length).length,
      repetidas: saida.filter((s) => s.linha.repetida).length,
      periodo,
      avisos: faltando.length ? [`Ligue as colunas que faltam: ${faltando.join(', ')}.`, ...avisos] : avisos,
      hash,
      jaImportado: lotesAtivos.some((l) => l.hash === hash),
    } satisfies Previa,
    registros: faltando.length ? [] : saida.flatMap((s) => (s.registro ? [s.registro] : [])),
  };
}

export async function previsualizar(slug: string, tipo: TipoLote, texto: string, mapeamento: Record<string, number | null> | null, now = new Date()): Promise<Previa> {
  try {
    return (await conferir(slug, tipo, texto, mapeamento, now)).previa;
  } catch (err) {
    if (err instanceof CsvError) throw new DadosError(err.message);
    throw err;
  }
}

/**
 * Grava as linhas válidas e não repetidas do arquivo, como um lote rastreável. Quem confirma a importação
 * fica como quem conferiu os valores.
 */
export async function importar(slug: string, input: { tipo: TipoLote; texto: string; mapeamento: Record<string, number | null>; arquivo: string }, by: string, now = new Date()) {
  let conferido;
  try {
    conferido = await conferir(slug, input.tipo, input.texto, input.mapeamento, now);
  } catch (err) {
    if (err instanceof CsvError) throw new DadosError(err.message);
    throw err;
  }
  const { previa, registros } = conferido;
  if (previa.jaImportado) throw new DadosError('Esse arquivo já foi importado.');
  if (!registros.length) throw new DadosError('Nenhuma linha válida para importar.');
  const loteId = novoId('l');
  await registrarLote(slug, {
    id: loteId,
    tipo: input.tipo,
    arquivo: limpar(input.arquivo, 120) || 'planilha.csv',
    hash: previa.hash,
    linhas: previa.linhas.length,
    importadas: registros.length,
    ignoradas: previa.linhas.length - registros.length,
    periodo: previa.periodo,
    em: now.toISOString(),
    por: by,
    desfeitoEm: null,
  });
  if (input.tipo === 'produtos') {
    for (const r of registros) if (r.tipo === 'produtos') await adicionarProduto(slug, { nome: r.nome, categoria: r.categoria }, by, loteId);
  } else if (input.tipo === 'custos') {
    await adicionarCustos(slug, registros.flatMap((r) => (r.tipo === 'custos' ? [{ ...r.custo, loteId, confirmadoPor: by }] : [])), by);
  } else if (input.tipo === 'precos') {
    await adicionarPrecos(slug, registros.flatMap((r) => (r.tipo === 'precos' ? [{ ...r.preco, loteId }] : [])), by);
  } else {
    await gravarVendas(slug, loteId, registros.flatMap((r) => (r.tipo === 'vendas' ? [r.venda] : [])));
  }
  return { loteId, importadas: registros.length, ignoradas: previa.linhas.length - registros.length };
}
