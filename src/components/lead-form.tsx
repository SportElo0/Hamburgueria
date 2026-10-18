"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ArrowRight, Check, WhatsApp } from "./icons";

type Journey = "compra" | "restauracao" | "vision";

export interface LeadFormProps {
  journey: Journey;
  vehicle?: { slug: string; label: string };
  services?: { slug: string; name: string }[];
  defaultServices?: string[];
  whatsappHref?: string | null;
  /** Extra payload (Vision images/brief) merged into the request. */
  extra?: () => Record<string, unknown>;
  hasImages?: boolean;
  submitLabel?: string;
  tone?: "dark" | "paper";
  onSent?: () => void;
}

/**
 * Lead form shared by both journeys. Visible labels, inline errors tied with aria-describedby, an
 * error summary that takes focus after a failed submit, and explicit consent before anything is
 * stored. Nothing here is required to use Vision itself.
 */
export function LeadForm({
  journey,
  vehicle,
  services,
  defaultServices = [],
  whatsappHref,
  extra,
  hasImages,
  submitLabel = "Enviar solicitação",
  tone = "dark",
  onSent,
}: LeadFormProps) {
  const uid = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [picked, setPicked] = useState<string[]>(defaultServices);
  const summaryRef = useRef<HTMLDivElement>(null);

  const f = (k: string) => `${uid}-${k}`;
  const err = (k: string) =>
    errors[k] ? (
      <p id={f(`${k}-err`)} className="field-error">
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: string) => ({
    id: f(k),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? f(`${k}-err`) : undefined,
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      journey,
      name: fd.get("name"),
      whatsapp: fd.get("whatsapp"),
      email: fd.get("email") ?? "",
      message: fd.get("message") ?? "",
      carMake: fd.get("carMake") || undefined,
      carModel: fd.get("carModel") || undefined,
      carYear: fd.get("carYear") || undefined,
      vehicleSlug: vehicle?.slug,
      services: picked.length ? picked : undefined,
      consentContact: fd.get("consentContact") === "on",
      consentImages: fd.get("consentImages") === "on",
      company: fd.get("company") ?? "",
      ...(extra?.() ?? {}),
    };
    if (!payload.consentImages) {
      delete payload.originalImage;
      delete payload.conceptImage;
    }
    setState("sending");
    setFormError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Não foi possível enviar. Tente novamente.");
        setState("idle");
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
      setErrors({});
      setState("sent");
      onSent?.();
    } catch {
      setFormError("Sem conexão. Verifique a internet e tente novamente.");
      setState("idle");
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className={`rounded-[3px] border p-6 ${tone === "paper" ? "border-[var(--line-light)]" : "border-[var(--line-dark)]"}`}>
        <p className="flex items-center gap-3 font-display text-[1.75rem] leading-tight">
          <Check size={22} /> Solicitação recebida.
        </p>
        <p className="text-soft mt-3 max-w-[46ch]">
          A Mercantil vai responder pelo WhatsApp informado. Seus dados ficam guardados apenas para esse atendimento,
          conforme a <Link className="link-line" href="/privacidade">política de privacidade</Link>.
        </p>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet mt-6">
            <WhatsApp /> Falar agora pelo WhatsApp
          </a>
        )}
      </div>
    );
  }

  const needsCar = journey !== "compra";
  const errorList = Object.entries(errors);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[3px] border border-[#e0868f]/50 bg-[#e0868f]/10 p-4 text-[0.9375rem]">
          <p className="font-medium">{formError}</p>
          {errorList.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {errorList.map(([k, m]) => (
                <li key={k}>
                  <a className="underline" href={`#${f(k)}`}>{m}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {vehicle && (
        <p className="text-soft text-[0.9375rem]">
          Sobre: <span className="text-current">{vehicle.label}</span>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={f("name")}>Nome</label>
          <input name="name" autoComplete="name" required className="field" {...a11y("name")} />
          {err("name")}
        </div>
        <div>
          <label className="field-label" htmlFor={f("whatsapp")}>WhatsApp com DDD</label>
          <input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required placeholder="(11) 91234-5678" className="field tabular" {...a11y("whatsapp")} />
          {err("whatsapp")}
        </div>
      </div>

      {needsCar && (
        <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr_0.8fr]">
          <div>
            <label className="field-label" htmlFor={f("carMake")}>Marca</label>
            <input name="carMake" defaultValue="Mercedes-Benz" className="field" {...a11y("carMake")} />
          </div>
          <div>
            <label className="field-label" htmlFor={f("carModel")}>Modelo</label>
            <input name="carModel" placeholder="Ex.: 280 SE W108" className="field" {...a11y("carModel")} />
            {err("carModel")}
          </div>
          <div>
            <label className="field-label" htmlFor={f("carYear")}>Ano <span className="text-soft font-normal">(se souber)</span></label>
            <input name="carYear" inputMode="numeric" className="field tabular" {...a11y("carYear")} />
          </div>
        </div>
      )}

      {services && services.length > 0 && (
        <fieldset>
          <legend className="field-label">O que você procura <span className="text-soft font-normal">(opcional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => {
              const on = picked.includes(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  className="chip !pl-3"
                  aria-pressed={on}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.slug) : [...p, s.slug]))}
                >
                  {on && <Check size={14} />} {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label className="field-label" htmlFor={f("message")}>
          {journey === "compra" ? "Sua mensagem" : "Conte sobre o carro e o projeto"} <span className="text-soft font-normal">(opcional)</span>
        </label>
        <textarea name="message" rows={4} maxLength={1500} className="field resize-y" {...a11y("message")} />
      </div>

      <div className="hidden" aria-hidden>
        <label htmlFor={f("company")}>Empresa</label>
        <input id={f("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-3 text-[0.9375rem]">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consentContact" className="mt-1 size-5 flex-none accent-[var(--color-wine)]" {...a11y("consentContact")} />
          <span>
            Autorizo a Mercantil a guardar estes dados e me contatar sobre esta solicitação.{" "}
            <Link href="/privacidade" className="link-line text-soft">Privacidade</Link>
          </span>
        </label>
        {err("consentContact")}
        {hasImages && (
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consentImages" className="mt-1 size-5 flex-none accent-[var(--color-wine)]" />
            <span>
              Também autorizo enviar a foto original e a simulação junto com a solicitação. Sem esta autorização, só os
              textos são enviados.
            </span>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={state === "sending"} aria-busy={state === "sending"}>
          {state === "sending" ? "Enviando…" : submitLabel} {state !== "sending" && <ArrowRight className="arrow" />}
        </button>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
            <WhatsApp /> Prefiro o WhatsApp
          </a>
        )}
      </div>
    </form>
  );
}
