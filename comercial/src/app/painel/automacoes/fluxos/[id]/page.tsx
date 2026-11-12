import Link from 'next/link';
import { redirect } from 'next/navigation';
import { excluirFluxoAcao, salvarFluxoAcao } from '@/app/acoes';
import { dataHora } from '@/componentes/formato';
import { DiagramaFluxo } from '@/componentes/diagrama-fluxo';
import { Enviar, Formulario } from '@/componentes/formulario';
import { ETAPAS, NOME_ETAPA } from '@/server/config';
import { equipe } from '@/server/empresas';
import { CONDICOES, ETAPAS_MOVIVEIS, GATILHOS, NOME_CONDICAO, NOME_GATILHO, descreverGatilho, execucoesDoFluxo, obterFluxo, type Passo } from '@/server/fluxos';
import { exigirCtx, ouNaoEncontrado } from '@/server/sessao';

export const metadata = { title: 'Fluxo de automação' };

const TIPOS: [string, string][] = [['', '— vazio —'], ['esperar', 'Esperar'], ['parar_se', 'Parar o fluxo se…'], ['se', 'Se… ir para o passo'], ['ir_para', 'Ir para o passo'], ['enviar_whatsapp', 'Enviar WhatsApp'], ['criar_tarefa', 'Criar tarefa'], ['avisar_equipe', 'Avisar a equipe'], ['anotar', 'Anotar no histórico'], ['atribuir', 'Atribuir responsável'], ['mover_etapa', 'Mover para a etapa']];

/** A step as the editor's fields: quantity + unit for waits, text for messages and tasks. */
function linha(p: Passo | undefined) {
  const v = { tipo: '', qtd: '', unidade: 'h', condicao: 'cliente_respondeu', texto: '', modelo: '', etapa: 'atendimento', pessoa: '', soVazio: 'sim' };
  if (!p) return v;
  v.tipo = p.tipo;
  if (p.tipo === 'esperar') { const dia = p.minutos > 0 && p.minutos % 1440 === 0; const h = p.minutos > 0 && p.minutos % 60 === 0; v.unidade = dia ? 'dia' : h ? 'h' : 'min'; v.qtd = String(dia ? p.minutos / 1440 : h ? p.minutos / 60 : p.minutos); }
  if (p.tipo === 'parar_se') v.condicao = p.condicao;
  if (p.tipo === 'se') { v.condicao = p.condicao; v.qtd = String(p.ir_para); }
  if (p.tipo === 'ir_para') v.qtd = String(p.passo);
  if (p.tipo === 'enviar_whatsapp') { v.texto = p.texto; v.modelo = p.modelo; }
  if (p.tipo === 'criar_tarefa') { v.texto = p.titulo; v.qtd = String(p.prazo_horas); }
  if (p.tipo === 'avisar_equipe') v.texto = p.titulo;
  if (p.tipo === 'anotar') v.texto = p.texto;
  if (p.tipo === 'atribuir') { v.pessoa = p.modo === 'pessoa' ? p.user_id : ''; v.soVazio = p.so_sem_responsavel ? 'sim' : 'nao'; }
  if (p.tipo === 'mover_etapa') v.etapa = p.etapa;
  return v;
}

// The rows' key changes after every save so they remount with what was saved (React clears uncontrolled fields after a form action).
const ESTADO: Record<string, [string, string]> = { ativa: ['Rodando', 'etiqueta-azul'], concluida: ['Concluída', 'etiqueta-ok'], parada: ['Parada', ''], falhou: ['Falhou', 'etiqueta-erro'] };

