"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Minus, Pencil, Phone, Plus } from "lucide-react";
import { site } from "@/config/site";
import {
  formatLongDate,
  formatTime,
  nowMinutesInShop,
  timeToMinutes,
  todayInShop,
  type ISODate,
} from "@/lib/dates";
import {
  buildReservationMessage,
  cleanText,
  contactChannel,
  validateName,
  type ReservationDraft,
} from "@/lib/reservation";
import { Hull, WhatsAppIcon } from "@/components/brand";
import { Calendar } from "./calendar";

type FieldError = { field: string; text: string } | null;

const emptyDraft: ReservationDraft = { name: "", date: null, time: null, guests: 2, notes: "" };

/** Horários de preferência ainda possíveis para a data (hoje: só os que faltam). */
function timesFor(date: ISODate | null, today: ISODate | null, nowMinutes: number) {
  const all = site.reservation.times;
  if (!date || date !== today) return all;
  return all.filter((t) => timeToMinutes(t) > nowMinutes + 30);
}

export function Reservation() {
  const [today, setToday] = useState<ISODate | null>(null);
  const [nowMinutes, setNowMinutes] = useState(0);
  const [draft, setDraft] = useState<ReservationDraft>(emptyDraft);
  const [review, setReview] = useState(false);
  const [error, setError] = useState<FieldError>(null);
  const [copied, setCopied] = useState(false);
  const [contacted, setContacted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // "Hoje" e a hora atual só existem no navegador, no fuso de Ilhabela.
  useEffect(() => {
    const tick = () => {
      setToday(todayInShop());
      setNowMinutes(nowMinutesInShop());
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
  }, [review]);

  const times = timesFor(draft.date, today, nowMinutes);
  const message = useMemo(() => buildReservationMessage(draft), [draft]);
  const channel = contactChannel(message);

  const update = <K extends keyof ReservationDraft>(key: K, value: ReservationDraft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      // Trocar a data pode invalidar um horário de hoje que já passou.
      if (key === "date" && next.time && !timesFor(next.date, today, nowMinutes).includes(next.time)) {
        next.time = null;
      }
      return next;
    });
    if (error?.field === key) setError(null);
  };

  const validate = (): FieldError => {
    const nameError = validateName(draft.name);
    if (nameError) return { field: "name", text: nameError };
    if (!draft.date || !today) return { field: "date", text: "Escolha a data desejada no calendário." };
    if (draft.date < today) return { field: "date", text: "Essa data já passou. Escolha outra." };
    if (!draft.time) return { field: "time", text: "Escolha um horário de preferência." };
    if (!times.includes(draft.time)) return { field: "time", text: "Esse horário já passou hoje. Escolha outro." };
    return null;
  };

  const submit = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      window.requestAnimationFrame(() => document.getElementById(`reserva-${problem.field}`)?.focus());
      return;
    }
    moved.current = true;
    setCopied(false);
    setContacted(false);
    setReview(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const errorFor = (field: string) =>
    error?.field === field ? (
      <p id={`reserva-${field}-erro`} role="alert" className="mt-2 text-[0.875rem] font-semibold text-alert">
        {error.text}
      </p>
    ) : null;

  const lunch = times.filter((t) => timeToMinutes(t) < 17 * 60);
  const dinner = times.filter((t) => timeToMinutes(t) >= 17 * 60);

  return (
    <section id="reservar" aria-labelledby="reservar-title" className="relative overflow-hidden bg-deep text-sand">
      <Hull size={520} strokeWidth={0.35} className="pointer-events-none absolute -bottom-40 -left-32 text-deep-line" />
      <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-28">
        <div className="lg:col-span-4">
          <h2 id="reservar-title" data-reveal className="serif text-[clamp(2.3rem,4.6vw,3.8rem)]">
            Solicite sua mesa.
          </h2>
          <p data-reveal className="mt-6 max-w-[38ch] text-[1.0625rem] leading-relaxed text-on-deep-muted">
            Monte o pedido com data, horário e número de pessoas. O site ainda não vê a agenda do
            restaurante: quem confirma a disponibilidade é o Convés.
          </p>
          <dl className="mt-10 border-t border-deep-line text-[0.9375rem]">
            <div className="flex items-center justify-between gap-4 border-b border-deep-line py-3.5">
              <dt className="text-on-deep-muted">Telefone</dt>
              <dd>
                <a href={`tel:${site.phone.e164}`} className="link-line tabular">
                  {site.phone.display}
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-deep-line py-3.5">
              <dt className="text-on-deep-muted">Endereço</dt>
              <dd className="text-right">
                {site.address.street}, {site.address.neighborhood}
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="rounded-[3px] bg-sand text-ink shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
            {!review ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
                className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 sm:p-9"
              >
                <Field label="Nome" htmlFor="reserva-name" after={errorFor("name")}>
                  <input
                    id="reserva-name"
                    value={draft.name}
                    autoComplete="name"
                    maxLength={site.reservation.nameMaxLength}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Como devemos chamar você?"
                    aria-invalid={error?.field === "name"}
                    aria-describedby={error?.field === "name" ? "reserva-name-erro" : undefined}
                    className="field"
                  />
                </Field>

                <Field label="Pessoas" htmlFor="reserva-guests">
                  <div className="flex h-[3.25rem] items-stretch border border-line-strong bg-paper">
                    <button
                      type="button"
                      onClick={() => update("guests", Math.max(site.reservation.minGuests, draft.guests - 1))}
                      disabled={draft.guests <= site.reservation.minGuests}
                      aria-label="Menos uma pessoa"
                      className="grid w-12 place-items-center text-deep disabled:text-line-strong"
                    >
                      <Minus size={16} />
                    </button>
                    <output
                      id="reserva-guests"
                      aria-live="polite"
                      className="tabular grid flex-1 place-items-center border-x border-line text-[1.05rem] font-semibold text-deep"
                    >
                      {draft.guests} {draft.guests === 1 ? "pessoa" : "pessoas"}
                    </output>
                    <button
                      type="button"
                      onClick={() => update("guests", Math.min(site.reservation.maxGuests, draft.guests + 1))}
                      disabled={draft.guests >= site.reservation.maxGuests}
                      aria-label="Mais uma pessoa"
                      className="grid w-12 place-items-center text-deep disabled:text-line-strong"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {draft.guests >= site.reservation.maxGuests && (
                    <p className="mt-2 text-[0.8125rem] text-muted">
                      Grupos maiores: use o pedido de evento, mais abaixo.
                    </p>
                  )}
                </Field>

                <fieldset className="min-w-0" aria-describedby={error?.field === "date" ? "reserva-date-erro" : undefined}>
                  <legend className="label mb-3 text-deep">Data desejada</legend>
                  {today ? (
                    <Calendar
                      id="reserva-date"
                      today={today}
                      daysAhead={site.reservation.maxDaysAhead}
                      value={draft.date}
                      onChange={(date) => update("date", date)}
                      label="Escolha a data desejada"
                    />
                  ) : (
                    <p className="text-muted">Carregando o calendário…</p>
                  )}
                  {errorFor("date")}
                </fieldset>

                <fieldset className="min-w-0" aria-describedby={`reserva-time-dica${error?.field === "time" ? " reserva-time-erro" : ""}`}>
                  <legend className="label mb-3 text-deep">Horário de preferência</legend>
                  <div id="reserva-time" tabIndex={-1} className="flex flex-col gap-5 outline-none">
                    {[
                      { label: "Almoço", items: lunch },
                      { label: "Jantar", items: dinner },
                    ]
                      .filter((g) => g.items.length > 0)
                      .map((group) => (
                        <div key={group.label}>
                          <p className="mb-2 text-[0.875rem] text-muted">{group.label}</p>
                          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3">
                            {group.items.map((t) => (
                              <button
                                key={t}
                                type="button"
                                aria-pressed={draft.time === t}
                                onClick={() => update("time", t)}
                                className={`tabular min-h-11 rounded-[2px] border text-[0.9375rem] transition-colors ${
                                  draft.time === t
                                    ? "border-deep bg-deep font-semibold text-sand"
                                    : "border-line-strong bg-paper text-deep hover:border-deep"
                                }`}
                              >
                                {formatTime(t)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    {times.length === 0 && (
                      <p className="text-[0.9375rem] text-muted">Não há mais horários hoje. Escolha outra data.</p>
                    )}
                  </div>
                  <p id="reserva-time-dica" className="mt-3 text-[0.8125rem] leading-snug text-muted">
                    É uma preferência, não uma vaga. O restaurante confirma o horário.
                  </p>
                  {errorFor("time")}
                </fieldset>

                <Field label="Observações" htmlFor="reserva-notes" optional className="sm:col-span-2">
                  <textarea
                    id="reserva-notes"
                    value={draft.notes}
                    rows={2}
                    maxLength={site.reservation.notesMaxLength}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Ex.: preferência pela área externa, se possível"
                    className="field min-h-[3.25rem] resize-y py-3"
                  />
                </Field>

                <div className="flex flex-col gap-3 border-t border-line pt-6 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[0.8125rem] text-muted">Nada é enviado sem você confirmar no próximo passo.</p>
                  <button type="submit" className="btn btn-deep">
                    Revisar solicitação
                    <ArrowRight size={16} className="nudge" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="animate-step">
                {/* O bilhete: dados em cima, picote, e o canhoto com as ações. */}
                <div className="p-6 sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <h3 ref={headingRef} tabIndex={-1} className="serif text-[2rem] text-deep outline-none">
                      Sua solicitação
                    </h3>
                    <Hull size={34} className="flex-none text-champagne" />
                  </div>
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                    {[
                      { label: "Nome", value: cleanText(draft.name) },
                      { label: "Data", value: draft.date ? formatLongDate(draft.date) : "" },
                      { label: "Horário", value: draft.time ? formatTime(draft.time) : "" },
                      { label: "Pessoas", value: String(draft.guests) },
                    ].map((row) => (
                      <div key={row.label} className={row.label === "Data" ? "col-span-2 sm:col-span-1" : ""}>
                        <dt className="label text-muted">{row.label}</dt>
                        <dd className="serif mt-1.5 text-[1.25rem] leading-snug text-deep first-letter:uppercase">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {cleanText(draft.notes) && (
                    <p className="mt-5 text-[0.9375rem] text-ink/85">
                      <span className="text-muted">Observação: </span>
                      {cleanText(draft.notes, { multiline: true })}
                    </p>
                  )}
                </div>

                <div aria-hidden className="relative">
                  <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-deep" />
                  <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-deep" />
                  <div className="perforation mx-5" />
                </div>

                <div className="p-6 sm:p-9">
                  <p className="text-[0.9375rem] leading-relaxed text-ink/85">
                    {channel.kind === "whatsapp"
                      ? "A mensagem abre no seu WhatsApp, pronta para enviar."
                      : `Ligue para o Convés e informe os dados acima. Se preferir, copie a mensagem para ler ou enviar pelo canal que o restaurante indicar.`}{" "}
                    <strong className="font-semibold text-deep">
                      A mesa só está reservada depois da confirmação do restaurante.
                    </strong>
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      href={channel.href}
                      {...(channel.kind === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      onClick={() => setContacted(true)}
                      className="btn btn-gold"
                    >
                      {channel.kind === "whatsapp" ? <WhatsAppIcon size={18} /> : <Phone size={16} />}
                      {channel.kind === "whatsapp" ? "Consultar disponibilidade" : `Ligar e consultar · ${site.phone.display}`}
                    </a>
                    <button type="button" onClick={copy} className="btn btn-outline">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Mensagem copiada" : "Copiar mensagem"}
                    </button>
                  </div>
                  <p aria-live="polite" className="mt-4 min-h-5 text-[0.875rem] text-muted">
                    {contacted
                      ? "Solicitação em andamento: aguarde a confirmação do Convés."
                      : copied
                        ? "Mensagem copiada para a área de transferência."
                        : ""}
                  </p>
                  <details className="group mt-2 border-t border-line pt-4">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[0.9375rem] font-semibold text-deep [&::-webkit-details-marker]:hidden">
                      Ver a mensagem
                      <ArrowRight size={16} aria-hidden className="rotate-90 transition-transform group-open:-rotate-90" />
                    </summary>
                    <pre className="mt-2 font-sans text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink/80">{message}</pre>
                  </details>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        moved.current = true;
                        setReview(false);
                      }}
                      className="btn btn-outline px-5"
                    >
                      <Pencil size={15} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        moved.current = true;
                        setDraft(emptyDraft);
                        setReview(false);
                      }}
                      className="inline-flex min-h-11 items-center gap-2 px-2 text-[0.875rem] font-semibold text-muted hover:text-deep"
                    >
                      <ArrowLeft size={15} />
                      Nova solicitação
                    </button>
                  </div>
                </div>
              </div>
            )}
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
  className = "",
  after,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  className?: string;
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label mb-3 flex items-baseline gap-2 text-deep">
        {label}
        {optional && <span className="text-[0.75rem] font-normal tracking-normal text-muted normal-case">opcional</span>}
      </label>
      {children}
      {after}
    </div>
  );
}
