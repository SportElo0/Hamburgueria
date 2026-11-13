import { cancelarPropostaAcao, criarPropostaAcao, enviarPropostaAcao } from '@/app/acoes';
import { dataHora, reais } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import type { Proposta } from '@/server/propostas';

const ESTADO: Record<Proposta['estado'], [string, string]> = {
  rascunho: ['Rascunho', ''],
  enviada: ['Enviada', 'etiqueta-alerta'],
  aceita: ['Aceita pelo cliente', 'etiqueta-ok'],
  recusada: ['Recusada', 'etiqueta-erro'],
  cancelada: ['Cancelada', ''],
};

/** Proposals of one opportunity: list, send the link, cancel, and write a new one. */
export function SecaoPropostas({ oportunidadeId, propostas, fechada }: { oportunidadeId: string; propostas: Proposta[]; fechada: boolean }) {
  const dataBr = (iso: string) => iso.split('-').reverse().join('/');
  return (
    <section className="cartao p-4" aria-labelledby="t-proposta">
      <h2 id="t-proposta" className="font-bold">Proposta online</h2>
      {propostas.length > 0 && (
        <ul className="mt-2 divide-y divide-linha">
          {propostas.map((p) => (
            <li key={p.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-tinta">Nº {p.numero} · {p.titulo}</p>
                  <p className="text-sm text-suave">
                    {reais(p.total_centavos)} · válida até {dataBr(p.validade)}{p.vencida && p.estado === 'enviada' ? ' (vencida)' : ''}
                    {p.vista_em ? ` · aberta ${p.visualizacoes}× (primeira em ${dataHora(p.vista_em)})` : p.estado === 'enviada' ? ' · ainda não aberta' : ''}
                  </p>
                  {p.estado === 'aceita' && <p className="text-sm text-ok">Aceita por “{p.aceite_nome}” em {dataHora(p.respondida_em!)}. Fechado o negócio, marque a oportunidade como ganha.</p>}
                  {p.estado === 'recusada' && <p className="text-sm text-suave">Recusada em {dataHora(p.respondida_em!)}{p.motivo_recusa ? `: “${p.motivo_recusa}”` : ''}</p>}
                </div>
                <span className={`etiqueta ${ESTADO[p.estado][1]}`}>{ESTADO[p.estado][0]}</span>
              </div>
              {(p.estado === 'rascunho' || p.estado === 'enviada') && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Formulario acao={enviarPropostaAcao}><input type="hidden" name="id" value={p.id} /><Enviar secundario className="min-h-9 px-3 py-1 text-sm">{p.estado === 'rascunho' ? 'Gerar link para o cliente' : 'Gerar link novo'}</Enviar></Formulario>
                  <Formulario acao={cancelarPropostaAcao}><input type="hidden" name="id" value={p.id} /><Enviar secundario className="min-h-9 px-3 py-1 text-sm">Cancelar</Enviar></Formulario>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!fechada && (
        <details className="mt-3" open={propostas.length === 0}>
          <summary className="cursor-pointer font-semibold text-marca-escura">Nova proposta</summary>
          <Formulario acao={criarPropostaAcao} limpar className="mt-3 grid gap-3">
            <input type="hidden" name="oportunidade" value={oportunidadeId} />
            <div><label className="rotulo" htmlFor="pr-titulo">Título</label><input className="campo" id="pr-titulo" name="titulo" required maxLength={120} placeholder="Sistema de 4,4 kWp com instalação" /></div>
            <div><label className="rotulo" htmlFor="pr-itens">Itens (um por linha: descrição | quantidade | valor unitário)</label><textarea className="campo font-mono text-[14px]" id="pr-itens" name="itens" rows={4} required placeholder={'Painel 550 W | 8 | 1.100,00\nInversor 5 kW | 1 | 4.800,00\nInstalação e projeto | 1 | 3.500,00'} /></div>
            <div><label className="rotulo" htmlFor="pr-cond">Condições (pagamento, prazo, garantia)</label><textarea className="campo" id="pr-cond" name="condicoes" rows={3} maxLength={3000} /></div>
            <div className="max-w-48"><label className="rotulo" htmlFor="pr-val">Válida por (dias)</label><input className="campo" id="pr-val" name="validade" type="number" min={1} max={180} defaultValue={15} required /></div>
            <p className="text-sm text-suave">Os valores e condições são da empresa: confira antes de mandar. O cliente vê a proposta pelo link, aceita digitando o nome ou recusa; o aceite não marca a venda como ganha.</p>
            <div><Enviar>Salvar proposta</Enviar></div>
          </Formulario>
        </details>
      )}
    </section>
  );
}
