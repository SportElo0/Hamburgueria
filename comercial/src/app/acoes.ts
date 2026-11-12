'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect, unstable_rethrow } from 'next/navigation';
import type { Retorno } from '@/componentes/formulario';
import { deCampoData } from '@/componentes/formato';
import { auth } from '@/server/auth';
import { gerarLinkAvaliacao } from '@/server/avaliacoes';
import type { Etapa } from '@/server/config';
import { salvarConhecimento } from '@/server/conhecimento';
import { dentroDoLimite } from '@/server/contexto';
import { assumir, devolverParaIA, encerrarConversa, enviarComoHumano, simularEntradaWhatsApp } from '@/server/conversas';
import { abrirAcessoAdmin, aceitarConvite, alterarMembro, convidar, criarEmpresa, definirAtiva, definirResponsavelPadrao, empresaPorId, encerrarAcessoAdmin, salvarConfig } from '@/server/empresas';
import { ErroDeUso } from '@/server/erros';
import { CONDICOES, MODELOS_DE_FLUXO, excluirFluxo, salvarFluxo, type EntradaFluxo } from '@/server/fluxos';
import { salvarWhatsApp } from '@/server/integracoes';
import { anotar, atribuir, concluirTarefa, criarTarefaManual, definirProximaAcao, definirValor, excluirContato, marcarNotificacoesLidas, marcarServicoConcluido, mudarEtapa } from '@/server/oportunidades';
import { exigirCtx, exigirPlataforma, ipHash } from '@/server/sessao';
import { processarFila } from '@/server/trabalhos';

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

/** Runs an action and turns expected errors into a message for the form. Unexpected ones are logged, not shown. */
async function tentar(fn: () => Promise<Retorno | void>): Promise<Retorno> {
  try {
    const r = await fn();
    revalidatePath('/', 'layout');
    return r ?? { ok: 'Salvo.' };
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ErroDeUso) return { erro: err.message };
    console.error('[acao]', err);
    return { erro: 'Não foi possível concluir agora. Tente de novo em instantes.' };
  }
}

function centavos(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new ErroDeUso('Valor inválido. Exemplo: 18.500,00');
  return Math.round(n * 100);
}

/* ---------- Access ---------- */

export async function entrar(_: Retorno, fd: FormData): Promise<Retorno> {
  if (!(await dentroDoLimite(`login:${await ipHash()}`, 10, 300))) return { erro: 'Muitas tentativas. Aguarde alguns minutos.' };
  if (!(await dentroDoLimite(`login:email:${t(fd, 'email').toLowerCase().slice(0, 120)}`, 8, 900))) return { erro: 'Muitas tentativas para este e-mail. Aguarde alguns minutos.' };
  try {
    await auth().api.signInEmail({ body: { email: t(fd, 'email').toLowerCase(), password: String(fd.get('senha') ?? '') }, headers: await headers() });
  } catch {
    return { erro: 'E-mail ou senha incorretos.' };
  }
  redirect('/');
}

export async function sair() {
  await auth().api.signOut({ headers: await headers() }).catch(() => {});
  redirect('/login');
}

export async function pedirNovaSenha(_: Retorno, fd: FormData): Promise<Retorno> {
  if (!(await dentroDoLimite(`senha:${await ipHash()}`, 5, 900))) return { erro: 'Muitas tentativas. Aguarde alguns minutos.' };
  await auth().api.requestPasswordReset({ body: { email: t(fd, 'email').toLowerCase(), redirectTo: '/redefinir' } }).catch(() => {});
  // Same answer whether the e-mail exists or not.
  return { ok: 'Se este e-mail tiver acesso, as instruções para criar uma senha nova foram geradas. Enquanto o envio de e-mail não está configurado, peça o link à equipe Growlift.' };
}

export async function redefinirSenha(_: Retorno, fd: FormData): Promise<Retorno> {
  const senha = String(fd.get('senha') ?? '');
  if (senha.length < 10) return { erro: 'A senha precisa de pelo menos 10 caracteres.' };
  try {
    await auth().api.resetPassword({ body: { newPassword: senha, token: t(fd, 'token') } });
  } catch {
    return { erro: 'Link inválido ou vencido. Peça um novo.' };
  }
  redirect('/login?senha=ok');
}

