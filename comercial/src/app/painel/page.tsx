import Link from 'next/link';
import { lerNotificacoesAcao } from '@/app/acoes';
import { ORIGENS, dataHora, minutos, reais } from '@/componentes/formato';
import { ETAPAS, NOME_ETAPA } from '@/server/config';
import { empresaPorId } from '@/server/empresas';
import { metricas } from '@/server/metricas';
import { notificacoes } from '@/server/oportunidades';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Visão geral' };

function Numero({ titulo, valor, nota, href }: { titulo: string; valor: string | number; nota?: string; href?: string }) {
  const corpo = (
    <>
      <p className="text-sm font-semibold text-suave">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-tinta tabular-nums">{valor}</p>
      {nota && <p className="mt-1 text-[13px] leading-snug text-suave">{nota}</p>}
    </>
  );
  return href ? <Link href={href} className="cartao block p-4 hover:border-marca">{corpo}</Link> : <div className="cartao p-4">{corpo}</div>;
}

export default async function VisaoGeral({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const ctx = await exigirCtx();
  const dias = [7, 30, 90].includes(Number((await searchParams).dias)) ? Number((await searchParams).dias) : 30;
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const [m, avisos] = await Promise.all([metricas(ctx, dias, empresa.config.ia.limite_respostas_mes), notificacoes(ctx)]);
  const naoLidas = avisos.filter((a) => !a.lida_em);
  const total = ETAPAS.reduce((s, e) => s + m.porEtapa[e], 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visão geral</h1>
          <p className="text-[15px] text-suave">Números contados a partir do que foi registrado nos últimos {dias} dias. Nada aqui é estimativa.</p>
        </div>
        <nav aria-label="Período" className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/painel?dias=${d}`} aria-current={d === dias ? 'true' : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${d === dias ? 'bg-marca text-white' : 'border border-linha bg-white text-texto'}`}>
              {d} dias
            </Link>
          ))}
        </nav>
      </div>

      {total === 0 && (
        <div className="cartao p-6 text-center">
          <p className="font-semibold text-tinta">Ainda não chegou nenhum pedido.</p>
          <p className="mt-1 text-[15px] text-suave">Quando alguém enviar o formulário do site ou escrever para a empresa, o pedido aparece aqui e em Oportunidades.</p>
          <Link className="botao mt-4" href={`/s/${empresa.slug}`} target="_blank">Abrir o site da empresa</Link>
        </div>
      )}

      <section aria-label="Resumo do período" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero titulo="Pedidos recebidos" valor={m.pedidos} nota={m.porOrigem.map((o) => `${ORIGENS[o.origem] ?? o.origem}: ${o.total}`).join(' · ') || 'Nenhum no período'} href="/painel/oportunidades" />
        <Numero titulo="Primeiro atendimento por pessoa" valor={minutos(m.primeiroHumano.mediana)} nota={`Mediana de ${m.primeiroHumano.atendidos} pedido(s) já atendido(s). ${m.primeiroHumano.aguardando} aguardando.`} />
        <Numero titulo="Confirmação automática" valor={minutos(m.confirmacaoAuto.mediana)} nota={`Mediana de ${m.confirmacaoAuto.confirmados} pedido(s) que receberam confirmação.`} />
        <Numero titulo="Pendências vencidas" valor={m.pendenciasVencidas} nota="Tarefas abertas com prazo passado (agora)." href="/painel/tarefas?estado=vencidas&de=todas" />
        <Numero titulo="Propostas enviadas" valor={m.propostasEnviadas} nota="Oportunidades que entraram em “Proposta enviada”." />
        <Numero titulo="Ganhos registrados" valor={m.ganhos} nota={`Perdas registradas: ${m.perdidos}`} />
        <Numero titulo="Valor das vendas ganhas" valor={reais(m.valorGanhoCentavos)} nota={`Valor comercial informado pelos vendedores, não é lucro.${m.ganhosSemValor ? ` ${m.ganhosSemValor} ganho(s) sem valor informado.` : ''}`} />
        <Numero titulo="Oportunidades em aberto" valor={total - m.porEtapa.ganho - m.porEtapa.perdido} nota="Situação atual, fora do período." href="/painel/oportunidades" />
      </section>

      <section className="cartao p-4" aria-labelledby="t-etapas">
        <h2 id="t-etapas" className="font-bold">Oportunidades por etapa (situação atual)</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {ETAPAS.map((e) => (
            <li key={e}>
              <Link href={`/painel/oportunidades?ver=lista&etapa=${e}`} className="block rounded-lg border border-linha p-3 hover:border-marca">
                <span className="block text-[13px] font-semibold text-suave">{NOME_ETAPA[e]}</span>
                <span className="text-xl font-bold text-tinta tabular-nums">{m.porEtapa[e]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {m.tecnico && (
        <section className="cartao p-4" aria-labelledby="t-tec">
          <h2 id="t-tec" className="font-bold">Integrações e consumo (só administradores)</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-4">
            <div><dt className="text-suave">Mensagens com falha</dt><dd className="font-bold text-tinta">{m.tecnico.mensagensFalhas}</dd></div>
            <div><dt className="text-suave">Envios sem confirmação</dt><dd className="font-bold text-tinta">{m.tecnico.mensagensIncertas}</dd></div>
            <div><dt className="text-suave">Respostas da assistente no mês</dt><dd className="font-bold text-tinta">{m.tecnico.iaRespostasMes} de {m.tecnico.iaLimiteMes}</dd></div>
            <div><dt className="text-suave">Falhas da assistente no mês</dt><dd className="font-bold text-tinta">{m.tecnico.iaFalhasMes}</dd></div>
          </dl>
        </section>
      )}

      <section className="cartao p-4" aria-labelledby="t-avisos">
        <div className="flex items-center justify-between gap-3">
          <h2 id="t-avisos" className="font-bold">Avisos {naoLidas.length ? <span className="etiqueta etiqueta-alerta ml-1">{naoLidas.length} novo(s)</span> : null}</h2>
          {naoLidas.length > 0 && <form action={lerNotificacoesAcao}><button className="botao-2 min-h-9 px-3 py-1 text-sm">Marcar como lidos</button></form>}
        </div>
        {avisos.length === 0 ? (
          <p className="mt-3 text-[15px] text-suave">Nenhum aviso por enquanto.</p>
        ) : (
          <ul className="mt-3 divide-y divide-linha">
            {avisos.slice(0, 12).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                <Link href={a.link || '/painel'} className={`text-[15px] hover:underline ${a.lida_em ? 'text-texto' : 'font-semibold text-tinta'}`}>
                  {a.titulo}
                  {a.corpo && <span className="block text-sm font-normal text-suave">{a.corpo}</span>}
                </Link>
                <time className="shrink-0 text-[13px] text-suave">{dataHora(a.criado_em)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
