import Link from 'next/link';
import { redirect } from 'next/navigation';
import { alternarFluxoAcao, criarFluxoAcao } from '@/app/acoes';
import { Atualizar } from '@/componentes/atualizar';
import { Enviar, Formulario } from '@/componentes/formulario';
import { MODELOS_DE_FLUXO, descreverGatilho, descreverPasso, listarFluxos } from '@/server/fluxos';
import { dataHora } from '@/componentes/formato';
import { empresaPorId } from '@/server/empresas';
import { adaptadorIA } from '@/server/ia';
import { canalDa } from '@/server/integracoes';
import { exigirCtx } from '@/server/sessao';
import { NOME_TRABALHO, execucoes, type Execucao } from '@/server/trabalhos';

export const metadata = { title: 'Automações' };

const ESTADO: Record<string, [string, string]> = {
  pendente: ['Agendada', 'etiqueta-azul'],
  executando: ['Rodando', 'etiqueta-azul'],
  concluido: ['Feita', 'etiqueta-ok'],
  cancelado: ['Cancelada', ''],
  falhou: ['Falhou', 'etiqueta-erro'],
  incerto: ['Sem confirmação', 'etiqueta-alerta'],
};

function Linha({ e }: { e: Execucao }) {
  const [nome, cor] = ESTADO[e.estado] ?? [e.estado, ''];
  const link = e.conversa_id ? `/painel/atendimento/${e.conversa_id}` : e.oportunidade_id ? `/painel/oportunidades/${e.oportunidade_id}` : null;
  const nota = e.ultimo_erro ?? e.resultado;
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-[15px]">
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-tinta">{NOME_TRABALHO[e.tipo] ?? e.tipo}</span>
        {e.contato && <> · {link ? <Link className="underline" href={link}>{e.contato}</Link> : e.contato}</>}
        {nota && <span className="block text-sm text-suave">{nota}</span>}
      </span>
      <span className="flex items-center gap-2"><time className="text-[13px] text-suave">{dataHora(e.concluido_em ?? e.executar_em)}</time><span className={`etiqueta ${cor}`}>{nome}</span></span>
    </li>
  );
}

