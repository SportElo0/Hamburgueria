import Link from 'next/link';
import { anotarAcao, atribuirAcao, concluirTarefaAcao, excluirContatoAcao, linkAvaliacaoAcao, mudarEtapaAcao, proximaAcaoAcao, servicoConcluidoAcao, valorAcao } from '@/app/acoes';
import { NOME_EVENTO, ORIGENS, dataHora, paraCampoData, reais } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { EtiquetaEstado, EtiquetaEtapa } from '@/componentes/pedacos';
import { ETAPAS, NOME_ETAPA, formatarTelefone, type Etapa } from '@/server/config';
import { conversasDoContato } from '@/server/conversas';
import { empresaPorId, equipe } from '@/server/empresas';
import { contatoDe, historico, obter, tarefas } from '@/server/oportunidades';
import { exigirCtx, ouNaoEncontrado } from '@/server/sessao';

export const metadata = { title: 'Oportunidade' };

function detalheEvento(tipo: string, d: Record<string, unknown>, nomes: Map<string, string>): string {
  if (tipo === 'etapa_alterada') return `${NOME_ETAPA[d.de as Etapa] ?? d.de} → ${NOME_ETAPA[d.para as Etapa] ?? d.para}${d.motivo ? ` · motivo: ${d.motivo}` : ''}${d.valor_centavos != null ? ` · ${reais(d.valor_centavos as number)}` : ''}`;
  if (tipo === 'responsavel_alterado') return `${nomes.get(String(d.de)) ?? 'Fila'} → ${nomes.get(String(d.para)) ?? 'Fila'}`;
  if (tipo === 'anotacao' || tipo === 'proxima_acao_definida') return String(d.texto ?? '');
  if (tipo === 'valor_informado') return reais((d.valor_centavos as number) ?? null);
  if (tipo === 'conversa_encaminhada') return `Motivo: ${String(d.motivo ?? '').replace(/_/g, ' ')}`;
  if (tipo === 'interesse_visita') return String(d.preferencia ?? '');
  if (tipo === 'acesso_admin_growlift') return `Motivo: ${d.motivo}`;
  if (tipo === 'pedido_recebido') return `Origem: ${ORIGENS[String(d.origem)] ?? d.origem}`;
  return '';
}

