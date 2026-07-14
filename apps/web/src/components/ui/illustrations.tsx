/**
 * Hand-drawn brand illustrations for empty states, built from the same
 * palette as the design tokens (primary indigo + brand-accent terracotta)
 * instead of a single generic lucide icon. Each is a self-contained SVG so
 * there's no extra asset request or CDN dependency.
 */
function Base({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-28 w-28 mx-auto">
      {children}
    </svg>
  );
}

export function EmptyListingsIllustration() {
  return (
    <Base>
      <circle cx="60" cy="60" r="52" className="fill-accent" />
      <rect x="30" y="46" width="60" height="42" rx="6" className="fill-white stroke-primary/30" strokeWidth="2" />
      <rect x="38" y="56" width="26" height="6" rx="3" className="fill-primary/25" />
      <rect x="38" y="66" width="40" height="5" rx="2.5" className="fill-primary/15" />
      <rect x="38" y="75" width="30" height="5" rx="2.5" className="fill-primary/15" />
      <circle cx="82" cy="38" r="13" className="fill-brand-accent" />
      <path d="M76 38h12M82 32v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </Base>
  );
}

export function EmptyFavoritesIllustration() {
  return (
    <Base>
      <circle cx="60" cy="60" r="52" className="fill-accent" />
      <path
        d="M60 82C45 71 34 62 34 49.5 34 40.4 41.2 34 49.5 34c5 0 9.6 2.4 12.5 6.3C64.9 36.4 69.5 34 74.5 34 82.8 34 90 40.4 90 49.5 90 62 79 71 60 82Z"
        className="fill-white stroke-primary/40"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <path
        d="M60 74c-11-8.3-19-15.4-19-24.4C41 43.6 45.9 39 51.9 39c3.7 0 7.1 1.8 9.2 4.6a11 11 0 0 1 9.2-4.6c6 0 10.9 4.6 10.9 10.6 0 9-8 16.1-19 24.4Z"
        className="fill-brand-accent"
      />
    </Base>
  );
}

export function EmptyBellIllustration() {
  return (
    <Base>
      <circle cx="60" cy="60" r="52" className="fill-accent" />
      <path
        d="M60 34c-7.7 0-14 6.3-14 14v10.6c0 3-1.2 5.8-3.3 7.9L40 69h40l-2.7-2.5a11.2 11.2 0 0 1-3.3-7.9V48c0-7.7-6.3-14-14-14Z"
        className="fill-white stroke-primary/40"
        strokeWidth="2"
      />
      <path d="M53 74a7 7 0 0 0 14 0" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
      <circle cx="76" cy="40" r="9" className="fill-brand-accent" />
      <circle cx="76" cy="40" r="3" className="fill-white" />
    </Base>
  );
}

export function EmptySearchIllustration() {
  return (
    <Base>
      <circle cx="60" cy="60" r="52" className="fill-accent" />
      <circle cx="54" cy="54" r="20" className="fill-white stroke-primary/40" strokeWidth="3" />
      <path d="M68 68 82 82" className="stroke-primary/40" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 54h12" className="stroke-brand-accent" strokeWidth="3" strokeLinecap="round" />
    </Base>
  );
}

export function EmptyReviewsIllustration() {
  return (
    <Base>
      <circle cx="60" cy="60" r="52" className="fill-accent" />
      <path
        d="m60 36 6.5 13.2 14.6 2.1-10.6 10.3 2.5 14.5L60 69.3l-13 6.8 2.5-14.5-10.6-10.3 14.6-2.1Z"
        className="fill-white stroke-brand-accent"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="58" r="6" className="fill-brand-accent" />
    </Base>
  );
}

export function GenericEmptyIllustration() {
  return (
    <Base>
      <circle cx="60" cy="60" r="52" className="fill-accent" />
      <rect x="36" y="50" width="48" height="34" rx="6" className="fill-white stroke-primary/30" strokeWidth="2" />
      <path d="M36 58h48" className="stroke-primary/20" strokeWidth="2" />
      <circle cx="44" cy="54" r="1.6" className="fill-primary/40" />
      <circle cx="49" cy="54" r="1.6" className="fill-primary/40" />
    </Base>
  );
}
