import Link from 'next/link';
import { marcarVisitaAcao, anotarAcao, atribuirAcao, concluirTarefaAcao, excluirContatoAcao, linkAvaliacaoAcao, mudarEtapaAcao, proximaAcaoAcao, servicoConcluidoAcao, valorAcao } from '@/app/acoes';
import { NOME_EVENTO, ORIGENS, dataHora, paraCampoData, reais } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { EtiquetaEstado, EtiquetaEtapa } from '@/componentes/pedacos';
import { ETAPAS, NOME_ETAPA, formatarTelefone, type Etapa } from '@/server/config';
import { conversasDoContato } from '@/server/conversas';
import { empresaPorId, equipe } from '@/server/empresas';
import { contatoDe, historico, obter, tarefas } from '@/server/oportunidades';
import { exigirCtx, ouNaoEncontrado } from '@/server/sessao';
import { CartaoVisita } from '@/componentes/visita';
import { visitas } from '@/server/agenda';
import { SecaoPropostas } from '@/componentes/propostas';
import { propostasDa } from '@/server/propostas';
import { EnviarModelo } from '@/componentes/enviar-modelo';
import { integracaoWhatsApp } from '@/server/integracoes';
import { naJanelaWhatsApp } from '@/server/conversas';
import { RELATOS, hojeEm, recebimentosDa } from '@/server/recebimentos';
import { recebimentoAcao, relatoAcao, removerRecebimentoAcao } from '@/app/acoes';

export const metadata = { title: 'Oportunidade' };

function detalheEvento(tipo: string, d: Record<string, unknown>, nomes: Map<string, string>): string {
  if (tipo === 'etapa_alterada') return `${NOME_ETAPA[d.de as Etapa] ?? d.de} → ${NOME_ETAPA[d.para as Etapa] ?? d.para}${d.motivo ? ` · motivo: ${d.motivo}` : ''}${d.valor_centavos != null ? ` · ${reais(d.valor_centavos as number)}` : ''}`;
  if (tipo === 'responsavel_alterado') return `${nomes.get(String(d.de)) ?? 'Fila'} → ${nomes.get(String(d.para)) ?? 'Fila'}`;
  if (tipo === 'anotacao' || tipo === 'proxima_acao_definida') return String(d.texto ?? '');
  if (tipo === 'valor_informado') return reais((d.valor_centavos as number) ?? null);
  if (tipo === 'conversa_encaminhada') return `Motivo: ${String(d.motivo ?? '').replace(/_/g, ' ')}`;
  if (tipo === 'interesse_visita') return String(d.preferencia ?? '');
  if (tipo === 'visita_marcada') return `${d.quando}${d.origem === 'ia' ? ' · pela assistente' : ''}`;
  if (tipo === 'visita_alterada') return `${d.estado === 'remarcada' ? `Remarcada para ${d.quando}` : String(d.estado ?? '')}`;
  if (tipo === 'acesso_admin_growlift') return `Motivo: ${d.motivo}`;
  if (tipo === 'pedido_recebido') return `Origem: ${ORIGENS[String(d.origem)] ?? d.origem}`;
  if (tipo === 'modelo_enviado') return `${d.titulo ?? d.modelo}${d.retomada ? ' · com retomada automática' : ''}`;
  if (tipo === 'recebimento_registrado' || tipo === 'recebimento_removido') return `${reais((d.valor_centavos as number) ?? null)} · ${String(d.recebido_em ?? '').split('-').reverse().join('/')}${d.descricao ? ` · ${d.descricao}` : ''}`;
  if (tipo === 'relato_retomada') return RELATOS[String(d.relato) as keyof typeof RELATOS] ?? '';
  return '';
}

