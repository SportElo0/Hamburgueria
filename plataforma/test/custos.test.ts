import { describe, expect, it } from 'vitest';
import { cobrancaNoMes, custoFixoMensal, proximos, resumoDoMes, type Custo } from '@/lib/custos';
import type { ClienteCrm } from '@/lib/crm';

const custo = (o: Partial<Custo>): Custo => ({ id: Math.random().toString(), nome: 'x', categoria: 'assinatura', valor: 10000, frequencia: 'mensal', data: '2026-11-10', fim: null, nota: '', criadoEm: '', ...o });

describe('caixa da Growlift', () => {
  it('knows in which months each cost is charged', () => {
    const mensal = custo({ data: '2026-10-31' });
    expect(cobrancaNoMes(mensal, '2026-09')).toBeNull();
    expect(cobrancaNoMes(mensal, '2026-11')).toBe('2026-11-30');
    expect(cobrancaNoMes(mensal, '2027-02')).toBe('2027-02-28');
    const anual = custo({ frequencia: 'anual', data: '2026-03-05' });
    expect(cobrancaNoMes(anual, '2027-03')).toBe('2027-03-05');
    expect(cobrancaNoMes(anual, '2027-04')).toBeNull();
    const unica = custo({ frequencia: 'unica', data: '2026-11-18' });
    expect(cobrancaNoMes(unica, '2026-11')).toBe('2026-11-18');
    expect(cobrancaNoMes(unica, '2026-12')).toBeNull();
    const cancelado = custo({ data: '2026-09-20', fim: '2026-11-15' });
    expect(cobrancaNoMes(cancelado, '2026-11')).toBeNull();
    expect(cobrancaNoMes(cancelado, '2026-10')).toBe('2026-10-20');
  });

  it('adds up the month: in, to receive, out and what is left', () => {
    const clientes: ClienteCrm[] = [
      { id: 'a', negocio: 'A', contato: '', whatsapp: '', cidade: '', situacao: 'cliente', notas: [], criadoEm: '', atualizadoEm: '', vendas: [
        { id: '1', produto: 'plaquinha-nfc', descricao: '', valor: 8000, data: '2026-11-20', pago: true, mensal: false, vencimento: null },
        { id: '2', produto: 'google', descricao: '', valor: 12000, data: '2026-11-21', pago: false, mensal: false, vencimento: null },
        { id: '3', produto: 'app', descricao: '', valor: 14700, data: '2026-10-01', pago: true, mensal: true, vencimento: 1 },
      ] },
    ];
    const custos = [custo({ valor: 8600, data: '2026-11-20', nome: 'DAS' }), custo({ frequencia: 'unica', valor: 30000, data: '2026-11-15', nome: 'plaquinhas' })];
    const m = resumoDoMes(custos, clientes, '2026-11');
    expect(m).toMatchObject({ entrou: 8000, aReceber: 12000 + 14700, saiu: 38600 });
    expect(m.sobra).toBe(8000 + 26700 - 38600);
    expect(m.saidas.map((s) => s.custo.nome)).toEqual(['plaquinhas', 'DAS']);
  });

  it('shows the monthly fixed cost and the next charges', () => {
    const custos = [custo({ valor: 8600, data: '2026-11-20' }), custo({ frequencia: 'anual', valor: 120000, data: '2026-12-01' }), custo({ frequencia: 'unica', valor: 999, data: '2026-11-01' })];
    expect(custoFixoMensal(custos, '2026-11-22')).toBe(8600);
    const p = proximos(custos, '2026-11-22', 30);
    expect(p.map((x) => x.dia)).toEqual(['2026-12-01', '2026-12-20']);
  });
});
