import { createECDH } from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { criarTarefa } from '@/server/contexto';
import { fecharPool, pool, q } from '@/server/db';
import { assuntoSeguro, avisoDeTeste, chavesVapid, endpointValido, enviarAvisosCelular, salvarInscricao, usarRemetenteDeTeste, type Aviso } from '@/server/push';
import { grupoDoTipo, horaLocal, listarAvisos, marcarAvisosLidos, minhasPreferencias, recebeAgora, salvarPreferencias } from '@/server/avisos';
import { contar, novaEmpresa, unico, type Cenario } from './apoio';

let A: Cenario;
let B: Cenario;
let enviados: { endpoint: string; aviso: Aviso }[] = [];
let falhar: Record<string, number> = {};

const p256dh = () => Buffer.from(createECDH('prime256v1').generateKeys()).toString('base64url');
const sub = (endpoint = `https://fcm.googleapis.com/fcm/send/${unico()}`) => ({ endpoint, keys: { p256dh: p256dh(), auth: 'YXV0aC1zZWNyZXQtMTIzNA' } });
const para = (endpoint: string) => enviados.filter((e) => e.endpoint === endpoint).map((e) => e.aviso);

beforeAll(async () => {
  A = await novaEmpresa('Solar Avisos');
  B = await novaEmpresa('Solar Avisos B');
});
beforeEach(async () => {
  // Notifications left by other test files are not this file's business.
  await q('update notificacoes set push_em = now() where push_em is null');
  enviados = [];
  falhar = {};
  usarRemetenteDeTeste(async (s, aviso) => {
    if (falhar[s.endpoint]) throw Object.assign(new Error('push service'), { statusCode: falhar[s.endpoint] });
    enviados.push({ endpoint: s.endpoint, aviso });
  });
});
afterEach(() => usarRemetenteDeTeste(null));
afterAll(fecharPool);

