import renders from '@/content/renders.json';

export type BurgerRenderId = keyof typeof renders.burgers;
export type LayerData = (typeof renders.burgers)[BurgerRenderId]['layers'][number];

export const layersOf = (id: string): LayerData[] => (renders.burgers as Record<string, { layers: LayerData[] }>)[id]?.layers ?? [];

/** Vertical offset (in % of frame height) for layer i when fully exploded. Higher layers rise. */
export function explodeOffset(i: number, n: number, gap: number) {
  const mid = (n - 1) / 2;
  return -(i - mid) * gap;
}

interface Props {
  id: string;
  /** 0 = assembled, 1 = exploded. Driven by CSS transition when `animated`. */
  explode?: number;
  gap?: number;
  labels?: boolean;
  /** 'auto' swaps to the small set under 768px. */
  size?: 'auto' | 'lg' | 'sm';
  priority?: boolean;
  className?: string;
  tone?: 'dark' | 'light';
  /** CSS-transition mode (product sheet). Off when GSAP drives the layers. */
  animated?: boolean;
}

export function BurgerStack({ id, explode = 0, gap = 9, labels = false, size = 'auto', priority = false, className = '', tone = 'dark', animated = true }: Props) {
  const layers = layersOf(id);
  const n = layers.length;
  return (
    <div className={`bs relative aspect-square ${className}`} data-burger={id}>
      {layers.map((layer, i) => {
        const side = i % 2 === 0 ? 'right' : 'left';
        const a = side === 'right' ? layer.anchor.right : layer.anchor.left;
        const y = explodeOffset(i, n, gap) * explode;
        return (
          <div
            key={layer.key + i}
            className="bs-layer absolute inset-0"
            data-index={i}
            style={{
              zIndex: i + 1,
              ...(animated
                ? {
                    transform: `translate3d(0, ${y}%, 0)`,
                    transition: 'transform 0.9s var(--ease-out-expo)',
                    transitionDelay: `${(explode ? n - i : i) * 35}ms`,
                  }
                : {}),
            }}
          >
            <picture>
              {size === 'auto' && <source media="(max-width: 767px)" srcSet={layer.srcSm} />}
              <img
                src={size === 'sm' ? layer.srcSm : layer.src}
                alt=""
                decoding="async"
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority && i > n - 3 ? 'high' : undefined}
                draggable={false}
                className="absolute select-none"
                style={{ left: `${layer.box.x}%`, top: `${layer.box.y}%`, width: `${layer.box.w}%`, height: `${layer.box.h}%` }}
              />
            </picture>
            {labels && (
              <span
                className={`bs-label pointer-events-none absolute flex items-center gap-1.5 ${side === 'left' ? 'flex-row-reverse text-right' : ''} ${tone === 'dark' ? 'text-ink' : 'text-on-dark'}`}
                style={{
                  top: `${a.y}%`,
                  [side === 'right' ? 'left' : 'right']: `${side === 'right' ? a.x : 100 - a.x}%`,
                  width: `calc(${side === 'right' ? 100 - a.x : a.x}% + var(--label-out, 0px))`,
                  transform: 'translateY(-50%)',
                }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full border-2 border-current bg-transparent" />
                <span className="h-px min-w-3 flex-1 bg-current opacity-70" />
                <span className="cond max-w-[11ch] shrink-0 text-[0.72rem] leading-[1.05] font-bold tracking-[0.06em] uppercase sm:max-w-none sm:text-sm lg:text-base">
                  {layer.label}
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function cardImage(id: string) {
  return (renders.burgers as Record<string, { card: string }>)[id]?.card;
}
