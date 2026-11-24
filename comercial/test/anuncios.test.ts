import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resultadosAnuncios, salvarInvestimento } from '@/server/anuncios';
import { fecharPool, q } from '@/server/db';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { meta, novaEmpresa, pedido, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
const MES = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);

beforeAll(async () => {
  A = await novaEmpresa('Solar Anúncios');
  B = await novaEmpresa('Solar Anúncios B');
});
afterAll(fecharPool);

describe('resultado dos anúncios', () => {
  it('separa pedidos e vendas por anúncio e calcula só com o gasto informado', async () => {
    const fb1 = (await receberPedido(A.empresa, pedido({ campanha: { utm_source: 'Facebook', utm_campaign: 'verao' } }), meta())) as PedidoSalvo;
    await receberPedido(A.empresa, pedido({ campanha: { utm_source: 'facebook', utm_campaign: 'verao' } }), meta());
    await receberPedido(A.empresa, pedido({ campanha: { gclid: 'abc123' } }), meta());
    await receberPedido(A.empresa, pedido(), meta());
    await receberPedido(B.empresa, pedido({ campanha: { utm_source: 'facebook', utm_campaign: 'verao' } }), meta());
    await q(`update oportunidades set etapa = 'ganho', fechada_em = now(), valor_proposta_centavos = 1800000 where id = $1`, [fb1.oportunidadeId]);
    // a request of the previous month does not count
    const velho = (await receberPedido(A.empresa, pedido({ campanha: { utm_source: 'facebook', utm_campaign: 'verao' } }), meta())) as PedidoSalvo;
    await q(`update oportunidades set entrada_em = date_trunc('month', now()) - interval '2 days' where id = $1`, [velho.oportunidadeId]);

    await salvarInvestimento(A.admin, { mes: MES, fonte: 'facebook', campanha: 'verao', valorCentavos: 30000 });
    await salvarInvestimento(A.admin, { mes: MES, fonte: 'Instagram', campanha: '', valorCentavos: 5000 });
    const ls = await resultadosAnuncios(A.admin, MES);
    const fb = ls.find((l) => l.fonte === 'facebook' && l.campanha === 'verao')!;
    expect(fb).toMatchObject({ pedidos: 2, ganhos: 1, valorGanhoCentavos: 1800000, investimentoCentavos: 30000 });
    expect(ls.find((l) => l.fonte === 'google')).toMatchObject({ pedidos: 1, investimentoCentavos: null });
    expect(ls.find((l) => l.fonte === '')).toMatchObject({ pedidos: 1 });
    expect(ls.find((l) => l.fonte === 'instagram')).toMatchObject({ pedidos: 0, investimentoCentavos: 5000 });

    // zero removes; sellers and other companies never see it
    await salvarInvestimento(A.admin, { mes: MES, fonte: 'instagram', campanha: '', valorCentavos: 0 });
    expect((await resultadosAnuncios(A.admin, MES)).find((l) => l.fonte === 'instagram')).toBeUndefined();
    await expect(resultadosAnuncios(A.vendedor, MES)).rejects.toThrow();
    await expect(salvarInvestimento(A.vendedor, { mes: MES, fonte: 'facebook', valorCentavos: 1 })).rejects.toThrow();
    expect((await resultadosAnuncios(B.admin, MES)).find((l) => l.fonte === 'facebook')).toMatchObject({ pedidos: 1, investimentoCentavos: null });
    await expect(resultadosAnuncios(A.admin, '2026-13')).rejects.toThrow(/Mês inválido/);
  });
});
