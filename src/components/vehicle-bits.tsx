import Image from "next/image";
import { commercialLabel, workStageLabel, workTrack } from "@/content/site";
import type { Photo, Swatch, Vehicle } from "@/content/types";

/** The colour sample chip: swatch + printed name, as on a period paint chart. */
export function SwatchChip({ swatch, size = "md" }: { swatch: Swatch; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`chip-swatch ${size === "sm" ? "!h-4 !w-5" : ""}`}
        style={{ background: swatch.hex }}
      />
      <span>{swatch.name}</span>
    </span>
  );
}

/**
 * Trajectory, not a badge: the car's position along the work track. Commercial status is shown
 * separately and never inferred from it.
 */
export function WorkTrack({ vehicle, tone = "dark" }: { vehicle: Pick<Vehicle, "workStage" | "workNote">; tone?: "dark" | "paper" }) {
  const idx = workTrack.indexOf(vehicle.workStage);
  const unknown = idx < 0;
  const on = tone === "paper" ? "bg-ink" : "bg-ivory";
  const off = tone === "paper" ? "bg-ink/15" : "bg-ivory/15";
  return (
    <div>
      <p className="text-[0.9375rem] font-medium">{workStageLabel[vehicle.workStage]}</p>
      <ol className="mt-3 grid grid-cols-6 gap-1" aria-label="Etapas do trabalho">
        {workTrack.map((stage, i) => (
          <li key={stage} title={workStageLabel[stage]}>
            <span className={`block h-[3px] ${!unknown && i <= idx ? on : off}`} />
            <span className="sr-only">
              {workStageLabel[stage]}
              {i === idx ? " (etapa atual)" : ""}
            </span>
          </li>
        ))}
      </ol>
      {unknown && <p className="caption text-soft mt-2">Etapa ainda não informada pelo proprietário.</p>}
      {vehicle.workNote && !unknown && vehicle.workNote.replace(/\.$/, "").toLowerCase() !== workStageLabel[vehicle.workStage].toLowerCase() && (
        <p className="caption text-soft mt-2">{vehicle.workNote}</p>
      )}
    </div>
  );
}

export function CommercialStatus({ vehicle }: { vehicle: Pick<Vehicle, "commercialStatus" | "price"> }) {
  const price = vehicle.price?.authorised && vehicle.price.amount
    ? vehicle.price.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : null;
  return (
    <div>
      <p className="text-[0.9375rem] font-medium">{commercialLabel[vehicle.commercialStatus]}</p>
      <p className="caption text-soft tabular mt-1">{price ?? "Valor sob consulta"}</p>
    </div>
  );
}

export function ProvCaption({ photo, className = "" }: { photo: Photo; className?: string }) {
  const text = photo.caption ?? (photo.kind === "real" ? "Fotografia real" : "Ilustração conceitual · não é fotografia");
  return (
    <span className={`prov caption ${className}`} data-kind={photo.kind}>
      {text}
    </span>
  );
}

/** First real photo when one exists; otherwise a plate that says photography is still being produced. */
export function VehiclePlate({
  vehicle,
  sizes,
  priority,
  className = "",
  showCaption = true,
}: {
  vehicle: Vehicle;
  sizes: string;
  priority?: boolean;
  className?: string;
  showCaption?: boolean;
}) {
  const photo = vehicle.photos.find((p) => p.kind === "real") ?? vehicle.photos[0];
  if (photo) {
    return (
      <figure className={`relative overflow-hidden bg-graphite ${className}`}>
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className="object-cover" />
        {showCaption && (
          <figcaption className="absolute bottom-3 left-3 rounded-sm bg-night/70 px-2 py-1 text-silver backdrop-blur-sm">
            <ProvCaption photo={photo} />
          </figcaption>
        )}
      </figure>
    );
  }
  return <AwaitingPlate vehicle={vehicle} className={className} />;
}

/** Relative luminance (WCAG) of a #rrggbb colour. */
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * A car still awaiting photography is shown as its own paint chip — the colour field of a period
 * paint chart, printed with its name — never as an invented image.
 */
export function AwaitingPlate({ vehicle, className = "" }: { vehicle: Vehicle; className?: string }) {
  const light = luminance(vehicle.color.hex) > 0.35;
  const ink = light ? "text-ink" : "text-ivory";
  return (
    <figure
      className={`@container relative flex flex-col justify-between overflow-hidden ${ink} ${className}`}
      style={{
        background: `linear-gradient(158deg, rgb(255 255 255 / ${light ? 0.35 : 0.13}) 0%, rgb(255 255 255 / 0) 42%, rgb(0 0 0 / ${light ? 0.12 : 0.35}) 100%), ${vehicle.color.hex}`,
      }}
      aria-label={`${vehicle.model} ${vehicle.chassis} na cor ${vehicle.color.name.toLowerCase()}: fotografias reais em produção`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display leading-none select-none ${light ? "text-ink/[0.07]" : "text-ivory/[0.08]"}`}
        style={{ fontSize: "clamp(4rem, 26cqw, 16rem)" }}
      >
        {vehicle.chassis}
      </span>
      <span className="relative p-4 font-display text-[1.375rem] leading-none">{vehicle.color.name}</span>
      <figcaption className={`caption relative p-4 ${light ? "text-ink" : "text-ivory/80"}`}>
        <span className="prov" data-kind="concept">Amostra de cor · fotografias reais em produção</span>
      </figcaption>
    </figure>
  );
}
