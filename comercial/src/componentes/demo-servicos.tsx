'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * The guided demonstration of the five services (page /demonstracao), with the fictitious Pousada Maré Calma.
 * Every scene is a script played in the browser: no request, no message, nothing saved. The texts of the messages
 * are the ones the system really sends (missed call, follow-up flow of the pousada model, review invitation).
 */

const EMPRESA = 'Pousada Maré Calma';

type Feito = { site: boolean; google: number; ligacao: '' | 'whatsapp' | 'tarefa'; retomada: '' | 'ganho' | 'tarefa'; avaliacao: boolean };
const INICIO: Feito = { site: false, google: 0, ligacao: '', retomada: '', avaliacao: false };
type Marcar = (f: Partial<Feito>) => void;

const PASSOS = ['Site com IA', 'Google', 'Ligações', 'Retomada', 'Avaliações', 'Resumo'] as const;

const reduzMovimento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Reveals the items of a script one by one (all at once with reduced motion). */
function useRoteiro(atrasos: readonly number[], aoTerminar?: () => void) {
  const [n, setN] = useState(0);
  const [tocando, setTocando] = useState(false);
  const timers = useRef<number[]>([]);
  const fim = useRef(aoTerminar);
  useEffect(() => {
    fim.current = aoTerminar;
  });
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function tocar() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reduzMovimento()) {
      setN(atrasos.length);
      setTocando(false);
      fim.current?.();
      return;
    }
    setN(0);
    setTocando(true);
    let t = 0;
    atrasos.forEach((a, i) => {
      t += a;
      timers.current.push(
        window.setTimeout(() => {
          setN(i + 1);
          if (i === atrasos.length - 1) {
            setTocando(false);
            fim.current?.();
          }
        }, t),
      );
    });
  }
  return { n, tocando, tocar, terminou: n >= atrasos.length };
}

/* ---------------------------------------------------------------- small pieces */

const Check = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className}><path d="M5 10.5l3.2 3.2L15 6.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Seta = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className={className}><path d="M4 10h11m-4-4.5L15.5 10 11 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconePainel = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-3.5 w-3.5"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M2.5 7.5h15M7.5 7.5v9" stroke="currentColor" strokeWidth="1.8" /></svg>
);
const IconeLista = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-3.5 w-3.5"><path d="M7 5.5h9M7 10h9M7 14.5h9M3.5 5.5h.01M3.5 10h.01M3.5 14.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
);
const IconeTelefone = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}><path d="M6.6 3.8l2.3-.5c.6-.1 1.2.2 1.4.8l1 2.6c.2.5.1 1.1-.4 1.5L9.6 9.4a12 12 0 005 5l1.2-1.3c.4-.4 1-.6 1.5-.4l2.6 1c.6.2.9.8.8 1.4l-.5 2.3c-.1.6-.7 1.1-1.3 1.1C10.6 18.4 5.6 13.4 5.5 5.1c0-.6.5-1.2 1.1-1.3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
);

function Celular({ hora, escuro = false, children, legenda }: { hora: string; escuro?: boolean; children: React.ReactNode; legenda?: string }) {
  return (
    <figure className="mx-auto w-full max-w-[350px]">
      <div className="rounded-[34px] bg-tinta p-[7px] shadow-[0_28px_50px_-24px_rgba(16,24,40,0.55)]">
        <div className={`flex h-[540px] flex-col overflow-hidden rounded-[28px] ${escuro ? 'bg-[#0d1626] text-white' : 'bg-fundo'}`}>
          <div className={`flex items-center justify-between px-6 pb-1.5 pt-3 text-[12px] font-semibold tabular-nums ${escuro ? 'text-white/85' : 'text-tinta'}`}>
            <span>{hora}</span>
            <span aria-hidden className="flex items-end gap-[2px]">
              {[4, 6, 8, 10].map((h) => <span key={h} className="w-[3px] rounded-sm bg-current" style={{ height: h }} />)}
              <span className="ml-1.5 h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]"><span className="block h-full w-3/4 rounded-[1px] bg-current" /></span>
            </span>
          </div>
          {children}
        </div>
      </div>
      {legenda && <figcaption className="mt-2.5 text-center text-[13px] text-suave">{legenda}</figcaption>}
    </figure>
  );
}

/** Top bar of a chat screen (WhatsApp or the site chat). */
function TopoConversa({ nome, sub, inicial }: { nome: string; sub: string; inicial: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-linha bg-white px-4 py-2.5">
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-marca text-[14px] font-bold text-white">{inicial}</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[14.5px] font-bold text-tinta">{nome}</span>
        <span className="block truncate text-[12px] text-suave">{sub}</span>
      </span>
    </div>
  );
}

/** Scrolling message area that follows the newest message. */
function Mensagens({ children, passo }: { children: React.ReactNode; passo: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }, [passo]);
  return (
    <div ref={ref} aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
      {children}
    </div>
  );
}

function Balao({ lado, children, hora, rotulo }: { lado: 'esq' | 'dir'; children: React.ReactNode; hora?: string; rotulo?: string }) {
  return (
    <div className={`entrar flex ${lado === 'dir' ? 'justify-end' : ''}`}>
      <div className={`max-w-[86%] rounded-2xl px-3 py-2 text-[14.5px] leading-snug ${lado === 'dir' ? 'rounded-br-md bg-marca text-white' : 'rounded-bl-md border border-linha bg-white text-tinta'}`}>
        {rotulo && <p className={`mb-0.5 text-[11.5px] font-bold ${lado === 'dir' ? 'text-white/80' : 'text-marca'}`}>{rotulo}</p>}
        {children}
        {hora && <span className={`mt-1 block text-right text-[11px] tabular-nums ${lado === 'dir' ? 'text-white/75' : 'text-suave'}`}>{hora}</span>}
      </div>
    </div>
  );
}

