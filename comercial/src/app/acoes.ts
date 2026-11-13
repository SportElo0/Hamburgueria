'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { after } from 'next/server';
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
import { gerarChaveTelefonia, simularLigacaoPerdida } from '@/server/ligacoes';
import { salvarInvestimento } from '@/server/anuncios';
import { cancelarProposta, criarProposta, enviarProposta, responderProposta } from '@/server/propostas';
import { criarLinkAgenda, marcarVisitaManual, mudarVisita, remarcarVisita } from '@/server/agenda';
import { anotar, atribuir, concluirTarefa, criarTarefaManual, definirProximaAcao, definirValor, excluirContato, marcarNotificacoesLidas, marcarServicoConcluido, mudarEtapa } from '@/server/oportunidades';
import { exigirCtx, exigirPlataforma, ipHash } from '@/server/sessao';
import { avisoDeTeste, enviarAvisosCelular, removerInscricao, salvarInscricao, type InscricaoEntrada } from '@/server/push';
import { processarFila } from '@/server/trabalhos';

const t = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

/** Runs an action and turns expected errors into a message for the form. Unexpected ones are logged, not shown. */
async function tentar(fn: () => Promise<Retorno | void>): Promise<Retorno> {
  try {
    const r = await fn();
    revalidatePath('/', 'layout');
    // Notifications created by this action go to the phones right after the answer.
    after(() => enviarAvisosCelular().catch((err) => console.error('[avisos celular]', err)));
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
      await salvarConfig(ctx, 'regras', { ...atual.regras, sla_minutos: num('sla_minutos'), retorno_proposta_dias: num('retorno_proposta_dias'), retorno_auto_cliente: fd.get('retorno_auto_cliente') === 'on', retorno_auto_horas: num('retorno_auto_horas'), retorno_auto_horas_2: num('retorno_auto_horas_2'), avaliacao_auto: fd.get('avaliacao_auto') === 'on', hora_inicio: num('hora_inicio'), hora_fim: num('hora_fim'), escalar_horas: num('escalar_horas'), manutencao_auto: fd.get('manutencao_auto') === 'on', manutencao_meses: num('manutencao_meses'), resumo_diario: fd.get('resumo_diario') === 'on', resumo_hora: num('resumo_hora'), ligacao_auto: fd.get('ligacao_auto') === 'on', ligacao_texto: t(fd, 'ligacao_texto') || atual.regras.ligacao_texto, ligacao_texto_fora: t(fd, 'ligacao_texto_fora') || atual.regras.ligacao_texto_fora });
    } else if (secao === 'ia') {
      await salvarConfig(ctx, 'ia', { ...atual.ia, ativa: fd.get('ativa') === 'on', nome: t(fd, 'nome') || 'Ana', modelo: t(fd, 'modelo'), limite_respostas_mes: num('limite_respostas_mes'), max_mensagens_contexto: num('max_mensagens_contexto') });
    } else if (secao === 'agenda') {
      const dias = fd.getAll('dias').map((d) => Number(d)).filter((d) => d >= 0 && d <= 6);
      const por_dia: Record<string, { inicio: number; fim: number }> = {};
      for (const d of dias) {
        const inicio = num(`inicio_${d}`);
        const fim = num(`fim_${d}`);
        if (!(fim > inicio)) throw new ErroDeUso('Em cada dia, o fim das visitas precisa ser depois do começo.');
        por_dia[String(d)] = { inicio, fim };
      }
      const bloqueios = t(fd, 'bloqueios').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const m = l.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*(?:a|até|-)\s*(\d{1,2})\/(\d{1,2})\/(\d{4}))?\s*(.*)$/);
        if (!m) throw new ErroDeUso(`Não entendi a data “${l.slice(0, 30)}”. Use 25/12/2026 ou 02/01/2027 a 10/01/2027.`);
        const iso = (d: string, mes: string, a: string) => `${a}-${mes.padStart(2, '0')}-${d.padStart(2, '0')}`;
        const de = iso(m[1], m[2], m[3]);
        const ate = m[4] ? iso(m[4], m[5], m[6]) : de;
        if (ate < de) throw new ErroDeUso(`No bloqueio “${l.slice(0, 30)}”, a segunda data vem antes da primeira.`);
        return { de, ate, motivo: m[7].replace(/^[-–:]\s*/, '').slice(0, 60) };
      });
      const primeiro = por_dia[String(dias[0])];
      await salvarConfig(ctx, 'agenda', { ativa: fd.get('ativa') === 'on', dias, por_dia, bloqueios, hora_inicio: primeiro?.inicio ?? atual.agenda.hora_inicio, hora_fim: primeiro?.fim ?? atual.agenda.hora_fim, duracao_min: num('duracao_min'), capacidade: num('capacidade'), antecedencia_horas: num('antecedencia_horas'), janela_dias: num('janela_dias'), ia_marca: fd.get('ia_marca') === 'on', lembrete: fd.get('lembrete') === 'on' });

    } else if (secao === 'dados') {
      await salvarConfig(ctx, 'dados', { guarda_meses: num('guarda_meses') });
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
    await salvarWhatsApp(await exigirCtx(), { modo: t(fd, 'modo'), phone_number_id: t(fd, 'phone_number_id'), waba_id: t(fd, 'waba_id'), modelo_confirmacao: t(fd, 'modelo_confirmacao'), modelo_retorno: t(fd, 'modelo_retorno'), modelo_avaliacao: t(fd, 'modelo_avaliacao'), modelo_manutencao: t(fd, 'modelo_manutencao'), modelo_ligacao: t(fd, 'modelo_ligacao'), modelo_lembrete_visita: t(fd, 'modelo_lembrete_visita'), idioma_modelos: t(fd, 'idioma_modelos') || 'pt_BR' }, String(fd.get('token') ?? ''));
    return { ok: 'Configuração do WhatsApp salva.' };
  });

