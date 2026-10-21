"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Copy, Info, RotateCcw } from "lucide-react";
import { site } from "@/config/site";
import { onBookingRequest } from "@/lib/booking-store";
import {
  dateStatus,
  formatLongDate,
  isSlotValid,
  nowInShopTimezone,
  slotsFor,
  type ISODate,
  type Now,
} from "@/lib/schedule";
import { buildBookingMessage, cleanText, whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/brand";
import { Calendar } from "./calendar";
import { Stepper, steps } from "./stepper";
import { TimePicker } from "./time-picker";

const SERVICE = 0;
const WHEN = 1;
const SEND = 2;
const SENT = 3;

const dateProblems: Record<string, string> = {
  past: "Essa data já passou. Escolha outra.",
  closed: "A barbearia não abre nesse dia. Escolha outra data.",
  "too-far": "Essa data está fora do período de agendamento. Escolha uma data mais próxima.",
  "no-slots": "Não há mais horários de preferência hoje. Escolha outro dia.",
  invalid: "Data inválida. Escolha uma data no calendário.",
};

function validateName(raw: string): string | null {
  const name = cleanText(raw);
  if (!name)
    return `Digite seu primeiro nome para o ${site.barberFirstName} saber quem está pedindo.`;
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
  const timesRef = useRef<HTMLDivElement>(null);

  // "Agora" só existe no navegador (fuso de São Paulo); atualiza a cada minuto.
  useEffect(() => {
    const tick = () => setNow(nowInShopTimezone());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Botões "Agendar" de outras seções, com ou sem serviço escolhido.
  useEffect(
    () =>
      onBookingRequest((requested) => {
        if (!requested) return;
        setServiceId(requested);
        setError(null);
        setStep((current) => (current === SERVICE || current === SENT ? WHEN : current));
        setReached((r) => Math.max(r, WHEN));
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
    if (!service) return "Escolha um serviço para continuar.";
    if (current >= WHEN) {
      if (!date || !now) return "Escolha a data desejada no calendário.";
      const status = dateStatus(date, now);
      if (status !== "ok") return dateProblems[status];
      if (!time) return "Escolha um horário de preferência.";
      if (!isSlotValid(date, time, now))
        return "Esse horário não está mais disponível para pedido. Escolha outro.";
    }
    if (current >= SEND) return validateName(name);
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
    for (const s of [SERVICE, WHEN, SEND]) if (validate(s)) return s;
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

  // Erro do nome aparece junto do campo; os demais, na área geral do painel.
  const nameError = step === SEND && error !== null && error === validateName(name) ? error : null;

  const heading = [
    "Qual serviço você quer?",
    "Para quando?",
    "Quase lá.",
    "Pedido pronto no WhatsApp.",
  ][step];

  const summary = [
    { label: "Serviço", value: service?.name ?? null, edit: SERVICE },
    { label: "Data desejada", value: date ? formatLongDate(date) : null, edit: WHEN },
    { label: "Horário de preferência", value: time, edit: WHEN },
  ];

  return (
    <section
      id="agendar"
      aria-labelledby="agendar-title"
      className="scroll-mt-20 bg-ground py-24 sm:py-28 lg:py-36"
    >
      <div className="mx-auto grid grid-cols-1 max-w-[88rem] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <h2 id="agendar-title" className="serif text-[clamp(2.75rem,8vw,4.25rem)]">
              Agende seu <em className="text-champagne-deep italic">horário.</em>
            </h2>
            <span aria-hidden className="risca mt-7" />
            <p className="mt-7 max-w-[38ch] text-[1.0625rem] leading-relaxed text-graphite">
              Três passos rápidos. O site monta a mensagem e abre o WhatsApp do{" "}
              {site.barberFirstName}; você só precisa enviar.
            </p>
            <p className="mt-7 flex max-w-[42ch] gap-3 border-l border-champagne pl-4 text-[0.95rem] leading-relaxed text-graphite">
              <Info size={18} strokeWidth={1.5} className="mt-0.5 flex-none text-champagne-text" />
              <span>
                É uma solicitação, não uma reserva. O horário só fica garantido quando o{" "}
                {site.barberFirstName} responder confirmando.
              </span>
            </p>

            <dl className="mt-10 hidden border-t border-line lg:block">
              {[...summary, { label: "Nome", value: cleanText(name) || null, edit: SEND }].map(
                (row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3.5"
                  >
                    <dt className="text-sm text-muted">{row.label}</dt>
                    <dd
                      className={`tabular text-right text-sm font-semibold first-letter:uppercase ${
                        row.value ? "text-ink" : "text-[#a39c90]"
                      }`}
                    >
                      {row.value ?? "—"}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        </div>

        <div
          ref={panelRef}
          className="scroll-mt-24 border border-line bg-paper p-5 sm:p-8 lg:col-span-8 lg:p-12"
        >
          <Stepper
            current={Math.min(step, SEND)}
            reached={step === SENT ? -1 : reached}
            onSelect={go}
          />

          <div key={step} className="animate-step mt-10">
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="serif text-[clamp(2rem,6vw,2.75rem)] outline-none"
            >
              {heading}
            </h3>

            <div className="mt-8">
              {step === SERVICE && (
                <div role="group" aria-label="Serviços" className="grid gap-3 sm:grid-cols-2">
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
                        className={`flex min-h-20 items-center gap-4 border p-2.5 pr-4 text-left transition-colors duration-200 ${
                          selected ? "border-ink bg-ground" : "border-line hover:border-ink"
                        }`}
                      >
                        <span className="relative h-16 w-13 flex-none overflow-hidden bg-ink">
                          {s.photo?.src ? (
                            <Image
                              src={s.photo.src}
                              alt=""
                              fill
                              sizes="52px"
                              style={{ objectPosition: s.photo.focus ?? "50% 50%" }}
                              className="object-cover"
                            />
                          ) : (
                            <span className="serif absolute inset-0 grid place-items-center text-lg text-champagne-soft">
                              LM
                            </span>
                          )}
                        </span>
                        <span className="flex-1 text-[1.02rem] font-semibold">{s.name}</span>
                        <span
                          aria-hidden
                          className={`grid size-6 flex-none place-items-center rounded-full border transition-colors ${
                            selected ? "border-ink bg-ink text-ground" : "border-line-strong"
                          }`}
                        >
                          {selected && <Check size={14} strokeWidth={2.5} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === WHEN && (
                <div className="grid gap-10 xl:grid-cols-2">
                  <div>
                    {now ? (
                      <Calendar
                        now={now}
                        value={date}
                        onChange={(d) => {
                          setDate(d);
                          setError(null);
                          if (time && !isSlotValid(d, time, now)) setTime(null);
                          // Com calendário e horários empilhados, leva o olhar até os horários.
                          if (window.matchMedia("(max-width: 1279px)").matches) {
                            const reduce = window.matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches;
                            requestAnimationFrame(() =>
                              timesRef.current?.scrollIntoView({
                                behavior: reduce ? "auto" : "smooth",
                                block: "start",
                              }),
                            );
                          }
                        }}
                      />
                    ) : (
                      <p className="text-muted">Carregando calendário…</p>
                    )}
                    {!site.hours.confirmed && (
                      <p className="mt-4 max-w-[52ch] text-[0.8125rem] leading-relaxed text-muted">
                        Os dias seguem o horário publicado no Instagram e ainda podem mudar.
                      </p>
                    )}
                  </div>

                  <div ref={timesRef} className="scroll-mt-28 xl:border-l xl:border-line xl:pl-10">
                    <p className="label text-ink">Horário de preferência</p>
                    {date ? (
                      <>
                        <p className="mt-2 text-[0.95rem] text-muted first-letter:uppercase">
                          {formatLongDate(date)}
                        </p>
                        <div className="mt-5">
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
                            <p className="text-graphite">
                              Não há horários de preferência para esse dia.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                        Escolha um dia no calendário para ver os horários.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === SEND && service && date && time && (
                <div className="grid gap-10 lg:grid-cols-2">
                  <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => event.preventDefault()}
                    noValidate
                  >
                    <div className="flex flex-col gap-2">
                      <label htmlFor="booking-name" className="label text-ink">
                        Primeiro nome
                      </label>
                      <input
                        id="booking-name"
                        name="given-name"
                        type="text"
                        autoComplete="given-name"
                        autoCapitalize="words"
                        enterKeyHint="done"
                        maxLength={site.booking.nameMaxLength}
                        value={name}
                        aria-invalid={Boolean(nameError)}
                        aria-describedby={nameError ? "booking-name-error" : undefined}
                        onChange={(event) => {
                          setName(event.target.value);
                          setError(null);
                        }}
                        className="min-h-13 border border-line-strong bg-paper px-4 text-base text-ink placeholder:text-[#8f887d] focus:border-ink focus:outline-none aria-invalid:border-alert"
                        placeholder="Ex.: João"
                      />
                      {nameError && (
                        <p
                          id="booking-name-error"
                          role="alert"
                          className="text-[0.95rem] font-semibold text-alert"
                        >
                          {nameError}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between">
                        <label htmlFor="booking-notes" className="label text-ink">
                          Observação{" "}
                          <span className="font-normal tracking-normal normal-case text-muted">
                            (opcional)
                          </span>
                        </label>
                        <span className="tabular text-[0.8125rem] text-muted">
                          {notes.length}/{site.booking.notesMaxLength}
                        </span>
                      </div>
                      <textarea
                        id="booking-notes"
                        rows={3}
                        maxLength={site.booking.notesMaxLength}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="resize-none border border-line-strong bg-paper px-4 py-3 text-base leading-relaxed text-ink placeholder:text-[#8f887d] focus:border-ink focus:outline-none"
                        placeholder="Ex.: degradê baixo, manter volume em cima"
                      />
                    </div>
                  </form>

                  <div className="flex flex-col gap-6">
                    <dl className="border-t border-line">
                      {summary.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-4 border-b border-line py-3"
                        >
                          <div>
                            <dt className="text-[0.8125rem] text-muted">{row.label}</dt>
                            <dd className="tabular mt-0.5 font-semibold first-letter:uppercase">
                              {row.value}
                            </dd>
                          </div>
                          <button
                            type="button"
                            onClick={() => go(row.edit)}
                            aria-label={`Alterar ${row.label.toLowerCase()}`}
                            className="min-h-11 px-1 text-sm font-semibold text-graphite"
                          >
                            <span className="link-line">Alterar</span>
                          </button>
                        </div>
                      ))}
                    </dl>

                    <details className="group border border-line">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                        Ver a mensagem que vai para o WhatsApp
                        <span
                          aria-hidden
                          className="text-champagne transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <div className="border-t border-line px-4 py-4">
                        <p className="text-[0.9rem] leading-relaxed break-words whitespace-pre-line text-graphite">
                          {message}
                        </p>
                        <button
                          type="button"
                          onClick={copyMessage}
                          className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink"
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} strokeWidth={1.5} />}
                          {copied ? "Mensagem copiada" : "Copiar mensagem"}
                        </button>
                      </div>
                    </details>
                  </div>

                  <div className="flex flex-col gap-3 lg:col-span-2">
                    {timeExpired ? (
                      <p className="text-graphite">
                        O horário escolhido já passou.{" "}
                        <button
                          type="button"
                          onClick={() => go(WHEN)}
                          className="link-line font-semibold text-ink"
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
                            const problem = validate(invalid);
                            if (invalid !== SEND) go(invalid);
                            else document.getElementById("booking-name")?.focus();
                            setError(problem);
                            return;
                          }
                          userMoved.current = true;
                          setStep(SENT);
                          setReached(SENT);
                        }}
                        className="btn btn-solid min-h-14 w-full"
                      >
                        <WhatsAppIcon size={19} />
                        Solicitar agendamento pelo WhatsApp
                      </a>
                    )}
                    <p className="text-[0.8125rem] leading-relaxed text-muted">
                      O WhatsApp abre com a mensagem pronta. Nada é enviado até você tocar em enviar
                      no próprio WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {step === SENT && (
                <div className="flex max-w-2xl flex-col gap-6">
                  <p className="text-[1.0625rem] leading-relaxed text-graphite">
                    Se a mensagem foi enviada, agora é só aguardar a resposta do{" "}
                    {site.barberFirstName}.{" "}
                    <strong className="font-semibold text-ink">
                      O horário só está garantido depois que ele confirmar
                    </strong>
                    ; se estiver ocupado, ele sugere outro.
                  </p>
                  <p className="text-[0.95rem] leading-relaxed text-muted">
                    O WhatsApp não abriu? Use o botão abaixo ou chame no {site.whatsapp.display}.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={whatsappLink(message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-solid"
                    >
                      <WhatsAppIcon size={18} />
                      Abrir o WhatsApp de novo
                    </a>
                    <button type="button" onClick={reset} className="btn btn-outline">
                      <RotateCcw size={16} strokeWidth={1.5} />
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
            className="mt-6 min-h-6 text-[0.95rem] font-semibold text-alert"
          >
            {nameError ? null : error}
          </p>

          {step !== SENT && (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-6">
              {step > SERVICE ? (
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  className="btn min-h-12 px-2 text-graphite hover:text-ink"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
              ) : (
                <span />
              )}
              {step < SEND && (
                <button
                  type="button"
                  onClick={next}
                  className="btn btn-solid min-h-12 flex-1 sm:flex-none"
                >
                  Continuar
                  <ArrowRight size={16} className="nudge" />
                </button>
              )}
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {step === SENT
              ? "Pedido pronto no WhatsApp"
              : `Etapa ${step + 1} de ${steps.length}: ${steps[step].label}`}
          </p>
        </div>
      </div>
    </section>
  );
}
