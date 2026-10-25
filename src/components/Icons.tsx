interface IconProps {
  size?: number;
  className?: string;
}

export function IconBack({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5 L8 12 L15 19" />
      <path d="M9 12 H20" />
    </svg>
  );
}

export function IconSound({ size = 22, className, muted = false }: IconProps & { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" opacity="0.15" />
      {muted ? (
        <>
          <path d="M17 9 L22 15" />
          <path d="M22 9 L17 15" />
        </>
      ) : (
        <>
          <path d="M16.5 8.5 C18.5 10.5 18.5 13.5 16.5 15.5" />
          <path d="M19 6 C22.5 9.5 22.5 14.5 19 18" />
        </>
      )}
    </svg>
  );
}

export function IconExpand({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4 H4 V9" />
      <path d="M15 4 H20 V9" />
      <path d="M20 15 V20 H15" />
      <path d="M4 15 V20 H9" />
    </svg>
  );
}

export function IconCollapse({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9 H9 V4" />
      <path d="M20 9 H15 V4" />
      <path d="M15 20 V15 H20" />
      <path d="M9 20 V15 H4" />
    </svg>
  );
}

export function IconBulb({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18 H15" />
      <path d="M10 21 H14" />
      <path d="M8.2 14.5 C6.8 13.3 6 11.6 6 9.8 C6 6.5 8.7 4 12 4 C15.3 4 18 6.5 18 9.8 C18 11.6 17.2 13.3 15.8 14.5 C15.3 15 15 15.6 15 16.3 V17 H9 V16.3 C9 15.6 8.7 15 8.2 14.5 Z" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

export function IconSpeaker({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" opacity="0.15" />
      <path d="M16.5 8.5 C18.5 10.5 18.5 13.5 16.5 15.5" />
      <path d="M19 6 C22.5 9.5 22.5 14.5 19 18" />
    </svg>
  );
}

export function IconLock({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor" opacity="0.12" />
      <path d="M8 10 V7 C8 4.8 9.8 3 12 3 C14.2 3 16 4.8 16 7 V10" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconCheck({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 L10 17.5 L19.5 6.5" />
    </svg>
  );
}

export function IconStar({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.8 L14.8 8.6 L21.2 9.5 L16.6 14 L17.7 20.4 L12 17.4 L6.3 20.4 L7.4 14 L2.8 9.5 L9.2 8.6 Z" />
    </svg>
  );
}

export function IconMap({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6 L9 4 L15 6 L20 4 V18 L15 20 L9 18 L4 20 Z" fill="currentColor" opacity="0.12" />
      <path d="M9 4 V18" />
      <path d="M15 6 V20" />
      <path d="M6.5 13 C8.2 10.8 9.8 11.2 11 13 C12.2 14.8 13.8 15.2 15.5 12.5" strokeWidth="1.6" strokeDasharray="1.4 1.8" />
      <circle cx="16.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconHelp({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" />
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.2 C9.4 7.4 10.6 6.2 12.3 6.2 C14.1 6.2 15.2 7.3 15.2 8.9 C15.2 10.2 14.5 10.9 13.3 11.6 C12.5 12.1 12.2 12.7 12.2 13.7" />
      <circle cx="12.2" cy="17.1" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGear({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.31 7.31 0 0 0-1.62-.94l-.38-2.65A.5.5 0 0 0 13.77 2h-3.54a.5.5 0 0 0-.49.42L9.36 5.07a7.31 7.31 0 0 0-1.62.94l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64L4.86 11.06a7.07 7.07 0 0 0 0 1.88L2.75 14.59a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1a7.31 7.31 0 0 0 1.62.94l.38 2.65a.5.5 0 0 0 .49.42h3.54a.5.5 0 0 0 .49-.42l.38-2.65a7.31 7.31 0 0 0 1.62-.94l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z"
      />
    </svg>
  );
}

export function IconSparkle({ size = 22, className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2 L13.8 8.2 L20 10 L13.8 11.8 L12 18 L10.2 11.8 L4 10 L10.2 8.2 Z" />
      <path d="M19 16 L19.8 18.2 L22 19 L19.8 19.8 L19 22 L18.2 19.8 L16 19 L18.2 18.2 Z" opacity="0.7" />
    </svg>
  );
}
