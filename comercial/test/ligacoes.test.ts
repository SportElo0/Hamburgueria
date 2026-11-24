import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fecharPool, q, um } from '@/server/db';
import { empresaPorId, salvarConfig } from '@/server/empresas';
import { salvarFluxo, MODELOS_DE_FLUXO } from '@/server/fluxos';
import { salvarWhatsApp } from '@/server/integracoes';
import { empresaDaChaveTelefonia, gerarChaveTelefonia, registrarLigacaoPerdida, simularLigacaoPerdida, textoRetornoLigacao } from '@/server/ligacoes';
import { receberPedido, type PedidoSalvo } from '@/server/pedidos';
import { processarFila } from '@/server/trabalhos';
import { contar, meta, novaEmpresa, pedido, telefone, unico, type Cenario } from './apoio';

vi.mock('next/server', () => ({ after: () => {} }));

let A: Cenario;
let B: Cenario;
const doSistema = (empresaId: string, tel: string) =>
  q<{ corpo: string; estado: string; modelo_mensagem: string }>(
    `select m.corpo, m.estado, m.modelo_mensagem from mensagens m join conversas v on v.id = m.conversa_id join contatos c on c.id = v.contato_id
     where m.empresa_id = $1 and c.telefone = $2 and m.autor = 'sistema' order by m.criado_em`,
    [empresaId, `55${tel}`],
  );
const tarefas = (empresaId: string, tel: string) =>
  q<{ titulo: string; detalhe: string }>(`select t.titulo, t.detalhe from tarefas t join oportunidades o on o.id = t.oportunidade_id join contatos c on c.id = o.contato_id where t.empresa_id = $1 and c.telefone = $2 and t.tipo = 'retornar_ligacao'`, [empresaId, `55${tel}`]);
const ligacao = (tel: string, extra: Partial<Parameters<typeof registrarLigacaoPerdida>[1]> = {}) => registrarLigacaoPerdida(A.empresa, { telefone: tel, idExterno: `call_${unico()}`, aceiteWhatsapp: true, ...extra });

beforeAll(async () => {
  A = await novaEmpresa('Solar Ligações');
  B = await novaEmpresa('Solar Ligações B');
  await salvarConfig(A.admin, 'regras', { ...A.empresa.config.regras, hora_inicio: 0, hora_fim: 24 });
  await salvarConfig(A.admin, 'ia', { ...A.empresa.config.ia, nome: 'Ana' });
  await salvarWhatsApp(A.admin, { modo: 'simulador', modelo_ligacao: 'teste_ligacao' });
  A.empresa = (await empresaPorId(A.empresa.id))!;
});
afterAll(fecharPool);