export default async function Detalhe({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await exigirCtx();
  const { id } = await params;
  const o = await ouNaoEncontrado(obter(ctx, id));
  const [contato, eventos, pessoas, abertas, conversas, empresa] = await Promise.all([contatoDe(ctx, o.contato_id), historico(ctx, id), equipe(ctx), tarefas(ctx, { oportunidadeId: id }), conversasDoContato(ctx, o.contato_id), empresaPorId(ctx.empresaId)]);
  const vs = await visitas(ctx, new Date(0), new Date('2100-01-01'), id);
  const props = await propostasDa(ctx, id);
  const zap = await integracaoWhatsApp(ctx.empresaId);
  const conversaZap = conversas.find((v) => v.canal === 'whatsapp');
  const autorizou = !!contato?.consentimentos.some((c) => c.canal === 'whatsapp' && !c.revogado_em && c.origem !== 'ligacao' && c.origem !== 'agenda');
  const naJanela = naJanelaWhatsApp(conversaZap?.ultima_entrada_em ?? null);
  const recebidos = await recebimentosDa(ctx, id);
  const totalRecebido = recebidos.reduce((t, r) => t + r.valor_centavos, 0);
  const valorProposta = o.valor_proposta_centavos != null ? Number(o.valor_proposta_centavos) : null;
  const emAberto = valorProposta != null ? Math.max(0, valorProposta - totalRecebido) : null;
  const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  const fuso = empresa!.config.regras.fuso;
  const temVisitaAtiva = vs.some((v) => (v.estado === 'marcada' || v.estado === 'confirmada') && !v.passou);
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

          <section className="cartao p-4" aria-labelledby="t-modelo">
            <h2 id="t-modelo" className="font-bold">Enviar pelo WhatsApp</h2>
            <p className="mt-1 text-sm text-suave">Com um modelo aprovado pela Meta, a mensagem chega mesmo que o cliente nunca tenha escrito no WhatsApp (ex.: pediu orçamento pelo site e autorizou).</p>
            {contato?.nao_contatar_em ? (
              <p className="aviso mt-3 bg-erro-clara text-erro">Este contato pediu para não receber mensagens. Só dá para responder se ele escrever de novo.</p>
            ) : !autorizou && !naJanela ? (
              <p className="aviso mt-3 bg-alerta-clara text-alerta">Sem autorização de WhatsApp e sem mensagem dele nas últimas 24 horas: ligue para o cliente.</p>
            ) : zap.config.modelos_equipe.length === 0 ? (
              <p className="mt-3 text-[15px] text-suave">Nenhum modelo aprovado cadastrado. {ctx.papel === 'admin' ? <Link className="font-semibold text-marca-escura underline" href="/painel/configuracoes#modelos-equipe">Cadastrar em Configurações › WhatsApp</Link> : 'O administrador cadastra em Configurações › WhatsApp.'}</p>
            ) : (
              <EnviarModelo
                modelos={zap.config.modelos_equipe}
                oportunidadeId={id}
                contato={o.contato_nome ?? ''}
                empresa={empresa!.nome}
                podeSeguirRetomada={['novo', 'atendimento', 'qualificado'].includes(o.etapa)}
                avisoRetomada={conversaZap && conversaZap.estado !== 'ia_ativa' ? 'A conversa no WhatsApp está com uma pessoa da equipe: a retomada automática não sai enquanto for assim.' : null}
              />
            )}
          </section>

          <SecaoPropostas oportunidadeId={id} propostas={props} fechada={fechada} />

          <section className="cartao p-4" aria-labelledby="t-visita">
            <h2 id="t-visita" className="font-bold">Visita</h2>
            {vs.length > 0 && <ul className="divide-y divide-linha">{vs.map((v) => <CartaoVisita key={v.id} v={v} fuso={fuso} empresa={empresa!.nome} mostrarCliente={false} />)}</ul>}
            {!fechada && !temVisitaAtiva && (
              <Formulario acao={marcarVisitaAcao} limpar className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="oportunidade" value={id} />
                <div><label className="rotulo" htmlFor="v-inicio">Dia e horário</label><input className="campo" id="v-inicio" name="inicio" type="datetime-local" required /></div>
                <div><label className="rotulo" htmlFor="v-resp">Quem vai</label><select className="campo" id="v-resp" name="responsavel" defaultValue={o.responsavel_id ?? ''}><option value="">Responsável da oportunidade</option>{pessoas.filter((p) => p.ativo).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}</select></div>
                <div className="sm:col-span-2"><label className="rotulo" htmlFor="v-end">Endereço da visita</label><input className="campo" id="v-end" name="endereco" maxLength={300} autoComplete="off" /></div>
                <div className="sm:col-span-2"><label className="rotulo" htmlFor="v-obs">Observação (opcional)</label><input className="campo" id="v-obs" name="observacao" maxLength={500} /></div>
                <label className="flex items-start gap-3 text-[15px] sm:col-span-2"><input type="checkbox" name="lembrete" className="mt-0.5 h-5 w-5 shrink-0 accent-[#175cd3]" /><span>O cliente pediu o lembrete desta visita pelo WhatsApp <span className="block text-sm text-suave">Marque só se ele disse que quer: fica registrado com o seu nome. Sem isso, o lembrete só vai se ele autorizou no formulário.</span></span></label>
                <div className="sm:col-span-2"><Enviar secundario>Marcar visita</Enviar></div>
              </Formulario>
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

          <section className="cartao p-4" aria-labelledby="t-receb">
            <h2 id="t-receb" className="font-bold">Recebimentos</h2>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-[15px]">
              <div><dt className="text-sm text-suave">Recebido</dt><dd className="font-semibold text-tinta">{reais(totalRecebido)}</dd></div>
              <div><dt className="text-sm text-suave">Em aberto</dt><dd className="font-semibold text-tinta">{emAberto == null ? '—' : reais(emAberto)}</dd></div>
            </dl>
            {valorProposta == null && <p className="mt-1 text-[13px] text-suave">Informe o valor da proposta para ver quanto falta receber.</p>}
            {recebidos.length > 0 && (
              <ul className="mt-3 divide-y divide-linha border-t border-linha">
                {recebidos.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 py-2 text-[15px]">
                    <span><span className="font-semibold text-tinta">{reais(r.valor_centavos)}</span> · {dataBr(r.recebido_em)}{r.descricao ? ` · ${r.descricao}` : ''}<span className="block text-[13px] text-suave">Registrado por {r.criado_nome ?? 'alguém da equipe'}</span></span>
                    {(ctx.papel === 'admin' || r.criado_por === ctx.userId) && (
                      <Formulario acao={removerRecebimentoAcao}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="oportunidade" value={id} /><Enviar secundario className="min-h-9 px-2 py-1 text-sm">Remover</Enviar></Formulario>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {o.etapa !== 'perdido' && (
              <div className="mt-3 border-t border-linha pt-3">
                <h3 className="text-[15px] font-semibold text-tinta">Registrar um recebimento</h3>
                <Formulario acao={recebimentoAcao} limpar className="mt-2 space-y-3">
                  <input type="hidden" name="oportunidade" value={id} />
                  <div><label className="rotulo" htmlFor="rc-valor">Valor recebido (R$)</label><input className="campo" id="rc-valor" name="valor" inputMode="decimal" required placeholder={emAberto ? (emAberto / 100).toFixed(2).replace('.', ',') : '800,00'} /></div>
                  <div><label className="rotulo" htmlFor="rc-data">Data em que o dinheiro entrou</label><input className="campo" id="rc-data" name="data" type="date" required defaultValue={hojeEm(fuso)} max={hojeEm(fuso)} /></div>
                  <div><label className="rotulo" htmlFor="rc-desc">Descrição (opcional)</label><input className="campo" id="rc-desc" name="descricao" maxLength={80} list="rc-sugestoes" placeholder="Sinal" /><datalist id="rc-sugestoes"><option value="Sinal" /><option value="Saldo" /><option value="Pagamento integral" /><option value="Parcela" /></datalist></div>
                  <Enviar secundario>Registrar</Enviar>
                </Formulario>
              </div>
            )}
            {(recebidos.length > 0 || o.etapa === 'ganho') && (
              <Formulario acao={relatoAcao} className="mt-3 space-y-2 border-t border-linha pt-3">
                <input type="hidden" name="oportunidade" value={id} />
                <label className="rotulo" htmlFor="rc-relato">Como esta venda aconteceu?</label>
                <select className="campo" id="rc-relato" name="relato" defaultValue={o.retomada_relato ?? ''}>
                  {Object.entries(RELATOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Enviar secundario>Salvar</Enviar>
                <p className="text-[13px] text-suave">O sistema mostra se houve retomada antes do pagamento; só você sabe se foi ela que trouxe o cliente de volta.</p>
              </Formulario>
            )}
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
