// Digital treatment of the Downtown Burger badge, drawn from the printed menu.
// Temporary until official vector artwork is supplied: drop an SVG at /public/brand/logo.svg and
// set OFFICIAL_LOGO to its path to swap every instance.
export const OFFICIAL_LOGO: string | null = null;

export function Star({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1.8l2.9 6.6 7.2.6-5.5 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L1.9 9l7.2-.6L12 1.8Z" />
    </svg>
  );
}

function Skyline() {
  // Line-art skyline: towers, a spire and a suspension bridge, as on the menu badge.
  return (
    <g fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round">
      <path d="M62 176H338" />
      <path d="M78 176v-38h16v38M94 176v-58h18v58M112 176v-30h12v30" />
      <path d="M124 176v-72h20v72M130 112h8M130 124h8M130 136h8M130 148h8" />
      <path d="M144 176v-46h14v46" />
      <path d="M158 176V96l10-10 10 10v80M162 104h12M162 118h12M162 132h12M162 146h12M162 160h12" />
      <path d="M178 176V78h12V62l6-8V36m0 18 6 8v16h12v98" />
      <path d="M184 92h24M184 108h24M184 124h24M184 140h24M184 156h24" />
      <path d="M214 176v-64h18v64M219 122h8M219 136h8M219 150h8" />
      <path d="M232 176v-40h12v40" />
      <path d="M248 176v-52M248 124h6v52M262 176v-52M256 124h6" />
      <path d="M244 124c16 12 30 24 50 30M262 124c20 14 40 26 70 34M248 132l84 26" />
      <path d="M294 176v-34M320 176v-22" />
    </g>
  );
}

export function Badge({ className = '', title = 'Downtown Burger' }: { className?: string; title?: string }) {
  if (OFFICIAL_LOGO) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={OFFICIAL_LOGO} alt={title} className={className} />;
  }
  const r = 150;
  const a = (25 * Math.PI) / 180;
  const x0 = 200 - r * Math.cos(a);
  const x1 = 200 + r * Math.cos(a);
  const y = 200 + r * Math.sin(a);
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={title} className={className}>
      <defs>
        <path id="badge-arc" d={`M${x0} ${y} A${r} ${r} 0 0 0 ${x1} ${y}`} />
      </defs>
      <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="200" cy="200" r="176" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <Skyline />
      <g style={{ fontFamily: 'var(--font-big-shoulders)', fontVariationSettings: '"opsz" 72' }} fill="currentColor">
        <text x="200" y="256" textAnchor="middle" fontSize="96" fontWeight="900" textLength="372" lengthAdjust="spacingAndGlyphs">
          DOWNTOWN
        </text>
        <text x="200" y="314" textAnchor="middle" fontSize="54" fontWeight="800" letterSpacing="6">
          BURGER
        </text>
      </g>
      <text fill="currentColor" fontSize="19" fontWeight="700" letterSpacing="3" style={{ fontFamily: 'var(--font-barlow-condensed)' }}>
        <textPath href="#badge-arc" startOffset="50%" textAnchor="middle">
          BURGERS • STEAKS • FRIES • SHAKES
        </textPath>
      </text>
    </svg>
  );
}

/** Compact horizontal lockup for the header. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Badge className="h-10 w-10 shrink-0 md:h-11 md:w-11" title="" />
      <span className="flex flex-col leading-none" aria-hidden="true">
        <span className="display text-[1.35rem] tracking-[0.01em] md:text-[1.55rem]">Downtown</span>
        <span className="cond text-[0.7rem] font-bold tracking-[0.42em] uppercase opacity-90">Burger</span>
      </span>
    </span>
  );
}
