import { MapPin, Moon, Search, Sun, User, X } from 'lucide-react';
import { CITIES } from '../data/tmdbCatalog.ts';
import type { UserSession } from '../types/cinema.ts';
import { CinNovaLogo } from './CinNovaLogo.tsx';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  user: UserSession | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const FEATURED_CITY_IDS = new Set([
  'mumbai',
  'new-delhi',
  'bengaluru',
  'hyderabad',
  'chennai',
  'kolkata',
  'indore',
  'gwalior',
]);

export function Header({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
  user,
  onOpenAuth,
  onSignOut,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const featuredCities = CITIES.filter((c) => FEATURED_CITY_IDS.has(c.id));
  const stateCapitalCities = CITIES.filter((c) => !FEATURED_CITY_IDS.has(c.id)).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: CinNova Logo & Search Bar */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <a
            href="#top"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] rounded-lg"
          >
            <CinNovaLogo />
          </a>

          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for Movies, Directors, Actors..."
              aria-label="Search movies"
              className="w-full h-10 pl-10 pr-9 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right: City Selector, Sign In, Light/Dark Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* City Selector (All Indian State Capitals + Gwalior + Indore) */}
          <div className="relative flex items-center">
            <MapPin
              size={15}
              className="absolute left-2.5 pointer-events-none text-[#E11D48]"
            />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              aria-label="Select city"
              className="h-9 pl-8 pr-7 rounded-lg text-xs sm:text-sm font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-[#E11D48] cursor-pointer appearance-none whitespace-nowrap max-w-[165px] truncate"
            >
              <optgroup label="Popular & MP Cities">
                {featuredCities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Indian State Capitals">
                {stateCapitalCities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name} ({city.region})
                  </option>
                ))}
              </optgroup>
            </select>
            <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-500 dark:text-zinc-400">
              ▾
            </span>
          </div>

          {/* Sign In / User Account */}
          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              title="Click to sign out"
              className="h-9 px-3 rounded-lg text-xs sm:text-sm font-medium border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-slate-800 dark:text-zinc-200 hover:border-[#E11D48] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User size={14} className="text-[#E11D48]" />
              <span className="max-w-[110px] truncate">{user.name}</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-0.5">· Sign out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-9 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-[#E11D48] text-white hover:bg-[#be123c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-slate-700 dark:text-zinc-200 hover:border-[#E11D48] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="px-4 pb-3 sm:hidden">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search movies..."
            aria-label="Search movies on mobile"
            className="w-full h-9 pl-9 pr-8 rounded-lg text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 focus:outline-none focus:border-[#E11D48]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-zinc-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