export const convidarAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const { link, email } = await convidar(await exigirCtx(), { email: t(fd, 'email'), papel: t(fd, 'papel') as 'admin' | 'vendedor' });
    const aviso = email === 'enviado' ? 'Convite criado e enviado por e-mail (vale 7 dias). O link também está aqui.' : email === 'falhou' ? 'Convite criado (vale 7 dias), mas o e-mail não saiu: copie o link e mande para a pessoa.' : 'Convite criado (vale 7 dias). Copie o link e mande para a pessoa.';
    return { ok: aviso, copiar: link };
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

/* ---------- Phone app (alerts) ---------- */

export async function ligarAvisosAcao(sub: InscricaoEntrada, aparelho: string): Promise<Retorno> {
  return tentar(async () => {
    const ctx = await exigirCtx();
    await salvarInscricao(ctx, sub, String(aparelho ?? ''));
    return { ok: 'Avisos ligados neste celular.' };
  });
}

export async function desligarAvisosAcao(endpoint: string): Promise<Retorno> {
  return tentar(async () => {
    const ctx = await exigirCtx();
    await removerInscricao(ctx, String(endpoint ?? ''));
    return { ok: 'Avisos desligados neste celular.' };
  });
}

export async function testarAvisoAcao(): Promise<Retorno> {
  return tentar(async () => {
    const ctx = await exigirCtx();
    const n = await avisoDeTeste(ctx);
    return n ? { ok: 'Aviso de teste enviado. Ele chega em alguns segundos.' } : { erro: 'O aviso não saiu. Desligue e ligue os avisos de novo neste celular.' };
  });
}

/* ---------- Missed calls ---------- */

export const gerarChaveTelefoniaAcao = async () =>
  tentar(async () => {
    const chave = await gerarChaveTelefonia(await exigirCtx());
    return { ok: 'Chave criada. Ela aparece só agora: copie e cole no serviço de telefonia. A chave anterior parou de valer.', copiar: chave };
  });

const RESULTADO_LIGACAO: Record<string, string> = {
  mensagem_agendada: 'A mensagem saiu pelo WhatsApp (simulado) e a tarefa de retornar foi criada.',
  sem_autorizacao: 'Quem ligou não autorizou o WhatsApp: só a tarefa de retornar a ligação foi criada.',
  telefone_fixo: 'É telefone fixo: só a tarefa de retornar a ligação foi criada.',
  repetida: 'O mesmo número ligou há pouco: não mandou outra mensagem nem criou outra tarefa.',
  pediu_sair: 'Esse número tinha pedido para não receber mensagens: só a tarefa de retornar a ligação foi criada.',
  ja_respondida_hoje: 'Esse número já recebeu uma resposta nas últimas 24 horas: só a tarefa foi criada.',
  limite: 'Limite de respostas automáticas da hora atingido: só a tarefa foi criada.',
  desligado: 'A resposta automática está desligada nas regras: só a tarefa foi criada.',
};

export const simularLigacaoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const r = await simularLigacaoPerdida(await exigirCtx(), t(fd, 'telefone'), fd.get('aceite') === 'on');
    await processarFila(5).catch(() => {});
    return { ok: RESULTADO_LIGACAO[r.resultado] ?? 'Ligação registrada.' };
  });

