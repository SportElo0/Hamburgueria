"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";

/** Wraps a server action with pending/ok/error feedback next to the submit button. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "",
  encType,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  encType?: "multipart/form-data";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className} encType={encType}>
      {children}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </button>
        <p role="status" aria-live="polite" className={`text-[0.9375rem] ${state?.error ? "text-[#f0a2aa]" : "text-silver"}`}>
          {state?.error ?? state?.ok ?? ""}
        </p>
      </div>
    </form>
  );
}
