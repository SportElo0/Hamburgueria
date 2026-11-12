import Link from 'next/link';
import { remarcarVisitaAcao, visitaAcao } from '@/app/acoes';
import { Enviar, Formulario } from '@/componentes/formulario';
import { NOME_ESTADO_VISITA, linkGoogle, paraCampoLocal, textoHorario, type VisitaLista } from '@/server/agenda';
import { formatarTelefone } from '@/server/config';

const COR: Record<string, string> = { marcada: 'etiqueta-alerta', confirmada: 'etiqueta-ok', realizada: 'etiqueta-ok', faltou: 'etiqueta-erro', cancelada: '' };

/** One visit with its actions (confirm, done, no-show, cancel, reschedule). */
export function CartaoVisita({ v, fuso, empresa, mostrarCliente = true, soHora = false }: { v: VisitaLista; fuso: string; empresa: string; mostrarCliente?: boolean; soHora?: boolean }) {
  const ativa = v.estado === 'marcada' || v.estado === 'confirmada';
  const passou = v.passou;
  const botao = (acao: string, rotulo: string) => (
    <Formulario acao={visitaAcao} key={acao}>
      <input type="hidden" name="id" value={v.id} />
      <input type="hidden" name="acao" value={acao} />
      <Enviar secundario className="min-h-9 px-3 py-1 text-sm">{rotulo}</Enviar>
    </Formulario>
  );
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-tinta">{soHora ? textoHorario(v.inicio, fuso).split(' às ')[1] : textoHorario(v.inicio, fuso)}</p>
          {mostrarCliente && (
            <p className="text-[15px]"><Link className="underline" href={`/painel/oportunidades/${v.oportunidade_id}`}>{v.nome || formatarTelefone(v.telefone)}</Link>{v.cidade ? ` · ${v.cidade}` : ''}</p>
          )}
          <p className="text-sm text-suave">
            {v.responsavel ? `Com ${v.responsavel}` : 'Sem responsável'}
            {v.origem === 'ia' ? ' · marcada pela assistente' : ''}
            {v.endereco ? ` · ${v.endereco}` : ' · endereço a confirmar'}
          </p>
          {v.observacao && <p className="text-sm text-suave">{v.observacao}</p>}
        </div>
        <span className={`etiqueta ${COR[v.estado]}`}>{NOME_ESTADO_VISITA[v.estado]}</span>
      </div>
      {ativa && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {v.estado === 'marcada' && !passou && botao('confirmada', 'Confirmar')}
          {passou && botao('realizada', 'Realizada')}
          {passou && botao('faltou', 'Cliente faltou')}
          {botao('cancelada', 'Cancelar')}
          <a className="text-sm underline" href={linkGoogle(v, empresa)} target="_blank" rel="noopener noreferrer">Pôr no Google Agenda</a>
        </div>
      )}
      {ativa && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-marca-escura">Remarcar</summary>
          <Formulario acao={remarcarVisitaAcao} className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={v.id} />
            <div><label className="rotulo" htmlFor={`r-${v.id}`}>Novo dia e horário</label><input className="campo" id={`r-${v.id}`} name="inicio" type="datetime-local" required defaultValue={paraCampoLocal(v.inicio, fuso)} /></div>
            <Enviar secundario>Remarcar</Enviar>
          </Formulario>
        </details>
      )}
    </li>
  );
}
