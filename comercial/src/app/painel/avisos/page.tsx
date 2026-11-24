import Link from 'next/link';
import { lerAvisosAcao, salvarPreferenciasAvisosAcao } from '@/app/acoes';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { GRUPOS, LISTA_GRUPOS, listarAvisos, minhasPreferencias, type Grupo } from '@/server/avisos';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Avisos' };

const HORAS = Array.from({ length: 24 }, (_, h) => h);

/** Every alert of the person, by subject, and what reaches their phone and WhatsApp. */
export default async function Avisos({ searchParams }: { searchParams: Promise<{ grupo?: string; novos?: string }> }) {
  const ctx = await exigirCtx();
  const sp = await searchParams;
  const grupo = sp.grupo && sp.grupo in GRUPOS ? (sp.grupo as Grupo) : null;
  const soNovos = sp.novos === '1';
  const [{ avisos, naoLidos }, prefs] = await Promise.all([listarAvisos(ctx, { grupo, soNaoLidos: soNovos }), minhasPreferencias(ctx)]);
  const totalNovos = LISTA_GRUPOS.reduce((s, g) => s + naoLidos[g], 0);
  const url = (g: Grupo | null, novos = soNovos) => `/painel/avisos${g || novos ? '?' : ''}${[g ? `grupo=${g}` : '', novos ? 'novos=1' : ''].filter(Boolean).join('&')}`;
  const chip = (ativo: boolean) => `inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold ${ativo ? 'border-tinta bg-tinta text-white' : 'border-linha bg-white text-suave hover:border-tinta hover:text-tinta'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Avisos</h1>
        {(grupo ? naoLidos[grupo] : totalNovos) > 0 && (
          <form action={lerAvisosAcao}>
            {grupo && <input type="hidden" name="grupo" value={grupo} />}
            <button className="botao-2 min-h-10 px-3 text-sm">{grupo ? `Marcar “${GRUPOS[grupo]}” como lidos` : 'Marcar tudo como lido'}</button>
          </form>
        )}
      </div>

      <nav aria-label="Filtrar avisos" className="flex flex-wrap gap-2">
        <Link href={url(null)} className={chip(!grupo)}>Todos{totalNovos ? ` · ${totalNovos} novos` : ''}</Link>
        {LISTA_GRUPOS.filter((g) => naoLidos[g] > 0 || g === grupo).map((g) => (
          <Link key={g} href={url(g)} className={chip(grupo === g)}>{GRUPOS[g]}{naoLidos[g] ? ` · ${naoLidos[g]}` : ''}</Link>
        ))}
        <Link href={url(grupo, !soNovos)} className={chip(soNovos)} aria-pressed={soNovos}>Só os não lidos</Link>
      </nav>

      <section className="cartao p-4" aria-label="Lista de avisos">
        {avisos.length === 0 ? (
          <p className="text-[15px] text-suave">{soNovos || grupo ? 'Nenhum aviso com esse filtro.' : 'Nenhum aviso por enquanto.'}</p>
        ) : (
          <ul className="divide-y divide-linha">
            {avisos.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                <Link href={a.link || '/painel'} className={`text-[15px] hover:underline ${a.lida_em ? 'text-texto' : 'font-semibold text-tinta'}`}>
                  {a.titulo}
                  {a.corpo && <span className="block text-sm font-normal text-suave">{a.corpo}</span>}
                  <span className="mt-0.5 block text-[13px] font-normal text-suave">{GRUPOS[a.grupo]}</span>
                </Link>
                <time className="shrink-0 text-[13px] text-suave">{dataHora(a.criado_em)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao p-5" aria-labelledby="t-prefs">
        <h2 id="t-prefs" className="text-lg font-bold">O que chega no seu celular e no WhatsApp</h2>
        <p className="mt-1 text-[15px] text-suave">Aqui no painel todos os avisos continuam aparecendo. Isto vale para o app no celular e para os avisos no WhatsApp (que já mandam só os importantes).</p>
        <Formulario acao={salvarPreferenciasAvisosAcao} className="mt-4 space-y-4">
          <fieldset>
            <legend className="rotulo">Assuntos que você quer receber</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {LISTA_GRUPOS.map((g) => (
                <label key={g} className="flex min-h-9 items-center gap-2 text-[15px]">
                  <input type="checkbox" name="recebe" value={g} defaultChecked={!prefs.grupos_desligados.includes(g)} />
                  {GRUPOS[g]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="rotulo">Horário de silêncio (não chega nada no celular nem no WhatsApp)</legend>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px]">
              <span>Das</span>
              <select name="silencio_inicio" className="campo w-auto" defaultValue={prefs.silencio_inicio ?? ''} aria-label="Começo do silêncio">
                <option value="">—</option>
                {HORAS.map((h) => <option key={h} value={h}>{h}h</option>)}
              </select>
              <span>às</span>
              <select name="silencio_fim" className="campo w-auto" defaultValue={prefs.silencio_fim ?? ''} aria-label="Fim do silêncio">
                <option value="">—</option>
                {HORAS.map((h) => <option key={h} value={h}>{h}h</option>)}
              </select>
              <span className="text-sm text-suave">(deixe “—” para receber a qualquer hora)</span>
            </div>
          </fieldset>
          <Enviar>Salvar o que recebo</Enviar>
        </Formulario>
      </section>
    </div>
  );
}
