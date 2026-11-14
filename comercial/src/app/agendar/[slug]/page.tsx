import Link from 'next/link';
import { notFound } from 'next/navigation';
import { agendarAcao } from '@/app/acoes';
import { Enviar, Formulario } from '@/componentes/formulario';
import { FRASE_LEMBRETE_AGENDAMENTO } from '@/server/config';
import { empresaPorSlug } from '@/server/empresas';
import { dataLocal, dataValida, diaDaSemana, minutosLocais, profissionais, somarDias, textoHora, usaProfissionais, vagasLivres } from '@/server/profissionais';
import { novoToken } from '@/server/segredos';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await empresaPorSlug((await params).slug);
  return { title: e ? `Agendar visita · ${e.nome}` : 'Empresa não encontrada', robots: { index: false } };
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const iniciais = (n: string) => {
  const partes = n.split(/\s+/).filter(Boolean);
  return (partes.length > 1 ? partes[0][0] + partes[1][0] : n.slice(0, 2)).toUpperCase();
};
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nomeDia = (d: string) => `${SEMANA[diaDaSemana(d)]}, ${Number(d.slice(8))} de ${MESES[Number(d.slice(5, 7)) - 1]}`;

/**
 * Booking page: the customer picks the day on a calendar, then the professional and the time, then confirms.
 * Built from the free slots of the company's professionals (src/server/profissionais.ts). No JavaScript needed:
 * each step is a link, the last one a form.
 */
