import { BookOpen, Ticket } from 'lucide-react';

interface CategoryNavProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  bookingsCount: number;
  onOpenBookings: () => void;
  onOpenMentorGuide: () => void;
}

const PRIMARY_CATEGORIES = [
  { id: 'all', label: 'All Movies' },
  { id: 'now_playing', label: 'Now Showing' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'upcoming', label: 'Upcoming' },
];

export function CategoryNav({
  activeCategory,
  onSelectCategory,
  bookingsCount,
  onOpenBookings,
  onOpenMentorGuide,
}: CategoryNavProps) {
  return (
    <nav
      aria-label="Movie Categories"
      className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
        {/* Clean Movie Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {PRIMARY_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#E11D48] text-white font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-zinc-100 hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right Quick Actions (Accessible on mobile & desktop) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenBookings}
            className="px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Ticket size={14} className="text-[#E11D48]" />
            <span className="hidden sm:inline">My Bookings</span>
            <span className="sm:hidden">Tickets</span>
            {bookingsCount > 0 && (
              <span className="font-mono-tabular px-1.5 py-0.5 text-[11px] rounded bg-[#E11D48] text-white font-bold">
                {bookingsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenMentorGuide}
            className="hidden sm:flex px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border-subtle)] text-slate-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-500 transition-colors items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <BookOpen size={13} />
            <span>Mentor & API Guide</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
