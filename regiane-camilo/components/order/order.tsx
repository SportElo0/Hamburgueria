"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  Check,
  Copy,
  Heart,
  PartyPopper,
  PenLine,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { occasions, products, site, type OccasionId } from "@/config/site";
import { dateStatus, formatLongDate, todayInShop, type ISODate } from "@/lib/dates";
import {
  buildOrderMessage,
  cleanText,
  emptyDraft,
  guestsNumber,
  occasionLabel,
  styleLabel,
  validateName,
  whatsappLink,
  type OrderDraft,
  type StyleChoice,
} from "@/lib/order";
import { onOrderRequest, type OrderRequest } from "@/lib/order-store";
import { WhatsAppIcon } from "@/components/brand";
import { Photo } from "@/components/photo";
import { Calendar } from "./calendar";
import { Convite } from "./convite";
import { Stepper, steps } from "./stepper";

const OCASIAO = 0;
const ESTILO = 1;
const DETALHES = 2;
const DATA = 3;
const ENVIAR = 4;
const ENVIADO = 5;

const occasionIcons: Record<OccasionId, typeof Cake> = {
  aniversario: Cake,
  infantil: PartyPopper,
  casamento: Heart,
  comemoracao: Sparkles,
  outra: PenLine,
};

type FieldError = { field: string; text: string } | null;

const dateProblems: Record<string, string> = {
  past: "Essa data já passou. Escolha outra.",
  "too-soon": "Essa data está muito em cima da hora. Escolha um dia a partir de amanhã.",
  "too-far": "Essa data está longe demais para pedir agora. Escolha uma data mais próxima.",
  invalid: "Data inválida. Escolha uma data no calendário.",
};

function sameStyle(a: StyleChoice | null, b: StyleChoice) {
  if (!a || a.kind !== b.kind) return false;
  return a.kind !== "reference" || (b.kind === "reference" && a.productId === b.productId);
}

/** Primeira etapa que ainda falta preencher depois de um pedido vindo de outra seção. */
function targetStep(draft: OrderDraft): number {
  if (!draft.occasion) return OCASIAO;
  if (!draft.style) return ESTILO;
  return DETALHES;
}

