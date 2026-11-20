import { describe, expect, it } from 'vitest';
import {
  CalculoError,
  avaliarResultado,
  contribuicaoUnitaria,
  custoPorPorcao,
  quociente,
  simularCombo,
  simularDesconto,
  simularPreco,
  SEM_TAXAS,
  type EntradaUnidade,
} from '@/lib/conselheiro/calculos';

const unidade = (preco: number, ingredientes: number | null, extra: Partial<EntradaUnidade> = {}): EntradaUnidade => ({
  preco,
  desconto: 0,
  custos: { ingredientes, embalagem: 0, outros: 0 },
  taxas: SEM_TAXAS,
  ...extra,
});

describe('contribuição por unidade', () => {
  it('desconta comissão, pagamento e tributo uma vez, sobre o preço depois do desconto', () => {
    const r = contribuicaoUnitaria({
      preco: 4000,
      desconto: 400,
      custos: { ingredientes: 1200, embalagem: 150, outros: 50 },
      taxas: { comissaoBps: 1200, comissaoBase: 'liquido', pagamentoBps: 320, tributosBps: 600 },
    });
    expect(r.receita).toBe(3600);
    expect(r.comissao).toBe(432);
    expect(r.pagamento).toBe(115); // 115,2 → 115
    expect(r.tributos).toBe(216);
    expect(r.contribuicao).toBe(3600 - 1200 - 150 - 50 - 432 - 115 - 216);
    expect(r.rotulo).toBe('contribuição');
    expect(r.naoConsiderados).toEqual([]);
  });

  it('comissão sobre o preço cheio quando o canal cobra assim', () => {
    const r = contribuicaoUnitaria({ preco: 4000, desconto: 400, custos: { ingredientes: 1000, embalagem: 0, outros: 0 }, taxas: { ...SEM_TAXAS, comissaoBps: 1000, comissaoBase: 'bruto' } });
    expect(r.comissao).toBe(400);
  });

  it('sem custo dos ingredientes não há contribuição; só com ingredientes o rótulo avisa', () => {
    expect(contribuicaoUnitaria(unidade(3000, null)).contribuicao).toBeNull();
    const so = contribuicaoUnitaria({ preco: 3000, desconto: 0, custos: { ingredientes: 1000, embalagem: null, outros: null }, taxas: { comissaoBps: null, comissaoBase: 'liquido', pagamentoBps: null, tributosBps: null } });
    expect(so.contribuicao).toBe(2000);
    expect(so.rotulo).toBe('contribuição após ingredientes');
    expect(so.naoConsiderados).toContain('taxa de pagamento');
    const parcial = contribuicaoUnitaria({ ...unidade(3000, 1000), taxas: { ...SEM_TAXAS, tributosBps: null } });
    expect(parcial.rotulo).toBe('contribuição parcial');
  });

  it('margem negativa aparece negativa, não zerada', () => {
    const r = contribuicaoUnitaria(unidade(1000, 1500));
    expect(r.contribuicao).toBe(-500);
    expect(r.margemBps).toBe(-5000);
  });

  it('recusa valores inválidos', () => {
    expect(() => contribuicaoUnitaria(unidade(1000, 10.5))).toThrow(CalculoError);
    expect(() => contribuicaoUnitaria(unidade(-1, 10))).toThrow(CalculoError);
    expect(() => contribuicaoUnitaria({ ...unidade(1000, 10), desconto: 2000 })).toThrow(CalculoError);
    expect(() => contribuicaoUnitaria({ ...unidade(1000, 10), taxas: { ...SEM_TAXAS, pagamentoBps: 20_000 } })).toThrow(CalculoError);
  });
});

describe('simulação de preço', () => {
  it('exemplo obrigatório: R$ 30 → R$ 35, custo R$ 15, 100 unidades', () => {
    const r = simularPreco({ atual: unidade(3000, 1500), proposto: unidade(3500, 1500), volumeAtual: 100, volumes: [90, 75, 100] });
    expect(r.status).toBe('ok');
    expect(r.atual.contribuicao).toBe(1500);
    expect(r.totalAtual).toBe(150_000);
    expect(r.proposto.contribuicao).toBe(2000);
    expect(r.equilibrio.volume).toEqual({ exato: '75,00', inteiro: 75 });
    expect(r.equilibrio.folgaUnidades).toBe(25);
    expect(r.equilibrio.folgaBps).toBe(2500);
    const noventa = r.cenarios.find((c) => c.volume === 90)!;
    expect(noventa.total).toBe(180_000);
    expect(noventa.diferenca).toBe(30_000);
    expect(r.cenarios.map((c) => c.volume)).toEqual([75, 90, 100]);
  });

  it('contribuição proposta zero ou negativa: sem equilíbrio positivo', () => {
    const r = simularPreco({ atual: unidade(3000, 1500), proposto: unidade(1500, 1500), volumeAtual: 100, volumes: [] });
    expect(r.equilibrio.volume).toBeNull();
    expect(r.equilibrio.observacao).toMatch(/não existe ponto de equilíbrio positivo/);
  });

  it('base sem vendas e contribuição de hoje não positiva', () => {
    expect(simularPreco({ atual: unidade(3000, 1500), proposto: unidade(3500, 1500), volumeAtual: 0, volumes: [] }).equilibrio.observacao).toMatch(/Sem vendas/);
    expect(simularPreco({ atual: unidade(1000, 1500), proposto: unidade(2000, 1500), volumeAtual: 50, volumes: [] }).equilibrio.observacao).toMatch(/já é zero ou negativa/);
    expect(simularPreco({ atual: unidade(3000, 1500), proposto: unidade(3500, 1500), volumeAtual: null, volumes: [10] }).status).toBe('sem-volume');
  });

  it('sem custo pede o custo em vez de inventar', () => {
    const r = simularPreco({ atual: unidade(3000, null), proposto: unidade(3500, null), volumeAtual: 100, volumes: [90] });
    expect(r.status).toBe('sem-custo');
    expect(r.cenarios).toEqual([]);
  });
});

