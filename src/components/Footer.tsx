import { CinNovaLogo } from './CinNovaLogo.tsx';

interface FooterProps {
  onOpenBookings: () => void;
  onOpenMentorGuide: () => void;
  onSelectCategory: (category: string) => void;
}

export function Footer({ onOpenBookings, onOpenMentorGuide, onSelectCategory }: FooterProps) {
  return (
    <footer className="mt-12 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--border-subtle)]">
          <div className="space-y-2">
            <CinNovaLogo />
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md">
              Online movie ticket booking system with live seat selection dashboard, integrated multi-gateway checkout, and TMDB movie discovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('now_playing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#E11D48] transition-colors cursor-pointer"
            >
              Now Showing
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('upcoming');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#E11D48] transition-colors cursor-pointer"
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={onOpenBookings}
              className="hover:text-[#E11D48] transition-colors cursor-pointer"
            >
              My Bookings
            </button>
            <button
              type="button"
              onClick={onOpenMentorGuide}
              className="hover:text-[#E11D48] transition-colors cursor-pointer"
            >
              Mentor & API Guide
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="font-medium text-slate-700 dark:text-zinc-300">
            Created by <span className="font-bold text-[#E11D48]">Neon</span>
          </p>
          <p className="text-slate-500 dark:text-zinc-500">
            Copyright © {new Date().getFullYear()} CinNova. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
