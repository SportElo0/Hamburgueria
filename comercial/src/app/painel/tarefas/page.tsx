import Link from 'next/link';
import { concluirTarefaAcao, tarefaManualAcao } from '@/app/acoes';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { Vazio } from '@/componentes/pedacos';
import { equipe } from '@/server/empresas';
import { tarefas } from '@/server/oportunidades';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Tarefas' };

export default async function Tarefas({ searchParams }: { searchParams: Promise<{ de?: string; estado?: string }> }) {
  const ctx = await exigirCtx();
  const sp = await searchParams;
  const de = (['minhas', 'fila', 'todas'] as const).find((x) => x === sp.de) ?? 'minhas';
  const estado = (['abertas', 'vencidas', 'concluidas'] as const).find((x) => x === sp.estado) ?? 'abertas';
  const [lista, pessoas] = await Promise.all([tarefas(ctx, { de, estado }), equipe(ctx)]);
  const aba = (rotulo: string, q: Record<string, string>, ativo: boolean) => (
    <Link href={`/painel/tarefas?${new URLSearchParams({ de, estado, ...q })}`} aria-current={ativo ? 'true' : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${ativo ? 'bg-marca text-white' : 'border border-linha bg-white'}`}>{rotulo}</Link>
  );
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tarefas e retornos</h1>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <nav aria-label="De quem" className="flex flex-wrap gap-1">{aba('Minhas', { de: 'minhas' }, de === 'minhas')}{aba('Fila sem responsável', { de: 'fila' }, de === 'fila')}{aba('Todas', { de: 'todas' }, de === 'todas')}</nav>
        <nav aria-label="Situação" className="flex flex-wrap gap-1">{aba('Abertas', { estado: 'abertas' }, estado === 'abertas')}{aba('Vencidas', { estado: 'vencidas' }, estado === 'vencidas')}{aba('Concluídas', { estado: 'concluidas' }, estado === 'concluidas')}</nav>
      </div>
      {lista.length === 0 ? (
        <Vazio titulo={estado === 'vencidas' ? 'Nada vencido.' : 'Nenhuma tarefa aqui.'}>As tarefas nascem dos pedidos novos, das propostas enviadas e das conversas que precisam de uma pessoa.</Vazio>
      ) : (
        <ul className="cartao divide-y divide-linha">
          {lista.map((t) => {
            const vencida = !t.concluida_em && t.prazo && t.prazo < new Date();
            const link = t.conversa_id && t.tipo !== 'atender_pedido' ? `/painel/atendimento/${t.conversa_id}` : t.oportunidade_id ? `/painel/oportunidades/${t.oportunidade_id}` : null;
            return (
              <li key={t.id} className="p-3">
                <Formulario acao={concluirTarefaAcao} className="flex flex-wrap items-start justify-between gap-3">
                  <input type="hidden" name="id" value={t.id} />
                  <div className="min-w-0 flex-1">
                    {link ? <Link href={link} className="font-semibold text-tinta underline">{t.titulo}</Link> : <span className="font-semibold text-tinta">{t.titulo}</span>}
                    {t.detalhe && <p className="text-sm">{t.detalhe}</p>}
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] text-suave">
                      <span className={vencida ? 'font-bold text-erro' : ''}>{t.concluida_em ? `Concluída em ${dataHora(t.concluida_em)}` : `Prazo: ${dataHora(t.prazo)}${vencida ? ' (vencida)' : ''}`}</span>
                      <span>{t.responsavel_nome ?? 'Sem responsável'}</span>
                      {t.contato_nome && <span>{t.contato_nome}</span>}
                    </p>
                  </div>
                  {!t.concluida_em && <Enviar secundario className="min-h-10 px-3 py-1 text-sm">Concluir</Enviar>}
                </Formulario>
              </li>
            );
          })}
        </ul>
      )}
      <details className="cartao p-4">
        <summary className="cursor-pointer font-bold text-tinta">Criar tarefa</summary>
        <Formulario acao={tarefaManualAcao} limpar className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3"><label className="rotulo" htmlFor="titulo">O que precisa ser feito</label><input className="campo" id="titulo" name="titulo" required minLength={3} /></div>
          <div><label className="rotulo" htmlFor="prazo">Prazo</label><input className="campo" id="prazo" name="prazo" type="datetime-local" /></div>
          <div><label className="rotulo" htmlFor="resp">Responsável</label>
            <select className="campo" id="resp" name="responsavel" defaultValue={ctx.acessoAdmin ? '' : ctx.userId}>{pessoas.filter((p) => p.ativo).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}</select>
          </div>
          <div className="flex items-end"><Enviar secundario>Criar tarefa</Enviar></div>
        </Formulario>
      </details>
    </div>
  );
}
