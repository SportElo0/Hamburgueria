"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Info, RotateCcw } from "lucide-react";
import { site } from "@/config/site";
import { onBookingRequest } from "@/lib/booking-store";
import {
  dateStatus,
  formatLongDate,
  formatShortDate,
  isSlotValid,
  nowInShopTimezone,
  slotsFor,
  type ISODate,
  type Now,
} from "@/lib/schedule";
import { buildBookingMessage, cleanText, whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/brand";
import { FadeMark } from "@/components/fade-mark";
import { Calendar } from "./calendar";
import { Stepper, steps } from "./stepper";
import { TimePicker } from "./time-picker";

const SERVICE = 0;
const DATE = 1;
const TIME = 2;
const NAME = 3;
const REVIEW = 4;
const SENT = 5;

const dateProblems: Record<string, string> = {
  past: "Essa data já passou. Escolha outra.",
  closed: "A barbearia não abre nesse dia. Escolha outra data.",
  "too-far": "Essa data está fora do período de agendamento. Escolha uma data mais próxima.",
  "no-slots": "Não há mais horários de preferência hoje. Escolha outro dia.",
  invalid: "Data inválida. Escolha uma data no calendário.",
};

function validateName(raw: string): string | null {
  const name = cleanText(raw);
  if (!name) return "Digite seu primeiro nome para o Leonardo saber quem está pedindo.";
  if (name.length < 2) return "O nome precisa ter pelo menos 2 letras.";
  if (name.length > site.booking.nameMaxLength)
    return `Use até ${site.booking.nameMaxLength} caracteres.`;
  if (!/\p{L}/u.test(name)) return "Use letras no nome.";
  return null;
}

export function Booking() {
  const [now, setNow] = useState<Now | null>(null);
  const [step, setStep] = useState(SERVICE);
  const [reached, setReached] = useState(SERVICE);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<ISODate | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const userMoved = useRef(false);

  // "Agora" só existe no navegador (fuso de São Paulo); atualiza a cada minuto.
  useEffect(() => {
    const tick = () => setNow(nowInShopTimezone());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Botões "Agendar este serviço" em outras seções.
  useEffect(
    () =>
      onBookingRequest((requested) => {
        if (!requested) return;
        setServiceId(requested);
        setError(null);
        setStep((current) => (current === SERVICE || current === SENT ? DATE : current));
        setReached((r) => Math.max(r, DATE));
      }),
    [],
  );

  // Leva o foco ao título da etapa quando o usuário avança ou volta.
  useEffect(() => {
    if (!userMoved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const top = panelRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > window.innerHeight * 0.6) {
      panelRef.current?.scrollIntoView({ block: "start" });
    }
  }, [step]);

  const service = site.services.find((s) => s.id === serviceId) ?? null;
  const slots = useMemo(() => (date && now ? slotsFor(date, now) : []), [date, now]);

  // Se o relógio virar e o horário escolhido deixar de valer, avisa.
  const timeExpired = Boolean(date && time && now && !isSlotValid(date, time, now));

  const message = useMemo(
    () =>
      service && date && time
        ? buildBookingMessage({ name, serviceName: service.name, date, time, notes })
        : "",
    [service, date, time, name, notes],
  );

  const go = (target: number) => {
    userMoved.current = true;
    setError(null);
    setStep(target);
    setReached((r) => Math.max(r, target));
  };

  const validate = (current: number): string | null => {
    if (current >= SERVICE && !service) return "Escolha um serviço para continuar.";
    if (current >= DATE) {
      if (!date || !now) return "Escolha a data desejada no calendário.";
      const status = dateStatus(date, now);
      if (status !== "ok") return dateProblems[status];
    }
    if (current >= TIME) {
      if (!time) return "Escolha um horário de preferência.";
      if (date && now && !isSlotValid(date, time, now))
        return "Esse horário não está mais disponível para pedido. Escolha outro.";
    }
    if (current >= NAME) return validateName(name);
    return null;
  };

  const next = () => {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    go(step + 1);
  };

  const firstInvalidStep = (): number | null => {
    for (const s of [SERVICE, DATE, TIME, NAME]) if (validate(s)) return s;
    return null;
  };

  const reset = () => {
    setServiceId(null);
    setDate(null);
    setTime(null);
    setName("");
    setNotes("");
    setReached(SERVICE);
    setCopied(false);
    go(SERVICE);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar. Selecione o texto da mensagem e copie manualmente.");
    }
  };

  const heading = [
    "Qual serviço você quer?",
    "Para que dia?",
    "Qual horário você prefere?",
    "Como podemos te chamar?",
    "Confira o pedido",
    "Pedido pronto no WhatsApp",
  ][step];

  const summary = [service?.shortName, date ? formatShortDate(date) : null, time].filter(Boolean);

  return (
    <section
      id="agendar"
      aria-labelledby="agendar-title"
      className="relative scroll-mt-16 bg-fade-3 py-20 sm:py-28 lg:scroll-mt-[4.5rem] lg:py-32"
    >
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id="agendar-title" className="display text-[clamp(3rem,11vw,5rem)]">
              Agende seu horário
            </h2>
            <p className="mt-6 max-w-[40ch] text-[1.02rem] leading-relaxed text-paper/85">
              Monte o pedido em menos de um minuto. O site prepara a mensagem e abre o WhatsApp do{" "}
              {site.barberFirstName}; você só precisa enviar.
            </p>
            <p className="mt-6 flex max-w-[44ch] gap-3 border-t border-line pt-5 text-sm leading-relaxed text-steel">
              <Info size={18} className="mt-0.5 flex-none text-blue-ink" />
              <span>
                Isto é uma solicitação, não uma reserva. Não temos agenda online: o horário só fica
                garantido quando o {site.barberFirstName} responder confirmando.
              </span>
            </p>

            <dl className="mt-8 hidden border-t border-line lg:block">
              {[
                ["Serviço", service?.name],
                ["Data desejada", date ? formatLongDate(date) : null],
                ["Horário de preferência", time],
                ["Nome", cleanText(name) || null],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3.5"
                >
                  <dt className="text-sm text-steel">{label}</dt>
                  <dd
                    className={`tabular text-right text-sm font-semibold ${value ? "text-paper" : "text-steel-dim"}`}
                  >
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div
          ref={panelRef}
          className="scroll-mt-20 rounded-[4px] border border-line bg-fade-1 p-4 sm:p-8 lg:col-span-8 lg:p-10"
        >
          <Stepper current={step} reached={step === SENT ? -1 : reached} onSelect={go} />

          {summary.length > 0 && step < REVIEW && (
            <p className="tabular mt-5 text-sm text-steel lg:hidden">{summary.join(" · ")}</p>
          )}

          <div key={step} className="animate-step mt-8 sm:mt-10">
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="display text-[clamp(2.1rem,7vw,3.2rem)] outline-none"
            >
              {heading}
            </h3>

            <div className="mt-7">
              {step === SERVICE && (
                <div role="group" aria-label="Serviços" className="grid gap-2 sm:grid-cols-2">
                  {site.services.map((s) => {
                    const selected = serviceId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setServiceId(s.id);
                          setError(null);
                        }}
                        className={`group flex min-h-16 items-center justify-between gap-4 rounded-[3px] border px-4 py-3 text-left transition-colors duration-200 ${
                          selected
                            ? "border-blue bg-blue/12"
                            : "border-line-strong bg-fade-2 hover:border-steel"
                        }`}
                      >
                        <span className="flex items-center gap-3.5">
                          <FadeMark lit={s.mark} className="h-6 flex-none" />
                          <span className="font-semibold">{s.name}</span>
                        </span>
                        <span
                          aria-hidden
                          className={`grid size-6 flex-none place-items-center rounded-full border transition-colors ${
                            selected ? "border-blue bg-blue text-white" : "border-line-strong"
                          }`}
                        >
                          {selected && <Check size={14} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === DATE && (
                <div className="flex flex-col gap-5">
                  {now ? (
                    <Calendar
                      now={now}
                      value={date}
                      onChange={(d) => {
                        setDate(d);
                        setError(null);
                        if (time && !isSlotValid(d, time, now)) setTime(null);
                      }}
                    />
                  ) : (
                    <p className="text-steel">Carregando calendário…</p>
                  )}
                  {date && (
                    <p className="text-[0.95rem] font-semibold first-letter:uppercase">
                      {formatLongDate(date)}
                    </p>
                  )}
                  {!site.hours.confirmed && (
                    <p className="max-w-[56ch] text-xs leading-relaxed text-steel">
                      Os dias seguem o horário publicado no Instagram e ainda podem mudar. A
                      confirmação final vem pelo WhatsApp.
                    </p>
                  )}
                </div>
              )}

              {step === TIME && (
                <div className="flex flex-col gap-6">
                  <p className="max-w-[56ch] text-sm leading-relaxed text-steel">
                    Escolha o horário que fica melhor para você em{" "}
                    <strong className="font-semibold text-paper">
                      {date ? formatLongDate(date) : ""}
                    </strong>
                    . É uma preferência: o {site.barberFirstName} confirma se está livre ou sugere
                    outro.
                  </p>
                  {slots.length > 0 ? (
                    <TimePicker
                      slots={slots}
                      value={time}
                      onChange={(t) => {
                        setTime(t);
                        setError(null);
                      }}
                    />
                  ) : (
                    <p className="text-paper">
                      Não há horários de preferência para esse dia.{" "}
                      <button
                        type="button"
                        onClick={() => go(DATE)}
                        className="link-quiet font-semibold"
                      >
                        Escolher outra data
                      </button>
                    </p>
                  )}
                </div>
              )}

              {step === NAME && (
                <form
                  className="flex max-w-xl flex-col gap-6"
                  onSubmit={(event) => {
                    event.preventDefault();
                    next();
                  }}
                  noValidate
                >
                  <div className="flex flex-col gap-2">
                    <label htmlFor="booking-name" className="text-sm font-semibold">
                      Primeiro nome
                    </label>
                    <input
                      id="booking-name"
                      name="given-name"
                      type="text"
                      autoComplete="given-name"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      maxLength={site.booking.nameMaxLength}
                      value={name}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "booking-error" : undefined}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError(null);
                      }}
                      className="min-h-13 rounded-[3px] border border-line-strong bg-fade-0 px-4 text-base text-paper placeholder:text-steel-dim focus:border-blue-ink focus:outline-none aria-invalid:border-pole"
                      placeholder="Ex.: João"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="booking-notes" className="text-sm font-semibold">
                        Observação <span className="font-normal text-steel">(opcional)</span>
                      </label>
                      <span className="tabular text-xs text-steel">
                        {notes.length}/{site.booking.notesMaxLength}
                      </span>
                    </div>
                    <textarea
                      id="booking-notes"
                      rows={3}
                      maxLength={site.booking.notesMaxLength}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="resize-none rounded-[3px] border border-line-strong bg-fade-0 px-4 py-3 text-base leading-relaxed text-paper placeholder:text-steel-dim focus:border-blue-ink focus:outline-none"
                      placeholder="Ex.: degradê baixo, manter volume em cima"
                    />
                  </div>
                  <button type="submit" className="sr-only">
                    Continuar
                  </button>
                </form>
              )}

              {step === REVIEW && service && date && time && (
                <div className="flex flex-col gap-7">
                  <dl className="border-t border-line">
                    {[
                      { label: "Serviço", value: service.name, edit: SERVICE },
                      { label: "Data desejada", value: formatLongDate(date), edit: DATE },
                      { label: "Horário de preferência", value: time, edit: TIME },
                      { label: "Nome", value: cleanText(name), edit: NAME },
                      ...(cleanText(notes, { multiline: true })
                        ? [
                            {
                              label: "Observação",
                              value: cleanText(notes, { multiline: true }),
                              edit: NAME,
                            },
                          ]
                        : []),
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-b border-line py-4 sm:grid-cols-[12rem_1fr_auto]"
                      >
                        <dt className="text-sm text-steel">{row.label}</dt>
                        <dd className="tabular col-start-1 font-semibold break-words whitespace-pre-line first-letter:uppercase sm:col-start-2 sm:row-start-1">
                          {row.value}
                        </dd>
                        <dd className="col-start-2 row-span-2 row-start-1 self-center sm:col-start-3 sm:row-span-1">
                          <button
                            type="button"
                            onClick={() => go(row.edit)}
                            aria-label={`Alterar ${row.label.toLowerCase()}`}
                            className="link-quiet min-h-11 px-1 text-sm font-semibold"
                          >
                            Alterar
                          </button>
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p id="preview-label" className="text-sm font-semibold text-steel">
                        Mensagem que vai abrir no WhatsApp
                      </p>
                      <button
                        type="button"
                        onClick={copyMessage}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-[3px] px-2 text-sm font-semibold text-paper hover:bg-fade-3"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? "Copiada" : "Copiar"}
                      </button>
                    </div>
                    <blockquote
                      aria-labelledby="preview-label"
                      className="rounded-[3px] border border-line bg-fade-0 p-4 text-[0.92rem] leading-relaxed break-words whitespace-pre-line text-paper/90 sm:p-5"
                    >
                      {message}
                    </blockquote>
                  </div>

                  {timeExpired ? (
                    <p className="text-sm text-paper">
                      O horário escolhido já passou.{" "}
                      <button
                        type="button"
                        onClick={() => go(TIME)}
                        className="link-quiet font-semibold"
                      >
                        Escolher outro horário
                      </button>
                    </p>
                  ) : (
                    <a
                      href={whatsappLink(message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        const invalid = firstInvalidStep();
                        if (invalid !== null) {
                          event.preventDefault();
                          go(invalid);
                          setError(validate(invalid));
                          return;
                        }
                        userMoved.current = true;
                        setStep(SENT);
                        setReached(SENT);
                      }}
                      className="btn btn-primary min-h-14 w-full text-base sm:w-auto sm:self-start"
                    >
                      <WhatsAppIcon size={20} />
                      Solicitar agendamento pelo WhatsApp
                    </a>
                  )}
                  <p className="-mt-3 max-w-[60ch] text-xs leading-relaxed text-steel">
                    O WhatsApp abre com a mensagem pronta. Nada é enviado até você tocar em enviar
                    no próprio WhatsApp.
                  </p>
                </div>
              )}

              {step === SENT && (
                <div className="flex max-w-2xl flex-col gap-6">
                  <p className="text-[1.05rem] leading-relaxed text-paper/90">
                    Se a mensagem foi enviada, agora é só aguardar a resposta do{" "}
                    {site.barberFirstName}.{" "}
                    <strong className="font-semibold text-paper">
                      O horário só está garantido depois que ele confirmar
                    </strong>
                    ; se aquele horário estiver ocupado, ele sugere outro.
                  </p>
                  <p className="text-sm leading-relaxed text-steel">
                    O WhatsApp não abriu? Use o botão abaixo ou chame no {site.whatsapp.display}.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={whatsappLink(message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                    >
                      <WhatsAppIcon size={19} />
                      Abrir o WhatsApp de novo
                    </a>
                    <button type="button" onClick={reset} className="btn btn-ghost">
                      <RotateCcw size={17} />
                      Fazer outro pedido
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p
            id="booking-error"
            role="alert"
            aria-live="assertive"
            className="mt-5 min-h-6 text-sm font-semibold text-alert"
          >
            {error}
          </p>

          {step < REVIEW && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-5">
              {step > SERVICE ? (
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  className="btn min-h-12 px-3 text-steel hover:text-paper"
                >
                  <ArrowLeft size={18} />
                  Voltar
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={next}
                className="btn btn-primary min-h-12 flex-1 sm:flex-none"
              >
                {step === NAME ? "Revisar pedido" : "Continuar"}
                <ArrowRight size={18} className="nudge" />
              </button>
            </div>
          )}
          {step === REVIEW && (
            <div className="mt-4 border-t border-line pt-5">
              <button
                type="button"
                onClick={() => go(NAME)}
                className="btn min-h-12 px-3 text-steel hover:text-paper"
              >
                <ArrowLeft size={18} />
                Voltar
              </button>
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {`Etapa ${step + 1} de ${steps.length}: ${steps[step].label}`}
          </p>
        </div>
      </div>
    </section>
  );
}
