import { Hull } from "@/components/brand";

/** A esteira: linhas que o barco deixa na água, desenhadas pelo scroll. */
export function Wake({ className = "", tone = "deep" }: { className?: string; tone?: "deep" | "light" }) {
  return (
    <div
      aria-hidden
      data-wake-group
      className={`relative mx-auto h-24 max-w-[90rem] px-5 sm:px-8 lg:h-32 lg:px-12 ${className}`}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="h-full w-full text-champagne"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      >
        <path
          data-wake
          d="M0 70 C 80 40, 140 100, 220 70 S 360 40, 440 70 S 580 100, 660 70 S 800 40, 880 70 S 1020 100, 1100 70 L 1160 70"
          vectorEffect="non-scaling-stroke"
        />
        <path
          data-wake
          d="M40 96 C 120 76, 180 112, 260 96 S 400 76, 480 96 S 620 112, 700 96 S 840 80, 920 96"
          vectorEffect="non-scaling-stroke"
          className="text-champagne-soft"
          stroke="currentColor"
        />
      </svg>
      <Hull
        data-wake-boat
        size={34}
        className={`absolute top-1/2 right-5 -translate-y-[70%] sm:right-8 lg:right-12 ${tone === "deep" ? "text-deep" : "text-champagne-soft"}`}
      />
    </div>
  );
}