/* ---------- Visit calendar ---------- */

export const marcarVisitaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const texto = await marcarVisitaManual(await exigirCtx(), { oportunidadeId: t(fd, 'oportunidade'), inicio: t(fd, 'inicio'), responsavelId: t(fd, 'responsavel') || undefined, endereco: t(fd, 'endereco'), observacao: t(fd, 'observacao'), aceiteLembrete: fd.get('lembrete') === 'on' });
    return { ok: `Visita marcada para ${texto}.` };
  });

export const visitaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const acao = t(fd, 'acao');
    if (!['confirmada', 'realizada', 'faltou', 'cancelada'].includes(acao)) throw new ErroDeUso('Ação inválida.');
    await mudarVisita(await exigirCtx(), t(fd, 'id'), acao as 'confirmada');
    return { ok: 'Visita atualizada.' };
  });

export const remarcarVisitaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await remarcarVisita(await exigirCtx(), t(fd, 'id'), t(fd, 'inicio'));
    return { ok: 'Visita remarcada. O lembrete foi ajustado para o novo horário.' };
  });

export const linkAgendaAcao = async () =>
  tentar(async () => {
    const token = await criarLinkAgenda(await exigirCtx());
    return { ok: 'Link criado. Ele aparece só agora: no Google Agenda, use “Outras agendas” › “+” › “Do URL” e cole o endereço. O link anterior parou de valer.', copiar: `${process.env.APP_URL ?? ''}/api/agenda/${token}` };
  });

/* ---------- Ads ---------- */

export const salvarInvestimentoAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const valor = centavos(t(fd, 'valor'));
    await salvarInvestimento(await exigirCtx(), { mes: t(fd, 'mes'), fonte: t(fd, 'fonte'), campanha: t(fd, 'campanha'), valorCentavos: valor ?? 0 });
    return { ok: valor ? 'Gasto salvo.' : 'Gasto removido.' };
  });

/* ---------- Online proposal ---------- */

export const criarPropostaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const itens = t(fd, 'itens').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [descricao, qtd, valor] = l.split('|').map((x) => x.trim());
      const quantidade = Number((qtd || '1').replace(',', '.'));
      const v = centavos(valor ?? '');
      if (!descricao || !Number.isFinite(quantidade) || v == null) throw new ErroDeUso(`Não entendi o item “${l.slice(0, 40)}”. Use: descrição | quantidade | valor.`);
      return { descricao, quantidade, valor_unit_centavos: v };
    });
    await criarProposta(await exigirCtx(), { oportunidadeId: t(fd, 'oportunidade'), titulo: t(fd, 'titulo'), itens, condicoes: t(fd, 'condicoes'), validadeDias: Number(t(fd, 'validade')), consumidor: t(fd, 'consumidor') !== 'empresa' });
    return { ok: 'Proposta salva como rascunho. Confira e gere o link.' };
  });

export const enviarPropostaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    const link = await enviarProposta(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Link criado (aparece só agora; gerar de novo troca o link). Mande para o cliente:', copiar: link };
  });

export const cancelarPropostaAcao = async (_: Retorno, fd: FormData) =>
  tentar(async () => {
    await cancelarProposta(await exigirCtx(), t(fd, 'id'));
    return { ok: 'Proposta cancelada: o link parou de funcionar.' };
  });

async function responderPublico(fd: FormData, aceitar: boolean): Promise<Retorno> {
  const ip = await ipHash();
  if (!(await dentroDoLimite(`proposta:${ip}`, 10, 600))) return { erro: 'Muitas tentativas. Aguarde alguns minutos.' };
  try {
    if (aceitar && fd.get('li') !== 'on') return { erro: 'Marque que leu e aceita a proposta.' };
    await responderProposta(t(fd, 'token'), { aceitar, nome: t(fd, 'nome'), motivo: t(fd, 'motivo'), ipHash: ip, navegador: (await headers()).get('user-agent') ?? '' });
  } catch (err) {
    if (err instanceof ErroDeUso) return { erro: err.message };
    console.error('[proposta]', err instanceof Error ? err.message : err);
    return { erro: 'Não foi possível registrar agora. Tente de novo em instantes.' };
  }
  revalidatePath(`/p/${t(fd, 'token')}`);
  return { ok: aceitar ? 'Proposta aceita. A empresa vai falar com você.' : 'Resposta registrada. Obrigado por avisar.' };
}
export const aceitarPropostaAcao = async (_: Retorno, fd: FormData) => responderPublico(fd, true);
export const recusarPropostaAcao = async (_: Retorno, fd: FormData) => responderPublico(fd, false);
