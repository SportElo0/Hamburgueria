import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ativarProfissionalAcao, profissionalAcao } from '@/app/acoes';
import { Enviar, Formulario } from '@/componentes/formulario';
import { VISITANTE_DEMO } from '@/server/contexto';
import { empresaPorId, equipe } from '@/server/empresas';
import { CORES, profissionais, textoHora, type Profissional } from '@/server/profissionais';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Profissionais' };

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const hhmm = (m: number) => textoHora(m).padStart(5, '0');

/** Who takes the visits and when each one works. The agenda and the booking page are built from this. */
export default async function Profissionais() {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel/agenda');
  const [lista, pessoas, empresa] = await Promise.all([profissionais(ctx.empresaId, undefined, true), equipe(ctx), empresaPorId(ctx.empresaId)]);
  const logins = pessoas.filter((p) => p.ativo && p.email !== VISITANTE_DEMO);
  return (
    <div className="max-w-4xl space-y-4">
      <p className="text-sm"><Link className="text-suave hover:text-tinta" href="/painel/agenda">← Agenda</Link></p>
      <h1 className="text-2xl font-bold">Profissionais</h1>
      <p className="text-[15px] text-suave">
        Quem faz as visitas e em que dias e horários trabalha. Cada visita dura {empresa!.config.agenda.duracao_min} minutos (muda em Configurações › Agenda de visitas). O profissional não precisa ter login; se tiver, as visitas dele aparecem como dele no painel.
        {ctx.visitante ? ' Na demonstração aberta, este cadastro fica só para ver.' : ''}
      </p>
      {lista.map((p) => <Cartao key={p.id} p={p} logins={logins} />)}
      <details className="cartao p-4" open={lista.length === 0}>
        <summary className="cursor-pointer font-bold text-marca">+ Cadastrar profissional</summary>
        <Ficha logins={logins} />
      </details>
    </div>
  );
}

function Cartao({ p, logins }: { p: Profissional; logins: { user_id: string; nome: string }[] }) {
  const dias = Object.keys(p.semana).map(Number).sort();
  return (
    <details className={`cartao p-4 ${p.ativo ? '' : 'opacity-70'}`}>
      <summary className="flex cursor-pointer items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white" style={{ background: p.cor }} aria-hidden>{p.nome.slice(0, 2).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-tinta">{p.nome}{p.ativo ? '' : ' · fora da agenda'}</span>
          <span className="block text-sm text-suave">{p.funcao ? `${p.funcao} · ` : ''}{dias.length ? dias.map((d) => DIAS[d].slice(0, 3)).join(', ') : 'sem horários'}</span>
        </span>
        <span className="text-sm font-semibold text-marca">Editar</span>
      </summary>
      <Ficha p={p} logins={logins} />
      <Formulario acao={ativarProfissionalAcao} className="mt-3 border-t border-linha pt-3">
        <input type="hidden" name="id" value={p.id} /><input type="hidden" name="ativo" value={p.ativo ? '0' : '1'} />
        <Enviar secundario>{p.ativo ? 'Tirar da agenda' : 'Voltar para a agenda'}</Enviar>
        <p className="mt-1 text-sm text-suave">{p.ativo ? 'Os horários dele somem; visitas já marcadas continuam como estão.' : 'Os horários dele voltam a aparecer.'}</p>
      </Formulario>
    </details>
  );
}

function Ficha({ p, logins }: { p?: Profissional; logins: { user_id: string; nome: string }[] }) {
  const id = p?.id ?? 'novo';
  return (
    <Formulario acao={profissionalAcao} className="mt-4 space-y-4" limpar={!p}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="rotulo" htmlFor={`nome-${id}`}>Nome</label><input className="campo" id={`nome-${id}`} name="nome" required minLength={2} maxLength={60} defaultValue={p?.nome} /></div>
        <div><label className="rotulo" htmlFor={`funcao-${id}`}>O que faz (aparece para o cliente)</label><input className="campo" id={`funcao-${id}`} name="funcao" maxLength={60} placeholder="Ex.: Instalação residencial" defaultValue={p?.funcao} /></div>
        <div>
          <label className="rotulo" htmlFor={`login-${id}`}>Login no painel (opcional)</label>
          <select className="campo" id={`login-${id}`} name="login" defaultValue={p?.user_id ?? ''}>
            <option value="">Sem login</option>
            {logins.map((l) => <option key={l.user_id} value={l.user_id}>{l.nome}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="rotulo">Cor na agenda</legend>
          <div className="flex flex-wrap gap-2">
            {CORES.map((c) => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="cor" value={c} defaultChecked={(p?.cor ?? CORES[0]) === c} className="peer sr-only" />
                <span className="block h-9 w-9 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-tinta peer-focus-visible:ring-2 peer-focus-visible:ring-marca" style={{ background: c }} aria-label={`Cor ${c}`} />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <fieldset>
        <legend className="rotulo">Dias e horários de trabalho</legend>
        <div className="divide-y divide-linha rounded-xl border border-linha">
          {DIAS.map((nome, d) => {
            const faixas = p?.semana[String(d)] ?? [];
            const trabalha = p ? faixas.length > 0 : d >= 1 && d <= 5;
            const ini = faixas[0]?.[0] ?? 480;
            const fim = faixas.at(-1)?.[1] ?? 1020;
            const pausa = faixas.length > 1 ? [faixas[0][1], faixas[1][0]] : p ? null : [720, 780];
            return (
              <div key={d} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                <label className="flex w-28 items-center gap-2 font-semibold text-tinta"><input type="checkbox" name={`dia${d}`} defaultChecked={trabalha} className="h-5 w-5 accent-[#175cd3]" />{nome}</label>
                <span className="flex items-center gap-1 text-sm"><input aria-label={`${nome}: começa`} type="time" name={`ini${d}`} defaultValue={hhmm(ini)} className="campo min-h-10 w-28 py-1" /> às <input aria-label={`${nome}: termina`} type="time" name={`fim${d}`} defaultValue={hhmm(fim)} className="campo min-h-10 w-28 py-1" /></span>
                <span className="flex items-center gap-1 text-sm text-suave">pausa <input aria-label={`${nome}: pausa começa`} type="time" name={`pini${d}`} defaultValue={pausa ? hhmm(pausa[0]) : ''} className="campo min-h-10 w-28 py-1" /> às <input aria-label={`${nome}: pausa termina`} type="time" name={`pfim${d}`} defaultValue={pausa ? hhmm(pausa[1]) : ''} className="campo min-h-10 w-28 py-1" /></span>
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-sm text-suave">A pausa (almoço, por exemplo) é opcional: deixe em branco para trabalhar direto.</p>
      </fieldset>
      <Enviar>{p ? 'Salvar' : 'Cadastrar profissional'}</Enviar>
    </Formulario>
  );
}
