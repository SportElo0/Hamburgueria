import Link from 'next/link';
import { assumirAcao, devolverAcao, encerrarAcao, enviarMensagemAcao, simularWhatsAppAcao } from '@/app/acoes';
import { Atualizar } from '@/componentes/atualizar';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { ESTADO_MENSAGEM, EtiquetaEstado } from '@/componentes/pedacos';
import { formatarTelefone } from '@/server/config';
import { mensagensDe, naJanelaWhatsApp, obterConversa } from '@/server/conversas';
import { canalDa } from '@/server/integracoes';
import { exigirCtx, ouNaoEncontrado } from '@/server/sessao';

export const metadata = { title: 'Conversa' };

export default async function ConversaPagina({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await exigirCtx();
  const { id } = await params;
  const v = await ouNaoEncontrado(obterConversa(ctx, id));
  const [ms, { canal }] = await Promise.all([mensagensDe(ctx.empresaId, id), canalDa(ctx.empresaId)]);
  const zap = v.canal === 'whatsapp';
  const foraDaJanela = zap && !naJanelaWhatsApp(v.ultima_entrada_em);
  const bloqueado = zap && !!v.nao_contatar_em && !(v.ultima_entrada_em && v.ultima_entrada_em > v.nao_contatar_em);
  const coletado = Object.entries(v.dados).filter(([k]) => !k.startsWith('_'));
  return (
    <div className="space-y-4">
      <Atualizar segundos={5} />
      <p className="text-sm"><Link className="underline" href="/painel/atendimento">← Atendimento</Link></p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{v.contato_nome || (v.contato_telefone ? formatarTelefone(v.contato_telefone) : 'Visitante do site')}</h1>
        <span className="flex items-center gap-2"><span className="etiqueta">{zap ? 'WhatsApp' : 'Chat do site'}</span><EtiquetaEstado estado={v.estado} /></span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="cartao flex flex-col p-4 lg:col-span-2" aria-label="Mensagens">
          {zap && canal?.simulado && <p className="aviso mb-3 bg-alerta-clara text-alerta">Simulação — nenhuma mensagem externa enviada. O WhatsApp oficial ainda não está ligado para esta empresa.</p>}
          <ol className="space-y-3">
            {ms.length === 0 && <li className="text-suave">Sem mensagens.</li>}
            {ms.map((m) => {
              const entrada = m.direcao === 'entrada';
              const quem = entrada ? 'Cliente' : m.autor === 'humano' ? m.autor_nome ?? 'Equipe' : m.autor === 'ia' ? `Assistente virtual${m.ia_simulada ? ' (simulada)' : ''}` : 'Mensagem automática';
              const ruim = m.estado === 'falhou' || m.estado === 'incerta' || m.estado === 'cancelada';
              return (
                <li key={m.id} className={`flex ${entrada ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] ${entrada ? 'bg-[#eef1f5] text-tinta' : m.autor === 'humano' ? 'bg-marca text-white' : 'border border-marca/30 bg-marca-clara text-tinta'} ${m.estado === 'cancelada' ? 'opacity-60' : ''}`}>
                    <p className="whitespace-pre-wrap break-words">{m.corpo}</p>
                    <p className={`mt-1 text-[12.5px] ${!entrada && m.autor === 'humano' ? 'text-white/80' : 'text-suave'}`}>
                      {quem} · {dataHora(m.criado_em)}
                      {!entrada && ESTADO_MENSAGEM[m.estado] ? <> · <span className={ruim ? 'font-bold' : ''}>{ESTADO_MENSAGEM[m.estado]}{m.simulada ? ' (simulação)' : ''}</span></> : null}
                    </p>
                    {m.erro && <p className={`mt-1 text-[12.5px] ${!entrada && m.autor === 'humano' ? 'text-white' : 'text-erro'}`}>{m.erro}</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 border-t border-linha pt-4">
            {bloqueado ? (
              <p className="aviso bg-erro-clara text-erro">Este contato pediu para não receber mensagens. Só dá para responder se ele escrever de novo.</p>
            ) : foraDaJanela ? (
              <p className="aviso bg-alerta-clara text-alerta">Passaram mais de 24 horas desde a última mensagem do cliente. O WhatsApp só aceita texto livre dentro desse prazo: ligue, ou aguarde o cliente escrever.</p>
            ) : (
              <Formulario acao={enviarMensagemAcao} limpar>
                <input type="hidden" name="id" value={id} />
                <label className="rotulo" htmlFor="texto">Responder como {ctx.nome}</label>
                <textarea className="campo" id="texto" name="texto" rows={3} required maxLength={2000} />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Enviar>{v.estado === 'humano_atendendo' ? 'Enviar' : 'Assumir e enviar'}</Enviar>
                  {v.estado !== 'humano_atendendo' && <span className="text-sm text-suave">Ao enviar, você assume a conversa e a assistente para de responder.</span>}
                </div>
              </Formulario>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="cartao p-4" aria-labelledby="t-quem">
            <h2 id="t-quem" className="font-bold">Quem está atendendo</h2>
            <p className="mt-2 text-[15px]">
              {v.estado === 'ia_ativa' && 'A assistente virtual está respondendo.'}
              {v.estado === 'aguardando_humano' && 'A assistente parou e está aguardando uma pessoa da equipe.'}
              {v.estado === 'humano_atendendo' && <>Assumida por <strong>{v.assumida_nome ?? 'alguém da equipe'}</strong> em {dataHora(v.assumida_em)}.</>}
              {v.estado === 'encerrada' && 'Conversa encerrada. Se o cliente escrever, ela reabre com a assistente.'}
            </p>
            <div className="mt-3 space-y-2">
              {v.estado !== 'humano_atendendo' && (
                <Formulario acao={assumirAcao}><input type="hidden" name="id" value={id} /><Enviar className="w-full">Assumir conversa</Enviar></Formulario>
              )}
              {(v.estado === 'humano_atendendo' || v.estado === 'aguardando_humano') && (
                <Formulario acao={devolverAcao}><input type="hidden" name="id" value={id} /><Enviar secundario className="w-full">Devolver para a assistente</Enviar></Formulario>
              )}
              {v.estado !== 'encerrada' && (
                <Formulario acao={encerrarAcao}><input type="hidden" name="id" value={id} /><Enviar secundario className="w-full">Encerrar conversa</Enviar></Formulario>
              )}
            </div>
            <p className="mt-3 text-[13px] text-suave">A assistente só volta a responder se alguém devolver a conversa. Ficar sem responder não a reativa.</p>
          </section>

          {v.resumo && (
            <section className="cartao p-4"><h2 className="font-bold">Resumo da assistente</h2><p className="mt-2 whitespace-pre-wrap text-[15px]">{v.resumo}</p></section>
          )}

          <section className="cartao p-4" aria-labelledby="t-dados">
            <h2 id="t-dados" className="font-bold">Dados informados na conversa</h2>
            {coletado.length === 0 ? <p className="mt-2 text-[15px] text-suave">Nada ainda.</p> : (
              <dl className="mt-2 space-y-1 text-[15px]">{coletado.map(([k, val]) => <div key={k} className="flex justify-between gap-3"><dt className="text-suave">{k.replace(/_/g, ' ')}</dt><dd className="text-right font-medium text-tinta">{k === 'telefone' ? formatarTelefone(String(val)) : String(val)}</dd></div>)}</dl>
            )}
            {v.oportunidade_id && <p className="mt-3"><Link className="font-semibold text-marca-escura underline" href={`/painel/oportunidades/${v.oportunidade_id}`}>Abrir a oportunidade</Link></p>}
          </section>

          {zap && canal?.simulado && v.contato_telefone && (
            <details className="cartao p-4">
              <summary className="cursor-pointer font-bold text-tinta">Simular resposta do cliente</summary>
              <Formulario acao={simularWhatsAppAcao} limpar className="mt-3 space-y-3">
                <input type="hidden" name="telefone" value={v.contato_telefone} />
                <input type="hidden" name="nome" value={v.contato_nome ?? ''} />
                <label className="rotulo" htmlFor="sim">Mensagem do cliente (simulação)</label>
                <input className="campo" id="sim" name="texto" required />
                <Enviar secundario>Simular</Enviar>
              </Formulario>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