function Digitando({ quem }: { quem: string }) {
  return (
    <div className="entrar flex items-center gap-2 text-[12.5px] text-suave">
      <span className="pontinhos flex gap-1 rounded-2xl rounded-bl-md border border-linha bg-white px-3 py-2.5 text-suave"><span /><span /><span /></span>
      {quem} está escrevendo
    </div>
  );
}

function NoPainel({ titulo, children, tom = 'azul' }: { titulo: string; children?: React.ReactNode; tom?: 'azul' | 'alerta' | 'ok' }) {
  const cor = { azul: 'border-marca/35 bg-marca-clara text-marca-escura', alerta: 'border-alerta/35 bg-alerta-clara text-alerta', ok: 'border-ok/35 bg-ok-clara text-ok' }[tom];
  return (
    <div className={`entrar rounded-xl border border-dashed p-3 ${cor}`}>
      <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em]"><IconePainel /> No painel da pousada</p>
      <p className="mt-1 text-[14.5px] font-semibold leading-snug text-tinta">{titulo}</p>
      {children && <div className="mt-0.5 text-[13.5px] leading-snug text-texto">{children}</div>}
    </div>
  );
}

function Segmentado<T extends string>({ rotulo, valor, opcoes, mudar, desligado }: { rotulo: string; valor: T; opcoes: { v: T; t: string }[]; mudar: (v: T) => void; desligado?: boolean }) {
  return (
    <fieldset disabled={desligado} className="mx-auto w-full max-w-[350px] disabled:opacity-60">
      <legend className="mb-1.5 text-[13px] font-semibold text-tinta">{rotulo}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-linha bg-white p-1">
        {opcoes.map((o) => (
          <label key={o.v} className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-[13.5px] font-semibold leading-tight text-texto has-checked:bg-marca has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-marca">
            <input type="radio" className="sr-only" checked={valor === o.v} onChange={() => mudar(o.v)} />
            {o.t}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Text column + simulation of one service. On phones: intro, simulation, then the lists. */
function Cena(props: { n: number; titulo: string; dor: string; faz: string[]; fazTitulo?: string; precisa: string[]; nota?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cartao grid gap-x-12 gap-y-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:grid-rows-[auto_1fr]">
      <div className="min-w-0 lg:col-start-1">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-marca">Serviço {props.n} de 5</p>
        <h2 className="mt-1 text-[27px] font-bold leading-[1.15] tracking-tight sm:text-[34px]">{props.titulo}</h2>
        <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed"><span className="font-semibold text-tinta">O problema: </span>{props.dor}</p>
      </div>
      <div className="min-w-0 space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">{props.children}</div>
      <div className="min-w-0 lg:col-start-1">
        <h3 className="text-[15px] font-bold">{props.fazTitulo ?? 'O que o sistema faz'}</h3>
        <ul className="mt-2.5 space-y-2.5">
          {props.faz.map((t) => (
            <li key={t} className="flex gap-2.5 text-[16px] leading-snug"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok-clara text-ok"><Check className="h-3.5 w-3.5" /></span>{t}</li>
          ))}
        </ul>
        <h3 className="mt-6 text-[15px] font-bold">O que a pousada precisa ter</h3>
        <ul className="mt-2.5 space-y-2">
          {props.precisa.map((t) => (
            <li key={t} className="flex gap-2.5 text-[15.5px] leading-snug text-texto"><Seta className="mt-0.5 h-4 w-4 shrink-0 text-suave" />{t}</li>
          ))}
        </ul>
        {props.nota && <div className="aviso mt-6 border border-linha bg-fundo leading-relaxed">{props.nota}</div>}
      </div>
    </div>
  );
}

function BotaoTocar({ tocando, terminou, comecar, repetir, aoClicar }: { tocando: boolean; terminou: boolean; comecar: string; repetir: string; aoClicar: () => void }) {
  return (
    <div className="flex justify-center">
      <button type="button" className={terminou ? 'botao-2' : 'botao'} disabled={tocando} onClick={aoClicar}>
        {tocando ? 'Acontecendo…' : terminou ? repetir : comecar}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- 1. site with AI */

const CHAT_SITE = [
  { de: 'h', t: 'Oi! Tem vaga para o Réveillon? Somos 2.', ms: 600 },
  { de: 'a', t: 'Oi! Aqui é a Ana, da Pousada Maré Calma. Me conta a data de entrada e a de saída, que eu já deixo seu pedido pronto para a recepção conferir a disponibilidade e os valores.', ms: 1800 },
  { de: 'h', t: 'Entrada 29/12 e saída 02/01. Tem quarto com varanda?', ms: 1400 },
  { de: 'a', t: 'Tem, sim: a suíte casal tem cama de casal e varanda para o jardim. Os valores do Réveillon a recepção confirma, ela abre às 8h. Para eu passar o pedido, qual é o seu nome e o seu telefone com DDD?', ms: 2000 },
  { de: 'h', t: 'Juliana, (11) 90000-0301', ms: 1300 },
  { de: 'a', t: 'Pronto, Juliana! Passei seu pedido para a recepção, que vai falar com você. Se lembrar de mais alguma coisa, é só escrever aqui.', ms: 1700 },
  { de: 'p', t: '', ms: 1000 },
] as const;
const ATRASOS_SITE = CHAT_SITE.map((m) => m.ms);
const HORAS_SITE = ['23:12', '23:12', '23:13', '23:13', '23:14', '23:14'];

function CenaSite({ marcar }: { marcar: Marcar }) {
  const r = useRoteiro(ATRASOS_SITE, () => marcar({ site: true }));
  const proxima = CHAT_SITE[r.n];
  return (
    <Cena
      n={1}
      titulo="Site com atendimento por IA"
      dor="o hóspede pergunta às 23h, ninguém responde até o dia seguinte e ele pode acabar reservando em outro lugar."
      faz={[
        'A Ana responde a qualquer hora, de dia ou de noite, só com as informações da pousada.',
        'Anota as datas, quantas pessoas e os pedidos especiais, e entrega o pedido pronto para a recepção.',
        'Não confirma reserva nem inventa preço: valores e disponibilidade quem confirma é a equipe.',
        'Se perguntarem a sério se é robô, ela não mente: diz que é a assistente da pousada e oferece chamar alguém da recepção.',
      ]}
      precisa={['As informações da pousada: acomodações, horários e regras (check-in, pet, café).', 'Um site: pode ser o que vocês já têm. O chat e o formulário de reserva entram nele.']}
      nota={<>Aqui as respostas seguem um roteiro. Com a pousada ligada, quem responde é a IA de verdade, presa às informações que vocês passaram. <Link className="font-semibold text-marca underline underline-offset-2" href="/s/pousada-demo" target="_blank">Abrir o site de exemplo</Link></>}
    >
      <Celular hora="23:12" legenda="O hóspede no site, à noite, com a recepção fechada">
        <div className="bg-white px-4 pb-3 pt-1">
          <p className="text-[12px] font-semibold text-suave">Site da pousada (exemplo)</p>
          <p className="mt-1 text-[17px] font-bold leading-tight text-tinta">Reserve direto com a gente</p>
          <p className="mt-0.5 text-[12.5px] text-suave">Suítes com varanda, café da manhã e piscina.</p>
        </div>
        <TopoConversa nome="Ana · Pousada Maré Calma" sub="Responde a qualquer hora" inicial="A" />
        <Mensagens passo={r.n}>
          {r.n === 0 && <p className="m-auto max-w-[24ch] text-center text-[13.5px] text-suave">Aperte o botão abaixo para ver a conversa.</p>}
          {CHAT_SITE.slice(0, r.n).map((m, i) =>
            m.de === 'p' ? (
              <NoPainel key={i} titulo="Novo pedido de reserva: Juliana">29/12 a 02/01 · 2 adultos · quer quarto com varanda · chegou às 23:14 pelo chat do site</NoPainel>
            ) : (
              <Balao key={i} lado={m.de === 'h' ? 'dir' : 'esq'} hora={HORAS_SITE[i]}>{m.t}</Balao>
            ),
          )}
          {r.tocando && proxima?.de === 'a' && <Digitando quem="Ana" />}
        </Mensagens>
      </Celular>
      <BotaoTocar tocando={r.tocando} terminou={r.terminou} comecar="Ver a conversa" repetir="Ver de novo" aoClicar={r.tocar} />
    </Cena>
  );
}

/* ---------------------------------------------------------------- 2. Google profile + SEO */

const ITENS_GOOGLE = [
  'Categoria principal: Pousada',
  'Endereço e pino no mapa conferidos',
  'Telefone e WhatsApp',
  'Horário da recepção',
  'Fotos reais dos quartos, do café e da área comum',
  'Descrição com o que o hóspede procura',
  'Link do site e do pedido de reserva',
  'Título e descrição das páginas do site (SEO)',
];

function CenaGoogle({ marcar }: { marcar: Marcar }) {
  const [ok, setOk] = useState<boolean[]>(() => ITENS_GOOGLE.map(() => false));
  const total = ok.filter(Boolean).length;
  const trocar = (i: number) => {
    const novo = ok.map((v, j) => (j === i ? !v : v));
    setOk(novo);
    marcar({ google: novo.filter(Boolean).length });
  };
  const tudo = () => {
    setOk(ITENS_GOOGLE.map(() => true));
    marcar({ google: ITENS_GOOGLE.length });
  };
  const [cat, end, tel, hor, fotos, desc, link, seo] = ok;
  const acao = (on: boolean, t: string) => (
    <span className={`flex min-h-10 flex-1 items-center justify-center rounded-full border text-[12.5px] font-semibold transition-colors ${on ? 'border-marca bg-marca-clara text-marca-escura' : 'border-linha bg-fundo text-suave/70 line-through decoration-1'}`}>{t}</span>
  );
  return (
    <Cena
      n={2}
      titulo="Perfil no Google e SEO"
      dor="perfil sem fotos, sem horário e sem link dá ao Google menos informação para mostrar e ao hóspede menos motivo para escolher. E o site aparece na busca sem dizer o que a pousada tem."
      fazTitulo="O que a gente faz"
      faz={[
        'Conferimos categoria, endereço, telefone, horário e o link de reserva.',
        'Escrevemos a descrição do perfil e o título de cada página do site com o que o hóspede procura.',
        'Organizamos as fotos reais e respondemos às avaliações junto com vocês.',
      ]}
      precisa={['Acesso ao perfil no Google: vocês continuam donos, a gente entra como administrador.', 'Fotos reais da pousada.']}
      nota={<>Ninguém pode garantir o 1º lugar no Google. O Google informa que perfis completos e corretos ajudam a aparecer nas buscas certas: é isso que a gente deixa pronto, sem garantia de posição.</>}
    >
      <div className="cartao overflow-hidden shadow-[0_18px_40px_-28px_rgba(16,24,40,0.5)]">
        <div className="grid h-24 grid-cols-3 gap-0.5">
          {['Quarto', 'Café', 'Piscina'].map((f) => (
            <div key={f} className={`flex items-end p-1.5 text-[11px] font-semibold transition-colors ${fotos ? 'bg-gradient-to-br from-[#d5e5ff] to-[#9cc0f5] text-marca-escura' : 'tirado text-suave'}`}>{fotos ? `foto real: ${f.toLowerCase()}` : 'sem foto'}</div>
          ))}
        </div>
        <div className="p-4">
          <p className="text-[18px] font-bold leading-tight text-tinta">{EMPRESA}</p>
          <p className="mt-0.5 text-[13.5px] text-suave">{cat ? 'Pousada' : 'Sem categoria'} · {end ? 'Litoral Norte de SP (fictício)' : 'endereço não conferido'}</p>
          <p className={`mt-1 text-[13.5px] ${hor ? 'font-semibold text-ok' : 'text-suave'}`}>{hor ? 'Recepção aberta · fecha às 22h' : 'Horário não informado'}</p>
          {desc && <p className="entrar mt-2 text-[13.5px] leading-snug text-texto">Pousada a poucos passos da praia, com suítes com varanda, café da manhã e piscina. Peça sua reserva direto com a gente.</p>}
          <div className="mt-3 flex gap-1.5">{acao(tel, 'Ligar')}{acao(end, 'Rota')}{acao(link, 'Site')}{acao(link, 'Reservar')}</div>
        </div>
        <div className="border-t border-linha bg-fundo p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-suave">Na busca do Google</p>
          {seo ? (
            <div className="entrar mt-1.5">
              <p className="text-[12px] text-suave">site da pousada › reservas</p>
              <p className="text-[16px] font-semibold leading-snug text-marca-escura">Pousada Maré Calma · Pousada perto da praia no Litoral Norte</p>
              <p className="text-[13px] leading-snug text-texto">Suítes com varanda, café da manhã e piscina. Peça sua reserva direto pelo site ou pelo WhatsApp.</p>
            </div>
          ) : (
            <p className="mt-1.5 text-[13.5px] text-suave">Página sem título nem descrição: o Google mostra o primeiro texto que encontrar.</p>
          )}
        </div>
      </div>
      <fieldset className="cartao p-4">
        <legend className="sr-only">Itens do perfil</legend>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14.5px] font-bold text-tinta" aria-live="polite">{total} de {ITENS_GOOGLE.length} prontos</p>
          <button type="button" className="botao min-h-10 px-3 text-[14px]" onClick={tudo} disabled={total === ITENS_GOOGLE.length}>Deixar tudo pronto</button>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-fundo"><div className="h-full rounded-full bg-ok transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(total / ITENS_GOOGLE.length) * 100}%` }} /></div>
        <ul className="mt-3 space-y-0.5">
          {ITENS_GOOGLE.map((t, i) => (
            <li key={t}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-[14.5px] leading-snug text-tinta hover:bg-fundo">
                <input type="checkbox" checked={ok[i]} onChange={() => trocar(i)} className="h-5 w-5 shrink-0 accent-ok" />
                {t}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </Cena>
  );
}

/* ---------------------------------------------------------------- 3. missed call */

type FaseLigacao = 'inicio' | 'menu' | 'tocando' | 'fim';

function CenaLigacao({ marcar }: { marcar: Marcar }) {
  const [fase, setFase] = useState<FaseLigacao>('inicio');
  const [horario, setHorario] = useState<'dia' | 'noite'>('dia');
  const [apertou, setApertou] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const hora = horario === 'dia' ? '14:32' : '23:10';
  const horaMsg = horario === 'dia' ? '14:33' : '23:11';
  const escolher = (um: boolean) => {
    setApertou(um);
    setFase('tocando');
    timer.current = window.setTimeout(() => {
      setFase('fim');
      marcar({ ligacao: um ? 'whatsapp' : 'tarefa' });
    }, reduzMovimento() ? 0 : 1800);
  };
  const texto =
    horario === 'dia'
      ? `Oi! Aqui é Ana, da ${EMPRESA}. Vi que você ligou e não conseguimos atender agora. Como posso te ajudar? Se preferir, a equipe retorna a ligação.`
      : `Oi! Aqui é Ana, da ${EMPRESA}. Recebemos sua ligação fora do nosso horário de atendimento. Assim que a equipe estiver disponível, ela te responde. Se quiser, já pode contar por aqui o que precisa.`;
  const whatsapp = fase === 'fim' && apertou;
  return (
    <Cena
      n={3}
      titulo="Ligação perdida vira conversa"
      dor="a recepção está fazendo um check-in, o telefone toca e ninguém atende. A pessoa pode ligar para a próxima pousada da lista."
      faz={[
        'Antes de tocar, uma gravação pergunta se a pessoa quer receber mensagem no WhatsApp. Quem aperta 1 recebe logo em seguida.',
        'A equipe ganha a tarefa “Retornar a ligação” no painel e o aviso no celular.',
        'Só manda para quem apertou 1, só para celular e no máximo uma mensagem por número a cada 24 horas.',
      ]}
      precisa={['Um número num serviço de telefonia que avisa quando a ligação não foi atendida.', 'O WhatsApp oficial da pousada (API da Meta). A gente configura os dois.']}
      nota="Sem o 1, nenhuma mensagem sai: fica só a tarefa de retornar a ligação. Quem escrever SAIR não recebe mais nada."
    >
      <Segmentado rotulo="Quando a pessoa liga" valor={horario} mudar={setHorario} desligado={fase !== 'inicio' && fase !== 'fim'} opcoes={[{ v: 'dia', t: '14:32 · recepção aberta' }, { v: 'noite', t: '23:10 · fora do horário' }]} />
      <Celular hora={whatsapp ? horaMsg : hora} escuro={!whatsapp} legenda="O celular de quem ligou (número fictício)">
        {whatsapp ? (
          <>
            <TopoConversa nome={EMPRESA} sub="WhatsApp da pousada" inicial="M" />
            <Mensagens passo={1}>
              <Balao lado="esq" hora={horaMsg}>{texto} Para não receber mensagens, responda SAIR.</Balao>
            </Mensagens>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-10 text-center">
            <p className="text-[13px] text-white/60">{fase === 'fim' ? 'Chamada não atendida' : fase === 'inicio' ? 'Pronto para ligar' : 'Chamando'}</p>
            <p className="mt-2 text-[26px] font-semibold leading-tight">{EMPRESA}</p>
            <p className="mt-1 text-[14px] tabular-nums text-white/60">(12) 90000-0300</p>
            <div className="mt-8 flex-1">
              {fase === 'menu' && (
                <div className="entrar rounded-2xl bg-white/10 p-4 text-left">
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-white/60">A gravação diz</p>
                  <p className="mt-1.5 text-[15px] leading-snug">“Se ninguém puder atender, quer receber uma mensagem da {EMPRESA} no WhatsApp, neste número? Aperte 1.”</p>
                </div>
              )}
              {fase === 'tocando' && <p className="entrar text-[15px] text-white/80">Tocando na recepção…</p>}
              {fase === 'fim' && <p className="entrar text-[15px] leading-snug text-white/80">Ninguém atendeu. Como a pessoa não apertou 1, nenhuma mensagem é enviada.</p>}
            </div>
            {fase === 'menu' ? (
              <div className="grid w-full grid-cols-2 gap-2">
                <button type="button" className="min-h-12 rounded-full bg-white text-[15px] font-bold text-tinta" onClick={() => escolher(true)}>Apertar 1</button>
                <button type="button" className="min-h-12 rounded-full border border-white/30 text-[15px] font-semibold text-white" onClick={() => escolher(false)}>Não apertar</button>
              </div>
            ) : (
              <span aria-hidden className={`grid h-16 w-16 place-items-center rounded-full ${fase === 'fim' ? 'bg-white/15' : 'bg-[#e5484d]'}`}><IconeTelefone className="h-7 w-7" /></span>
            )}
          </div>
        )}
      </Celular>
      {fase === 'fim' && (
        <div className="space-y-2">
          <NoPainel titulo="Tarefa: Retornar a ligação" tom="alerta">Ligação não atendida às {hora} · o número de quem ligou fica registrado para a recepção retornar{apertou ? ' · a pessoa recebeu a mensagem no WhatsApp' : ''}</NoPainel>
        </div>
      )}
      <div className="flex justify-center">
        {fase === 'inicio' || fase === 'fim' ? (
          <button type="button" className={fase === 'fim' ? 'botao-2' : 'botao'} onClick={() => setFase('menu')}>
            <IconeTelefone className="h-4 w-4" /> {fase === 'fim' ? 'Ligar de novo' : 'Simular a ligação'}
          </button>
        ) : (
          <p className="text-center text-[13.5px] text-suave">{fase === 'menu' ? 'Escolha o que a pessoa faz no celular acima.' : 'A ligação está tocando na recepção.'}</p>
        )}
      </div>
    </Cena>
  );
}

/* ---------------------------------------------------------------- 4. service + follow-up */

const COLUNAS = ['Novo pedido', 'Em atendimento', 'Proposta enviada', 'Ganho'];
const RETOMADA = `Oi, Juliana! Aqui é da ${EMPRESA}. Conseguiu ver os valores para as suas datas? Se quiser reservar, é só responder por aqui que a gente confirma a disponibilidade. Para não receber mensagens, responda SAIR.`;
interface Evento { quando: string; texto: string; etapa: number; msg?: { de: 'p' | 'h'; t: string }; auto?: boolean; modelo?: boolean; estado?: string; tarefa?: string; ms: number }
const BASE: Evento[] = [
  { quando: 'Sex · 23:14', texto: 'O pedido chega pelo formulário do site, com a autorização para falar pelo WhatsApp marcada. A recepção recebe o aviso no celular.', etapa: 0, ms: 500 },
  { quando: 'Sáb · 08:05', texto: 'Paula, da recepção, abre o pedido.', etapa: 1, ms: 1300 },
  { quando: 'Sáb · 08:20', texto: 'Paula envia os valores pelo painel, com o modelo aprovado “Valores da reserva”. Chega no WhatsApp da Juliana mesmo sem ela ter escrito antes.', etapa: 2, modelo: true, estado: 'No painel: enviada · entregue', msg: { de: 'p', t: `Olá, Juliana! Aqui é da ${EMPRESA}. Para 29/12 a 02/01, 2 adultos, suíte casal com varanda e café da manhã, o valor fica em R$ 3.200 pelas 4 noites (valor fictício). Para reservar, é só responder esta mensagem. Para não receber mensagens, responda SAIR.` }, ms: 1500 },
  { quando: 'Dom · 08:20', texto: '1 dia sem resposta: a retomada sai sozinha.', etapa: 2, auto: true, modelo: true, estado: 'No painel: enviada · entregue', msg: { de: 'p', t: RETOMADA }, ms: 2000 },
];
const RESPONDE: Evento[] = [
  ...BASE,
  { quando: 'Dom · 10:02', texto: 'Juliana responde. A automação para na hora.', etapa: 2, msg: { de: 'h', t: 'Oi! Vi sim, pode reservar.' }, ms: 1800 },
  { quando: 'Dom · 10:15', texto: 'A recepção confirma a reserva e registra o sinal de R$ 800 que caiu no Pix (valores fictícios).', etapa: 3, ms: 1500 },
];
const SOME: Evento[] = [...BASE, { quando: 'Qua · 08:20', texto: '3 dias sem resposta: a recepção recebe uma tarefa.', etapa: 2, tarefa: 'Retomar o pedido de reserva: valores enviados há 3 dias sem resposta', ms: 2000 }];
const ATRASOS_RESPONDE = RESPONDE.map((e) => e.ms);
const ATRASOS_SOME = SOME.map((e) => e.ms);

function CenaRetomada({ marcar }: { marcar: Marcar }) {
  const [modo, setModo] = useState<'responde' | 'some'>('responde');
  const eventos = modo === 'responde' ? RESPONDE : SOME;
  const resp = useRoteiro(ATRASOS_RESPONDE, () => marcar({ retomada: 'ganho' }));
  const some = useRoteiro(ATRASOS_SOME, () => marcar({ retomada: 'tarefa' }));
  const r = modo === 'responde' ? resp : some;
  const vistos = eventos.slice(0, r.n);
  const etapa = vistos.at(-1)?.etapa ?? -1;
  const lista = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = lista.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }, [r.n, modo]);
  return (
    <Cena
      n={4}
      titulo="Atendimento e retomada de quem sumiu"
      dor="a recepção manda os valores, o hóspede não responde e, no corre do dia, ninguém lembra de voltar a falar com ele."
      faz={[
        'Todo pedido vira um cartão no painel: novo, em atendimento, proposta enviada, ganho.',
        'A recepção envia os valores pelo painel, com um modelo aprovado pela Meta: chega mesmo que o hóspede só tenha pedido pelo site, e o painel mostra se foi entregue ou se falhou.',
        'Se o hóspede autorizou mensagens e não responder em 1 dia, sai uma mensagem de retomada. Em 3 dias sem resposta, a recepção recebe uma tarefa (sem autorização, fica só a tarefa).',
        'Se ele responder ou a reserva mudar de etapa, a automação para e ele não recebe mais nada dela.',
      ]}
      precisa={['O WhatsApp oficial da pousada (o mesmo do serviço 3).', 'Os modelos de mensagem aprovados pela Meta (valores e retomada). A gente escreve e cadastra.', 'Alguém da recepção para mandar os valores, confirmar a reserva e registrar o que foi pago.']}
      nota="A retomada só vai para quem autorizou receber mensagens e sempre tem a opção SAIR. Uma mensagem só, sem insistência."
    >
      <Segmentado rotulo="Depois dos valores, a Juliana…" valor={modo} mudar={setModo} desligado={resp.tocando || some.tocando} opcoes={[{ v: 'responde', t: 'Responde à retomada' }, { v: 'some', t: 'Não responde mais' }]} />
      <div className="cartao p-3">
        <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-marca-escura"><IconePainel /> Quadro de pedidos <span className="font-semibold normal-case tracking-normal text-suave">· valores fictícios</span></p>
        <ol className="mt-2 grid grid-cols-4 gap-1.5">
          {COLUNAS.map((c, i) => (
            <li key={c} className={`flex min-h-[86px] flex-col rounded-lg p-1.5 ${i === 3 ? 'bg-ok-clara' : 'bg-fundo'}`}>
              <span lang="pt-BR" className="hyphens-auto break-words text-[11px] font-semibold leading-tight text-suave">{c}</span>
              {etapa === i && (
                <span key={`${modo}-${i}`} className={`entrar mt-auto rounded-md border bg-white p-1.5 text-[11.5px] font-semibold leading-tight text-tinta shadow-sm ${i === 3 ? 'border-ok' : 'border-linha'}`}>
                  Juliana{i >= 2 && <span className="block whitespace-nowrap font-normal tabular-nums text-suave">R$ 3.200</span>}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
      <ol ref={lista} aria-live="polite" className="cartao max-h-[420px] min-h-[180px] space-y-3 overflow-y-auto p-3">
        {vistos.length === 0 && <li className="py-10 text-center text-[13.5px] text-suave">Aperte o botão abaixo para ver o pedido andar.</li>}
        {vistos.map((e) => (
          <li key={`${modo}-${e.quando}`} className="entrar">
            <p className="flex flex-wrap items-center gap-2 text-[12px] font-bold tabular-nums text-suave">
              {e.quando}
              {e.auto && <span className="etiqueta etiqueta-azul">Automação</span>}
              {e.modelo && <span className="etiqueta">Modelo aprovado</span>}
            </p>
            <p className="mt-0.5 text-[14.5px] font-semibold leading-snug text-tinta">{e.texto}</p>
            {e.msg && <div className="mt-1.5"><Balao lado={e.msg.de === 'h' ? 'dir' : 'esq'} rotulo={e.msg.de === 'h' ? 'Juliana' : EMPRESA}>{e.msg.t}</Balao></div>}
            {e.estado && <p className="mt-1 text-[12px] font-semibold text-ok">{e.estado}</p>}
            {e.tarefa && <div className="mt-1.5"><NoPainel titulo={`Tarefa: ${e.tarefa}`} tom="alerta" /></div>}
            {e.etapa === 3 && <div className="mt-1.5"><NoPainel titulo="Reserva fechada: R$ 800 recebidos, R$ 2.400 em aberto (valores fictícios)" tom="ok">Entra em “Vendas pagas”, marcada como paga após retomada: a mensagem de retomada saiu antes do pagamento.</NoPainel></div>}
          </li>
        ))}
      </ol>
      <BotaoTocar tocando={r.tocando} terminou={r.terminou} comecar="Ver o pedido andar" repetir="Ver de novo" aoClicar={r.tocar} />
    </Cena>
  );
}

/* ---------------------------------------------------------------- 5. reviews */

const CONVITE = `Olá, Marcos! Obrigado por escolher a ${EMPRESA}. Se puder, conte como foi sua experiência:`;

function CenaAvaliacao({ marcar }: { marcar: Marcar }) {
  const [fase, setFase] = useState<'inicio' | 'convite' | 'pagina'>('inicio');
  const [nota, setNota] = useState<number | null>(null);
  const [publico, setPublico] = useState(false);
  const concluir = () => {
    setFase('convite');
    setNota(null);
    setPublico(false);
    marcar({ avaliacao: true });
  };
  return (
    <Cena
      n={5}
      titulo="Avaliações no Google"
      dor="o hóspede gostou, foi embora e não avaliou, porque ninguém pediu na hora certa."
      faz={[
        'No check-out, a recepção marca a estadia como concluída e o convite sai pelo WhatsApp.',
        'O botão de avaliar no Google aparece para todo mundo, qualquer que seja a nota.',
        'Quem quiser também pode mandar um recado só para a pousada, sem tirar o botão público.',
      ]}
      precisa={['O link de avaliação do perfil no Google (a gente gera).', 'O WhatsApp oficial da pousada (o mesmo dos serviços 3 e 4).']}
      nota="A política do Google proíbe oferecer desconto ou brinde em troca de avaliação e pedir avaliação só para quem gostou. Por isso todo hóspede recebe o mesmo convite, e só quem autorizou receber mensagens da pousada."
    >
      <Celular hora={fase === 'inicio' ? '11:02' : '11:03'} legenda="O celular do hóspede (dados fictícios)">
        {fase === 'pagina' ? (
          <div className="flex-1 space-y-3 overflow-y-auto bg-fundo px-3 py-3">
            <div className="entrar rounded-xl border border-linha bg-white p-4">
              <p className="text-[18px] font-bold leading-tight text-tinta">Como foi sua experiência com a {EMPRESA}?</p>
              <p className="mt-1.5 text-[13.5px] leading-snug text-texto">Sua opinião ajuda outras pessoas a escolher. A avaliação é pública e é você quem escreve, do seu jeito.</p>
              <button type="button" className="botao mt-3 w-full" onClick={() => setPublico(true)}>Avaliar publicamente</button>
              {publico && <p className="entrar mt-2 text-[13px] leading-snug text-ok">Aqui abre a página de avaliação da pousada no Google.</p>}
            </div>
            <fieldset className="rounded-xl border border-linha bg-white p-4">
              <legend className="sr-only">Recado privado</legend>
              <p className="text-[15px] font-bold text-tinta">Prefere mandar um recado só para a pousada?</p>
              <p className="mt-1 text-[12.5px] leading-snug text-suave">É opcional. O botão acima continua, qualquer que seja a nota.</p>
              <div className="mt-2.5 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((v) => (
                  <label key={v} className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-linha text-[15px] font-semibold text-tinta has-checked:border-marca has-checked:bg-marca-clara has-focus-visible:outline-2 has-focus-visible:outline-marca">
                    <input type="radio" name="nota-demo" className="sr-only" checked={nota === v} onChange={() => setNota(v)} />
                    {v}
                  </label>
                ))}
              </div>
              {nota != null && <p className="entrar mt-2 text-[13px] leading-snug text-texto">Nota {nota}: o recado vai só para a pousada. O botão de avaliar no Google continua ali em cima.</p>}
            </fieldset>
          </div>
        ) : (
          <>
            <TopoConversa nome={EMPRESA} sub="WhatsApp da pousada" inicial="M" />
            <Mensagens passo={fase === 'convite' ? 1 : 0}>
              {fase === 'inicio' ? (
                <p className="m-auto max-w-[26ch] text-center text-[13.5px] text-suave">Marcos (fictício) acabou de fazer o check-out. Aperte o botão abaixo como se fosse a recepção.</p>
              ) : (
                <Balao lado="esq" hora="11:03">
                  {CONVITE}{' '}
                  <button type="button" className="font-semibold text-marca underline underline-offset-2" onClick={() => setFase('pagina')}>link do convite</button>{' '}
                  Para não receber mensagens, responda SAIR.
                </Balao>
              )}
            </Mensagens>
          </>
        )}
      </Celular>
      {fase !== 'inicio' && <NoPainel titulo="Estadia concluída: Marcos" tom="ok">O convite de avaliação foi enviado. O painel mostra se o convite foi aberto, para a recepção acompanhar.</NoPainel>}
      <div className="flex flex-wrap justify-center gap-2">
        {fase === 'inicio' && <button type="button" className="botao" onClick={concluir}>Marcar estadia como concluída</button>}
        {fase === 'convite' && <button type="button" className="botao" onClick={() => setFase('pagina')}>Abrir o convite como o hóspede</button>}
        {fase === 'pagina' && <button type="button" className="botao-2" onClick={concluir}>Ver de novo</button>}
      </div>
    </Cena>
  );
}

/* ---------------------------------------------------------------- summary */

function Resumo({ feito, ir, recomecar }: { feito: Feito; ir: (i: number) => void; recomecar: () => void }) {
  const linhas: { feito: boolean; t: string; passo: number }[] = [
    { feito: feito.site, passo: 0, t: feito.site ? 'Uma pergunta das 23h foi respondida na mesma hora e virou pedido de reserva.' : 'Site com IA: ainda não visto.' },
    { feito: feito.google === ITENS_GOOGLE.length, passo: 1, t: `Perfil no Google: ${feito.google} de ${ITENS_GOOGLE.length} itens prontos.` },
    {
      feito: !!feito.ligacao,
      passo: 2,
      t: feito.ligacao === 'whatsapp' ? 'Uma ligação perdida virou conversa no WhatsApp e tarefa de retorno.' : feito.ligacao === 'tarefa' ? 'Uma ligação perdida virou tarefa de retorno (sem o 1, nenhuma mensagem).' : 'Ligação perdida: ainda não vista.',
    },
    {
      feito: !!feito.retomada,
      passo: 3,
      t: feito.retomada === 'ganho' ? 'Um pedido parado foi retomado sozinho e fechou com sinal de R$ 800 de R$ 3.200 (valores fictícios).' : feito.retomada === 'tarefa' ? 'Um pedido sem resposta virou tarefa para a recepção, sem insistir com o hóspede.' : 'Retomada: ainda não vista.',
    },
    { feito: feito.avaliacao, passo: 4, t: feito.avaliacao ? 'Um convite de avaliação saiu no check-out, com o botão do Google para todos.' : 'Avaliações: ainda não vistas.' },
  ];
  return (
    <div className="cartao p-5 sm:p-8">
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-marca">Resumo</p>
      <h2 className="mt-1 text-[27px] font-bold leading-[1.15] tracking-tight sm:text-[34px]">O que aconteceu nesta simulação</h2>
      <p className="mt-3 max-w-[62ch] text-[17px] leading-relaxed">No painel de verdade, o dono vê tudo isso junto: os pedidos, as conversas, as tarefas da equipe e os números do mês.</p>
      <ul className="mt-6 divide-y divide-linha rounded-xl border border-linha">
        {linhas.map((l) => (
          <li key={l.passo} className="flex items-start gap-3 p-3.5 sm:items-center">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full sm:mt-0 ${l.feito ? 'bg-ok text-white' : 'bg-fundo text-suave'}`}>{l.feito ? <Check /> : <span className="text-[12px] font-bold">{l.passo + 1}</span>}</span>
            <span className={`min-w-0 flex-1 text-[15.5px] leading-snug ${l.feito ? 'text-tinta' : 'text-suave'}`}>{l.t}</span>
            {!l.feito && <button type="button" className="shrink-0 text-[14px] font-semibold text-marca underline underline-offset-2" onClick={() => ir(l.passo)}>Ver</button>}
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="aviso border border-linha bg-fundo leading-relaxed">
          <p className="font-bold text-tinta">O que a gente não promete</p>
          <p className="mt-1">Número de reservas, faturamento ou 1º lugar no Google. Os números de uma pousada de verdade só aparecem depois que o sistema estiver funcionando nela.</p>
        </div>
        <div className="aviso border border-linha bg-fundo leading-relaxed">
          <p className="font-bold text-tinta">O que é da pousada</p>
          <p className="mt-1">O perfil no Google e o WhatsApp oficial continuam em nome da pousada. A gente entra como administrador, monta e configura.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link className="botao" href="/s/pousada-demo" target="_blank">Abrir o site de exemplo</Link>
        <Link className="botao-2" href="/login">Ver o painel (demonstração)</Link>
        <button type="button" className="botao-2" onClick={recomecar}>Recomeçar</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export function DemoServicos() {
  const [passo, setPasso] = useState(0);
  const [feito, setFeito] = useState<Feito>(INICIO);
  const [rodada, setRodada] = useState(0);
  const palco = useRef<HTMLDivElement>(null);
  const marcar: Marcar = (f) => setFeito((a) => ({ ...a, ...f }));
  const ir = (i: number) => {
    setPasso(i);
    const el = palco.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
  };
  const recomecar = () => {
    setFeito(INICIO);
    setRodada((r) => r + 1);
    ir(0);
  };
  const pronto = [feito.site, feito.google === ITENS_GOOGLE.length, !!feito.ligacao, !!feito.retomada, feito.avaliacao];
  const cenas = [CenaSite, CenaGoogle, CenaLigacao, CenaRetomada, CenaAvaliacao];

  return (
    <>
      <div className="mt-8 max-w-3xl sm:mt-12">
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-tight sm:text-[46px]">5 serviços que a Growlift monta para uma pousada</h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed sm:text-[18px]">
          Exemplo com a {EMPRESA}, que não existe. Aperte os botões para ver cada serviço funcionando. É uma simulação: nada é enviado e nada fica salvo.
        </p>
      </div>

      <nav aria-label="Serviços da demonstração" className="mt-7">
        <ol className="grid grid-cols-3 gap-2 lg:grid-cols-6">
          {PASSOS.map((nome, i) => {
            const atual = passo === i;
            const ok = i < 5 && pronto[i];
            return (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => ir(i)}
                  aria-current={atual ? 'step' : undefined}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center text-[12.5px] font-semibold leading-tight transition-colors sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-left sm:text-[14px] ${atual ? 'border-marca bg-marca-clara text-marca-escura' : 'border-linha bg-white text-tinta hover:border-[#c9d2df]'}`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${ok ? 'bg-ok text-white' : atual ? 'bg-marca text-white' : 'bg-fundo text-suave'}`}>{ok ? <Check /> : i < 5 ? i + 1 : <IconeLista />}</span>
                  {nome}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div ref={palco} className="mt-4 scroll-mt-4">
        {cenas.map((C, i) => (
          <div key={`${rodada}-${i}`} hidden={passo !== i}>
            <C marcar={marcar} />
          </div>
        ))}
        <div hidden={passo !== 5}>
          <Resumo feito={feito} ir={ir} recomecar={recomecar} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" className="botao-2" onClick={() => ir(passo - 1)} disabled={passo === 0} style={passo === 0 ? { visibility: 'hidden' } : undefined}>Anterior</button>
        {passo < 5 && (
          <button type="button" className="botao" onClick={() => ir(passo + 1)}>
            Próximo: {PASSOS[passo + 1]} <Seta />
          </button>
        )}
      </div>
    </>
  );
}