describe('avisos no celular', () => {
  it('só aceita endereços dos serviços de aviso dos navegadores (o servidor faz a chamada)', async () => {
    expect(endpointValido('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(endpointValido('https://web.push.apple.com/QGx')).toBe(true);
    expect(endpointValido('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
    for (const ruim of ['http://fcm.googleapis.com/x', 'https://169.254.169.254/latest', 'https://localhost/x', 'https://fcm.googleapis.com:8443/x', 'https://evil.com/fcm.googleapis.com', 'https://push.apple.com.evil.com/x']) {
      expect(endpointValido(ruim)).toBe(false);
    }
    await expect(salvarInscricao(A.admin, { endpoint: 'https://169.254.169.254/x', keys: sub().keys }, 'x')).rejects.toThrow(/inscrição de aviso válida/);
    await expect(salvarInscricao(A.admin, { endpoint: sub().endpoint, keys: { p256dh: 'curta', auth: 'x' } }, 'x')).rejects.toThrow(/inscrição de aviso válida/);
    await expect(salvarInscricao({ ...A.admin, acessoAdmin: 'acesso' }, sub(), 'x')).rejects.toThrow(/equipe Growlift/);
  });

  it('a tarefa de alguém avisa só o celular dessa pessoa, uma vez, sem o texto do cliente', async () => {
    const vend = sub();
    const adm = sub();
    await salvarInscricao(A.vendedor, vend, 'Android');
    await salvarInscricao(A.admin, adm, 'iPhone');
    await criarTarefa(pool(), A.empresa.id, { tipo: 'manual', titulo: 'Ligar para a Marina', detalhe: 'Cliente disse: meu CEP é 13000-000', responsavelId: A.vendedor.userId, link: '/painel/tarefas' });
    expect(await enviarAvisosCelular()).toBe(1);
    expect(para(vend.endpoint)).toEqual([{ titulo: 'Ligar para a Marina', corpo: 'Solar Avisos · toque para abrir', link: '/painel/tarefas' }]);
    expect(para(adm.endpoint)).toHaveLength(0);
    expect(JSON.stringify(enviados)).not.toContain('CEP');
    expect(await enviarAvisosCelular()).toBe(0);
  });

  it('sem responsável avisa os administradores ativos da empresa, e nunca outra empresa', async () => {
    const adm = sub();
    const vend = sub();
    const outra = sub();
    await salvarInscricao(A.admin, adm, 'iPhone');
    await salvarInscricao(A.vendedor, vend, 'Android');
    await salvarInscricao(B.admin, outra, 'Android');
    await criarTarefa(pool(), A.empresa.id, { tipo: 'manual', titulo: 'Novo pedido sem responsável' });
    await enviarAvisosCelular();
    expect(para(adm.endpoint).map((a) => a.titulo)).toEqual(['Novo pedido sem responsável']);
    expect(para(vend.endpoint)).toHaveLength(0);
    expect(para(outra.endpoint)).toHaveLength(0);
    // a member who was deactivated stops receiving
    await q('update membros set ativo = false where user_id = $1', [A.admin.userId]);
    await criarTarefa(pool(), A.empresa.id, { tipo: 'manual', titulo: 'Outro pedido' });
    enviados = [];
    await enviarAvisosCelular();
    expect(para(adm.endpoint)).toHaveLength(0);
    await q('update membros set ativo = true where user_id = $1', [A.admin.userId]);
  });

  it('celular que desligou os avisos (410) sai da lista; aviso velho não é mandado', async () => {
    const s = sub();
    await salvarInscricao(A.vendedor, s, 'Android');
    falhar[s.endpoint] = 410;
    await criarTarefa(pool(), A.empresa.id, { tipo: 'manual', titulo: 'Aviso para celular desligado', responsavelId: A.vendedor.userId });
    await enviarAvisosCelular();
    expect(para(s.endpoint)).toHaveLength(0);
    expect(await contar('inscricoes_push where endpoint = $1', [s.endpoint])).toBe(0);

    const s2 = sub();
    await salvarInscricao(A.vendedor, s2, 'Android');
    await q(`insert into notificacoes (empresa_id, user_id, titulo, criado_em) values ($1, $2, 'Antigo', now() - interval '3 hours')`, [A.empresa.id, A.vendedor.userId]);
    await enviarAvisosCelular();
    expect(para(s2.endpoint)).toHaveLength(0);
  });

  it('o mesmo celular entrando com outra pessoa passa a avisar só a pessoa nova', async () => {
    const s = sub();
    await salvarInscricao(A.admin, s, 'Android');
    await salvarInscricao(A.vendedor, s, 'Android');
    expect(await contar('inscricoes_push where endpoint = $1 and user_id = $2', [s.endpoint, A.vendedor.userId])).toBe(1);
    expect(await contar('inscricoes_push where endpoint = $1', [s.endpoint])).toBe(1);
  });

  it('a tela bloqueada mostra só o assunto, sem o nome que veio do formulário', async () => {
    expect(assuntoSeguro('Novo pedido: Marina Duarte')).toBe('Novo pedido');
    expect(assuntoSeguro('Pedido sem atendimento: Marina')).toBe('Pedido sem atendimento');
    expect(assuntoSeguro('Tarefa vencida há mais de 4 h: Ligar para Marina')).toBe('Tarefa vencida há mais de 4 h');
    expect(assuntoSeguro('Nova mensagem do cliente')).toBe('Nova mensagem do cliente');
    expect(assuntoSeguro('Linha\nquebrada\u0007')).toBe('Linha quebrada');
    const s = sub();
    await salvarInscricao(A.admin, s, 'Android');
    await criarTarefa(pool(), A.empresa.id, { tipo: 'atender_pedido', titulo: 'Novo pedido: Marina Golpe https://golpe.example', responsavelId: A.admin.userId });
    await enviarAvisosCelular();
    expect(para(s.endpoint).map((a) => a.titulo)).toEqual(['Novo pedido']);
  });

  it('no máximo 10 aparelhos por pessoa e teste de aviso com limite', async () => {
    const C = await novaEmpresa('Solar Avisos C');
    for (let i = 0; i < 12; i++) await salvarInscricao(C.vendedor, sub(), `A${i}`);
    expect(await contar('inscricoes_push where user_id = $1', [C.vendedor.userId])).toBe(10);
    for (let i = 0; i < 5; i++) await avisoDeTeste(C.vendedor);
    await expect(avisoDeTeste(C.vendedor)).rejects.toThrow(/Muitos testes/);
  });

  it('as chaves dos avisos saem do segredo do Supabase quando não há chaves próprias', () => {
    const antes = process.env.SUPABASE_JWT_SECRET;
    process.env.SUPABASE_JWT_SECRET = 'segredo-de-teste-do-supabase-com-mais-de-32-caracteres';
    try {
      const a = chavesVapid()!;
      expect(Buffer.from(a.publica, 'base64url')).toHaveLength(65);
      expect(Buffer.from(a.privada, 'base64url')).toHaveLength(32);
      expect(chavesVapid()).toEqual(a);
    } finally {
      if (antes === undefined) delete process.env.SUPABASE_JWT_SECRET;
      else process.env.SUPABASE_JWT_SECRET = antes;
    }
  });
});

describe('página de avisos e o que cada pessoa recebe', () => {
  const aviso = (empresaId: string, userId: string | null, titulo: string, tipo: string) =>
    q(`insert into notificacoes (empresa_id, user_id, titulo, link, tipo) values ($1, $2, $3, '/painel', $4)`, [empresaId, userId, titulo, tipo]);

  it('cada tipo de aviso cai no assunto certo', () => {
    expect(grupoDoTipo('tarefa:atender_pedido')).toBe('pedidos');
    expect(grupoDoTipo('sla')).toBe('pedidos');
    expect(grupoDoTipo('conversa')).toBe('conversas');
    expect(grupoDoTipo('tarefa:assumir_conversa')).toBe('conversas');
    expect(grupoDoTipo('tarefa:retornar_ligacao')).toBe('ligacoes');
    expect(grupoDoTipo('tarefa:avaliacao_baixa')).toBe('avaliacoes');
    expect(grupoDoTipo('agenda')).toBe('agenda');
    expect(grupoDoTipo('proposta')).toBe('propostas');
    expect(grupoDoTipo('resumo')).toBe('resumo');
    expect(grupoDoTipo('tarefa:manual')).toBe('tarefas');
    expect(grupoDoTipo('tarefa_vencida')).toBe('tarefas');
    expect(grupoDoTipo('geral')).toBe('outros');
  });

  it('assunto desligado e horário de silêncio (inclusive passando da meia-noite); o aviso de teste sempre chega', () => {
    const p = { grupos_desligados: ['resumo' as const], silencio_inicio: null, silencio_fim: null };
    expect(recebeAgora(p, 'resumo', 10)).toBe(false);
    expect(recebeAgora(p, 'tarefa:atender_pedido', 10)).toBe(true);
    const noite = { grupos_desligados: [], silencio_inicio: 22, silencio_fim: 7 };
    expect(recebeAgora(noite, 'conversa', 23)).toBe(false);
    expect(recebeAgora(noite, 'conversa', 3)).toBe(false);
    expect(recebeAgora(noite, 'conversa', 7)).toBe(true);
    expect(recebeAgora(noite, 'conversa', 12)).toBe(true);
    const almoco = { grupos_desligados: [], silencio_inicio: 12, silencio_fim: 14 };
    expect(recebeAgora(almoco, 'conversa', 13)).toBe(false);
    expect(recebeAgora(almoco, 'conversa', 14)).toBe(true);
    expect(recebeAgora({ grupos_desligados: ['outros'], silencio_inicio: 0, silencio_fim: 23 }, 'teste', 5)).toBe(true);
  });

  it('preferências: valida as horas e guarda só o que a pessoa desligou', async () => {
    await expect(salvarPreferencias(A.vendedor, { recebe: [], silencio_inicio: 22, silencio_fim: null })).rejects.toThrow(/começo e o fim/);
    await expect(salvarPreferencias(A.vendedor, { recebe: [], silencio_inicio: 8, silencio_fim: 8 })).rejects.toThrow(/começo e o fim/);
    await expect(salvarPreferencias(A.vendedor, { recebe: [], silencio_inicio: 25, silencio_fim: 3 })).rejects.toThrow(/0 a 23/);
    await salvarPreferencias(A.vendedor, { recebe: ['pedidos', 'conversas', 'ligacoes', 'avaliacoes', 'agenda', 'propostas', 'tarefas', 'outros', 'inventado'], silencio_inicio: 22, silencio_fim: 7 });
    expect(await minhasPreferencias(A.vendedor)).toEqual({ grupos_desligados: ['resumo'], silencio_inicio: 22, silencio_fim: 7 });
    expect(await minhasPreferencias(A.admin)).toEqual({ grupos_desligados: [], silencio_inicio: null, silencio_fim: null });
  });

  it('lista: vendedor vê só os dele, administrador vê também os da empresa; filtro e marcar lidos por assunto', async () => {
    const C = await novaEmpresa('Solar Lista');
    await aviso(C.empresa.id, null, 'Novo pedido: X', 'tarefa:atender_pedido');
    await aviso(C.empresa.id, null, 'Retornar a ligação: Y', 'tarefa:retornar_ligacao');
    await aviso(C.empresa.id, C.vendedor.userId, 'Uma oportunidade foi atribuída a você', 'atribuicao');
    const doVendedor = await listarAvisos(C.vendedor);
    expect(doVendedor.avisos.map((a) => a.titulo)).toEqual(['Uma oportunidade foi atribuída a você']);
    const doAdmin = await listarAvisos(C.admin);
    expect(doAdmin.avisos).toHaveLength(2);
    expect(doAdmin.naoLidos).toMatchObject({ pedidos: 1, ligacoes: 1, tarefas: 0 });
    expect((await listarAvisos(C.admin, { grupo: 'ligacoes' })).avisos.map((a) => a.titulo)).toEqual(['Retornar a ligação: Y']);
    await marcarAvisosLidos(C.admin, 'ligacoes');
    expect((await listarAvisos(C.admin, { soNaoLidos: true })).avisos.map((a) => a.titulo)).toEqual(['Novo pedido: X']);
    await marcarAvisosLidos(C.admin);
    expect((await listarAvisos(C.admin, { soNaoLidos: true })).avisos).toHaveLength(0);
    // the salesperson's own alert is untouched by the admin's "mark all"
    expect((await listarAvisos(C.vendedor, { soNaoLidos: true })).avisos).toHaveLength(1);
  });

  it('o celular respeita o assunto desligado e o horário de silêncio de cada pessoa', async () => {
    const C = await novaEmpresa('Solar Silêncio');
    const s = sub();
    await salvarInscricao(C.admin, s, 'Celular');
    await salvarPreferencias(C.admin, { recebe: ['pedidos', 'conversas', 'ligacoes', 'avaliacoes', 'agenda', 'propostas', 'tarefas', 'outros'], silencio_inicio: null, silencio_fim: null });
    await aviso(C.empresa.id, null, 'Resumo do dia da empresa', 'resumo');
    await aviso(C.empresa.id, null, 'Novo pedido: Z', 'tarefa:atender_pedido');
    await enviarAvisosCelular();
    expect(para(s.endpoint).map((a) => a.titulo)).toEqual(['Novo pedido']);
    // quiet hour right now: nothing reaches the phone, but it stays in the panel list
    const agora = horaLocal(C.empresa.config.regras.fuso);
    await salvarPreferencias(C.admin, { recebe: ['pedidos'], silencio_inicio: agora, silencio_fim: (agora + 1) % 24 });
    await aviso(C.empresa.id, null, 'Novo pedido: W', 'tarefa:atender_pedido');
    await enviarAvisosCelular();
    expect(para(s.endpoint)).toHaveLength(1);
    expect((await listarAvisos(C.admin)).avisos.map((a) => a.titulo)).toContain('Novo pedido: W');
  });
});
