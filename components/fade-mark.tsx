/** Escadinha de cinco degraus: os degraus acesos indicam a área que o serviço trabalha. */
export function FadeMark({ lit, className = "" }: { lit: number[]; className?: string }) {
  return (
    <span aria-hidden className={`inline-flex h-7 items-end gap-[3px] ${className}`}>
      {[0, 1, 2, 3, 4].map((step) => (
        <span
          key={step}
          style={{ height: `${36 + step * 16}%` }}
          className={`w-[5px] rounded-[1px] transition-colors duration-300 ${
            lit.includes(step) ? "bg-steel group-hover:bg-blue-ink" : "bg-line-strong"
          }`}
        />
      ))}
    </span>
  );
}
