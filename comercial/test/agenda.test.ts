import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { calendarioDoLink, criarLinkAgenda, horariosLivres, instanteLocal, marcarVisitaManual, mudarVisita, paraCampoLocal, remarcarVisita, textoHorario, visitas } from '@/server/agenda';
import { mensagensDe, simularEntradaWhatsApp } from '@/server/conversas';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { salvarWhatsApp } from '@/server/integracoes';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { processarFila } from '@/server/trabalhos';
import { contar, meta, novaEmpresa, pedido, telefone, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
const FUSO = 'America/Sao_Paulo';
const vencer = (visita: string) => q(`update trabalhos set executar_em = now() - interval '1 second' where tipo = 'lembrete_visita' and estado = 'pendente' and dados ->> 'visita' = $1`, [visita]);
const doSistema = (oportunidadeId: string) =>
  q<{ corpo: string; modelo_mensagem: string }>(`select m.corpo, m.modelo_mensagem from mensagens m join conversas v on v.id = m.conversa_id join oportunidades o on o.contato_id = v.contato_id where o.id = $1 and m.autor = 'sistema' order by m.criado_em`, [oportunidadeId]);

beforeAll(async () => {
  A = await novaEmpresa('Solar Agenda');
  B = await novaEmpresa('Solar Agenda B');
  // Every day, all day, 1-hour visits, one at a time, at least 30 h ahead (so the reminder one day before always exists).
  await salvarConfig(A.admin, 'agenda', { ativa: true, dias: [0, 1, 2, 3, 4, 5, 6], hora_inicio: 0, hora_fim: 24, duracao_min: 60, capacidade: 1, antecedencia_horas: 30, janela_dias: 10 });
  await salvarConfig(A.admin, 'regras', { ...A.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
  await salvarConfig(A.admin, 'ia', { ...A.empresa.config.ia, nome: 'Ana' });
  await salvarWhatsApp(A.admin, { modo: 'simulador', modelo_lembrete_visita: 'teste_lembrete' });
  A.empresa = (await empresaPorId(A.empresa.id))!;
});
afterAll(fecharPool);

describe('horários livres', () => {
  it('hora local da empresa: 9h em São Paulo é 12h UTC', () => {
    expect(instanteLocal(2026, 11, 16, 9, 0, FUSO).toISOString()).toBe('2026-11-16T12:00:00.000Z');
    expect(paraCampoLocal(new Date('2026-11-16T12:30:00Z'), FUSO)).toBe('2026-11-16T09:30');
    expect(textoHorario(new Date('2026-11-16T12:00:00Z'), FUSO)).toBe('segunda, 16/11 às 9h');
  });

  it('respeita dias, horário, duração, antecedência e quantas visitas ao mesmo tempo', async () => {
    const e = { ...A.empresa, config: { ...A.empresa.config, agenda: { ...A.empresa.config.agenda, dias: [1, 3], hora_inicio: 8, hora_fim: 12, duracao_min: 90, antecedencia_horas: 0, janela_dias: 14 } } };
    const agora = new Date('2026-11-16T03:00:00Z'); // Monday 0h local
    const hs = await horariosLivres(e, 100, agora);
    expect(hs.length).toBeGreaterThan(0);
    for (const h of hs) {
      const local = paraCampoLocal(h.inicio, FUSO);
      expect(['08:00', '09:30']).toContain(local.slice(11));
      expect([1, 3]).toContain(new Date(`${local.slice(0, 10)}T12:00:00Z`).getUTCDay());
    }
    expect(await horariosLivres({ ...e, config: { ...e.config, agenda: { ...e.config.agenda, ativa: false } } }, 100, agora)).toEqual([]);
  });
});

describe('a assistente marca a visita pelo WhatsApp', () => {
  it('oferece 3 horários, marca o escolhido, cria a tarefa de confirmar e agenda o lembrete', async () => {
    const tel = telefone();
    let r = await simularEntradaWhatsApp(A.admin, tel, 'Marina Teste', 'Oi, quero agendar uma visita técnica');
    const conversa = r.conversaId!;
    const oferta = (await mensagensDe(A.empresa.id, conversa)).at(-1)!.corpo;
    expect(oferta).toMatch(/^Oi! Aqui é Ana, da Solar Agenda\. Tenho estes horários para a visita:\n1\) /);
    const primeiro = oferta.match(/^1\) (.+)$/m)![1];
    r = await simularEntradaWhatsApp(A.admin, tel, 'Marina Teste', '1');
    const resposta = (await mensagensDe(A.empresa.id, conversa)).at(-1)!.corpo;
    expect(resposta).toBe(`Oi! Aqui é Ana, da Solar Agenda. Reservei o horário de ${primeiro}. A equipe confirma o endereço com você e, se algo não encaixar, combinamos outro horário.\n\nQuer que eu te mande um lembrete por aqui um dia antes da visita? Responda SIM. Para não receber mensagens, responda SAIR.`.replace('Oi! Aqui é Ana, da Solar Agenda. ', ''));
    const v = await um<{ id: string; oportunidade_id: string; origem: string; estado: string; inicio: Date }>(`select v.id, v.oportunidade_id, v.origem, v.estado, v.inicio from visitas v join contatos c on c.id = v.contato_id where c.telefone = $1`, [`55${tel}`]);
    expect(v).toMatchObject({ origem: 'ia', estado: 'marcada' });
    expect(textoHorario(v!.inicio, FUSO)).toBe(primeiro);
    expect(await contar(`tarefas where oportunidade_id = $1 and tipo = 'confirmar_visita'`, [v!.oportunidade_id])).toBe(1);
    // no consent until the customer says yes
    expect(await contar(`consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'agenda'`, [`55${tel}`])).toBe(0);
    await simularEntradaWhatsApp(A.admin, tel, 'Marina Teste', 'Sim');
    expect((await mensagensDe(A.empresa.id, conversa)).at(-1)!.corpo).toBe('Combinado! Te mando o lembrete da visita por aqui um dia antes.');
    const aceite = await um<{ texto: string; versao: number }>(`select k.texto, k.versao from consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'agenda'`, [`55${tel}`]);
    expect(aceite).toMatchObject({ versao: 1, texto: expect.stringMatching(/respondeu "Sim": aceitou receber o lembrete da visita de/) });
    const lembrete = await um<{ executar_em: Date }>(`select executar_em from trabalhos where tipo = 'lembrete_visita' and dados ->> 'visita' = $1`, [v!.id]);
    expect(lembrete!.executar_em.getTime()).toBe(v!.inicio.getTime() - 24 * 3_600_000);

    // the reminder goes out with the approved template and the right day
    await vencer(v!.id);
    await processarFila();
    const ms = await doSistema(v!.oportunidade_id);
    expect(ms.at(-1)).toMatchObject({ modelo_mensagem: 'teste_lembrete' });
    expect(ms.at(-1)!.corpo).toBe(`Oi, Marina! Lembrete da Solar Agenda: sua visita está marcada para ${primeiro}. Se precisar remarcar, é só responder aqui. Para não receber mensagens, responda SAIR.`);

    // the slot is no longer offered (one visit at a time)
    expect((await horariosLivres((await empresaPorId(A.empresa.id))!, 1000)).some((h) => h.inicio.getTime() === v!.inicio.getTime())).toBe(false);
  });

  it('quem não responde SIM não recebe lembrete; e a autorização do lembrete não vale para outras mensagens', async () => {
    const semSim = telefone();
    await simularEntradaWhatsApp(A.admin, semSim, 'Rui Teste', 'Quero uma visita');
    await simularEntradaWhatsApp(A.admin, semSim, 'Rui Teste', '1');
    await simularEntradaWhatsApp(A.admin, semSim, 'Rui Teste', 'Qual o horário de vocês?');
    const vRui = await um<{ id: string; oportunidade_id: string }>(`select v.id, v.oportunidade_id from visitas v join contatos c on c.id = v.contato_id where c.telefone = $1`, [`55${semSim}`]);
    await vencer(vRui!.id);
    await processarFila();
    expect((await doSistema(vRui!.oportunidade_id)).filter((m) => /Lembrete/.test(m.corpo))).toHaveLength(0);

    const tel = telefone();
    await simularEntradaWhatsApp(A.admin, tel, 'Paulo Teste', 'Quero uma visita');
    await simularEntradaWhatsApp(A.admin, tel, 'Paulo Teste', '1');
    await simularEntradaWhatsApp(A.admin, tel, 'Paulo Teste', 'sim');
    const op = await um<{ id: string }>(`select o.id from oportunidades o join contatos c on c.id = o.contato_id where c.telefone = $1`, [`55${tel}`]);
    const { enviarIniciada } = await import('@/server/trabalhos');
    const t = { id: crypto.randomUUID(), empresa_id: A.empresa.id, tipo: 'teste', dados: {}, executar_em: new Date(), estado: 'executando', tentativas: 1, max_tentativas: 3, chave: null, conversa_id: null, oportunidade_id: op!.id, criado_em: new Date() } as const;
    expect(await enviarIniciada({ ...t }, { oportunidadeId: op!.id, corpo: 'Promoção. Para não receber mensagens, responda SAIR.', finalidade: 'fluxo', modelo: 'x' })).toMatchObject({ tipo: 'cancelado', motivo: expect.stringMatching(/Sem autorização/) });
  });
});

describe('a equipe marca, confirma, remarca e cancela', () => {
  it('remarcar troca o lembrete; cancelar apaga o lembrete; sem autorização o lembrete não sai', async () => {
    const p = (await receberPedido(A.empresa, pedido({ telefone: telefone(), aceite_whatsapp: false }), meta())) as PedidoSalvo;
    const em = (h: number) => paraCampoLocal(new Date(Date.now() + h * 3_600_000), FUSO);
    await marcarVisitaManual(A.vendedor, { oportunidadeId: p.oportunidadeId, inicio: em(72), endereco: 'Rua Fictícia, 10', aceiteLembrete: false });
    await expect(marcarVisitaManual(A.vendedor, { oportunidadeId: p.oportunidadeId, inicio: em(96), aceiteLembrete: false })).rejects.toThrow(/já tem uma visita marcada/);
    const [v] = await visitas(A.admin, new Date(), new Date(Date.now() + 30 * 86_400_000), p.oportunidadeId);
    expect(v).toMatchObject({ endereco: 'Rua Fictícia, 10', estado: 'marcada', origem: 'usuario' });

    await remarcarVisita(A.vendedor, v.id, em(100));
    const pend = await q<{ dados: { inicio: string } }>(`select dados from trabalhos where tipo = 'lembrete_visita' and estado = 'pendente' and dados ->> 'visita' = $1`, [v.id]);
    expect(pend).toHaveLength(1);
    expect(await contar(`trabalhos where tipo = 'lembrete_visita' and estado = 'cancelado' and dados ->> 'visita' = $1`, [v.id])).toBe(1);

    // without any authorization, the reminder does not go out
    await vencer(v.id);
    await processarFila();
    expect(await doSistema(p.oportunidadeId)).toHaveLength(0);

    await mudarVisita(A.vendedor, v.id, 'confirmada');
    await mudarVisita(A.vendedor, v.id, 'cancelada');
    await expect(mudarVisita(A.vendedor, v.id, 'confirmada')).rejects.toThrow(/cancelada/);
    // other company never sees or changes it
    await expect(mudarVisita(B.admin, v.id, 'cancelada')).rejects.toThrow(/não encontrada/);
    expect(await visitas(B.admin, new Date(0), new Date('2100-01-01'), p.oportunidadeId)).toEqual([]);
  });
});

describe('Google Agenda', () => {
  it('link secreto: administrador vê as da empresa, vendedor só as dele, só o primeiro nome', async () => {
    const p = (await receberPedido(A.empresa, pedido({ telefone: telefone(), nome: 'Joana Secreta Sobrenome' }), meta())) as PedidoSalvo;
    await marcarVisitaManual(A.admin, { oportunidadeId: p.oportunidadeId, inicio: paraCampoLocal(new Date(Date.now() + 200 * 3_600_000), FUSO), responsavelId: A.admin.userId, endereco: 'Av. Exemplo, 1', aceiteLembrete: false });
    const adm = await calendarioDoLink(await criarLinkAgenda(A.admin), 'https://x');
    expect(adm).toMatch(/BEGIN:VCALENDAR/);
    expect(adm).toMatch(/SUMMARY:Visita · Joana/);
    expect(adm).not.toMatch(/Sobrenome/);
    expect(adm).toMatch(/LOCATION:Av. Exemplo\\, 1/);
    const vend = await calendarioDoLink(await criarLinkAgenda(A.vendedor), 'https://x');
    expect(vend).not.toMatch(/Joana/);
    expect(await calendarioDoLink('ag_inventado-000000000000000000000', 'https://x')).toBeNull();
    // a new link replaces the old; a deactivated member's link stops working
    const velho = await criarLinkAgenda(A.admin);
    await criarLinkAgenda(A.admin);
    expect(await calendarioDoLink(velho, 'https://x')).toBeNull();
    const atual = await criarLinkAgenda(A.vendedor);
    await q('update membros set ativo = false where user_id = $1', [A.vendedor.userId]);
    expect(await calendarioDoLink(atual, 'https://x')).toBeNull();
    await q('update membros set ativo = true where user_id = $1', [A.vendedor.userId]);
  });
});

describe('lembrete prometido só quando existe', () => {
  it('visita para menos de um dia: a assistente não promete lembrete e não grava aceite', async () => {
    const C = await novaEmpresa('Solar Agenda C');
    await salvarConfig(C.admin, 'agenda', { ativa: true, dias: [0, 1, 2, 3, 4, 5, 6], hora_inicio: 0, hora_fim: 24, duracao_min: 60, capacidade: 1, antecedencia_horas: 1, janela_dias: 1 });
    await salvarConfig(C.admin, 'regras', { ...C.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
    await salvarWhatsApp(C.admin, { modo: 'simulador' });
    const tel = telefone();
    const r = await simularEntradaWhatsApp(C.admin, tel, 'Rita Teste', 'Quero uma visita');
    await simularEntradaWhatsApp(C.admin, tel, 'Rita Teste', '1');
    const ultima = (await mensagensDe(C.empresa.id, r.conversaId!)).at(-1)!.corpo;
    expect(ultima).toMatch(/^Reservei o horário de .+\. A equipe confirma o endereço com você e, se algo não encaixar, combinamos outro horário\.$/);
    expect(await contar(`consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'agenda'`, [`55${tel}`])).toBe(0);
  });
});

describe('dias bloqueados, horário por dia e o cliente mudando a visita', () => {
  it('não oferece dia bloqueado e respeita o horário de cada dia', async () => {
    const agora = new Date('2026-11-16T03:00:00Z'); // Monday 0h local
    const base = A.empresa.config.agenda;
    const e = { ...A.empresa, config: { ...A.empresa.config, agenda: { ...base, dias: [1, 2, 6], hora_inicio: 8, hora_fim: 18, duracao_min: 60, antecedencia_horas: 0, janela_dias: 7, por_dia: { '6': { inicio: 8, fim: 12 } }, bloqueios: [{ de: '2026-11-17', ate: '2026-11-17', motivo: 'Feriado' }] } } };
    const hs = await horariosLivres(e, 1000, agora);
    const dias = new Set(hs.map((h) => paraCampoLocal(h.inicio, FUSO).slice(0, 10)));
    expect(dias.has('2026-11-17')).toBe(false); // blocked Tuesday
    const sabado = hs.filter((h) => paraCampoLocal(h.inicio, FUSO).startsWith('2026-11-21')).map((h) => paraCampoLocal(h.inicio, FUSO).slice(11));
    expect(sabado).toEqual(['08:00', '09:00', '10:00', '11:00']);
    expect(hs.filter((h) => paraCampoLocal(h.inicio, FUSO).startsWith('2026-11-16')).length).toBe(10);
  });

  it('o cliente remarca e cancela pelo WhatsApp; a equipe fica sabendo e o lembrete acompanha', async () => {
    const tel = telefone();
    const r = await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', 'Quero agendar uma visita');
    await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', '1');
    await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', 'sim');
    const antes = await um<{ id: string; inicio: Date; oportunidade_id: string }>(`select v.id, v.inicio, v.oportunidade_id from visitas v join contatos c on c.id = v.contato_id where c.telefone = $1`, [`55${tel}`]);

    await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', 'Preciso remarcar');
    const oferta = (await mensagensDe(A.empresa.id, r.conversaId!)).at(-1)!.corpo;
    expect(oferta).toMatch(/^Sua visita está marcada para .+\. Para remarcar, tenho estes horários:\n1\) /);
    const novo = oferta.match(/^2\) (.+)$/m)![1];
    await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', '2');
    expect((await mensagensDe(A.empresa.id, r.conversaId!)).at(-1)!.corpo).toBe(`Pronto, mudei sua visita para ${novo}. A equipe já ficou sabendo.`);
    const depois = await um<{ inicio: Date; estado: string }>('select inicio, estado from visitas where id = $1', [antes!.id]);
    expect(textoHorario(depois!.inicio, FUSO)).toBe(novo);
    expect(await contar(`trabalhos where tipo = 'lembrete_visita' and estado = 'pendente' and dados ->> 'visita' = $1 and dados ->> 'inicio' = $2`, [antes!.id, depois!.inicio.toISOString()])).toBe(1);
    expect(await contar(`notificacoes where empresa_id = $1 and titulo = $2`, [A.empresa.id, `Cliente remarcou a visita: ${novo}`])).toBe(1);

    await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', 'Quero cancelar a visita');
    expect((await mensagensDe(A.empresa.id, r.conversaId!)).at(-1)!.corpo).toBe(`Quer mesmo cancelar a visita de ${novo}? Responda SIM para cancelar.`);
    await simularEntradaWhatsApp(A.admin, tel, 'Lia Teste', 'Sim');
    expect((await mensagensDe(A.empresa.id, r.conversaId!)).at(-1)!.corpo).toBe(`Pronto, cancelei a visita de ${novo}. A equipe já sabe. Se quiser marcar outro dia, é só falar.`);
    expect((await um<{ estado: string }>('select estado from visitas where id = $1', [antes!.id]))!.estado).toBe('cancelada');
    expect(await contar(`trabalhos where tipo = 'lembrete_visita' and estado = 'pendente' and dados ->> 'visita' = $1`, [antes!.id])).toBe(0);
    expect(await contar(`notificacoes where empresa_id = $1 and titulo = $2`, [A.empresa.id, `Cliente cancelou a visita de ${novo}`])).toBe(1);
  });
});