export async function aceitarConviteAcao(_: Retorno, fd: FormData): Promise<Retorno> {
  const r = await tentar(async () => {
    await aceitarConvite(t(fd, 'token'), t(fd, 'nome'), String(fd.get('senha') ?? ''));
  });
  if (r.erro) return r;
  redirect('/login?convite=ok');
}

/* ---------- Opportunities ---------- */

export const mudarEtapaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const valor = centavos(t(fd, 'valor'));
    await mudarEtapa(await exigirCtx(), t(fd, 'id'), { etapa: t(fd, 'etapa') as Etapa, motivoPerda: t(fd, 'motivo'), valorCentavos: valor });
    return { ok: 'Etapa atualizada.' };
  });

export const atribuirAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await atribuir(await exigirCtx(), t(fd, 'id'), t(fd, 'responsavel') || null);
    return { ok: 'Responsável atualizado.' };
  });

export const proximaAcaoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await definirProximaAcao(await exigirCtx(), t(fd, 'id'), t(fd, 'texto'), deCampoData(t(fd, 'quando')));
    return { ok: 'Próxima ação salva.' };
  });

export const anotarAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await anotar(await exigirCtx(), t(fd, 'id'), t(fd, 'texto'));
    return { ok: 'Anotação salva.' };
  });

export const valorAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await definirValor(await exigirCtx(), t(fd, 'id'), centavos(t(fd, 'valor')));
    return { ok: 'Valor salvo.' };
  });

export const servicoConcluidoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await marcarServicoConcluido(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Serviço marcado como concluído.' };
  });

export const linkAvaliacaoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => ({ copiar: await gerarLinkAvaliacao(await exigirCtx(), t(fd, 'id')) }));

export const excluirContatoAcao = async (_: Retorno, fd: FormData) => {
  const r = await tentar(async () => {
    if (t(fd, 'confirmar') !== 'EXCLUIR') throw new ErroDeUso('Para confirmar, escreva EXCLUIR.');
    await excluirContato(await exigirCtx(), t(fd, 'contato'));
  });
  if (r.erro) return r;
  redirect('/painel/oportunidades');
};

/* ---------- Tasks ---------- */

export const tarefaManualAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await criarTarefaManual(await exigirCtx(), { titulo: t(fd, 'titulo'), prazo: deCampoData(t(fd, 'prazo')), oportunidadeId: t(fd, 'oportunidade') || null, responsavelId: t(fd, 'responsavel') || null });
    return { ok: 'Tarefa criada.' };
  });

export const concluirTarefaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await concluirTarefa(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Concluída.' };
  });

export async function lerNotificacoesAcao() {
  await marcarNotificacoesLidas(await exigirCtx());
  revalidatePath('/', 'layout');
}

/* ---------- Conversations ---------- */

export const assumirAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await assumir(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Você assumiu a conversa. A assistente parou de responder.' };
  });

export const devolverAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await devolverParaIA(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Conversa devolvida para a assistente.' };
  });

export const encerrarAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await encerrarConversa(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Conversa encerrada.' };
  });

export const enviarMensagemAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await enviarComoHumano(await exigirCtx(), t(fd, 'id'), t(fd, 'texto'));
    // Sends right away when the worker is not running (it would pick the job up anyway).
    await processarFila(5).catch(() => {});
    return { ok: 'Mensagem registrada.' };
  });

export const simularWhatsAppAcao = async (_: Retorno, fd: FormData) => {
  let conversa = '';
  const r = await tentar(async () => {
    const x = await simularEntradaWhatsApp(await exigirCtx(), t(fd, 'telefone'), t(fd, 'nome'), t(fd, 'texto'));
    await processarFila(5).catch(() => {});
    conversa = x.conversaId ?? '';
  });
  if (r.erro || !conversa) return r;
  redirect(`/painel/atendimento/${conversa}`);
};

/* ---------- Knowledge and settings ---------- */

