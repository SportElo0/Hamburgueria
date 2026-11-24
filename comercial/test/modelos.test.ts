import { afterAll, describe, expect, it } from 'vitest';
import { q, um, fecharPool } from '@/server/db';
import { cadastrarEmpresa, empresaPorId } from '@/server/empresas';
import { conhecimentoAtual } from '@/server/conhecimento';
import { MODELOS, itensDeServico, montarPeloModelo, perguntasFrequentes, DadosCadastro } from '@/server/modelos';
import { receberPedido } from '@/server/pedidos';
import { adminPlataforma, meta, pedido, unico } from './apoio';

afterAll(async () => fecharPool());

describe('modelos por tipo de negócio', () => {
  it('lê serviços e perguntas sem inventar nada', () => {
    expect(itensDeServico('Suíte casal — vista para o jardim\nChalé família\n\n')).toEqual([
      { titulo: 'Suíte casal', texto: 'vista para o jardim' },
      { titulo: 'Chalé família', texto: '' },
    ]);
    expect(perguntasFrequentes('Que horas é o check-in? | A partir das 14h.\nAceita pet?\nTem estacionamento? |   ')).toEqual([{ pergunta: 'Que horas é o check-in?', resposta: 'A partir das 14h.' }]);
  });

  it('todo modelo monta config, conteúdo e automações válidos, mesmo sem dados', () => {
    for (const m of Object.values(MODELOS)) {
      const r = montarPeloModelo(m, 'Empresa', DadosCadastro.parse({}));
      expect(r.config.campos).toEqual(m.campos);
      expect(r.conhecimento.precos_autorizados).toBe('');
      expect(r.conhecimento.faq).toEqual([]);
      expect(r.conhecimento.regras_comerciais).toContain('preços autorizados');
      expect(r.fluxos.length).toBe(m.fluxosPadrao.length + m.fluxosProprios.length);
      expect(r.fluxos.every((f) => f.ativo)).toBe(true);
    }
  });

  it('nenhum modelo manda duas mensagens ao cliente no mesmo momento', () => {
    for (const m of Object.values(MODELOS)) {
      const r = montarPeloModelo(m, 'Empresa', DadosCadastro.parse({}));
      // The order confirmation is built in: the welcome flow does not send another message.
      const boasVindas = r.fluxos.find((f) => f.gatilho.tipo === 'pedido_recebido');
      expect(boasVindas?.passos.some((p) => p.tipo === 'enviar_whatsapp') ?? false).toBe(false);
      // A flow already follows up the proposal by WhatsApp: the built-in follow-up message stays off.
      const retomada = r.fluxos.some((f) => f.gatilho.tipo === 'etapa_alterada' && f.gatilho.etapa === 'proposta' && f.passos.some((p) => p.tipo === 'enviar_whatsapp'));
      expect(retomada).toBe(true);
      expect(r.config.regras.retorno_auto_cliente).toBe(false);
    }
  });

  it('cadastra uma pousada pelo modelo, com os dados do dono e o convite', async () => {
    const slug = `pousada-${unico()}`;
    const r = await cadastrarEmpresa(await adminPlataforma(), {
      nome: 'Pousada Teste Maré',
      slug,
      segmento: 'pousada',
      email_dono: `dono-${unico()}@teste.local`,
      dados: {
        whatsapp: '(12) 99123-4567',
        cidade: 'Juquehy, São Sebastião',
        descricao: 'A 100 m da praia, com café da manhã.',
        servicos: 'Suíte casal — vista para o jardim\nChalé família — até 4 pessoas',
        perguntas: 'Que horas é o check-in? | A partir das 14h.',
        horarios: 'Recepção das 8h às 22h.',
        hora_inicio: 8,
        hora_fim: 22,
        link_avaliacao: 'https://search.google.com/local/writereview?placeid=teste',
        assistente: 'Lia',
      },
    });
    expect(r.convite?.link).toMatch(/\/convite\//);
    expect(r.fluxos).toBe(3);
    const e = (await empresaPorId(r.empresa.id))!;
    expect(e.segmento).toBe('pousada');
    expect(e.config.campos.map((c) => c.id)).toEqual(['entrada', 'saida', 'pessoas']);
    expect(e.config.regras).toMatchObject({ retorno_auto_cliente: false, retorno_auto_horas: 24, retorno_auto_horas_2: 72, avaliacao_auto: true, hora_inicio: 8, hora_fim: 22 });
    expect(e.config.agenda.ativa).toBe(false);
    expect(e.config.ia.nome).toBe('Lia');
    expect(e.config.avaliacao.link).toContain('placeid=teste');
    expect(e.config.site).toMatchObject({ chamada: 'Reserve direto com a gente', botao: 'Pedir reserva', titulo_form: 'Peça sua reserva', whatsapp: '12991234567', areas: ['Juquehy, São Sebastião'] });
    expect(e.config.site.servicos).toHaveLength(2);
    const c = await conhecimentoAtual(e.id);
    expect(c.versao).toBe(1);
    expect(c.dados.faq).toEqual([{ pergunta: 'Que horas é o check-in?', resposta: 'A partir das 14h.' }]);
    expect(c.dados.precos_autorizados).toBe('');
    const fluxos = await q<{ nome: string; ativo: boolean }>('select nome, ativo from fluxos where empresa_id = $1 order by nome', [e.id]);
    expect(fluxos.map((f) => f.nome)).toEqual(['Boas-vindas ao pedido', 'Ligação não atendida', 'Valores enviados e sem resposta']);
    expect(fluxos.every((f) => f.ativo)).toBe(true);
    expect(await um(`select 1 from convites where empresa_id = $1 and papel = 'admin'`, [e.id])).toBeTruthy();
  });

  it('o formulário da pousada pede as datas e as automações rodam no pedido', async () => {
    const r = await cadastrarEmpresa(await adminPlataforma(), { nome: 'Pousada Fluxo', slug: `pf-${unico()}`, segmento: 'pousada' });
    await expect(receberPedido(r.empresa, pedido({ extras: {} }), meta())).rejects.toThrow();
    const ok = await receberPedido(r.empresa, pedido({ necessidade: 'Quero reservar para o feriado', extras: { entrada: '28/12', saida: '02/01', pessoas: '2 adultos' } }), meta());
    expect('oportunidadeId' in ok).toBe(true);
    const exec = await um<{ n: number }>('select count(*)::int as n from fluxo_execucoes where empresa_id = $1', [r.empresa.id]);
    expect(exec!.n).toBeGreaterThan(0);
  });

  it('recusa endereço repetido e modelo desconhecido', async () => {
    const admin = await adminPlataforma();
    const slug = `rep-${unico()}`;
    await cadastrarEmpresa(admin, { nome: 'Restaurante A', slug, segmento: 'restaurante' });
    await expect(cadastrarEmpresa(admin, { nome: 'Restaurante B', slug, segmento: 'restaurante' })).rejects.toThrow(/endereço/);
    await expect(cadastrarEmpresa(admin, { nome: 'X', slug: `x-${unico()}`, segmento: 'astronauta' })).rejects.toThrow();
  });
});