export function Order() {
  const [today, setToday] = useState<ISODate | null>(null);
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft);
  const [step, setStep] = useState(OCASIAO);
  const [reached, setReached] = useState(OCASIAO);
  const [error, setError] = useState<FieldError>(null);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const userMoved = useRef(false);
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // "Hoje" só existe no navegador, no fuso de São Sebastião.
  useEffect(() => {
    const tick = () => setToday(todayInShop());
    tick();
    const id = window.setInterval(tick, 10 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  const go = (target: number) => {
    userMoved.current = true;
    setError(null);
    setCopied(false);
    setStep(target);
    setReached((r) => Math.max(r, Math.min(target, ENVIAR)));
  };

  // Ocasiões da abertura e "quero um parecido" da galeria preenchem o convite.
  useEffect(
    () =>
      onOrderRequest((request: OrderRequest) => {
        if (!request.occasion && !request.productId) return;
        const next: OrderDraft = {
          ...draftRef.current,
          ...(request.occasion ? { occasion: request.occasion } : {}),
          ...(request.productId
            ? { style: { kind: "reference", productId: request.productId } as StyleChoice }
            : {}),
        };
        setDraft(next);
        setError(null);
        setStep(targetStep(next));
        setReached((r) => Math.max(r, targetStep(next)));
      }),
    [],
  );

  // Leva o foco ao título da etapa quando a cliente avança ou volta.
  useEffect(() => {
    if (!userMoved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const top = panelRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight * 0.6) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panelRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [step]);

  const update = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (error?.field === key) setError(null);
  };

  const message = useMemo(() => buildOrderMessage(draft), [draft]);

  const validate = (current: number): FieldError => {
    if (current >= OCASIAO && !draft.occasion)
      return { field: "occasion", text: "Escolha a ocasião para continuar." };
    if (current >= ESTILO && !draft.style)
      return { field: "style", text: "Escolha um bolo de referência ou uma das opções abaixo." };
    if (current >= DETALHES && draft.guests.trim() && !guestsNumber(draft.guests))
      return {
        field: "guests",
        text: `Informe um número de pessoas entre 1 e ${site.order.maxGuests}, ou deixe em branco.`,
      };
    if (current >= DATA) {
      if (!draft.date || !today) return { field: "date", text: "Escolha a data desejada no calendário." };
      const status = dateStatus(draft.date, today);
      if (status !== "ok") return { field: "date", text: dateProblems[status] };
      const nameError = validateName(draft.name);
      if (nameError) return { field: "name", text: nameError };
    }
    return null;
  };

  const focusField = (field: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`pedido-${field}`)?.focus();
    });
  };

  const next = () => {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      focusField(problem.field);
      return;
    }
    go(step + 1);
  };

  const reset = () => {
    setDraft(emptyDraft);
    setReached(OCASIAO);
    go(OCASIAO);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const errorFor = (field: string) =>
    error?.field === field ? (
      <p id={`pedido-${field}-erro`} role="alert" className="mt-3 text-[0.9375rem] font-semibold text-rose">
        {error.text}
      </p>
    ) : null;

  const occasionDone = Boolean(draft.occasion);
  const headings = [
    { title: "Qual é a ocasião?", hint: "A ocasião ajuda a Regiane a entender o pedido. Ela confirma o que é possível pelo WhatsApp." },
    { title: "Qual estilo você imagina?", hint: "Escolha um bolo da galeria como referência ou conte que quer algo seu. A foto é um ponto de partida: cada bolo é feito sob encomenda e pode ter diferenças." },
    { title: "Conte os detalhes.", hint: "Tudo aqui é opcional, mas ajuda no orçamento. Tamanho, sabores e valor são combinados com a Regiane." },
    { title: "Para quando, e para quem?", hint: "Escolher a data não reserva o dia: a Regiane confirma a disponibilidade pelo WhatsApp." },
    { title: "Confira e envie.", hint: "A mensagem abre no seu WhatsApp, pronta para enviar. O pedido só fica combinado depois da resposta da Regiane." },
  ];
  const heading = headings[Math.min(step, ENVIAR)];

  return (
    <section id="personalize" aria-labelledby="personalize-title" className="bg-cocoa text-cream">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="personalize-title"
            data-reveal
            className="serif text-[clamp(2.4rem,4.6vw,3.8rem)] text-cream lg:col-span-6"
          >
            Personalize <em className="text-rose">seu bolo</em>.
          </h2>
          <p data-reveal className="max-w-[48ch] text-[1.0625rem] leading-relaxed text-on-cocoa-muted lg:col-span-5 lg:col-start-8">
            Escolha a ocasião, o estilo e a data. O convite vira uma mensagem pronta para a
            Regiane no WhatsApp. Valor e disponibilidade são combinados com ela.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          <div ref={panelRef} className="scroll-mt-28 lg:col-span-7">
            {step < ENVIADO ? (
              <>
                <Stepper current={step} reached={reached} onGo={go} />

                <div key={step} className="animate-step mt-9">
                  <h3
                    ref={headingRef}
                    tabIndex={-1}
                    className="serif text-[clamp(1.9rem,3vw,2.4rem)] text-cream outline-none"
                  >
                    {heading.title}
                  </h3>
                  <p className="mt-2 max-w-[56ch] text-[0.9375rem] leading-relaxed text-on-cocoa-muted">
                    {heading.hint}
                  </p>

                  <div className="mt-7">
                    {step === OCASIAO && (
                      <>
                        <div
                          id="pedido-occasion"
                          tabIndex={-1}
                          role="group"
                          aria-label="Ocasião"
                          aria-describedby={error?.field === "occasion" ? "pedido-occasion-erro" : undefined}
                          className="grid grid-cols-1 gap-3 outline-none min-[420px]:grid-cols-2 xl:grid-cols-3"
                        >
                          {occasions.map((occasion) => {
                            const Icon = occasionIcons[occasion.id];
                            const selected = draft.occasion === occasion.id;
                            return (
                              <button
                                key={occasion.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => update("occasion", occasion.id)}
                                className={`flex min-h-16 items-center gap-3.5 rounded-2xl border px-4 py-3 text-left text-[1rem] transition-colors duration-300 ${
                                  selected
                                    ? "border-cream bg-cream text-cocoa"
                                    : "border-cocoa-line text-cream hover:border-on-cocoa-muted"
                                }`}
                              >
                                <span
                                  className={`grid size-10 flex-none place-items-center rounded-full ${
                                    selected ? "bg-cocoa text-cream" : "bg-cocoa-deep text-rose"
                                  }`}
                                >
                                  {selected ? <Check size={18} /> : <Icon size={18} strokeWidth={1.6} />}
                                </span>
                                {occasion.name}
                              </button>
                            );
                          })}
                        </div>
                        {draft.occasion === "outra" && (
                          <Field label="Qual é a ocasião?" htmlFor="pedido-occasionOther" optional className="mt-6 max-w-md">
                            <input
                              id="pedido-occasionOther"
                              value={draft.occasionOther}
                              maxLength={site.order.textMaxLength}
                              onChange={(e) => update("occasionOther", e.target.value)}
                              placeholder="Ex.: chá revelação, formatura, batizado"
                              className="field"
                            />
                          </Field>
                        )}
                        {errorFor("occasion")}
                      </>
                    )}

                    {step === ESTILO && (
                      <>
                        <div
                          id="pedido-style"
                          tabIndex={-1}
                          role="group"
                          aria-label="Bolo de referência"
                          className="grid grid-cols-2 gap-3 outline-none sm:grid-cols-3"
                        >
                          {products.map((product) => {
                            const choice: StyleChoice = { kind: "reference", productId: product.id };
                            const selected = sameStyle(draft.style, choice);
                            return (
                              <button
                                key={product.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => update("style", choice)}
                                className="group text-left"
                              >
                                <span
                                  className={`relative block overflow-hidden rounded-xl ring-offset-2 ring-offset-cocoa transition-shadow duration-300 ${
                                    selected ? "ring-2 ring-rose" : "ring-0"
                                  }`}
                                >
                                  <Photo
                                    photo={product.photo}
                                    sizes="(min-width: 1024px) 14vw, (min-width: 640px) 28vw, 44vw"
                                    className="aspect-[4/5] w-full"
                                    imgClassName="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                                  />
                                  {selected && (
                                    <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-rose text-cocoa-deep">
                                      <Check size={16} strokeWidth={2.4} aria-hidden />
                                    </span>
                                  )}
                                </span>
                                <span className={`mt-2 block text-[0.9375rem] ${selected ? "font-semibold text-cream" : "text-on-cocoa-muted group-hover:text-cream"}`}>
                                  {product.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(
                            [
                              { choice: { kind: "custom" }, title: "Tenho uma ideia minha", text: "Vou explicar o que imagino.", Icon: PenLine },
                              { choice: { kind: "suggest" }, title: "Quero sugestões", text: "Ainda não sei, me ajude a escolher.", Icon: Wand2 },
                            ] as { choice: StyleChoice; title: string; text: string; Icon: typeof Cake }[]
                          ).map(({ choice, title, text, Icon }) => {
                            const selected = sameStyle(draft.style, choice);
                            return (
                              <button
                                key={choice.kind}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => update("style", choice)}
                                className={`flex min-h-16 items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition-colors duration-300 ${
                                  selected
                                    ? "border-cream bg-cream text-cocoa"
                                    : "border-cocoa-line text-cream hover:border-on-cocoa-muted"
                                }`}
                              >
                                <span
                                  className={`grid size-10 flex-none place-items-center rounded-full ${
                                    selected ? "bg-cocoa text-cream" : "bg-cocoa-deep text-rose"
                                  }`}
                                >
                                  {selected ? <Check size={18} /> : <Icon size={18} strokeWidth={1.6} />}
                                </span>
                                <span>
                                  <span className="block text-[1rem] font-semibold">{title}</span>
                                  <span className={`block text-[0.875rem] ${selected ? "text-cocoa/80" : "text-on-cocoa-muted"}`}>
                                    {text}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {errorFor("style")}
                      </>
                    )}

                    {step === DETALHES && (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field
                          label="Quantidade aproximada de pessoas"
                          htmlFor="pedido-guests"
                          optional
                          className="sm:col-span-2"
                          after={errorFor("guests")}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              id="pedido-guests"
                              inputMode="numeric"
                              autoComplete="off"
                              value={draft.guests}
                              maxLength={4}
                              onChange={(e) => update("guests", e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="Ex.: 25"
                              aria-invalid={error?.field === "guests"}
                              aria-describedby={error?.field === "guests" ? "pedido-guests-erro" : undefined}
                              className="field tabular w-32"
                            />
                            {[10, 20, 30, 50].map((n) => (
                              <button
                                key={n}
                                type="button"
                                aria-pressed={draft.guests === String(n)}
                                onClick={() => update("guests", String(n))}
                                className={`tabular min-h-11 rounded-full border px-4 text-[0.9375rem] transition-colors ${
                                  draft.guests === String(n)
                                    ? "border-cream bg-cream text-cocoa"
                                    : "border-cocoa-line text-cream hover:border-on-cocoa-muted"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </Field>
                        <Field label="Tema ou decoração" htmlFor="pedido-theme" optional>
                          <input
                            id="pedido-theme"
                            value={draft.theme}
                            maxLength={site.order.textMaxLength}
                            onChange={(e) => update("theme", e.target.value)}
                            placeholder="Ex.: flores, futebol, cores da festa"
                            className="field"
                          />
                        </Field>
                        <Field
                          label="Sabor ou recheio de preferência"
                          htmlFor="pedido-flavor"
                          optional
                          hint="As opções são combinadas com a Regiane."
                        >
                          <input
                            id="pedido-flavor"
                            value={draft.flavor}
                            maxLength={site.order.textMaxLength}
                            onChange={(e) => update("flavor", e.target.value)}
                            placeholder="Ex.: o que ela sugerir"
                            aria-describedby="pedido-flavor-dica"
                            className="field"
                          />
                        </Field>
                        <Field label="Mensagem no bolo" htmlFor="pedido-cakeMessage" optional>
                          <input
                            id="pedido-cakeMessage"
                            value={draft.cakeMessage}
                            maxLength={site.order.textMaxLength}
                            onChange={(e) => update("cakeMessage", e.target.value)}
                            placeholder="Ex.: Parabéns, Ana!"
                            className="field"
                          />
                        </Field>
                        <Field label="Observações" htmlFor="pedido-notes" optional>
                          <textarea
                            id="pedido-notes"
                            value={draft.notes}
                            rows={3}
                            maxLength={site.order.notesMaxLength}
                            onChange={(e) => update("notes", e.target.value)}
                            placeholder="Algo mais que a Regiane precise saber"
                            className="field min-h-[3.25rem] resize-y py-3"
                          />
                        </Field>
                      </div>
                    )}

                    {step === DATA && (
                      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[auto_1fr]">
                        <div>
                          <div
                            id="pedido-date"
                            tabIndex={-1}
                            aria-describedby={error?.field === "date" ? "pedido-date-erro" : undefined}
                            className="outline-none"
                          >
                            {today ? (
                              <Calendar
                                today={today}
                                value={draft.date}
                                onChange={(date) => update("date", date)}
                              />
                            ) : (
                              <p className="text-on-cocoa-muted">Carregando o calendário…</p>
                            )}
                          </div>
                          {draft.date && (
                            <p className="mt-4 text-[0.9375rem] text-cream first-letter:uppercase">
                              {formatLongDate(draft.date)}
                            </p>
                          )}
                          {errorFor("date")}
                        </div>
                        <Field
                          label="Seu nome"
                          htmlFor="pedido-name"
                          hint="Não pedimos telefone: a mensagem sai do seu próprio WhatsApp."
                          after={errorFor("name")}
                        >
                          <input
                            id="pedido-name"
                            value={draft.name}
                            autoComplete="given-name"
                            maxLength={site.order.nameMaxLength}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="Como você se chama?"
                            aria-invalid={error?.field === "name"}
                            aria-describedby={`pedido-name-dica${error?.field === "name" ? " pedido-name-erro" : ""}`}
                            className="field"
                          />
                        </Field>
                      </div>
                    )}

                    {step === ENVIAR && (
                      <>
                        <dl className="border-t border-cocoa-line">
                          {[
                            { label: "Ocasião", value: occasionLabel(draft), at: OCASIAO },
                            { label: "Estilo", value: styleLabel(draft.style), at: ESTILO },
                            {
                              label: "Pessoas",
                              value: guestsNumber(draft.guests) ? `Cerca de ${guestsNumber(draft.guests)}` : null,
                              at: DETALHES,
                            },
                            { label: "Tema", value: cleanText(draft.theme) || null, at: DETALHES },
                            { label: "Sabor ou recheio", value: cleanText(draft.flavor) || null, at: DETALHES },
                            { label: "Mensagem no bolo", value: cleanText(draft.cakeMessage) || null, at: DETALHES },
                            { label: "Observações", value: cleanText(draft.notes, { multiline: true }) || null, at: DETALHES },
                            { label: "Data desejada", value: draft.date ? formatLongDate(draft.date) : null, at: DATA },
                            { label: "Nome", value: cleanText(draft.name) || null, at: DATA },
                          ].map((row) => (
                            <div key={row.label} className="grid grid-cols-[7.5rem_1fr_auto] items-baseline gap-3 border-b border-cocoa-line py-3 sm:grid-cols-[10rem_1fr_auto]">
                              <dt className="text-[0.875rem] text-on-cocoa-muted">{row.label}</dt>
                              <dd className={`text-[0.9375rem] whitespace-pre-line ${row.value ? "text-cream" : "text-on-cocoa-muted/80 italic"}`}>
                                {row.value ?? "A combinar"}
                              </dd>
                              <dd>
                                <button
                                  type="button"
                                  onClick={() => go(row.at)}
                                  aria-label={`Alterar ${row.label.toLowerCase()}`}
                                  className="min-h-11 px-1 text-[0.875rem] font-semibold text-rose hover:text-cream"
                                >
                                  Alterar
                                </button>
                              </dd>
                            </div>
                          ))}
                          <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[10rem_1fr]">
                            <dt className="text-[0.875rem] text-on-cocoa-muted">Valor</dt>
                            <dd className="text-[0.9375rem] font-semibold text-cream">
                              A combinar com a confeitaria
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                          <a
                            href={whatsappLink(message)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => {
                              const problem = validate(DATA);
                              if (problem) {
                                event.preventDefault();
                                setError(problem);
                                return;
                              }
                              go(ENVIADO);
                            }}
                            className="btn btn-cream min-h-14 px-7"
                          >
                            <WhatsAppIcon size={19} />
                            Solicitar orçamento pelo WhatsApp
                          </a>
                          <button type="button" onClick={copyMessage} className="btn btn-outline-cream">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? "Mensagem copiada" : "Copiar mensagem"}
                          </button>
                        </div>
                        <p aria-live="polite" className="sr-only">
                          {copied ? "Mensagem copiada." : ""}
                        </p>

                        <details className="group mt-6 rounded-2xl border border-cocoa-line">
                          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[0.9375rem] font-semibold text-cream [&::-webkit-details-marker]:hidden">
                            Ver a mensagem que será enviada
                            <ArrowRight size={16} className="rotate-90 transition-transform group-open:-rotate-90" aria-hidden />
                          </summary>
                          <pre className="border-t border-cocoa-line px-4 py-4 font-sans text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-on-cocoa-muted">
                            {message}
                          </pre>
                        </details>
                      </>
                    )}
                  </div>

                  {step < ENVIAR && (
                    <div className="mt-10 flex items-center gap-3">
                      {step > OCASIAO && (
                        <button type="button" onClick={() => go(step - 1)} className="btn btn-outline-cream px-5">
                          <ArrowLeft size={16} />
                          Voltar
                        </button>
                      )}
                      <button type="button" onClick={next} className="btn btn-cream ml-auto px-7">
                        {step === DATA ? "Revisar pedido" : "Continuar"}
                        <ArrowRight size={16} className="nudge" />
                      </button>
                    </div>
                  )}
                  {step === ENVIAR && (
                    <button type="button" onClick={() => go(DATA)} className="btn btn-outline-cream mt-8 px-5">
                      <ArrowLeft size={16} />
                      Voltar
                    </button>
                  )}
                  {step === OCASIAO && !occasionDone && (
                    <p className="mt-4 text-[0.875rem] text-on-cocoa-muted">
                      {steps.length} etapas curtas. Nada é enviado sem você tocar no botão do WhatsApp.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="animate-step">
                <span className="grid size-14 place-items-center rounded-full bg-rose text-cocoa-deep">
                  <WhatsAppIcon size={26} />
                </span>
                <h3
                  ref={headingRef}
                  tabIndex={-1}
                  className="serif mt-6 text-[clamp(2rem,3.2vw,2.6rem)] text-cream outline-none"
                >
                  Sua mensagem está pronta no WhatsApp.
                </h3>
                <p className="mt-3 max-w-[50ch] text-[1.0625rem] leading-relaxed text-on-cocoa-muted">
                  Envie por lá. O pedido ainda não está confirmado: a Regiane responde com as
                  possibilidades, o tamanho e o valor. Se o WhatsApp não abriu, use o botão abaixo.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="btn btn-cream">
                    <WhatsAppIcon size={18} />
                    Abrir o WhatsApp de novo
                  </a>
                  <button type="button" onClick={() => go(ENVIAR)} className="btn btn-outline-cream">
                    Revisar o pedido
                  </button>
                  <button type="button" onClick={reset} className="btn btn-outline-cream">
                    <RotateCcw size={16} />
                    Fazer outro pedido
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`lg:col-span-5 ${step === ENVIAR ? "hidden lg:block" : ""}`}>
            <div className="lg:sticky lg:top-32">
              <p className="mb-4 text-[0.875rem] text-on-cocoa-muted lg:hidden">Seu pedido até aqui</p>
              <div className="lg:rotate-[1.2deg]">
                <Convite draft={draft} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  hint,
  className = "",
  after,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-2 text-[0.9375rem] font-semibold text-cream">
        {label}
        {optional && <span className="text-[0.8125rem] font-normal text-on-cocoa-muted">opcional</span>}
      </label>
      {children}
      {hint && (
        <p id={`${htmlFor}-dica`} className="mt-2 text-[0.8125rem] leading-snug text-on-cocoa-muted">
          {hint}
        </p>
      )}
      {after}
    </div>
  );
}