export default async function Automacoes() {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel');
  const [empresa, x, { canal }, fluxos] = await Promise.all([empresaPorId(ctx.empresaId), execucoes(ctx.empresaId), canalDa(ctx.empresaId), listarFluxos(ctx)]);
  const r = empresa!.config.regras;
  const ia = adaptadorIA();
  const conta = (tipo: string, estado: string) => x.resumo.filter((s) => s.tipo === tipo && s.estado === estado).reduce((n, s) => n + s.total, 0);
  const lista: { tipo: string; nome: string; quando: string; ligada: boolean; detalhe: string }[] = [
    { tipo: 'alerta_sla', nome: 'Pedido novo', quando: 'Quando chega um pedido', ligada: true, detalhe: `Cria a tarefa de atendimento e avisa o responsável. Se ninguém atender em ${r.sla_minutos} min, avisa os administradores.` },
    { tipo: 'confirmacao_pedido', nome: 'Confirmação ao cliente', quando: 'Logo depois do pedido', ligada: true, detalhe: 'Mensagem pelo WhatsApp dizendo que o pedido chegou. Só para quem marcou a autorização no formulário.' },
    { tipo: 'responder_ia', nome: 'Assistente virtual', quando: 'A cada mensagem do cliente', ligada: empresa!.config.ia.ativa && !!ia, detalhe: `Responde com o conteúdo aprovado, anota os dados do orçamento e chama uma pessoa quando precisa.${ia?.simulada ? ' Hoje em simulação (sem modelo de IA).' : ''}` },
    { tipo: 'retorno_cliente', nome: 'Retorno da proposta', quando: 'Quando a oportunidade entra em “Proposta enviada”', ligada: r.retorno_auto_cliente, detalhe: `Cria a tarefa de retorno do vendedor em ${r.retorno_proposta_dias} dia(s).${r.retorno_auto_cliente ? ` Mensagem ao cliente depois de ${r.retorno_auto_horas} h${r.retorno_auto_horas_2 > r.retorno_auto_horas ? ` e de ${r.retorno_auto_horas_2} h` : ''}, cancelada se ele responder, pedir para parar, se alguém assumir ou se a etapa mudar.` : ' A mensagem automática ao cliente está desligada (só a tarefa).'}` },
    { tipo: 'escalar', nome: 'Tarefa vencida sobe', quando: `Quando uma tarefa passa do prazo há mais de ${r.escalar_horas} h`, ligada: r.escalar_horas > 0, detalhe: 'Os administradores recebem um aviso com o nome do responsável. Cada tarefa avisa uma vez só.' },
    { tipo: 'resumo', nome: 'Resumo do dia', quando: `Todo dia a partir das ${r.resumo_hora}h`, ligada: r.resumo_diario, detalhe: 'Aviso no painel: pedidos novos, tarefas de hoje e vencidas de cada pessoa; para os administradores, da empresa toda e quantas estão sem responsável.' },
    { tipo: 'convite_avaliacao', nome: 'Convite de avaliação', quando: 'Quando o serviço é marcado como concluído', ligada: r.avaliacao_auto && !!empresa!.config.avaliacao.link, detalhe: empresa!.config.avaliacao.link ? 'O mesmo convite neutro para todos os clientes, com o link público de avaliação.' : 'Falta configurar o link público de avaliação.' },
  ];
  return (
    <div className="max-w-4xl space-y-4">
      <Atualizar segundos={10} />
      <div>
        <h1 className="text-2xl font-bold">Automações</h1>
        <p className="text-[15px] text-suave">O que a plataforma faz sozinha, o que está agendado e o que já rodou. Mensagens automáticas saem das {r.hora_inicio}h às {r.hora_fim}h. {canal?.simulado ? 'WhatsApp em simulação: nenhuma mensagem externa é enviada.' : ''}</p>
      </div>
      <section className="space-y-3" aria-labelledby="t-fluxos">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="t-fluxos" className="text-xl font-bold">Seus fluxos</h2><p className="text-[15px] text-suave">Monte automações próprias: um gatilho, esperas, condições e ações. Novos fluxos nascem desligados.</p></div>
        </div>
        {fluxos.length === 0 && <p className="cartao p-4 text-[15px] text-suave">Nenhum fluxo ainda. Comece por um modelo pronto ou em branco.</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {fluxos.map((f) => (
            <li key={f.id} className="cartao p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="font-bold"><Link className="underline" href={`/painel/automacoes/fluxos/${f.id}`}>{f.nome}</Link></h3><span className={`etiqueta ${f.ativo ? 'etiqueta-ok' : ''}`}>{f.ativo ? 'Ligado' : 'Desligado'}</span></div>
              <p className="text-sm font-semibold text-suave">{descreverGatilho(f.gatilho)}</p>
              <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm">{f.passos.map((p, i) => <li key={i}>{descreverPasso(p)}</li>)}</ol>
              <p className="mt-2 text-[13px] text-suave">{f.execucoes} execução(ões) · {f.ativas} rodando agora</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="botao-2 min-h-10 px-3 py-1 text-sm" href={`/painel/automacoes/fluxos/${f.id}`}>Editar</Link>
                <Formulario acao={alternarFluxoAcao}><input type="hidden" name="id" value={f.id} /><Enviar secundario className="min-h-10 px-3 py-1 text-sm">{f.ativo ? 'Desligar' : 'Ligar'}</Enviar></Formulario>
              </div>
            </li>
          ))}
        </ul>
        <Formulario acao={criarFluxoAcao} className="cartao grid gap-3 p-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="modelo">Criar um fluxo novo</label>
            <select className="campo" id="modelo" name="modelo" defaultValue="">
              <option value="">Em branco</option>
              {MODELOS_DE_FLUXO.map((m) => <option key={m.id} value={m.id}>{m.nome}: {m.descricao}</option>)}
            </select>
          </div>
          <div className="flex items-end"><Enviar>Criar e editar</Enviar></div>
        </Formulario>
      </section>

      <h2 className="pt-2 text-xl font-bold">Automações prontas</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {lista.map((a) => (
          <li key={a.tipo} className="cartao p-4">
            <div className="flex items-start justify-between gap-2"><h2 className="font-bold">{a.nome}</h2><span className={`etiqueta ${a.ligada ? 'etiqueta-ok' : ''}`}>{a.ligada ? 'Ligada' : 'Desligada'}</span></div>
            <p className="text-sm font-semibold text-suave">{a.quando}</p>
            <p className="mt-1 text-[15px]">{a.detalhe}</p>
            {!['escalar', 'resumo'].includes(a.tipo) && <p className="mt-2 text-[13px] text-suave">Últimos 30 dias: {conta(a.tipo, 'concluido')} feita(s) · {conta(a.tipo, 'cancelado')} cancelada(s) · {conta(a.tipo, 'falhou') + conta(a.tipo, 'incerto')} com problema · {conta(a.tipo, 'pendente')} agendada(s)</p>}
          </li>
        ))}
      </ul>
      <p className="text-sm"><Link className="underline" href="/painel/configuracoes#regras">Ligar, desligar e mudar prazos em Configurações › Regras de acompanhamento</Link></p>

      <section className="cartao p-4" aria-labelledby="t-ag">
        <h2 id="t-ag" className="font-bold">Agendadas ({x.agendadas.length})</h2>
        {x.agendadas.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nada agendado agora.</p> : <ul className="mt-1 divide-y divide-linha">{x.agendadas.map((e) => <Linha key={e.id} e={e} />)}</ul>}
      </section>
      <section className="cartao p-4" aria-labelledby="t-rec">
        <h2 id="t-rec" className="font-bold">Últimas execuções</h2>
        {x.recentes.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nenhuma execução ainda.</p> : <ul className="mt-1 divide-y divide-linha">{x.recentes.map((e) => <Linha key={e.id} e={e} />)}</ul>}
      </section>
    </div>
  );
}
