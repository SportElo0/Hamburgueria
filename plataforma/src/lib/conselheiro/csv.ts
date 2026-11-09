/**
 * Leitura de planilhas CSV do Conselheiro (pura, sem gravar nada). Aceita separador ";" (Excel em
 * português), "," ou tabulação, aspas, números no formato brasileiro e datas dd/mm/aaaa ou aaaa-mm-dd.
 * Tudo que vem do arquivo é dado, nunca instrução: os textos são limpos e limitados antes de usar.
 */

/** Abaixo do limite de 1 MB por envio das Server Actions do Next (o arquivo vai inteiro na prévia e na gravação). */
export const MAX_BYTES_CSV = 900 * 1024;
export const MAX_LINHAS_CSV = 5000;
const MAX_COLUNAS = 30;

export class CsvError extends Error {}

function separador(primeira: string): string {
  const conta = (c: string) => {
    let n = 0;
    let aspas = false;
    for (const ch of primeira) {
      if (ch === '"') aspas = !aspas;
      else if (ch === c && !aspas) n++;
    }
    return n;
  };
  return [';', '\t', ','].reduce((best, c) => (conta(c) > conta(best) ? c : best), ';');
}

/** Linhas e colunas do CSV. A primeira linha é o cabeçalho. */
export function lerCsv(texto: string): { cabecalho: string[]; linhas: string[][] } {
  if (texto.length > MAX_BYTES_CSV) throw new CsvError('Arquivo grande demais (máximo 900 KB). Divida em partes, por mês por exemplo.');
  const t = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const fimPrimeira = t.indexOf('\n');
  const sep = separador(fimPrimeira === -1 ? t : t.slice(0, fimPrimeira));
  const linhas: string[][] = [];
  let campo = '';
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (aspas) {
      if (ch === '"' && t[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') aspas = false;
      else campo += ch;
      continue;
    }
    if (ch === '"' && campo === '') aspas = true;
    else if (ch === sep) {
      linha.push(campo);
      campo = '';
    } else if (ch === '\n') {
      linha.push(campo);
      if (linha.some((c) => c.trim() !== '')) linhas.push(linha);
      linha = [];
      campo = '';
      if (linhas.length > MAX_LINHAS_CSV + 1) throw new CsvError(`No máximo ${MAX_LINHAS_CSV} linhas por arquivo.`);
    } else campo += ch;
  }
  linha.push(campo);
  if (linha.some((c) => c.trim() !== '')) linhas.push(linha);
  if (linhas.length < 2) throw new CsvError('O arquivo precisa de um cabeçalho e ao menos uma linha.');
  if (linhas.length > MAX_LINHAS_CSV + 1) throw new CsvError(`No máximo ${MAX_LINHAS_CSV} linhas por arquivo.`);
  const cabecalho = linhas[0].map((c) => c.trim().slice(0, 60));
  if (cabecalho.length > MAX_COLUNAS) throw new CsvError(`No máximo ${MAX_COLUNAS} colunas.`);
  return { cabecalho, linhas: linhas.slice(1).map((l) => l.slice(0, MAX_COLUNAS).map((c) => c.trim())) };
}

/** "R$ 1.234,56", "1234,56", "12.50", "15" → centavos. Ponto com 3 casas e sem vírgula é ambíguo. */
export function dinheiroBR(s: string): { ok: true; valor: number } | { ok: false; erro: string } {
  let t = s.replace(/R\$|\s/g, '');
  if (!t) return { ok: false, erro: 'vazio' };
  let negativo = false;
  if (t.startsWith('-')) {
    negativo = true;
    t = t.slice(1);
  }
  let normal: string;
  if (t.includes(',')) {
    if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t)) return { ok: false, erro: `valor "${s}" não reconhecido` };
    normal = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    return { ok: false, erro: `valor "${s}" ambíguo: use vírgula para os centavos (ex.: 1.234,00)` };
  } else {
    if (!/^\d+(\.\d{1,2})?$/.test(t)) return { ok: false, erro: `valor "${s}" não reconhecido` };
    normal = t;
  }
  const [inteiro, frac = ''] = normal.split('.');
  const valor = Number(inteiro) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(valor)) return { ok: false, erro: `valor "${s}" grande demais` };
  if (negativo) return { ok: false, erro: `valor negativo "${s}"` };
  return { ok: true, valor };
}

/** Quantidade inteira: "1.234" ou "1234". Fração não é aceita. */
export function inteiroBR(s: string): { ok: true; valor: number } | { ok: false; erro: string } {
  const t = s.replace(/\s/g, '');
  if (!t) return { ok: false, erro: 'vazio' };
  if (/^\d{1,3}(\.\d{3})+$/.test(t) || /^\d+$/.test(t)) {
    const valor = Number(t.replace(/\./g, ''));
    return Number.isSafeInteger(valor) ? { ok: true, valor } : { ok: false, erro: `quantidade "${s}" grande demais` };
  }
  return { ok: false, erro: `quantidade "${s}" inválida (use número inteiro)` };
}

