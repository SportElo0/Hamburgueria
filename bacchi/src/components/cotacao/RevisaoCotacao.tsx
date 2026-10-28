'use client';
// Quote review: edit quantities and notes, fill in the contact, send. Delivery is honest: if the server can
// send e-mail it does; if not (or if it fails) the page says so and offers WhatsApp (the number published on
// the current site), e-mail to the sales address and "copy", all with the same full text. Nothing is faked.
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ACABAMENTOS, produto } from '@/data/catalogo';
import { EMPRESA } from '@/data/empresa';
import { ESTADOS } from '@/data/representantes';
import { contatoSchema, linkEmailPedido, linkWhatsAppPedido, textoDoPedido, UF_LISTA, type Contato } from '@/lib/cotacao';
import { cotacao, useCotacao } from '@/lib/cotacao-store';

type Estado = { tipo: 'ocioso' } | { tipo: 'enviando' } | { tipo: 'enviado' } | { tipo: 'erro'; texto: string; semEnvio?: boolean };
type Campos = Omit<Contato, 'aceite'> & { aceite: boolean };
const VAZIO: Campos = { nome: '', empresa: '', email: '', telefone: '', cidade: '', uf: '' as Contato['uf'], mensagem: '', aceite: false };

export function RevisaoCotacao() {
  const itens = useCotacao();
  const id = useId();
  const [c, setC] = useState<Campos>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({});
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' });
  const [configurado, setConfigurado] = useState<boolean | null>(null);
  const [copiado, setCopiado] = useState(false);
  // when the form appeared, for the anti-bot time check
  const aberto = useRef(0);
  useEffect(() => {
    aberto.current = Date.now();
  }, []);
  const resumo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/cotacao').then((r) => r.json()).then((d) => setConfigurado(Boolean(d.configurado))).catch(() => setConfigurado(false));
  }, []);

  const texto = textoDoPedido(itens, c.nome ? c : undefined);
  const mudar = (k: keyof Campos, v: string | boolean) => {
    setC((x) => ({ ...x, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined }));
  };

  const validar = () => {
    const r = contatoSchema.safeParse({ ...c, mensagem: c.mensagem || undefined });
    if (r.success) return r.data;
    const novos: Partial<Record<keyof Campos, string>> = {};
    for (const i of r.error.issues) novos[i.path[0] as keyof Campos] ??= i.message;
    setErros(novos);
    document.getElementById(`${id}-${Object.keys(novos)[0]}`)?.focus();
    return null;
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const contato = validar();
    if (!contato || !itens.length) return;
    setEstado({ tipo: 'enviando' });
    try {
      const res = await fetch('/api/cotacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itens.map(({ slug, modelo, acabamento, embalagem, quantidade, observacao }) => ({ slug, modelo, acabamento, embalagem, quantidade, observacao })),
          contato,
          site: (e.currentTarget.elements.namedItem('site') as HTMLInputElement | null)?.value ?? '',
          tempo: Date.now() - aberto.current,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setEstado({ tipo: 'enviado' });
        cotacao.limpar();
        return;
      }
      setEstado({ tipo: 'erro', texto: d.erro ?? 'Não foi possível enviar agora.', semEnvio: res.status === 503 || res.status === 502 });
    } catch {
      setEstado({ tipo: 'erro', texto: 'Sem conexão com o servidor agora.', semEnvio: true });
    }
    resumo.current?.scrollIntoView({ block: 'center' });
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  if (estado.tipo === 'enviado') {
    return (
      <div className="mx-auto max-w-xl py-16 text-center" role="status">
        <p className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-azul text-2xl text-white" aria-hidden="true">✓</p>
        <h2 className="mt-6 font-display text-3xl font-semibold">Solicitação enviada.</h2>
        <p className="mt-3 text-tinta-2">A equipe comercial da Bacchi recebeu a sua lista e responde pelo e-mail ou telefone informado. Para falar antes, ligue {EMPRESA.telefone}.</p>
        <Link href="/produtos" className="btn btn-primario mt-8">Voltar ao catálogo</Link>
      </div>
    );
  }

  if (!itens.length) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-aco-claro px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold">Sua cotação está vazia.</h2>
        <p className="mt-3 text-tinta-2">No catálogo, abra um produto e use “Adicionar” no modelo que você precisa. A lista fica guardada neste navegador.</p>
        <Link href="/produtos" className="btn btn-primario mt-8">Ir para o catálogo <span className="seta" aria-hidden="true">→</span></Link>
      </div>
    );
  }

  const campo = (k: keyof Campos, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="rotulo" htmlFor={`${id}-${k}`}>{rotulo}</label>
      <input
        id={`${id}-${k}`}
        name={k}
        className="campo"
        value={c[k] as string}
        onChange={(e) => mudar(k, e.target.value)}
        aria-invalid={!!erros[k]}
        aria-describedby={erros[k] ? `${id}-${k}-erro` : undefined}
        {...props}
      />
      {erros[k] && <p id={`${id}-${k}-erro`} className="mt-1.5 text-sm text-[#b3261e]">{erros[k]}</p>}
    </div>
  );

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <section aria-labelledby="titulo-itens" className="min-w-0 lg:col-span-7">
        <div className="flex items-end justify-between">
          <h2 id="titulo-itens" className="font-display text-2xl font-semibold">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</h2>
          <button type="button" onClick={() => confirm('Remover todos os itens da cotação?') && cotacao.limpar()} className="link-b text-sm text-tinta-2">
            Esvaziar
          </button>
        </div>
        <ul className="mt-5 divide-y divide-linha border-y border-linha">
          {itens.map((i) => {
            const p = produto(i.slug);
            return (
              <li key={i.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
                <Link href={`/produtos/${i.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-papel">
                  {p && <Image src={p.imagens[0].src} alt="" fill sizes="88px" className="object-cover" />}
                </Link>
                <div className="min-w-0">
                  <p className="font-semibold">
                    {p?.nome} · {p?.rotuloModelo} {i.modelo}
                  </p>
                  <p className="mt-1 text-sm text-tinta-2">
                    {i.acabamento ? `${ACABAMENTOS[i.acabamento].nome} · ` : ''}
                    {i.embalagem}
                  </p>
                  <label className="mt-3 block">
                    <span className="sr-only">Observação</span>
                    <input defaultValue={i.observacao ?? ''} onBlur={(e) => cotacao.observacao(i.id, e.target.value)} maxLength={200} placeholder="Observação (opcional)" className="w-full border-b border-linha bg-transparent py-1 text-sm outline-none focus:border-azul" />
                  </label>
                </div>
                <div className="col-start-2 flex items-center justify-between gap-4 sm:col-start-3 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-full border border-linha bg-white">
                    <button type="button" className="grid h-10 w-10 place-items-center" aria-label={`Diminuir ${p?.nome} ${i.modelo}`} onClick={() => cotacao.quantidade(i.id, i.quantidade - 1)}>−</button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`Quantidade de embalagens de ${p?.nome} ${i.modelo}`}
                      value={i.quantidade}
                      onChange={(e) => cotacao.quantidade(i.id, Number(e.target.value))}
                      className="h-10 w-16 text-center tabular-nums outline-none"
                    />
                    <button type="button" className="grid h-10 w-10 place-items-center" aria-label={`Aumentar ${p?.nome} ${i.modelo}`} onClick={() => cotacao.quantidade(i.id, i.quantidade + 1)}>+</button>
                  </div>
                  <button type="button" onClick={() => cotacao.remover(i.id)} className="text-sm text-tinta-2 hover:text-[#b3261e]">Remover</button>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/produtos" className="link-b mt-6 inline-block text-sm font-semibold text-azul">+ Adicionar mais produtos</Link>
      </section>

      <section aria-labelledby="titulo-dados" className="min-w-0 lg:col-span-5">
        <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(13,23,38,.45)] md:p-8 lg:sticky lg:top-28">
          <h2 id="titulo-dados" className="font-display text-2xl font-semibold">Seus dados</h2>
          <p className="mt-2 text-sm text-tinta-2">Usados só para a Bacchi responder a esta solicitação.</p>
          <form onSubmit={enviar} noValidate className="mt-6 grid gap-4">
            {campo('nome', 'Nome', { autoComplete: 'name', required: true })}
            {campo('empresa', 'Empresa', { autoComplete: 'organization', required: true })}
            {campo('email', 'E-mail', { type: 'email', autoComplete: 'email', required: true })}
            {campo('telefone', 'Telefone com DDD', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', required: true })}
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              {campo('cidade', 'Cidade', { autoComplete: 'address-level2', required: true })}
              <div>
                <label className="rotulo" htmlFor={`${id}-uf`}>Estado</label>
                <select id={`${id}-uf`} className="campo" value={c.uf} onChange={(e) => mudar('uf', e.target.value)} aria-invalid={!!erros.uf}>
                  <option value="">UF</option>
                  {UF_LISTA.map((u) => (
                    <option key={u} value={u} title={ESTADOS[u]}>{u}</option>
                  ))}
                </select>
                {erros.uf && <p className="mt-1.5 text-sm text-[#b3261e]">{erros.uf}</p>}
              </div>
            </div>
            <div>
              <label className="rotulo" htmlFor={`${id}-mensagem`}>Mensagem <span className="font-normal text-aco">(opcional)</span></label>
              <textarea id={`${id}-mensagem`} className="campo min-h-24" maxLength={1000} value={c.mensagem} onChange={(e) => mudar('mensagem', e.target.value)} placeholder="Prazo, forma de entrega, outras informações" />
            </div>
            {/* honeypot: hidden from people, filled by bots */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
              <label>Site <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
            </div>
            <label className="flex items-start gap-3 text-sm text-tinta-2">
              <input id={`${id}-aceite`} type="checkbox" checked={c.aceite} onChange={(e) => mudar('aceite', e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-azul)]" aria-invalid={!!erros.aceite} />
              <span>Autorizo a Bacchi a usar estes dados para responder a esta solicitação de orçamento.</span>
            </label>
            {erros.aceite && <p className="-mt-2 text-sm text-[#b3261e]">{erros.aceite}</p>}

            <button type="submit" className="btn btn-primario mt-2 w-full" disabled={estado.tipo === 'enviando' || configurado === false}>
              {estado.tipo === 'enviando' ? 'Enviando…' : configurado === false ? 'Envio automático ainda não configurado' : 'Enviar solicitação de orçamento'}
            </button>
          </form>

          <div ref={resumo} aria-live="polite" className="mt-5">
            {estado.tipo === 'erro' && <p className="rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[#8c1d18]">{estado.texto}</p>}
          </div>

          <div className="mt-6 border-t border-linha pt-6">
            <p className="text-sm font-semibold">{configurado === false || (estado.tipo === 'erro' && estado.semEnvio) ? 'Envie por aqui:' : 'Ou envie direto:'}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <a className="btn btn-contorno min-h-11 text-sm text-tinta" href={linkWhatsAppPedido(texto)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a className="btn btn-contorno min-h-11 text-sm text-tinta" href={linkEmailPedido(texto)}>E-mail</a>
              <button type="button" className="btn btn-contorno min-h-11 text-sm text-tinta" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar lista'}</button>
            </div>
            <p className="mt-3 text-xs text-aco">WhatsApp {EMPRESA.whatsapp} e e-mail {EMPRESA.email}, publicados pela Bacchi. A mensagem já vai com todos os itens{c.nome ? ' e os seus dados' : ''}.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