export const salvarConhecimentoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const perguntas = fd.getAll('pergunta').map(String);
    const respostas = fd.getAll('resposta').map(String);
    const faq = perguntas.map((p, i) => ({ pergunta: p.trim(), resposta: (respostas[i] ?? '').trim() })).filter((f) => f.pergunta && f.resposta);
    const versao = await salvarConhecimento(await exigirCtx(), {
      descricao: t(fd, 'descricao'), servicos: t(fd, 'servicos'), horarios: t(fd, 'horarios'), regioes: t(fd, 'regioes'), faq,
      precos_autorizados: t(fd, 'precos_autorizados'), regras_comerciais: t(fd, 'regras_comerciais'), criterios_encaminhamento: t(fd, 'criterios_encaminhamento'),
    });
    return { ok: `Conteúdo salvo (versão ${versao}). A assistente já usa esta versão.` };
  });

const itens = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [titulo, ...resto] = l.split('|'); return { titulo: titulo.trim(), texto: resto.join('|').trim() }; });

export const salvarConfigAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const ctx = await exigirCtx();
    const atual = (await empresaPorId(ctx.empresaId))!.config;
    const secao = t(fd, 'secao');
    const num = (k: string) => Number(t(fd, k));
    if (secao === 'regras') {
      await salvarConfig(ctx, 'regras', { ...atual.regras, sla_minutos: num('sla_minutos'), retorno_proposta_dias: num('retorno_proposta_dias'), retorno_auto_cliente: fd.get('retorno_auto_cliente') === 'on', retorno_auto_horas: num('retorno_auto_horas'), retorno_auto_horas_2: num('retorno_auto_horas_2'), avaliacao_auto: fd.get('avaliacao_auto') === 'on', hora_inicio: num('hora_inicio'), hora_fim: num('hora_fim'), escalar_horas: num('escalar_horas'), manutencao_auto: fd.get('manutencao_auto') === 'on', manutencao_meses: num('manutencao_meses'), resumo_diario: fd.get('resumo_diario') === 'on', resumo_hora: num('resumo_hora') });
    } else if (secao === 'ia') {
      await salvarConfig(ctx, 'ia', { ...atual.ia, ativa: fd.get('ativa') === 'on', nome: t(fd, 'nome') || 'Ana', modelo: t(fd, 'modelo'), limite_respostas_mes: num('limite_respostas_mes'), max_mensagens_contexto: num('max_mensagens_contexto') });
    } else if (secao === 'avaliacao') {
      const link = t(fd, 'link');
      if (link && !/^https:\/\/[^\s]+$/.test(link)) throw new ErroDeUso('O link de avaliação precisa começar com https://');
      await salvarConfig(ctx, 'avaliacao', { link });
    } else if (secao === 'site') {
      await salvarConfig(ctx, 'site', { ...atual.site, chamada: t(fd, 'chamada'), descricao: t(fd, 'descricao'), servicos: itens(t(fd, 'servicos')), projetos: itens(t(fd, 'projetos')), areas: t(fd, 'areas').split(/[\n,]/).map((a) => a.trim()).filter(Boolean), whatsapp: t(fd, 'whatsapp').replace(/\D/g, ''), email: t(fd, 'email'), endereco: t(fd, 'endereco'), responsavel_dados: t(fd, 'responsavel_dados'), razao_social: t(fd, 'razao_social'), cnpj: t(fd, 'cnpj'), privacidade: t(fd, 'privacidade') });
    } else throw new ErroDeUso('Seção desconhecida.');
    return { ok: 'Configuração salva.' };
  });

export const salvarWhatsAppAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await salvarWhatsApp(await exigirCtx(), { modo: t(fd, 'modo'), phone_number_id: t(fd, 'phone_number_id'), waba_id: t(fd, 'waba_id'), modelo_confirmacao: t(fd, 'modelo_confirmacao'), modelo_retorno: t(fd, 'modelo_retorno'), modelo_avaliacao: t(fd, 'modelo_avaliacao'), modelo_manutencao: t(fd, 'modelo_manutencao'), idioma_modelos: t(fd, 'idioma_modelos') || 'pt_BR' }, String(fd.get('token') ?? ''));
    return { ok: 'Configuração do WhatsApp salva.' };
  });

export const convidarAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const { link } = await convidar(await exigirCtx(), { email: t(fd, 'email'), papel: t(fd, 'papel') as 'admin' | 'vendedor' });
    return { ok: 'Convite criado (vale 7 dias).', copiar: link };
  });

export const membroAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const acao = t(fd, 'acao');
    await alterarMembro(await exigirCtx(), t(fd, 'membro'), acao === 'desativar' ? { ativo: false } : acao === 'reativar' ? { ativo: true } : { papel: acao === 'tornar_admin' ? 'admin' : 'vendedor' });
    return { ok: 'Equipe atualizada.' };
  });