describe('simulação de desconto', () => {
  it('exemplo obrigatório: 20% em R$ 30 com custo R$ 15 e 100 unidades', () => {
    const r = simularDesconto({ base: unidade(3000, 1500), descontoBps: 2000, volumeAtual: 100, volumes: [], capacidade: 150 });
    expect(r.descontoUnidade).toBe(600);
    expect(r.proposto.receita).toBe(2400);
    expect(r.proposto.contribuicao).toBe(900);
    expect(r.equilibrio.volume).toEqual({ exato: '166,67', inteiro: 167 });
    expect(r.volumeAdicional).toBe(67);
    expect(r.avisos.some((a) => a.includes('acima da capacidade'))).toBe(true);
  });
});

describe('simulação de combo', () => {
  const itens = [
    { id: 'burger', nome: 'Burger', quantidade: 1, precoAvulso: 3000, custoUnitario: 1200 },
    { id: 'batata', nome: 'Batata', quantidade: 1, precoAvulso: 1500, custoUnitario: 400 },
    { id: 'refri', nome: 'Refri', quantidade: 1, precoAvulso: 800, custoUnitario: 300 },
  ];

  it('não trata todo combo como venda nova', () => {
    const r = simularCombo({ itens, principalId: 'burger', precoCombo: 4500, taxas: SEM_TAXAS, embalagem: 0, vendasCombo: 100, mix: { jaCompravamBps: 5000, soPrincipalBps: 3000, novosBps: 2000 } });
    expect(r.precoSeparado).toBe(5300);
    expect(r.descontoCombo).toBe(800);
    expect(r.combo.contribuicao).toBe(4500 - 1900);
    expect(r.separado.contribuicao).toBe(5300 - 1900);
    expect(r.principal.contribuicao).toBe(1800);
    expect(r.incrementalPorTipo).toEqual({ jaCompravam: -800, soPrincipal: 800, novos: 2600 });
    // 100 × (50% × −800 + 30% × 800 + 20% × 2600) = 100 × 360
    expect(r.incrementalTotal).toBe(36_000);
    expect(r.seTudoFosseNovo).toBe(260_000);
  });

  it('mix que não soma 100% e item sem custo', () => {
    expect(() => simularCombo({ itens, principalId: 'burger', precoCombo: 4500, taxas: SEM_TAXAS, embalagem: 0, vendasCombo: 1, mix: { jaCompravamBps: 5000, soPrincipalBps: 3000, novosBps: 1000 } })).toThrow(/somar 100%/);
    const r = simularCombo({ itens: [itens[0], { ...itens[1], custoUnitario: null }], principalId: 'burger', precoCombo: 4000, taxas: SEM_TAXAS, embalagem: null, vendasCombo: 10, mix: { jaCompravamBps: 10_000, soPrincipalBps: 0, novosBps: 0 } });
    expect(r.status).toBe('sem-custo');
    expect(r.avisos[0]).toMatch(/Batata/);
  });
});

describe('avaliação de teste e outros', () => {
  it('normaliza por dia, avisa amostra pequena e nunca afirma causa', () => {
    const a = avaliarResultado({ desenho: 'antes-depois', base: { valor: 140_000, dias: 14, atendimentos: 20 }, teste: { valor: 105_000, dias: 7, atendimentos: 25 } });
    expect(a.porDiaBase).toBe(10_000);
    expect(a.porDiaTeste).toBe(15_000);
    expect(a.natureza).toBe('observado');
    expect(a.avisos.join(' ')).toMatch(/não prova/);
    expect(a.avisos.join(' ')).toMatch(/Pouca amostra/);
    expect(a.avisos.join(' ')).toMatch(/tamanhos diferentes/);
  });

  it('custo por porção pelo rendimento e quociente exato', () => {
    expect(custoPorPorcao(10_000, 8)).toBe(1250);
    expect(() => custoPorPorcao(10_000, 0)).toThrow(/Rendimento/);
    expect(quociente(1000, 3)).toEqual({ exato: '333,33', inteiro: 334 });
    expect(quociente(900, 3)).toEqual({ exato: '300,00', inteiro: 300 });
  });
});
