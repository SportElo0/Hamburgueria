import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { obter } from '@/server/oportunidades';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { abrirPropostaPublica, cancelarProposta, criarProposta, enviarProposta, propostasDa, responderProposta } from '@/server/propostas';
import { contar, meta, novaEmpresa, pedido, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
const tokenDe = (link: string) => link.split('/p/')[1];
const itens = [{ descricao: 'Painel 550 W', quantidade: 8, valor_unit_centavos: 110000 }, { descricao: 'Instalação', quantidade: 1, valor_unit_centavos: 350000 }];

beforeAll(async () => {
  A = await novaEmpresa('Solar Propostas');
  B = await novaEmpresa('Solar Propostas B');
  await salvarConfig(A.admin, 'regras', { ...A.empresa.config.regras, retorno_auto_cliente: true });
  await salvarConfig(A.admin, 'site', { ...A.empresa.config.site, razao_social: 'Solar Propostas Ltda', cnpj: '00.000.000/0001-00', endereco: 'Rua Fictícia, 1, Campinas', email: 'contato@exemplo.com' });
  A.empresa = (await empresaPorId(A.empresa.id))!;
});
afterAll(fecharPool);

describe('proposta online', () => {
  it('monta, manda o link, o cliente abre e aceita; a venda não vira ganha sozinha', async () => {
    const p = (await receberPedido(A.empresa, pedido({ nome: 'Marina Duarte' }), meta())) as PedidoSalvo;
    await criarProposta(A.vendedor, { oportunidadeId: p.oportunidadeId, titulo: 'Sistema 4,4 kWp', itens, condicoes: 'Entrada de 30%.', validadeDias: 15 });
    const [pr] = await propostasDa(A.vendedor, p.oportunidadeId);
    expect(pr).toMatchObject({ numero: 1, estado: 'rascunho', total_centavos: 8 * 110000 + 350000, validade: '', validade_dias: 15, consumidor: true });

    const link = await enviarProposta(A.vendedor, pr.id);
    expect(link).toMatch(/\/p\/pr_/);
    const op = await obter(A.vendedor, p.oportunidadeId);
    expect(op.etapa).toBe('proposta');
    expect(Number(op.valor_proposta_centavos)).toBe(1230000);
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBeGreaterThan(0);

    // customer opens twice: one "opened" notice
    const pub = await abrirPropostaPublica(tokenDe(link), true);
    expect(pub).toMatchObject({ titulo: 'Sistema 4,4 kWp', cliente: 'Marina Duarte', total_centavos: 1230000 });
    await abrirPropostaPublica(tokenDe(link), true);
    expect(await contar(`notificacoes where empresa_id = $1 and titulo = 'O cliente abriu a proposta nº 1'`, [A.empresa.id])).toBe(1);
    expect((await propostasDa(A.vendedor, p.oportunidadeId))[0].visualizacoes).toBe(2);

    await expect(responderProposta(tokenDe(link), { aceitar: true, nome: 'M', ipHash: 'x' })).rejects.toThrow(/nome completo/);
    expect(await responderProposta(tokenDe(link), { aceitar: true, nome: 'Marina Duarte', ipHash: 'hash-ip' })).toBe('aceita');
    const depois = await obter(A.vendedor, p.oportunidadeId);
    expect(depois.etapa).toBe('negociacao');
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBe(0);
    expect(await contar(`tarefas where oportunidade_id = $1 and tipo = 'proposta_aceita'`, [p.oportunidadeId])).toBe(1);
    await expect(responderProposta(tokenDe(link), { aceitar: false, ipHash: 'x' })).rejects.toThrow(/já foi respondida/);
    const reg = await um<{ aceite_nome: string; aceite_ip_hash: string; conteudo_hash: string; texto_aceite: string }>('select aceite_nome, aceite_ip_hash, conteudo_hash, texto_aceite from propostas where id = $1', [pr.id]);
    expect(reg).toMatchObject({ aceite_nome: 'Marina Duarte', aceite_ip_hash: 'hash-ip', texto_aceite: 'Li a proposta e aceito os itens, o valor e as condições acima.' });
    expect(reg!.conteudo_hash).toMatch(/^[0-9a-f]{64}$/);
    // after sending, the content can no longer change, not even directly in the database
    await expect(q(`update propostas set total_centavos = 1 where id = $1`, [pr.id])).rejects.toThrow(/não pode ser alterada/);
  });

  it('recusa para o retorno automático; vencida não aceita; cancelada e link trocado param de funcionar', async () => {
    const p = (await receberPedido(A.empresa, pedido(), meta())) as PedidoSalvo;
    await criarProposta(A.admin, { oportunidadeId: p.oportunidadeId, titulo: 'Proposta A', itens, condicoes: 'Pagamento à vista.', validadeDias: 10 });
    const [pr] = await propostasDa(A.admin, p.oportunidadeId);
    const velho = await enviarProposta(A.admin, pr.id);
    const novo = await enviarProposta(A.admin, pr.id);
    expect(await abrirPropostaPublica(tokenDe(velho), false)).toBeNull();
    expect(await responderProposta(tokenDe(novo), { aceitar: false, motivo: 'Achei caro', ipHash: 'x' })).toBe('recusada');
    expect(await contar(`trabalhos where oportunidade_id = $1 and tipo = 'retorno_cliente' and estado = 'pendente'`, [p.oportunidadeId])).toBe(0);
    expect((await obter(A.admin, p.oportunidadeId)).etapa).toBe('proposta');

    await criarProposta(A.admin, { oportunidadeId: p.oportunidadeId, titulo: 'Proposta B', itens, condicoes: 'Pagamento à vista.', validadeDias: 5 });
    const b = (await propostasDa(A.admin, p.oportunidadeId)).find((x) => x.titulo === 'Proposta B')!;
    const lb = await enviarProposta(A.admin, b.id);
    // simulate the validity passing (the content lock is lifted only for this test update)
    await q('alter table propostas disable trigger propostas_conteudo_fixo');
    await q(`update propostas set validade = current_date - 1 where id = $1`, [b.id]);
    await q('alter table propostas enable trigger propostas_conteudo_fixo');
    await expect(responderProposta(tokenDe(lb), { aceitar: true, nome: 'Fulano de Tal', ipHash: 'x' })).rejects.toThrow(/validade/);

    await criarProposta(A.admin, { oportunidadeId: p.oportunidadeId, titulo: 'Proposta C', itens, condicoes: 'Pagamento à vista.', validadeDias: 5 });
    const c = (await propostasDa(A.admin, p.oportunidadeId)).find((x) => x.titulo === 'Proposta C')!;
    const lc = await enviarProposta(A.admin, c.id);
    await cancelarProposta(A.admin, c.id);
    expect((await abrirPropostaPublica(tokenDe(lc), false))?.estado).toBe('cancelada');
    await expect(responderProposta(tokenDe(lc), { aceitar: true, nome: 'Fulano de Tal', ipHash: 'x' })).rejects.toThrow(/cancelada pela empresa/);

    // a company without its details filled in cannot send proposals
    const pb = (await receberPedido(B.empresa, pedido(), meta())) as PedidoSalvo;
    await criarProposta(B.admin, { oportunidadeId: pb.oportunidadeId, titulo: 'Sem dados', itens, condicoes: 'Pagamento à vista.', validadeDias: 5 });
    const [semDados] = await propostasDa(B.admin, pb.oportunidadeId);
    await expect(enviarProposta(B.admin, semDados.id)).rejects.toThrow(/razão social, CNPJ, endereço/);
    await expect(criarProposta(B.admin, { oportunidadeId: pb.oportunidadeId, titulo: 'Sem condições', itens, condicoes: '', validadeDias: 5 })).rejects.toThrow(/condições/);

    // other company: cannot send or see
    await expect(enviarProposta(B.admin, c.id)).rejects.toThrow();
    expect(await propostasDa(B.admin, p.oportunidadeId)).toEqual([]);
    expect(await abrirPropostaPublica('pr_inventado-00000000000000000000', false)).toBeNull();
  });
});