describe('ligação não atendida', () => {
  it('quem apertou 1 recebe o WhatsApp na hora; abre a oportunidade e a tarefa de retornar', async () => {
    const tel = telefone();
    const r = await ligacao(tel);
    expect(r.resultado).toBe('mensagem_agendada');
    await processarFila();
    const ms = await doSistema(A.empresa.id, tel);
    expect(ms).toHaveLength(1);
    expect(ms[0].corpo).toBe('Oi! Aqui é Ana, da Solar Ligações. Vi que você ligou e não conseguimos atender agora. Como posso te ajudar? Se preferir, a equipe retorna a ligação. Para não receber mensagens, responda SAIR.');
    expect(ms[0].corpo).not.toMatch(/automátic|robô/i);
    expect(ms[0]).toMatchObject({ estado: 'enviada', modelo_mensagem: 'teste_ligacao' });
    const op = await um<{ origem: string; etapa: string }>('select origem, etapa from oportunidades where id = $1', [r.oportunidadeId]);
    expect(op).toEqual({ origem: 'ligacao', etapa: 'novo' });
    expect((await tarefas(A.empresa.id, tel)).map((t) => t.titulo)).toEqual([`Retornar a ligação: (${tel.slice(0, 2)}) ${tel.slice(2, 7)}-${tel.slice(7)}`]);
    expect(await contar(`consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'ligacao'`, [`55${tel}`])).toBe(1);
  });

  it('sem autorização não manda WhatsApp: fica só a tarefa de retornar', async () => {
    const tel = telefone();
    expect((await ligacao(tel, { aceiteWhatsapp: false })).resultado).toBe('sem_autorizacao');
    await processarFila();
    expect(await doSistema(A.empresa.id, tel)).toHaveLength(0);
    expect((await tarefas(A.empresa.id, tel))[0].detalhe).toMatch(/Sem autorização para WhatsApp/);
  });

  it('quem já autorizou no formulário recebe, e a ligação entra na oportunidade aberta dele', async () => {
    const tel = telefone();
    const p = (await receberPedido(A.empresa, pedido({ telefone: tel }), meta())) as PedidoSalvo;
    const r = await ligacao(tel, { aceiteWhatsapp: false });
    expect(r).toEqual({ resultado: 'mensagem_agendada', oportunidadeId: p.oportunidadeId });
    expect(await contar('oportunidades where contato_id = $1', [p.contatoId])).toBe(1);
  });

  it('ligou três vezes seguidas: uma mensagem e uma tarefa só; o mesmo aviso repetido não faz nada', async () => {
    const tel = telefone();
    const id = `call_${unico()}`;
    await ligacao(tel, { idExterno: id });
    expect((await ligacao(tel, { idExterno: id })).resultado).toBe('ja_recebida');
    expect((await ligacao(tel)).resultado).toBe('repetida');
    expect((await ligacao(tel)).resultado).toBe('repetida');
    await processarFila();
    expect(await doSistema(A.empresa.id, tel)).toHaveLength(1);
    expect(await tarefas(A.empresa.id, tel)).toHaveLength(1);
    expect(await contar('ligacoes where empresa_id = $1 and telefone = $2', [A.empresa.id, `55${tel}`])).toBe(3);
  });

  it('telefone fixo e quem pediu SAIR não recebem mensagem', async () => {
    expect((await ligacao('1133334444')).resultado).toBe('telefone_fixo');
    const tel = telefone();
    await ligacao(tel);
    await processarFila();
    await q(`update contatos set nao_contatar_em = now() where empresa_id = $1 and telefone = $2`, [A.empresa.id, `55${tel}`]);
    await q(`update ligacoes set recebida_em = now() - interval '3 hours' where empresa_id = $1 and telefone = $2`, [A.empresa.id, `55${tel}`]);
    expect((await ligacao(tel)).resultado).toBe('pediu_sair');
    // pressing 1 after SAIR does not record a new authorization
    expect(await contar(`consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'ligacao'`, [`55${tel}`])).toBe(1);
  });

  it('apertar 1 vale só para aquela ligação: não autoriza a próxima nem outras mensagens', async () => {
    const tel = telefone();
    const r = await ligacao(tel);
    await processarFila();
    expect(await doSistema(A.empresa.id, tel)).toHaveLength(1);
    // the same day, pressing 1 again: at most one answer per 24 hours
    await q(`update ligacoes set recebida_em = now() - interval '3 hours' where empresa_id = $1 and telefone = $2`, [A.empresa.id, `55${tel}`]);
    expect((await ligacao(tel)).resultado).toBe('ja_respondida_hoje');
    // the next day, without pressing 1: no message
    await q(`update ligacoes set recebida_em = now() - interval '30 hours', resultado = 'mensagem_agendada' where empresa_id = $1 and telefone = $2`, [A.empresa.id, `55${tel}`]);
    await q(`update ligacoes set resultado = 'repetida' where empresa_id = $1 and telefone = $2 and resultado = 'mensagem_agendada' and recebida_em > now() - interval '24 hours'`, [A.empresa.id, `55${tel}`]);
    expect((await ligacao(tel, { aceiteWhatsapp: false })).resultado).toBe('sem_autorizacao');
    // a flow message or a request confirmation never uses the call's authorization
    const { enviarIniciada } = await import('@/server/trabalhos');
    const t = { id: unico(), empresa_id: A.empresa.id, tipo: 'teste', dados: {}, executar_em: new Date(), estado: 'executando', tentativas: 1, max_tentativas: 3, chave: null, conversa_id: null, oportunidade_id: r.oportunidadeId!, criado_em: new Date() } as const;
    expect(await enviarIniciada({ ...t }, { oportunidadeId: r.oportunidadeId!, corpo: 'Oferta qualquer. Para não receber mensagens, responda SAIR.', finalidade: 'fluxo', modelo: 'qualquer' })).toMatchObject({ tipo: 'cancelado', motivo: expect.stringMatching(/Sem autorização/) });
    const aceite = await um<{ texto: string }>(`select k.texto from consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'ligacao' order by k.criado_em limit 1`, [`55${tel}`]);
    expect(aceite!.texto).toMatch(/apertou 1: autorizou uma mensagem da Solar Ligações pelo WhatsApp sobre esta ligação/);
    expect(aceite!.texto).toMatch(/chamada call_/);
  });

  it('resposta que ficou parada mais de 2 horas na fila não sai (fica a tarefa)', async () => {
    const tel = telefone();
    await ligacao(tel);
    await q(`update ligacoes set recebida_em = now() - interval '3 hours' where empresa_id = $1 and telefone = $2`, [A.empresa.id, `55${tel}`]);
    await processarFila();
    expect(await doSistema(A.empresa.id, tel)).toHaveLength(0);
    expect(await contar(`ligacoes where empresa_id = $1 and telefone = $2 and resultado = 'nao_enviada'`, [A.empresa.id, `55${tel}`])).toBe(1);
  });

  it('fora do horário usa o outro texto, sem prometer hora; {{abertura}} continua disponível', () => {
    const t = textoRetornoLigacao(A.empresa, true);
    expect(t).toMatch(/^Oi! Aqui é Ana, da Solar Ligações\. Recebemos sua ligação fora do nosso horário de atendimento\. Assim que a equipe estiver disponível, ela te responde\./);
    const r = A.empresa.config.regras;
    expect(textoRetornoLigacao({ ...A.empresa, nome: 'Loja $& Cia', config: { ...A.empresa.config, regras: { ...r, hora_inicio: 9, ligacao_texto_fora: 'Abrimos às {{abertura}} na {{empresa}}.' } } }, true)).toBe('Abrimos às 9h na Loja $& Cia. Para não receber mensagens, responda SAIR.');
    expect(t).toMatch(/responda SAIR\.$/);
    // speaking as the company: no person's name
    const marca = { ...A.empresa, config: { ...A.empresa.config, ia: { ...A.empresa.config.ia, falar_como_marca: true } } };
    expect(textoRetornoLigacao(marca, false)).toMatch(/^Oi! Aqui é da Solar Ligações\. Vi que você ligou/);
    expect(textoRetornoLigacao(marca, false)).not.toContain('Ana');
  });

  it('dispara os fluxos de "ligação não atendida" da empresa', async () => {
    const modelo = MODELOS_DE_FLUXO.find((m) => m.id === 'ligacao-nao-atendida')!;
    await salvarFluxo(A.admin, null, { ...modelo.fluxo, ativo: true });
    const r = await ligacao(telefone());
    expect(await contar(`fluxo_execucoes where empresa_id = $1 and oportunidade_id = $2`, [A.empresa.id, r.oportunidadeId])).toBe(1);
  });

  it('chave do serviço: só a equipe Growlift cria; vale só para a própria empresa; a simulação não existe em produção', async () => {
    await expect(gerarChaveTelefonia(A.admin)).rejects.toThrow(/equipe Growlift/);
    const chave = await gerarChaveTelefonia({ ...A.admin, acessoAdmin: 'acesso-teste' });
    expect((await empresaDaChaveTelefonia(chave))?.id).toBe(A.empresa.id);
    expect(await empresaDaChaveTelefonia('tel_chave-inventada-0000000000000')).toBeNull();
    expect(await empresaDaChaveTelefonia('')).toBeNull();
    // a new key replaces the old one
    const nova = await gerarChaveTelefonia({ ...A.admin, acessoAdmin: 'acesso-teste' });
    expect(await empresaDaChaveTelefonia(chave)).toBeNull();
    expect((await empresaDaChaveTelefonia(nova))?.id).toBe(A.empresa.id);
    await expect(simularLigacaoPerdida(B.vendedor, telefone(), true)).rejects.toThrow();
    const antes = process.env.AMBIENTE;
    process.env.AMBIENTE = 'producao';
    try {
      await expect(simularLigacaoPerdida(B.admin, telefone(), true)).rejects.toThrow(/produção/);
    } finally {
      process.env.AMBIENTE = antes;
    }
  });

  it('entrada do serviço de telefonia: chave, formato JSON ou formulário, e só ligação não atendida conta', async () => {
    const { POST } = await import('@/app/api/webhooks/telefonia/route');
    const chave = await gerarChaveTelefonia({ ...A.admin, acessoAdmin: 'acesso-teste' });
    const chamar = (corpo: string, tipo = 'application/json', auth = `Bearer ${chave}`) => POST(new Request('http://x/api/webhooks/telefonia', { method: 'POST', headers: { authorization: auth, 'content-type': tipo }, body: corpo }));
    expect((await chamar('{}', 'application/json', 'Bearer tel_errada-000000000000000000000')).status).toBe(401);
    const atendida = await chamar(JSON.stringify({ de: telefone(), id: unico(), status: 'completed' }));
    expect(await atendida.json()).toMatchObject({ ok: true, ignorado: expect.any(String) });
    const tel = telefone();
    const r = await chamar(JSON.stringify({ de: tel, id: unico(), status: 'nao_atendida', aceite_whatsapp: true }));
    expect(await r.json()).toEqual({ ok: true, resultado: 'mensagem_agendada' });
    // form fields of common telephony services, key as the password of basic auth
    const tel2 = telefone();
    const basic = `Basic ${Buffer.from(`growlift:${chave}`).toString('base64')}`;
    const f = await chamar(new URLSearchParams({ From: `+55${tel2}`, CallSid: `CA${unico()}`, DialCallStatus: 'no-answer', aceite_whatsapp: 'true' }).toString(), 'application/x-www-form-urlencoded', basic);
    expect(await f.json()).toEqual({ ok: true, resultado: 'mensagem_agendada' });
    // a "1" pressed in some other menu is not consent
    const d = await chamar(new URLSearchParams({ From: `+55${telefone()}`, CallSid: `CA${unico()}`, DialCallStatus: 'no-answer', Digits: '1' }).toString(), 'application/x-www-form-urlencoded', basic);
    expect(await d.json()).toEqual({ ok: true, resultado: 'sem_autorizacao' });
    expect((await chamar(JSON.stringify({ de: 'abc', id: unico(), status: 'missed' }))).status).toBe(422);
    expect((await chamar('nao é json')).status).toBe(400);
    // nothing of company A shows up in company B
    expect(await contar('ligacoes where empresa_id = $1', [B.empresa.id])).toBe(0);
  });

  it('desvio da operadora: frase do "aperte 1", consentimento só com 1 depois dela, e quem desligou vira tarefa', async () => {
    const { POST } = await import('@/app/api/webhooks/telefonia/desvio/route');
    const chave = await gerarChaveTelefonia({ ...A.admin, acessoAdmin: 'acesso-teste' });
    const basic = `Basic ${Buffer.from(`growlift:${chave}`).toString('base64')}`;
    const form = (c: Record<string, string>) => new URLSearchParams(c).toString();
    const chamar = (url: string, campos: Record<string, string>, auth = basic) =>
      POST(new Request(url, { method: 'POST', headers: { authorization: auth, 'content-type': 'application/x-www-form-urlencoded' }, body: form(campos) }));
    const acaoDe = (x: string) => x.match(/action="([^"]+)"/)![1].replace(/&amp;/g, '&');
    const base = 'https://growlift.test/api/webhooks/telefonia/desvio';

    expect((await chamar(base, { From: `+55${telefone()}`, CallSid: `CA${unico()}` }, `Basic ${Buffer.from('growlift:tel_errada').toString('base64')}`)).status).toBe(401);

    // pressed 1: the WhatsApp goes out, and the consent records the forwarding sentence (version 2)
    const tel = telefone();
    const sid = `CA${unico()}`;
    const inicio = await chamar(base, { From: `+55${tel}`, CallSid: sid, CallStatus: 'ringing' });
    expect(inicio.headers.get('content-type')).toMatch(/text\/xml/);
    const x = await inicio.text();
    expect(x).toContain('<Gather input="dtmf" numDigits="1"');
    expect(x).toContain('language="pt-BR"');
    expect(x).toContain('Oi, aqui é da Solar Ligações. Não conseguimos atender agora. Quer receber uma mensagem nossa no WhatsApp, neste número, sobre a sua ligação? Aperte 1.');
    expect(x).not.toContain(chave);
    const acao = acaoDe(x);
    expect(acao).toMatch(/etapa=resposta/);
    const resp = await chamar(acao, { From: `+55${tel}`, CallSid: sid, Digits: '1' }, '');
    expect(await resp.text()).toContain('Combinado! Já te mandamos a mensagem no WhatsApp.');
    await processarFila();
    expect(await doSistema(A.empresa.id, tel)).toHaveLength(1);
    const k = await um<{ texto: string; versao: number }>(`select k.texto, k.versao from consentimentos k join contatos c on c.id = k.contato_id where c.telefone = $1 and k.origem = 'ligacao'`, [`55${tel}`]);
    expect(k).toMatchObject({ versao: 2, texto: expect.stringContaining('Não conseguimos atender agora') });
    // the end-of-call notice of the same call adds nothing
    await chamar(`${base}?etapa=fim`, { From: `+55${tel}`, CallSid: sid, CallStatus: 'completed' });
    expect(await contar('ligacoes where empresa_id = $1 and id_externo = $2', [A.empresa.id, sid])).toBe(1);

    // the signed answer step is tied to that call and that company
    const outra = `CA${unico()}`;
    expect((await chamar(acao.replace(sid, outra), { From: `+55${telefone()}`, CallSid: outra, Digits: '1' }, '')).status).toBe(401);
    expect((await chamar(acao.replace(/t=[^&]+/, 't=forjada'), { From: `+55${tel}`, CallSid: sid, Digits: '1' }, '')).status).toBe(401);
    // a leaked URL cannot record consent for another phone, nor be stretched in time
    expect((await chamar(acao, { From: `+55${telefone()}`, CallSid: sid, Digits: '1' }, '')).status).toBe(401);
    expect((await chamar(acao.replace(/x=\d+/, `x=${Date.now() + 99 * 60_000}`), { From: `+55${tel}`, CallSid: sid, Digits: '1' }, '')).status).toBe(401);

    // no key pressed (Redirect without Digits) or another key: task only, and the voice does not promise WhatsApp
    const tel2 = telefone();
    const sid2 = `CA${unico()}`;
    const acao2 = acaoDe(await (await chamar(base, { From: `+55${tel2}`, CallSid: sid2 })).text());
    expect(await (await chamar(acao2, { From: `+55${tel2}`, CallSid: sid2, Digits: '2' }, '')).text()).toContain('Avisamos a equipe da sua ligação');
    await processarFila();
    expect(await doSistema(A.empresa.id, tel2)).toHaveLength(0);
    expect((await tarefas(A.empresa.id, tel2))[0].detalhe).toMatch(/Sem autorização para WhatsApp/);

    // hung up during the sentence: the status notice still creates the call-back task
    const tel3 = telefone();
    const sid3 = `CA${unico()}`;
    await chamar(base, { From: `+55${tel3}`, CallSid: sid3 });
    await chamar(`${base}?etapa=fim`, { From: `+55${tel3}`, CallSid: sid3, CallStatus: 'completed' });
    expect(await tarefas(A.empresa.id, tel3)).toHaveLength(1);

    // landline: no sentence about WhatsApp, straight to the task; hidden number: just a polite goodbye
    const fixo = await (await chamar(base, { From: '+551133334444', CallSid: `CA${unico()}` })).text();
    expect(fixo).not.toContain('Gather');
    expect(fixo).toContain('Avisamos a equipe da sua ligação');
    expect(await (await chamar(base, { From: 'anonymous', CallSid: `CA${unico()}` })).text()).toContain('ligue de novo mais tarde');
    expect(await contar('ligacoes where empresa_id = $1', [B.empresa.id])).toBe(0);
  });
});
