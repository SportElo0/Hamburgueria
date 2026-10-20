import type { AmenityIcon } from "@/lib/site";

const common = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PATHS: Record<AmenityIcon, React.ReactNode> = {
  pool: (
    <>
      <path d="M2 16c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
      <path d="M2 20c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
      <path d="M8 11l3-7 3 7" />
    </>
  ),
  garden: (
    <>
      <path d="M12 21V10" />
      <path d="M12 10C12 6 9 4 5 4c0 4 2 7 7 7Z" />
      <path d="M12 13C12 9.5 14.5 7.5 18 7c0 3.5-1.5 6.5-6 6Z" />
    </>
  ),
  breakfast: (
    <>
      <path d="M5 9h11v5a5.5 5.5 0 0 1-11 0Z" />
      <path d="M16 10.5h1.5a2 2 0 0 1 0 4H16" />
      <path d="M8 3c0 1.2-1 1.3-1 2.5S8 6.8 8 8" />
      <path d="M11.5 3c0 1.2-1 1.3-1 2.5s1 1.3 1 2.5" />
      <path d="M3 21h15" />
    </>
  ),
  wifi: (
    <>
      <path d="M3 8.5a15 15 0 0 1 18 0" />
      <path d="M6.3 12a10.5 10.5 0 0 1 11.4 0" />
      <path d="M9.6 15.5a6 6 0 0 1 4.8 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M9.5 17V7h3.2a3 3 0 0 1 0 6H9.5" />
    </>
  ),
  pet: (
    <>
      <ellipse cx="12" cy="16.5" rx="4.2" ry="3.3" />
      <ellipse cx="5.8" cy="11" rx="1.6" ry="2" />
      <ellipse cx="18.2" cy="11" rx="1.6" ry="2" />
      <ellipse cx="9" cy="6.5" rx="1.7" ry="2.1" />
      <ellipse cx="15" cy="6.5" rx="1.7" ry="2.1" />
    </>
  ),
  ac: (
    <>
      <path d="M12 2v20" />
      <path d="M4.5 6l15 12" />
      <path d="M19.5 6l-15 12" />
      <path d="M12 2l-2 2M12 2l2 2M12 22l-2-2M12 22l2-2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </>
  ),
};

export function AmenityIconGlyph({ icon }: { icon: AmenityIcon }) {
  return <svg {...common}>{PATHS[icon]}</svg>;
}