export const responsavelPadraoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await definirResponsavelPadrao(await exigirCtx(), t(fd, 'responsavel') || null);
    return { ok: 'Responsável padrão salvo.' };
  });

/* ---------- Growlift admin ---------- */

export const criarEmpresaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const s = await exigirPlataforma();
    const e = await criarEmpresa(s.userId, { nome: t(fd, 'nome'), slug: t(fd, 'slug'), segmento: t(fd, 'segmento'), demonstracao: fd.get('demonstracao') === 'on' });
    return { ok: `Empresa "${e.nome}" criada. Entre nela (com motivo) para convidar o administrador.` };
  });

export const entrarEmpresaAcao = async (_: Retorno, fd: FormData) => {
  const r = await tentar(async () => {
    const s = await exigirPlataforma();
    await abrirAcessoAdmin(s.userId, t(fd, 'empresa'), t(fd, 'motivo'));
  });
  if (r.erro) return r;
  redirect('/painel');
};

export async function sairEmpresaAcao() {
  const s = await exigirPlataforma();
  await encerrarAcessoAdmin(s.userId);
  redirect('/admin');
}

export const ativarEmpresaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const s = await exigirPlataforma();
    await definirAtiva(s.userId, t(fd, 'empresa'), t(fd, 'ativa') === 'sim');
    return { ok: 'Atualizado.' };
  });

/* ---------- Automation builder ---------- */

const MINUTOS: Record<string, number> = { min: 1, h: 60, dia: 1440 };

/** Reads the step rows of the editor (parallel lists, one entry per row) into flow steps. Empty rows are ignored. */
function lerPassos(fd: FormData): { passos: EntradaFluxo['passos']; linhas: number[] } {
  const col = (k: string) => fd.getAll(k).map(String);
  const [tipo, qtd, unidade, condicao, texto, modelo, etapa, pessoa, soVazio] = ['passo_tipo', 'passo_qtd', 'passo_unidade', 'passo_condicao', 'passo_texto', 'passo_modelo', 'passo_etapa', 'passo_pessoa', 'passo_so_vazio'].map(col);
  const passos: EntradaFluxo['passos'] = [];
  const linhas: number[] = [];
  tipo.forEach((tp, i) => {
    if (tp) linhas.push(i + 1);
    const n = Number((qtd[i] ?? '').replace(',', '.'));
    const num = Number.isFinite(n) && (qtd[i] ?? '').trim() !== '' ? Math.round(n) : 0;
    const txt = (texto[i] ?? '').trim();
    if (tp === 'esperar') passos.push({ tipo: 'esperar', minutos: num * (MINUTOS[unidade[i]] ?? 1) });
    else if (tp === 'se') passos.push({ tipo: 'se', condicao: (CONDICOES as readonly string[]).includes(condicao[i]) ? (condicao[i] as (typeof CONDICOES)[number]) : 'cliente_respondeu', ir_para: num });
    else if (tp === 'ir_para') passos.push({ tipo: 'ir_para', passo: num });
    else if (tp === 'parar_se') passos.push({ tipo: 'parar_se', condicao: (CONDICOES as readonly string[]).includes(condicao[i]) ? (condicao[i] as (typeof CONDICOES)[number]) : 'cliente_respondeu' });
    else if (tp === 'enviar_whatsapp') passos.push({ tipo: 'enviar_whatsapp', texto: txt, modelo: (modelo[i] ?? '').trim() });
    else if (tp === 'criar_tarefa') passos.push({ tipo: 'criar_tarefa', titulo: txt, prazo_horas: num });
    else if (tp === 'avisar_equipe') passos.push({ tipo: 'avisar_equipe', titulo: txt });
    else if (tp === 'anotar') passos.push({ tipo: 'anotar', texto: txt });
    else if (tp === 'atribuir') passos.push({ tipo: 'atribuir', modo: pessoa[i] ? 'pessoa' : 'menos_ocupado', user_id: pessoa[i] ?? '', so_sem_responsavel: soVazio[i] !== 'nao' });
    else if (tp === 'mover_etapa') passos.push({ tipo: 'mover_etapa', etapa: (etapa[i] ?? 'atendimento') as 'atendimento' });
  });
  return { passos, linhas };
}