export default async function Detalhe({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await exigirCtx();
  const { id } = await params;
  const o = await ouNaoEncontrado(obter(ctx, id));
  const [contato, eventos, pessoas, abertas, conversas, empresa] = await Promise.all([contatoDe(ctx, o.contato_id), historico(ctx, id), equipe(ctx), tarefas(ctx, { oportunidadeId: id }), conversasDoContato(ctx, o.contato_id), empresaPorId(ctx.empresaId)]);
  const nomes = new Map(pessoas.map((p) => [p.user_id, p.nome]));
  const fechada = o.etapa === 'ganho' || o.etapa === 'perdido';
  const rotulos = new Map(empresa!.config.campos.map((c) => [c.id, c.rotulo]));
  return (
    <div className="space-y-4">
      <p className="text-sm"><Link className="underline" href="/painel/oportunidades">← Oportunidades</Link></p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{o.contato_nome || 'Contato sem nome'}</h1>
        <EtiquetaEtapa etapa={o.etapa} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="cartao p-4" aria-labelledby="t-contato">
            <h2 id="t-contato" className="font-bold">Contato e necessidade</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
              <div><dt className="text-sm text-suave">Telefone</dt><dd><a className="font-semibold text-marca-escura underline" href={`tel:+${o.contato_telefone}`}>{formatarTelefone(o.contato_telefone)}</a></dd></div>
              <div><dt className="text-sm text-suave">Cidade</dt><dd>{o.contato_cidade || '—'}</dd></div>
              <div><dt className="text-sm text-suave">Prefere contato por</dt><dd>{contato?.preferencia_contato || '—'}</dd></div>
              <div><dt className="text-sm text-suave">Origem</dt><dd>{ORIGENS[o.origem] ?? o.origem}{Object.keys(o.campanha).length ? ` · ${Object.entries(o.campanha).map(([k, v]) => `${k}=${v}`).join(', ')}` : ''}</dd></div>
              {Object.entries(contato?.dados ?? {}).map(([k, v]) => <div key={k}><dt className="text-sm text-suave">{rotulos.get(k) ?? k}</dt><dd>{String(v)}</dd></div>)}
              <div><dt className="text-sm text-suave">Entrada</dt><dd>{dataHora(o.entrada_em)}</dd></div>
              <div><dt className="text-sm text-suave">Última interação</dt><dd>{dataHora(o.ultima_interacao_em)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-sm text-suave">Necessidade</dt><dd className="whitespace-pre-wrap">{o.necessidade || 'Ainda não informada.'}</dd></div>
              {o.interesse_visita && <div className="sm:col-span-2"><dt className="text-sm text-suave">Interesse em visita (a confirmar pela equipe)</dt><dd>{o.interesse_visita}</dd></div>}
            </dl>
            <div className="mt-3 border-t border-linha pt-3 text-sm">
              {contato?.nao_contatar_em ? (
                <p className="aviso bg-erro-clara text-erro">Este contato pediu para não receber mensagens em {dataHora(contato.nao_contatar_em)}. Envios automáticos estão bloqueados.</p>
              ) : contato?.consentimentos.some((c) => c.canal === 'whatsapp' && !c.revogado_em) ? (
                <details><summary className="cursor-pointer font-semibold text-ok">Autorizou contato pelo WhatsApp</summary>
                  {contato.consentimentos.map((c, i) => <p key={i} className="mt-1 text-suave">{dataHora(c.criado_em)} · origem: {ORIGENS[c.origem] ?? c.origem} · “{c.texto}”</p>)}
                </details>
              ) : (
                <p className="text-suave">Sem autorização registrada para mensagens pelo WhatsApp: envios automáticos não são feitos.</p>
              )}
            </div>
          </section>

          <section className="cartao p-4" aria-labelledby="t-conv">
            <h2 id="t-conv" className="font-bold">Conversas</h2>
            {conversas.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nenhuma conversa com este contato ainda.</p> : (
              <ul className="mt-2 divide-y divide-linha">
                {conversas.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link className="font-semibold text-marca-escura underline" href={`/painel/atendimento/${v.id}`}>{v.canal === 'whatsapp' ? 'WhatsApp' : 'Chat do site'} · {dataHora(v.atualizado_em)}</Link>
                    <EtiquetaEstado estado={v.estado} />
                    {v.resumo && <p className="w-full text-sm text-suave">Resumo da assistente: {v.resumo}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cartao p-4" aria-labelledby="t-nota">
            <h2 id="t-nota" className="font-bold">Anotações e histórico</h2>
            <Formulario acao={anotarAcao} limpar className="mt-3">
              <input type="hidden" name="id" value={id} />
              <label className="rotulo" htmlFor="texto">Nova anotação</label>
              <textarea className="campo" id="texto" name="texto" rows={2} required />
              <Enviar secundario className="mt-2">Salvar anotação</Enviar>
            </Formulario>
            <ol className="mt-4 space-y-3 border-l-2 border-linha pl-4">
              {eventos.map((e) => (
                <li key={e.id} className="text-[15px]">
                  <p className="font-semibold text-tinta">{NOME_EVENTO[e.tipo] ?? e.tipo}</p>
                  {detalheEvento(e.tipo, e.dados, nomes) && <p className="whitespace-pre-wrap">{detalheEvento(e.tipo, e.dados, nomes)}</p>}
                  <p className="text-[13px] text-suave">{dataHora(e.criado_em)} · {e.ator_tipo === 'usuario' ? e.ator_nome ?? 'Usuário' : e.ator_tipo === 'admin_growlift' ? `Equipe Growlift (${e.ator_nome ?? ''})` : e.ator_tipo === 'ia' ? 'Assistente virtual' : e.ator_tipo === 'visitante' ? 'Cliente' : 'Sistema'}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-4">
          <section className="cartao p-4" aria-labelledby="t-etapa">
            <h2 id="t-etapa" className="font-bold">Etapa</h2>
            <Formulario acao={mudarEtapaAcao} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <div>
                <label className="rotulo" htmlFor="etapa">Mover para</label>
                <select className="campo" id="etapa" name="etapa" defaultValue={o.etapa}>
                  {ETAPAS.map((e) => <option key={e} value={e}>{NOME_ETAPA[e]}</option>)}
                </select>
              </div>
              <div>
                <label className="rotulo" htmlFor="motivo">Motivo da perda (só se for “Perdido”)</label>
                <input className="campo" id="motivo" name="motivo" defaultValue={o.motivo_perda} />
              </div>
              <Enviar>Salvar etapa</Enviar>
              {fechada && ctx.papel !== 'admin' && <p className="text-sm text-suave">Encerrada: só o administrador reabre.</p>}
              <p className="text-[13px] text-suave">Ganho e perda são sempre registrados por uma pessoa. A assistente não fecha vendas.</p>
            </Formulario>
          </section>

          <section className="cartao p-4" aria-labelledby="t-resp">
            <h2 id="t-resp" className="font-bold">Responsável</h2>
            <Formulario acao={atribuirAcao} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <label className="sr-only" htmlFor="responsavel">Responsável</label>
              <select className="campo" id="responsavel" name="responsavel" defaultValue={o.responsavel_id ?? ''}>
                <option value="">Fila sem responsável</option>
                {pessoas.filter((p) => p.ativo).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}
              </select>
              <Enviar secundario>Salvar responsável</Enviar>
            </Formulario>
          </section>

          <section className="cartao p-4" aria-labelledby="t-prox">
            <h2 id="t-prox" className="font-bold">Próxima ação</h2>
            <Formulario acao={proximaAcaoAcao} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <div><label className="rotulo" htmlFor="ptexto">O que fazer</label><input className="campo" id="ptexto" name="texto" defaultValue={o.proxima_acao} placeholder="Ex.: ligar para confirmar a visita" /></div>
              <div><label className="rotulo" htmlFor="quando">Prazo</label><input className="campo" id="quando" name="quando" type="datetime-local" defaultValue={paraCampoData(o.proxima_acao_em)} /></div>
              <Enviar secundario>Salvar próxima ação</Enviar>
            </Formulario>
            {abertas.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-linha pt-3">
                {abertas.map((t) => (
                  <li key={t.id} className="text-[15px]">
                    <Formulario acao={concluirTarefaAcao} className="flex items-start justify-between gap-2">
                      <input type="hidden" name="id" value={t.id} />
                      <span><span className="font-semibold text-tinta">{t.titulo}</span><span className={`block text-[13px] ${t.prazo && t.prazo < new Date() ? 'text-erro' : 'text-suave'}`}>Prazo: {dataHora(t.prazo)}</span></span>
                      <Enviar secundario className="min-h-9 px-2 py-1 text-sm">Concluir</Enviar>
                    </Formulario>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cartao p-4" aria-labelledby="t-valor">
            <h2 id="t-valor" className="font-bold">Valor da proposta</h2>
            <Formulario acao={valorAcao} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <label className="rotulo" htmlFor="valor">Valor em reais (informado por você)</label>
              <input className="campo" id="valor" name="valor" inputMode="decimal" defaultValue={o.valor_proposta_centavos != null ? (Number(o.valor_proposta_centavos) / 100).toFixed(2).replace('.', ',') : ''} placeholder="18.500,00" />
              <Enviar secundario>Salvar valor</Enviar>
            </Formulario>
          </section>

          {o.etapa === 'ganho' && (
            <section className="cartao p-4" aria-labelledby="t-serv">
              <h2 id="t-serv" className="font-bold">Serviço e avaliação</h2>
              {o.servico_concluido_em ? (
                <>
                  <p className="mt-2 text-[15px]">Serviço concluído em {dataHora(o.servico_concluido_em)}.</p>
                  <Formulario acao={linkAvaliacaoAcao} className="mt-3">
                    <input type="hidden" name="id" value={id} />
                    <Enviar secundario>Gerar link do convite de avaliação</Enviar>
                    <p className="mt-2 text-[13px] text-suave">O convite é o mesmo para todos os clientes, sem recompensa, e sempre mostra o link público de avaliação.</p>
                  </Formulario>
                </>
              ) : (
                <Formulario acao={servicoConcluidoAcao} className="mt-3">
                  <input type="hidden" name="id" value={id} />
                  <Enviar secundario>Marcar serviço como concluído</Enviar>
                </Formulario>
              )}
            </section>
          )}

          {ctx.papel === 'admin' && (
            <details className="cartao p-4">
              <summary className="cursor-pointer font-bold text-tinta">Excluir este contato</summary>
              <Formulario acao={excluirContatoAcao} className="mt-3 space-y-3">
                <input type="hidden" name="contato" value={o.contato_id} />
                <p className="text-sm">Apaga o contato, as oportunidades, conversas e tarefas dele. Não dá para desfazer.</p>
                <label className="rotulo" htmlFor="confirmar">Escreva EXCLUIR para confirmar</label>
                <input className="campo" id="confirmar" name="confirmar" autoComplete="off" />
                <Enviar secundario>Excluir definitivamente</Enviar>
              </Formulario>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
