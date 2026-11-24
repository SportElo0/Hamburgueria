import { describe, expect, it } from 'vitest';
import { zip } from '@/lib/zip';
import { lerCsv, lerXlsx } from '@/lib/xlsx-leitor';
import { LINHA_SAIR, acharColunas, celularBR, comLinhaSair, escolher, lerClientes, mensagemModelo, pontuar } from '@/lib/importados';

/** A tiny .xlsx like Anota Aí's export (shared strings for text, numbers for phones and counts). */
function planilha(rows: (string | number)[][]) {
  const strings: string[] = [];
  const idx = (s: string) => (strings.includes(s) ? strings.indexOf(s) : strings.push(s) - 1);
  const col = (i: number) => String.fromCharCode(65 + i);
  const sheet = `<?xml version="1.0"?><worksheet><sheetData>${rows
    .map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => (typeof v === 'number' ? `<c r="${col(ci)}${ri + 1}"><v>${v}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="s"><v>${idx(v)}</v></c>`)).join('')}</row>`)
    .join('')}</sheetData></worksheet>`;
  const shared = `<?xml version="1.0"?><sst>${strings.map((s) => `<si><t>${s.replace(/&/g, '&amp;')}</t></si>`).join('')}</sst>`;
  return new Uint8Array(zip([
    { name: 'xl/sharedStrings.xml', data: Buffer.from(shared) },
    { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(sheet) },
  ]));
}

const HEADER = ['Nome do Cliente', 'Número Telefone', 'Número Whatsapp', 'Quantidade de Pedidos', 'Dias de Inatividade'];

describe('lerXlsx', () => {
  it('lê textos e números (telefone sem notação científica)', async () => {
    const rows = await lerXlsx(planilha([HEADER, ['Ana & Cia', 11987654321, 5511987654321, 7, 45]]));
    expect(rows[0]).toEqual(HEADER);
    expect(rows[1]).toEqual(['Ana & Cia', '11987654321', '5511987654321', '7', '45']);
  });
  it('recusa arquivo que não é planilha', async () => {
    await expect(lerXlsx(new Uint8Array([1, 2, 3]))).rejects.toThrow(/planilha/);
  });
});

describe('lerCsv', () => {
  it('aceita ponto e vírgula e aspas', () => {
    expect(lerCsv('Nome;Telefone\n"Silva; Ana";11987654321\n')).toEqual([['Nome', 'Telefone'], ['Silva; Ana', '11987654321']]);
  });
});

describe('celularBR', () => {
  it('normaliza celular com e sem 55, e recusa fixo', () => {
    expect(celularBR('5511987654321')).toBe('11987654321');
    expect(celularBR('(11) 98765-4321')).toBe('11987654321');
    expect(celularBR('1187654321')).toBe('11987654321'); // celular antigo sem o 9
    expect(celularBR('1133334444')).toBe(''); // fixo
    expect(celularBR('789334748')).toBe('');
  });
});

describe('lerClientes', () => {
  it('prefere o WhatsApp, cai no telefone, ignora sem celular e junta repetidos', () => {
    const r = lerClientes([
      HEADER,
      ['Ana', '1133334444', '5511987654321', '3', '40'],
      ['Bia', '12988887777', '', '5', '90'],
      ['Sem', '1133334444', '', '9', '50'],
      ['Ana de novo', '11987654321', '', '8', '60'],
    ]);
    expect(r.semCelular).toBe(1);
    expect(r.clientes.map((c) => [c.phone, c.orders])).toEqual([
      ['11987654321', 8],
      ['12988887777', 5],
    ]);
  });
  it('explica quando as colunas não são as do Anota Aí', () => {
    expect(acharColunas(['a', 'b'])).toBeNull();
    expect(() => lerClientes([['a', 'b'], ['1', '2']])).toThrow(/colunas/);
  });
});

describe('escolher', () => {
  const base = { importadoEm: '2026-11-20T00:00:00Z', agora: new Date('2026-11-20T12:00:00Z') };
  it('põe na frente quem pediu muito e parou há 1 a 4 meses', () => {
    const lista = escolher(
      [
        { phone: '11911111111', name: 'Fiel sumido', orders: 12, inactiveDays: 60 },
        { phone: '11922222222', name: 'Antigo', orders: 12, inactiveDays: 500 },
        { phone: '11933333333', name: 'Uma vez', orders: 1, inactiveDays: 60 },
        { phone: '11944444444', name: 'Nunca pediu', orders: 0, inactiveDays: 60 },
      ],
      base,
    );
    expect(lista.map((c) => c.name)).toEqual(['Fiel sumido', 'Antigo', 'Uma vez']);
    expect(lista[0].motivo).toBe('12 pedidos, sem pedir há uns 2 meses');
  });
  it('tira quem pediu para sair e quem foi chamado há menos de 30 dias', () => {
    const c = [
      { phone: '11911111111', name: 'A', orders: 5, inactiveDays: 60 },
      { phone: '11922222222', name: 'B', orders: 5, inactiveDays: 60 },
      { phone: '11933333333', name: 'C', orders: 5, inactiveDays: 60 },
    ];
    const lista = escolher(c, { ...base, optOuts: ['11911111111'], enviados: { '11922222222': '2026-11-10T00:00:00Z', '11933333333': '2026-10-01T00:00:00Z' } });
    expect(lista.map((x) => x.name)).toEqual(['C']);
  });
  it('conta os dias desde a importação', () => {
    const [c] = escolher([{ phone: '11911111111', name: 'A', orders: 5, inactiveDays: 10 }], { importadoEm: '2026-10-01T00:00:00Z', agora: new Date('2026-11-20T00:00:00Z') });
    expect(c.diasParado).toBe(60);
  });
  it('limita a 50 por padrão', () => {
    const muitos = Array.from({ length: 80 }, (_, i) => ({ phone: `119${String(i).padStart(8, '0')}`, name: `C${i}`, orders: 3, inactiveDays: 60 }));
    expect(escolher(muitos, base)).toHaveLength(50);
  });
  it('pontua cliente em dia abaixo de quem sumiu', () => {
    expect(pontuar(10, 5)).toBeLessThan(pontuar(10, 60));
  });
});

describe('mensagem', () => {
  it('modelo e texto da IA sempre terminam com a linha do SAIR, uma vez só', () => {
    expect(mensagemModelo('Fish Burguer', 'smash em dobro na terça')).toMatch(new RegExp(`${LINHA_SAIR}$`));
    const t = comLinhaSair('Oi! Saudade de você.\n\nPara não receber mais promoções, responda SAIR.');
    expect(t.match(/SAIR/g)).toHaveLength(1);
  });
});
