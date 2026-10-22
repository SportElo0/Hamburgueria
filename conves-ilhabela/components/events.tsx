"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Copy, Pencil, Phone, X } from "lucide-react";
import { site } from "@/config/site";
import { formatLongDate, todayInShop, type ISODate } from "@/lib/dates";
import { buildEventMessage, cleanText, contactChannel, validateName, type EventDraft } from "@/lib/reservation";
import { WhatsAppIcon } from "@/components/brand";
import { Calendar } from "@/components/reservation/calendar";

const emptyDraft: EventDraft = { name: "", type: site.events.types[0], date: null, guests: "", notes: "" };

export function Events() {
  const [today, setToday] = useState<ISODate | null>(null);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [error, setError] = useState<{ field: string; text: string } | null>(null);
  const [review, setReview] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => setToday(todayInShop());
    tick();
    const id = window.setInterval(tick, 10 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  const message = useMemo(() => buildEventMessage(draft), [draft]);
  const channel = contactChannel(message);
  const update = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (error?.field === key) setError(null);
  };

  const submit = () => {
    const nameError = validateName(draft.name);
    let problem: { field: string; text: string } | null = nameError ? { field: "name", text: nameError } : null;
    if (!problem && draft.date && today && draft.date < today)
      problem = { field: "date", text: "Essa data já passou. Escolha outra." };
    const guests = Number(draft.guests || "0");
    if (!problem && draft.guests && (guests < 1 || guests > site.events.maxGuests))
      problem = { field: "guests", text: `Informe um número entre 1 e ${site.events.maxGuests}, ou deixe em branco.` };
    if (problem) {
      setError(problem);
      window.requestAnimationFrame(() => document.getElementById(`evento-${problem.field}`)?.focus());
      return;
    }
    setCopied(false);
    setReview(true);
  };

  const errorFor = (field: string) =>
    error?.field === field ? (
      <p id={`evento-${field}-erro`} role="alert" className="mt-2 text-[0.875rem] font-semibold text-alert">
        {error.text}
      </p>
    ) : null;

  return (
    <section id="eventos" aria-labelledby="eventos-title" className="bg-sage">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-28">
        <div className="lg:col-span-5">
          <h2 id="eventos-title" data-reveal className="serif text-[clamp(2.3rem,4.6vw,3.8rem)] text-deep">
            Celebre momentos especiais no Convés.
          </h2>
          <p data-reveal className="mt-6 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink/85">
            O Convés tem espaço para eventos. Conte o que você planeja e peça as possibilidades: o
            restaurante informa o que pode atender, a disponibilidade e as condições.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-[3px] bg-sand p-6 sm:p-9">
            {!review ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >
                <div className="sm:col-span-2">
                  <label htmlFor="evento-name" className="label mb-3 block text-deep">Nome</label>
                  <input
                    id="evento-name"
                    value={draft.name}
                    autoComplete="name"
                    maxLength={site.reservation.nameMaxLength}
                    onChange={(e) => update("name", e.target.value)}
                    aria-invalid={error?.field === "name"}
                    aria-describedby={error?.field === "name" ? "evento-name-erro" : undefined}
                    className="field"
                  />
                  {errorFor("name")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="evento-type" className="label mb-3 block text-deep">Tipo de evento</label>
                  <div className="relative sm:w-72">
                    <select
                      id="evento-type"
                      value={draft.type}
                      onChange={(e) => update("type", e.target.value)}
                      className="field appearance-none pr-11"
                    >
                      {site.events.types.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      strokeWidth={1.6}
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-deep"
                    />
                  </div>
                </div>
                <fieldset
                  className="min-w-0 sm:col-span-2"
                  aria-describedby={error?.field === "date" ? "evento-date-erro" : undefined}
                >
                  <legend className="label mb-3 flex items-baseline gap-2 text-deep">
                    Data pretendida
                    <span className="text-[0.75rem] font-normal tracking-normal text-muted normal-case">opcional</span>
                  </legend>
                  <div className="sm:max-w-sm">
                    {today ? (
                      <Calendar
                        id="evento-date"
                        today={today}
                        daysAhead={730}
                        value={draft.date}
                        onChange={(date) => update("date", date)}
                        label="Escolha a data pretendida"
                      />
                    ) : (
                      <p className="text-muted">Carregando o calendário…</p>
                    )}
                  </div>
                  {draft.date && (
                    <p className="mt-3 flex flex-wrap items-center gap-3 text-[0.9375rem] text-deep">
                      <span className="first-letter:uppercase">{formatLongDate(draft.date)}</span>
                      <button
                        type="button"
                        onClick={() => update("date", null)}
                        className="inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-muted hover:text-deep"
                      >
                        <X size={14} />
                        Sem data definida
                      </button>
                    </p>
                  )}
                  {errorFor("date")}
                </fieldset>
                <div className="sm:col-span-2">
                  <label htmlFor="evento-guests" className="label mb-3 flex items-baseline gap-2 text-deep">
                    Convidados (aproximadamente)
                    <span className="text-[0.75rem] font-normal tracking-normal text-muted normal-case">opcional</span>
                  </label>
                  <input
                    id="evento-guests"
                    inputMode="numeric"
                    value={draft.guests}
                    maxLength={3}
                    onChange={(e) => update("guests", e.target.value.replace(/\D/g, ""))}
                    aria-invalid={error?.field === "guests"}
                    aria-describedby={error?.field === "guests" ? "evento-guests-erro" : undefined}
                    className="field tabular sm:w-40"
                  />
                  {errorFor("guests")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="evento-notes" className="label mb-3 flex items-baseline gap-2 text-deep">
                    Observações
                    <span className="text-[0.75rem] font-normal tracking-normal text-muted normal-case">opcional</span>
                  </label>
                  <textarea
                    id="evento-notes"
                    rows={3}
                    value={draft.notes}
                    maxLength={site.reservation.notesMaxLength}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Horário, formato, o que você imagina"
                    className="field resize-y py-3"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn btn-deep w-full sm:w-auto">
                    Revisar pedido de informações
                    <ArrowRight size={16} className="nudge" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="animate-step">
                <h3 className="serif text-[1.8rem] text-deep">Pedido de informações</h3>
                <pre className="mt-4 border-y border-line py-4 font-sans text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink/85">
                  {message}
                </pre>
                <p className="mt-4 text-[0.9375rem] text-ink/85">
                  {channel.kind === "whatsapp"
                    ? "A mensagem abre no seu WhatsApp."
                    : "Ligue para o Convés com esses dados, ou copie a mensagem."}{" "}
                  Nada fica combinado até a resposta do restaurante.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href={channel.href}
                    {...(channel.kind === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="btn btn-gold"
                  >
                    {channel.kind === "whatsapp" ? <WhatsAppIcon size={18} /> : <Phone size={16} />}
                    {channel.kind === "whatsapp" ? "Pedir informações" : `Ligar · ${site.phone.display}`}
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(message);
                        setCopied(true);
                      } catch {
                        setCopied(false);
                      }
                    }}
                    className="btn btn-outline"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Mensagem copiada" : "Copiar mensagem"}
                  </button>
                  <button type="button" onClick={() => setReview(false)} className="btn btn-outline">
                    <Pencil size={15} />
                    Editar
                  </button>
                </div>
                <p aria-live="polite" className="sr-only">
                  {copied ? `Mensagem copiada: ${cleanText(draft.name)}` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
