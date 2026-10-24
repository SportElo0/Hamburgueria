import { PenLine } from "lucide-react";

/** Marca discreta de texto provisório, à espera de aprovação do escritório. */
export function DraftNote({ children = "Texto provisório, sujeito à aprovação do Dr. Odair.", tone = "light", className = "" }: { children?: React.ReactNode; tone?: "light" | "dark"; className?: string }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-[3px] border border-dashed px-3 py-1.5 text-[0.8125rem] ${
        tone === "light" ? "border-line-strong text-muted" : "border-blue-line text-on-navy-muted"
      } ${className}`}
    >
      <PenLine size={14} strokeWidth={1.6} aria-hidden className="flex-none" />
      {children}
    </p>
  );
}

/** Valor ainda não informado pelo escritório. Nunca é preenchido com dado fictício. */
export function Pending({ label = "a informar", tone = "light" }: { label?: string; tone?: "light" | "dark" }) {
  return (
    <span className={`italic ${tone === "light" ? "text-muted" : "text-on-navy-muted"}`}>
      {label}
    </span>
  );
}