export default async function EditorDeFluxo({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel');
  const { id } = await params;
  const f = await ouNaoEncontrado(obterFluxo(ctx, id));
  const [exec, pessoas] = await Promise.all([execucoesDoFluxo(ctx, id), equipe(ctx)]);
  const linhas = [...f.passos.map(linha), ...Array.from({ length: Math.max(0, Math.min(3, 12 - f.passos.length)) }, () => linha(undefined))];
  return (
    <div className="max-w-4xl space-y-4">
      <p className="text-sm"><Link className="underline" href="/painel/automacoes">← Automações</Link></p>
      <h1 className="text-2xl font-bold">{f.nome}</h1>
      <p className="text-[15px] text-suave">{descreverGatilho(f.gatilho)}. Cada execução segue os passos de cima para baixo. Mudar o fluxo não altera as execuções que já começaram.</p>

      <details className="cartao p-4" open>
        <summary className="cursor-pointer font-bold text-tinta">Desenho do fluxo (como está salvo)</summary>
        <div className="mt-4"><DiagramaFluxo gatilho={f.gatilho} passos={f.passos} /></div>
      </details>

      <Formulario acao={salvarFluxoAcao} className="space-y-4">
        <input type="hidden" name="id" value={f.id} />
        <section className="cartao grid gap-4 p-4 sm:grid-cols-2" aria-labelledby="t-geral">
          <h2 id="t-geral" className="font-bold sm:col-span-2">Quando começa</h2>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="nome">Nome do fluxo</label><input className="campo" id="nome" name="nome" defaultValue={f.nome} required maxLength={80} /></div>
          <div><label className="rotulo" htmlFor="gatilho">Gatilho</label><select className="campo" id="gatilho" name="gatilho" defaultValue={f.gatilho.tipo}>{GATILHOS.map((g) => <option key={g} value={g}>{NOME_GATILHO[g]}</option>)}</select></div>
          <div><label className="rotulo" htmlFor="etapa">Etapa (só para o gatilho de etapa)</label><select className="campo" id="etapa" name="etapa" defaultValue={f.gatilho.etapa ?? 'proposta'}>{ETAPAS.map((e) => <option key={e} value={e}>{NOME_ETAPA[e]}</option>)}</select></div>
          <div><label className="rotulo" htmlFor="dias">Dias sem interação (só para o gatilho de oportunidade parada)</label><input className="campo" id="dias" name="dias" inputMode="numeric" defaultValue={f.gatilho.dias ?? 7} /></div>
          <div className="sm:col-span-2"><label className="rotulo" htmlFor="palavra">Palavra-chave (só para o gatilho de mensagem; em branco = qualquer mensagem)</label><input className="campo" id="palavra" name="palavra" defaultValue={f.gatilho.palavra ?? ''} maxLength={40} placeholder="visita" /></div>
          <label className="flex min-h-11 items-start gap-3 text-[15px] sm:col-span-2"><input type="checkbox" name="ativo" defaultChecked={f.ativo} className="mt-1 h-5 w-5 accent-[#175cd3]" /><span><span className="font-semibold text-tinta">Fluxo ligado</span><span className="block text-sm text-suave">Desligado, não começa em nenhuma oportunidade nova e para as que estão rodando.</span></span></label>
        </section>

        <section className="cartao p-4" aria-labelledby="t-passos">
          <h2 id="t-passos" className="font-bold">Passos</h2>
          <p className="mt-1 text-sm text-suave">Escolha o tipo e preencha só os campos daquele passo. Linhas vazias são ignoradas. No texto, <code>{'{{nome}}'}</code> vira o primeiro nome do cliente e <code>{'{{empresa}}'}</code> o nome da empresa. Toda mensagem termina com o aviso de como parar (responder SAIR).</p>
          <ol className="mt-3 space-y-3">
            {linhas.map((l, i) => (
              <li key={`${i}-${f.atualizado_em.getTime()}`} className="rounded-lg border border-linha p-3">
                <div className="grid gap-3 sm:grid-cols-6">
                  <div className="sm:col-span-2"><label className="rotulo" htmlFor={`t${i}`}>{i + 1}. Tipo</label><select className="campo" id={`t${i}`} name="passo_tipo" defaultValue={l.tipo}>{TIPOS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
                  <div><label className="rotulo" htmlFor={`q${i}`}>Quantidade</label><input className="campo" id={`q${i}`} name="passo_qtd" inputMode="numeric" defaultValue={l.qtd} placeholder="2" /></div>
                  <div><label className="rotulo" htmlFor={`u${i}`}>Unidade</label><select className="campo" id={`u${i}`} name="passo_unidade" defaultValue={l.unidade}><option value="min">minutos</option><option value="h">horas</option><option value="dia">dias</option></select></div>
                  <div className="sm:col-span-2"><label className="rotulo" htmlFor={`c${i}`}>Condição</label><select className="campo" id={`c${i}`} name="passo_condicao" defaultValue={l.condicao}>{CONDICOES.map((c) => <option key={c} value={c}>{NOME_CONDICAO[c]}</option>)}</select></div>
                  <div className="sm:col-span-4"><label className="rotulo" htmlFor={`x${i}`}>Mensagem, título da tarefa, aviso ou anotação</label><input className="campo" id={`x${i}`} name="passo_texto" defaultValue={l.texto} maxLength={600} /></div>
                  <div className="sm:col-span-2"><label className="rotulo" htmlFor={`m${i}`}>Modelo aprovado do WhatsApp (opcional)</label><input className="campo" id={`m${i}`} name="passo_modelo" defaultValue={l.modelo} /></div>
                  <div className="sm:col-span-2"><label className="rotulo" htmlFor={`e${i}`}>Etapa (para “Mover”)</label><select className="campo" id={`e${i}`} name="passo_etapa" defaultValue={l.etapa}>{ETAPAS_MOVIVEIS.map((e) => <option key={e} value={e}>{NOME_ETAPA[e]}</option>)}</select></div>
                  <div className="sm:col-span-2"><label className="rotulo" htmlFor={`p${i}`}>Atribuir a (para “Atribuir”)</label><select className="campo" id={`p${i}`} name="passo_pessoa" defaultValue={l.pessoa}><option value="">Vendedor com menos oportunidades abertas</option>{pessoas.filter((p) => p.ativo).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}</select></div>
                  <div className="sm:col-span-2"><label className="rotulo" htmlFor={`v${i}`}>Se já tiver responsável (para “Atribuir”)</label><select className="campo" id={`v${i}`} name="passo_so_vazio" defaultValue={l.soVazio}><option value="sim">Manter quem já está</option><option value="nao">Trocar mesmo assim</option></select></div>
                </div>
                {l.tipo && <p className="mt-2 text-[13px] text-suave">Passo atual: {l.tipo.replace(/_/g, ' ')}.</p>}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-suave">Na quantidade: horas de prazo, para tarefa; número da linha de destino, para “Se…” e “Ir para” (0 = terminar o fluxo; só dá para ir para uma linha mais abaixo). Mensagens só saem para quem autorizou o WhatsApp, dentro do horário da empresa e sem uma pessoa na conversa. Fora das 24 horas da última mensagem do cliente, só com modelo aprovado: sem modelo, vira tarefa para uma pessoa. Nenhum passo marca venda como ganha ou perdida. Mudar a etapa por fluxo não conta como atendimento e não começa outros fluxos.</p>
          <div className="mt-4"><Enviar>Salvar fluxo</Enviar></div>
        </section>
      </Formulario>

      <section className="cartao p-4" aria-labelledby="t-hist">
        <h2 id="t-hist" className="font-bold">Execuções ({exec.length})</h2>
        {exec.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nenhuma execução ainda. Ligue o fluxo e provoque o gatilho em uma oportunidade.</p> : (
          <ul className="mt-2 divide-y divide-linha">
            {exec.map((e) => {
              const [nome, cor] = ESTADO[e.estado] ?? [e.estado, ''];
              return (
                <li key={e.id} className="py-2.5 text-[15px]">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2"><span><Link className="font-semibold underline" href={`/painel/oportunidades/${e.oportunidade_id}`}>{e.contato || 'Contato'}</Link> <span className="text-[13px] text-suave">· começou {dataHora(e.criado_em)}</span></span><span className={`etiqueta ${cor}`}>{nome}</span></summary>
                    <ol className="mt-2 space-y-1 border-l-2 border-linha pl-3 text-sm">{e.log.length === 0 ? <li className="text-suave">Ainda sem passos executados.</li> : e.log.map((l, i) => <li key={i}><span className="font-semibold text-tinta">Passo {l.passo + 1} · {l.tipo.replace(/_/g, ' ')}</span>: {l.resultado} <span className="text-suave">({dataHora(l.em)})</span></li>)}</ol>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <details className="cartao p-4">
        <summary className="cursor-pointer font-bold text-tinta">Excluir este fluxo</summary>
        <Formulario acao={excluirFluxoAcao} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={f.id} />
          <p className="text-sm">As execuções em andamento terminam sem rodar os próximos passos. O histórico dessas execuções é apagado junto.</p>
          <Enviar secundario>Excluir fluxo</Enviar>
        </Formulario>
      </details>
    </div>
  );
}
