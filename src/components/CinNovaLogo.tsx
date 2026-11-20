import { useState } from 'react';

interface CinNovaLogoProps {
  /**
   * Drop your custom logo file into /public/cinnova-logo.png (or pass a URL)
   * to replace the default ticket-aperture emblem.
   */
  customLogoSrc?: string;
}

const CUSTOM_LOGO_PATH = '/cinnova-logo.png';

export function CinNovaLogo({ customLogoSrc = CUSTOM_LOGO_PATH }: CinNovaLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      {!imgFailed && customLogoSrc ? (
        <img
          src={customLogoSrc}
          alt="CinNova Logo"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-9 w-9 rounded-lg object-contain border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-9 w-9 rounded-lg flex items-center justify-center bg-[#E11D48] text-white shadow-sm shrink-0"
          title="CinNova Logo Slot (Place /public/cinnova-logo.png to override)"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path
              d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V10a2 2 0 1 0 0 4v2.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5V14a2 2 0 1 0 0-4V7.5Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <path d="M10.5 9.5L15 12L10.5 14.5V9.5Z" fill="currentColor" />
          </svg>
        </div>
      )}

      <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight whitespace-nowrap text-slate-900 dark:text-zinc-100">
        Cin<span className="text-[#E11D48]">Nova</span>
      </span>
    </div>
  );
}
