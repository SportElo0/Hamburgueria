'use client';

import { useRef, useState, useTransition } from 'react';
import { MAX_RESUMO, NOME_SITUACAO, SITUACOES, srcImagem, type Servico, type Situacao } from '@/lib/servicos';
import { enviarFotoServicoAction, removerServicoAction, salvarServicoAction, type ResultadoServicos } from '@/app/painel/servicos/actions';

const CHIP: Record<Situacao, string> = {
  pronto: 'bg-ok/10 text-ok',
  'falta-ligar': 'bg-warn/10 text-warn',
  teste: 'bg-accent-soft text-accent',
  ideia: 'bg-line text-ink-soft',
};

type Form = { id?: string; nome: string; resumo: string; situacao: Situacao; imagem: string; demo: string };
const VAZIO: Form = { nome: '', resumo: '', situacao: 'ideia', imagem: '', demo: '' };

/** The "Serviços" tab: one card per service (picture, what it is, where it stands), added and edited by the team. */
export function ServicosGrowlift({ inicial }: { inicial: Servico[] }) {
  const [lista, setLista] = useState(inicial);
  const [filtro, setFiltro] = useState<Situacao | 'todos'>('todos');
  const [form, setForm] = useState<Form | null>(null);
  const [erro, setErro] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const painel = useRef<HTMLFormElement>(null);

  const visiveis = filtro === 'todos' ? lista : lista.filter((s) => s.situacao === filtro);
  const contagem = (x: Situacao) => lista.filter((s) => s.situacao === x).length;

  const abrir = (f: Form) => {
    setErro('');
    setForm(f);
    requestAnimationFrame(() => painel.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  const aplicar = (r: ResultadoServicos) => {
    if (!r.ok) return setErro(r.error);
    setLista(r.lista);
    setForm(null);
  };
  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    iniciar(async () => aplicar(await salvarServicoAction(form)));
  };
  const apagar = () => {
    if (!form?.id || !confirm(`Apagar o serviço “${form.nome}”?`)) return;
    const id = form.id;
    iniciar(async () => aplicar(await removerServicoAction(id)));
  };
  const enviarFoto = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErro('');
    setEnviandoFoto(true);
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    const r = await enviarFotoServicoAction(fd).catch(() => ({ ok: false as const, error: 'Não foi possível enviar a foto agora.' }));
    setEnviandoFoto(false);
    if (!r.ok) return setErro(r.error);
    setForm((f) => (f ? { ...f, imagem: r.imagem } : f));
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
          {(['todos', ...SITUACOES] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setFiltro(x)}
              aria-pressed={filtro === x}
              className={`min-h-9 rounded-full border px-3 text-sm font-semibold transition-colors ${filtro === x ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-soft hover:border-ink hover:text-ink'}`}
            >
              {x === 'todos' ? `Todos ${lista.length}` : `${NOME_SITUACAO[x]} ${contagem(x)}`}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary min-h-10" onClick={() => abrir({ ...VAZIO })}>
          + Adicionar serviço
        </button>
      </div>

      {form && (
        <form ref={painel} onSubmit={salvar} className="card mt-5 scroll-mt-20 p-4 sm:p-5">
          <h2 className="text-lg font-bold">{form.id ? 'Editar serviço' : 'Novo serviço'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="sv-nome">Nome</label>
                <input id="sv-nome" className="field" value={form.nome} maxLength={80} required onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="sv-resumo">O que é (bem curto)</label>
                <textarea id="sv-resumo" className="field" rows={3} value={form.resumo} maxLength={MAX_RESUMO} onChange={(e) => setForm({ ...form, resumo: e.target.value })} />
                <p className="mt-1 text-xs text-ink-mute">{form.resumo.length} de {MAX_RESUMO} letras</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="sv-situacao">Situação</label>
                  <select id="sv-situacao" className="field" value={form.situacao} onChange={(e) => setForm({ ...form, situacao: e.target.value as Situacao })}>
                    {SITUACOES.map((x) => <option key={x} value={x}>{NOME_SITUACAO[x]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="sv-demo">Link da demonstração (opcional)</label>
                  <input id="sv-demo" className="field" type="url" inputMode="url" placeholder="https://" value={form.demo} onChange={(e) => setForm({ ...form, demo: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <span className="label">Foto de exemplo</span>
              <div className="aspect-[16/10] overflow-hidden rounded-lg border border-line bg-paper">
                {form.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={srcImagem(form.imagem)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-sm text-ink-mute">Sem foto</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="btn-ghost min-h-9 cursor-pointer px-3">
                  {enviandoFoto ? 'Enviando…' : form.imagem ? 'Trocar foto' : 'Enviar foto'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={enviandoFoto} onChange={(e) => { void enviarFoto(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                {form.imagem && <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => setForm({ ...form, imagem: '' })}>Tirar foto</button>}
              </div>
              <p className="mt-1 text-xs text-ink-mute">JPG, PNG, WebP ou AVIF até 5 MB. Melhor deitada (formato de tela).</p>
            </div>
          </div>
          {erro && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{erro}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="submit" className="btn-primary min-h-11" disabled={pendente || enviandoFoto}>{pendente ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="btn-ghost min-h-11" onClick={() => setForm(null)}>Cancelar</button>
            {form.id && <button type="button" className="btn-danger min-h-11 sm:ml-auto" onClick={apagar} disabled={pendente}>Apagar serviço</button>}
          </div>
        </form>
      )}
      {!form && erro && <p role="alert" className="mt-3 text-sm font-semibold text-bad">{erro}</p>}

      {visiveis.length === 0 ? (
        <p className="card mt-5 p-6 text-center text-ink-mute">Nenhum serviço nesta situação.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((s) => (
            <li key={s.id} className="card flex flex-col overflow-hidden">
              <div className="aspect-[16/10] border-b border-line bg-accent-soft">
                {s.imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={srcImagem(s.imagem)} alt={`Exemplo: ${s.nome}`} width={960} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden className="grid h-full place-items-center text-4xl font-bold text-accent/40">{s.nome.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className={`chip self-start ${CHIP[s.situacao]}`}>{NOME_SITUACAO[s.situacao]}</span>
                <h2 className="mt-2 text-lg leading-snug font-bold">{s.nome}</h2>
                {s.resumo && <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{s.resumo}</p>}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {s.demo && (
                    <a className="btn-ghost min-h-9 px-3" href={s.demo} target="_blank" rel="noopener noreferrer">
                      Ver demonstração ↗
                    </a>
                  )}
                  <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => abrir({ id: s.id, nome: s.nome, resumo: s.resumo, situacao: s.situacao, imagem: s.imagem, demo: s.demo })}>
                    Editar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
