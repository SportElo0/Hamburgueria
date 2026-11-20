'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LINHA_SAIR, comLinhaSair, mensagemModelo, type Escolhido } from '@/lib/importados';
import { marcarEnviadoAction } from '@/app/loja/[slug]/dono/clientes/actions';
import { setOptOutAction } from '@/app/loja/[slug]/actions';
import { apagarPlanoAction, conversarAction, salvarPlanoAction } from '@/app/loja/[slug]/app/actions';
import type { Fala, PlanoTorpedo, RespostaTorpedo } from '@/lib/torpedo-servidor';

/** The demo runs everything in the browser: simulated AI, nothing saved, WhatsApp never opened. */
export interface DemoTorpedo {
  conversar: (falas: Fala[]) => Promise<RespostaTorpedo>;
  salvar: (plano: { mensagem: string; dia: string; quantos: number }) => void;
  apagar: () => void;
  enviado: (phone: string) => void;
  sair: (phone: string) => void;
  irClientes: () => void;
}

const fmtPhone = (p: string) => `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
const fmtDiaLongo = (dia: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(`${dia}T12:00:00Z`));
const QUANTOS = [25, 50, 100] as const;
const SUGESTOES = ['Quero fazer uma promoção de um lanche que não está saindo', 'Quero chamar de volta quem sumiu, sem desconto', 'Quero divulgar um combo para o fim de semana'];

/** Plan the next WhatsApp campaign with the AI, save it for a day and send it one by one from the owner's phone. */
export function Torpedo(props: { slug: string; storeName: string; ia: boolean; hoje: string; plano: PlanoTorpedo | null; escolhidos: Escolhido[]; temLista: boolean; clientes: boolean; demo?: DemoTorpedo }) {
  const demo = props.demo;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pensando, setPensando] = useState(false);
  const [falas, setFalas] = useState<Fala[]>([]);
  const [texto, setTexto] = useState('');
  const [mensagem, setMensagem] = useState(props.plano?.mensagem ?? '');
  const [dia, setDia] = useState(props.plano && props.plano.dia >= props.hoje ? props.plano.dia : props.hoje);
  const [quantos, setQuantos] = useState<number>(props.plano?.quantos ?? 50);
  const [oferta, setOferta] = useState('');
  const [salvo, setSalvo] = useState(Boolean(props.plano));
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [lista, setLista] = useState(props.escolhidos);
  const [enviadosAgora, setEnviadosAgora] = useState(0);
  const fimConversa = useRef<HTMLDivElement>(null);
  const caixaMensagem = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fimConversa.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [falas, pensando]);

  const problema = !mensagem.trim()
    ? 'Prepare a mensagem primeiro.'
    : !mensagem.includes(LINHA_SAIR)
      ? `Deixe a última linha: "${LINHA_SAIR}"`
      : /\[[^\]]*\]/.test(mensagem)
        ? 'Troque o texto entre colchetes antes de enviar.'
        : '';
  const daVez = lista.slice(0, Math.max(0, quantos - enviadosAgora));

  const mudarMensagem = (m: string) => {
    setMensagem(m);
    setSalvo(false);
    setAviso('');
  };

  const falar = (t: string) => {
    const frase = t.trim();
    if (!frase || pensando) return;
    setErro('');
    const novas: Fala[] = [...falas, { quem: 'dono', texto: frase }];
    setFalas(novas);
    setTexto('');
    setPensando(true);
    start(async () => {
      const res = demo ? await demo.conversar(novas) : await conversarAction(props.slug, novas);
      setPensando(false);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setFalas((f) => [...f, { quem: 'ia', texto: res.resposta + (res.mensagem ? `\n\nMensagem preparada:\n${res.mensagem}` : '') }]);
      if (res.mensagem) {
        mudarMensagem(res.mensagem);
        setTimeout(() => caixaMensagem.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
    });
  };

  const salvar = () => {
    setErro('');
    const pronto = () => {
      setSalvo(true);
      setAviso(dia === props.hoje ? 'Torpedo salvo para hoje. Já pode enviar aqui embaixo.' : `Torpedo salvo para ${fmtDiaLongo(dia)}. No dia, abra esta tela e toque em Enviar.`);
    };
    if (demo) {
      demo.salvar({ mensagem, dia, quantos });
      return pronto();
    }
    start(async () => {
      const res = await salvarPlanoAction(props.slug, { mensagem, dia, quantos });
      if (!res.ok) return setErro(res.error ?? 'Não foi possível salvar.');
      pronto();
      router.refresh();
    });
  };

  const apagar = () => {
    if (!confirm('Apagar o torpedo planejado?')) return;
    if (demo) {
      demo.apagar();
      setMensagem('');
      setSalvo(false);
      setAviso('');
      return;
    }
    start(async () => {
      const res = await apagarPlanoAction(props.slug);
      if (!res.ok) return setErro(res.error ?? 'Não foi possível apagar.');
      setMensagem('');
      setSalvo(false);
      setAviso('');
      router.refresh();
    });
  };

  const enviado = (c: Escolhido) => {
    setLista((l) => l.filter((x) => x.phone !== c.phone));
    setEnviadosAgora((n) => n + 1);
    if (demo) return demo.enviado(c.phone);
    start(async () => {
      const res = await marcarEnviadoAction(props.slug, c.phone).catch(() => ({ ok: false, error: '' }));
      if (!res.ok) setErro(`Não consegui anotar o envio para ${c.name}. Confira a internet: sem a anotação, essa pessoa pode aparecer de novo antes de 30 dias.`);
    });
  };

  const saiu = (c: Escolhido) => {
    setLista((l) => l.filter((x) => x.phone !== c.phone));
    if (demo) return demo.sair(c.phone);
    start(async () => {
      const res = await setOptOutAction(props.slug, c.phone, true);
      if (!res.ok) setErro(res.error ?? 'Não foi possível salvar.');
    });
  };

  if (!props.temLista)
    return (
      <div className="card p-5 text-sm">
        <p className="font-semibold">Primeiro, traga seus clientes do Anota Aí.</p>
        {props.clientes &&
          (demo ? (
            <button type="button" onClick={demo.irClientes} className="btn-primary mt-3 min-h-11">
              Ir para Clientes
            </button>
          ) : (
            <Link href={`/loja/${props.slug}/app`} className="btn-primary mt-3 min-h-11">
              Ir para Clientes
            </Link>
          ))}
      </div>
    );

  return (
    <div className="space-y-5">
      {props.plano && (
        <section className="card border-ink/20 p-4" aria-label="Próximo torpedo">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              <span className="chip mr-1.5 bg-accent/10 text-accent">Planejado</span>
              <b>{props.plano.dia === props.hoje ? 'Hoje' : fmtDiaLongo(props.plano.dia)}</b> para {props.plano.quantos} clientes
              {props.plano.dia < props.hoje && <span className="text-warn"> (o dia já passou)</span>}
            </p>
            <button type="button" className="min-h-9 px-1 text-sm text-ink-mute underline" onClick={apagar} disabled={pending}>
              Apagar
            </button>
          </div>
        </section>
      )}

      <section className="card overflow-hidden" aria-labelledby="planejar">
        <div className="border-b border-line p-4">
          <h2 id="planejar" className="font-bold">
            Planejar o próximo torpedo
          </h2>
          <p className="mt-0.5 text-sm text-ink-mute">{props.ia ? 'Converse com a IA como falaria com um funcionário: o que quer vender, o preço e até quando vale.' : 'Escreva a oferta e monte a mensagem.'}</p>
        </div>

        {props.ia ? (
          <div className="p-4">
            <div className="max-h-[50vh] space-y-3 overflow-y-auto" aria-live="polite">
              {falas.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-ink-soft">Por onde começar? Toque numa ideia ou escreva do seu jeito.</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {SUGESTOES.map((s) => (
                      <button key={s} type="button" className="min-h-10 rounded-xl border border-line bg-white px-3 py-2 text-left text-sm hover:border-ink/40" onClick={() => falar(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {falas.map((f, i) => (
                <div key={i} className={`flex ${f.quem === 'dono' ? 'justify-end' : 'justify-start'}`}>
                  <p className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${f.quem === 'dono' ? 'rounded-br-md bg-ink text-white' : 'rounded-bl-md bg-paper text-ink'}`}>{f.texto}</p>
                </div>
              ))}
              {pensando && (
                <div className="flex justify-start">
                  <p className="rounded-2xl rounded-bl-md bg-paper px-3.5 py-2.5 text-sm text-ink-mute">Pensando…</p>
                </div>
              )}
              <div ref={fimConversa} />
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                falar(texto);
              }}
            >
              <label htmlFor="torpedo-fala" className="sr-only">
                Sua mensagem para a IA
              </label>
              <input
                id="torpedo-fala"
                className="field flex-1"
                maxLength={500}
                placeholder={falas.length ? 'Responda aqui' : 'Ex.: o bacon não está saindo, quero fazer promoção hoje'}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn-primary min-h-11 px-4" disabled={!texto.trim() || pensando}>
                Enviar
              </button>
            </form>
            {falas.length > 0 && (
              <button type="button" className="mt-2 min-h-9 text-sm text-ink-mute underline" onClick={() => setFalas([])} disabled={pensando}>
                Começar de novo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <label htmlFor="torpedo-oferta" className="label">
              O que você quer oferecer? (opcional)
            </label>
            <input id="torpedo-oferta" className="field" maxLength={300} placeholder="Ex.: X-Bacon por R$ 25 hoje e amanhã" value={oferta} onChange={(e) => setOferta(e.target.value)} />
            <button type="button" className="btn-ghost min-h-11" onClick={() => mudarMensagem(mensagemModelo(props.storeName, oferta))}>
              Montar a mensagem
            </button>
          </div>
        )}

        <div className="space-y-3 border-t border-line bg-paper/60 p-4">
          <div>
            <label htmlFor="torpedo-msg" className="label">
              Mensagem que vai para os clientes
            </label>
            <textarea
              id="torpedo-msg"
              ref={caixaMensagem}
              className="field min-h-36 resize-y bg-white"
              maxLength={700}
              placeholder={props.ia ? 'A mensagem aparece aqui quando a IA terminar. Você pode mudar o que quiser.' : ''}
              value={mensagem}
              onChange={(e) => mudarMensagem(e.target.value)}
            />
            {mensagem && !mensagem.includes(LINHA_SAIR) && (
              <button type="button" className="mt-1 min-h-9 text-sm font-semibold text-warn underline" onClick={() => mudarMensagem(comLinhaSair(mensagem))}>
                Colocar a linha do SAIR no final
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="torpedo-dia" className="label">
                Quando enviar
              </label>
              <input
                id="torpedo-dia"
                type="date"
                className="field w-auto bg-white"
                min={props.hoje}
                value={dia}
                onChange={(e) => {
                  setDia(e.target.value);
                  setSalvo(false);
                }}
              />
            </div>
            <div>
              <label htmlFor="torpedo-quantos" className="label">
                Para quantos
              </label>
              <select
                id="torpedo-quantos"
                className="field w-auto bg-white"
                value={quantos}
                onChange={(e) => {
                  setQuantos(Number(e.target.value));
                  setSalvo(false);
                }}
              >
                {QUANTOS.map((q) => (
                  <option key={q} value={q}>
                    Os {q} melhores
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-primary min-h-11" onClick={salvar} disabled={pending || Boolean(problema) || !dia || salvo}>
              {salvo ? 'Torpedo salvo' : 'Salvar torpedo'}
            </button>
          </div>
          {problema && mensagem && (
            <p role="status" className="text-sm font-semibold text-warn">
              {problema}
            </p>
          )}
          {aviso && (
            <p role="status" className="text-sm font-semibold text-ok">
              {aviso}
            </p>
          )}
          <p className="text-xs text-ink-mute">Só escreva o que a loja vai cumprir: preço, validade e condições de verdade. Cada cliente recebe no máximo 1 torpedo a cada 30 dias.</p>
        </div>
      </section>

      <section aria-labelledby="quem">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="quem" className="text-lg font-bold">
            Quem vai receber
          </h2>
          {enviadosAgora > 0 && <p className="text-sm font-semibold text-ok tabular-nums">{enviadosAgora} {demo ? 'enviados (simulação)' : 'enviados agora'}</p>}
        </div>
        <p className="text-sm text-ink-mute">Os que mais pediram e estão parados há um tempo (o melhor é de 1 a 4 meses). Quem pediu SAIR ou já recebeu nos últimos 30 dias fica de fora.</p>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Se alguém responder SAIR, PARAR ou algo parecido, toque em “Pediu para sair” na hora. Mandar de novo depois disso não pode.</p>
        {problema ? (
          <p className="card mt-3 p-4 text-sm text-ink-soft">{mensagem ? problema : 'Prepare a mensagem acima. Depois os botões de Enviar aparecem aqui.'}</p>
        ) : daVez.length === 0 ? (
          <p className="card mt-3 p-4 text-sm text-ink-soft">{enviadosAgora ? 'Pronto, todos desta vez foram chamados.' : 'Ninguém para chamar agora. Quem já foi chamado volta depois de 30 dias.'}</p>
        ) : (
          <ul className="card mt-3 divide-y divide-line px-4">
            {daVez.map((c, i) => (
              <li key={c.phone} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    <span className="mr-2 text-ink-mute tabular-nums">{i + 1 + enviadosAgora}.</span>
                    {c.name}
                  </p>
                  <p className="text-sm text-ink-mute tabular-nums">
                    {fmtPhone(c.phone)} · {c.motivo}
                  </p>
                </div>
                <div className="flex gap-2">
                  {demo ? (
                    <button type="button" className="btn min-h-10 border border-ok/40 bg-ok/5 px-4 text-ok hover:bg-ok hover:text-white" onClick={() => enviado(c)}>
                      Enviar
                    </button>
                  ) : (
                    <a
                      className="btn min-h-10 border border-ok/40 bg-ok/5 px-4 text-ok hover:bg-ok hover:text-white"
                      href={`https://wa.me/55${c.phone}?text=${encodeURIComponent(mensagem)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => enviado(c)}
                    >
                      Enviar
                    </a>
                  )}
                  <button type="button" className="btn-ghost min-h-10 text-sm" onClick={() => saiu(c)}>
                    Pediu para sair
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {erro && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
    </div>
  );
}
