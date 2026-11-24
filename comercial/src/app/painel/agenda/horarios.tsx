import Link from 'next/link';
import { adicionarHorarioAcao, desfazerAjusteAcao, tirarHorarioAcao } from '@/app/acoes';
import { Formulario } from '@/componentes/formulario';
import type { Ctx } from '@/server/contexto';
import type { Empresa } from '@/server/empresas';
import { dataLocal, diaDaSemana, gradeDoDia, minutosLocais, profissionais, somarDias, textoHora, vagasLivres, type Vaga } from '@/server/profissionais';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SEMANA_LONGA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const iniciais = (n: string) => {
  const partes = n.split(/\s+/).filter(Boolean);
  return (partes.length > 1 ? partes[0][0] + partes[1][0] : n.slice(0, 2)).toUpperCase();
};
const href = (dia: string) => `/painel/agenda?ver=horarios&dia=${dia}`;

/** Owner's view of one day: a column per professional, each time can be taken out, given back or added. */
export async function Horarios({ ctx, empresa, dia }: { ctx: Ctx; empresa: Empresa; dia: string }) {
  const fuso = empresa.config.regras.fuso;
  const hoje = dataLocal(new Date(), fuso);
  const [profs, grade, livres] = await Promise.all([profissionais(empresa.id), gradeDoDia(empresa, dia), vagasLivres(empresa)]);
  const admin = ctx.papel === 'admin';
  const livresPorDia = new Map<string, number>();
  for (const v of livres) livresPorDia.set(dataLocal(v.inicio, fuso), (livresPorDia.get(dataLocal(v.inicio, fuso)) ?? 0) + 1);

  // Mini month of the chosen day.
  const primeiro = `${dia.slice(0, 8)}01`;
  const vazios = diaDaSemana(primeiro);
  const dias: string[] = [];
  for (let d = primeiro; d.slice(0, 7) === dia.slice(0, 7); d = somarDias(d, 1)) dias.push(d);
  const faixa = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i));

  const [ano, mes, numero] = dia.split('-').map(Number);
  return (
    <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
      <aside className="space-y-5">
        <div className="cartao p-4">
          <div className="flex items-center justify-between">
            <Link className="grid h-9 w-9 place-items-center rounded-lg border border-linha" href={href(somarDias(primeiro, -1).slice(0, 8) + '01')} aria-label="Mês anterior">‹</Link>
            <b className="text-[15px] capitalize text-tinta">{MESES[mes - 1]} {ano}</b>
            <Link className="grid h-9 w-9 place-items-center rounded-lg border border-linha" href={href(somarDias(dias.at(-1)!, 1))} aria-label="Próximo mês">›</Link>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-bold text-suave">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: vazios }, (_, i) => <span key={`v${i}`} />)}
            {dias.map((d) => {
              const n = livresPorDia.get(d) ?? 0;
              const sel = d === dia;
              return (
                <Link key={d} href={href(d)} aria-current={sel ? 'date' : undefined} aria-label={`${Number(d.slice(8))}${n ? `, ${n} horários livres` : ''}`}
                  className={`relative grid aspect-square place-items-center rounded-lg text-[13px] font-bold ${sel ? 'bg-marca text-white' : d === hoje ? 'border-2 border-tinta text-tinta' : d < hoje ? 'text-[#b8c1cf]' : 'border border-linha text-tinta hover:border-marca'}`}>
                  {Number(d.slice(8))}
                  {n > 0 && <i className={`absolute bottom-1 h-1 w-1 rounded-full ${sel ? 'bg-white' : 'bg-ok'}`} />}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="cartao space-y-2 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-suave">Legenda</p>
          <p className="flex items-center gap-2"><i className="inline-block h-4 w-7 rounded border-[1.5px] border-dashed border-[#b9c9e6]" />Horário livre</p>
          <p className="flex items-center gap-2"><i className="inline-block h-4 w-7 rounded bg-marca" />Marcado pela equipe</p>
          <p className="flex items-center gap-2"><i className="inline-block h-4 w-7 rounded bg-[#0e9384]" />Marcado pelo cliente ou pela assistente</p>
          <p className="flex items-center gap-2"><i className="inline-block h-4 w-7 rounded tirado" />Horário tirado</p>
          {admin && <Link className="block pt-2 font-semibold text-marca underline-offset-2 hover:underline" href="/painel/agenda/profissionais">Profissionais e horário de trabalho</Link>}
        </div>
      </aside>

      <section className="min-w-0 space-y-4" aria-label="Horários do dia">
        <h2 className="text-xl font-bold text-tinta">{SEMANA_LONGA[diaDaSemana(dia)]}, {numero} de {MESES[mes - 1]}</h2>
        <nav aria-label="Próximos dias" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {faixa.map((d) => (
            <Link key={d} href={href(d)} aria-current={d === dia ? 'date' : undefined} className={`flex min-h-12 shrink-0 flex-col items-center justify-center rounded-xl px-3 text-[13px] font-bold ${d === dia ? 'bg-tinta text-white' : 'border border-linha bg-white text-suave'}`}>
              <span>{SEMANA[diaDaSemana(d)]}</span><span className="text-[15px]">{Number(d.slice(8))}</span>
            </Link>
          ))}
        </nav>
        {!empresa.config.agenda.ativa && <p className="aviso bg-alerta-clara text-alerta">A agenda está desligada em Configurações: os clientes ainda não veem estes horários.</p>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {profs.map((p) => {
            const vs = grade.filter((v) => v.profissionalId === p.id);
            const nLivres = vs.filter((v) => v.estado === 'livre').length;
            return (
              <article key={p.id} className="cartao p-4" aria-label={p.nome}>
                <header className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: p.cor }} aria-hidden>{iniciais(p.nome)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-tinta">{p.nome}</p>
                    <p className="text-[13px] text-suave">{vs.length === 0 ? 'Sem horários neste dia' : `${nLivres} ${nLivres === 1 ? 'livre' : 'livres'}`}{p.funcao ? ` · ${p.funcao}` : ''}</p>
                  </div>
                </header>
                <ul className="mt-3 space-y-2">{vs.map((v) => <Linha key={v.inicio.toISOString()} v={v} admin={admin} fuso={fuso} dia={dia} />)}</ul>
                {admin && dia >= hoje && (
                  <div className="mt-3 space-y-2 border-t border-linha pt-3">
                    <Formulario acao={adicionarHorarioAcao} className="flex items-center gap-2">
                      <input type="hidden" name="profissional" value={p.id} /><input type="hidden" name="dia" value={dia} />
                      <label className="sr-only" htmlFor={`h-${p.id}`}>Horário a mais para {p.nome}</label>
                      <input id={`h-${p.id}`} name="hora" type="time" required className="campo min-h-10 w-28 py-1" />
                      <button className="botao-2 min-h-10 px-3 text-sm">+ horário</button>
                    </Formulario>
                    {nLivres > 0 && (
                      <Formulario acao={tirarHorarioAcao}>
                        <input type="hidden" name="profissional" value={p.id} /><input type="hidden" name="dia" value={dia} /><input type="hidden" name="minutos" value="" />
                        <button className="text-sm font-semibold text-erro underline-offset-2 hover:underline">Tirar o dia de {p.nome}</button>
                      </Formulario>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Linha({ v, admin, fuso, dia }: { v: Vaga; admin: boolean; fuso: string; dia: string }) {
  const min = minutosLocais(v.inicio, fuso);
  const hora = textoHora(min);
  if (v.estado === 'visita' && v.visita) {
    const cliente = v.visita.origem !== 'usuario';
    return (
      <li>
        <Link href={`/painel/oportunidades/${v.visita.oportunidade_id}`} className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm font-bold text-white ${cliente ? 'bg-[#0e9384]' : 'bg-marca'}`}>
          <span>{hora} · {v.visita.nome}</span><span className="text-xs font-medium opacity-90">{v.visita.origem === 'cliente' ? 'marcou pelo link' : v.visita.origem === 'ia' ? 'pela assistente' : 'equipe'}</span>
        </Link>
      </li>
    );
  }
  if (v.estado === 'tirado') {
    return (
      <li className="tirado flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm font-semibold text-[#6b7588]">
        <span>{hora} · Tirado</span>
        {admin && dataLocal(v.inicio, fuso) === dia && v.ajusteId && (
          <Formulario acao={desfazerAjusteAcao}><input type="hidden" name="id" value={v.ajusteId} /><button className="text-sm font-bold text-marca underline-offset-2 hover:underline">Devolver</button></Formulario>
        )}
      </li>
    );
  }
  if (v.estado === 'passado') return <li className="flex min-h-11 items-center rounded-lg bg-fundo px-3 text-sm text-suave">{hora} · já passou</li>;
  return (
    <li className="flex min-h-11 items-center justify-between gap-2 rounded-lg border-[1.5px] border-dashed border-[#b9c9e6] bg-[#fbfdff] px-3 text-sm font-bold text-marca-escura">
      <span>{hora} · Livre{v.extra ? <span className="ml-2 etiqueta etiqueta-azul">extra</span> : null}</span>
      {admin && (v.extra && v.ajusteId ? (
        <Formulario acao={desfazerAjusteAcao}><input type="hidden" name="id" value={v.ajusteId} /><button aria-label={`Tirar o horário extra das ${hora}`} className="grid h-8 w-8 place-items-center rounded-md text-base hover:bg-erro-clara hover:text-erro">✕</button></Formulario>
      ) : (
        <Formulario acao={tirarHorarioAcao}>
          <input type="hidden" name="profissional" value={v.profissionalId} /><input type="hidden" name="dia" value={dia} /><input type="hidden" name="minutos" value={String(min)} />
          <button aria-label={`Tirar o horário das ${hora}`} className="grid h-8 w-8 place-items-center rounded-md text-base hover:bg-erro-clara hover:text-erro">✕</button>
        </Formulario>
      ))}
    </li>
  );
}
