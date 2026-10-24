import { band } from "@/lib/guilloche";

/** Faixa guilhochê horizontal: o fio que separa campos, como na margem de um título. */
export function Band({ className = "", seed = 0, copies = 6 }: { className?: string; seed?: number; copies?: number }) {
  const paths = band({ seed, copies });
  return (
    <svg
      viewBox="0 0 1200 48"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={`block h-8 w-full ${className}`}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={0.7} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
