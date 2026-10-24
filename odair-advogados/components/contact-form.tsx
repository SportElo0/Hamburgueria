"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, Info, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { submitContact, type ContactField, type ContactState } from "@/app/actions/contact";
import { areas } from "@/data/areas";

const initial: ContactState = {
  status: "idle",
  attempt: 0,
  errors: {},
  values: { name: "", reply: "", area: "", message: "" },
};

export function ContactForm({ channel, defaultArea = "" }: { channel: "demo" | "whatsapp" | "email"; defaultArea?: string }) {
  const demo = channel === "demo";
  const [state, action, pending] = useActionState(submitContact, initial);
  // Tentativa cuja mensagem pronta foi fechada para edição.
  const [editing, setEditing] = useState(-1);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "demo" || state.status === "sent" || state.status === "whatsapp") resultRef.current?.focus();
    if (state.status === "error") {
      const first = (["name", "reply", "area", "message"] as ContactField[]).find((f) => state.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  const done = state.status === "demo" || state.status === "sent";
  const ready = state.status === "whatsapp" && state.whatsapp && editing !== state.attempt;
  const v = state.values;
  const err = (field: ContactField) => state.errors[field];
  const describedBy = (field: ContactField) => (err(field) ? `${field}-erro` : undefined);

  if (ready && state.whatsapp) {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="animate-step outline-none">
        <p className="display text-[2rem] leading-tight text-navy">Mensagem pronta.</p>
        <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-muted">
          Revise o texto abaixo. Ele só é enviado quando você tocar em enviar no WhatsApp.
        </p>
        <pre className="mt-5 max-h-56 overflow-auto rounded-[3px] border border-line-strong bg-ivory p-4 font-sans text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-graphite">
          {state.whatsapp.text}
        </pre>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={state.whatsapp.url} target="_blank" rel="noopener noreferrer" className="btn btn-navy">
            <MessageCircle size={16} />
            Enviar pelo WhatsApp
          </a>
          <button type="button" onClick={() => setEditing(state.attempt)} className="btn btn-line">
            <ArrowLeft size={16} />
            Editar
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="animate-step outline-none">
        <ShieldCheck size={28} strokeWidth={1.4} className="text-gold-ink" aria-hidden />
        {state.status === "demo" ? (
          <>
            <p className="display mt-5 text-[2rem] leading-tight text-navy">Formulário conferido.</p>
            <p className="mt-3 max-w-[44ch] text-[1rem] leading-relaxed text-muted">
              Esta é uma demonstração: os campos foram conferidos no servidor, mas nenhuma mensagem foi enviada nem
              guardada. Quando o escritório ativar o envio, o contato chegará diretamente à equipe.
            </p>
          </>
        ) : (
          <>
            <p className="display mt-5 text-[2rem] leading-tight text-navy">Mensagem enviada.</p>
            <p className="mt-3 max-w-[44ch] text-[1rem] leading-relaxed text-muted">
              O escritório recebeu seu contato e retornará pelo meio informado.
            </p>
          </>
        )}
        <button type="button" onClick={() => window.location.reload()} className="btn btn-line mt-7">
          Escrever outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate key={state.attempt} className="grid grid-cols-1 gap-5">
      {channel === "whatsapp" && (
        <p className="flex items-start gap-2.5 rounded-[3px] bg-ivory px-4 py-3 text-[0.875rem] leading-snug text-muted">
          <Info size={16} strokeWidth={1.6} aria-hidden className="mt-0.5 flex-none text-gold-ink" />
          Ao continuar, a mensagem fica pronta para você enviar pelo WhatsApp do escritório. Nada fica guardado no site.
        </p>
      )}
      {demo && (
        <p className="flex items-start gap-2.5 rounded-[3px] border border-dashed border-line-strong bg-ivory px-4 py-3 text-[0.875rem] leading-snug text-muted">
          <Info size={16} strokeWidth={1.6} aria-hidden className="mt-0.5 flex-none text-gold-ink" />
          Demonstração: o formulário confere os campos, mas não envia nem guarda nenhuma mensagem.
        </p>
      )}

      <Field label="Nome" id="name" error={err("name")}>
        <input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={v.name}
          maxLength={80}
          aria-invalid={err("name") ? true : undefined}
          aria-describedby={describedBy("name")}
          className="field"
        />
      </Field>

      <Field label="E-mail ou telefone para retorno" id="reply" error={err("reply")}>
        <input
          id="reply"
          name="reply"
          autoComplete="email"
          inputMode="email"
          defaultValue={v.reply}
          maxLength={120}
          aria-invalid={err("reply") ? true : undefined}
          aria-describedby={describedBy("reply")}
          className="field"
        />
      </Field>

      <Field label="Área de interesse" hint="opcional" id="area" error={err("area")}>
        <div className="relative">
          <select
            id="area"
            name="area"
            defaultValue={v.area || defaultArea}
            aria-invalid={err("area") ? true : undefined}
            aria-describedby={describedBy("area")}
            className="field appearance-none pr-11"
          >
            <option value="">Prefiro não informar</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <svg aria-hidden viewBox="0 0 12 8" className="pointer-events-none absolute top-1/2 right-4 h-2 w-3 -translate-y-1/2 text-navy">
            <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
      </Field>

      <Field label="Mensagem breve" id="message" error={err("message")} hint="até 600 caracteres">
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={600}
          defaultValue={v.message}
          placeholder="Um resumo do assunto. Não inclua documentos nem dados sensíveis."
          aria-invalid={err("message") ? true : undefined}
          aria-describedby={describedBy("message")}
          className="field min-h-32 resize-y py-3 leading-relaxed"
        />
      </Field>

      {/* Campo invisível para robôs. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Site</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={pending} className="btn btn-navy disabled:cursor-wait">
          {pending ? (
            <>
              <LoaderCircle size={16} className="animate-spin" aria-hidden />
              Conferindo
            </>
          ) : (
            <>
              {channel === "whatsapp" ? "Continuar no WhatsApp" : "Enviar mensagem"}
              <ArrowRight size={16} className="nudge" />
            </>
          )}
        </button>
        <p className="max-w-[32ch] text-[0.8125rem] leading-snug text-muted">
          Os dados servem só para responder ao seu contato.{" "}
          <Link href="/privacidade" className="font-semibold text-navy underline">
            Política de privacidade
          </Link>
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string;
  id: ContactField;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-[0.9375rem] font-semibold text-navy">
        {label}
        {hint && <span className="text-[0.8125rem] font-normal text-muted">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-erro`} role="alert" className="mt-2 flex items-center gap-1.5 text-[0.875rem] text-alert">
          <CircleAlert size={15} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