export default async function Agendar({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ mes?: string; dia?: string; p?: string; h?: string; feito?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const empresa = await empresaPorSlug(slug);
  if (!empresa) notFound();
  const fuso = empresa.config.regras.fuso;
  const base = `/agendar/${encodeURIComponent(empresa.slug)}`;
  const aberto = empresa.config.agenda.ativa && (await usaProfissionais(empresa.id));

  const topo = (passo: number) => (
    <header className="border-b border-linha px-5 pb-4 pt-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marca text-lg font-extrabold text-white" aria-hidden>{empresa.nome[0]}</span>
        <div className="min-w-0"><p className="truncate font-extrabold text-tinta">{empresa.nome}</p><p className="text-[13px] text-suave">Agendar visita</p></div>
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-1.5" aria-label={`Passo ${passo} de 3`}>{[1, 2, 3].map((n) => <li key={n} className={`h-1.5 rounded-full ${n <= passo ? 'bg-marca' : 'bg-linha'}`} />)}</ol>
    </header>
  );
  const casca = (passo: number, corpo: React.ReactNode) => (
    <div className="min-h-dvh bg-fundo sm:py-8">
      {empresa.demonstracao && <p className="bg-tinta px-4 py-1.5 text-center text-[13px] text-white">Demonstração · empresa fictícia · não use seus dados reais</p>}
      <main className="mx-auto min-h-dvh max-w-md bg-white sm:min-h-0 sm:rounded-3xl sm:border sm:border-linha sm:shadow-sm">
        {topo(passo)}
        <div className="px-5 py-5">{corpo}</div>
        <footer className="px-5 pb-6 text-center text-xs text-suave"><Link className="underline" href={`/s/${empresa.slug}/privacidade`}>Privacidade</Link></footer>
      </main>
    </div>
  );

  if (sp.feito) {
    return casca(3, (
      <div className="py-6 text-center">
        <p className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok-clara text-2xl text-ok" aria-hidden>✓</p>
        <h1 className="mt-4 text-xl font-extrabold text-tinta">Visita marcada</h1>
        <p className="mt-2 text-[15px] text-texto">{sp.feito.slice(0, 80)}</p>
        <p className="mt-3 text-sm text-suave">A equipe da {empresa.nome} vai confirmar o endereço com você. Para remarcar ou cancelar, fale com a empresa.</p>
      </div>
    ));
  }
  if (!aberto) {
    return casca(1, <p className="aviso bg-alerta-clara text-alerta">O agendamento pela internet não está disponível agora. <Link className="underline" href={`/s/${empresa.slug}`}>Fale com a {empresa.nome}</Link>.</p>);
  }

  const [livres, profs] = await Promise.all([vagasLivres(empresa), profissionais(empresa.id)]);
  const porDia = new Map<string, typeof livres>();
  for (const v of livres) porDia.set(dataLocal(v.inicio, fuso), [...(porDia.get(dataLocal(v.inicio, fuso)) ?? []), v]);
  const hoje = dataLocal(new Date(), fuso);

  // Step 3: confirm.
  const escolhido = sp.dia && sp.p && sp.h ? livres.find((v) => v.profissionalId === sp.p && v.inicio.toISOString() === sp.h) : undefined;
  if (escolhido && sp.dia) {
    const prof = profs.find((p) => p.id === escolhido.profissionalId)!;
    return casca(3, (
      <>
        <h1 className="text-xl font-extrabold text-tinta">Quase lá</h1>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-fundo p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-extrabold text-white" style={{ background: prof.cor }} aria-hidden>{iniciais(prof.nome)}</span>
          <div><p className="font-extrabold text-tinta">{maiuscula(nomeDia(sp.dia))} · {textoHora(minutosLocais(escolhido.inicio, fuso))}</p><p className="text-sm text-suave">com {prof.nome} · visita de {empresa.config.agenda.duracao_min} minutos</p></div>
        </div>
        <p className="mt-2 text-sm"><Link className="font-semibold text-marca" href={`${base}?dia=${sp.dia}`}>‹ Trocar o horário</Link></p>
        <Formulario acao={agendarAcao} className="mt-4 space-y-4">
          <input type="hidden" name="slug" value={empresa.slug} />
          <input type="hidden" name="p" value={prof.id} />
          <input type="hidden" name="h" value={escolhido.inicio.toISOString()} />
          <input type="hidden" name="chave" value={novoToken(12)} />
          <div className="hidden" aria-hidden><label>Site<input name="site_url" tabIndex={-1} autoComplete="off" /></label></div>
          <div><label className="rotulo" htmlFor="nome">Seu nome</label><input className="campo" id="nome" name="nome" autoComplete="name" required minLength={2} maxLength={80} /></div>
          <div><label className="rotulo" htmlFor="telefone">WhatsApp com DDD</label><input className="campo" id="telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 91234-5678" required /></div>
          <div><label className="rotulo" htmlFor="cidade">Cidade</label><input className="campo" id="cidade" name="cidade" autoComplete="address-level2" required minLength={2} maxLength={80} /></div>
          {empresa.config.campos.map((c) => (
            <div key={c.id}>
              <label className="rotulo" htmlFor={`extra_${c.id}`}>{c.rotulo}{c.obrigatorio ? '' : ' (opcional)'}</label>
              {c.tipo === 'opcoes' ? (
                <select className="campo" id={`extra_${c.id}`} name={`extra_${c.id}`} required={c.obrigatorio} defaultValue="">
                  <option value="" disabled={c.obrigatorio}>Escolha</option>
                  {c.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className="campo" id={`extra_${c.id}`} name={`extra_${c.id}`} required={c.obrigatorio} maxLength={200} inputMode={c.tipo === 'numero' ? 'numeric' : undefined} />
              )}
            </div>
          ))}
          <div><label className="rotulo" htmlFor="endereco">Endereço da visita</label><input className="campo" id="endereco" name="endereco" autoComplete="street-address" maxLength={300} placeholder="Rua, número e bairro" required /></div>
          <label className="flex items-start gap-3 text-sm text-texto"><input type="checkbox" name="aceite" className="mt-0.5 h-5 w-5 shrink-0 accent-[#175cd3]" />{FRASE_LEMBRETE_AGENDAMENTO}</label>
          <p className="text-xs text-suave">Seus dados vão só para a {empresa.nome}, para fazer a visita. <Link className="underline" href={`/s/${empresa.slug}/privacidade`}>Privacidade</Link>.</p>
          <Enviar className="w-full">Confirmar visita</Enviar>
        </Formulario>
      </>
    ));
  }

  // Step 2: professionals and times of the chosen day.
  if (sp.dia && dataValida(sp.dia)) {
    const vs = porDia.get(sp.dia) ?? [];
    return casca(2, (
      <>
        <h1 className="text-xl font-extrabold text-tinta">{maiuscula(nomeDia(sp.dia))}</h1>
        <p className="mt-3 flex items-center justify-between rounded-xl bg-marca-clara px-4 py-3 text-[15px] font-bold text-marca-escura">
          <Link href={`${base}?mes=${sp.dia.slice(0, 7)}`}>‹ Trocar o dia</Link><span>{vs.length} {vs.length === 1 ? 'horário livre' : 'horários livres'}</span>
        </p>
        <ul className="mt-3 space-y-3">
          {profs.map((p) => {
            const meus = vs.filter((v) => v.profissionalId === p.id);
            return (
              <li key={p.id} className={`rounded-2xl border-[1.5px] border-linha p-4 ${meus.length ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-extrabold text-white" style={{ background: meus.length ? p.cor : '#98a2b3' }} aria-hidden>{iniciais(p.nome)}</span>
                  <div><p className="font-extrabold text-tinta">{p.nome}</p>{p.funcao && <p className="text-[13px] text-suave">{p.funcao}</p>}</div>
                </div>
                {meus.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {meus.map((v) => (
                      <Link key={v.inicio.toISOString()} href={`${base}?dia=${sp.dia}&p=${p.id}&h=${encodeURIComponent(v.inicio.toISOString())}`} aria-label={`${p.nome}, ${textoHora(minutosLocais(v.inicio, fuso))}`}
                        className="grid min-h-11 min-w-[4.5rem] place-items-center rounded-xl border-[1.5px] border-[#c9d7ee] px-3 text-[15px] font-bold text-marca-escura hover:border-marca hover:bg-marca hover:text-white">
                        {textoHora(minutosLocais(v.inicio, fuso))}
                      </Link>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm text-suave">Sem horário livre neste dia.</p>}
              </li>
            );
          })}
        </ul>
      </>
    ));
  }

  // Step 1: the month, with how many free times each day has.
  const mesAtual = hoje.slice(0, 7);
  const ultimoMes = (livres.at(-1) ? dataLocal(livres.at(-1)!.inicio, fuso) : hoje).slice(0, 7);
  const mes = sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) && sp.mes >= mesAtual && sp.mes <= ultimoMes ? sp.mes : (livres[0] ? dataLocal(livres[0].inicio, fuso) : hoje).slice(0, 7);
  const primeiro = `${mes}-01`;
  const dias: string[] = [];
  for (let d = primeiro; d.slice(0, 7) === mes; d = somarDias(d, 1)) dias.push(d);
  const anterior = somarDias(primeiro, -1).slice(0, 7);
  const proximo = somarDias(dias.at(-1)!, 1).slice(0, 7);
  return casca(1, (
    <>
      <h1 className="text-xl font-extrabold text-tinta">Qual dia é melhor pra você?</h1>
      <p className="mt-1 text-sm text-suave">Os dias com horário livre mostram quantos ainda têm.</p>
      <div className="mt-5 flex items-center justify-between">
        {mes > mesAtual ? <Link className="grid h-10 w-10 place-items-center rounded-xl border border-linha font-bold" href={`${base}?mes=${anterior}`} aria-label="Mês anterior">‹</Link> : <span className="h-10 w-10" />}
        <b className="capitalize text-tinta">{MESES[Number(mes.slice(5)) - 1]} {mes.slice(0, 4)}</b>
        {mes < ultimoMes ? <Link className="grid h-10 w-10 place-items-center rounded-xl border border-linha font-bold" href={`${base}?mes=${proximo}`} aria-label="Próximo mês">›</Link> : <span className="h-10 w-10" />}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-suave" aria-hidden>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: diaDaSemana(primeiro) }, (_, i) => <span key={`v${i}`} />)}
        {dias.map((d) => {
          const n = porDia.get(d)?.length ?? 0;
          const numero = Number(d.slice(8));
          if (!n) return <span key={d} className={`grid aspect-square place-items-center rounded-xl bg-fundo text-[15px] font-bold text-[#b8c1cf] ${d === hoje ? 'ring-2 ring-tinta/40' : ''}`}>{numero}</span>;
          return (
            <Link key={d} href={`${base}?dia=${d}`} aria-label={`${nomeDia(d)}, ${n} ${n === 1 ? 'horário livre' : 'horários livres'}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border-[1.5px] bg-white text-[15px] font-bold text-tinta hover:border-marca ${d === hoje ? 'border-tinta' : 'border-linha'}`}>
              {numero}<small className={`text-[10px] font-bold leading-tight ${n === 1 ? 'text-alerta' : 'text-ok'}`}>{n} {n === 1 ? 'livre' : 'livres'}</small>
            </Link>
          );
        })}
      </div>
      {livres.length === 0 && <p className="aviso mt-4 bg-alerta-clara text-alerta">Nenhum horário livre nos próximos dias. <Link className="underline" href={`/s/${empresa.slug}`}>Fale com a {empresa.nome}</Link>.</p>}
    </>
  ));
}