export const criarFluxoAcao = async (_: Retorno, fd: FormData) => {
  let id = '';
  const r = await tentar(async () => {
    const modelo = MODELOS_DE_FLUXO.find((m) => m.id === t(fd, 'modelo'));
    id = await salvarFluxo(await exigirCtx(), null, modelo?.fluxo ?? { nome: 'Novo fluxo', ativo: false, gatilho: { tipo: 'pedido_recebido' }, passos: [{ tipo: 'avisar_equipe', titulo: 'Escreva o aviso' }] });
  });
  if (r.erro || !id) return r;
  redirect(`/painel/automacoes/fluxos/${id}`);
};

export const salvarFluxoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const gatilho = t(fd, 'gatilho');
    const { passos, linhas } = lerPassos(fd);
    try {
      // Jump targets are typed as screen rows; the flow stores step numbers (empty rows do not count).
      const passosNum = passos.map((p) => (p.tipo === 'se' && p.ir_para ? { ...p, ir_para: linhas.indexOf(p.ir_para) + 1 || 99 } : p.tipo === 'ir_para' && p.passo ? { ...p, passo: linhas.indexOf(p.passo) + 1 || 99 } : p));
      await salvarFluxo(await exigirCtx(), t(fd, 'id'), { nome: t(fd, 'nome'), ativo: fd.get('ativo') === 'on', gatilho: { tipo: gatilho, ...(gatilho === 'etapa_alterada' ? { etapa: t(fd, 'etapa') } : {}), ...(gatilho === 'mensagem_recebida' ? { palavra: t(fd, 'palavra') } : {}), ...(gatilho === 'sem_interacao' ? { dias: Number(t(fd, 'dias')) || 0 } : {}) }, passos: passosNum });
    } catch (err) {
      // The validation counts filled steps; the screen counts rows. Point to the row the person sees.
      if (err instanceof ErroDeUso) throw new ErroDeUso(err.message.replace(/^Passo (\d+):/, (_m, n) => `Linha ${linhas[Number(n) - 1] ?? n}:`), err.status);
      throw err;
    }
    return { ok: fd.get('ativo') === 'on' ? 'Fluxo salvo e ligado.' : 'Fluxo salvo (desligado).' };
  });

export const alternarFluxoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const ctx = await exigirCtx();
    const { obterFluxo } = await import('@/server/fluxos');
    const f = await obterFluxo(ctx, t(fd, 'id'));
    await salvarFluxo(ctx, f.id, { nome: f.nome, ativo: !f.ativo, gatilho: f.gatilho, passos: f.passos });
    return { ok: f.ativo ? 'Fluxo desligado.' : 'Fluxo ligado.' };
  });

export const excluirFluxoAcao = async (_: Retorno, fd: FormData) => {
  const r = await tentar(async () => {
    await excluirFluxo(await exigirCtx(), t(fd, 'id'));
  });
  if (r.erro) return r;
  redirect('/painel/automacoes');
};

/* ---------- Growlift: real assistant check ---------- */

export async function testarAssistenteAcao(_: import('@/componentes/testar-assistente').EstadoTeste, fd: FormData): Promise<import('@/componentes/testar-assistente').EstadoTeste> {
  const s = await exigirPlataforma();
  if (!process.env.IA_ANTHROPIC_API_KEY) return { erro: 'A chave da IA (IA_ANTHROPIC_API_KEY) não está configurada neste servidor: a assistente está em simulação.' };
  // Each run costs money: a few per hour at most.
  if (!(await dentroDoLimite(`testar-ia:${s.userId}`, 4, 3600))) return { erro: 'Limite de 4 testes por hora atingido (cada teste tem custo).' };
  const modelo = t(fd, 'modelo') || (await import('@/server/ia')).modeloPadrao();
  if (!/^claude-[a-z0-9-]{3,40}$/.test(modelo)) return { erro: 'Nome de modelo inválido.' };
  try {
    const { checarAssistente } = await import('@/server/ia/checagem');
    return { resultado: await checarAssistente(modelo) };
  } catch (err) {
    console.error('[testar-ia]', err instanceof Error ? err.message : err);
    return { erro: 'Não foi possível falar com a API da IA agora. Confira a chave e tente de novo.' };
  }
}
