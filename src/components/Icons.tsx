/**
 * Pieni sarja inline-SVG-ikoneja. Pidetään yksinkertaisina ja teemaan sopivina.
 * Käytetään painikkeissa ja listanäkymissä lisäämään visuaalista hierarkiaa.
 */

interface IconProps {
  size?: number;
  className?: string;
}

export function IconPdf({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M 7 2 L 14 2 L 19 7 L 19 21 C 19 21.55 18.55 22 18 22 L 7 22 C 6.45 22 6 21.55 6 21 L 6 3 C 6 2.45 6.45 2 7 2 Z"
            fill="#dc2626" fillOpacity="0.15" stroke="#dc2626" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M 14 2 L 14 7 L 19 7" fill="none" stroke="#dc2626" strokeWidth="1.4" strokeLinejoin="round"/>
      <text x="12" y="17" textAnchor="middle" fontSize="5.8" fontWeight="700" fill="#dc2626">PDF</text>
    </svg>
  );
}

export function IconMarkdown({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="#4f46e5" fillOpacity="0.1" stroke="#4f46e5" strokeWidth="1.4"/>
      <path d="M 5 16 L 5 8 L 8 12 L 11 8 L 11 16" fill="none" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M 15 8 L 15 16 M 15 16 L 18 13 M 15 16 L 12.5 13.5" fill="none" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

export function IconExternal({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M 14 5 L 19 5 L 19 10 M 19 5 L 11 13 M 5 7 L 5 19 L 17 19 L 17 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconClose({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M 6 6 L 18 18 M 18 6 L 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function IconSearch({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M 16 16 L 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
