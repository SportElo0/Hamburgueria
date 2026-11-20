// El Patron Burger logo, lifted from the restaurant's WhatsApp profile (tools/photos). Swap for the
// official vector by dropping an SVG at /public/brand/logo.svg and pointing OFFICIAL_LOGO at it.
import photos from '@/content/photos.json';

export const OFFICIAL_LOGO: string | null = null;

export function Star({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1.8l2.9 6.6 7.2.6-5.5 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L1.9 9l7.2-.6L12 1.8Z" />
    </svg>
  );
}

export function Chilli({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M15.6 3.2c.4-.9 1.3-1.5 2.3-1.4l-.2 1.5c-.4 0-.7.2-.8.6l-.2.6c1.6.7 2.6 2.3 2.4 4.1-.4 4.6-4.4 10.3-12.1 12.8-1.6.5-3.2.5-4.6.1l.2-1.2c6.2-1.2 9.6-5.5 10.4-9.9.2-1.4 1-2.6 2.2-3.3l.3-.2.3-.6Z" />
    </svg>
  );
}

/** The full lockup: "el patron burger · EL BURGER DEL MAL". */
export function Logo({ className = '', alt = 'El Patron Burger' }: { className?: string; alt?: string }) {
  const src = OFFICIAL_LOGO ?? photos.logo.src;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={photos.logo.w} height={photos.logo.h} className={className} />;
}

/** Compact lockup for the header. */
export function Wordmark({ className = '' }: { className?: string }) {
  return <Logo alt="" className={`h-10 w-auto md:h-12 ${className}`} />;
}