/** "dd/mm/aaaa" ou "aaaa-mm-dd" → "aaaa-mm-dd", conferindo se o dia existe. */
export function dataBR(s: string): { ok: true; valor: string } | { ok: false; erro: string } {
  const t = s.trim();
  let a: number, m: number, d: number;
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (br) [d, m, a] = [Number(br[1]), Number(br[2]), Number(br[3])];
  else if (iso) [a, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return { ok: false, erro: `data "${s}" inválida (use dd/mm/aaaa)` };
  const dt = new Date(Date.UTC(a, m - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d || a < 2000 || a > 2100) return { ok: false, erro: `data "${s}" não existe` };
  return { ok: true, valor: `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
}

/** "12%", "12,5" → pontos-base. */
export function percentualBR(s: string): { ok: true; valor: number } | { ok: false; erro: string } {
  const t = s.replace(/%|\s/g, '').replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return { ok: false, erro: `percentual "${s}" inválido` };
  const valor = Math.round(Number(t) * 100);
  return valor <= 10_000 ? { ok: true, valor } : { ok: false, erro: `percentual "${s}" acima de 100%` };
}

export const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export interface Campo {
  id: string;
  nome: string;
  obrigatorio: boolean;
  apelidos: string[];
}

export const CAMPOS: Record<'produtos' | 'custos' | 'precos' | 'vendas', Campo[]> = {
  produtos: [
    { id: 'nome', nome: 'Nome do produto', obrigatorio: true, apelidos: ['nome', 'produto', 'item', 'descricao'] },
    { id: 'categoria', nome: 'Categoria', obrigatorio: false, apelidos: ['categoria', 'grupo', 'secao'] },
  ],
  custos: [
    { id: 'produto', nome: 'Produto', obrigatorio: true, apelidos: ['produto', 'item', 'nome'] },
    { id: 'ingredientes', nome: 'Custo dos ingredientes por unidade', obrigatorio: false, apelidos: ['custo', 'custo ingredientes', 'custo unitario', 'cmv', 'custo por porcao'] },
    { id: 'custoLote', nome: 'Custo do lote (com rendimento)', obrigatorio: false, apelidos: ['custo lote', 'custo do lote', 'custo receita'] },
    { id: 'rendimento', nome: 'Rendimento (porções do lote)', obrigatorio: false, apelidos: ['rendimento', 'porcoes', 'rende'] },
    { id: 'embalagem', nome: 'Embalagem por unidade', obrigatorio: false, apelidos: ['embalagem'] },
    { id: 'outros', nome: 'Outros custos variáveis', obrigatorio: false, apelidos: ['outros', 'outros custos'] },
    { id: 'inicio', nome: 'Vale a partir de', obrigatorio: false, apelidos: ['inicio', 'data', 'vigencia', 'a partir de'] },
  ],
  precos: [
    { id: 'produto', nome: 'Produto', obrigatorio: true, apelidos: ['produto', 'item', 'nome'] },
    { id: 'canal', nome: 'Canal', obrigatorio: true, apelidos: ['canal', 'origem', 'plataforma'] },
    { id: 'preco', nome: 'Preço', obrigatorio: true, apelidos: ['preco', 'valor', 'preco venda'] },
    { id: 'inicio', nome: 'Vale a partir de', obrigatorio: false, apelidos: ['inicio', 'data', 'vigencia', 'a partir de'] },
  ],
  vendas: [
    { id: 'produto', nome: 'Produto', obrigatorio: true, apelidos: ['produto', 'item', 'nome'] },
    { id: 'canal', nome: 'Canal', obrigatorio: true, apelidos: ['canal', 'origem', 'plataforma'] },
    { id: 'data', nome: 'Data (uma linha por dia ou por item vendido)', obrigatorio: false, apelidos: ['data', 'dia', 'data venda'] },
    { id: 'inicio', nome: 'Início do período', obrigatorio: false, apelidos: ['inicio', 'de', 'data inicial'] },
    { id: 'fim', nome: 'Fim do período', obrigatorio: false, apelidos: ['fim', 'ate', 'data final'] },
    { id: 'quantidade', nome: 'Quantidade', obrigatorio: true, apelidos: ['quantidade', 'qtd', 'qtde', 'unidades'] },
    { id: 'receita', nome: 'Receita depois dos descontos', obrigatorio: true, apelidos: ['receita', 'valor', 'total', 'faturamento', 'valor liquido'] },
    { id: 'desconto', nome: 'Desconto', obrigatorio: false, apelidos: ['desconto', 'descontos'] },
    { id: 'status', nome: 'Situação (cancelado, devolvido…)', obrigatorio: false, apelidos: ['status', 'situacao'] },
  ],
};

/** Liga cada campo à coluna de mesmo nome (ou apelido). O dono confere e muda na tela. */
export function mapearColunas(tipo: keyof typeof CAMPOS, cabecalho: string[]): Record<string, number | null> {
  const norm = cabecalho.map(semAcento);
  return Object.fromEntries(
    CAMPOS[tipo].map((c) => {
      const i = norm.findIndex((h) => c.apelidos.includes(h));
      return [c.id, i === -1 ? null : i];
    }),
  );
}

export const CANCELADO = /cancel|devolv|estorn|recusad/;
